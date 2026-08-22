```mermaid
graph TD

%% Base Styles
classDef main fill:#1f2937,stroke:#3b82f6,stroke-width:2px,color:#fff;
classDef auth fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
classDef public fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff;
classDef data fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#fff;

%% Root
CAMPENTRA[CAMPENTRA PLATFORM]:::main

%% Core Splitting Branches
CAMPENTRA -->|Branch 1| OCC[OFFICIAL CAMPUS CONTENT]:::auth
CAMPENTRA -->|Branch 2| CC[CLUBS & COMMUNITIES]:::public

%% LEFT SIDE: Official Content & Deep Auth Rules
OCC --> AU[Authorized Campus Users]:::auth

AU -->|Manage Content| MGMT[Post / Update Events & Announcements]:::auth
AU -->|Application Review| APP_REV{Approve or Reject <br> Student Registration?}:::auth

%% Registration Logic Loop
STUDENT[Student View Event]:::public
STUDENT --> AUTH_CHK{Is Student <br> Logged In?}:::public
AUTH_CHK -->|No| REG_FLOW[Create Account <br> Verify Email Confirmation Link]:::public
REG_FLOW -->|Account Created| DB_PROFILE[(Supabase User Profile)]:::data
AUTH_CHK -->|Yes| REG_SUB[Submit Registration <br> Auto-fills Profile Data]:::public
DB_PROFILE --> REG_SUB

%% Constraint Validation
REG_SUB --> DUP_CHK{Already Registered? <br> Check Email & Phone}:::data
DUP_CHK -->|Yes| ERR[Block Duplicate Entry]:::data
DUP_CHK -->|No| APP_REV

%% Review Outcomes
APP_REV -->|APPROVED| APP_YES[Seat Deducted <br> Auto-Update Student Dashboard Notification]:::auth
APP_REV -->|REJECTED| APP_NO[Seat Released <br> Auto-Update Student Dashboard Notification]:::auth

APP_YES --> SU_DB1[(Supabase Database)]:::data
APP_NO --> SU_DB1
MGMT --> SU_DB1

%% RIGHT SIDE: Scraping Pipeline
CC --> GDG[GDG Community Platform]:::public
GDG --> BDS[Bright Data Scraper CLI]:::public
BDS -->|Extract Layout| RCD[Raw Chapter Data <br> member_count & focus_area]:::public
RCD --> NJ[Node.js Runtime Script]:::public
NJ --> CP[Data Cleaning & Parsing Engine]:::public
CP --> SU_DB2[(Supabase Auth & Database)]:::data

%% Storage and Interface
SU_DB1 --> CBS[Campentra Backend Storage]:::data
SU_DB2 --> CBS
CBS --> VITE[Vite + React API Fetch]:::main
VITE --> FRONT[Campentra Frontend Interface]:::main
```



# Campentra

Campentra is a student-focused campus discovery platform built for the **Into The Scrape-Verse** hackathon in collaboration with **Bright Data**.

## What Campentra does

Campentra combines two complementary sources of campus information:

1. **Verified campus content** — authorized campus users can publish official events, announcements, and manage student registrations.
2. **Web discovery** — Bright Data Scraper Studio collects publicly available campus/event information, normalizes it, and stores it in Supabase for discovery inside Campentra.

The long-term goal is to give students one place to discover what is happening across campuses instead of searching many disconnected websites.

## Current stack

- React + Vite
- Supabase Auth + PostgreSQL
- Bright Data Scraper Studio
- JavaScript / Node.js

## Bright Data pipeline

```text
Public campus/event websites
        ↓
Bright Data Scraper Studio
        ↓
Structured scraper output
        ↓
Campentra normalization
        ↓
Supabase `campus_listings`
        ↓
Campentra discovery UI
```

The current collector is documented in `.cursor/rules/brightdata.mdc`.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Bright Data collection:

```bash
npm run collect:campus-listings
```

## Environment variables

Create a local `.env.local` file. Never commit it.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
BRIGHT_DATA_COLLECTOR_ID=
```

The collector script also supports server-side `SUPABASE_SERVICE_ROLE_KEY` for database ingestion. Keep that key server-side only.

## Security

- Use public web sources only.
- Never commit API keys or Supabase service-role credentials.
- Keep RLS enabled on user-facing Supabase tables.
- Do not expose service-role credentials in the browser.
