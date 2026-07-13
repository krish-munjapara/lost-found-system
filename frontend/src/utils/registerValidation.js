/**
 * Registration validation — mirrors backend UserRegister (user_model.py)
 */

const GENDER_PATTERN = /^(Male|Female|Other)$/;

export const REGISTER_FIELDS = [
  'full_name',
  'email',
  'password',
  'mobile',
  'gender',
  'address',
];

/**
 * Build the exact JSON body expected by POST /api/auth/register
 */
export function buildRegisterPayload(form) {
  return {
    full_name: form.full_name?.trim() ?? '',
    email: form.email?.trim() ?? '',
    password: form.password ?? '',
    mobile: form.mobile?.trim() ?? '',
    gender: form.gender ?? '',
    address: form.address?.trim() ?? '',
  };
}

/**
 * Client-side validation matching UserRegister Pydantic schema.
 * Returns null if valid, or a human-readable error string.
 */
export function validateRegisterPayload(payload) {
  const { full_name, email, password, mobile, gender, address } = payload;

  if (!full_name || full_name.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  if (full_name.length > 100) {
    return 'Full name must be at most 100 characters.';
  }
  if (!email || !email.includes('@')) {
    return 'Please enter a valid email address.';
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (password.length > 72) {
    return 'Password must be at most 72 characters.';
  }
  if (!mobile || mobile.length < 10) {
    return 'Mobile number must be at least 10 characters.';
  }
  if (mobile.length > 15) {
    return 'Mobile number must be at most 15 characters.';
  }
  if (!gender || !GENDER_PATTERN.test(gender)) {
    return 'Please select a gender (Male, Female, or Other).';
  }
  if (!address || address.length < 3) {
    return 'Address must be at least 3 characters.';
  }

  return null;
}
