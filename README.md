# Family Health

A shared family medical records app. Upload lab reports and prescriptions, auto-extract medical values, and keep everyone in the family up to date.

## What it does

- **Upload reports** — photos (JPG/PNG) or PDFs of lab reports and prescriptions
- **Auto-extraction** — OCR + regex pulls structured values (blood sugar, cholesterol, CBC, etc.) from uploaded reports
- **Family dashboard** — all records in one place, filterable by member, month, and category
- **Add family members** — generate login credentials and share via WhatsApp
- **Status indicators** — values are flagged as Normal / High / Low against reference ranges

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database / Auth / Storage | Supabase |
| Image OCR | tesseract.js v5 (server-side) |
| PDF text extraction | pdf-parse |
| Styling | Tailwind CSS |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/SajadYoosuf/familyhealthmanage.git
cd familyhealthmanage
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com) and run the following SQL:

```sql
create table family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  relation text not null,
  family_id uuid,
  blood_group text,
  height_cm numeric,
  weight_kg numeric,
  created_at timestamptz default now()
);

create table health_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references family_members,
  uploaded_by uuid references auth.users,
  category text,
  report_date date,
  raw_text text,
  structured_data jsonb,
  file_url text,
  file_type text,
  created_at timestamptz default now()
);
```

### 3. Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Tesseract language data

The OCR engine requires `eng.traineddata` in the project root (already committed). If missing:

```bash
curl -O https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Sign up / login
│   ├── dashboard/page.tsx        # Records dashboard
│   ├── upload/page.tsx           # Upload a report
│   ├── add-member/page.tsx       # Add a family member
│   └── api/
│       ├── upload/route.ts       # File → OCR → extract → DB
│       ├── records/route.ts      # Fetch records with filters
│       ├── auth/signup/route.ts  # Sign up flow
│       └── family/               # Family member management
├── components/
│   ├── RecordCard.tsx            # Individual record display
│   ├── MemberHealthCard.tsx      # Per-member summary card
│   └── FilterBar.tsx             # Month / member / category filters
└── lib/
    ├── extract.ts                # OCR + value extraction logic
    └── supabase/                 # Supabase client helpers
```

## Deployment

Deployed on Vercel. Push to `main` triggers a new deployment automatically.

```bash
git push origin main
```
