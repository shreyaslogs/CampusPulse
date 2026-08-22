import { useState } from 'react'
import { supabase } from '../supabaseClient'

function EditEvent({ event, user, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    title: event.title,
    dateText: event.date_text,
    location: event.location,
    category: event.category,
    description: event.description,
    registrationCapacity:
      event.registration_capacity ?? '',
    registrationDeadline: event.registration_deadline
      ? new Date(event.registration_deadline)
          .toISOString()
          .slice(0, 16)
      : '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault()

    setLoading(true)
    setError('')

    const capacity = formData.registrationCapacity
      ? Number(formData.registrationCapacity)
      : null

    if (
      capacity !== null &&
      (!Number.isInteger(capacity) || capacity <= 0)
    ) {
      setError(
        'Registration capacity must be a positive whole number.',
      )
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: formData.title.trim(),
        date_text: formData.dateText.trim(),
        location: formData.location.trim(),
        category: formData.category,
        description: formData.description.trim(),
        registration_capacity: capacity,
        registration_deadline:
          formData.registrationDeadline
            ? new Date(
                formData.registrationDeadline,
              ).toISOString()
            : null,
      })
      .eq('id', event.id)
      .eq('authority_id', user.id)

    if (updateError) {
      console.error('Update event error:', updateError)
      setError(
        'The event could not be updated. Please try again.',
      )
      setLoading(false)
      return
    }

    setLoading(false)
    onUpdated()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="registration-modal edit-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-event-title"
        onClick={(clickEvent) =>
          clickEvent.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close edit event form"
        >
          ×
        </button>

        <span className="event-category">
          Event Management
        </span>

        <h2 id="edit-event-title">Edit Event</h2>

        <form
          className="create-event-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="edit-event-title-input">
              Event Title *
            </label>
            <input
              id="edit-event-title-input"
              type="text"
              value={formData.title}
              onChange={(inputEvent) =>
                handleChange(
                  'title',
                  inputEvent.target.value,
                )
              }
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="edit-event-date">
                Event Date *
              </label>
              <input
                id="edit-event-date"
                type="text"
                value={formData.dateText}
                onChange={(inputEvent) =>
                  handleChange(
                    'dateText',
                    inputEvent.target.value,
                  )
                }
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit-event-category">
                Category *
              </label>
              <select
                id="edit-event-category"
                value={formData.category}
                onChange={(inputEvent) =>
                  handleChange(
                    'category',
                    inputEvent.target.value,
                  )
                }
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
                <option value="Campus">Campus</option>
                <option value="Competition">
                  Competition
                </option>
                <option value="Club">Club</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="edit-event-location">
              Location *
            </label>
            <input
              id="edit-event-location"
              type="text"
              value={formData.location}
              onChange={(inputEvent) =>
                handleChange(
                  'location',
                  inputEvent.target.value,
                )
              }
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-event-description">
              Description *
            </label>
            <textarea
              id="edit-event-description"
              value={formData.description}
              onChange={(inputEvent) =>
                handleChange(
                  'description',
                  inputEvent.target.value,
                )
              }
              rows="5"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="edit-event-capacity">
                Registration Capacity
              </label>
              <input
                id="edit-event-capacity"
                type="number"
                min="1"
                step="1"
                value={formData.registrationCapacity}
                onChange={(inputEvent) =>
                  handleChange(
                    'registrationCapacity',
                    inputEvent.target.value,
                  )
                }
              />
              <span className="field-hint">
                Blank means unlimited.
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="edit-event-deadline">
                Registration Deadline
              </label>
              <input
                id="edit-event-deadline"
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(inputEvent) =>
                  handleChange(
                    'registrationDeadline',
                    inputEvent.target.value,
                  )
                }
              />
              <span className="field-hint">
                Blank means no deadline.
              </span>
            </div>
          </div>

          {error && (
            <p className="authority-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? 'Saving Changes...'
              : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditEvent