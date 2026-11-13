// Pipe puzzle logic (pure). Tile = 4-bit mask of openings; cells 0..8 row-major on a 3x3 board.
export const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, -1, 0, S], [E, 0, 1, W], [S, 1, 0, N], [W, 0, -1, E]];
const DECOYS = [5, 3, 14, 15, 3, 5]; // straight, corner, T, cross

export const rotate = (m, times = 1) => {
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
};

const neighbor = (k, dr, dc) => {
  const r = Math.floor(k / 3) + dr, c = (k % 3) + dc;
  return r < 0 || r > 2 || c < 0 || c > 2 ? -1 : r * 3 + c;
};

// grid: 9 masks (0 = empty). Water enters bottom of column `entry`, must leave top of column `exit`.
export function flow(grid, entry, exit) {
  const start = 6 + entry, wet = new Set();
  if (grid[start] & S) wet.add(start);
  const stack = [...wet];
  while (stack.length) {
    const k = stack.pop();
    for (const [bit, dr, dc, opp] of DIRS) {
      const nk = neighbor(k, dr, dc);
      if (!(grid[k] & bit) || nk < 0 || wet.has(nk) || !(grid[nk] & opp)) continue;
      wet.add(nk);
      stack.push(nk);
    }
  }
  return { wet, won: wet.has(exit) && !!(grid[exit] & N) };
}

// Random self-avoiding path from cell `from` to cell `to`, at most `max` cells.
function walk(path, to, max, rand) {
  const k = path[path.length - 1];
  if (k === to) return path;
  if (path.length >= max) return null;
  const dirs = [...DIRS].sort(() => rand() - 0.5);
  for (const [, dr, dc] of dirs) {
    const nk = neighbor(k, dr, dc);
    if (nk < 0 || path.includes(nk)) continue;
    const found = walk([...path, nk], to, max, rand);
    if (found) return found;
  }
  return null;
}

const dirBetween = (a, b) => DIRS.find(([, dr, dc]) => neighbor(a, dr, dc) === b);

// Level: 6 pieces {mask, rot, cell}. Path pieces solve the board at rot ≡ 0 placed on `sol`.
export function makeLevel(rand = Math.random) {
  const pick = a => a[Math.floor(rand() * a.length)];
  const entry = pick([0, 1, 2]), exit = pick([0, 1, 2]);
  const path = walk([6 + entry], exit, 6, rand); // always exists: shortest is 3 cells
  const pieces = path.map((k, i) => {
    let mask = (i === 0 ? S : dirBetween(k, path[i - 1])[0]) | (i === path.length - 1 ? N : dirBetween(k, path[i + 1])[0]);
    if (rand() < 0.25) mask |= pick([N, E, S, W]); // sometimes a T, to vary shapes
    return { mask, sol: k };
  });
  while (pieces.length < 6) pieces.push({ mask: pick(DECOYS), sol: null });
  return {
    entry, exit,
    pieces: pieces.sort(() => rand() - 0.5).map(p => ({ ...p, rot: Math.floor(rand() * 4), cell: null })),
  };
}
