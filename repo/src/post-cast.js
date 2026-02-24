const { Wallet, JsonRpcProvider } = require('ethers');
const {
  makeCastAdd,
  NobleEd25519Signer,
  FarcasterNetwork,
  Message
} = require('@farcaster/hub-nodejs');
const { RPC } = require('./config');
const { submitMessage, getCast } = require('./x402');

const CAST_HASH_BYTES = 20;

function parseHexBytes(input, { name = 'value', expectedBytes } = {}) {
  if (typeof input !== 'string') {
    throw new Error(`Invalid ${name}: expected string`);
  }

  let hex = input.trim();
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2);
  }

  if (hex.length === 0) {
    throw new Error(`Invalid ${name}: empty string`);
  }

  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(
      `Invalid ${name}: expected even-length hex string (optionally 0x-prefixed)`
    );
  }

  const bytes = Buffer.from(hex, 'hex');

  if (expectedBytes != null && bytes.length !== expectedBytes) {
    throw new Error(
      `Invalid ${name}: got ${bytes.length} bytes, expected ${expectedBytes}`
    );
  }

  return bytes;
}

/**
 * Post a cast to Farcaster
 *
 * Prerequisites:
 * - FID registered and synced to Neynar hub
 * - Signer key added and synced to Neynar hub
 * - USDC on Base for x402 payments (0.001 USDC per API call)
 *
 * @param {Object} options
 * @param {string} options.privateKey - Custody wallet private key (for x402 payment signing)
 * @param {string} options.signerPrivateKey - Ed25519 signer private key (hex, no 0x)
 * @param {number} options.fid - Farcaster ID
 * @param {string} options.text - Cast text content
 * @param {Object} [options.parent] - Parent cast for replies { fid: number, hash: string }
 * @param {Array} [options.mentions] - Mentions as [{ fid: number, position: number }] where position is byte offset of the mention placeholder in text
 * @param {string} [options.channelUrl] - Optional channel URL for posting in a Farcaster channel (e.g. https://farcaster.xyz/~/channel/openclaw)
 * @returns {Promise<{hash: string, verified: boolean}>}
 */
async function postCast({ privateKey, signerPrivateKey, fid, text, parent, mentions, channelUrl }) {
  // Create wallet for x402 payments (Base)
  const baseProvider = new JsonRpcProvider(RPC.BASE);
  const wallet = new Wallet(privateKey, baseProvider);

  console.log('Posting as FID:', fid);
  console.log('Text:', text);

  // Create signer
  const signerBytes = Buffer.from(signerPrivateKey, 'hex');
  const signer = new NobleEd25519Signer(signerBytes);

  // Build cast body
  const castBody = {
    text,
    embeds: [],
    embedsDeprecated: [],
    mentions: mentions ? mentions.map(m => m.fid) : [],
    mentionsPositions: mentions ? mentions.map(m => m.position) : []
  };

  // Add channel parent URL (for channel posts)
  if (channelUrl) {
    castBody.parentUrl = channelUrl;
    console.log('Posting in channel:', channelUrl);
  }

  // Add parent for replies
  if (parent) {
    const parentFid = Number(parent.fid);
    if (!Number.isInteger(parentFid) || parentFid <= 0) {
      throw new Error('Invalid parent.fid: expected a positive integer');
    }

    castBody.parentCastId = {
      fid: parentFid,
      hash: parseHexBytes(parent.hash, {
        name: 'parent.hash',
        expectedBytes: CAST_HASH_BYTES
      })
    };
    console.log('Replying to FID:', parent.fid, 'hash:', parent.hash);
  }

  // Create cast message
  const castResult = await makeCastAdd(
    castBody,
    {
      fid,
      network: FarcasterNetwork.MAINNET
    },
    signer
  );

  if (castResult.isErr()) {
    throw new Error(`Failed to create cast: ${castResult.error}`);
  }

  const cast = castResult.value;
  const hash = '0x' + Buffer.from(cast.hash).toString('hex');
  const messageBytes = Buffer.from(Message.encode(cast).finish());

  console.log('\nCast hash:', hash);
  console.log('Message size:', messageBytes.length, 'bytes');

  // Submit to Neynar hub
  console.log('Submitting to Neynar hub...');
  
  let submitResult;
  if (process.env.NEYNAR_API_KEY) {
    console.log('Using NEYNAR_API_KEY for auth...');
    const response = await fetch('https://hub-api.neynar.com/v1/submitMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'api_key': process.env.NEYNAR_API_KEY
      },
      body: messageBytes
    });
    
    const data = await response.json();
    submitResult = { status: response.status, data };
  } else {
    // Fallback to x402
    submitResult = await submitMessage(wallet, messageBytes);
  }

  if (submitResult.status !== 200) {
    throw new Error(`Submit failed: ${JSON.stringify(submitResult.data)}`);
  }

  console.log('Submitted successfully');

  // Wait a moment for propagation
  await new Promise(r => setTimeout(r, 2000));

  // Verify the cast is live
  console.log('Verifying cast...');
  const verifyResult = await getCast(wallet, hash);

  const verified = verifyResult.status === 200;

  if (verified) {
    console.log('\nCast verified on network!');
  } else {
    console.log('\nCast submitted but not yet verified. It may take a moment to propagate.');
  }

  return { hash, verified };
}

// CLI usage
if (require.main === module) {
  const privateKey = process.env.PRIVATE_KEY;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const fid = parseInt(process.env.FID);
  const neynarApiKey = process.env.NEYNAR_API_KEY;
  const channelUrl = process.env.CHANNEL_URL;
  const text = process.argv[2] || 'gm from farcaster-agent!';
  const parentHash = process.argv[3]; // optional: parent cast hash for replies

  if (!privateKey || !signerPrivateKey || !fid) {
    console.log('Usage: PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=123 node post-cast.js "Your cast text" [parentHash]');
    console.log('\nEnvironment variables:');
    console.log('  PRIVATE_KEY        - Custody wallet private key (with 0x prefix)');
    console.log('  SIGNER_PRIVATE_KEY - Ed25519 signer private key (hex, no 0x prefix)');
    console.log('  FID                - Your Farcaster ID number');
    console.log('  NEYNAR_API_KEY     - Neynar API key (required for replies to look up parent FID)');
    console.log('  CHANNEL_URL        - Channel URL for channel posts (e.g. https://farcaster.xyz/~/channel/brypto)');
    process.exit(1);
  }

  (async () => {
    const opts = { privateKey, signerPrivateKey, fid, text };

    // If parentHash provided, look up parent cast to get its author FID
    if (parentHash) {
      if (!neynarApiKey) {
        console.error('Error: NEYNAR_API_KEY is required for replies (need to look up parent FID)');
        process.exit(1);
      }
      console.log('Looking up parent cast:', parentHash);
      const resp = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${parentHash}&type=hash`, {
        headers: { 'api_key': neynarApiKey }
      });
      if (!resp.ok) {
        console.error('Error looking up parent cast:', resp.status, await resp.text());
        process.exit(1);
      }
      const data = await resp.json();
      const parentFid = data.cast.author.fid;
      console.log('Parent author FID:', parentFid);
      opts.parent = { fid: parentFid, hash: parentHash };
    }

    // If CHANNEL_URL provided and no parent, set as channel post
    if (channelUrl && !parentHash) {
      opts.channelUrl = channelUrl;
    }

    const { hash, verified } = await postCast(opts);
    console.log('\n=== Cast Posted ===');
    console.log('Hash:', hash);
    console.log('Verified:', verified);
    console.log('URL: https://farcaster.xyz/~/conversations/' + hash);
  })().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { postCast };
