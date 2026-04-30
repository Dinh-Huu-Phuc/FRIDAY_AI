export function validateLoginForm(values) {
  const errors = {}
  if (!values.username_or_email?.trim()) errors.username_or_email = "Username or email is required."
  if (!values.password) errors.password = "Password is required."
  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateRegisterForm(values) {
  const errors = {}
  if (!values.username || values.username.length < 3) errors.username = "Username must be at least 3 characters."
  if (!values.email || !values.email.includes("@")) errors.email = "Valid email is required."
  if (!values.password || values.password.length < 8) errors.password = "Password must be at least 8 characters."
  if (values.password !== values.confirm_password) errors.confirm_password = "Passwords do not match."
  return { ok: Object.keys(errors).length === 0, errors }
}
