// Screenshot staging for the entry's screenshots. `?shot=start` shows the
// title over the museum, `?shot=play` drops the thief mid-heist with a
// guard's cone sweeping past and one gem already pocketed, and `?shot=end`
// shows the victory screen. These only arrange the game's own state —
// every pixel is still the game itself, running in the browser.
import { LEVELS, parseLevel } from './levels.js';
import { makeGuard } from './guards.js';

export function applyShot(game, shot, controls) {
  if (shot === 'start') {
    game.state = 'title';
    return;
  }
  if (shot === 'play') {
    // Mid-heist on wing one: the thief crouched behind a crate while a
    // guard's cone sweeps the hall, one gem already taken.
    controls.loadLevel(0);
    game.state = 'play';
    game.player.x = 10.5;
    game.player.y = 8.5;
    game.player.sneaking = true;
    game.player.angle = Math.PI;
    game.level.loot[0].taken = true;
    game.score = 100;
    game.elapsed = 47;
    game.levelTime = 47;
    const guard = game.guards[0];
    guard.x = 15.5;
    guard.y = 8.5;
    guard.angle = Math.PI;
    guard.meter = 55;
    guard.state = 'suspicious';
    guard.lastSeen = { x: 10.5, y: 8.5 };
    return;
  }
  if (shot === 'end') {
    controls.loadLevel(2);
    game.state = 'win';
    game.score = 2450;
    game.everSpotted = false;
    game.elapsed = 312;
    return;
  }
  if (shot === 'chase') {
    // A guard in full pursuit, for an alternate action shot.
    controls.loadLevel(1);
    game.state = 'play';
    game.player.x = 14.5;
    game.player.y = 8.5;
    game.player.angle = 0;
    const guard = game.guards[1];
    guard.x = 12.5;
    guard.y = 8.5;
    guard.angle = 0;
    guard.meter = 100;
    guard.state = 'chase';
    guard.lastSeen = { x: 14.5, y: 8.5 };
    game.levelSpotted = true;
    game.everSpotted = true;
    game.elapsed = 96;
    game.levelTime = 96;
  }
}
