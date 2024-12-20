const PUZZLE = {
  rows: 3,
  cols: 3,
  cutouts: [
    { side: "top", x: 2, y: 0, dir: "v", dist: "n" },
    { side: "top", x: 0, y: 1, dir: "h", dist: "n" },
    { side: "top", x: 1, y: 1, dir: "h", dist: "n" },
    { side: "top", x: 1, y: 1, dir: "h", dist: "f" },
    { side: "top", x: 1, y: 1, dir: "v", dist: "n" },
    { side: "top", x: 1, y: 1, dir: "v", dist: "f" },
    { side: "top", x: 2, y: 1, dir: "v", dist: "n" },
    { side: "top", x: 2, y: 1, dir: "v", dist: "f" },
    { side: "top", x: 1, y: 2, dir: "h", dist: "n" },
    { side: "top", x: 1, y: 2, dir: "h", dist: "f" },
    { side: "top", x: 1, y: 2, dir: "v", dist: "f" },
    { side: "top", x: 2, y: 2, dir: "h", dist: "n" },
    { side: "top", x: 0, y: 3, dir: "h", dist: "n" },
    { side: "top", x: 1, y: 3, dir: "h", dist: "f" },
    { side: "bottom", x: 0, y: 0, dir: "h", dist: "n" },
    { side: "bottom", x: 1, y: 0, dir: "h", dist: "n" },
    { side: "bottom", x: 1, y: 0, dir: "h", dist: "f" },
    { side: "bottom", x: 1, y: 0, dir: "v", dist: "n" },
    { side: "bottom", x: 2, y: 0, dir: "h", dist: "f" },
    { side: "bottom", x: 3, y: 0, dir: "v", dist: "n" },
    { side: "bottom", x: 0, y: 1, dir: "v", dist: "n" },
    { side: "bottom", x: 0, y: 1, dir: "v", dist: "f" },
    { side: "bottom", x: 1, y: 1, dir: "h", dist: "n" },
    { side: "bottom", x: 1, y: 1, dir: "v", dist: "f" },
    { side: "bottom", x: 2, y: 1, dir: "v", dist: "n" },
    { side: "bottom", x: 3, y: 1, dir: "v", dist: "n" },
    { side: "bottom", x: 3, y: 1, dir: "v", dist: "f" },
    { side: "bottom", x: 0, y: 2, dir: "h", dist: "f" },
    { side: "bottom", x: 0, y: 2, dir: "v", dist: "f" },
    { side: "bottom", x: 1, y: 2, dir: "h", dist: "n" },
    { side: "bottom", x: 1, y: 2, dir: "h", dist: "f" },
    { side: "bottom", x: 2, y: 2, dir: "v", dist: "f" },
    { side: "bottom", x: 0, y: 3, dir: "h", dist: "n" },
  ],
  rings: [
    { x: 2, y: 2, dx: 1, dy: 0, side: "top" },
    { x: 2, y: 2, dx: 0, dy: 1, side: "bottom" },
  ],
};

const ALGORITHM = "bfs";
const SOLVE_STEP_DELAY = 0;
let ANIMATION_STEP_DELAY = 500;
const FINISH_AT_START = false;

const animationDelayInput = document.getElementById("animation-delay");
animationDelayInput.value = ANIMATION_STEP_DELAY / 1000;
animationDelayInput.addEventListener("change", (e) => {
  const value = +e.target.value * 1000;
  if (value > 0) ANIMATION_STEP_DELAY = value;
});

const directions = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    if (x === 0 && y === 0) continue;
    directions.push([x, y]);
  }
}

const graphNodes = new Map();
for (const side of ["top", "bottom"]) {
  for (let x = -1; x <= PUZZLE.cols; x++) {
    for (let y = -1; y <= PUZZLE.rows; y++) {
      for (const [dx, dy] of directions) {
        const key = [side, x, y, dx, dy].join(",");
        const node = { key, side, x, y, dx, dy, x2: x + dx, y2: y + dy };
        if (
          node.x2 < -1 ||
          node.x2 > PUZZLE.cols ||
          node.y2 < -1 ||
          node.y2 > PUZZLE.rows
        )
          continue;
        graphNodes.set(key, node);
      }
    }
  }
}

