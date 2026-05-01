<template>
  <div id="slide-container" ref="containerRef" @mousemove="updateCursorPosition" @mouseleave="handleMouseLeave">
    <canvas ref="mainCanvasRef" id="main-canvas"></canvas>
    <canvas
      ref="drawCanvasRef"
      id="draw-canvas"
      :class="{
        active: pdfStore.currentTool && pdfStore.currentTool !== 'laser',
        eraser: pdfStore.currentTool === 'eraser',
        laser: pdfStore.currentTool === 'laser'
      }"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="stopDraw"
      @mouseout="stopDraw"
      @click="handleCanvasClick"
    ></canvas>
    <div
      v-if="pdfStore.currentTool === 'laser'"
      class="laser-pointer"
      :style="laserStyle"
    ></div>
    <div
      v-if="pdfStore.currentTool === 'pen' || pdfStore.currentTool === 'eraser'"
      class="custom-cursor"
      :class="pdfStore.currentTool"
      :style="cursorStyle"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { usePdfStore } from '../stores/pdf'

const pdfStore = usePdfStore()
const containerRef = ref(null)
const mainCanvasRef = ref(null)
const drawCanvasRef = ref(null)

const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const laserPos = ref({ x: 0, y: 0, visible: false })
const cursorPos = ref({ x: 0, y: 0 })
let currentRenderTask = null  // 不使用 ref，避免响应式包装

const laserStyle = computed(() => ({
  left: laserPos.value.x + 'px',
  top: laserPos.value.y + 'px',
  display: laserPos.value.visible ? 'block' : 'none'
}))

const cursorStyle = computed(() => {
  const size = pdfStore.currentTool === 'eraser' ? pdfStore.penSize * 5 : pdfStore.penSize
  return {
    left: cursorPos.value.x + 'px',
    top: cursorPos.value.y + 'px',
    width: size + 'px',
    height: size + 'px',
    borderColor: pdfStore.currentTool === 'pen' ? pdfStore.penColor : undefined,
    display: 'block'
  }
})

async function renderPage() {
  if (!mainCanvasRef.value || !pdfStore.pdfDoc) return

  // 取消之前的渲染任务
  if (currentRenderTask) {
    currentRenderTask.cancel()
    currentRenderTask = null
  }

  const page = await pdfStore.getPage(pdfStore.currentPage)
  const vp1 = page.getViewport({ scale: 1 })

  const availW = containerRef.value.clientWidth - 48
  const availH = containerRef.value.clientHeight - 48
  const scale = Math.min(availW / vp1.width, availH / vp1.height)
  const vp = page.getViewport({ scale })

  mainCanvasRef.value.width = vp.width
  mainCanvasRef.value.height = vp.height
  mainCanvasRef.value.style.width = vp.width + 'px'
  mainCanvasRef.value.style.height = vp.height + 'px'

  const ctx = mainCanvasRef.value.getContext('2d')
  currentRenderTask = page.render({ canvasContext: ctx, viewport: vp })

  try {
    await currentRenderTask.promise
  } catch (e) {
    if (e.name !== 'RenderingCancelledException') {
      console.error(e)
    }
  }
  currentRenderTask = null

  syncDrawCanvas()
}

function syncDrawCanvas() {
  const drawCanvas = drawCanvasRef.value
  const mainCanvas = mainCanvasRef.value

  drawCanvas.width = mainCanvas.width
  drawCanvas.height = mainCanvas.height
  drawCanvas.style.width = mainCanvas.style.width
  drawCanvas.style.height = mainCanvas.style.height
  drawCanvas.style.left = mainCanvas.offsetLeft + 'px'
  drawCanvas.style.top = mainCanvas.offsetTop + 'px'

  restoreDrawing()
}

function restoreDrawing() {
  const drawCanvas = drawCanvasRef.value
  const ctx = drawCanvas.getContext('2d')
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height)

  const history = pdfStore.getDrawingHistory(pdfStore.currentPage)
  if (history.length === 0) return

  const latest = history[history.length - 1]
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, latest.width, latest.height, 0, 0, drawCanvas.width, drawCanvas.height)
  }
  img.src = latest.data
}

function startDraw(e) {
  if (!pdfStore.currentTool || pdfStore.currentTool === 'laser') return
  isDrawing.value = true
  const rect = drawCanvasRef.value.getBoundingClientRect()
  lastX.value = e.clientX - rect.left
  lastY.value = e.clientY - rect.top
}

function draw(e) {
  if (!isDrawing.value) return

  const drawCanvas = drawCanvasRef.value
  const ctx = drawCanvas.getContext('2d')
  const rect = drawCanvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  ctx.lineWidth = pdfStore.currentTool === 'eraser' ? pdfStore.penSize * 5 : pdfStore.penSize
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (pdfStore.currentTool === 'pen') {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = pdfStore.penColor
  } else if (pdfStore.currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
  }

  ctx.beginPath()
  ctx.moveTo(lastX.value * (drawCanvas.width / rect.width), lastY.value * (drawCanvas.height / rect.height))
  ctx.lineTo(x * (drawCanvas.width / rect.width), y * (drawCanvas.height / rect.height))
  ctx.stroke()

  lastX.value = x
  lastY.value = y
}

function stopDraw() {
  if (isDrawing.value) {
    isDrawing.value = false
    const drawCanvas = drawCanvasRef.value
    pdfStore.saveDrawing(drawCanvas.toDataURL(), drawCanvas.width, drawCanvas.height)
  }
}

function updateCursorPosition(e) {
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  if (pdfStore.currentTool === 'laser') {
    laserPos.value = { x, y, visible: true }
  } else if (pdfStore.currentTool === 'pen' || pdfStore.currentTool === 'eraser') {
    cursorPos.value = { x, y }
  }
}

function handleCanvasClick(e) {
  if (!pdfStore.isPresenting || pdfStore.currentTool) return
  const mid = mainCanvasRef.value.getBoundingClientRect().left + mainCanvasRef.value.offsetWidth / 2
  if (e.clientX >= mid) {
    pdfStore.nextPage()
  } else {
    pdfStore.prevPage()
  }
}

function handleMouseLeave() {
  laserPos.value.visible = false
}

watch(() => pdfStore.currentPage, () => {
  renderPage()
})

watch(() => pdfStore.totalPages, () => {
  if (pdfStore.totalPages > 0) {
    nextTick(() => renderPage())
  }
})

onMounted(() => {
  window.addEventListener('resize', renderPage)

  // 如果 PDF 已经加载，立即渲染
  if (pdfStore.pdfDoc) {
    nextTick(() => renderPage())
  }
})

defineExpose({ renderPage, undo: () => {
  pdfStore.undo()
  restoreDrawing()
}, clearDrawing: () => {
  pdfStore.clearDrawing()
  const ctx = drawCanvasRef.value.getContext('2d')
  ctx.clearRect(0, 0, drawCanvasRef.value.width, drawCanvasRef.value.height)
}})
</script>
