// Share the lock between overlapping dialogs so closing one does not unlock another.
let locks = 0
let previousOverflow = ''

export function useBodyScrollLock(enabled: () => boolean) {
  let locked = false
  function release() {
    if (!locked) return
    locked = false
    if (--locks === 0) document.body.style.overflow = previousOverflow
  }
  onMounted(() => {
    watch(enabled, active => {
      if (active && !locked) {
        if (locks++ === 0) {
          previousOverflow = document.body.style.overflow
          document.body.style.overflow = 'hidden'
        }
        locked = true
      } else if (!active) release()
    }, { immediate: true, flush: 'sync' })
  })
  onBeforeUnmount(release)
}
