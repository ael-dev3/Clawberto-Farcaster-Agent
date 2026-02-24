const { Wallet, JsonRpcProvider } = require('ethers');
const {
  makeCastAdd,
  NobleEd25519Signer,
  FarcasterNetwork,
  Message
} = require('@farcaster/hub-nodejs');
const { RPC } = require('./config');
const { submitMessage, getCast } = require('./x402');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const fid = Number(process.env.FID);
  const text = process.argv[2];
  const embedUrl = process.argv[3];
  const parentHash = process.argv[4];

  const baseProvider = new JsonRpcProvider(RPC.BASE);
  const wallet = new Wallet(privateKey, baseProvider);

  console.log('Posting as FID:', fid);
  console.log('Text:', text);
  if (embedUrl) console.log('Embed:', embedUrl);

  const signerBytes = Buffer.from(signerPrivateKey, 'hex');
  const signer = new NobleEd25519Signer(signerBytes);

  const castBody = {
    text,
    embeds: embedUrl ? [{ url: embedUrl }] : [],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: []
  };

  if (parentHash) {
    const neynarKey = process.env.NEYNAR_API_KEY;
    const res = await fetch(`https://api.neynar.com/v2/farcaster/cast?identifier=${parentHash}&type=hash`, {
      headers: { 'x-api-key': neynarKey }
    });
    const data = await res.json();
    const parentFid = data.cast.author.fid;
    const ph = parentHash.startsWith('0x') ? parentHash.slice(2) : parentHash;
    castBody.parentCastId = {
      fid: parentFid,
      hash: Buffer.from(ph, 'hex')
    };
    console.log('Replying to FID:', parentFid);
  }

  const castResult = await makeCastAdd(
    castBody,
    { fid, network: FarcasterNetwork.MAINNET },
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
  console.log('Submitting to Neynar hub...');

  await submitMessage(wallet, messageBytes);
  console.log('Submitted successfully');

  console.log('Verifying cast...');
  await new Promise(r => setTimeout(r, 3000));

  try {
    await getCast(wallet, hash);
    console.log('\nCast verified on network!');
    console.log('\n=== Cast Posted ===');
    console.log('Hash:', hash);
    console.log('URL:', `https://farcaster.xyz/~/conversations/${hash}`);
  } catch (e) {
    console.log('\nSubmitted (verification pending)');
    console.log('Hash:', hash);
    console.log('URL:', `https://farcaster.xyz/~/conversations/${hash}`);
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
