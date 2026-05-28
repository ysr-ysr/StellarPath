import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwt } from '../utils/jwt';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      decodedToken: null,
      setAuth: ({ token, user }) => {
        const decodedToken = decodeJwt(token);
        set({
          token,
          user,
          decodedToken,
          role: user?.role || decodedToken?.role || null,
        });
      },
      logout: () => set({ token: null, role: null, user: null, decodedToken: null }),
    }),
    {
      name: 'stellarpath-auth',
    }
  )
);
