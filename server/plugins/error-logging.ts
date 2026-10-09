import { logServerError } from '../utils/error-logging'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    if (!event?.path.startsWith('/api/')) return
    logServerError('[api.request.failed]', error, {
      method: event.method,
      path: event.path.split('?')[0] || '/api/'
    })
  })
})
