const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let renderTask = null;

const uploadScreen       = document.getElementById('upload-screen');
const presentationScreen = document.getElementById('presentation-screen');
const fileInput          = document.getElementById('file-input');
const dropZone           = document.getElementById('drop-zone');
const mainCanvas         = document.getElementById('main-canvas');
const ctx                = mainCanvas.getContext('2d');
const drawCanvas         = document.getElementById('draw-canvas');
const drawCtx            = drawCanvas.getContext('2d');
const thumbnailsEl       = document.getElementById('thumbnails');
const pageInfo           = document.getElementById('page-info');
const prevBtn            = document.getElementById('prev-btn');
const nextBtn            = document.getElementById('next-btn');
const slideContainer     = document.getElementById('slide-container');
const fullscreenBtn      = document.getElementById('fullscreen-btn');
const fullscreenHint     = document.getElementById('fullscreen-hint');

// ── Drawing tools ─────────────────────────────────────────────────────────────

const penBtn     = document.getElementById('pen-btn');
const eraserBtn  = document.getElementById('eraser-btn');
const laserBtn   = document.getElementById('laser-btn');
const colorPicker = document.getElementById('color-picker');
const sizeSlider = document.getElementById('size-slider');
const undoBtn    = document.getElementById('undo-btn');
const clearBtn   = document.getElementById('clear-btn');
const floatingToolbar = document.getElementById('floating-toolbar');
const floatingToggle = document.getElementById('floating-toggle');
const fColorPicker = document.getElementById('fcolor-picker');
const fSizeSlider = document.getElementById('fsize-slider');

let currentTool = null;
let isDrawing = false;
let lastX = 0, lastY = 0;
let drawHistory = {};
let historyStack = [];
let laserPointer = null;
let customCursor = null;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

penBtn.addEventListener('click', () => setTool('pen'));
eraserBtn.addEventListener('click', () => setTool('eraser'));
laserBtn.addEventListener('click', () => setTool('laser'));
undoBtn.addEventListener('click', undo);
clearBtn.addEventListener('click', clearDrawing);

colorPicker.addEventListener('input', e => fColorPicker.value = e.target.value);
sizeSlider.addEventListener('input', e => {
  fSizeSlider.value = e.target.value;
  updateCustomCursor();
});
fColorPicker.addEventListener('input', e => {
  colorPicker.value = e.target.value;
  updateCustomCursor();
});
fSizeSlider.addEventListener('input', e => {
  sizeSlider.value = e.target.value;
  updateCustomCursor();
});

floatingToggle.addEventListener('click', e => {
  if (!isDragging) {
    floatingToolbar.classList.toggle('expanded');
  }
});

