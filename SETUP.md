# 🚀 ClassLink — Setup ya Haraka

Faili hii inakuongoza kupata mfumo unaofanya kazi kwenye computer yako kwa hatua chache.

---

## ⚡ Hatua 5 za kufanya app ifanye kazi

### 1️⃣ Fungua folder kwa VS Code

```powershell
cd C:\Users\THEO\Desktop\scholarsuite
code .
```

### 2️⃣ Sakinisha dependencies

Fungua terminal kwenye VS Code (**Ctrl+`**) na endesha:

```powershell
npm install
```

Subiri dakika 1-2.

### 3️⃣ Hakiki `.env` ipo

```powershell
type .env
```

Lazima uone:
```
VITE_SUPABASE_URL=https://fekhajhptdqzlypjwnjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Kama haupo au ni tupu**, tengeneza upya:

```powershell
@'
VITE_SUPABASE_URL=https://fekhajhptdqzlypjwnjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla2hhamhwdGRxemx5cGp3bmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mjg0OTQsImV4cCI6MjA5NTMwNDQ5NH0.Xcr8tvHik0RiEZGQobzidquKM1dBWONy1o2G8FmxvO4
'@ | Set-Content -Encoding utf8 .env
```

### 4️⃣ Anzisha dev server

```powershell
npm run dev
```

Utaona:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 5️⃣ Fungua browser

Nenda **http://localhost:5173** — utaona login page yenye logo mpya ya ClassLink.

---

## 🌐 Ku-deploy GitHub + Vercel

### Mara ya kwanza (one-time setup)

```powershell
git init
git remote add origin https://github.com/YOUR-USERNAME/ClassLink.git
git branch -M main
git add .
git commit -m "Initial: ClassLink ERP with logo"
git push -u origin main --force
```

Kisha kwenye Vercel dashboard, hakikisha **Environment Variables** zipo:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Future updates

```powershell
git add .
git commit -m "Maelezo ya mabadiliko"
git push
```

Vercel ita-deploy automatically.

---

## 🆘 Troubleshooting

### "Inapakia..." haitoki (spinner inakwama)

1. Hakiki Console (F12 → Console)
2. Kama unaona "Missing Supabase env variables" → fix `.env` (hatua 3 hapo juu)
3. Hard refresh: **Ctrl+Shift+R**

### `npm install` inashindwa

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Port 5173 imejaa

Vite itatumia 5174 automatically. Au funga app nyingine inayotumia port hiyo.

### Build error "Cannot find module"

```powershell
npm install
```

Kama bado, futa node_modules kama hapo juu.

---

## 📋 Login credentials za kwanza

- **Email:** `baruthdickson005@gmail.com`
- **Password:** `baruth@500`

(Hakikisha user huyu ameumbwa kwenye Supabase Auth na role yake ni `super_admin`).

---

✅ Hivi ndio mfumo wako wa ClassLink — School Management System!
