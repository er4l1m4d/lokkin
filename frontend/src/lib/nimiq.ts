import { init, requestDeviceIdentifier } from '@nimiq/mini-app-sdk'
import type { NimiqProvider } from '@nimiq/mini-app-sdk'

const LUNAS_PER_NIM = 100_000

let providerPromise: Promise<NimiqProvider | null> | null = null

/**
 * Returns the Nimiq Pay provider when running inside Nimiq Pay, or null in a
 * regular browser (mock/dev). Resolves once and caches — init() times out on
 * its own when no host injects the provider.
 */
export function getNimiqProvider(): Promise<NimiqProvider | null> {
  if (!providerPromise) {
    providerPromise = init({ timeout: 3000 }).catch(() => null)
  }
  return providerPromise
}

export async function isWalletAvailable(): Promise<boolean> {
  return (await getNimiqProvider()) !== null
}

/** Accounts from the host wallet (user approves listing). */
export async function listWallets(): Promise<string[]> {
  const nimiq = await getNimiqProvider()
  if (!nimiq) return []
  const accounts = await nimiq.listAccounts()
  if (!Array.isArray(accounts)) return [] // ErrorResponse shape
  return accounts
}

/**
 * Send a commitment payment from the user's wallet. NIM transfers are feeless.
   * `data` carries the NV-XXXX memo that binds the payment to the commitment.
 * Returns whatever reference the wallet yields (tx hash or serialized tx).
 */
export async function sendCommitment(
  recipient: string,
  amountNim: number,
  memo: string,
): Promise<{ txRef: string } | { error: string }> {
  const nimiq = await getNimiqProvider()
  if (!nimiq) return { error: 'No Nimiq wallet available — open Nivora inside Nimiq Pay.' }
  const accounts = await listWallets()
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { error: 'No account in your wallet.' }
  }
  try {
    const result = await nimiq.sendBasicTransactionWithData({
      recipient,
      value: Math.round(amountNim * LUNAS_PER_NIM),
      data: memo,
    })
    if (typeof result === 'string') return { txRef: result }
    return { error: 'Wallet rejected the transaction.' }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Transaction failed.' }
  }
}

/**
 * Pseudonymous per-device id from Nimiq Pay (anti-cheat: one device, one
 * identity across accounts). Null outside Nimiq Pay or when denied.
 */
export async function getDeviceIdentifier(reason: string): Promise<string | null> {
  try {
    return await requestDeviceIdentifier({ reason })
  } catch {
    return null
  }
}

export const LUNAS = LUNAS_PER_NIM
