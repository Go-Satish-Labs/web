export const PASSWORD_REQUIREMENTS = 'At least 8 characters, including a letter and a number.'

export function passwordPolicyError(password: string): string {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (/\s/.test(password)) return 'Password cannot contain spaces.'
  if (!/[A-Za-z]/.test(password)) return 'Password must include at least one letter.'
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.'
  return ''
}
