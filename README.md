# Clawberto-Farcaster-Agent

Custom OpenClaw-facing fork of `farcaster-agent` with channel-post support wired into the CLI.

This repo includes:

- `repo/` – runnable Farcaster agent scripts (`post-cast`, `auto-setup`, etc.)
- `repo/src/post-cast.js` – fixed CLI behavior and explicit channel support
- `repo/skill/SKILL.md` – skill documentation for OpenClaw

## What changed in this fork

- ✅ `post-cast.js` now supports `CHANNEL_URL` for channel posts.
- ✅ Replies still supported via 2nd CLI arg (`parent_hash`) and parent FID lookup via Neynar.

## Install

```bash
cd /Users/marko/.openclaw/workspace/Clawberto-Farcaster-Agent/repo
npm install
```

## Example: reply and channel

```bash
# reply
PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=123 NEYNAR_API_KEY=... node src/post-cast.js "reply text" 0xparentcasthash

# channel post
PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=123 CHANNEL_URL="https://farcaster.xyz/~/channel/openclaw" node src/post-cast.js "hello channel"
```
