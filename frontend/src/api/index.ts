import { createRealApi } from './client'
import { createMockApi } from './mock'
import type { NivoraApi } from './types'

export * from './types'
export { ApiError } from './client'
export { computePayouts, mockStore } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api: NivoraApi = USE_MOCK ? createMockApi() : createRealApi()
