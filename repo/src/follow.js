const { Wallet, JsonRpcProvider } = require('ethers');
const {
  makeLinkAdd,
  NobleEd25519Signer,
  FarcasterNetwork,
  Message
} = require('@farcaster/hub-nodejs');
const { RPC } = require('./config');
const { submitMessage } = require('./x402');
const fs = require('fs');

async function followUser(targetFid) {
  const creds = JSON.parse(fs.readFileSync('/Users/marko/.openclaw/farcaster-credentials.json', 'utf8'));
  
  // Create wallet for x402 payments (Base)
  const baseProvider = new JsonRpcProvider(RPC.BASE);
  const wallet = new Wallet(creds.custodyPrivateKey, baseProvider);

  console.log('Following FID:', targetFid);
  console.log('My FID:', creds.fid);

  // Create signer - note: hex without 0x prefix
  const signerBytes = Buffer.from(creds.signerPrivateKey, 'hex');
  const signer = new NobleEd25519Signer(signerBytes);

  // Build link body for follow (type is string 'follow', targetFid is number)
  const linkBody = {
    targetFid: targetFid,
    type: 'follow'
  };

  console.log('Link body:', JSON.stringify(linkBody));

  // Create link add message
  const linkResult = await makeLinkAdd(
    linkBody,
    {
      fid: creds.fid,
      network: 1  // MAINNET
    },
    signer
  );

  if (linkResult.isErr()) {
    console.error('Error creating link:', linkResult.error);
    process.exit(1);
  }

  const link = linkResult.value;
  const hash = '0x' + Buffer.from(link.hash).toString('hex');
  const messageBytes = Buffer.from(Message.encode(link).finish());

  console.log('\nLink hash:', hash);
  console.log('Message size:', messageBytes.length, 'bytes');

  // Submit to Neynar hub with x402 payment
  console.log('Submitting to Neynar hub...');
  const submitResult = await submitMessage(wallet, messageBytes);

  console.log('Submit result:', submitResult.status, submitResult.data);

  if (submitResult.status !== 200) {
    console.error('Submit failed:', JSON.stringify(submitResult.data));
    process.exit(1);
  }

  console.log('\nFollow submitted successfully!');
  console.log('URL: https://farcaster.xyz/~/conversations/' + hash);

  return { hash };
}

// Get target FID from command line
const targetFid = process.argv[2];
if (!targetFid) {
  console.log('Usage: node follow.js <target_fid>');
  process.exit(1);
}

followUser(parseInt(targetFid))
  .then(({ hash }) => {
    console.log('\n=== Follow Complete ===');
    console.log('Hash:', hash);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
