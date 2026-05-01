export function validatePlatformSettings(values) {
  const errors = {};
  ["defaultDailyLimit", "rateLimitPerMinute", "maxOutputTokens"].forEach((key) => {
    if (Number(values[key]) <= 0) errors[key] = "Must be greater than zero.";
  });
  return { ok: Object.keys(errors).length === 0, errors };
}
