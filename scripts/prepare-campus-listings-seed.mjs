import { readFile, writeFile } from 'node:fs/promises'

const rows = JSON.parse(
  await readFile('./src/data/campus-listings.json', 'utf8'),
)

for (const row of rows) {
  if (row.state === 'NA') {
    row.state = ''
  }

  if (row.city === 'NA') {
    row.city = ''
  }
}

await writeFile(
  './src/data/campus-listings.json',
  `${JSON.stringify(rows, null, 2)}\n`,
)

function escapeSql(value) {
  return String(value ?? '').replaceAll("'", "''")
}

const values = rows
  .map(
    (row) =>
      `('${escapeSql(row.source_key)}','${escapeSql(row.listing_type)}','${escapeSql(row.name)}','${escapeSql(row.category)}','${escapeSql(row.description)}','${escapeSql(row.college)}','${escapeSql(row.city)}','${escapeSql(row.state)}','${escapeSql(row.start_date)}','${escapeSql(row.end_date)}','${escapeSql(row.source_url)}','${escapeSql(row.source_name)}')`,
  )
  .join(',\n')

await writeFile(
  './scripts/campus-listings-seed.sql',
  `insert into public.campus_listings (source_key, listing_type, name, category, description, college, city, state, start_date, end_date, source_url, source_name) values\n${values}\non conflict (source_key) do update set\n  name = excluded.name,\n  category = excluded.category,\n  description = excluded.description,\n  college = excluded.college,\n  city = excluded.city,\n  state = excluded.state,\n  start_date = excluded.start_date,\n  end_date = excluded.end_date,\n  source_url = excluded.source_url,\n  collected_at = now();\n`,
)

console.log(`Prepared ${rows.length} listings`)
