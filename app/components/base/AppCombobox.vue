<template>
  <div ref="rootEl" class="relative">
    <!-- Trigger button -->
    <button
      ref="triggerEl"
      type="button"
      class="group flex w-full items-center gap-2 rounded border px-3 py-2.5 text-left text-sm transition"
      :class="[
        open
          ? 'border-accent bg-surface-2'
          : 'border-border bg-surface-2 hover:border-accent/40',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      ]"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown.down.prevent="openAndFocusFirst"
      @keydown.up.prevent="openAndFocusLast"
      @keydown.escape="close"
    >
      <span class="min-w-0 flex-1 truncate" :class="modelValue != null ? 'text-text' : 'text-text-muted'">
        {{ displayLabel }}
      </span>

      <!-- Clear button -->
      <span
        v-if="clearable && modelValue != null"
        role="button"
        tabindex="-1"
        class="shrink-0 rounded p-0.5 text-text-muted transition hover:text-text"
        @click.stop="clearSelection"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </span>

      <!-- Chevron -->
      <span class="shrink-0 text-text-muted transition" :class="open && 'rotate-180'">
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <!-- Dropdown panel -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        class="fixed z-50 flex max-h-72 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        :style="panelStyle"
        role="listbox"
        @keydown.escape="close"
      >
        <!-- Search input -->
        <div class="border-b border-border px-3 py-2">
          <input
            ref="searchEl"
            v-model="search"
            type="text"
            class="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
            :placeholder="searchPlaceholder"
            @keydown.down.prevent="focusNext"
            @keydown.up.prevent="focusPrev"
            @keydown.enter.prevent="selectFocused"
            @keydown.escape="close"
          >
        </div>

        <!-- Options list -->
        <div class="flex-1 overflow-y-auto py-1">
          <div
            v-if="clearable && !search"
            class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition"
            :class="focusedIndex === -1 ? 'bg-accent/10 text-text' : 'text-text-muted hover:bg-surface-2'"
            @mouseenter="focusedIndex = -1"
            @click="clearSelection"
          >
            <span class="flex-1">{{ emptyLabel }}</span>
            <svg
              v-if="modelValue == null"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-accent"
            ><polyline points="20 6 9 17 4 12" /></svg>
          </div>

          <template v-if="groupedOptions.length">
            <template v-for="group in groupedOptions" :key="group.label ?? '__ungrouped'">
              <div v-if="group.label" class="px-3 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {{ group.label }}
              </div>

              <div
                v-for="(option, idx) in group.items"
                :key="option.value"
                class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition"
                :class="flatIndex(group, idx) === focusedIndex ? 'bg-accent/10 text-text' : 'text-text hover:bg-surface-2'"
                @mouseenter="focusedIndex = flatIndex(group, idx)"
                @click="selectOption(option)"
              >
                <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
                <span v-if="option.hint" class="shrink-0 text-xs text-text-muted">{{ option.hint }}</span>
                <svg
                  v-if="option.value === modelValue"
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-accent"
                ><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </template>
          </template>

          <div v-else class="px-3 py-4 text-center text-sm text-text-muted">
            {{ noResultsText }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
export interface ComboboxOption {
  value: string | number
  label: string
  hint?: string
  group?: string
}

interface OptionGroup {
  label: string | null
  items: ComboboxOption[]
}

const props = withDefaults(defineProps<{
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  noResultsText?: string
  clearable?: boolean
  disabled?: boolean
}>(), {
  placeholder: 'Seleccionar',
  searchPlaceholder: 'Buscar...',
  emptyLabel: 'Ninguno',
  noResultsText: 'Sin resultados',
  clearable: false,
  disabled: false,
})

const modelValue = defineModel<string | number | null>({ default: null })

const open = ref(false)
const search = ref('')
const focusedIndex = ref(0)

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const displayLabel = computed(() => {
  if (modelValue.value == null) return props.placeholder
  const match = props.options.find((o) => o.value === modelValue.value)
  return match ? match.label : props.placeholder
})

// Filter options by search term
const filteredOptions = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return props.options
  return props.options.filter((o) =>
    o.label.toLowerCase().includes(term)
    || o.hint?.toLowerCase().includes(term)
    || o.group?.toLowerCase().includes(term)
  )
})

// Group filtered options
const groupedOptions = computed<OptionGroup[]>(() => {
  const filtered = filteredOptions.value
  const groups: Map<string | null, ComboboxOption[]> = new Map()

  for (const option of filtered) {
    const key = option.group ?? null
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(option)
  }

  const result: OptionGroup[] = []
  for (const [label, items] of groups) {
    result.push({ label, items })
  }

  return result
})

// Total flat items count (for keyboard navigation)
const flatItems = computed(() => groupedOptions.value.flatMap((g) => g.items))

function flatIndex(group: OptionGroup, idxInGroup: number): number {
  let count = 0
  for (const g of groupedOptions.value) {
    if (g === group) return count + idxInGroup
    count += g.items.length
  }
  return count + idxInGroup
}

// Position the panel beneath the trigger
function positionPanel() {
  if (!triggerEl.value) return
  const rect = triggerEl.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const maxHeight = 288 // max-h-72

  const top = spaceBelow >= maxHeight || spaceBelow >= rect.top
    ? rect.bottom + 4
    : rect.top - maxHeight - 4

  panelStyle.value = {
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  if (props.disabled) return
  open.value ? close() : openDropdown()
}

function openDropdown() {
  open.value = true
  search.value = ''
  focusedIndex.value = 0
  positionPanel()

  nextTick(() => {
    positionPanel()
    searchEl.value?.focus()
  })
}

function openAndFocusFirst() {
  if (!open.value) openDropdown()
  focusedIndex.value = 0
}

function openAndFocusLast() {
  if (!open.value) openDropdown()
  focusedIndex.value = flatItems.value.length - 1
}

function close() {
  open.value = false
  search.value = ''
  triggerEl.value?.focus()
}

function selectOption(option: ComboboxOption) {
  modelValue.value = option.value
  close()
}

function clearSelection() {
  modelValue.value = null
  close()
}

function selectFocused() {
  if (focusedIndex.value === -1 && props.clearable) {
    clearSelection()
    return
  }

  const item = flatItems.value[focusedIndex.value]
  if (item) selectOption(item)
}

function focusNext() {
  const max = flatItems.value.length - 1
  if (focusedIndex.value < max) focusedIndex.value++
}

function focusPrev() {
  const min = props.clearable ? -1 : 0
  if (focusedIndex.value > min) focusedIndex.value--
}

// Click outside to close
function onClickOutside(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (rootEl.value?.contains(target)) return
  if (panelEl.value?.contains(target)) return
  close()
}

// Reposition on scroll/resize
function onReposition() {
  if (open.value) positionPanel()
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('resize', onReposition)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})

// Reset focused index when search changes
watch(search, () => {
  focusedIndex.value = 0
})
</script>
