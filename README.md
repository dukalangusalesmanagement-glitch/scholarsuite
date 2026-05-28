# ScholarSuite

**Multi-School ERP Platform** — Mfumo kamili wa shule nyingi kwa Tanzania na Afrika Mashariki.

Imejengwa kwa **React + Vite + Supabase + Tailwind**. Inakwenda na real-time database, multi-tenant Row Level Security (RLS), na lugha mbili (Kiswahili + English).

---

## 📁 Folder structure

```
scholarsuite/
├── package.json             ← dependencies (React, Supabase, Tailwind, Vite)
├── vite.config.js           ← Vite + @ alias setup
├── tailwind.config.js       ← Tailwind theme (green palette + Instrument Serif)
├── postcss.config.js
├── .env                     ← Supabase credentials (KEEP SECRET)
├── .env.example
├── index.html
│
├── supabase/
│   └── schema.sql           ← ENDESHA HII KWENYE SUPABASE KWANZA
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.jsx             ← entry point + providers
    ├── App.jsx              ← auth gate → Login or Shell
    ├── index.css            ← Tailwind + CSS variables
    │
    ├── lib/
    │   ├── supabase.js      ← Supabase client (initialized)
    │   ├── api.js           ← Generic CRUD helpers + formatters
    │   ├── i18n.js          ← Translations (en + sw)
    │   └── menu.js          ← Sidebar menu config — edit hapa kuongeza menu
    │
    ├── contexts/
    │   ├── AuthContext.jsx  ← user, profile, signIn/signUp/signOut
    │   ├── LangContext.jsx  ← language toggle + persistence
    │   └── ThemeContext.jsx ← dark mode
    │
    ├── hooks/
    │   └── useResource.js   ← Generic CRUD hook for any table
    │
    ├── components/
    │   ├── Shell.jsx        ← Layout: sidebar + header + routed page
    │   ├── Sidebar.jsx
    │   ├── Header.jsx
    │   ├── Modal.jsx
    │   ├── Field.jsx        ← Form field + inputClass
    │   ├── PageHeader.jsx
    │   ├── Toolbar.jsx
    │   └── StatusPill.jsx
    │
    └── pages/               ← 21 pages, faili moja kwa kila view
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── Schools.jsx
        ├── Students.jsx
        ├── Teachers.jsx
        ├── Classes.jsx
        ├── Subjects.jsx
        ├── Attendance.jsx
        ├── Exams.jsx
        ├── Timetable.jsx
        ├── Fees.jsx
        ├── Library.jsx
        ├── Hostel.jsx
        ├── Transport.jsx
        ├── Payroll.jsx
        ├── Inventory.jsx
        ├── Discipline.jsx
        ├── Events.jsx
        ├── Communications.jsx
        ├── Reports.jsx
        ├── Subscriptions.jsx
        └── Settings.jsx
```

---

## 🚀 Setup (Swahili)

### Mahitaji
- **Node.js 18+** ([download](https://nodejs.org))
- **VS Code** au editor nyingine
- **Supabase account** ([signup bure](https://supabase.com))

### Hatua

**1. Sakinisha packages:**
```bash
cd scholarsuite
npm install
```

**2. Tengeneza Supabase schema:**
- Fungua Supabase project yako: https://supabase.com/dashboard
- Bonyeza **SQL Editor** (kushoto)
- Bonyeza **New query**
- Funguza faili `supabase/schema.sql`, kopi yote, bandika kwenye editor
- Bonyeza **Run** (Ctrl+Enter)
- Utaona maandiko "Success" — jedwali zote 22 zimetengenezwa pamoja na seed data ya shule 8 za Tanzania.

**3. Tengeneza super admin (msimamizi mkuu):**
- Kwenye Supabase, nenda **Authentication → Users**
- Bonyeza **Add user → Create new user**
- Weka email: `baruthdickson005@gmail.com`
- Weka password: `baruth@500`
- ✅ Tick "Auto Confirm User"
- Bonyeza **Create user**

**4. Mwambie database huyu ni super_admin:**
- Nenda **Table Editor → profiles**
- Tafuta row ya email yako
- Hariri column `role` kuwa: `super_admin`
- Save

**5. Anzisha app:**
```bash
npm run dev
```
- Fungua http://localhost:5173
- Ingia kwa email/password ya hatua 3
- Utaona dashboard kamili!

### Hariri kwa VS Code
Kila page iko kwenye faili lake — fungua `src/pages/Schools.jsx` ku-edit shule, `src/pages/Fees.jsx` ku-edit malipo, n.k. Hakuna faili kubwa moja.

---

## 🌍 Setup (English)

### Requirements
- **Node.js 18+**
- **VS Code** or any editor
- **Supabase account** (free tier works)

### Steps

```bash
# 1. Install dependencies
cd scholarsuite
npm install

# 2. Set up database
#    Copy supabase/schema.sql into Supabase SQL Editor and Run

# 3. Create super admin via Supabase Auth dashboard,
#    then set profiles.role = 'super_admin' in Table Editor

# 4. Start dev server
npm run dev
```

Visit http://localhost:5173

---

## 📝 Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |

---

## 🏗️ Architecture

- **Tenant isolation:** Every table has `school_id`. RLS policies in `schema.sql` ensure tenants only see their own data. Super admin sees everything.
- **Auth:** Supabase Auth (`signInWithPassword` / `signUp`). `profiles` table extends `auth.users` automatically via trigger.
- **Data fetching:** Most pages use the `useResource("table_name")` hook — see `src/hooks/useResource.js`.
- **Routing:** No external router; `App.jsx` keeps `view` in state and `Shell.jsx` lazy-loads pages via `React.lazy`.
- **Styling:** Tailwind utility classes + CSS variables defined in `index.css` (`--green-50` to `--green-950`, `--cream`, `--ink`).

---

## ➕ Kuongeza module mpya (How to add a new module)

1. Tengeneza jedwali kwenye `supabase/schema.sql`, ongeza RLS policy.
2. Tengeneza `src/pages/MyModule.jsx` ukitumia template ya `Classes.jsx`.
3. Iongeze `src/components/Shell.jsx` (lazy import + ROUTES map).
4. Iongeze `src/lib/menu.js` (item mpya).
5. Iongeze translations kwa `src/lib/i18n.js` (en + sw).

---

## 🔒 Security note

`.env` ina credentials za Supabase. **USIWEKE GitHub** — `.gitignore` inaikinga. Anon key ni salama kuonyeshwa client-side kwa sababu RLS policies zinawalinda watumiaji wengine kuona data za wengine.

---

## 📦 Deployment

Build hua na Vite static — inakwenda kwa:
- **Vercel** (pendekezwa): `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **Cloudflare Pages**: connect git repo
- **Self-host**: `npm run build` → tumia folder `dist/` na nginx/caddy

Hakikisha umeongeza environment variables `VITE_SUPABASE_URL` na `VITE_SUPABASE_ANON_KEY` kwenye hosting yako.

---

© ScholarSuite. Imejengwa kwa shule za Tanzania na Afrika Mashariki.
