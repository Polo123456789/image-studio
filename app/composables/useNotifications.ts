let permissionRequest: Promise<NotificationPermission> | null = null

export function useNotifications() {
  function isSupported() {
    return import.meta.client && window.isSecureContext && 'Notification' in window
  }

  async function requestPermission() {
    if (!isSupported() || Notification.permission !== 'default') return
    try {
      permissionRequest ??= Notification.requestPermission()
      await permissionRequest
    } catch {
      // Notification permissions must never interrupt image generation.
    } finally {
      permissionRequest = null
    }
  }

  async function notify(message: string, url: string) {
    if (!isSupported()) return
    try {
      if (permissionRequest) await permissionRequest
      if (Notification.permission !== 'granted') return
      const notification = new Notification('Image Studio', { body: message })
      notification.onclick = () => {
        window.focus()
        void navigateTo(url)
        notification.close()
      }
    } catch {
      // Some browsers expose the API but do not support desktop notifications.
    }
  }

  return { notify, requestPermission }
}