const puzzleCutoutMap = new Set(
  PUZZLE.cutouts.map((cutout) =>
    [cutout.side, cutout.x, cutout.y, cutout.dir, cutout.dist].join(",")
  )
);
const graphEdges = new Map();
for (const node of graphNodes.values()) {
  if (graphEdges.has(node.key)) throw new Error("Edges already exist");
  const edges = [];
  graphEdges.set(node.key, edges);

  const x2oob = node.x2 === -1 || node.x2 === PUZZLE.cols;
  const y2oob = node.y2 === -1 || node.y2 === PUZZLE.rows;

  const usableCutouts = [
    // Can use cutout furthest away from line the ring is on
    ...(node.dy === 1 && node.dx <= 0
      ? [
          [
            node.y === -1 && node.x >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "v", dist: "n" },
            [node.side, node.x - 1, node.y, node.dx + 1, node.dy],
          ],
        ]
      : []),
    ...(node.dy === 1 && node.dx >= 0
      ? [
          [
            node.y === -1 && node.x < PUZZLE.cols,
            { side: node.side, x: node.x + 1, y: node.y, dir: "v", dist: "n" },
            [node.side, node.x + 1, node.y, node.dx - 1, node.dy],
          ],
        ]
      : []),
    ...(node.dx === -1 && node.dy <= 0
      ? [
          [
            node.x === PUZZLE.cols && node.y >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "h", dist: "f" },
            [node.side, node.x, node.y - 1, node.dx, node.dy + 1],
          ],
        ]
      : []),
    ...(node.dx === -1 && node.dy >= 0
      ? [
          [
            node.x === PUZZLE.cols && node.y < PUZZLE.rows,
            { side: node.side, x: node.x, y: node.y + 1, dir: "h", dist: "f" },
            [node.side, node.x, node.y + 1, node.dx, node.dy - 1],
          ],
        ]
      : []),
    ...(node.dy === -1 && node.dx >= 0
      ? [
          [
            node.y === PUZZLE.rows && node.x < PUZZLE.cols,
            { side: node.side, x: node.x + 1, y: node.y, dir: "v", dist: "f" },
            [node.side, node.x + 1, node.y, node.dx - 1, node.dy],
          ],
        ]
      : []),
    ...(node.dy === -1 && node.dx <= 0
      ? [
          [
            node.y === PUZZLE.rows && node.x >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "v", dist: "f" },
            [node.side, node.x - 1, node.y, node.dx + 1, node.dy],
          ],
        ]
      : []),
    ...(node.dx === 1 && node.dy >= 0
      ? [
          [
            node.x === -1 && node.y < PUZZLE.rows,
            { side: node.side, x: node.x, y: node.y + 1, dir: "h", dist: "n" },
            [node.side, node.x, node.y + 1, node.dx, node.dy - 1],
          ],
        ]
      : []),
    ...(node.dx === 1 && node.dy <= 0
      ? [
          [
            node.x === -1 && node.y >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "h", dist: "n" },
            [node.side, node.x, node.y - 1, node.dx, node.dy + 1],
          ],
        ]
      : []),

    // If half of ring is OOB, can use cutout on the close side
    ...(node.dy === 1 && node.dx <= 0 && y2oob
      ? [
          [
            node.y === -1 && node.x >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "v", dist: "f" },
            [node.side, node.x - 1, node.y, node.dx + 1, node.dy],
          ],
        ]
      : []),
    ...(node.dy === 1 && node.dx >= 0 && y2oob
      ? [
          [
            node.y === -1 && node.x < PUZZLE.cols,
            { side: node.side, x: node.x + 1, y: node.y, dir: "v", dist: "f" },
            [node.side, node.x + 1, node.y, node.dx - 1, node.dy],
          ],
        ]
      : []),
    ...(node.dx === -1 && node.dy <= 0 && x2oob
      ? [
          [
            node.x === PUZZLE.cols && node.y >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "h", dist: "n" },
            [node.side, node.x, node.y - 1, node.dx, node.dy + 1],
          ],
        ]
      : []),
    ...(node.dx === -1 && node.dy >= 0 && x2oob
      ? [
          [
            node.x === PUZZLE.cols && node.y < PUZZLE.rows,
            { side: node.side, x: node.x, y: node.y + 1, dir: "h", dist: "n" },
            [node.side, node.x, node.y + 1, node.dx, node.dy - 1],
          ],
        ]
      : []),
    ...(node.dy === -1 && node.dx >= 0 && y2oob
      ? [
          [
            node.y === PUZZLE.rows && node.x < PUZZLE.cols,
            { side: node.side, x: node.x + 1, y: node.y, dir: "v", dist: "n" },
            [node.side, node.x + 1, node.y, node.dx - 1, node.dy],
          ],
        ]
      : []),
    ...(node.dy === -1 && node.dx <= 0 && y2oob
      ? [
          [
            node.y === PUZZLE.rows && node.x >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "v", dist: "n" },
            [node.side, node.x - 1, node.y, node.dx + 1, node.dy],
          ],
        ]
      : []),
    ...(node.dx === 1 && node.dy >= 0 && x2oob
      ? [
          [
            node.x === -1 && node.y < PUZZLE.rows,
            { side: node.side, x: node.x, y: node.y + 1, dir: "h", dist: "f" },
            [node.side, node.x, node.y + 1, node.dx, node.dy - 1],
          ],
        ]
      : []),
    ...(node.dx === 1 && node.dy <= 0 && x2oob
      ? [
          [
            node.x === -1 && node.y >= 0,
            { side: node.side, x: node.x, y: node.y, dir: "h", dist: "f" },
            [node.side, node.x, node.y - 1, node.dx, node.dy + 1],
          ],
        ]
      : []),

    // If half of ring is OOB, can rotate the ring
    ...(!isOutOfBounds(node.x, node.y) && isOutOfBounds(node.x2, node.y2)
      ? [
          ...(y2oob && node.dx >= 0
            ? [[true, null, [node.side, node.x, node.y, node.dx - 1, node.dy]]]
            : []),
          ...(y2oob && node.dx <= 0
            ? [[true, null, [node.side, node.x, node.y, node.dx + 1, node.dy]]]
            : []),
          ...(x2oob && node.dy >= 0
            ? [[true, null, [node.side, node.x, node.y, node.dx, node.dy - 1]]]
            : []),
          ...(x2oob && node.dy <= 0
            ? [[true, null, [node.side, node.x, node.y, node.dx, node.dy + 1]]]
            : []),
        ]
      : []),
  ];
  for (const [isCutoutOob, c, exit] of usableCutouts) {
    if (
      !isCutoutOob &&
      !puzzleCutoutMap.has([c.side, c.x, c.y, c.dir, c.dist].join(","))
    )
      continue;
    const nextNode = graphNodes.get(exit.join(","));
    if (!nextNode) throw new Error("Invalid exit");
    edges.push(nextNode);
  }

  const ringFlip = [
    node.side === "top" ? "bottom" : "top",
    node.x2,
    node.y2,
    -node.dx,
    -node.dy,
  ].join(",");
  edges.push(graphNodes.get(ringFlip));
}

