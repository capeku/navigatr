<script setup lang="ts">
import type { AutocompleteResult } from '@navigatr/web'

const { getNavigatr } = useNavigatr()

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [result: AutocompleteResult]
}>()

const inputValue = ref(props.modelValue)
const suggestions = ref<AutocompleteResult[]>([])
const isOpen = ref(false)
const isLoading = ref(false)
const activeIndex = ref(-1)
const isSelecting = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

watch(inputValue, (val) => {
  emit('update:modelValue', val)
  clearTimeout(debounceTimer)

  // Don't search when selecting a suggestion
  if (isSelecting.value) {
    isSelecting.value = false
    return
  }

  if (val.length < 2) {
    suggestions.value = []
    isOpen.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    isLoading.value = true
    try {
      const nav = await getNavigatr()
      suggestions.value = await nav.autocomplete({ query: val, limit: 5 })
      isOpen.value = suggestions.value.length > 0
      activeIndex.value = -1
    } catch {
      suggestions.value = []
    } finally {
      isLoading.value = false
    }
  }, 300)
})

function selectSuggestion(suggestion: AutocompleteResult) {
  isSelecting.value = true
  inputValue.value = suggestion.name || suggestion.displayName
  emit('update:modelValue', inputValue.value)
  emit('select', suggestion)
  isOpen.value = false
  suggestions.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value >= 0) {
        selectSuggestion(suggestions.value[activeIndex.value])
      }
      break
    case 'Escape':
      isOpen.value = false
      break
  }
}

function handleBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}

async function triggerSearch() {
  if (inputValue.value.length < 2) return

  isLoading.value = true
  try {
    const nav = await getNavigatr()
    suggestions.value = await nav.autocomplete({ query: inputValue.value, limit: 5 })
    isOpen.value = suggestions.value.length > 0
    activeIndex.value = -1
  } catch {
    suggestions.value = []
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="address-search">
    <div class="input-wrapper">
      <input
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        @keydown="handleKeydown"
        @focus="isOpen = suggestions.length > 0"
        @blur="handleBlur"
      >
      <button
        v-if="inputValue && !isLoading"
        class="search-btn"
        @mousedown.prevent="triggerSearch"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </button>
      <span v-if="isLoading" class="loading-dot"></span>
    </div>

    <div v-if="isOpen && suggestions.length > 0" class="suggestions">
      <button
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="suggestion-item"
        :class="{ active: index === activeIndex }"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        <span class="suggestion-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
        <span class="suggestion-text">
          <span class="suggestion-name">{{ suggestion.name || suggestion.displayName.split(',')[0] }}</span>
          <span class="suggestion-detail">{{ suggestion.city ? `${suggestion.city}, ${suggestion.country}` : suggestion.country }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-search {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 10px 12px;
  padding-right: 36px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #111;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.input-wrapper input::placeholder {
  color: #888;
}

.input-wrapper input:focus {
  outline: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.search-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent, #00FF94);
  border: none;
  border-radius: 6px;
  color: #111;
  cursor: pointer;
  transition: opacity 0.15s;
}

.search-btn:hover {
  opacity: 0.85;
}

.loading-dot {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--accent, #00FF94);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 50;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: rgba(0, 255, 148, 0.1);
}

.suggestion-icon {
  flex-shrink: 0;
  color: #666;
}

.suggestion-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.suggestion-name {
  font-size: 12px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-detail {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
