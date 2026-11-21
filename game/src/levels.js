// The three museum wings of Lantern Thief. Each map is 30 columns by 20
// rows of tiles. Legend:
//   '#' wall (blocks sight and movement)   '.' floor
//   'C' crate — cover: blocks sight and movement, hide behind it
//   'P' where the thief starts             'E' the exit (opens once the loot is taken)
//   'L' a loot gem (+100)                  'S' the Star Lantern (+500, level 3)
//   'G' a guard spawn; its patrol waypoints live in `guards` below,
//       listed in top-to-bottom, left-to-right spawn order.
export const LEVELS = [
  {
    name: 'I — The Gallery',
    intro: 'The gallery sleeps. Lift the two gems and slip out the green door.',
    map: [
      '##############################',
      '#P....#......#......#........#',
      '#.....#..L...#..C...#....E...#',
      '#..C..#......#......#........#',
      '#.....#......#......#........#',
      '#.....#......#......#........#',
      '###.####.######.######.#######',
      '#............................#',
      '#..C......G......C......L....#',
      '#............................#',
      '#......####....####......#...#',
      '#..L...#..#....#..#..C...#...#',
      '#......#..#....#..#......#...#',
      '#......#..#....#..#......#...#',
      '#......####....####......#...#',
      '#............................#',
      '#....C......G.......C........#',
      '#............................#',
      '#.....L......................#',
      '##############################',
    ],
    guards: [
      { waypoints: [[8, 8], [21, 8]], pause: 1.2 },
      { waypoints: [[8, 16], [21, 16]], pause: 1.2 },
    ],
  },
  {
    name: 'II — The Vault Wing',
    intro: 'More eyes, tighter halls. Three gems, one way out.',
    map: [
      '##############################',
      '#P...#....C.....#......L.....#',
      '#....#..........#............#',
      '#.C..#..G.......#..C....E....#',
      '#....#..........#............#',
      '#....####.#######.######.#####',
      '#............................#',
      '#..C......C......C......C....#',
      '#.......................G....#',
      '#####.######.#######.####.####',
      '#....#......#.......#........#',
      '#.L..#..C...#...L...#...C....#',
      '#....#......#.......#........#',
      '#....#......#.......#........#',
      '#....####.#####.#####.#####.##',
      '#............................#',
      '#..C.......G.......C....L....#',
      '#............................#',
      '#......C...........C.........#',
      '##############################',
    ],
    guards: [
      { waypoints: [[6, 3], [14, 3]], pause: 0.9 },
      { waypoints: [[24, 8], [24, 10]], pause: 1.5 },
      { waypoints: [[8, 16], [22, 16]], pause: 0.9 },
    ],
  },
  {
    name: 'III — The Star Lantern',
    intro: 'The Star Lantern hangs in the heart of the museum. Take it. Vanish.',
    map: [
      '##############################',
      '#P....#......#.......#.......#',
      '#.....#..C...#...C...#...L...#',
      '#..C..#......#.......#.......#',
      '#.....#......#.......#.......#',
      '#..G..####.#####.######.######',
      '#............................#',
      '#....C.....C......C.....G....#',
      '#............................#',
      '####.######.####.######.######',
      '#.....#.....#..S..#.....#....#',
      '#..L..#..C..#.....#..C....E..#',
      '#.G...#.....#.....#.....#....#',
      '#.....#.....#.....#.....#....#',
      '####.######.####.######.######',
      '#............................#',
      '#..C......G......C......C....#',
      '#............................#',
      '#......L...........C.........#',
      '##############################',
    ],
    guards: [
      { waypoints: [[3, 5], [3, 7]], pause: 1.0 },
      { waypoints: [[24, 6], [24, 8]], pause: 1.4 },
      { waypoints: [[2, 10], [4, 12]], pause: 1.0 },
      { waypoints: [[10, 16], [20, 16]], pause: 0.8 },
    ],
  },
];

// Parse one level definition into the runtime shape the engine uses.
export function parseLevel(def) {
  const walls = new Set();
  const crates = new Set();
  const loot = [];
  let player = null;
  let exit = null;
  let lantern = null;
  const spawns = [];
  def.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const key = x + ',' + y;
      const ch = row[x];
      if (ch === '#') walls.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'P') player = { x: x + 0.5, y: y + 0.5 };
      else if (ch === 'E') exit = { x: x + 0.5, y: y + 0.5 };
      else if (ch === 'L') loot.push({ x: x + 0.5, y: y + 0.5, taken: false, kind: 'gem' });
      else if (ch === 'S') lantern = { x: x + 0.5, y: y + 0.5, taken: false, kind: 'lantern' };
      else if (ch === 'G') spawns.push({ x: x + 0.5, y: y + 0.5 });
    }
  });
  if (lantern) loot.push(lantern);
  return { name: def.name, intro: def.intro, walls, crates, loot, player, exit, spawns, guards: def.guards };
}

// True when the tile at (tx, ty) blocks movement.
export function solidAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 30 || ty >= 20) return true;
  const key = tx + ',' + ty;
  return level.walls.has(key) || level.crates.has(key);
}

// True when the tile blocks a guard's line of sight.
export function blocksSight(level, tx, ty) {
  return solidAt(level, tx, ty);
}
