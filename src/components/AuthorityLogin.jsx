import { useState } from 'react'
import { supabase } from '../supabaseClient'

function AuthorityLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    onLogin(data.user)
    setLoading(false)
  }

  return (
    <main className="authority-page">
      <section className="authority-auth-card">
        <p className="eyebrow">Campentra Authority Portal</p>

        <h1>Authority Login</h1>

        <p className="authority-description">
          Sign in to manage your campus events and view registrations submitted
          for your events.
        </p>

        <form className="authority-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="authority-email">Email</label>

            <input
              id="authority-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="authority-password">Password</label>

            <input
              id="authority-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <p className="authority-error" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="primary-button authority-login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <a href="#/" className="authority-back-link">
          ← Back to Campentra
        </a>
      </section>
    </main>
  )
}

export default AuthorityLogin
