/**
 * Kashmir Curators Hospitality Desk — Authentication Token & Header Resolver
 * Automatically resolves token from hospitality_token, teamToken, token, auth_token,
 * or direct Portal Access Key.
 */

export const getHospitalityToken = (fallbackToken?: string | null): string => {
  if (fallbackToken && fallbackToken.trim()) return fallbackToken.trim();

  let portalKey = '';
  try {
    const session = JSON.parse(localStorage.getItem('hospitality_session') || '{}');
    portalKey = session.accessKey || '';
  } catch {}

  return (
    localStorage.getItem('hospitality_token') ||
    localStorage.getItem('teamToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    portalKey ||
    ''
  );
};

export const getHospitalityHeaders = (fallbackToken?: string | null): Record<string, string> => {
  const token = getHospitalityToken(fallbackToken);
  let portalKey = '';
  try {
    const session = JSON.parse(localStorage.getItem('hospitality_session') || '{}');
    portalKey = session.accessKey || '';
  } catch {}

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (portalKey) {
    headers['x-portal-key'] = portalKey;
    if (!headers['Authorization']) {
      headers['Authorization'] = `Bearer ${portalKey}`;
    }
  }

  return headers;
};
