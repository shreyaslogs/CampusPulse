import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function StudentDashboard({ user }) {
  const [profile, setProfile] = useState({
    full_name: '',
    student_id: '',
    department: '',
    year: '',
    phone: '',
  })

  const [registrations, setRegistrations] = useState([])
  const [notifications, setNotifications] = useState([])

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStudentData = async () => {
    setLoading(true)
    setError('')

    const { data: profileData, error: profileError } =
      await supabase
        .from('student_profiles')
        .select(
          'user_id, full_name, student_id, department, year, phone',
        )
        .eq('user_id', user.id)
        .maybeSingle()

    if (profileError) {
      console.error(
        'Student profile error:',
        profileError,
      )

      setError('Unable to load your profile.')
      setLoading(false)
      return
    }

    if (profileData) {
      setProfile({
        full_name: profileData.full_name ?? '',
        student_id: profileData.student_id ?? '',
        department: profileData.department ?? '',
        year: profileData.year ?? '',
        phone: profileData.phone ?? '',
      })
    }

    const { data: registrationData, error: registrationError } =
      await supabase
        .from('registrations')
        .select(
          'id, event_id, event_title, full_name, department, year, status, created_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (registrationError) {
      console.error(
        'Student registrations error:',
        registrationError,
      )

      setError('Unable to load your registrations.')
      setLoading(false)
      return
    }

    const { data: notificationData, error: notificationError } =
      await supabase
        .from('notifications')
        .select(
          'id, title, message, type, is_read, registration_id, created_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (notificationError) {
      console.error(
        'Student notifications error:',
        notificationError,
      )

      setError('Unable to load your notifications.')
      setLoading(false)
      return
    }

    setRegistrations(registrationData ?? [])
    setNotifications(notificationData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadStudentData()
  }, [user.id])

  const handleProfileChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()

    setSavingProfile(true)
    setMessage('')
    setError('')

    if (!profile.full_name.trim()) {
      setError('Full name is required.')
      setSavingProfile(false)
      return
    }

    if (!profile.student_id.trim()) {
      setError('Student ID / Roll Number is required.')
      setSavingProfile(false)
      return
    }

    if (!profile.department.trim()) {
      setError('Department is required.')
      setSavingProfile(false)
      return
    }

    if (!profile.year) {
      setError('Year is required.')
      setSavingProfile(false)
      return
    }

    if (!/^\d{10}$/.test(profile.phone.trim())) {
      setError('Enter a valid 10-digit phone number.')
      setSavingProfile(false)
      return
    }

    const { error: profileError } = await supabase
      .from('student_profiles')
      .update({
        full_name: profile.full_name.trim(),
        student_id: profile.student_id.trim(),
        department: profile.department.trim(),
        year: profile.year,
        phone: profile.phone.trim(),
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error(
        'Student profile update error:',
        profileError,
      )

      if (profileError.code === '23505') {
        setError(
          'That Student ID / Roll Number is already in use.',
        )
      } else {
        setError(
          'Your profile could not be saved. Please try again.',
        )
      }

      setSavingProfile(false)
      return
    }

    setMessage('Profile updated successfully.')
    setSavingProfile(false)

    setTimeout(() => {
      setMessage('')
    }, 4000)
  }

  const handleMarkNotificationRead = async (notification) => {
    if (notification.is_read) {
      return
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('id', notification.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error(
        'Notification update error:',
        updateError,
      )

      return
    }

    setNotifications((current) =>
      current.map((currentNotification) =>
        currentNotification.id === notification.id
          ? {
              ...currentNotification,
              is_read: true,
            }
          : currentNotification,
      ),
    )
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id)

    if (unreadIds.length === 0) {
      return
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (updateError) {
      console.error(
        'Mark all notifications read error:',
        updateError,
      )

      setError('Unable to mark notifications as read.')
      return
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()

    window.location.hash = '#/student'
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved'

      case 'rejected':
        return 'status-badge status-rejected'

      default:
        return 'status-badge status-pending'
    }
  }

  const getNotificationClass = (type) => {
    switch (type) {
      case 'approved':
        return 'notification-card notification-approved'

      case 'rejected':
        return 'notification-card notification-rejected'

      default:
        return 'notification-card notification-info'
    }
  }

  const approvedCount = registrations.filter(
    (registration) => registration.status === 'approved',
  ).length

  const pendingCount = registrations.filter(
    (registration) => registration.status === 'pending',
  ).length

  const rejectedCount = registrations.filter(
    (registration) => registration.status === 'rejected',
  ).length

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length

  if (loading) {
    return (
      <main className="student-dashboard-page">
        <section className="student-dashboard-card">
          <p>Loading your student portal...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="student-dashboard-page">
      <section className="student-dashboard-card">
        <div className="student-dashboard-header">
          <div>
            <p className="eyebrow">
              Campentra Student Portal
            </p>

            <h1>My Campentra</h1>

            <p className="student-dashboard-description">
              Manage your student profile, track registrations,
              and stay updated on event decisions.
            </p>

            <p className="student-account-email">
              Signed in as <strong>{user.email}</strong>
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="authority-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="authority-message" role="status">
            {message}
          </div>
        )}

        <div className="student-registration-stats">
          <div className="student-summary-card">
            <span>Total</span>
            <strong>{registrations.length}</strong>
          </div>

          <div className="student-summary-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="student-summary-card">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>

          <div className="student-summary-card">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

        <div className="student-notifications-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Notifications
              </p>

              <h2>
                Updates
                {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount}
                  </span>
                )}
              </h2>
            </div>

            {unreadNotificationCount > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="student-empty-state">
              <h3>No notifications yet</h3>

              <p>
                You will see registration approval or rejection
                updates here.
              </p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`${getNotificationClass(
                    notification.type,
                  )} ${
                    notification.is_read
                      ? 'notification-read'
                      : 'notification-unread'
                  }`}
                  onClick={() =>
                    handleMarkNotificationRead(
                      notification,
                    )
                  }
                >
                  <div className="notification-content">
                    <div className="notification-top">
                      <strong>{notification.title}</strong>

                      {!notification.is_read && (
                        <span className="notification-dot">
                          New
                        </span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <time>
                      {new Date(
                        notification.created_at,
                      ).toLocaleString()}
                    </time>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="student-profile-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Student Profile
              </p>

              <h2>Your Details</h2>
            </div>
          </div>

          <form
            className="student-profile-form"
            onSubmit={handleSaveProfile}
          >
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="student-profile-name">
                  Full Name *
                </label>

                <input
                  id="student-profile-name"
                  type="text"
                  value={profile.full_name}
                  onChange={(event) =>
                    handleProfileChange(
                      'full_name',
                      event.target.value,
                    )
                  }
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="student-profile-id">
                  Student ID / Roll Number *
                </label>

                <input
                  id="student-profile-id"
                  type="text"
                  value={profile.student_id}
                  onChange={(event) =>
                    handleProfileChange(
                      'student_id',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="student-profile-department">
                  Department *
                </label>

                <input
                  id="student-profile-department"
                  type="text"
                  value={profile.department}
                  onChange={(event) =>
                    handleProfileChange(
                      'department',
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Electronics & Telecommunication"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="student-profile-year">
                  Year *
                </label>

                <select
                  id="student-profile-year"
                  value={profile.year}
                  onChange={(event) =>
                    handleProfileChange(
                      'year',
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Select year
                  </option>

                  <option value="1st Year">
                    1st Year
                  </option>

                  <option value="2nd Year">
                    2nd Year
                  </option>

                  <option value="3rd Year">
                    3rd Year
                  </option>

                  <option value="4th Year">
                    4th Year
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="student-profile-phone">
                Phone Number *
              </label>

              <input
                id="student-profile-phone"
                type="tel"
                inputMode="numeric"
                value={profile.phone}
                onChange={(event) =>
                  handleProfileChange(
                    'phone',
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10),
                  )
                }
                autoComplete="tel"
                required
              />
            </div>

            <p className="profile-email-note">
              Your login email is <strong>{user.email}</strong>.
              It is managed through your Campentra account.
            </p>

            <button
              type="submit"
              className="primary-button"
              disabled={savingProfile}
            >
              {savingProfile
                ? 'Saving Profile...'
                : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="student-registration-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Your Activity
              </p>

              <h2>My Registrations</h2>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="student-empty-state">
              <h3>No registrations yet</h3>

              <p>
                Explore Campentra events and register
                for something that interests you.
              </p>

              <a
                href="#/"
                className="primary-button student-browse-link"
              >
                Browse Events
              </a>
            </div>
          ) : (
            <div className="student-registration-list">
              {registrations.map(
                (registration) => (
                  <article
                    key={registration.id}
                    className="student-registration-card"
                  >
                    <div className="student-registration-main">
                      <span className="event-category">
                        Campus Event
                      </span>

                      <h3>
                        {registration.event_title}
                      </h3>

                      <p>
                        Registered as{' '}
                        {registration.full_name}
                      </p>

                      <div className="student-registration-meta">
                        <span>
                          {registration.department}
                        </span>

                        <span>
                          {registration.year}
                        </span>
                      </div>
                    </div>

                    <div className="student-registration-status">
                      <span className="student-status-label">
                        Registration Status
                      </span>

                      <span
                        className={getStatusClass(
                          registration.status,
                        )}
                      >
                        {registration.status}
                      </span>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>

        <div className="student-dashboard-footer">
          <a
            href="#/"
            className="student-home-link"
          >
            ← Back to Campentra
          </a>
        </div>
      </section>
    </main>
  )
}

export default StudentDashboard
