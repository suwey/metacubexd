type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

export interface ConfigSaveErrorBody {
  /** Machine-readable error code, translated via i18n `errors.<code>`. */
  code: string
  /** Human-readable detail (validator wording, parse line/col, …). */
  detail: string
}

/**
 * Extract the kernel's structured config error from a ky HTTPError. A failed
 * config apply/read answers `{ error: <code>, detail }` — ky v2 exposes the
 * parsed body as `error.data` (same shape access as controlError.ts). Returns
 * null when the body has no such shape (network error, mock mode, plain-text
 * body), letting callers fall back to their generic toast message.
 */
export function configSaveErrorBody(
  error: unknown,
): ConfigSaveErrorBody | null {
  if (!isRecord(error)) return null
  const data = error.data
  if (!isRecord(data)) return null
  const code =
    typeof data.error === 'string' && data.error ? data.error : undefined
  if (!code) return null
  const detail = typeof data.detail === 'string' ? data.detail : ''
  return { code, detail }
}
