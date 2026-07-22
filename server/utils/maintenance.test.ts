import { describe, expect, test } from 'bun:test'

import { acquireApplicationRequest, beginMaintenance, endMaintenance, getMaintenanceState } from './maintenance'

Object.assign(globalThis, {
  createError: (input: { statusCode: number, statusMessage: string }) => Object.assign(new Error(input.statusMessage), input)
})

describe('maintenance coordination', () => {
  test('drena solicitudes activas y bloquea solicitudes nuevas', async () => {
    const release = acquireApplicationRequest()
    let drained = false
    const maintenance = beginMaintenance('restore').then(() => {
      drained = true
    })

    await Promise.resolve()
    expect(drained).toBe(false)
    expect(() => acquireApplicationRequest()).toThrow('mantenimiento')

    release()
    await maintenance
    expect(drained).toBe(true)
    expect(getMaintenanceState().activeRequests).toBe(0)

    endMaintenance('restore')
    const releaseAfterMaintenance = acquireApplicationRequest()
    releaseAfterMaintenance()
  })
})
