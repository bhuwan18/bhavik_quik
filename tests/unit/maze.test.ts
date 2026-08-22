import { describe, it, expect } from "vitest";
import { generateMaze, expandMaze, isWall, hasLineOfSight, computeVisible, type MazeGrid } from "@/lib/maze";

describe("generateMaze", () => {
  it("clamps even dimensions down to the nearest odd size", () => {
    const grid = generateMaze(10, 8);
    expect(grid.length).toBe(7);
    expect(grid[0].length).toBe(9);
  });

  it("surrounds the maze with a solid border wall", () => {
    const grid = generateMaze(11, 11);
    const h = grid.length;
    const w = grid[0].length;
    for (let x = 0; x < w; x++) {
      expect(grid[0][x]).toBe(true);
      expect(grid[h - 1][x]).toBe(true);
    }
    for (let y = 0; y < h; y++) {
      expect(grid[y][0]).toBe(true);
      expect(grid[y][w - 1]).toBe(true);
    }
  });

  it("is fully connected — every floor tile is reachable from the start room", () => {
    const grid = generateMaze(15, 15);
    const h = grid.length;
    const w = grid[0].length;
    let floorCount = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!grid[y][x]) floorCount++;

    const visited = new Set<number>([1 * w + 1]);
    const queue: [number, number][] = [[1, 1]];
    while (queue.length) {
      const [cx, cy] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || grid[ny][nx]) continue;
        const key = ny * w + nx;
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push([nx, ny]);
      }
    }

    expect(visited.size).toBe(floorCount);
  });
});

describe("expandMaze", () => {
  it("scales dimensions by the given factor", () => {
    const grid = generateMaze(11, 11);
    const expanded = expandMaze(grid, 3);
    expect(expanded.length).toBe(grid.length * 3);
    expect(expanded[0].length).toBe(grid[0].length * 3);
  });

  it("replaces every source cell with a uniform factor×factor block of the same value", () => {
    const grid: MazeGrid = [
      [true, false],
      [false, true],
    ];
    const expanded = expandMaze(grid, 2);
    // Source (0,0) = wall → expanded (0..1, 0..1) all wall.
    expect(expanded[0][0]).toBe(true);
    expect(expanded[0][1]).toBe(true);
    expect(expanded[1][0]).toBe(true);
    expect(expanded[1][1]).toBe(true);
    // Source (1,0) = floor → expanded (2..3, 0..1) all floor.
    expect(expanded[0][2]).toBe(false);
    expect(expanded[0][3]).toBe(false);
    expect(expanded[1][2]).toBe(false);
    expect(expanded[1][3]).toBe(false);
  });

  it("preserves full connectivity — the maze stays a single connected region", () => {
    const grid = generateMaze(9, 9);
    const expanded = expandMaze(grid, 3);
    const h = expanded.length;
    const w = expanded[0].length;
    let floorCount = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!expanded[y][x]) floorCount++;

    // Start BFS from the first floor tile found.
    let start: [number, number] | null = null;
    outer: for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!expanded[y][x]) {
          start = [x, y];
          break outer;
        }
      }
    }
    expect(start).not.toBeNull();

    const visited = new Set<number>([start![1] * w + start![0]]);
    const queue: [number, number][] = [start!];
    while (queue.length) {
      const [cx, cy] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || expanded[ny][nx]) continue;
        const key = ny * w + nx;
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push([nx, ny]);
      }
    }
    expect(visited.size).toBe(floorCount);
  });

  it("clamps factor to at least 1", () => {
    const grid: MazeGrid = [[false]];
    const expanded = expandMaze(grid, 0);
    expect(expanded.length).toBe(1);
    expect(expanded[0].length).toBe(1);
  });
});

describe("isWall", () => {
  it("treats out-of-bounds coordinates as a wall", () => {
    const grid: MazeGrid = [[false, false], [false, false]];
    expect(isWall(grid, -1, 0)).toBe(true);
    expect(isWall(grid, 5, 5)).toBe(true);
    expect(isWall(grid, 0, 0)).toBe(false);
  });
});

function gridWithWallAt(wx: number, wy: number, size = 5): MazeGrid {
  const g: MazeGrid = Array.from({ length: size }, () => Array(size).fill(false));
  g[wy][wx] = true;
  return g;
}

describe("hasLineOfSight", () => {
  it("is true across open floor", () => {
    const g = gridWithWallAt(4, 4);
    expect(hasLineOfSight(g, 0, 0, 3, 0)).toBe(true);
  });

  it("is false when a wall sits strictly between the two points", () => {
    const g = gridWithWallAt(2, 2);
    expect(hasLineOfSight(g, 0, 0, 4, 4)).toBe(false);
  });

  it("is symmetric regardless of direction", () => {
    const g = gridWithWallAt(2, 2);
    expect(hasLineOfSight(g, 0, 0, 4, 4)).toBe(hasLineOfSight(g, 4, 4, 0, 0));
    const g2 = gridWithWallAt(4, 4);
    expect(hasLineOfSight(g2, 1, 0, 3, 4)).toBe(hasLineOfSight(g2, 3, 4, 1, 0));
  });

  it("does not block sight to a wall tile that is itself the destination", () => {
    const g = gridWithWallAt(3, 0);
    expect(hasLineOfSight(g, 0, 0, 3, 0)).toBe(true);
  });

  it("does not block sight from a wall tile that is itself the origin", () => {
    const g = gridWithWallAt(0, 0);
    expect(hasLineOfSight(g, 0, 0, 3, 0)).toBe(true);
  });
});

describe("computeVisible", () => {
  it("always includes the origin tile", () => {
    const g: MazeGrid = Array.from({ length: 5 }, () => Array(5).fill(false));
    const visible = computeVisible(g, 2, 2, 3);
    expect(visible.has(2 * 5 + 2)).toBe(true);
  });

  it("excludes tiles hidden behind a wall", () => {
    const g: MazeGrid = Array.from({ length: 5 }, () => Array(5).fill(false));
    for (let y = 0; y < 5; y++) g[y][2] = true; // solid wall column at x=2
    const visible = computeVisible(g, 0, 2, 4);
    expect(visible.has(2 * 5 + 4)).toBe(false);
  });

  it("respects the vision radius", () => {
    const g: MazeGrid = Array.from({ length: 9 }, () => Array(9).fill(false));
    const visible = computeVisible(g, 4, 4, 2);
    expect(visible.has(4 * 9 + 8)).toBe(false);
  });
});
