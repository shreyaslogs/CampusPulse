import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { normalizeListing } from '../src/utils/campusListings.js'

const COLLECTOR_ID =
  process.env.BRIGHT_DATA_COLLECTOR_ID ||
  'c_mt1siw2t2hb6awqkr9'

const TARGET_URL =
  'https://www.knowafest.com/explore/upcomingfests'

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
      {
        cwd: root,
        shell: true,
      },
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

  if (!Array.isArray(parsed)) {
    throw new Error('Scraper JSON was not an array.')
  }

  return parsed
}

async function upsertListings(listings) {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log(
      'Skipping database upsert. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to sync listings.',
    )
    return
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
  )

  const { error } = await supabase
    .from('campus_listings')
    .upsert(listings, { onConflict: 'source_key' })

  if (error) {
    throw error
  }
}

const output = await runScraper()
const rows = extractJson(output)
  .map(normalizeListing)
  .filter((listing) => listing.name)

const dataDir = path.join(root, 'src', 'data')
await mkdir(dataDir, { recursive: true })

const jsonPath = path.join(
  dataDir,
  'campus-listings.json',
)

await writeFile(
  jsonPath,
  `${JSON.stringify(rows, null, 2)}\n`,
  'utf8',
)

await upsertListings(rows)

console.log(
  `Saved ${rows.length} campus listings to ${path.relative(root, jsonPath)}`,
)
