import { Universe, Cell } from 'wasm-game-of-life';
import { memory } from 'wasm-game-of-life/wasm_game_of_life_bg';

const CELL_SIZE = 5;
const GRID_COLOR = '#CCCCCC';
const DEAD_COLOR = '#FFFFFF';
const ALIVE_COLOR = '#000000';

const universe = Universe.new();
let width = universe.width();
let height = universe.height();

const canvas = document.getElementById('game-of-life-canvas');
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const playPauseButton = document.getElementById('play-pause');
const advanceOneButton = document.getElementById('advance-one');
let animationId = null;
let configChangedTimeout = null;

widthInput.addEventListener('keyup', () => {
  const value = parseInt(widthInput.value);
  if (!isNaN(value)) {
    pause();
  }

  if (configChangedTimeout) {
    clearTimeout(configChangedTimeout);
  }

  configChangedTimeout = setTimeout(() => {
    const value = parseInt(widthInput.value);

    if (!isNaN(value)) {
      universe.set_width(value);
      width = universe.width();
      canvas.width = (CELL_SIZE + 1) * width + 1;
      play();
    };
  }, 500);
})

heightInput.addEventListener('keyup', () => {
  const value = parseInt(heightInput.value);
  if (!isNaN(value)) {
    pause();
  }

  if (configChangedTimeout) {
    clearTimeout(configChangedTimeout);
  }

  configChangedTimeout = setTimeout(() => {
    const value = parseInt(heightInput.value);

    if (!isNaN(value)) {
      universe.set_height(value);
      height = universe.height();
      canvas.height = (CELL_SIZE + 1) * height + 1;
      play();
    };
  }, 500);
})

playPauseButton.addEventListener('click', event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

advanceOneButton.addEventListener('click', () => {
  renderOnce();
})

canvas.addEventListener("click", event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);

  drawGrid();
  drawCells();
});

const renderOnce = () => {
  debugger;
  universe.tick();

  drawGrid();
  drawCells();
}

const renderLoop = () => {
  renderOnce();

  animationId = requestAnimationFrame(renderLoop);
};

const isPaused = () => {
  return animationId === null;
}

const play = () => {
  playPauseButton.textContent = '⏸';
  // Cannot "advance one" when we're playing
  advanceOneButton.setAttribute('disabled', true);
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = '▶';
  advanceOneButton.removeAttribute('disabled');
  cancelAnimationFrame(animationId);
  animationId = null;
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = cells[idx] === Cell.Dead
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

widthInput.value = width;
heightInput.value = height;
play();