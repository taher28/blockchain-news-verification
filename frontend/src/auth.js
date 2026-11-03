// frontend/src/auth.js
// Session helpers for ChainVerify.

const TOKEN_KEY = 'chainverify_token'
const USER_KEY  = 'chainverify_user'

export function getToken() {
  // Clean up old localStorage tokens from previous versions 
  // so they don't interfere with the new sessionStorage logic.
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setAuth(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event('chainverify-auth-change'))
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('chainverify-auth-change'))
}

export function isLoggedIn() {
  return Boolean(getToken())
}

export function isPublisher() {
  const u = getCurrentUser()
  return Boolean(u && u.role === 'publisher')
}

export function isUser() {
  const u = getCurrentUser()
  return Boolean(u && u.role === 'user')
}

export function getUserRole() {
  const u = getCurrentUser()
  return u ? u.role : null
}