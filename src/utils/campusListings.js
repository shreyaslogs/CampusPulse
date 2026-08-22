const KNOWAFEST_LIST_URL =
  'https://www.knowafest.com/explore/upcomingfests'

export function parseOrganiser(organiser = '') {
  const parts = String(organiser)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 3) {
    return {
      college: parts.slice(0, -2).join(', '),
      city: parts[parts.length - 2],
      state: parts[parts.length - 1],
    }
  }

  if (parts.length === 2) {
    return {
      college: parts[0],
      city: parts[1],
      state: '',
    }
  }

  return {
    college: organiser.trim(),
    city: '',
    state: '',
  }
}

export function cleanFestName(name = '') {
  return String(name)
    .replace(/\s*Read More\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSourceKey(row) {
  return [
    cleanFestName(row.fest_name || row.name),
    row.start_date || '',
    row.organiser || row.college || '',
  ]
    .join('|')
    .toLowerCase()
}

export function normalizeListing(row) {
  const organiser =
    row.organiser || row.college || ''
  const parsed = parseOrganiser(organiser)
  const name = cleanFestName(
    row.fest_name || row.name || '',
  )
  const category =
    row.fest_type || row.category || 'Event'
  const college =
    row.college ||
    (parsed.city ? parsed.college : organiser) ||
    parsed.college
  const city = row.city || parsed.city
  const state = row.state || parsed.state
  const cleanedState = state === 'NA' ? '' : state
  const cleanedCity = city === 'NA' ? '' : city

  return {
    source_key: row.source_key || buildSourceKey(row),
    listing_type: row.listing_type || 'event',
    name,
    category,
    description:
      row.description ||
      [college, category].filter(Boolean).join(' — '),
    college,
    city: cleanedCity,
    state: cleanedState,
    start_date: row.start_date || row.startDate || '',
    end_date: row.end_date || row.endDate || '',
    source_url:
      row.detail_url ||
      row.source_url ||
      row.sourceUrl ||
      KNOWAFEST_LIST_URL,
    source_name: row.source_name || 'KnowAFest',
  }
}

// Normalizes rows from the GDG chapters collector
// (c_mt42d0uy2d5smzeqmu against https://gdg.community.dev/chapters/).
// Confirmed real fields: chapter_name, city, country, chapter_url.
// No focus area or member count comes back from this source, so those are
// left blank/null rather than guessed.
export function normalizeCommunityListing(row) {
  const name = cleanFestName(row.chapter_name || row.name || '')
  const city = row.city === 'NA' ? '' : row.city || ''
  // Communities are global (city + country), not city + state like
  // KnowAFest events. We reuse the `state` column to hold country so the
  // existing state/city filter UI works without changes — label it as
  // "Country" wherever it's rendered for this listing type.
  const country = row.country === 'NA' ? '' : row.country || ''
  const category = 'Google Developer Group'

  return {
    source_key:
      row.source_key || [name, city, country].join('|').toLowerCase(),
    listing_type: 'community',
    name,
    category,
    description: [category, [city, country].filter(Boolean).join(', ')]
      .filter(Boolean)
      .join(' — '),
    college: '',
    city,
    state: country,
    start_date: '',
    end_date: '',
    source_url: row.chapter_url || row.source_url || row.url || '',
    source_name: 'GDG Community Directory',
    members: null,
  }
}

export function toClubCard(listing, index = 0) {
  return {
    id: listing.id || listing.source_key || `listing-${index}`,
    name: listing.name,
    category: listing.category,
    members: listing.members ?? null,
    description: listing.description,
    college: listing.college || '',
    city: listing.city || '',
    state: listing.state || '',
    listingType: listing.listing_type || listing.listingType || 'event',
    sourceUrl: listing.source_url || listing.sourceUrl || '',
    startDate: listing.start_date || listing.startDate || '',
  }
}

export function toCampusClubCard(club) {
  return {
    id: club.id,
    name: club.name,
    category: club.category,
    members: club.members ?? 0,
    description: club.description,
    college: '',
    city: '',
    state: '',
    listingType: 'club',
    sourceUrl: '',
    startDate: '',
  }
}