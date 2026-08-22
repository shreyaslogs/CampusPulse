import { useEffect, useMemo, useState } from 'react'
import './App.css'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import EventCard from './components/EventCard'
import SectionHeader from './components/SectionHeader'
import AnnouncementCard from './components/AnnouncementCard'
import ClubCard from './components/ClubCard'
import EventModal from './components/EventModal'
import RegistrationModal from './components/RegistrationModal'
import StatCard from './components/StatCard'
import AuthorityLogin from './components/AuthorityLogin'
import AuthorityDashboard from './components/AuthorityDashboard'
import StudentAuth from './components/StudentAuth'
import StudentDashboard from './components/StudentDashboard'

import { supabase } from './supabaseClient'
import fallbackCampusListings from './data/campus-listings.json'
import {
  toCampusClubCard,
  toClubCard,
} from './utils/campusListings'

const PENDING_EVENT_KEY = 'Campentra_pending_event_id'

function App() {
  const [currentHash, setCurrentHash] = useState(
    window.location.hash || '#/',
  )

  const [authorityUser, setAuthorityUser] = useState(null)
  const [authorityAuthChecked, setAuthorityAuthChecked] =
    useState(false)
  const [authorityAuthorized, setAuthorityAuthorized] =
    useState(false)

  const [studentUser, setStudentUser] = useState(null)
  const [studentAuthChecked, setStudentAuthChecked] =
    useState(false)
  const [studentAuthorized, setStudentAuthorized] =
    useState(false)

  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')

  const [announcements, setAnnouncements] = useState([])
  const [clubs, setClubs] = useState([])
  const [campusListings, setCampusListings] = useState(
    fallbackCampusListings,
  )
  const [campusContentLoading, setCampusContentLoading] =
    useState(true)
  const [campusContentError, setCampusContentError] =
    useState('')

  const [eventSearch, setEventSearch] = useState('')
  const [eventCategory, setEventCategory] = useState('All')
  const [clubType, setClubType] = useState('All')
  const [clubState, setClubState] = useState('All')
  const [clubCity, setClubCity] = useState('All')

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registrationEvent, setRegistrationEvent] =
    useState(null)

  const [registeredEvents, setRegisteredEvents] =
    useState([])
  const [registrationMessage, setRegistrationMessage] =
    useState('')

  const isAuthorityPortal =
    currentHash === '#/authority'

  const isStudentPortal =
    currentHash === '#/student'

  /*
   * ============================
   * HASH / ROUTE LISTENER
   * ============================
   */

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(
        window.location.hash || '#/',
      )
    }

    window.addEventListener(
      'hashchange',
      handleHashChange,
    )

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange,
      )
    }
  }, [])

  /*
   * ============================
   * AUTHORITY SESSION
   * ============================
   */

  useEffect(() => {
    if (!isAuthorityPortal) {
      return
    }

    let active = true

    const checkAuthorityAccess = async () => {
      setAuthorityAuthChecked(false)
      setAuthorityAuthorized(false)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) {
        return
      }

      if (!user) {
        setAuthorityUser(null)
        setAuthorityAuthorized(false)
        setAuthorityAuthChecked(true)
        return
      }

      setAuthorityUser(user)

      const { data, error } = await supabase
        .from('authority_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      setAuthorityAuthorized(
        Boolean(data) && !error,
      )

      setAuthorityAuthChecked(true)
    }

    checkAuthorityAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) {
          return
        }

        if (!session?.user) {
          setAuthorityUser(null)
          setAuthorityAuthorized(false)
          setAuthorityAuthChecked(true)
          return
        }

        const checkRole = async () => {
          setAuthorityUser(session.user)

          const { data, error } = await supabase
            .from('authority_profiles')
            .select('user_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (!active) {
            return
          }

          setAuthorityAuthorized(
            Boolean(data) && !error,
          )

          setAuthorityAuthChecked(true)
        }

        checkRole()
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isAuthorityPortal])

  /*
   * ============================
   * STUDENT SESSION
   * ============================
   */

  useEffect(() => {
    if (!isStudentPortal) {
      return
    }

    let active = true

    const checkStudentAccess = async () => {
      setStudentAuthChecked(false)
      setStudentAuthorized(false)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) {
        return
      }

      if (!user) {
        setStudentUser(null)
        setStudentAuthorized(false)
        setStudentAuthChecked(true)
        return
      }

      setStudentUser(user)

      const { data, error } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      setStudentAuthorized(
        Boolean(data) && !error,
      )

      setStudentAuthChecked(true)
    }

    checkStudentAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) {
          return
        }

        if (!session?.user) {
          setStudentUser(null)
          setStudentAuthorized(false)
          setStudentAuthChecked(true)
          return
        }

        const checkStudentRole = async () => {
          setStudentUser(session.user)

          const { data, error } = await supabase
            .from('student_profiles')
            .select('user_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (!active) {
            return
          }

          setStudentAuthorized(
            Boolean(data) && !error,
          )

          setStudentAuthChecked(true)
        }

        checkStudentRole()
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [isStudentPortal])

  /*
   * ============================
   * LOAD PUBLIC EVENTS
   * ============================
   */

  useEffect(() => {
    if (
      isAuthorityPortal ||
      isStudentPortal
    ) {
      return
    }

    const loadEvents = async () => {
      setEventsLoading(true)
      setEventsError('')

      const { data, error } = await supabase
        .from('events')
        .select(
          'id, title, date_text, location, category, description, registration_capacity, registration_deadline, registration_count',
        )
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Failed to load events:',
          error,
        )

        setEvents([])
        setEventsError(
          'Unable to load events right now. Please try again.',
        )

        setEventsLoading(false)
        return
      }

      const formattedEvents =
        (data ?? []).map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date_text,
          location: event.location,
          category: event.category,
          description: event.description,
          registrationCapacity:
            event.registration_capacity,
          registrationDeadline:
            event.registration_deadline,
          registrationCount:
            event.registration_count ?? 0,
        }))

      setEvents(formattedEvents)
      setEventsLoading(false)
    }

    loadEvents()
  }, [
    isAuthorityPortal,
    isStudentPortal,
  ])

  /*
   * ============================
   * LOAD ANNOUNCEMENTS + CLUBS
   * ============================
   */

  useEffect(() => {
    if (
      isAuthorityPortal ||
      isStudentPortal
    ) {
      return
    }

    let active = true

    const loadCampusContent = async () => {
      setCampusContentLoading(true)
      setCampusContentError('')

      const [
        {
          data: announcementData,
          error: announcementError,
        },
        {
          data: clubData,
          error: clubError,
        },
        {
          data: listingData,
          error: listingError,
        },
      ] = await Promise.all([
        supabase
          .from('announcements')
          .select(
            'id, title, date, category, description, link_type, link_url, event_id',
          )
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('clubs')
          .select(
            'id, name, category, members, description',
          )
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('campus_listings')
          .select(
            'id, source_key, listing_type, name, category, description, college, city, state, start_date, end_date, source_url, source_name',
          )
          .order('start_date', {
            ascending: true,
          }),
      ])

      if (!active) {
        return
      }

      if (announcementError || clubError) {
        console.error(
          'Campus content loading error:',
          announcementError || clubError,
        )

        setCampusContentError(
          'Unable to load campus announcements and clubs.',
        )

        setAnnouncements([])
        setClubs([])
        setCampusContentLoading(false)

        return
      }

      setAnnouncements(
        announcementData ?? [],
      )

      setClubs(clubData ?? [])

      if (listingError) {
        console.error(
          'Campus listings loading error:',
          listingError,
        )
      }

      const dbListings = listingError
        ? []
        : listingData ?? []

      setCampusListings(
        dbListings.length >= fallbackCampusListings.length
          ? dbListings
          : fallbackCampusListings,
      )

      setCampusContentLoading(false)
    }

    loadCampusContent()

    return () => {
      active = false
    }
  }, [
    isAuthorityPortal,
    isStudentPortal,
  ])

  /*
   * ============================
   * RESUME PENDING REGISTRATION
   * ============================
   */

  useEffect(() => {
    if (
      isAuthorityPortal ||
      isStudentPortal ||
      eventsLoading ||
      events.length === 0
    ) {
      return
    }

    const pendingEventId =
      sessionStorage.getItem(
        PENDING_EVENT_KEY,
      )

    if (!pendingEventId) {
      return
    }

    const pendingEvent = events.find(
      (event) =>
        String(event.id) ===
        String(pendingEventId),
    )

    if (!pendingEvent) {
      return
    }

    const resumeRegistration = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data: studentProfile } =
        await supabase
          .from('student_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

      if (!studentProfile) {
        sessionStorage.removeItem(
          PENDING_EVENT_KEY,
        )
        return
      }

      sessionStorage.removeItem(
        PENDING_EVENT_KEY,
      )

      setSelectedEvent(null)
      setRegistrationEvent(
        pendingEvent,
      )
    }

    resumeRegistration()
  }, [
    events,
    eventsLoading,
    isAuthorityPortal,
    isStudentPortal,
  ])

  /*
   * ============================
   * EVENT FILTERING
   * ============================
   */

  const eventCategories = [
    'All',
    ...new Set(
      events.map(
        (event) => event.category,
      ),
    ),
  ]

  const filteredEvents = useMemo(() => {
    const search =
      eventSearch.trim().toLowerCase()

    return events.filter((event) => {
      const matchesCategory =
        eventCategory === 'All' ||
        event.category === eventCategory

      const matchesSearch =
        !search ||
        event.title
          .toLowerCase()
          .includes(search) ||
        event.description
          .toLowerCase()
          .includes(search) ||
        event.location
          .toLowerCase()
          .includes(search)

      return (
        matchesCategory && matchesSearch
      )
    })
  }, [
    events,
    eventSearch,
    eventCategory,
  ])

  const communityCards = useMemo(() => {
    const campusClubs = clubs.map(toCampusClubCard)
    const publicListings = campusListings.map(
      (listing, index) => toClubCard(listing, index),
    )

    return [...campusClubs, ...publicListings]
  }, [clubs, campusListings])

  const clubStates = useMemo(() => {
    const states = new Set(
      communityCards
        .map((card) => card.state)
        .filter(Boolean),
    )

    return ['All', ...[...states].sort()]
  }, [communityCards])

  const clubCities = useMemo(() => {
    const cities = new Set(
      communityCards
        .filter(
          (card) =>
            clubState === 'All' ||
            card.state === clubState,
        )
        .map((card) => card.city)
        .filter(Boolean),
    )

    return ['All', ...[...cities].sort()]
  }, [communityCards, clubState])

  const filteredCommunityCards = useMemo(() => {
    return communityCards.filter((card) => {
      const matchesType =
        clubType === 'All' ||
        card.listingType === clubType

      const matchesState =
        clubState === 'All' ||
        card.state === clubState ||
        (clubState === 'All' && !card.state)

      const matchesCity =
        clubCity === 'All' ||
        card.city === clubCity

      if (clubState !== 'All' && !card.state) {
        return false
      }

      if (clubCity !== 'All' && !card.city) {
        return false
      }

      return matchesType && matchesState && matchesCity
    })
  }, [
    communityCards,
    clubType,
    clubState,
    clubCity,
  ])

  /*
   * ============================
   * REGISTRATION MESSAGE
   * ============================
   */

  const showRegistrationMessage = (
    message,
  ) => {
    setRegistrationMessage(message)

    setTimeout(() => {
      setRegistrationMessage('')
    }, 4000)
  }

  /*
   * ============================
   * OPEN REGISTRATION
   * ============================
   */

  const handleOpenRegistration = async (
    event,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      sessionStorage.setItem(
        PENDING_EVENT_KEY,
        String(event.id),
      )

      setSelectedEvent(null)
      setRegistrationEvent(null)

      window.location.hash = '#/student'

      return
    }

    const { data: studentProfile } =
      await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!studentProfile) {
      sessionStorage.setItem(
        PENDING_EVENT_KEY,
        String(event.id),
      )

      setSelectedEvent(null)
      setRegistrationEvent(null)

      showRegistrationMessage(
        'Please sign in with a student account before registering.',
      )

      setTimeout(() => {
        window.location.hash = '#/student'
      }, 700)

      return
    }

    if (
      event.registrationDeadline &&
      new Date(event.registrationDeadline) <=
        new Date()
    ) {
      showRegistrationMessage(
        'Registration for this event has closed.',
      )

      return
    }

    if (
      event.registrationCapacity !== null &&
      event.registrationCapacity !==
        undefined &&
      event.registrationCount >=
        event.registrationCapacity
    ) {
      showRegistrationMessage(
        'This event has reached its registration capacity.',
      )

      return
    }

    setSelectedEvent(null)
    setRegistrationEvent(event)
  }

  /*
   * ============================
   * SUBMIT REGISTRATION
   * ============================
   */

  const handleRegistrationSubmit =
    async (registration) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          sessionStorage.setItem(
            PENDING_EVENT_KEY,
            String(
              registration.eventId,
            ),
          )

          setRegistrationEvent(null)
          window.location.hash = '#/student'

          return
        }

        const {
          data: studentProfile,
        } = await supabase
          .from('student_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!studentProfile) {
          sessionStorage.setItem(
            PENDING_EVENT_KEY,
            String(
              registration.eventId,
            ),
          )

          setRegistrationEvent(null)

          showRegistrationMessage(
            'Only student accounts can register for events.',
          )

          setTimeout(() => {
            window.location.hash = '#/student'
          }, 800)

          return
        }

        const student =
          registration.student

        const { error } = await supabase
          .from('registrations')
          .insert({
            event_id: String(
              registration.eventId,
            ),
            event_title:
              registration.eventTitle,
            user_id: user.id,
            full_name:
              student.fullName.trim(),
            student_id:
              student.studentId.trim(),
            department:
              student.department.trim(),
            email:
              student.email
                .trim()
                .toLowerCase(),
            phone:
              student.phone.trim(),
            year: student.year,
          })

        if (error) {
          console.error(
            'Supabase registration error:',
            error,
          )

          if (
            error.code === '23505'
          ) {
            showRegistrationMessage(
              'You are already registered for this event with this email or phone number.',
            )

            return
          }

          if (
            error.code === 'P0001' &&
            error.message ===
              'Registration deadline has passed for this event.'
          ) {
            setRegistrationEvent(null)

            showRegistrationMessage(
              'Registration for this event has closed.',
            )

            return
          }

          if (
            error.code === 'P0001' &&
            error.message ===
              'Registration capacity for this event has been reached.'
          ) {
            setRegistrationEvent(null)

            showRegistrationMessage(
              'This event has reached its registration capacity.',
            )

            return
          }

          showRegistrationMessage(
            'Registration could not be completed. Please try again.',
          )

          return
        }

        setRegisteredEvents(
          (current) => {
            if (
              current.includes(
                registration.eventId,
              )
            ) {
              return current
            }

            return [
              ...current,
              registration.eventId,
            ]
          },
        )

        /*
         * Update the local event registration count
         * so the UI stays accurate without waiting
         * for a full page reload.
         */

        setEvents((currentEvents) =>
          currentEvents.map((currentEvent) =>
            String(currentEvent.id) ===
            String(registration.eventId)
              ? {
                  ...currentEvent,
                  registrationCount:
                    currentEvent.registrationCount +
                    1,
                }
              : currentEvent,
          ),
        )

        setRegistrationEvent(null)

        showRegistrationMessage(
          `Registration submitted successfully for ${registration.eventTitle}.`,
        )
      } catch (error) {
        console.error(
          'Unexpected registration error:',
          error,
        )

        showRegistrationMessage(
          'Something went wrong while submitting your registration.',
        )
      }
    }

  /*
   * ============================
   * AUTHORITY PORTAL
   * ============================
   */

  if (isAuthorityPortal) {
    if (!authorityAuthChecked) {
      return (
        <main className="authority-page">
          <section className="authority-dashboard-card">
            <p>
              Checking authority access...
            </p>
          </section>
        </main>
      )
    }

    if (!authorityUser) {
      return (
        <AuthorityLogin
          onLogin={(user) => {
            setAuthorityUser(user)
            setAuthorityAuthChecked(false)
          }}
        />
      )
    }

    if (!authorityAuthorized) {
      return (
        <main className="authority-page">
          <section className="authority-auth-card">
            <p className="eyebrow">
              Campentra Authority Portal
            </p>

            <h1>Access Denied</h1>

            <p className="authority-description">
              This account is not registered as a
              Campentra authority. Student
              accounts cannot access event
              management or student registration
              data.
            </p>

            <button
              type="button"
              className="primary-button authority-login-button"
              onClick={async () => {
                await supabase.auth.signOut()

                setAuthorityUser(null)
                setAuthorityAuthorized(false)
                setAuthorityAuthChecked(false)

                window.location.hash = '#/'
              }}
            >
              Sign Out
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

    return (
      <AuthorityDashboard
        user={authorityUser}
      />
    )
  }

  /*
   * ============================
   * STUDENT PORTAL
   * ============================
   */

  if (isStudentPortal) {
    if (!studentAuthChecked) {
      return (
        <main className="student-auth-page">
          <section className="student-auth-card">
            <p>
              Checking student authentication...
            </p>
          </section>
        </main>
      )
    }

    if (!studentUser) {
      return (
        <StudentAuth
          onAuthenticated={(user) => {
            setStudentUser(user)
            setStudentAuthorized(true)

            const pendingEventId =
              sessionStorage.getItem(
                PENDING_EVENT_KEY,
              )

            if (pendingEventId) {
              window.location.hash = '#/'
            }
          }}
        />
      )
    }

    if (!studentAuthorized) {
      return (
        <main className="student-auth-page">
          <section className="student-auth-card">
            <p className="eyebrow">
              Campentra Student Portal
            </p>

            <h1>
              Student Access Required
            </h1>

            <p className="student-auth-description">
              This account is not configured as a
              student account. Authority accounts
              must use the Authority Portal.
            </p>

            <button
              type="button"
              className="primary-button student-auth-submit"
              onClick={async () => {
                await supabase.auth.signOut()

                setStudentUser(null)
                setStudentAuthorized(false)
                setStudentAuthChecked(false)

                window.location.hash = '#/'
              }}
            >
              Sign Out
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

    return (
      <StudentDashboard
        user={studentUser}
      />
    )
  }

  /*
   * ============================
   * PUBLIC CAMPENTRA
   * ============================
   */

  return (
    <div className="app">
      <Navbar />

      <main>
        <Hero />

        <section
          className="dashboard-section"
          aria-label="Campus overview"
        >
          <div className="dashboard-grid">
            <StatCard
              label="Upcoming Events"
              value={events.length}
              description="Events happening soon"
            />

            <StatCard
              label="Announcements"
              value={announcements.length}
              description="Latest campus updates"
            />

            <StatCard
              label="Active Clubs"
              value={communityCards.length}
              description="Clubs and college events"
            />

            <StatCard
              label="Campentra"
              value="Live"
              description="Your campus at a glance"
            />
          </div>
        </section>

        <section
          id="events"
          className="events-section"
        >
          <SectionHeader
            eyebrow="What's happening"
            title="Upcoming Events"
            description="Discover what's happening around your campus."
          />

          <div className="event-controls">
            <input
              type="search"
              placeholder="Search events..."
              value={eventSearch}
              onChange={(inputEvent) =>
                setEventSearch(
                  inputEvent.target.value,
                )
              }
              aria-label="Search events"
            />

            <select
              value={eventCategory}
              onChange={(inputEvent) =>
                setEventCategory(
                  inputEvent.target.value,
                )
              }
              aria-label="Filter events by category"
            >
              {eventCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ),
              )}
            </select>
          </div>

          {eventsLoading ? (
            <p className="empty-state">
              Loading events...
            </p>
          ) : eventsError ? (
            <p className="empty-state">
              {eventsError}
            </p>
          ) : (
            <>
              <div className="events-grid">
                {filteredEvents.map(
                  (event) => (
                    <EventCard
                      key={event.id}
                      {...event}
                      onViewDetails={() =>
                        setSelectedEvent(
                          event,
                        )
                      }
                    />
                  ),
                )}
              </div>

              {filteredEvents.length ===
                0 && (
                <p className="empty-state">
                  No events match your search
                  or selected category.
                </p>
              )}
            </>
          )}
        </section>

        <section
          id="announcements"
          className="announcements-section"
        >
          <SectionHeader
            eyebrow="Stay informed"
            title="Latest Announcements"
            description="Important updates and notices from your campus community."
          />

          {campusContentLoading ? (
            <p className="empty-state">
              Loading announcements...
            </p>
          ) : campusContentError ? (
            <p className="empty-state">
              {campusContentError}
            </p>
          ) : announcements.length === 0 ? (
            <p className="empty-state">
              No announcements available right now.
            </p>
          ) : (
            <div className="announcements-grid">
              {announcements.map(
                (announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    {...announcement}
                    onOpenEvent={(eventId) => {
                      const event = events.find(
                        (currentEvent) =>
                          String(currentEvent.id) ===
                          String(eventId),
                      )

                      if (!event) {
                        showRegistrationMessage(
                          'This event is no longer available.',
                        )
                        return
                      }

                      setSelectedEvent(event)
                    }}
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section
          id="clubs"
          className="clubs-section"
        >
          <SectionHeader
            eyebrow="Find your community"
            title="Clubs & Communities"
            description="Campus clubs, college events across Indian states and cities, and global Google Developer Group communities — collected from KnowAFest and the GDG chapter directory with Bright Data."
          />

          <div className="event-controls club-controls">
            <select
              value={clubType}
              onChange={(inputEvent) =>
                setClubType(inputEvent.target.value)
              }
              aria-label="Filter by listing type"
            >
              <option value="All">All types</option>
              <option value="club">Campus clubs</option>
              <option value="event">College events</option>
              <option value="community">Communities</option>
            </select>

            <select
              value={clubState}
              onChange={(inputEvent) => {
                setClubState(inputEvent.target.value)
                setClubCity('All')
              }}
              aria-label="Filter by state or country"
            >
              {clubStates.map((state) => (
                <option key={state} value={state}>
                  {state === 'All' ? 'All states / countries' : state}
                </option>
              ))}
            </select>

            <select
              value={clubCity}
              onChange={(inputEvent) =>
                setClubCity(inputEvent.target.value)
              }
              aria-label="Filter by city"
            >
              {clubCities.map((city) => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All cities' : city}
                </option>
              ))}
            </select>
          </div>

          {campusContentLoading ? (
            <p className="empty-state">
              Loading clubs and college events...
            </p>
          ) : campusContentError ? (
            <p className="empty-state">
              {campusContentError}
            </p>
          ) : filteredCommunityCards.length === 0 ? (
            <p className="empty-state">
              No clubs or college events match this state and city.
            </p>
          ) : (
            <div className="clubs-grid">
              {filteredCommunityCards.map((card) => (
                <ClubCard
                  key={card.id}
                  {...card}
                />
              ))}
            </div>
          )}
        </section>

        <EventModal
          event={selectedEvent}
          onClose={() =>
            setSelectedEvent(null)
          }
          isRegistered={
            selectedEvent
              ? registeredEvents.includes(
                  selectedEvent.id,
                )
              : false
          }
          onRegister={
            handleOpenRegistration
          }
        />

        <RegistrationModal
          event={registrationEvent}
          onClose={() =>
            setRegistrationEvent(null)
          }
          onSubmit={
            handleRegistrationSubmit
          }
        />

        {registrationMessage && (
          <div
            className="registration-toast"
            role="status"
          >
            {registrationMessage}
          </div>
        )}
      </main>
    </div>
  )
}

export default App