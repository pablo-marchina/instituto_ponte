import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { Component, lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { toast } from 'sonner'
import './App.css'
import { Toaster } from './components/ui/sonner'
import { finishGoogleLogin } from './features/auth/auth.api'
import { listenSessionExpired } from './features/auth/auth.events'
import {
  clearAuthSession,
  clearPendingAuthRole,
  getPendingAuthRole,
  storeAuthSession,
} from './features/auth/auth.storage'
import { appRouterBasename, withAppBasePath } from './lib/routing'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

const AlunoModule = lazy(() =>
  import('./modules/AlunoModule').then((module) => ({
    default: module.AlunoModule,
  })),
)

const CoordenadorProfessorModule = lazy(() =>
  import('./modules/CoordenadorProfessorModule').then((module) => ({
    default: module.CoordenadorProfessorModule,
  })),
)

function LoadingScreen({ label = 'Carregando' }: { label?: string }) {
  return (
    <main className="app-loading">
      <span aria-hidden="true" />
      {label}
    </main>
  )
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-auth-state">
          <h1>Algo deu errado</h1>
          <p>{this.state.error.message}</p>
          <a href={withAppBasePath('/login')}>Voltar ao login</a>
        </main>
      )
    }

    return this.props.children
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate()
  const role = getPendingAuthRole()
  const callbackMutation = useMutation({
    mutationFn: () => finishGoogleLogin(role ?? undefined),
    onSuccess: (session) => {
      storeAuthSession({
        accessToken: session.accessToken,
        usuario: session.usuario,
      })
      clearPendingAuthRole()
      navigate(`${session.redirectTo}/painel`, { replace: true })
    },
  })

  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const callbackError =
    params.get('error_description') ??
    params.get('error') ??
    hashParams.get('error_description') ??
    hashParams.get('error') ??
    undefined

  useEffect(() => {
    if (!callbackError && callbackMutation.status === 'idle') {
      callbackMutation.mutate()
    }
  }, [callbackError, callbackMutation])

  if (callbackError) {
    return (
      <main className="app-auth-state">
        <h1>Login não concluído</h1>
        <p>{callbackError}</p>
        <a href={withAppBasePath('/login')}>Voltar ao login</a>
      </main>
    )
  }

  if (callbackMutation.isError) {
    return (
      <main className="app-auth-state">
        <h1>Não foi possível autenticar</h1>
        <p>{callbackMutation.error.message}</p>
        <a href={withAppBasePath('/login')}>Tentar novamente</a>
      </main>
    )
  }

  return <LoadingScreen label="Finalizando login" />
}

function SessionExpiredHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    return listenSessionExpired(() => {
      clearAuthSession()
      clearPendingAuthRole()
      toast.error('Sua sessão expirou. Faça login novamente.')
      navigate('/login', { replace: true })
    })
  }, [navigate])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={appRouterBasename}>
        <SessionExpiredHandler />
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/aluno/*" element={<AlunoModule />} />
              <Route path="/*" element={<CoordenadorProfessorModule />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
