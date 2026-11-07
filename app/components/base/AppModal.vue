<template>
  <Teleport to="body">
    <dialog ref="dialog" :aria-label="label" class="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-text backdrop:bg-black/70" @cancel.prevent="emit('close')" @click.self="emit('close')">
      <div class="flex h-full items-center justify-center sm:px-4 sm:py-6" @click.self="emit('close')">
        <div class="mobile-modal-panel flex h-full max-h-full w-full min-w-0 flex-col overflow-hidden border border-border bg-surface shadow-lg sm:h-auto sm:max-h-[90dvh] sm:rounded-xl" :class="sizeClass"><slot /></div>
      </div>
    </dialog>
  </Teleport>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; label?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' }>(), { size: '4xl', label: 'Ventana de edición' })
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
useBodyScrollLock(() => props.open)
const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl' }
const sizeClass = computed(() => sizeClasses[props.size])
watch([() => props.open, dialog], ([open, element]) => {
  if (!element) return
  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
}, { flush: 'post' })
onBeforeUnmount(() => dialog.value?.close())
</script>
<style scoped>
@media (max-width: 639px) { .mobile-modal-panel { max-width: none; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); } }
</style>
