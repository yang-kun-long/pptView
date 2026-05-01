<template>
  <button
    id="floating-toggle"
    :style="toggleStyle"
    @click="handleToggleClick"
    @mousedown="startDrag"
  >
    🎨
  </button>
  <div
    id="floating-toolbar"
    :class="{ expanded: isExpanded, 'expand-upward': expandUpward }"
    :style="toolbarStyle"
  >
    <button
      class="ftool-btn"
      :class="{ active: pdfStore.currentTool === 'pen' }"
      @click="pdfStore.setTool('pen')"
      title="画笔 (P)"
    >
      🖊️
    </button>
    <button
      class="ftool-btn"
      :class="{ active: pdfStore.currentTool === 'eraser' }"
      @click="pdfStore.setTool('eraser')"
      title="橡皮擦 (E)"
    >
      🧹
    </button>
    <button
      class="ftool-btn"
      :class="{ active: pdfStore.currentTool === 'laser' }"
      @click="pdfStore.setTool('laser')"
      title="激光笔 (L)"
    >
      🔴
    </button>
    <div class="ftool-sep"></div>
    <input type="color" id="fcolor-picker" v-model="pdfStore.penColor" title="颜色">
    <input
      type="range"
      id="fsize-slider"
      v-model.number="pdfStore.penSize"
      min="2"
      max="20"
      title="粗细"
      orient="vertical"
    >
    <div class="ftool-sep"></div>
    <button class="ftool-btn" @click="emit('clear')" title="清空 (C)">🗑️</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePdfStore } from '../stores/pdf'

const pdfStore = usePdfStore()
const emit = defineEmits(['clear'])

const isExpanded = ref(false)
const isDragging = ref(false)
const position = ref({ left: null, top: null, right: '20px', bottom: '80px' })
const dragOffset = ref({ x: 0, y: 0 })
const expandUpward = ref(false)  // 是否向上展开

const toggleStyle = computed(() => ({
  left: position.value.left,
  top: position.value.top,
  right: position.value.right,
  bottom: position.value.bottom
}))

const toolbarStyle = computed(() => ({
  left: position.value.left,
  top: position.value.top,
  right: position.value.right,
  bottom: position.value.bottom
}))

function handleToggleClick(e) {
  if (!isDragging.value) {
    isExpanded.value = !isExpanded.value

    // 判断展开方向：如果按钮在屏幕下半部分，向上展开
    if (isExpanded.value) {
      const toggle = e.currentTarget
      const rect = toggle.getBoundingClientRect()
      const windowHeight = window.innerHeight
      expandUpward.value = rect.bottom > windowHeight / 2
    }
  }
}

function startDrag(e) {
  isDragging.value = false
  const toggle = e.currentTarget
  const rect = toggle.getBoundingClientRect()
  dragOffset.value.x = e.clientX - rect.left
  dragOffset.value.y = e.clientY - rect.top

  const onMove = (e) => {
    isDragging.value = true
    position.value = {
      left: (e.clientX - dragOffset.value.x) + 'px',
      top: (e.clientY - dragOffset.value.y) + 'px',
      right: 'auto',
      bottom: 'auto'
    }
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    setTimeout(() => isDragging.value = false, 100)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>
