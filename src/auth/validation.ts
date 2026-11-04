/** Client-side checks for the sign-up form. The database enforces the username format too. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Enter your email.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address.";
}

export function validateUsername(raw: string): string | null {
  const v = normalizeUsername(raw);
  if (!v) return "Choose a username.";
  if (!USERNAME_PATTERN.test(v)) return "Use 3-20 letters, numbers or underscores.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Enter a password.";
  return password.length >= MIN_PASSWORD_LENGTH
    ? null
    : `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
}
