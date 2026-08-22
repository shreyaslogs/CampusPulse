import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import CreateEvent from './CreateEvent'
import EditEvent from './EditEvent'

function AuthorityDashboard({ user }) {
  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [announcements, setAnnouncements] = useState([])

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [editingEvent, setEditingEvent] = useState(null)

  const [showAnnouncementForm, setShowAnnouncementForm] =
    useState(false)

  const [editingAnnouncement, setEditingAnnouncement] =
    useState(null)

  const [announcementForm, setAnnouncementForm] =
    useState({
      title: '',
      date: '',
      category: '',
      description: '',
      linkType: 'none',
      linkUrl: '',
      eventId: '',
    })

  const [announcementSaving, setAnnouncementSaving] =
    useState(false)

  const [registrationSearch, setRegistrationSearch] =
    useState('')

  const [registrationFilter, setRegistrationFilter] =
    useState('all')

  /*
   * =========================================
   * LOAD AUTHORITY DASHBOARD
   * =========================================
   */

  const loadDashboard = async () => {
    setLoading(true)
    setMessage('')

    /*
     * Authority profile
     */

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('authority_profiles')
      .select('organization_name, display_name')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error(
        'Authority profile error:',
        profileError,
      )

      setMessage(
        'Your account is authenticated, but no Campentra authority profile is configured for it.',
      )

      setLoading(false)
      return
    }

    /*
     * Authority events
     */

    const {
      data: eventData,
      error: eventError,
    } = await supabase
      .from('events')
      .select(
        'id, title, date_text, location, category, description, authority_id, registration_capacity, registration_deadline, registration_count',
      )
      .eq('authority_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (eventError) {
      console.error(
        'Authority events error:',
        eventError,
      )

      setMessage('Unable to load your events.')
      setLoading(false)
      return
    }

    /*
     * Authority announcements
     */

    const {
      data: announcementData,
      error: announcementError,
    } = await supabase
      .from('announcements')
      .select(
        'id, title, date, category, description, authority_id, link_type, link_url, event_id, created_at',
      )
      .eq('authority_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (announcementError) {
      console.error(
        'Authority announcements error:',
        announcementError,
      )

      setMessage(
        'Unable to load your announcements.',
      )

      setLoading(false)
      return
    }

    /*
     * Registrations belonging to authority events
     */

    const eventIds = (eventData ?? []).map(
      (event) => event.id,
    )

    let registrationData = []

    if (eventIds.length > 0) {
      const {
        data,
        error: registrationError,
      } = await supabase
        .from('registrations')
        .select(
          'id, event_id, event_title, full_name, student_id, department, email, phone, year, status, created_at',
        )
        .in('event_id', eventIds)
        .order('created_at', {
          ascending: false,
        })

      if (registrationError) {
        console.error(
          'Authority registrations error:',
          registrationError,
        )

        setMessage(
          'Unable to load event registrations.',
        )

        setLoading(false)
        return
      }

      registrationData = data ?? []
    }

    setProfile(profileData)
    setEvents(eventData ?? [])
    setAnnouncements(announcementData ?? [])
    setRegistrations(registrationData)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [user.id])

  /*
   * =========================================
   * EVENT HANDLERS
   * =========================================
   */

  const handleEventCreated = () => {
    loadDashboard()
  }

  const handleEventUpdated = () => {
    loadDashboard()
  }

  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?\n\nThe event will be removed from Campentra. Existing student registration records will remain stored for now.`,
    )

    if (!confirmed) {
      return
    }

    setMessage('')

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id)
      .eq('authority_id', user.id)

    if (error) {
      console.error(
        'Delete event error:',
        error,
      )

      setMessage(
        'The event could not be deleted. Please try again.',
      )

      return
    }

    setEvents((current) =>
      current.filter(
        (currentEvent) =>
          currentEvent.id !== event.id,
      ),
    )

    setMessage(
      `"${event.title}" was deleted successfully.`,
    )

    setTimeout(() => {
      setMessage('')
    }, 4000)
  }

  /*
   * =========================================
   * ANNOUNCEMENT FORM
   * =========================================
   */

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      date: '',
      category: '',
      description: '',
      linkType: 'none',
      linkUrl: '',
      eventId: '',
    })

    setEditingAnnouncement(null)
    setShowAnnouncementForm(false)
  }

  const openNewAnnouncementForm = () => {
    setEditingAnnouncement(null)

    setAnnouncementForm({
      title: '',
      date: '',
      category: '',
      description: '',
      linkType: 'none',
      linkUrl: '',
      eventId: '',
    })

    setShowAnnouncementForm(true)
  }

  const handleAnnouncementSubmit = async (
    event,
  ) => {
    event.preventDefault()

    const title =
      announcementForm.title.trim()

    const date =
      announcementForm.date.trim()

    const category =
      announcementForm.category.trim()

    const description =
      announcementForm.description.trim()

    const linkType =
      announcementForm.linkType || 'none'

    const linkUrl =
      announcementForm.linkUrl.trim()

    const eventId =
      announcementForm.eventId || null

    if (
      !title ||
      !date ||
      !category ||
      !description
    ) {
      setMessage(
        'Please complete all announcement fields.',
      )

      return
    }

    if (
      linkType === 'event' &&
      !eventId
    ) {
      setMessage(
        'Please select a Campentra event for the Read More link.',
      )

      return
    }

    if (
      linkType === 'url' &&
      !linkUrl
    ) {
      setMessage(
        'Please enter a URL for the Read More link.',
      )

      return
    }

    if (
      linkType === 'url' &&
      !/^https?:\/\/.+/i.test(linkUrl)
    ) {
      setMessage(
        'Please enter a valid URL beginning with http:// or https://.',
      )

      return
    }

    setAnnouncementSaving(true)
    setMessage('')

    /*
     * Update existing announcement
     */

    if (editingAnnouncement) {
      const {
        data,
        error,
      } = await supabase
        .from('announcements')
        .update({
          title,
          date,
          category,
          description,
          link_type: linkType,
          link_url:
            linkType === 'url'
              ? linkUrl || null
              : null,
          event_id:
            linkType === 'event'
              ? eventId
              : null,
        })
        .eq(
          'id',
          editingAnnouncement.id,
        )
        .eq(
          'authority_id',
          user.id,
        )
        .select(
          'id, title, date, category, description, authority_id, link_type, link_url, event_id, created_at',
        )
        .single()

      if (error) {
        console.error(
          'Update announcement error:',
          error,
        )

        setMessage(
          'The announcement could not be updated. Please try again.',
        )

        setAnnouncementSaving(false)
        return
      }

      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === data.id
            ? data
            : announcement,
        ),
      )

      setMessage(
        `"${data.title}" was updated successfully.`,
      )

      setAnnouncementSaving(false)
      resetAnnouncementForm()

      setTimeout(() => {
        setMessage('')
      }, 4000)

      return
    }

    /*
     * Create new announcement
     */

    const {
      data,
      error,
    } = await supabase
      .from('announcements')
      .insert({
        title,
        date,
        category,
        description,
        authority_id: user.id,
        link_type: linkType,
        link_url:
          linkType === 'url'
            ? linkUrl || null
            : null,
        event_id:
          linkType === 'event'
            ? eventId
            : null,
      })
      .select(
        'id, title, date, category, description, authority_id, link_type, link_url, event_id, created_at',
      )
      .single()

    if (error) {
      console.error(
        'Create announcement error:',
        error,
      )

      setMessage(
        'The announcement could not be created. Please try again.',
      )

      setAnnouncementSaving(false)
      return
    }

    setAnnouncements((current) => [
      data,
      ...current,
    ])

    setMessage(
      `"${data.title}" was published successfully.`,
    )

    setAnnouncementSaving(false)
    resetAnnouncementForm()

    setTimeout(() => {
      setMessage('')
    }, 4000)
  }

  const handleEditAnnouncement = (
    announcement,
  ) => {
    setEditingAnnouncement(announcement)

    setAnnouncementForm({
      title:
        announcement.title || '',

      date:
        announcement.date || '',

      category:
        announcement.category || '',

      description:
        announcement.description || '',

      linkType:
        announcement.link_type || 'none',

      linkUrl:
        announcement.link_url || '',

      eventId:
        announcement.event_id || '',
    })

    setShowAnnouncementForm(true)

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    })
  }

  const handleDeleteAnnouncement = async (
    announcement,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${announcement.title}"?\n\nThis announcement will be removed from the Campentra homepage.`,
    )

    if (!confirmed) {
      return
    }

    setMessage('')

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcement.id)
      .eq('authority_id', user.id)

    if (error) {
      console.error(
        'Delete announcement error:',
        error,
      )

      setMessage(
        'The announcement could not be deleted. Please try again.',
      )

      return
    }

    setAnnouncements((current) =>
      current.filter(
        (currentAnnouncement) =>
          currentAnnouncement.id !==
          announcement.id,
      ),
    )

    if (
      editingAnnouncement?.id ===
      announcement.id
    ) {
      resetAnnouncementForm()
    }

    setMessage(
      `"${announcement.title}" was deleted successfully.`,
    )

    setTimeout(() => {
      setMessage('')
    }, 4000)
  }

  /*
   * =========================================
   * REGISTRATION HANDLERS
   * =========================================
   */

  const handleRegistrationStatus = async (
    registration,
    status,
  ) => {
    const previousStatus =
      registration.status

    setRegistrations((current) =>
      current.map(
        (currentRegistration) =>
          currentRegistration.id ===
          registration.id
            ? {
                ...currentRegistration,
                status,
              }
            : currentRegistration,
      ),
    )

    const {
      data,
      error,
    } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registration.id)
      .select(
        'id, event_id, event_title, full_name, student_id, department, email, phone, year, status, created_at',
      )
      .single()

    if (error) {
      console.error(
        'Registration status error:',
        error,
      )

      setRegistrations((current) =>
        current.map(
          (currentRegistration) =>
            currentRegistration.id ===
            registration.id
              ? {
                  ...currentRegistration,
                  status:
                    previousStatus,
                }
              : currentRegistration,
        ),
      )

      if (
        error.code === 'P0001' &&
        error.message ===
          'Registration capacity for this event has been reached.'
      ) {
        setMessage(
          'This event is currently full. The registration cannot be approved.',
        )
      } else {
        setMessage(
          'The registration status could not be updated. Please try again.',
        )
      }

      return
    }

    setRegistrations((current) =>
      current.map(
        (currentRegistration) =>
          currentRegistration.id === data.id
            ? data
            : currentRegistration,
      ),
    )

    setMessage(
      `${registration.full_name}'s registration is now ${status}.`,
    )

    setTimeout(() => {
      setMessage('')
    }, 4000)
  }

  /*
   * =========================================
   * REGISTRATION FILTERING
   * =========================================
   */

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

  const filteredRegistrations = useMemo(() => {
    const search =
      registrationSearch.trim().toLowerCase()

    return registrations.filter(
      (registration) => {
        const matchesStatus =
          registrationFilter === 'all' ||
          registration.status ===
            registrationFilter

        if (!matchesStatus) {
          return false
        }

        if (!search) {
          return true
        }

        return (
          registration.full_name
            .toLowerCase()
            .includes(search) ||
          registration.student_id
            .toLowerCase()
            .includes(search) ||
          registration.department
            .toLowerCase()
            .includes(search) ||
          registration.email
            .toLowerCase()
            .includes(search) ||
          registration.phone
            .toLowerCase()
            .includes(search) ||
          registration.event_title
            .toLowerCase()
            .includes(search)
        )
      },
    )
  }, [
    registrations,
    registrationSearch,
    registrationFilter,
  ])

  const pendingCount =
    registrations.filter(
      (registration) =>
        registration.status === 'pending',
    ).length

  const approvedCount =
    registrations.filter(
      (registration) =>
        registration.status === 'approved',
    ).length

  const rejectedCount =
    registrations.filter(
      (registration) =>
        registration.status === 'rejected',
    ).length

  /*
   * =========================================
   * SIGN OUT
   * =========================================
   */

  const handleSignOut = async () => {
    await supabase.auth.signOut()

    window.location.hash = '#/authority'
  }

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="authority-page">
        <section className="authority-dashboard-card">
          <p>
            Loading authority dashboard...
          </p>
        </section>
      </main>
    )
  }

  /*
   * =========================================
   * DASHBOARD
   * =========================================
   */

  return (
    <main className="authority-page">
      <section className="authority-dashboard-card">

        {/* HEADER */}

        <div className="authority-dashboard-header">
          <div>
            <p className="eyebrow">
              Authority Dashboard
            </p>

            <h1>
              {profile?.organization_name ||
                'Campentra Authority'}
            </h1>

            <p className="authority-description">
              Welcome,{' '}
              {profile?.display_name ||
                user.email}
              .
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

        {/* MESSAGE */}

        {message && (
          <div
            className="authority-message"
            role="status"
          >
            {message}
          </div>
        )}

        {/* STATS */}

        <div className="authority-stats">
          <div className="stat-card">
            <span className="stat-label">
              Your Events
            </span>

            <strong className="stat-value">
              {events.length}
            </strong>

            <span className="stat-description">
              Events managed by your authority
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Announcements
            </span>

            <strong className="stat-value">
              {announcements.length}
            </strong>

            <span className="stat-description">
              Published campus announcements
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Registrations
            </span>

            <strong className="stat-value">
              {registrations.length}
            </strong>

            <span className="stat-description">
              Student registrations across your
              events
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">
              Pending
            </span>

            <strong className="stat-value">
              {pendingCount}
            </strong>

            <span className="stat-description">
              Awaiting review
            </span>
          </div>
        </div>

        {/* CREATE EVENT */}

        <CreateEvent
          user={user}
          onCreated={handleEventCreated}
        />

        {/* EVENTS */}

        <div className="authority-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Events
              </p>

              <h2>Your Events</h2>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="empty-state">
              No events are currently assigned to
              your authority account.
            </p>
          ) : (
            <div className="authority-event-list">
              {events.map((event) => {
                const eventRegistrationCount =
                  registrations.filter(
                    (registration) =>
                      registration.event_id ===
                        event.id &&
                      registration.status !==
                        'rejected',
                  ).length

                const seatsLeft =
                  event.registration_capacity !==
                    null &&
                  event.registration_capacity !==
                    undefined
                    ? Math.max(
                        event.registration_capacity -
                          eventRegistrationCount,
                        0,
                      )
                    : null

                return (
                  <article
                    key={event.id}
                    className="authority-event-card"
                  >
                    <div>
                      <span className="event-category">
                        {event.category}
                      </span>

                      <h3>{event.title}</h3>

                      <p>
                        {event.date_text} ·{' '}
                        {event.location}
                      </p>

                      <div className="event-capacity-info">
                        {seatsLeft !== null ? (
                          <span className="event-info-pill">
                            {seatsLeft} seats left
                            {' / '}
                            {
                              event.registration_capacity
                            }
                          </span>
                        ) : (
                          <span className="event-info-pill">
                            Unlimited seats
                          </span>
                        )}

                        {event.registration_deadline ? (
                          <span className="event-info-pill">
                            Closes{' '}
                            {new Date(
                              event.registration_deadline,
                            ).toLocaleString([], {
                              dateStyle:
                                'medium',
                              timeStyle:
                                'short',
                            })}
                          </span>
                        ) : (
                          <span className="event-info-pill">
                            No registration
                            deadline
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="authority-event-actions">
                      <strong>
                        {eventRegistrationCount}{' '}
                        {eventRegistrationCount ===
                        1
                          ? 'registration'
                          : 'registrations'}
                      </strong>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setEditingEvent(
                            event,
                          )
                        }
                      >
                        Edit Event
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          handleDeleteEvent(
                            event,
                          )
                        }
                      >
                        Delete Event
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* ANNOUNCEMENTS */}

        <div className="authority-section authority-content-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Content Management
              </p>

              <h2>Announcements</h2>

              <p className="authority-section-description">
                Publish important updates and notices
                that appear on the Campentra homepage.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (
                  showAnnouncementForm
                ) {
                  resetAnnouncementForm()
                } else {
                  openNewAnnouncementForm()
                }
              }}
            >
              {showAnnouncementForm
                ? 'Close'
                : '+ Create Announcement'}
            </button>
          </div>

          {showAnnouncementForm && (
            <form
              className="authority-content-form"
              onSubmit={
                handleAnnouncementSubmit
              }
            >
              <div className="content-form-header">
                <div>
                  <p className="eyebrow">
                    {editingAnnouncement
                      ? 'Edit Announcement'
                      : 'New Announcement'}
                  </p>

                  <h3>
                    {editingAnnouncement
                      ? 'Update announcement'
                      : 'Publish a new announcement'}
                  </h3>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Title</span>

                  <input
                    type="text"
                    value={
                      announcementForm.title
                    }
                    onChange={(event) =>
                      setAnnouncementForm(
                        (current) => ({
                          ...current,
                          title:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="e.g. Semester Registration Opens"
                    required
                  />
                </label>

                <label>
                  <span>Date</span>

                  <input
                    type="text"
                    value={
                      announcementForm.date
                    }
                    onChange={(event) =>
                      setAnnouncementForm(
                        (current) => ({
                          ...current,
                          date:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="e.g. 20 Aug 2026"
                    required
                  />
                </label>

                <label>
                  <span>Category</span>

                  <input
                    type="text"
                    value={
                      announcementForm.category
                    }
                    onChange={(event) =>
                      setAnnouncementForm(
                        (current) => ({
                          ...current,
                          category:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="e.g. Academic"
                    required
                  />
                </label>

                <label className="form-field-full">
                  <span>Description</span>

                  <textarea
                    value={
                      announcementForm.description
                    }
                    onChange={(event) =>
                      setAnnouncementForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Write the announcement details..."
                    rows="5"
                    required
                  />
                </label>

                <label>
                  <span>Read More Link</span>

                  <select
                    value={
                      announcementForm.linkType
                    }
                    onChange={(event) =>
                      setAnnouncementForm(
                        (current) => ({
                          ...current,
                          linkType:
                            event.target.value,
                          linkUrl: '',
                          eventId: '',
                        }),
                      )
                    }
                  >
                    <option value="none">
                      No link
                    </option>

                    <option value="event">
                      Campentra Event
                    </option>

                    <option value="url">
                      Custom URL
                    </option>
                  </select>
                </label>

                {announcementForm.linkType ===
                  'event' && (
                  <label>
                    <span>Select Event</span>

                    <select
                      value={
                        announcementForm.eventId
                      }
                      onChange={(event) =>
                        setAnnouncementForm(
                          (current) => ({
                            ...current,
                            eventId:
                              event.target.value,
                          }),
                        )
                      }
                      required
                    >
                      <option value="">
                        Choose an event
                      </option>

                      {events.map((event) => (
                        <option
                          key={event.id}
                          value={event.id}
                        >
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {announcementForm.linkType ===
                  'url' && (
                  <label className="form-field-full">
                    <span>Custom URL</span>

                    <input
                      type="url"
                      value={
                        announcementForm.linkUrl
                      }
                      onChange={(event) =>
                        setAnnouncementForm(
                          (current) => ({
                            ...current,
                            linkUrl:
                              event.target.value,
                          }),
                        )
                      }
                      placeholder="https://example.com/more-information"
                      required
                    />
                  </label>
                )}
              </div>

              <div className="authority-form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    announcementSaving
                  }
                >
                  {announcementSaving
                    ? 'Saving...'
                    : editingAnnouncement
                      ? 'Update Announcement'
                      : 'Publish Announcement'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetAnnouncementForm
                  }
                  disabled={
                    announcementSaving
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="authority-content-list">
            {announcements.length === 0 ? (
              <div className="authority-content-empty">
                <div className="authority-content-empty-icon">
                  📢
                </div>

                <h3>
                  No announcements yet
                </h3>

                <p>
                  Publish your first announcement
                  and it will appear on the
                  Campentra homepage.
                </p>
              </div>
            ) : (
              announcements.map(
                (announcement) => (
                  <article
                    key={announcement.id}
                    className="authority-content-card"
                  >
                    <div className="authority-content-main">
                      <div className="authority-content-meta">
                        <span className="event-category">
                          {announcement.category}
                        </span>

                        <span className="authority-content-date">
                          {announcement.date}
                        </span>

                        {announcement.link_type ===
                          'event' && (
                          <span className="event-info-pill">
                            Campentra Event
                          </span>
                        )}

                        {announcement.link_type ===
                          'url' && (
                          <span className="event-info-pill">
                            External Link
                          </span>
                        )}
                      </div>

                      <h3>
                        {announcement.title}
                      </h3>

                      <p>
                        {
                          announcement.description
                        }
                      </p>
                    </div>

                    <div className="authority-content-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          handleEditAnnouncement(
                            announcement,
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          handleDeleteAnnouncement(
                            announcement,
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ),
              )
            )}
          </div>
        </div>

        {/* REGISTRATIONS */}

        <div className="authority-section">
          <div className="authority-section-heading">
            <div>
              <p className="eyebrow">
                Students
              </p>

              <h2>Registrations</h2>
            </div>
          </div>

          {registrations.length === 0 ? (
            <p className="empty-state">
              No students have registered for your
              events yet.
            </p>
          ) : (
            <>
              <div className="registration-toolbar">
                <input
                  type="search"
                  className="registration-search"
                  placeholder="Search students, ID, email, department or event..."
                  value={registrationSearch}
                  onChange={(event) =>
                    setRegistrationSearch(
                      event.target.value,
                    )
                  }
                  aria-label="Search registrations"
                />

                <select
                  className="registration-filter"
                  value={registrationFilter}
                  onChange={(event) =>
                    setRegistrationFilter(
                      event.target.value,
                    )
                  }
                  aria-label="Filter registrations by status"
                >
                  <option value="all">
                    All Statuses (
                    {registrations.length})
                  </option>

                  <option value="pending">
                    Pending ({pendingCount})
                  </option>

                  <option value="approved">
                    Approved ({approvedCount})
                  </option>

                  <option value="rejected">
                    Rejected ({rejectedCount})
                  </option>
                </select>
              </div>

              {filteredRegistrations.length ===
              0 ? (
                <p className="empty-state">
                  No registrations match your
                  search or selected status.
                </p>
              ) : (
                <div className="registration-table-wrapper">
                  <table className="registration-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Student ID</th>
                        <th>Department</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Year</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRegistrations.map(
                        (registration) => (
                          <tr
                            key={
                              registration.id
                            }
                          >
                            <td>
                              {
                                registration.full_name
                              }
                            </td>

                            <td>
                              {
                                registration.student_id
                              }
                            </td>

                            <td>
                              {
                                registration.department
                              }
                            </td>

                            <td>
                              {
                                registration.email
                              }
                            </td>

                            <td>
                              {
                                registration.phone
                              }
                            </td>

                            <td>
                              {
                                registration.year
                              }
                            </td>

                            <td>
                              {
                                registration.event_title
                              }
                            </td>

                            <td>
                              <span
                                className={getStatusClass(
                                  registration.status,
                                )}
                              >
                                {
                                  registration.status
                                }
                              </span>
                            </td>

                            <td>
                              <div className="registration-actions">
                                <button
                                  type="button"
                                  className="approve-button"
                                  disabled={
                                    registration.status ===
                                    'approved'
                                  }
                                  onClick={() =>
                                    handleRegistrationStatus(
                                      registration,
                                      'approved',
                                    )
                                  }
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  className="reject-button"
                                  disabled={
                                    registration.status ===
                                    'rejected'
                                  }
                                  onClick={() =>
                                    handleRegistrationStatus(
                                      registration,
                                      'rejected',
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* EDIT EVENT MODAL */}

        {editingEvent && (
          <EditEvent
            event={editingEvent}
            user={user}
            onClose={() =>
              setEditingEvent(null)
            }
            onUpdated={handleEventUpdated}
          />
        )}
      </section>
    </main>
  )
}

export default AuthorityDashboard