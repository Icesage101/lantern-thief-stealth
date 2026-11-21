// Everything the eye sees: the museum floor, the guards' vision cones,
// the thief, the loot and the HUD. Cones are drawn as translucent wedges
// clipped by nothing — walls already cut sight in the guard logic, and
// the cone's edge fades where a wall would stand, which reads as light
// spilling around cover. Darkness is painted last, over everything the
// lanterns do not reach.
import { TILE, COLS, ROWS, COLORS, CONE_RANGE, CONE_HALF_ANGLE } from './config.js';

function tileXY(x, y) {
  return [x * TILE, y * TILE];
}

export function drawWorld(ctx, game) {
  const { level } = game;
  // Checkerboard stone floor.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const [px, py] = tileXY(x, y);
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(px, py, TILE, TILE);
    }
  }
  // Walls with a lighter top edge, crates as wooden boxes.
  level.walls.forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    const [px, py] = tileXY(x, y);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(px, py, TILE, 5);
  });
  level.crates.forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    const [px, py] = tileXY(x, y);
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
    ctx.strokeStyle = '#4a3418';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 2);
    ctx.lineTo(px + TILE - 2, py + TILE - 2);
    ctx.moveTo(px + TILE - 2, py + 2);
    ctx.lineTo(px + 2, py + TILE - 2);
    ctx.stroke();
  });

  drawExit(ctx, game);
  drawLoot(ctx, game);
  drawCones(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
}

function drawExit(ctx, game) {
  const { level, exitOpen } = game;
  const [px, py] = tileXY(Math.floor(level.exit.x), Math.floor(level.exit.y));
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;
  ctx.save();
  ctx.fillStyle = exitOpen ? COLORS.exit : '#274d33';
  ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
  ctx.strokeStyle = exitOpen ? COLORS.exitGlow : '#4a6b52';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = exitOpen ? '#eafff0' : '#7a9a84';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', cx, cy);
  if (exitOpen) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    ctx.strokeStyle = `rgba(125, 255, 176, ${0.25 + 0.35 * pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(px - 2, py - 2, TILE + 4, TILE + 4);
  }
  ctx.restore();
}

function drawLoot(ctx, game) {
  const { level } = game;
  for (const item of level.loot) {
    if (item.taken) continue;
    const cx = item.x * TILE;
    const cy = item.y * TILE;
    const bob = Math.sin(performance.now() / 400 + item.x) * 2;
    ctx.save();
    if (item.kind === 'lantern') {
      const glow = ctx.createRadialGradient(cx, cy + bob, 2, cx, cy + bob, 26);
      glow.addColorStop(0, 'rgba(255, 217, 77, 0.55)');
      glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 26, cy + bob - 26, 52, 52);
      ctx.fillStyle = COLORS.lantern;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5c00';
      ctx.fillRect(cx - 2, cy + bob - 14, 4, 5);
      ctx.fillRect(cx - 5, cy + bob + 9, 10, 3);
    } else {
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.moveTo(cx, cy + bob - 8);
      ctx.lineTo(cx + 7, cy + bob);
      ctx.lineTo(cx, cy + bob + 8);
      ctx.lineTo(cx - 7, cy + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.moveTo(cx, cy + bob - 8);
      ctx.lineTo(cx + 3, cy + bob - 2);
      ctx.lineTo(cx, cy + bob + 2);
      ctx.lineTo(cx - 3, cy + bob - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawCones(ctx, game) {
  for (const guard of game.guards) {
    const cx = guard.x * TILE;
    const cy = guard.y * TILE;
    const range = CONE_RANGE * TILE;
    const alerted = guard.state === 'chase' || guard.meter >= 100;
    ctx.save();
    ctx.fillStyle = alerted ? COLORS.coneAlert : COLORS.cone;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, range, guard.angle - CONE_HALF_ANGLE, guard.angle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawGuards(ctx, game) {
  for (const guard of game.guards) {
    const cx = guard.x * TILE;
    const cy = guard.y * TILE;
    const alerted = guard.state === 'chase';
    const suspicious = guard.state === 'suspicious' || guard.meter >= 40;
    ctx.save();
    // Body: a red cloak with a lantern dot.
    ctx.fillStyle = alerted ? COLORS.guardAlert : COLORS.guard;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c1a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#ffd9d9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(guard.angle) * 15, cy + Math.sin(guard.angle) * 15);
    ctx.stroke();
    // "?" while suspicious, "!" while hunting.
    if (alerted || suspicious) {
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = alerted ? '#ff5a5a' : '#ffd94d';
      ctx.fillText(alerted ? '!' : '?', cx, cy - 14);
    }
    ctx.restore();
  }
}

function drawPlayer(ctx, game) {
  const { player } = game;
  const cx = player.x * TILE;
  const cy = player.y * TILE;
  ctx.save();
  ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2f1e';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point shows facing.
  ctx.fillStyle = '#3a2f1e';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(player.angle) * 8, cy + Math.sin(player.angle) * 8, 3, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b9c4a8';
    ctx.fillText('sneaking', cx, cy + 24);
  }
  ctx.restore();
}

// The HUD: detection meter, loot, level, timer, score, lives.
export function drawHUD(ctx, game) {
  const topMeter = Math.max(0, ...game.guards.map((g) => g.meter));
  const alerted = game.guards.some((g) => g.state === 'chase');
  ctx.save();
  ctx.fillStyle = 'rgba(5, 6, 14, 0.72)';
  ctx.fillRect(0, 0, 960, 34);
  ctx.font = '14px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8e4d8';
  const lootGot = game.level.loot.filter((l) => l.taken).length;
  const lootTotal = game.level.loot.length;
  ctx.fillText(`${game.level.name}   ·   Loot ${lootGot}/${lootTotal}   ·   Score ${game.score}`, 12, 18);
  const t = Math.floor(game.elapsed);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  ctx.fillText(`Time ${mm}:${ss}   ·   Lives ${'♥'.repeat(game.lives)}${'♡'.repeat(Math.max(0, 3 - game.lives))}`, 560, 18);

  // Detection meter on the right.
  const mw = 150;
  const mx = 960 - mw - 12;
  ctx.fillStyle = '#222';
  ctx.fillRect(mx, 10, mw, 14);
  const frac = topMeter / 100;
  ctx.fillStyle = frac < 0.4 ? '#e8c96a' : frac < 0.75 ? '#e08a2e' : '#ff2e2e';
  ctx.fillRect(mx, 10, mw * frac, 14);
  ctx.strokeStyle = '#888';
  ctx.strokeRect(mx, 10, mw, 14);
  ctx.fillStyle = alerted ? '#ff5a5a' : '#e8e4d8';
  ctx.textAlign = 'right';
  ctx.fillText(alerted ? 'SPOTTED!' : topMeter > 40 ? 'SEEN?' : 'HIDDEN', mx - 8, 18);
  ctx.restore();
}

// Full-screen overlay for title, level intro, pause, win and lose.
export function drawOverlay(ctx, title, lines, footer) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 6, 14, 0.78)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, 480, 220);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '18px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, 480, 280 + i * 30));
  if (footer) {
    ctx.fillStyle = '#9a8f7a';
    ctx.font = '15px Georgia, serif';
    ctx.fillText(footer, 480, 280 + lines.length * 30 + 40);
  }
  ctx.restore();
}
