import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('none')
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] =
    useState(false)

  const notificationRef = useRef(null)

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length

  useEffect(() => {
    let active = true

    const checkUserRole = async (currentUser) => {
      if (!currentUser) {
        if (active) {
          setUser(null)
          setUserRole('none')
          setNotifications([])
          setLoading(false)
        }

        return
      }

      if (active) {
        setUser(currentUser)
        setLoading(true)
      }

      const { data: authorityProfile } = await supabase
        .from('authority_profiles')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (authorityProfile) {
        setUser(currentUser)
        setUserRole('authority')
        setNotifications([])
        setLoading(false)
        return
      }

      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (studentProfile) {
        setUser(currentUser)
        setUserRole('student')
      } else {
        setUser(currentUser)
        setUserRole('none')
      }

      setLoading(false)
    }

    const loadCurrentUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      await checkUserRole(currentUser)
    }

    loadCurrentUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkUserRole(session?.user ?? null)
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userRole !== 'student' || !user) {
      setNotifications([])
      return
    }

    let active = true

    const loadNotifications = async () => {
      setNotificationsLoading(true)

      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, title, message, type, is_read, registration_id, created_at',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error(
          'Navbar notification error:',
          error,
        )

        if (active) {
          setNotifications([])
        }
      } else if (active) {
        setNotifications(data ?? [])
      }

      if (active) {
        setNotificationsLoading(false)
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [user, userRole])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  const closeMenu = () => {
    setMenuOpen(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()

    setUser(null)
    setUserRole('none')
    setNotifications([])
    setNotificationOpen(false)
    setMenuOpen(false)

    window.location.hash = '#/'
  }

  const handleNotificationClick = async (
    notification,
  ) => {
    setNotificationOpen(false)

    if (!notification.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
        })
        .eq('id', notification.id)
        .eq('user_id', user.id)

      if (!error) {
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
    }

    window.location.hash = '#/student'
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || !user) {
      return
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error(
        'Mark notifications read error:',
        error,
      )
      return
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    )
  }

  return (
    <header className="navbar">
      <a
        href="#/"
        className="brand"
        onClick={closeMenu}
      >
        Campentra
      </a>

      <button
        type="button"
        className="menu-toggle"
        aria-label={
          menuOpen
            ? 'Close navigation menu'
            : 'Open navigation menu'
        }
        aria-expanded={menuOpen}
        onClick={() =>
          setMenuOpen((current) => !current)
        }
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav
        className={`nav-links ${
          menuOpen ? 'nav-links-open' : ''
        }`}
        aria-label="Primary navigation"
      >
        <a
          href="#home"
          onClick={closeMenu}
        >
          Home
        </a>

        <a
          href="#events"
          onClick={closeMenu}
        >
          Events
        </a>

        <a
          href="#announcements"
          onClick={closeMenu}
        >
          Announcements
        </a>

        <a
          href="#clubs"
          onClick={closeMenu}
        >
          Clubs
        </a>

        {!loading &&
          userRole === 'student' && (
            <>
              <div
                className="notification-wrapper"
                ref={notificationRef}
              >
                <button
                  type="button"
                  className="notification-trigger"
                  aria-label={`Notifications${
                    unreadCount > 0
                      ? `, ${unreadCount} unread`
                      : ''
                  }`}
                  aria-expanded={
                    notificationOpen
                  }
                  onClick={() =>
                    setNotificationOpen(
                      (current) => !current,
                    )
                  }
                >
                  <span className="notification-icon">
                    🔔
                  </span>

                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="notification-panel">
                    <div className="notification-panel-header">
                      <div>
                        <strong>
                          Notifications
                        </strong>

                        <span>
                          {unreadCount > 0
                            ? `${unreadCount} unread`
                            : 'All caught up'}
                        </span>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notification-mark-read"
                          onClick={
                            handleMarkAllRead
                          }
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notificationsLoading ? (
                      <div className="notification-panel-empty">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-panel-empty">
                        <strong>
                          No notifications
                        </strong>

                        <span>
                          Registration updates will appear
                          here.
                        </span>
                      </div>
                    ) : (
                      <div className="notification-panel-list">
                        {notifications
                          .slice(0, 6)
                          .map(
                            (notification) => (
                              <button
                                type="button"
                                key={notification.id}
                                className={`notification-panel-item ${
                                  notification.is_read
                                    ? 'notification-panel-item-read'
                                    : 'notification-panel-item-unread'
                                }`}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification,
                                  )
                                }
                              >
                                <div className="notification-panel-item-top">
                                  <strong>
                                    {
                                      notification.title
                                    }
                                  </strong>

                                  {!notification.is_read && (
                                    <span className="notification-new-dot">
                                      New
                                    </span>
                                  )}
                                </div>

                                <p>
                                  {
                                    notification.message
                                  }
                                </p>

                                <time>
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleString()}
                                </time>
                              </button>
                            ),
                          )}
                      </div>
                    )}

                    <a
                      href="#/student"
                      className="notification-panel-footer"
                      onClick={() => {
                        closeMenu()
                        setNotificationOpen(
                          false,
                        )
                      }}
                    >
                      View all notifications →
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#/student"
                className="nav-auth-link"
                onClick={closeMenu}
              >
                My Campentra
              </a>

              <button
                type="button"
                className="nav-logout-button"
                onClick={
                  handleSignOut
                }
              >
                Sign Out
              </button>
            </>
          )}

        {!loading &&
          !user &&
          userRole === 'none' && (
            <a
              href="#/student"
              className="nav-auth-link"
              onClick={closeMenu}
            >
              Student Login
            </a>
          )}

        {!loading &&
          user &&
          userRole === 'none' && (
            <button
              type="button"
              className="nav-logout-button"
              onClick={
                handleSignOut
              }
            >
              Sign Out
            </button>
          )}

        {!loading &&
          userRole === 'authority' && (
            <a
              href="#/authority"
              className="nav-auth-link"
              onClick={closeMenu}
            >
              Authority Dashboard
            </a>
          )}
      </nav>
    </header>
  )
}

export default Navbar
