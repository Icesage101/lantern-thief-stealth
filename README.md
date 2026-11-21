# Lantern Thief

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Icesage101/lantern-thief-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Icesage101/lantern-thief-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A complete top-down stealth game that plays offline in a desktop browser from its own files. You are the Lantern Thief, slipping through a sleeping museum in three wings to lift every gem — and the Star Lantern itself — then reach the green exit unseen.

Guards patrol with cones of light. Crates and walls block their sight, so plan a route, wait for a patrol to turn, and move in the dark. Hold **Shift** to sneak: slower, quieter, harder to spot. Get seen and the detection meter climbs — at 40 a guard stops and stares, at 100 it gives chase, and if it reaches you the wing restarts. Break line of sight and the alarm fades; stay hidden and the guard goes back to its patrol.

## Run it

```sh
python3 -m http.server --directory game
# open http://localhost:8000 in desktop Chrome
```

Or open `game/index.html` from any static file server. The game makes no network requests: every script, sound and image is a file under `game/` (all sound is synthesized live with WebAudio).

## Play

- **Move:** WASD or arrow keys — or click a floor tile to walk there
- **Sneak:** hold Shift (slower, quieter, smaller sight range)
- **Goal:** take all the loot in a wing, then reach the green EXIT
- **Score:** 100 per gem, 500 for the Star Lantern, time bonus under par, +300 ghost bonus for clearing a wing never fully spotted
- **Lives:** 3 — caught three times and the night is over
- **M:** mute · **R:** restart the wing · **Enter:** advance screens

Three wings, three guards' worth of patience: **I — The Gallery**, **II — The Vault Wing**, **III — The Star Lantern**.

## Layout

- `game/index.html` — the page; `game/src/` — the game, one job per file:
  `config.js` tuning, `levels.js` the three museum wings, `guards.js` patrol/vision/detection, `render.js` drawing and HUD, `audio.js` synthesized sound, `main.js` the engine, `shots.js` screenshot staging
- `screenshots/` — three real renders of the game in a browser: title, mid-heist, victory
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's vendored `vendor/makefun-game.ts`
- `LICENSE` — MIT

---

<sub>Entered on [make.fun](https://make.fun/?ref=h6wxe48a&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
