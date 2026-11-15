/**
 * Kashmir Curators Hospitality Desk — Authentication Token & Header Resolver
 * Automatically resolves token from hospitality_token, teamToken, token, auth_token,
 * or direct Portal Access Key.
 */

export const getHospitalityToken = (fallbackToken?: string | null): string => {
  if (fallbackToken && fallbackToken.trim() && fallbackToken !== 'null' && fallbackToken !== 'undefined') {
    return fallbackToken.trim();
  }

  let portalKey = '';
  try {
    const session = JSON.parse(localStorage.getItem('hospitality_session') || '{}');
    portalKey = session.accessKey || '';
  } catch {}

  const candidates = [
    localStorage.getItem('hospitality_token'),
    localStorage.getItem('teamToken'),
    localStorage.getItem('token'),
    localStorage.getItem('auth_token'),
    portalKey
  ];

  for (const cand of candidates) {
    if (cand && cand.trim() && cand !== 'null' && cand !== 'undefined') {
      return cand.trim();
    }
  }

  return '';
};

export const getHospitalityHeaders = (fallbackToken?: string | null): Record<string, string> => {
  let portalKey = '';
  try {
    const session = JSON.parse(localStorage.getItem('hospitality_session') || '{}');
    portalKey = session.accessKey || '';
  } catch {}

  const token = getHospitalityToken(fallbackToken);
  const headers: Record<string, string> = {};

  if (portalKey && portalKey !== 'null' && portalKey !== 'undefined') {
    headers['x-portal-key'] = portalKey;
  }

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (portalKey && portalKey !== 'null' && portalKey !== 'undefined') {
    headers['Authorization'] = `Bearer ${portalKey}`;
  }

  return headers;
};
