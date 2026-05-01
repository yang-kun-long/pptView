<template>
  <UploadScreen v-if="!pdfLoaded" @loaded="pdfLoaded = true" />
  <div v-else id="presentation-screen" :class="{ presenting: pdfStore.isPresenting }">
    <Sidebar />
    <div id="main-area">
      <SlideCanvas ref="canvasRef" />
      <Toolbar @undo="handleUndo" @clear="handleClear" @fullscreen="toggleFullscreen" />
    </div>
    <FloatingToolbar @clear="handleClear" />
    <div id="fullscreen-hint" :class="{ visible: showHint }">
      ESC 退出 &nbsp;·&nbsp; ← → 切换页面 &nbsp;·&nbsp; 点击左右翻页
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePdfStore } from './stores/pdf'
import UploadScreen from './components/UploadScreen.vue'
import Sidebar from './components/Sidebar.vue'
import Toolbar from './components/Toolbar.vue'
import SlideCanvas from './components/SlideCanvas.vue'
import FloatingToolbar from './components/FloatingToolbar.vue'

const pdfStore = usePdfStore()
const pdfLoaded = ref(false)
const canvasRef = ref(null)
const showHint = ref(false)
let hintTimer = null

function handleUndo() {
  if (canvasRef.value) {
    canvasRef.value.undo()
  }
}

function handleClear() {
  if (canvasRef.value) {
    canvasRef.value.clearDrawing()
  }
}

async function toggleFullscreen() {
  const screen = document.querySelector('#presentation-screen')
  if (!document.fullscreenElement) {
    await screen.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

function handleFullscreenChange() {
  const entering = !!document.fullscreenElement
  pdfStore.isPresenting = entering

  if (canvasRef.value) {
    canvasRef.value.renderPage()
  }

  if (entering) {
    showHint.value = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => showHint.value = false, 2800)
    // 全屏时默认选择激光笔
    pdfStore.setTool('laser')
  } else {
    // 退出全屏时取消工具选择
    pdfStore.setTool(null)
  }
}

function handleKeydown(e) {
  if (!pdfStore.pdfDoc) return

  if (e.key === 'F5') {
    e.preventDefault()
    toggleFullscreen()
    return
  }

  if (e.key === 'p' || e.key === 'P') {
    pdfStore.setTool('pen')
    return
  }

  if (e.key === 'e' || e.key === 'E') {
    pdfStore.setTool('eraser')
    return
  }

  if (e.key === 'l' || e.key === 'L') {
    pdfStore.setTool('laser')
    return
  }

  if (e.key === 'c' || e.key === 'C') {
    handleClear()
    return
  }

  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    handleUndo()
    return
  }

  switch (e.key) {
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault()
      pdfStore.prevPage()
      break
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      e.preventDefault()
      pdfStore.nextPage()
      break
    case 'ArrowUp':
      e.preventDefault()
      pdfStore.prevChapter()
      break
    case 'ArrowDown':
      e.preventDefault()
      pdfStore.nextChapter()
      break
    case 'Home':
      pdfStore.goToPage(1)
      break
    case 'End':
      pdfStore.goToPage(pdfStore.totalPages)
      break
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('dragover', e => e.preventDefault())
  document.addEventListener('drop', e => e.preventDefault())
})
</script>
