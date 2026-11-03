import { useState, useEffect, useCallback, Component } from 'react'
import NavBar from './components/NavBar.jsx'
import Toasts from './components/Toasts.jsx'
import HomePage from './pages/HomePage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import ArticlePage from './pages/ArticlePage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import LedgerPage from './pages/LedgerPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { isLoggedIn, clearAuth } from './auth.js'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <div className="result-banner fail">
          <div className="result-msg">Something crashed while rendering</div>
          <p style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 6 }}>{String(this.state.error.message)}</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    )
    return this.props.children
  }
}

function App() {
  const [route, setRoute] = useState(isLoggedIn() ? { name: 'home' } : { name: 'login' })
  const [isAuth, setIsAuth] = useState(isLoggedIn())
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, ok = true) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, ok }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }, [])

  const navigate = useCallback((next) => {
    const protectedRoutes = ['news', 'article', 'verify', 'ledger']
    if (!isLoggedIn() && protectedRoutes.includes(next.name)) {
      setRoute({ name: 'login' }); window.scrollTo({ top: 0, behavior: 'smooth' }); return
    }
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Listen for login/logout changes
  useEffect(() => {
    const onChange = () => {
      const loggedIn = isLoggedIn()
      setIsAuth(loggedIn)
      if (loggedIn) {
        setRoute(prev => prev.name === 'login' ? { name: 'home' } : prev)
      } else {
        setRoute({ name: 'login' })
      }
    }
    window.addEventListener('chainverify-auth-change', onChange)
    return () => window.removeEventListener('chainverify-auth-change', onChange)
  }, [])

  // --- INACTIVITY TIMER ---
  useEffect(() => {
    if (!isAuth) return // Only run timer if user is logged in

    let timeoutId
    const INACTIVITY_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds

    const handleInactivity = () => {
      clearAuth()
      toast('Session expired due to 15 minutes of inactivity.', false)
    }

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleInactivity, INACTIVITY_TIME)
    }

    // Start the timer immediately upon login
    resetTimer()

    // Reset the timer on any user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, resetTimer))

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [isAuth, toast])

  return (
    <div className="app-wrapper">
      <NavBar route={route} navigate={navigate} minimal={route.name === 'login'} />

      <main className="page-content">
        <div className="container">
          <ErrorBoundary>
            {route.name === 'login' && <LoginPage navigate={navigate} toast={toast} />}
            {route.name === 'home' && isLoggedIn() && <HomePage navigate={navigate} />}
            {route.name === 'news' && isLoggedIn() && <NewsPage navigate={navigate} toast={toast} />}
            {route.name === 'article' && isLoggedIn() && (
              <ArticlePage key={route.articleId} articleId={route.articleId} navigate={navigate} toast={toast} autoRegister={route.autoRegister} />
            )}
            {route.name === 'verify' && isLoggedIn() && (
              <VerifyPage key={route.preselectedArticleId || 'verify'} preselectedArticleId={route.preselectedArticleId} navigate={navigate} toast={toast} />
            )}
            {route.name === 'ledger' && isLoggedIn() && <LedgerPage toast={toast} />}
          </ErrorBoundary>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          © 2026 ChainVerify
        </div>
      </footer>

      <Toasts items={toasts} />
    </div>
  )
}

export default App