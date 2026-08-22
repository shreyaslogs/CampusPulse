function ClubCard({
  name,
  category,
  members,
  description,
  college = '',
  city = '',
  state = '',
  listingType = 'club',
  sourceUrl = '',
  startDate = '',
}) {
  const location = [city, state].filter(Boolean).join(', ')
  const meta =
    listingType === 'event'
      ? [startDate, location || college].filter(Boolean).join(' · ')
      : listingType === 'community'
        ? location
        : members != null
          ? `${members} members`
          : location

  const typeLabel =
    listingType === 'event'
      ? 'College event'
      : listingType === 'community'
        ? 'Community'
        : 'Campus club'

  const actionLabel =
    listingType === 'event'
      ? 'View event'
      : listingType === 'community'
        ? 'View community'
        : 'View club'

  const openSource = () => {
    if (!sourceUrl) {
      return
    }

    window.open(sourceUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="club-card">
      <div className="club-icon" aria-hidden="true">
        {(name || '?').charAt(0)}
      </div>

      <span className="club-category">
        {typeLabel}
        {category ? ` · ${category}` : ''}
      </span>

      <h3>{name}</h3>

      {college ? (
        <p className="club-college">{college}</p>
      ) : null}

      <p>{description}</p>

      <div className="club-footer">
        <span>{meta || 'Open to students'}</span>

        {sourceUrl ? (
          <button type="button" onClick={openSource}>
            {actionLabel} →
          </button>
        ) : (
          <button type="button">{actionLabel}</button>
        )}
      </div>
    </article>
  )
}

export default ClubCard