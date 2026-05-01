<template>
  <div id="upload-screen">
    <div
      id="drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <div class="upload-icon">📄</div>
      <p class="upload-title">拖拽 PDF 文件到此处</p>
      <p class="upload-sub">或</p>
      <label for="file-input" class="btn">选择文件</label>
      <input
        type="file"
        id="file-input"
        accept=".pdf"
        hidden
        @change="handleFileInput"
      >
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePdfStore } from '../stores/pdf'

const emit = defineEmits(['loaded'])
const pdfStore = usePdfStore()
const isDragOver = ref(false)

async function handleFileInput(e) {
  const file = e.target.files[0]
  if (file) await loadFile(file)
}

async function handleDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    await loadFile(file)
  }
}

async function loadFile(file) {
  const success = await pdfStore.loadPDF(file)
  if (success) {
    emit('loaded')
  } else {
    alert('无法读取该 PDF 文件，请确认文件未损坏。')
  }
}
</script>
