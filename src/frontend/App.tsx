import { Leva } from 'leva'
import { WalletProvider } from './contexts/WalletContext.js'
import { Landing } from './pages/Landing.js'
import { Dashboard } from './pages/Dashboard.js'

export function App() {
  const isDashboard = window.location.pathname.startsWith('/dashboard')

  if (isDashboard) {
    return (
      <WalletProvider>
        <Dashboard />
      </WalletProvider>
    )
  }

  return (
    <>
      <Leva hidden />
      <Landing />
    </>
  )
}
