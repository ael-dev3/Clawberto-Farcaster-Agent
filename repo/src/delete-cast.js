const { Wallet, JsonRpcProvider } = require('ethers');
const {
  makeCastRemove,
  NobleEd25519Signer,
  FarcasterNetwork,
  Message
} = require('@farcaster/hub-nodejs');
const { RPC } = require('./config');
const { submitMessage } = require('./x402');

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
 * Delete a cast from Farcaster
 *
 * @param {Object} options
 * @param {string} options.privateKey - Custody wallet private key (for x402 payment signing)
 * @param {string} options.signerPrivateKey - Ed25519 signer private key (hex, no 0x)
 * @param {number} options.fid - Farcaster ID
 * @param {string} options.targetHash - Hash of the cast to delete (with or without 0x prefix)
 * @returns {Promise<{hash: string}>}
 */
async function deleteCast({ privateKey, signerPrivateKey, fid, targetHash }) {
  const baseProvider = new JsonRpcProvider(RPC.BASE);
  const wallet = new Wallet(privateKey, baseProvider);

  console.log('Deleting cast:', targetHash, 'as FID:', fid);

  const signerBytes = Buffer.from(signerPrivateKey, 'hex');
  const signer = new NobleEd25519Signer(signerBytes);

  const hashBytes = parseHexBytes(targetHash, {
    name: 'targetHash',
    expectedBytes: CAST_HASH_BYTES
  });

  const removeResult = await makeCastRemove(
    { targetHash: hashBytes },
    { fid, network: FarcasterNetwork.MAINNET },
    signer
  );

  if (removeResult.isErr()) {
    throw new Error(`Failed to create cast remove: ${removeResult.error}`);
  }

  const remove = removeResult.value;
  const hash = '0x' + Buffer.from(remove.hash).toString('hex');
  const messageBytes = Buffer.from(Message.encode(remove).finish());

  console.log('Remove hash:', hash);
  console.log('Message size:', messageBytes.length, 'bytes');

  console.log('Submitting to Neynar hub...');
  const submitResult = await submitMessage(wallet, messageBytes);

  if (submitResult.status !== 200) {
    throw new Error(`Submit failed: ${JSON.stringify(submitResult.data)}`);
  }

  console.log('Cast deleted successfully');
  return { hash };
}

if (require.main === module) {
  const privateKey = process.env.PRIVATE_KEY;
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  const fid = parseInt(process.env.FID);
  const targetHash = process.argv[2];

  if (!privateKey || !signerPrivateKey || !fid || !targetHash) {
    console.log('Usage: PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=123 node delete-cast.js <cast-hash>');
    process.exit(1);
  }

  deleteCast({ privateKey, signerPrivateKey, fid, targetHash })
    .then(({ hash }) => {
      console.log('\n=== Cast Deleted ===');
      console.log('Remove hash:', hash);
    })
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { deleteCast };
