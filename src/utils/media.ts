/**
 * Media and Asset Resolution Utility for Al-Ishraq Mobile Staff App
 *
 * Ensures all remote images (child photos, employee avatars, uploaded reports)
 * resolve to the correct production server URL (https://api.aleshrakcentre.com)
 * when running inside native Android / iOS builds, while supporting local dev.
 */

import { Capacitor } from '@capacitor/core';

const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD || isNative
    ? 'https://api.aleshrakcentre.com/api/v1'
    : 'http://localhost:3010/api/v1');

// Strips trailing slashes and /api/v1 or /mobile-employees suffix to get the root host
export const SERVER_STATIC_ROOT = rawApiUrl
  .replace(/\/+$/, '')
  .replace(/\/api\/v1(\/mobile-employees)?$/, '')
  .replace(/\/mobile-employees$/, '');

/**
 * Normalizes any relative or absolute media path into a fully qualified URL.
 * Handles cases where database contains:
 * - relative paths like 'uploads/employees/images/123.jpg' or '/uploads/...'
 * - legacy localhost URLs like 'http://localhost:3010/uploads/...' or 'http://127.0.0.1:...'
 * - valid external URLs 'https://...'
 * - optional fallback image URL
 */
export function getMediaUrl(path?: string | null, fallback = ''): string {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return fallback;
  }

  const trimmed = path.trim();

  // If path points to any localhost or loopback IP, rewrite to live server root
  const localhostRegex = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i;
  if (localhostRegex.test(trimmed)) {
    const relative = trimmed.replace(localhostRegex, '').replace(/^\/+/, '');
    return `${SERVER_STATIC_ROOT}/${relative}`;
  }

  // If already absolute http/https/data/blob
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  // Relative path - strip leading slashes and join with server root
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${SERVER_STATIC_ROOT}/${cleanPath}`;
}

/**
 * Fallback avatars
 */
export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>';

export const DEFAULT_CHILD_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>';

