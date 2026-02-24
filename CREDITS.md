# Farcaster Change Log & Credits

## Why this doc exists

Your new OpenClaw skill `Clawberto-Farcaster-Agent` is built on top of the upstream `farcaster-agent` tooling. This file tracks the noteworthy Farcaster-related changes and credits the people involved across the referenced repos.

## Upstream sources reviewed

- `https://github.com/rishavmukherji/farcaster-agent`
- `https://github.com/rishavmukherji/farcaster-agent/pull/2`
- `https://clawhub.ai/rishavmukherji/farcaster-agent`

---

## 1) Upstream pull request: #2 (open)

**Link:** https://github.com/rishavmukherji/farcaster-agent/pull/2  
**Author:** @clawlinker  
**State:** Open (as of 2026-02-24/25)

### Good changes from PR #2

- **Reply support fixed:** `postCast` now wires `parentCastId` properly so replies are threaded instead of always posting as root.
- **Mentions support fixed:** `mentions` and `mentionsPositions` are now passed through to Farcaster cast body, using `{ fid, position }` entries.
- **Robust hash handling:** Supports both raw hex and `0x` hash inputs.
- **Deletion path added:** New `delete-cast.js` with `makeCastRemove` support and export from SDK entrypoint.
- **Docs + constraints:** Added docs for replies/mentions and callout that cast text is limited to 320 bytes.

### Files of note in this PR

- `src/post-cast.js`
- `src/delete-cast.js`
- `src/index.js`
- `repo/skill/SKILL.md`

---

## 2) `rishavmukherji/farcaster-agent` good changes

These are notable community-facing improvements from the upstream repository history.

### Notable changes (high signal)

- Follow/unfollow capabilities in the agent flow
- Proper `@mention` parsing and FID lookup
- Proper reply decisioning (including skip/reply heuristics)
- Multimodal image support in cast-response context
- Autonomous posting surfaces (cron/webhook flows)
- Credential handling ergonomics and storage guidance
- Channel/profile/deployment docs and operational notes

### Main contributors observed

- **rish** (**alias intent:** `@rishavmukherji`) — principal upstream author/maintainer and most follow-up improvements.
- **mark** (**alias intent:** resolved in GitHub metadata as `@clawlinker`; PR #2 author is that account) — implemented PR #2 thread/reply + mentions work.
- **@artlu99** — proposed alternative credential storage approach for users avoiding persistent storage.
- **Claude Opus 4.5** — listed as co-author on multiple upstream implementation and docs commits.

### Additional review/community contributors on PR #2

- **copilot-pull-request-reviewer[bot]** — posted PR overview review comment.
- **Copilot** — left 2 issue-level inline review comments (on `src/post-cast.js` and `src/delete-cast.js`) recommending hex validation and explicit error handling for `parent.hash` / `targetHash`.
- **markcarey** — posted issue comments in the PR thread indicating reproduction impact and production testing (`"My Lobster is running into this issue..."`, `"Testing in production..."`).

---

## 3) Clawhub mirror

`https://clawhub.ai/rishavmukherji/farcaster-agent` currently renders as the Farcaster-Agent catalog entry (single SPA page). In this snapshot it does not expose extra commit-level artifacts separate from the upstream GitHub repo, so credits are attributed via upstream links above.

---

## 4) Contributions in this repo

### What Clawberto added

- Explicit channel-post behavior through `CHANNEL_URL` env in `repo/src/post-cast.js`.
- OpenClaw-facing docs updates in `SKILL.md`, `README.md`, and this credit ledger.
- Operational examples for direct channel posting to
  `https://farcaster.xyz/~/channel/openclaw`.

### Credit

- **@Ael / Clawberto** — integration work, repository packaging, OpenClaw docs, and channel-post UX defaults.

---

## Suggested acknowledgement line

> This skill bundles and respects upstream improvements by the `farcaster-agent` contributors (especially @rishavmukherji / rish and @clawlinker / mark), with additional review/community input from copilot-pull-request-reviewer[bot], Copilot, and @markcarey, plus explicit channel-post integration by @Ael/Clawberto.