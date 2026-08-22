import { useState } from 'react'
import { supabase } from '../supabaseClient'

function CreateEvent({ user, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    dateText: '',
    location: '',
    category: 'Workshop',
    description: '',
    registrationCapacity: '',
    registrationDeadline: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    const capacity = formData.registrationCapacity
      ? Number(formData.registrationCapacity)
      : null

    if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
      setError('Registration capacity must be a positive whole number.')
      setLoading(false)
      return
    }

    const eventId = crypto.randomUUID()

    const { error: insertError } = await supabase
      .from('events')
      .insert({
        id: eventId,
        title: formData.title.trim(),
        date_text: formData.dateText.trim(),
        location: formData.location.trim(),
        category: formData.category,
        description: formData.description.trim(),
        registration_capacity: capacity,
        registration_deadline: formData.registrationDeadline
          ? new Date(formData.registrationDeadline).toISOString()
          : null,
        authority_id: user.id,
      })

    if (insertError) {
      console.error('Create event error:', insertError)
      setError('The event could not be created. Please try again.')
      setLoading(false)
      return
    }

    setFormData({
      title: '',
      dateText: '',
      location: '',
      category: 'Workshop',
      description: '',
      registrationCapacity: '',
      registrationDeadline: '',
    })

    setMessage('Event created successfully.')
    setLoading(false)

    if (onCreated) {
      onCreated()
    }
  }

  return (
    <section className="authority-section">
      <div className="authority-section-heading">
        <div>
          <p className="eyebrow">Event Management</p>
          <h2>Create an Event</h2>
        </div>
      </div>

      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="event-title">Event Title *</label>
          <input
            id="event-title"
            type="text"
            value={formData.title}
            onChange={(event) =>
              handleChange('title', event.target.value)
            }
            placeholder="e.g. AI & Future Technology"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="event-date">Event Date *</label>
            <input
              id="event-date"
              type="text"
              value={formData.dateText}
              onChange={(event) =>
                handleChange('dateText', event.target.value)
              }
              placeholder="e.g. 12 Sep 2026"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="event-category">Category *</label>
            <select
              id="event-category"
              value={formData.category}
              onChange={(event) =>
                handleChange('category', event.target.value)
              }
            >
              <option value="Workshop">Workshop</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Seminar">Seminar</option>
              <option value="Campus">Campus</option>
              <option value="Competition">Competition</option>
              <option value="Club">Club</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="event-location">Location *</label>
          <input
            id="event-location"
            type="text"
            value={formData.location}
            onChange={(event) =>
              handleChange('location', event.target.value)
            }
            placeholder="e.g. Innovation Lab"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="event-description">Description *</label>
          <textarea
            id="event-description"
            value={formData.description}
            onChange={(event) =>
              handleChange('description', event.target.value)
            }
            placeholder="Describe the event..."
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="event-capacity">
              Registration Capacity
            </label>
            <input
              id="event-capacity"
              type="number"
              min="1"
              step="1"
              value={formData.registrationCapacity}
              onChange={(event) =>
                handleChange(
                  'registrationCapacity',
                  event.target.value,
                )
              }
              placeholder="e.g. 100"
            />
            <span className="field-hint">
              Leave blank for unlimited registrations.
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="event-deadline">
              Registration Deadline
            </label>
            <input
              id="event-deadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(event) =>
                handleChange(
                  'registrationDeadline',
                  event.target.value,
                )
              }
            />
            <span className="field-hint">
              Leave blank for no deadline.
            </span>
          </div>
        </div>

        {error && (
          <p className="authority-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="authority-message" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </section>
  )
}

export default CreateEvent