function EventCard({
  title,
  date,
  location,
  category,
  description,
  registrationCapacity,
  registrationCount = 0,
  registrationDeadline,
  onViewDetails,
}) {
  const deadlinePassed =
    registrationDeadline &&
    new Date(registrationDeadline) <= new Date()

  const seatsLeft =
    registrationCapacity !== null &&
    registrationCapacity !== undefined
      ? Math.max(
          registrationCapacity - registrationCount,
          0,
        )
      : null

  return (
    <article className="event-card">
      <div className="event-card-top">
        <span className="event-category">
          {category}
        </span>

        <span className="event-date">
          {date}
        </span>
      </div>

      <div className="event-card-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <div className="event-card-registration-info">
        {seatsLeft !== null ? (
          <span
            className={
              seatsLeft === 0
                ? 'event-info-pill event-info-danger'
                : 'event-info-pill'
            }
          >
            {seatsLeft === 0
              ? 'Registration Full'
              : `${seatsLeft} seat${
                  seatsLeft === 1 ? '' : 's'
                } left`}
          </span>
        ) : (
          <span className="event-info-pill">
            Unlimited seats
          </span>
        )}

        {registrationDeadline ? (
          <span
            className={
              deadlinePassed
                ? 'event-info-pill event-info-danger'
                : 'event-info-pill'
            }
          >
            {deadlinePassed
              ? 'Registration Closed'
              : `Closes ${new Date(
                  registrationDeadline,
                ).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
          </span>
        ) : (
          <span className="event-info-pill">
            No registration deadline
          </span>
        )}
      </div>

      <div className="event-card-footer">
        <span>{location}</span>

        <button
          type="button"
          onClick={onViewDetails}
        >
          View Details
        </button>
      </div>
    </article>
  )
}

export default EventCard