const svg = document.getElementById("visualization");
const [gridTop, gridBottom] = drawGrids();
const rings = PUZZLE.rings.map((ring, i) => {
  const ringGroups = [drawRing(gridTop, i), drawRing(gridBottom, i)];
  updateRing(ringGroups, ring);
  return ringGroups;
});

let solveStepNext, solveStepPrev;
window.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key === "ArrowRight") {
    solveStepNext?.();
  }
  if (e.key === "ArrowLeft") {
    solveStepPrev?.();
  }
});

solve();

async function solve() {
  console.log("Solving...");

  async function renderStep(i, ringState) {
    if (SOLVE_STEP_DELAY === 0) return;
    updateRing(rings[i], ringState);
    await new Promise((resolve) => setTimeout(resolve, SOLVE_STEP_DELAY));
  }

  async function bfs() {
    const solvedRingPaths = [];
    ringLoop: for (let i = 0; i < PUZZLE.rings.length; i++) {
      const ring = PUZZLE.rings[i];

      const queue = [[ring]];
      const seenStates = new Set([ring.key]);
      while (queue.length > 0) {
        const ringPath = queue.shift();
        const ringState = ringPath[ringPath.length - 1];
        await renderStep(i, ringState);

        const edges = graphEdges.get(
          [
            ringState.side,
            ringState.x,
            ringState.y,
            ringState.dx,
            ringState.dy,
          ].join(",")
        );
        if (!edges || edges.length === 0) throw new Error("No edges found");
        for (const newRingState of edges) {
          // updateRing(rings[i], newRingState);
          if (seenStates.has(newRingState.key)) continue;
          seenStates.add(newRingState.key);
          const newRingPath = [...ringPath, newRingState];
          queue.push(newRingPath);

          if (isSolved(newRingState)) {
            // return newRingPath;
            solvedRingPaths.push(newRingPath);
            continue ringLoop;
          }
        }
      }
      throw new Error("No path to solve");
    }
    return solvedRingPaths;
  }

  async function dfs() {
    const solvedRingPaths = [];
    ringLoop: for (let i = 0; i < PUZZLE.rings.length; i++) {
      const ring = PUZZLE.rings[i];

      const stack = [[ring, 0]];
      const seenStates = new Set([ring.key]);
      while (stack.length > 0) {
        const [ringState, j] = stack[stack.length - 1];

        const edges = graphEdges.get(
          [
            ringState.side,
            ringState.x,
            ringState.y,
            ringState.dx,
            ringState.dy,
          ].join(",")
        );
        if (!edges || edges.length === 0) throw new Error("No edges found");

        const newRingState = edges[j];
        if (!newRingState) {
          stack.pop();
          continue;
        }
        stack[stack.length - 1] = [ringState, j + 1];
        await renderStep(i, ringState);

        // updateRing(rings[i], newRingState);
        if (seenStates.has(newRingState.key)) continue;
        seenStates.add(newRingState.key);
        stack.push([newRingState, 0]);

        if (isSolved(newRingState)) {
          solvedRingPaths.push(stack.map(([ringState]) => ringState));
          continue ringLoop;
        }
      }
      throw new Error("No path to solve");
    }
    return solvedRingPaths;
  }

  const solvedRingPaths = await (ALGORITHM === "dfs" ? dfs : bfs)();

  console.log("Animating...");
  for (const [i, ring] of rings.entries()) {
    updateRing(ring, PUZZLE.rings[i]);
  }
  await animateSolvedPaths(solvedRingPaths);
  console.log("Done!");
}

