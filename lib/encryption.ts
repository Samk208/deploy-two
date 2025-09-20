import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 16
const IV_LENGTH = 12
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + 16

/**
 * Get encryption key from environment or generate a secure default
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.warn('ENCRYPTION_KEY not set in environment. Using default key for development.')
    return 'your_32_character_encryption_key_here!!'
  }
  return key
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptSensitiveData(text: string): string {
  try {
    const key = getEncryptionKey()
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256')
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    cipher.setAAD(salt)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])
    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt sensitive data')
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const data = Buffer.from(encryptedData, 'base64')
    
    const salt = data.subarray(0, SALT_LENGTH)
    const iv = data.subarray(SALT_LENGTH, TAG_POSITION)
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION)
    const encrypted = data.subarray(ENCRYPTED_POSITION)
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAAD(salt)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt sensitive data')
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash a password using bcrypt-like approach with crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against its hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
    return hash === verifyHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}
