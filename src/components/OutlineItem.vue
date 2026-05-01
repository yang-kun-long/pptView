<template>
  <div class="outline-item" :style="{ paddingLeft: (level * 16 + 8) + 'px' }">
    <div class="outline-title" @click="handleClick">
      <span v-if="item.items && item.items.length > 0" class="outline-toggle" @click.stop="toggleExpand">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span class="outline-text">{{ item.title }}</span>
    </div>
    <div v-if="isExpanded && item.items" class="outline-children">
      <OutlineItem
        v-for="(child, index) in item.items"
        :key="index"
        :item="child"
        :level="level + 1"
        @navigate="$emit('navigate', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['navigate'])
const isExpanded = ref(props.level === 0)  // 第一层默认展开

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleClick() {
  if (props.item.dest) {
    emit('navigate', props.item.dest)
  }
}
</script>

<style scoped>
.outline-item {
  margin: 2px 0;
}

.outline-title {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  color: #ccc;
  font-size: 13px;
}

.outline-title:hover {
  background: #252545;
  color: #fff;
}

.outline-toggle {
  width: 16px;
  font-size: 10px;
  color: #888;
  margin-right: 4px;
  user-select: none;
}

.outline-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-children {
  margin-left: 0;
}
</style>
