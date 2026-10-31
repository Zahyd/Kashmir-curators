export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://kashmir-curators-api.onrender.com/api';

export const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://kashmir-curators-api.onrender.com';

// Robust socket configuration: On cloud platforms like Render where native WebSocket upgrades
// can be rejected or dropped by reverse proxies, polling ensures seamless 100% reliable delivery
// without triggering native browser WebSocket error logs in the console.
export const DEFAULT_SOCKET_OPTIONS = {
  transports: window.location.hostname === 'localhost' ? ['websocket', 'polling'] : ['polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 20000,
};
