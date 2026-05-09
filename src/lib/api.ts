export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://kashmir-curators-api.onrender.com/api';

export const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://kashmir-curators-api.onrender.com';
