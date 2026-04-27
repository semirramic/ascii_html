const ASCII_CHARMS = "... ... .. ::: = + xX#0369ZBAKE";
const FONT_SIZE = 20;
const ASPECT_WIDTH = 5;
const ASPECT_HEIGHT = 5;
const ASCII_COLUMNS = 40;

const IMAGE_STAGGER_MS = 100;
const SCRAMBLE_SPEED_MS = 8;
const REVEAL_DELAY_MS = 0;

const denseCharIndex = ASCII_CHARMS.lastIndexOf(".");
const denseChars = ASCII_CHARMS.slice(denseCharIndex + 1).split("");

const measureCtx = document.createElement("canvas").getContext("2d");
measureCtx.font = `${FONT_SIZE}px monospace`;

const charWidth = Math.ceil(measureCtx.measureText("M").width);
const charHeight = FONT_SIZE;

const ASCII_ROWS = Math.round(
  ASCII_COLUMNS * (ASPECT_HEIGHT / ASPECT_WIDTH) * (charWidth / charHeight)
);

/* ---------------- INIT ---------------- */

document.querySelectorAll("img.ascii-reveal").forEach((img, index) => {
  const canvas = document.createElement("canvas");
  const staggerDelay = index * IMAGE_STAGGER_MS;

  const onLoaded = () => startEffect(img, canvas, staggerDelay);

  img.closest(".img").appendChild(canvas);

  img.complete && img.naturalWidth
    ? onLoaded()
    : img.addEventListener("load", onLoaded);
});

/* ---------------- START ---------------- */

function startEffect(img, canvas, staggerDelay) {
  const { asciiGrid, brightnessGrid } = imageToAsciiGrid(img);
  prepareCanvas(canvas);
  animateCells(canvas, asciiGrid, brightnessGrid, staggerDelay);
}

/* ---------------- IMAGE TO ASCII ---------------- */

function imageToAsciiGrid(img) {
  const imageAspect = img.naturalWidth / img.naturalHeight;
  const itemAspect = ASPECT_WIDTH / ASPECT_HEIGHT;

  let cropX = 0,
    cropY = 0,
    cropW = img.naturalWidth,
    cropH = img.naturalHeight;

  if (imageAspect > itemAspect) {
    cropW = img.naturalHeight * itemAspect;
    cropX = (img.naturalWidth - cropW) / 2;
  } else {
    cropH = img.naturalWidth / itemAspect;
    cropY = (img.naturalHeight - cropH) / 2;
  }

  const samplingCanvas = document.createElement("canvas");
  samplingCanvas.width = ASCII_COLUMNS;
  samplingCanvas.height = ASCII_ROWS;

  const sctx = samplingCanvas.getContext("2d");

  sctx.drawImage(
    img,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    ASCII_COLUMNS,
    ASCII_ROWS
  );

  const { data } = sctx.getImageData(0, 0, ASCII_COLUMNS, ASCII_ROWS);

  const asciiGrid = [];
  const brightnessGrid = [];

  for (let row = 0; row < ASCII_ROWS; row++) {
    const asciiRow = [];
    const brightnessRow = [];

    for (let col = 0; col < ASCII_COLUMNS; col++) {
      const pixelIndex = (row * ASCII_COLUMNS + col) * 4;

      const brightness =
        (data[pixelIndex] * 0.299 +
          data[pixelIndex + 1] * 0.587 +
          data[pixelIndex + 2] * 0.114) /
        255;

      const charIndex = Math.min(
        ASCII_CHARMS.length - 1,
        Math.floor((1 - brightness) * ASCII_CHARMS.length)
      );

      asciiRow.push(ASCII_CHARMS[charIndex]);
      brightnessRow.push(charIndex);
    }

    asciiGrid.push(asciiRow);
    brightnessGrid.push(brightnessRow);
  }

  return { asciiGrid, brightnessGrid };
}

/* ---------------- CANVAS ---------------- */

function prepareCanvas(canvas) {
  const dpr = 2;

  canvas.width = ASCII_COLUMNS * charWidth * dpr;
  canvas.height = ASCII_ROWS * charHeight * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCharacter(ctx, col, row, char) {
  ctx.fillStyle = "#111";
  ctx.fillRect(col * charWidth, row * charHeight, charWidth, charHeight);

  ctx.fillStyle = "#c8c8c8";
  ctx.fillText(char, col * charWidth, row * charHeight);
}

/* ---------------- ANIMATION (ONE BY ONE REVEAL) ---------------- */

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function animateCells(canvas, asciiGrid, brightnessGrid, staggerDelay) {
  const ctx = canvas.getContext("2d");

  ctx.font = `${charHeight}px monospace`;
  ctx.textBaseline = "top";

  const totalCells = ASCII_COLUMNS * ASCII_ROWS;
  const cellOrder = shuffleArray([...Array(totalCells).keys()]);

  cellOrder.forEach((cellIndex, i) => {
    const delay = i * SCRAMBLE_SPEED_MS + staggerDelay;

    setTimeout(() => {
      const row = Math.floor(cellIndex / ASCII_COLUMNS);
      const col = cellIndex % ASCII_COLUMNS;

      const isDark = brightnessGrid[row][col] > denseCharIndex;

      if (!isDark) {
        drawCharacter(ctx, col, row, asciiGrid[row][col]);
      } else {
        drawCharacter(
          ctx,
          col,
          row,
          denseChars[Math.floor(Math.random() * denseChars.length)]
        );
      }

      // last cell → reveal image
      if (i === totalCells - 1) {
        scheduleImageReveal(canvas);
      }
    }, delay);
  });
}

/* ---------------- REVEAL ---------------- */

function scheduleImageReveal(canvas) {
  const wrapper = canvas.closest(".img");
  if (!wrapper) return;

  setTimeout(() => {
    wrapper.classList.add("revealed");
  }, REVEAL_DELAY_MS);
}