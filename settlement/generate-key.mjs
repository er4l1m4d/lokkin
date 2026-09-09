// Generate a fresh escrow keypair. Run once:
//   npm run new-key
// Then set ESCROW_PRIVATE_KEY + ESCROW_ADDRESS in the backend env and fund it.
import { KeyPair } from '@nimiq/core'

const kp = KeyPair.generate()
console.log('Escrow address:   ', kp.toAddress().toUserFriendlyAddress())
console.log('Escrow private key:', kp.toHex())
console.log('\nKeep the private key secret. Set as ESCROW_PRIVATE_KEY here and')
console.log('ESCROW_ADDRESS on the backend, then send some NIM to the address.')
