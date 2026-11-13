import { NEON_AUTH_URL } from './api';

export interface NeonAuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: string;
}

export interface NeonAuthSession {
  user: NeonAuthUser | null;
  sessionToken?: string | null;
}

export const neonAuth = {
  /**
   * Registers a new user directly against the Neon Better Auth service
   */
  async signUp(params: { email: string; password: string; name: string }): Promise<{ user: NeonAuthUser | null; error?: string }> {
    try {
      const res = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(params),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        return { user: null, error: data.message || data.error || 'Failed to sign up with Neon Auth' };
      }
      return { user: data.user || null };
    } catch (err: any) {
      console.warn('Neon Auth signUp warning:', err);
      return { user: null, error: err.message };
    }
  },

  /**
   * Authenticates an existing user through Neon Better Auth
   */
  async signIn(params: { email: string; password: string }): Promise<{ user: NeonAuthUser | null; error?: string }> {
    try {
      const res = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(params),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        return { user: null, error: data.message || data.error || 'Failed to sign in with Neon Auth' };
      }
      return { user: data.user || null };
    } catch (err: any) {
      console.warn('Neon Auth signIn warning:', err);
      return { user: null, error: err.message };
    }
  },

  /**
   * Retrieves active session details from Neon Better Auth
   */
  async getSession(): Promise<NeonAuthSession> {
    try {
      const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
        headers: {
          'Origin': window.location.origin
        },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        return { user: data.user || null, sessionToken: data.session?.token || null };
      }
    } catch (err) {
      console.warn('Neon Auth getSession notice:', err);
    }
    return { user: null };
  },

  /**
   * Clears the session on Neon Better Auth
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${NEON_AUTH_URL}/sign-out`, {
        method: 'POST',
        headers: {
          'Origin': window.location.origin
        },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Neon Auth signOut error:', err);
    }
  }
};
