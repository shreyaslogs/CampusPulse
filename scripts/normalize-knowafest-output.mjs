import { readFile, writeFile } from 'node:fs/promises'
import { normalizeListing } from '../src/utils/campusListings.js'

const raw = JSON.parse(
  await readFile('./scripts/examples/knowafest-output.json', 'utf8'),
)

const unique = []
const seen = new Set()

for (const row of raw) {
  const listing = normalizeListing({
    ...row,
    college: row.organiser || row.college,
    source_url:
      row.detail_url ||
      'https://www.knowafest.com/explore/upcomingfests',
  })

  if (listing.state === 'NA') {
    listing.state = ''
  }

  if (listing.city === 'NA') {
    listing.city = ''
  }

  if (!listing.name || seen.has(listing.source_key)) {
    continue
  }

  seen.add(listing.source_key)
  unique.push(listing)
}

await writeFile(
  './src/data/campus-listings.json',
  `${JSON.stringify(unique, null, 2)}\n`,
)

console.log(`Normalized ${unique.length} Bright Data listings`)
console.log(
  'States:',
  [...new Set(unique.map((row) => row.state).filter(Boolean))].join(', '),
)
