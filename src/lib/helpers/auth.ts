import { BASE_HEADERS } from '$lib/constants/auth';

export const createHeaders = (additionalHeaders: Record<string, string> = {}) => {
  return {
    ...BASE_HEADERS,
    ...additionalHeaders,
  };
};

export const checkPasswordStrength = (password: string) => {
  const strength = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    minLength: password.length >= 8,
  };
  const validCount = Object.values(strength).filter(Boolean).length;

  return {
    ...getPasswordStregth(validCount),
    state: strength,
    validCount,
  };
};

export const getPasswordStregth = (validCount: number) => {
  if (validCount <= 2) {
    return { color: 'red', text: 'Weak' };
  }

  if (validCount <= 4) {
    return { color: 'yellow', text: 'Medium' };
  }

  if (validCount >= 5) {
    return { color: 'green', text: 'Strong' };
  }

  return { color: 'red', text: 'Weak' };
};
