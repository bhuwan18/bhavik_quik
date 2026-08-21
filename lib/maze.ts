// ─── Maze generation & line-of-sight ─────────────────────────────────────────
// Zero imports — pure grid math, unit-testable without pulling in any React/canvas code.
// Monster Hunter's darkness effect is tile-based raycast visibility rather than a visibility
// polygon: the maze is grid-native (walls are whole tiles), so tile granularity is the correct
// granularity, and a Bresenham line check per candidate tile is orders of magnitude simpler
// than shadowcasting while still hiding anything around a corner.

export type MazeGrid = boolean[][]; // grid[y][x] === true means wall

/**
 * Recursive-backtracker maze on an odd×odd grid. Cell (x, y) is a "room" when both
 * x and y are odd; even rows/columns are walls unless carved as a passage between
 * two adjacent rooms. Callers must pass odd cols/rows — even dimensions are clamped
 * down to the nearest odd value so the algorithm can't be handed a malformed grid.
 */
export function generateMaze(cols: number, rows: number): MazeGrid {
  const w = cols % 2 === 0 ? cols - 1 : cols;
  const h = rows % 2 === 0 ? rows - 1 : rows;
  const width = Math.max(5, w);
  const height = Math.max(5, h);

  const grid: MazeGrid = Array.from({ length: height }, () => Array(width).fill(true));

  const inBounds = (x: number, y: number) => x > 0 && x < width - 1 && y > 0 && y < height - 1;

  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  const startX = 1;
  const startY = 1;
  grid[startY][startX] = false;
  visited.add(key(startX, startY));

  const stack: [number, number][] = [[startX, startY]];
  const dirs = [
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    let carved = false;

    for (const [dx, dy] of shuffled) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(nx, ny) || visited.has(key(nx, ny))) continue;

      grid[ny][nx] = false;
      grid[cy + dy / 2][cx + dx / 2] = false;
      visited.add(key(nx, ny));
      stack.push([nx, ny]);
      carved = true;
      break;
    }

    if (!carved) stack.pop();
  }

  return grid;
}

export function isWall(grid: MazeGrid, cx: number, cy: number): boolean {
  const row = grid[cy];
  if (!row) return true;
  const cell = row[cx];
  return cell === undefined ? true : cell;
}

/**
 * True when a straight line between two tile centers is unobstructed by any wall
 * tile, sampled via Bresenham's line algorithm. Symmetric: hasLineOfSight(a, b)
 * === hasLineOfSight(b, a), since the sampled tile set is identical either direction.
 */
/** Bresenham's line algorithm — every grid cell the segment from A to B passes through, in order. */
function bresenhamLine(ax: number, ay: number, bx: number, by: number): [number, number][] {
  let x0 = Math.round(ax);
  let y0 = Math.round(ay);
  const x1 = Math.round(bx);
  const y1 = Math.round(by);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  const points: [number, number][] = [];
  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}

/**
 * True when nothing strictly between A and B blocks the view — i.e. no wall tile
 * among the interior points of the line (both endpoints are exempt, so you can
 * always see a wall tile you're standing next to or looking directly at). The
 * interior point set is identical regardless of direction, so this is symmetric.
 */
export function hasLineOfSight(grid: MazeGrid, ax: number, ay: number, bx: number, by: number): boolean {
  const points = bresenhamLine(ax, ay, bx, by);
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    if (isWall(grid, x, y)) return false;
  }
  return true;
}

/** Set of visible tile keys (y * cols + x) within `radius` tiles of (cx, cy), respecting walls. */
export function computeVisible(grid: MazeGrid, cx: number, cy: number, radius: number): Set<number> {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visible = new Set<number>();
  const originX = Math.round(cx);
  const originY = Math.round(cy);
  const r = Math.max(0, Math.floor(radius));

  for (let y = Math.max(0, originY - r); y <= Math.min(height - 1, originY + r); y++) {
    for (let x = Math.max(0, originX - r); x <= Math.min(width - 1, originX + r); x++) {
      const dist = Math.hypot(x - originX, y - originY);
      if (dist > r) continue;
      if (hasLineOfSight(grid, originX, originY, x, y)) {
        visible.add(y * width + x);
      }
    }
  }

  return visible;
}
