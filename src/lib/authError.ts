type ActionType = 'signin' | 'signup' | 'reset'

export type ParsedAuthError = {
  message: string
  action?: { type: ActionType; href: string; label: string }
}

export function parseAuthError(raw?: string): ParsedAuthError {
  const message = raw?.toString() || ''
  const lower = message.toLowerCase()

  if (/(already.*registered|user already exists|user.*already|duplicate key|account.*exists|email.*already)/.test(lower)) {
    return {
      message,
      action: { type: 'signin', href: '/login', label: 'Sign in' },
    }
  }

  if (/(user not found|no user|not found|invalid_credentials)/.test(lower)) {
    return {
      message,
      action: { type: 'signup', href: '/signup', label: 'Create account' },
    }
  }

  // Password related issues — suggest reset
  if (/(password|incorrect password|invalid password)/.test(lower)) {
    return {
      message,
      action: { type: 'reset', href: '/login', label: 'Reset password' },
    }
  }

  return { message }
}

export default parseAuthError
