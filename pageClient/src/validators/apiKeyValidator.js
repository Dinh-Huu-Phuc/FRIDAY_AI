export function validateApiKey(value) {
  const errors = {}
  if (!value?.trim()) errors.api_key = "FRIDAY API key is required."
  if (value && !value.startsWith("friday_")) errors.api_key = "This does not look like a FRIDAY internal API key."
  return { ok: Object.keys(errors).length === 0, errors }
}
