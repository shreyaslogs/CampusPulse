function AnnouncementCard({
  title,
  date,
  category,
  description,
  link_type: linkTypeFromDb,
  link_url: linkUrlFromDb,
  event_id: eventIdFromDb,
  linkType = 'none',
  linkUrl = '',
  eventId = null,
  onOpenEvent,
}) {
  const resolvedLinkType =
    linkTypeFromDb ?? linkType ?? 'none'
  const resolvedLinkUrl =
    linkUrlFromDb ?? linkUrl ?? ''
  const resolvedEventId =
    eventIdFromDb ?? eventId ?? null

  const handleReadMore = () => {
    if (resolvedLinkType === 'event') {
      if (resolvedEventId && onOpenEvent) {
        onOpenEvent(resolvedEventId)
      }

      return
    }

    if (resolvedLinkType === 'url') {
      const url = resolvedLinkUrl?.trim()

      if (!url) {
        return
      }

      window.open(
        url,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const hasReadMore =
    (resolvedLinkType === 'event' &&
      Boolean(resolvedEventId)) ||
    (resolvedLinkType === 'url' &&
      Boolean(resolvedLinkUrl?.trim()))

  return (
    <article className="announcement-card">
      <div className="announcement-top">
        <span className="announcement-category">
          {category}
        </span>

        <span className="announcement-date">
          {date}
        </span>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {hasReadMore && (
        <button
          type="button"
          className="announcement-link"
          onClick={handleReadMore}
        >
          Read More <span>→</span>
        </button>
      )}
    </article>
  )
}

export default AnnouncementCard