import { createRealApi } from './client'
import { createMockApi } from './mock'
import type { QestiaApi } from './types'

export * from './types'
export { ApiError } from './client'
export { computePayouts, mockStore } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api: QestiaApi = USE_MOCK ? createMockApi() : createRealApi()
