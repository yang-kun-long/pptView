<template>
  <div class="outline-panel" v-if="pdfStore.outline.length > 0">
    <div class="outline-header">
      <h3>目录</h3>
      <button class="outline-close" @click="emit('close')">✕</button>
    </div>
    <div class="outline-content">
      <OutlineItem
        v-for="(item, index) in pdfStore.outline"
        :key="index"
        :item="item"
        :level="0"
        @navigate="handleNavigate"
      />
    </div>
  </div>
  <div v-else class="outline-empty">
    <p>此 PDF 没有目录信息</p>
  </div>
</template>

<script setup>
import { usePdfStore } from '../stores/pdf'
import OutlineItem from './OutlineItem.vue'

const pdfStore = usePdfStore()
const emit = defineEmits(['close', 'navigate'])

async function handleNavigate(dest) {
  const pageNum = await pdfStore.getPageFromDest(dest)
  if (pageNum) {
    pdfStore.goToPage(pageNum)
    emit('navigate', pageNum)
  }
}
</script>

<style scoped>
.outline-panel {
  background: #16213e;
  border-radius: 8px;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1a1a2e;
  border-bottom: 1px solid #252545;
}

.outline-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
}

.outline-close {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.outline-close:hover {
  color: #fff;
}

.outline-content {
  overflow-y: auto;
  padding: 8px;
}

.outline-content::-webkit-scrollbar {
  width: 6px;
}

.outline-content::-webkit-scrollbar-track {
  background: transparent;
}

.outline-content::-webkit-scrollbar-thumb {
  background: #3a3a5a;
  border-radius: 3px;
}

.outline-empty {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}
</style>
