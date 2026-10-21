import { pbkdf2Sync, randomBytes } from 'node:crypto'

const password = process.argv[2]
if (!password) {
  console.error('Uso: node scripts/hash-admin-password.mjs "<password>"')
  process.exit(1)
}

const iterations = 210000
const salt = randomBytes(16)
const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
const encoded = `pbkdf2$sha256$${iterations}$${salt.toString('base64url')}$${hash.toString('base64url')}`
process.stdout.write(`${encoded}\n`)
