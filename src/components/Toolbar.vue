<template>
  <div id="toolbar">
    <button
      class="tool-btn"
      id="pen-btn"
      :class="{ active: pdfStore.currentTool === 'pen' }"
      @click="pdfStore.setTool('pen')"
      title="画笔 (P)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
      </svg>
    </button>
    <button
      class="tool-btn"
      id="eraser-btn"
      :class="{ active: pdfStore.currentTool === 'eraser' }"
      @click="pdfStore.setTool('eraser')"
      title="橡皮擦 (E)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 20H7L3 16l10-10 8 8-1 6z"/><path d="M16 2l6 6"/>
      </svg>
    </button>
    <button
      class="tool-btn"
      id="laser-btn"
      :class="{ active: pdfStore.currentTool === 'laser' }"
      @click="pdfStore.setTool('laser')"
      title="激光笔 (L)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
      </svg>
    </button>
    <div class="tool-sep"></div>
    <input
      type="color"
      id="color-picker"
      v-model="pdfStore.penColor"
      title="颜色"
    >
    <input
      type="range"
      id="size-slider"
      v-model.number="pdfStore.penSize"
      min="2"
      max="20"
      title="粗细"
    >
    <div class="tool-sep"></div>
    <button class="tool-btn" id="undo-btn" @click="emit('undo')" title="撤销 (Ctrl+Z)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-9 9"/>
      </svg>
    </button>
    <button class="tool-btn" id="clear-btn" @click="emit('clear')" title="清空 (C)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
    </button>
  </div>
  <div id="controls">
    <button class="nav-btn" id="prev-btn" :disabled="!pdfStore.canGoPrev"
      @click="pdfStore.prevPage()"
      title="上一页 (←)"
    >
      ←
    </button>
    <span id="page-info">{{ pdfStore.pageInfo }}</span>
    <button class="nav-btn" id="next-btn" :disabled="!pdfStore.canGoNext"
      @click="pdfStore.nextPage()"
      title="下一页 (→)"
    >
      →
    </button>
    <div class="ctrl-sep"></div>
    <button class="nav-btn" id="fullscreen-btn" @click="emit('fullscreen')" title="全屏播放 (F5)">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M1 5V1h4M10 1h4v4M14 10v4h-4M5 14H1v-4"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { usePdfStore } from '../stores/pdf'

const pdfStore = usePdfStore()
const emit = defineEmits(['undo', 'clear', 'fullscreen'])
</script>
