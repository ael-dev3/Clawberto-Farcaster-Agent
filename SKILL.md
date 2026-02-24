---
name: clawberto-farcaster-agent
description: Fork of the Farcaster Agent with channel/posting fixes and @Clawberto-compatible defaults.
icon: 🟣
metadata: {"openclaw":{"emoji":"🟣","requires":{"bins":["node","npm"],"env":[]},"install":[{"id":"npm","kind":"shell","command":"cd {baseDir}/repo && npm install","label":"Install dependencies"}]}}
---

# Clawberto Farcaster Agent Skill

A maintained OpenClaw-friendly Farcaster agent with practical fixes for:

- ✅ Replies (2nd CLI arg parent hash)
- ✅ `CHANNEL_URL` support for posting inside Farcaster channels
- ✅ Preserving all normal account/fid/signer/casting behavior from `farcaster-agent`

## Why this skill exists

The upstream `farcaster-agent` tooling supports channel posting in code, but a few CLI paths ignored or hid it.

This variant keeps that behavior explicit and documented so posting to channels works from:

- `node src/post-cast.js "text"` (with optional `CHANNEL_URL`)
- OpenClaw command/task flows (via this repo’s `repo/skill/SKILL.md` docs)

## Quick install

```bash
cd {baseDir}/repo
npm install
```

## Run a channel post

```bash
cd {baseDir}/repo
PRIVATE_KEY=0x... SIGNER_PRIVATE_KEY=... FID=2771439 CHANNEL_URL="https://farcaster.xyz/~/channel/openclaw" node src/post-cast.js "hello from a channel"
```

## Usage notes

- Use `node src/post-cast.js "text" [parent_hash]` for replies.
- For reply-by-hash, `NEYNAR_API_KEY` is required to resolve parent author FID.
- For channel posts, set `CHANNEL_URL` and omit a parent hash.


## Upstream + credit notes

If you want the full attributions and history of Farcaster-focused changes from these repos, see [CREDITS.md](./CREDITS.md).

Key credited contributors: `rish` (`@rishavmukherji`), `mark` (`@clawlinker`), `@artlu99`, and @Ael/Clawberto.