async function animateSolvedPaths(solvedRingPaths) {
  let dir = 1;
  while (true) {
    let i = dir === 1 ? 0 : solvedRingPaths.length - 1;
    while (dir === 1 ? i < solvedRingPaths.length : i >= 0) {
      const ringPath = solvedRingPaths[i];
      for (
        let j = dir === 1 ? 0 : ringPath.length - 1;
        dir === 1 ? j < ringPath.length : j >= 0;
        j += dir
      ) {
        const ringState = ringPath[j];
        updateRing(rings[i], ringState);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, ANIMATION_STEP_DELAY);

          solveStepNext = () => {
            resolve();
            clearTimeout(timeout);
          };
          solveStepPrev = () => {
            if (j - dir < 0 || j - dir >= ringPath.length) return;
            j -= dir * 2;
            resolve();
            clearTimeout(timeout);
          };
        });
      }
      i += dir;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, ANIMATION_STEP_DELAY * 3)
    );
    dir *= -1;
  }
}

function drawGrids() {
  return ["top", "bottom"].map((sideName) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("grid", sideName);

    for (let i = 0; i < PUZZLE.rows; i++) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", 0);
      line.setAttribute("y1", i);
      line.setAttribute("x2", PUZZLE.cols);
      line.setAttribute("y2", i);
      line.classList.add("grid-line");
      group.appendChild(line);
    }

    for (let i = 0; i < PUZZLE.cols; i++) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", i);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", i);
      line.setAttribute("y2", PUZZLE.rows);
      line.classList.add("grid-line");
      group.appendChild(line);
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      [
        ["M", PUZZLE.cols, 0],
        ["L", PUZZLE.cols, PUZZLE.rows - 0.5],
        ["Q", PUZZLE.cols, PUZZLE.rows, PUZZLE.cols - 0.5, PUZZLE.rows],
        ["L", 0, PUZZLE.rows],
      ]
        .map((x) => x.join(" "))
        .join(" ")
    );
    path.classList.add("grid-line");
    group.appendChild(path);

    for (const cutout of PUZZLE.cutouts) {
      if (cutout.side !== sideName) continue;

      const len = 0.2;
      const dist = cutout.dist === "n" ? 0.08 : 0.72;
      const x = cutout.x + (cutout.dir === "h" ? dist : 0);
      const y = cutout.y + (cutout.dir === "v" ? dist : 0);

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x);
      line.setAttribute("y1", y);
      line.setAttribute("x2", x + (cutout.dir === "h" ? len : 0));
      line.setAttribute("y2", y + (cutout.dir === "v" ? len : 0));
      line.classList.add("cutout");
      group.appendChild(line);
    }

    svg.appendChild(group);
    return group;
  });
}

