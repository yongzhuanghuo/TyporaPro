<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import '@marktext/file-icons/build/index.css'
import { usePreferencesStore } from '@/store/preferences'
import { hasTyporaTheme, isTyporaTheme } from '@/util/typoraTheme'
import { getFileIconClasses } from './fileIconClass'

const props = defineProps<{
  name: string
}>()

const className = computed<string[]>(() => getFileIconClasses(props.name))
const { theme } = storeToRefs(usePreferencesStore())
const typoraTheme = computed(() => isTyporaTheme(theme.value) && hasTyporaTheme(theme.value))
</script>

<template>
  <span
    v-if="typoraTheme"
    class="file-icon ty-file-icon ty-fi-markdown"
  />
  <span
    v-else
    :class="className"
    class="file-icon"
  />
</template>

<style scoped>
.file-icon {
  flex-shrink: 0;
  margin-right: 5px;
}
</style>
