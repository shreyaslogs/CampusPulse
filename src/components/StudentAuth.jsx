import { useState } from 'react'
import { supabase } from '../supabaseClient'

function StudentAuth({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resetMessages = () => {
    setMessage('')
    setError('')
  }

  const createStudentProfile = async (user) => {
    const { error } = await supabase
      .from('student_profiles')
      .upsert(
        {
          user_id: user.id,
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: true,
        },
      )

    return error
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    resetMessages()

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Account creation failed. Please try again.')
        setLoading(false)
        return
      }

      if (!data.session) {
        setMessage(
          'Account created. Check your email for the confirmation link, then sign in.',
        )
        setLoading(false)
        return
      }

      const profileError = await createStudentProfile(data.user)

      if (profileError) {
        console.error(
          'Student profile creation failed:',
          profileError,
        )

        await supabase.auth.signOut()

        setError(
          'This account cannot be registered as a student.',
        )

        setLoading(false)
        return
      }

      onAuthenticated(data.user)
      setLoading(false)
      return
    }

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Unable to sign in. Please try again.')
      setLoading(false)
      return
    }

    /*
     * An authenticated account is NOT automatically a student.
     * Authority accounts must never be converted into students.
     */

    const { data: authorityProfile, error: authorityError } =
      await supabase
        .from('authority_profiles')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle()

    if (authorityError) {
      console.error(
        'Authority profile check failed:',
        authorityError,
      )

      await supabase.auth.signOut()

      setError(
        'Unable to verify this account. Please try again.',
      )

      setLoading(false)
      return
    }

    if (authorityProfile) {
      await supabase.auth.signOut()

      setError(
        'This account belongs to an authority. Please use the Authority Portal.',
      )

      setLoading(false)
      return
    }

    const profileError = await createStudentProfile(data.user)

    if (profileError) {
      console.error(
        'Student profile creation failed:',
        profileError,
      )

      await supabase.auth.signOut()

      setError(
        'This account cannot be used as a student account.',
      )

      setLoading(false)
      return
    }

    onAuthenticated(data.user)
    setLoading(false)
  }

  const switchMode = () => {
    resetMessages()

    setMode((current) =>
      current === 'login' ? 'signup' : 'login',
    )
  }

  return (
    <main className="student-auth-page">
      <section className="student-auth-card">
        <p className="eyebrow">Campentra Student Portal</p>

        <h1>
          {mode === 'login'
            ? 'Student Login'
            : 'Create Student Account'}
        </h1>

        <p className="student-auth-description">
          {mode === 'login'
            ? 'Sign in to view your registrations and register for campus events.'
            : 'Create a student account to securely track your registrations across devices.'}
        </p>

        <form
          className="student-auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="student-auth-email">
              Email
            </label>

            <input
              id="student-auth-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="student-auth-password">
              Password
            </label>

            <input
              id="student-auth-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-field">
              <label htmlFor="student-auth-confirm-password">
                Confirm Password
              </label>

              <input
                id="student-auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && (
            <div
              className="authority-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="authority-message"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="primary-button student-auth-submit"
            disabled={loading}
          >
            {loading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          className="student-auth-switch"
          onClick={switchMode}
        >
          {mode === 'login'
            ? 'New to Campentra? Create an account'
            : 'Already have an account? Sign in'}
        </button>

        <a
          href="#/"
          className="authority-back-link"
        >
          ← Back to Campentra
        </a>
      </section>
    </main>
  )
}

export default StudentAuth
