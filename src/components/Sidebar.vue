<template>
  <div id="sidebar">
    <div id="thumbnails">
      <template v-for="(section, index) in sectionsWithPages" :key="'section-' + index">
        <div v-if="section.title" class="section-header" @click="toggleSection(index)">
          <span class="section-toggle">{{ section.collapsed ? '▶' : '▼' }}</span>
          <span class="section-title">{{ section.title }}</span>
        </div>
        <template v-if="!section.collapsed">
          <div
            v-for="pageNum in section.pages"
            :key="'page-' + pageNum"
            class="thumbnail"
            :class="{ active: pageNum === pdfStore.currentPage }"
            @click="pdfStore.goToPage(pageNum)"
          >
            <canvas :ref="el => setThumbnailRef(el, pageNum)"></canvas>
            <span class="thumb-num">{{ pageNum }}</span>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import { usePdfStore } from '../stores/pdf'

const pdfStore = usePdfStore()
const thumbnailRefs = ref({})
const sectionsWithPages = ref([])

function setThumbnailRef(el, pageNum) {
  if (el) thumbnailRefs.value[pageNum] = el
}

async function buildSections() {
  console.log('Building sections, outline:', pdfStore.outline)

  if (!pdfStore.outline || pdfStore.outline.length === 0) {
    sectionsWithPages.value = [{
      title: null,
      pages: Array.from({ length: pdfStore.totalPages }, (_, i) => i + 1),
      collapsed: false
    }]
    return
  }

  const result = []
  const chapterPages = []

  // 获取第一层大纲的页码
  for (const item of pdfStore.outline) {
    if (item.dest) {
      const pageNum = await pdfStore.getPageFromDest(item.dest)
      console.log('Chapter:', item.title, 'Page:', pageNum)
      if (pageNum) {
        chapterPages.push({ title: item.title, pageNum })
      }
    }
  }

  if (chapterPages.length === 0) {
    sectionsWithPages.value = [{
      title: null,
      pages: Array.from({ length: pdfStore.totalPages }, (_, i) => i + 1),
      collapsed: false
    }]
    return
  }

  // 按页码排序
  chapterPages.sort((a, b) => a.pageNum - b.pageNum)

  // 构建章节
  for (let i = 0; i < chapterPages.length; i++) {
    const startPage = chapterPages[i].pageNum
    const endPage = i < chapterPages.length - 1 ? chapterPages[i + 1].pageNum - 1 : pdfStore.totalPages
    const pages = []
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p)
    }
    result.push({
      title: chapterPages[i].title,
      pages,
      collapsed: false
    })
  }

  console.log('Built sections:', result)
  sectionsWithPages.value = result
}

function toggleSection(index) {
  sectionsWithPages.value[index].collapsed = !sectionsWithPages.value[index].collapsed

  // 如果是展开操作，重新渲染该章节的缩略图
  if (!sectionsWithPages.value[index].collapsed) {
    setTimeout(() => {
      const pages = sectionsWithPages.value[index].pages
      pages.forEach(pageNum => {
        renderThumbnail(pageNum)
      })
    }, 50)
  }
}

async function renderThumbnail(pageNum) {
  const canvas = thumbnailRefs.value[pageNum]
  if (!canvas) return

  const page = await pdfStore.getPage(pageNum)
  const vp1 = page.getViewport({ scale: 1 })
  const scale = 160 / vp1.width
  const vp = page.getViewport({ scale })

  canvas.width = vp.width
  canvas.height = vp.height

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport: vp
  }).promise
}

watch(() => pdfStore.totalPages, async () => {
  if (pdfStore.totalPages > 0) {
    await buildSections()
    // 渲染所有缩略图
    for (let i = 1; i <= pdfStore.totalPages; i++) {
      await renderThumbnail(i)
    }
  }
})

watch(() => pdfStore.currentPage, (newPage) => {
  const el = document.querySelector(`.thumbnail.active`)
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

onMounted(async () => {
  if (pdfStore.totalPages > 0) {
    await buildSections()
    for (let i = 1; i <= pdfStore.totalPages; i++) {
      await renderThumbnail(i)
    }
  }
})
</script>
