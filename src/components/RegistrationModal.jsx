import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function RegistrationModal({ event, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    department: '',
    email: '',
    phone: '',
    year: '',
  })

  const [errors, setErrors] = useState({})
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!event) {
      return
    }

    const loadStudentProfile = async () => {
      setProfileLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProfileLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('student_profiles')
        .select('full_name, student_id, department, year, phone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error(
          'Unable to load student profile:',
          error,
        )

        setFormData((current) => ({
          ...current,
          email: user.email ?? '',
        }))

        setProfileLoading(false)
        return
      }

      setFormData({
        fullName: profile?.full_name ?? '',
        studentId: profile?.student_id ?? '',
        department: profile?.department ?? '',
        email: user.email ?? '',
        phone: profile?.phone ?? '',
        year: profile?.year ?? '',
      })

      setProfileLoading(false)
    }

    loadStudentProfile()

    setErrors({})
  }, [event])

  if (!event) {
    return null
  }

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: '',
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.'
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required.'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email,
      )
    ) {
      newErrors.email = 'Enter a valid email address.'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.'
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone =
        'Enter a valid 10-digit phone number.'
    }

    if (!formData.year) {
      newErrors.year = 'Select your year.'
    }

    return newErrors
  }

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault()

    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      eventId: event.id,
      eventTitle: event.title,
      student: formData,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="registration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
        onClick={(clickEvent) =>
          clickEvent.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close registration form"
          onClick={onClose}
        >
          ×
        </button>

        <span className="event-category">
          {event.category}
        </span>

        <h2 id="registration-modal-title">
          Register for {event.title}
        </h2>

        <p className="modal-description">
          Your saved student profile has been loaded.
          Review your details before submitting the
          registration.
        </p>

        {profileLoading ? (
          <div className="profile-loading">
            Loading your student profile...
          </div>
        ) : (
          <form
            className="registration-form"
            onSubmit={handleSubmit}
          >
            <div className="form-field">
              <label htmlFor="fullName">
                Full Name *
              </label>

              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(inputEvent) =>
                  handleChange(
                    'fullName',
                    inputEvent.target.value,
                  )
                }
                autoComplete="name"
              />

              {errors.fullName && (
                <span className="form-error">
                  {errors.fullName}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="studentId">
                Student ID / Roll Number *
              </label>

              <input
                id="studentId"
                type="text"
                value={formData.studentId}
                onChange={(inputEvent) =>
                  handleChange(
                    'studentId',
                    inputEvent.target.value,
                  )
                }
              />

              {errors.studentId && (
                <span className="form-error">
                  {errors.studentId}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="department">
                Department *
              </label>

              <input
                id="department"
                type="text"
                value={formData.department}
                onChange={(inputEvent) =>
                  handleChange(
                    'department',
                    inputEvent.target.value,
                  )
                }
                placeholder="e.g. Electronics & Telecommunication"
              />

              {errors.department && (
                <span className="form-error">
                  {errors.department}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="email">
                  Account Email *
                </label>

                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  autoComplete="email"
                />

                {errors.email && (
                  <span className="form-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="phone">
                  Phone *
                </label>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(inputEvent) =>
                    handleChange(
                      'phone',
                      inputEvent.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10),
                    )
                  }
                  autoComplete="tel"
                />

                {errors.phone && (
                  <span className="form-error">
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="year">
                Year *
              </label>

              <select
                id="year"
                value={formData.year}
                onChange={(inputEvent) =>
                  handleChange(
                    'year',
                    inputEvent.target.value,
                  )
                }
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

              {errors.year && (
                <span className="form-error">
                  {errors.year}
                </span>
              )}
            </div>

            <p className="privacy-note">
              Your registration is linked to your
              authenticated Campentra student account.
              Only the information required for this event
              is submitted.
            </p>

            <button
              type="submit"
              className="primary-button modal-action"
            >
              Submit Registration
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default RegistrationModal