floatingToggle.addEventListener('mousedown', e => {
  isDragging = false;
  const rect = floatingToggle.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  const onMove = (e) => {
    isDragging = true;
    floatingToggle.style.right = 'auto';
    floatingToggle.style.bottom = 'auto';
    floatingToggle.style.left = (e.clientX - dragOffsetX) + 'px';
    floatingToggle.style.top = (e.clientY - dragOffsetY) + 'px';
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    setTimeout(() => isDragging = false, 100);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

floatingToolbar.addEventListener('click', e => {
  const btn = e.target.closest('.ftool-btn');
  if (!btn) return;
  if (btn.dataset.tool) setTool(btn.dataset.tool);
  if (btn.dataset.action === 'clear') clearDrawing();
});

function setTool(tool) {
  currentTool = currentTool === tool ? null : tool;
  penBtn.classList.toggle('active', currentTool === 'pen');
  eraserBtn.classList.toggle('active', currentTool === 'eraser');
  laserBtn.classList.toggle('active', currentTool === 'laser');

  document.querySelectorAll('.ftool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === currentTool);
  });

  drawCanvas.classList.toggle('active', currentTool && currentTool !== 'laser');
  drawCanvas.classList.toggle('eraser', currentTool === 'eraser');
  drawCanvas.classList.toggle('laser', currentTool === 'laser');

  if (currentTool === 'laser') {
    if (!laserPointer) {
      laserPointer = document.createElement('div');
      laserPointer.className = 'laser-pointer';
      laserPointer.style.display = 'none';
      slideContainer.appendChild(laserPointer);
    }
    hideCustomCursor();
  } else if (laserPointer) {
    laserPointer.remove();
    laserPointer = null;
  }

  if (currentTool === 'pen' || currentTool === 'eraser') {
    showCustomCursor();
  } else {
    hideCustomCursor();
  }
}

function showCustomCursor() {
  if (!customCursor) {
    customCursor = document.createElement('div');
    customCursor.className = 'custom-cursor';
    slideContainer.appendChild(customCursor);
  }
  updateCustomCursor();
  customCursor.style.display = 'block';
}

function hideCustomCursor() {
  if (customCursor) customCursor.style.display = 'none';
}

function updateCustomCursor() {
  if (!customCursor) return;
  const size = currentTool === 'eraser' ? sizeSlider.value * 5 : sizeSlider.value;
  customCursor.style.width = size + 'px';
  customCursor.style.height = size + 'px';
  customCursor.className = 'custom-cursor ' + (currentTool || '');
  if (currentTool === 'pen') {
    customCursor.style.borderColor = colorPicker.value;
  }
}

document.addEventListener('mousemove', e => {
  if (currentTool === 'laser' && laserPointer) {
    const rect = slideContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    laserPointer.style.left = x + 'px';
    laserPointer.style.top = y + 'px';
    laserPointer.style.display = 'block';
  }

  if (customCursor && (currentTool === 'pen' || currentTool === 'eraser')) {
    const rect = slideContainer.getBoundingClientRect();
    customCursor.style.left = (e.clientX - rect.left) + 'px';
    customCursor.style.top = (e.clientY - rect.top) + 'px';
    customCursor.style.display = 'block';
  }
});

slideContainer.addEventListener('mouseleave', () => {
  if (laserPointer) laserPointer.style.display = 'none';
});

drawCanvas.addEventListener('mousedown', startDraw);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDraw);
drawCanvas.addEventListener('mouseout', stopDraw);

function startDraw(e) {
  if (!currentTool || currentTool === 'laser') return;
  isDrawing = true;
  const rect = drawCanvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing) return;

  const rect = drawCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawCtx.lineWidth = currentTool === 'eraser' ? sizeSlider.value * 5 : sizeSlider.value;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';

  if (currentTool === 'pen') {
    drawCtx.globalCompositeOperation = 'source-over';
    drawCtx.strokeStyle = colorPicker.value;
  } else if (currentTool === 'eraser') {
    drawCtx.globalCompositeOperation = 'destination-out';
  }

  drawCtx.beginPath();
  drawCtx.moveTo(lastX * (drawCanvas.width / rect.width), lastY * (drawCanvas.height / rect.height));
  drawCtx.lineTo(x * (drawCanvas.width / rect.width), y * (drawCanvas.height / rect.height));
  drawCtx.stroke();

  lastX = x;
  lastY = y;
}

function stopDraw() {
  if (isDrawing) {
    isDrawing = false;
    saveDrawing();
  }
}

function saveDrawing() {
  if (!drawHistory[currentPage]) drawHistory[currentPage] = [];
  drawHistory[currentPage].push({
    data: drawCanvas.toDataURL(),
    width: drawCanvas.width,
    height: drawCanvas.height
  });
}

function undo() {
  if (!drawHistory[currentPage] || drawHistory[currentPage].length === 0) return;
  drawHistory[currentPage].pop();
  restoreDrawing();
}

function clearDrawing() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawHistory[currentPage] = [];
}

function restoreDrawing() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  const history = drawHistory[currentPage];
  if (!history || history.length === 0) return;

  const latest = history[history.length - 1];
  const img = new Image();
  img.onload = () => {
    if (latest.width === drawCanvas.width && latest.height === drawCanvas.height) {
      drawCtx.drawImage(img, 0, 0);
    } else {
      const scaleX = drawCanvas.width / latest.width;
      const scaleY = drawCanvas.height / latest.height;
      drawCtx.drawImage(img, 0, 0, latest.width, latest.height, 0, 0, drawCanvas.width, drawCanvas.height);
    }
  };
  img.src = latest.data;
}

function syncDrawCanvas() {
  const oldWidth = drawCanvas.width;
  const oldHeight = drawCanvas.height;

  drawCanvas.width = mainCanvas.width;
  drawCanvas.height = mainCanvas.height;
  drawCanvas.style.width = mainCanvas.style.width;
  drawCanvas.style.height = mainCanvas.style.height;
  drawCanvas.style.left = mainCanvas.offsetLeft + 'px';
  drawCanvas.style.top = mainCanvas.offsetTop + 'px';

  restoreDrawing();
}

// ── File input ────────────────────────────────────────────────────────────────

fileInput.addEventListener('change', e => {
  if (e.target.files[0]) loadPDF(e.target.files[0]);
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
});

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop',     e => e.preventDefault());

// ── Load PDF ──────────────────────────────────────────────────────────────────

