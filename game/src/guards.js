// Guard patrol, vision and the detection meter. A guard walks its
// waypoints, pauses to look around, and watches a cone in front of it.
// Walls and crates block sight (sampled along the line). While the thief
// is inside the cone and in sight, the detection meter climbs — faster
// up close, slower when the thief sneaks. At 40 the guard stops and
// stares ("?"); at 100 it gives chase ("!"). Break sight and the meter
// drains; stay hidden long enough and the guard goes back to patrol.
import {
  CHASE_SPEED, GUARD_SPEED, CONE_RANGE, CONE_HALF_ANGLE,
  SNEAK_SIGHT_FACTOR, DETECT_RATE, DETECT_DRAIN,
  SUSPICIOUS_AT, ALARM_AT, CHASE_GIVE_UP, CATCH_DIST,
} from './config.js';
import { blocksSight } from './levels.js';

export function makeGuard(spawn, def) {
  return {
    x: spawn.x,
    y: spawn.y,
    waypoints: def.waypoints.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })),
    wpIndex: 0,
    pause: def.pause,
    pauseLeft: 0,
    angle: 0,
    speed: GUARD_SPEED,
    state: 'patrol', // patrol | suspicious | chase | return
    meter: 0,
    lastSeen: null,
    unseenFor: 0,
    seenNow: false,
    stepAcc: 0,
  };
}

// Bresenham-style sampling: true when no wall/crate stands between a and b.
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist * 4);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor(ax + dx * t);
    const ty = Math.floor(ay + dy * t);
    if (blocksSight(level, tx, ty)) return false;
  }
  return true;
}

// Is the player inside this guard's vision cone right now?
export function canSee(level, guard, player, sneaking) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = CONE_RANGE * (sneaking ? SNEAK_SIGHT_FACTOR : 1);
  if (dist > range) return false;
  if (dist < 0.9) return hasLineOfSight(level, guard.x, guard.y, player.x, player.y);
  let ang = Math.atan2(dy, dx) - guard.angle;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  if (Math.abs(ang) > CONE_HALF_ANGLE) return false;
  return hasLineOfSight(level, guard.x, guard.y, player.x, player.y);
}

function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return true;
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  return dist - step < 0.02;
}

// Advance one guard a frame. Returns events the engine turns into sound
// and HUD: 'suspicious' when it first stares, 'alarm' when it first chases.
export function updateGuard(level, guard, player, sneaking, dt, sound) {
  const events = [];
  const seen = canSee(level, guard, player, sneaking);
  guard.seenNow = seen;

  if (seen) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    const closeness = 1 - Math.min(1, dist / CONE_RANGE);
    const rate = DETECT_RATE * (0.45 + 0.75 * closeness) * (sneaking ? 0.55 : 1);
    const before = guard.meter;
    guard.meter = Math.min(ALARM_AT, guard.meter + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.unseenFor = 0;
    guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
    if (before < SUSPICIOUS_AT && guard.meter >= SUSPICIOUS_AT && guard.state === 'patrol') {
      guard.state = 'suspicious';
      events.push('suspicious');
    }
    if (before < ALARM_AT && guard.meter >= ALARM_AT) {
      guard.state = 'chase';
      events.push('alarm');
    }
  } else {
    guard.meter = Math.max(0, guard.meter - DETECT_DRAIN * dt);
    guard.unseenFor += dt;
    if (guard.state === 'suspicious' && guard.meter < SUSPICIOUS_AT) guard.state = 'patrol';
  }

  if (guard.state === 'chase') {
    const target = guard.lastSeen || { x: player.x, y: player.y };
    moveToward(guard, target.x, target.y, CHASE_SPEED, dt, level);
    if (guard.unseenFor > CHASE_GIVE_UP) {
      guard.state = 'return';
      guard.meter = Math.max(0, guard.meter - 30);
    }
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DIST) {
      events.push('caught');
    }
  } else if (guard.state === 'return') {
    const wp = guard.waypoints[guard.wpIndex];
    if (moveToward(guard, wp.x, wp.y, GUARD_SPEED, dt, level)) guard.state = 'patrol';
  } else if (guard.state === 'suspicious') {
    // Stare at the last seen spot, then resume the patrol.
    if (guard.lastSeen) guard.angle = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
  } else {
    // Patrol: walk to the next waypoint, pause, look around, carry on.
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      guard.angle += Math.sin(performance.now() / 900 + guard.x) * 0.004;
    } else {
      const wp = guard.waypoints[guard.wpIndex];
      if (moveToward(guard, wp.x, wp.y, guard.speed, dt, level)) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = guard.pause;
      }
    }
  }

  // Heavy boots: one step sound per stride while the guard walks.
  const moving = guard.state === 'patrol' || guard.state === 'chase' || guard.state === 'return';
  if (moving) {
    guard.stepAcc += dt * (guard.state === 'chase' ? 3.4 : 2.2);
    if (guard.stepAcc > 1) {
      guard.stepAcc = 0;
      const d = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (sound) sound.guardStep(d);
    }
  }
  return events;
}
