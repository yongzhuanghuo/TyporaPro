<template>
  <footer class="typora-status-bar">
    <div class="status-metrics">
      <span>{{ formatCountValue(wordCount?.word ?? 0) }} {{ t('menu.counter.words') }}</span>
      <span>{{ formatCountValue(wordCount?.character ?? 0) }} {{ t('menu.counter.characters') }}</span>
      <span>{{ formatCountValue(wordCount?.paragraph ?? 0) }} {{ t('menu.counter.paragraphs') }}</span>
    </div>
    <button
      type="button"
      class="plain-button status-source-toggle"
      :class="{ active: sourceCode }"
      :disabled="readOnly"
      :aria-pressed="sourceCode"
      @click="emit('toggle-source')"
    >
      {{ t('menu.view.sourceCodeMode') }}
    </button>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FileWordCount } from '@shared/types/files'
import { formatCount } from '@/components/titleBar/documentStatisticsFormat'

defineProps<{
  wordCount?: FileWordCount | null
  sourceCode: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  'toggle-source': []
}>()

const { t, locale } = useI18n()

const formatCountValue = (value: number): string => formatCount(value, locale.value)
</script>

<style scoped>
.typora-status-bar {
  display: flex;
  flex: 0 0 26px;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  height: 26px;
  padding: 0 12px;
  border-top: 1px solid var(--editorColor10);
  background: var(--editorBgColor);
  color: var(--editorColor50);
  font-size: 12px;
  user-select: none;
}

.status-metrics {
  display: flex;
  gap: 16px;
}

.status-source-toggle {
  padding: 0 4px;
  color: var(--editorColor50);
  font-size: 12px;
}

.status-source-toggle:hover,
.status-source-toggle.active {
  color: var(--themeColor);
}

.status-source-toggle:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
