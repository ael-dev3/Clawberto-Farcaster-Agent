const ethers = require('ethers');
const { makeLinkAdd, NobleEd25519Signer, FarcasterNetwork, Message } = require('@farcaster/hub-nodejs');
const { RPC } = require('./src/config');
const { submitMessage } = require('./src/x402');

const privateKey = process.env.PRIVATE_KEY;
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
const fid = parseInt(process.env.FID);
const targetFid = parseInt(process.argv[2]);

if (!privateKey || !signerPrivateKey || !fid || !targetFid) {
  console.log('Usage: PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=123 node follow.js <targetFid>');
  process.exit(1);
}

async function follow() {
  const baseProvider = new ethers.JsonRpcProvider(RPC.BASE);
  const wallet = new ethers.Wallet(privateKey, baseProvider);
  const signer = new NobleEd25519Signer(Buffer.from(signerPrivateKey, 'hex'));

  console.log('Following FID:', targetFid);

  const result = await makeLinkAdd(
    { type: 'follow', targetFid: BigInt(targetFid) },
    { fid, network: FarcasterNetwork.MAINNET },
    signer
  );

  if (result.isErr()) {
    throw new Error('Follow failed: ' + result.error);
  }

  const messageBytes = Buffer.from(Message.encode(result.value).finish());
  const hash = '0x' + Buffer.from(result.value.hash).toString('hex');

  console.log('Submitting follow...');
  const submitResult = await submitMessage(wallet, messageBytes);

  if (submitResult.status !== 200) {
    throw new Error('Submit failed: ' + JSON.stringify(submitResult.data));
  }

  console.log('Followed successfully!');
  console.log('Hash:', hash);
}

follow().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
