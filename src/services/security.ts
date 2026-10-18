/**
 * BhumiRadar Security & Input Sanitization Engine
 * Defensive measures against XSS, Injection, PII leakage, and Malformed Data
 */

/**
 * Strips HTML tags, control characters, null bytes, and script injection payloads.
 * Also trims and enforces maximum character lengths.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 1. Strip null bytes and non-printable control characters (except newline \n and tab \t)
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Strip HTML tags and script/iframe/object tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // 3. Remove common JavaScript pseudo-protocol vectors
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  // 4. Enforce strict character length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Validates whether a phone number matches standard Bangladesh formats
 * (e.g. 017xxxxxxxx, +88017xxxxxxxx, 018xxxxxxxx)
 */
export function isValidBangladeshPhone(phone?: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+8801|01)[3-9]\d{8}$/.test(cleaned);
}

/**
 * Validates National Identity Card (NID) number format
 * (Old 10-digit, 13-digit, or Smart 17-digit format)
 */
export function isValidBangladeshNid(nid?: string): boolean {
  if (!nid) return false;
  const cleaned = nid.replace(/[\s-]/g, '');
  return /^(\d{10}|\d{13}|\d{17})$/.test(cleaned);
}

/**
 * Validates 6-digit numeric OTP code
 */
export function isValidOtp(otp?: string): boolean {
  if (!otp) return false;
  return /^\d{6}$/.test(otp.trim());
}

/**
 * Masks phone numbers to protect citizen/whistleblower identity (PII protection)
 * e.g., "01712998877" -> "0171****877"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.length < 8) return '****';
  return `${cleaned.slice(0, 4)}****${cleaned.slice(-3)}`;
}

/**
 * Masks NID to prevent identity theft
 * e.g., "198512345678" -> "1985********5678"
 */
export function maskNid(nid?: string): string {
  if (!nid) return '';
  const cleaned = nid.trim();
  if (cleaned.length < 8) return '********';
  return `${cleaned.slice(0, 4)}********${cleaned.slice(-4)}`;
}

/**
 * Validates geographic coordinate bounds.
 * Checks whether coordinates fall within the territorial envelope of Bangladesh
 * Lat: 20.5°N - 26.8°N, Lng: 88.0°E - 92.7°E
 */
export function isWithinBangladeshBounds(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= 20.5 && lat <= 26.8 && lng >= 88.0 && lng <= 92.7;
}

/**
 * Safely sanitizes numeric monetary or area values, ensuring finite positive values.
 */
export function sanitizeNumeric(value: unknown, defaultValue = 0, min = 0, max = 1e12): number {
  if (typeof value !== 'number' || isNaN(value) || !Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}
