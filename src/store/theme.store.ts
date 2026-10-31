import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { z } from 'zod'

const ThemeSchema = z.enum(['light', 'dark'])
const saved = ThemeSchema.safeParse(localStorage.getItem('theme'))
const initialTheme = saved.success ? saved.data : 'light'
document.documentElement.classList.toggle('dark', initialTheme === 'dark')

export const useThemeStore = create(
  subscribeWithSelector<{ theme: z.infer<typeof ThemeSchema>; toggle: () => void }>((set, get) => ({
    theme: initialTheme,
    /** Persists the chosen theme and applies it before the next render. */
    toggle: () => {
      const theme = get().theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      set({ theme })
    },
  }))
)