async function loadPDF(file) {
  try {
    const data = await file.arrayBuffer();
    pdfDoc      = await pdfjsLib.getDocument({ data }).promise;
    totalPages  = pdfDoc.numPages;
    currentPage = 1;

    uploadScreen.style.display       = 'none';
    presentationScreen.style.display = 'flex';

    thumbnailsEl.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) renderThumbnail(i);

    renderMainPage(currentPage);
  } catch (err) {
    alert('无法读取该 PDF 文件，请确认文件未损坏。');
    console.error(err);
  }
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

async function renderThumbnail(pageNum) {
  const page  = await pdfDoc.getPage(pageNum);
  const vp1   = page.getViewport({ scale: 1 });
  const scale = 160 / vp1.width;
  const vp    = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width  = vp.width;
  canvas.height = vp.height;

  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

  const div = document.createElement('div');
  div.className    = 'thumbnail';
  div.dataset.page = pageNum;
  if (pageNum === currentPage) div.classList.add('active');

  const num = document.createElement('span');
  num.className   = 'thumb-num';
  num.textContent = pageNum;

  div.appendChild(canvas);
  div.appendChild(num);
  div.addEventListener('click', () => goToPage(pageNum));
  thumbnailsEl.appendChild(div);
}

// ── Main render ───────────────────────────────────────────────────────────────

async function renderMainPage(pageNum) {
  if (renderTask) {
    renderTask.cancel();
    renderTask = null;
  }

  const page = await pdfDoc.getPage(pageNum);
  const vp1  = page.getViewport({ scale: 1 });

  const availW = slideContainer.clientWidth  - 48;
  const availH = slideContainer.clientHeight - 48;
  const scale  = Math.min(availW / vp1.width, availH / vp1.height);
  const vp     = page.getViewport({ scale });

  mainCanvas.width  = vp.width;
  mainCanvas.height = vp.height;

  renderTask = page.render({ canvasContext: ctx, viewport: vp });
  try {
    await renderTask.promise;
  } catch (e) {
    if (e.name !== 'RenderingCancelledException') console.error(e);
  }
  renderTask = null;

  syncDrawCanvas();
  updateUI();
}

// ── Navigation ────────────────────────────────────────────────────────────────

function goToPage(pageNum) {
  if (!pdfDoc || pageNum < 1 || pageNum > totalPages) return;
  currentPage = pageNum;
  renderMainPage(currentPage);
  highlightThumbnail(currentPage);
  scrollThumbIntoView(currentPage);
}

function highlightThumbnail(pageNum) {
  document.querySelectorAll('.thumbnail').forEach(t => {
    t.classList.toggle('active', +t.dataset.page === pageNum);
  });
}

function scrollThumbIntoView(pageNum) {
  const el = document.querySelector(`.thumbnail[data-page="${pageNum}"]`);
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function updateUI() {
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
fullscreenBtn.addEventListener('click', togglePresentation);

// ── Fullscreen ────────────────────────────────────────────────────────────────

let hintTimer = null;

async function togglePresentation() {
  if (!document.fullscreenElement) {
    await presentationScreen.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange', () => {
  const entering = !!document.fullscreenElement;
  presentationScreen.classList.toggle('presenting', entering);
  renderMainPage(currentPage);
  if (entering) {
    fullscreenHint.classList.add('visible');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => fullscreenHint.classList.remove('visible'), 2800);
    setTool('laser');
  } else {
    setTool(null);
  }
});

mainCanvas.addEventListener('click', e => {
  if (!document.fullscreenElement || currentTool) return;
  const mid = mainCanvas.getBoundingClientRect().left + mainCanvas.offsetWidth / 2;
  goToPage(e.clientX >= mid ? currentPage + 1 : currentPage - 1);
});

// ── Keyboard ──────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (!pdfDoc) return;
  if (e.key === 'F5') { e.preventDefault(); togglePresentation(); return; }
  if (e.key === 'p' || e.key === 'P') { setTool('pen'); return; }
  if (e.key === 'e' || e.key === 'E') { setTool('eraser'); return; }
  if (e.key === 'l' || e.key === 'L') { setTool('laser'); return; }
  if (e.key === 'c' || e.key === 'C') { clearDrawing(); return; }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      goToPage(currentPage - 1);
      break;
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
      e.preventDefault();
      goToPage(currentPage + 1);
      break;
    case 'Home': goToPage(1);          break;
    case 'End':  goToPage(totalPages); break;
  }
});

// ── Resize ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  if (pdfDoc) renderMainPage(currentPage);
});
