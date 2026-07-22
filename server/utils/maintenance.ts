type MaintenanceKind = 'backup' | 'restore'

let maintenanceKind: MaintenanceKind | null = null
let activeRequests = 0
const drainWaiters = new Set<() => void>()

function notifyWhenDrained() {
  if (activeRequests !== 0) return
  for (const resolve of drainWaiters) resolve()
  drainWaiters.clear()
}

export function acquireApplicationRequest() {
  if (maintenanceKind) {
    throw createError({
      statusCode: 503,
      statusMessage: 'El estudio esta temporalmente en mantenimiento.'
    })
  }

  activeRequests += 1
  let released = false

  return () => {
    if (released) return
    released = true
    activeRequests = Math.max(0, activeRequests - 1)
    notifyWhenDrained()
  }
}

export async function beginMaintenance(kind: MaintenanceKind) {
  if (maintenanceKind) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya hay una operacion de mantenimiento en curso.'
    })
  }

  maintenanceKind = kind
  if (activeRequests === 0) return
  await new Promise<void>(resolve => drainWaiters.add(resolve))
}

export function endMaintenance(kind: MaintenanceKind) {
  if (maintenanceKind === kind) maintenanceKind = null
}

export function getMaintenanceState() {
  return {
    maintenanceKind,
    activeRequests
  }
}
