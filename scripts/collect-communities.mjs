import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { normalizeCommunityListing } from '../src/utils/campusListings.js'

// Confirmed working collector: c_mt42d0uy2d5smzeqmu, created against
// https://gdg.community.dev/chapters/ (Google Developer Groups chapter
// directory — public, global, not part of Bright Data's pre-built library).
const COLLECTOR_ID =
  process.env.BRIGHT_DATA_COMMUNITIES_COLLECTOR_ID ||
  'c_mt42d0uy2d5smzeqmu'

const TARGET_URL =
  process.env.BRIGHT_DATA_COMMUNITIES_URL ||
  'https://gdg.community.dev/chapters/'

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

function runScraper() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      [
        '-p',
        '@brightdata/cli',
        'bdata',
        'scraper',
        'run',
        COLLECTOR_ID,
        TARGET_URL,
        '--pretty',
      ],
      { cwd: root, shell: true },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      const text = String(chunk)
      stdout += text
      process.stdout.write(text)
    })

    child.stderr.on('data', (chunk) => {
      const text = String(chunk)
      stderr += text
      process.stderr.write(text)
    })

    child.on('error', reject)

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `Bright Data scraper exited with code ${code}`,
          ),
        )
        return
      }

      resolve(stdout)
    })
  })
}

function extractJson(output) {
  const start = output.indexOf('[')
  const end = output.lastIndexOf(']')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Scraper output did not include a JSON array.')
  }

  const parsed = JSON.parse(output.slice(start, end + 1))

  // This collector (c_mt42d0uy2d5smzeqmu against gdg.community.dev/chapters/)
  // returns one wrapper object per page visited, each holding a `chapters`
  // array (usually with a single entry). Flatten that down to a flat list
  // of chapter rows before normalizing.
  return parsed.flatMap((entry) =>
    Array.isArray(entry.chapters) ? entry.chapters : [entry],
  )
}

async function upsertListings(listings) {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log(
      'Skipping database upsert. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to sync listings.',
    )
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { error } = await supabase
    .from('campus_listings')
    .upsert(listings, { onConflict: 'source_key' })

  if (error) {
    throw error
  }
}

const output = await runScraper()
const communityRows = extractJson(output)
  .map(normalizeCommunityListing)
  .filter((listing) => listing.name)

const dataDir = path.join(root, 'src', 'data')
await mkdir(dataDir, { recursive: true })
const jsonPath = path.join(dataDir, 'campus-listings.json')

// Merge with existing listings (events + any prior communities) instead of
// overwriting, keyed by source_key so re-runs update in place.
const existing = JSON.parse(await readFile(jsonPath, 'utf8').catch(() => '[]'))
const bySourceKey = new Map(
  existing.map((row) => [row.source_key, row]),
)

for (const row of communityRows) {
  bySourceKey.set(row.source_key, row)
}

const merged = [...bySourceKey.values()]

await writeFile(jsonPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
await upsertListings(communityRows)

console.log(
  `Saved ${communityRows.length} community listings (${merged.length} total listings) to ${path.relative(root, jsonPath)}`,
)