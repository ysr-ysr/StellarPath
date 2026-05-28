export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function apiFileUrl(path) {
  const base = API_BASE_URL === '/api' ? '/api' : API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
