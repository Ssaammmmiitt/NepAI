import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI, configureAuthHandlers } from '@/services/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  initialized: boolean
  sessionExpired: boolean
  signUp: (fullName: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  handleSessionExpired: () => void
  clearSessionExpired: () => void
  initialize: () => Promise<void>
  refreshSession: () => Promise<boolean>
  setTokens: (access: string, refresh: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      configureAuthHandlers({
        getAccessToken: () => get().accessToken,
        getRefreshToken: () => get().refreshToken,
        onTokensRefreshed: (access, refresh) => {
          set({ accessToken: access, refreshToken: refresh })
        },
        onAuthFailure: () => {
          get().signOut()
        },
        onSessionExpired: () => {
          get().handleSessionExpired()
        },
      })

      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        initialized: false,
        sessionExpired: false,

        setTokens: (access, refresh) => {
          set({ accessToken: access, refreshToken: refresh })
        },

        signUp: async (fullName, email, password) => {
          set({ loading: true })
          try {
            const { data } = await authAPI.signup({
              full_name: fullName,
              email,
              password,
            })
            set({
              user: data.user,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              sessionExpired: false,
            })
          } finally {
            set({ loading: false })
          }
        },

        signIn: async (email, password) => {
          set({ loading: true })
          try {
            const { data } = await authAPI.login({ email, password })
            set({
              user: data.user,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              sessionExpired: false,
            })
          } finally {
            set({ loading: false })
          }
        },

        signOut: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            sessionExpired: false,
          })
        },

        handleSessionExpired: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            sessionExpired: true,
          })
        },

        clearSessionExpired: () => {
          set({ sessionExpired: false })
        },

        refreshSession: async () => {
          const { refreshToken } = get()
          if (!refreshToken) return false
          try {
            const { data } = await authAPI.refresh(refreshToken)
            set({
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            })
            return true
          } catch {
            get().handleSessionExpired()
            return false
          }
        },

        initialize: async () => {
          const { accessToken } = get()
          if (!accessToken) {
            set({ initialized: true })
            return
          }
          set({ loading: true })
          try {
            const { data } = await authAPI.me()
            set({ user: data })
          } catch {
            const refreshed = await get().refreshSession()
            if (refreshed) {
              try {
                const { data } = await authAPI.me()
                set({ user: data })
              } catch {
                get().handleSessionExpired()
              }
            }
          } finally {
            set({ loading: false, initialized: true })
          }
        },
      }
    },
    {
      name: 'nepai-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)
