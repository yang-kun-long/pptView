import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

// 使用全局的 pdfjsLib（通过 script 标签加载）
const pdfjsLib = window['pdfjs-dist/build/pdf']
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export const usePdfStore = defineStore('pdf', () => {
  const pdfDoc = shallowRef(null)  // 使用 shallowRef 避免深度响应式
  const currentPage = ref(1)
  const totalPages = ref(0)
  const renderTask = shallowRef(null)
  const drawHistory = ref({})
  const outline = ref([])  // PDF 目录大纲

  const currentTool = ref(null)
  const penColor = ref('#ff3b30')
  const penSize = ref(11)  // 默认中值 (2-20 的中间值)
  const isDrawing = ref(false)

  const isPresenting = ref(false)

  async function loadPDF(file) {
    try {
      const data = await file.arrayBuffer()
      pdfDoc.value = await pdfjsLib.getDocument({ data }).promise
      totalPages.value = pdfDoc.value.numPages
      currentPage.value = 1
      drawHistory.value = {}

      // 加载 PDF 大纲
      try {
        const pdfOutline = await pdfDoc.value.getOutline()
        outline.value = pdfOutline || []
      } catch (e) {
        console.warn('Failed to load PDF outline:', e)
        outline.value = []
      }

      return true
    } catch (err) {
      console.error('Failed to load PDF:', err)
      return false
    }
  }

  async function getPage(pageNum) {
    if (!pdfDoc.value) return null
    return await pdfDoc.value.getPage(pageNum)
  }

  function goToPage(pageNum) {
    if (!pdfDoc.value || pageNum < 1 || pageNum > totalPages.value) return
    currentPage.value = pageNum
  }

  function nextPage() {
    goToPage(currentPage.value + 1)
  }

  function prevPage() {
    goToPage(currentPage.value - 1)
  }

  function prevChapter() {
    // 找到当前页所在章节的上一个章节
    if (!outline.value || outline.value.length === 0) {
      // 没有章节，直接上一页
      prevPage()
      return
    }

    // 异步获取章节页码并跳转
    ;(async () => {
      const pages = []
      for (const item of outline.value) {
        if (item.dest) {
          const pageNum = await getPageFromDest(item.dest)
          if (pageNum) pages.push(pageNum)
        }
      }

      if (pages.length === 0) {
        prevPage()
        return
      }

      pages.sort((a, b) => a - b)
      console.log('All chapter pages:', pages, 'Current page:', currentPage.value)

      // 找到当前页之前的最近章节
      let targetPage = 1
      for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i] < currentPage.value) {
          targetPage = pages[i]
          break
        }
      }
      console.log('Prev chapter target:', targetPage)
      goToPage(targetPage)
    })()
  }

  function nextChapter() {
    // 找到当前页所在章节的下一个章节
    if (!outline.value || outline.value.length === 0) {
      // 没有章节，直接下一页
      nextPage()
      return
    }

    // 异步获取章节页码并跳转
    ;(async () => {
      const pages = []
      for (const item of outline.value) {
        if (item.dest) {
          const pageNum = await getPageFromDest(item.dest)
          if (pageNum) pages.push(pageNum)
        }
      }

      if (pages.length === 0) {
        nextPage()
        return
      }

      pages.sort((a, b) => a - b)
      console.log('All chapter pages:', pages, 'Current page:', currentPage.value)

      // 找到当前页之后的最近章节
      let targetPage = totalPages.value
      for (let i = 0; i < pages.length; i++) {
        if (pages[i] > currentPage.value) {
          targetPage = pages[i]
          break
        }
      }
      console.log('Next chapter target:', targetPage)
      goToPage(targetPage)
    })()
  }

  function setTool(tool) {
    currentTool.value = currentTool.value === tool ? null : tool
  }

  function saveDrawing(dataURL, width, height) {
    const page = currentPage.value
    if (!drawHistory.value[page]) {
      drawHistory.value[page] = []
    }
    drawHistory.value[page].push({ data: dataURL, width, height })
  }

  function undo() {
    const page = currentPage.value
    if (drawHistory.value[page] && drawHistory.value[page].length > 0) {
      drawHistory.value[page].pop()
      return true
    }
    return false
  }

  function clearDrawing() {
    const page = currentPage.value
    drawHistory.value[page] = []
  }

  function getDrawingHistory(pageNum) {
    return drawHistory.value[pageNum] || []
  }

  async function getPageFromDest(dest) {
    if (!pdfDoc.value) return null
    try {
      const destArray = typeof dest === 'string' ? await pdfDoc.value.getDestination(dest) : dest
      if (!destArray) return null
      const pageRef = destArray[0]
      const pageIndex = await pdfDoc.value.getPageIndex(pageRef)
      return pageIndex + 1  // 返回页码（从 1 开始）
    } catch (e) {
      console.error('Failed to get page from destination:', e)
      return null
    }
  }

  const canGoPrev = computed(() => currentPage.value > 1)
  const canGoNext = computed(() => currentPage.value < totalPages.value)
  const pageInfo = computed(() => `${currentPage.value} / ${totalPages.value}`)

  return {
    pdfDoc,
    currentPage,
    totalPages,
    renderTask,
    drawHistory,
    outline,
    currentTool,
    penColor,
    penSize,
    isDrawing,
    isPresenting,
    loadPDF,
    getPage,
    goToPage,
    nextPage,
    prevPage,
    nextChapter,
    prevChapter,
    setTool,
    saveDrawing,
    undo,
    clearDrawing,
    getDrawingHistory,
    getPageFromDest,
    canGoPrev,
    canGoNext,
    pageInfo
  }
})
