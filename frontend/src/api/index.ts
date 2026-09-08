import { createRealApi } from './client'
import { createMockApi } from './mock'
import type { LokkinApi } from './types'

export * from './types'
export { ApiError } from './client'
export { computePayouts, mockStore } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api: LokkinApi = USE_MOCK ? createMockApi() : createRealApi()