function drawRing(grid, ringNumber) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("ring-number-" + ringNumber);

  const ring = document.createElementNS("http://www.w3.org/2000/svg", "line");
  ring.setAttribute("x1", 0);
  ring.setAttribute("y1", 0);
  ring.setAttribute("x2", 0);
  ring.setAttribute("y2", 1);
  ring.classList.add("ring");
  group.appendChild(ring);

  const notch = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  notch.setAttribute("cx", 0);
  notch.setAttribute("cy", 0);
  notch.setAttribute("r", 0.075);
  notch.classList.add("notch");
  group.appendChild(notch);

  grid.appendChild(group);
  return group;
}

function updateRing(ringGroups, ringState) {
  const [ringTop, ringBottom] = ringGroups;
  if (ringState.side === "top") {
    ringTop.classList.add("notch-visible");
    ringBottom.classList.remove("notch-visible");
  } else {
    ringTop.classList.remove("notch-visible");
    ringBottom.classList.add("notch-visible");
  }

  for (const group of ringGroups) {
    group.children[0].setAttribute("x1", 0.5 + ringState.x);
    group.children[0].setAttribute("y1", 0.5 + ringState.y);
    group.children[0].setAttribute("x2", 0.5 + ringState.x + ringState.dx);
    group.children[0].setAttribute("y2", 0.5 + ringState.y + ringState.dy);
    group.children[1].setAttribute("cx", 0.5 + ringState.x);
    group.children[1].setAttribute("cy", 0.5 + ringState.y);
  }
}

function isOutOfBounds(x, y) {
  return x < 0 || x >= PUZZLE.cols || y < 0 || y >= PUZZLE.rows;
}

function isSolved(ringState) {
  if (FINISH_AT_START) {
    return (
      ringState.side === "bottom" &&
      ringState.x === 2 &&
      ringState.y === 2 &&
      ringState.dx === 1 &&
      ringState.dy === 0
    );
  }

  return (
    isOutOfBounds(ringState.x, ringState.y) &&
    isOutOfBounds(ringState.x2, ringState.y2)
  );
}
