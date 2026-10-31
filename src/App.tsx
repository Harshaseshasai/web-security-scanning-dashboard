import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRoutes } from './router'
import { useThemeStore } from './store/theme.store'
import { TooltipProvider } from './components/ui/Tooltip'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})

/** Provides routing, validated query caching, shared tooltips, and theme-aware notices. */
export default function App() {
  const theme = useThemeStore((state) => state.theme)
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'var(--font-body)', fontSize: '12px' } }}
      />
    </QueryClientProvider>
  )
}
