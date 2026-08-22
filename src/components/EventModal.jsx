function EventModal({ event, onClose, isRegistered, onRegister }) {
  if (!event) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close event details"
          onClick={onClose}
        >
          ×
        </button>

        <span className="event-category">{event.category}</span>

        <h2 id="event-modal-title">{event.title}</h2>

        <p className="modal-description">{event.description}</p>

        <div className="modal-details">
          <div>
            <strong>Date</strong>
            <span>{event.date}</span>
          </div>

          <div>
            <strong>Location</strong>
            <span>{event.location}</span>
          </div>
        </div>

        <button
  type="button"
  className="primary-button modal-action"
  disabled={isRegistered}
  onClick={() => onRegister(event)}
>
  {isRegistered ? '✓ Registered' : 'Register for Event'}
</button>
      </div>
    </div>
  )
}

export default EventModal