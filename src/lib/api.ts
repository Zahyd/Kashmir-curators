const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
const isLoopbackHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL =
  viteEnv?.VITE_API_BASE_URL ||
  (isLoopbackHost
    ? `http://${window.location.hostname}:5000/api`
    : 'https://kashmir-curators-api.onrender.com/api');

export const SOCKET_URL =
  viteEnv?.VITE_SOCKET_URL ||
  (isLoopbackHost
    ? `http://${window.location.hostname}:5000`
    : 'https://kashmir-curators-api.onrender.com');

export const NEON_AUTH_URL = viteEnv?.VITE_NEON_AUTH_URL || 'https://ep-purple-shadow-ao7lc51d.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth';

export const isSearchBot = typeof navigator !== 'undefined' && 
  /Googlebot|Google-InspectionTool|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|facebookexternalhit|Lighthouse/i.test(navigator.userAgent || '');

// Robust socket configuration: On cloud platforms like Render where native WebSocket upgrades
// can be rejected or dropped by reverse proxies, polling ensures seamless 100% reliable delivery
// without triggering native browser WebSocket error logs in the console.
export const DEFAULT_SOCKET_OPTIONS = {
  transports: isLoopbackHost ? ['websocket', 'polling'] : ['polling'],
  reconnection: !isSearchBot,
  reconnectionAttempts: isSearchBot ? 0 : 5,
  reconnectionDelay: 2000,
  timeout: 10000,
  autoConnect: !isSearchBot,
  auth: (cb: (data: Record<string, string>) => void) => {
    try {
      const token =
        localStorage.getItem('teamToken') ||
        localStorage.getItem('team_auth_token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';
      const payload: Record<string, string> = {};
      if (token) payload.token = token;
      if (portalKey) payload.portalKey = portalKey;
      cb(payload);
    } catch {
      cb({});
    }
  },
};
