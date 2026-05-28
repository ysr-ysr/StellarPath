export function decodeJwt(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}
