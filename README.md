# 🔗 EmbedLink — Discord File Embedder

A self-hosted file embedding service for Discord. Upload images, videos, and files — get a shareable link that Discord will auto-embed with rich previews. Protected by username + password stored securely in Neon (Postgres). **Accounts are created via CLI only — no registration on the website.**

---

## Features

- **Image embeds** — Discord shows the image inline
- **Video embeds** — Discord shows a playable video preview
- **File links** — Clean embed with file name and type
- **Username + password login** — bcrypt-hashed, stored in Neon, no in-app registration
- **Rate limiting** — 5 attempts / 15 min per IP + random delay on every login
- **View counter** — See how many times each link was opened
- **Delete files** — Remove from DB any time
- **50MB max** per file

---

## Stack

| Layer    | Tech                       |
|----------|----------------------------|
| Frontend | Next.js 14 (Pages Router)  |
| Database | Neon (serverless Postgres) |
| Hosting  | Vercel                     |
| Auth     | bcrypt (cost 12) + HttpOnly cookies |

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd discord-embed
npm install
```

### 2. Create a Neon project

1. Go to [neon.tech](https://neon.tech) → create a free project
2. Copy your **Connection String**

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Fill in all 4 values
```

### 4. Deploy to Vercel

```bash
npx vercel
```

Set all env vars in **Vercel Dashboard → Settings → Environment Variables**.

### 5. Initialize the database (one time)

```bash
curl -X POST https://your-app.vercel.app/api/setup \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

### 6. Create your first user (CLI only)

```bash
DATABASE_URL="your-neon-url" node scripts/add-user.js myusername "Str0ng!Pass#2025"
```

Password requirements: **12+ characters**. Use a mix of letters, numbers, symbols.

Now go to `https://your-app.vercel.app` and log in.

---

## User Management (CLI)

```bash
# Create a new user
DATABASE_URL="..." node scripts/add-user.js <username> <password>

# List all users
DATABASE_URL="..." node scripts/list-users.js

# Delete a user
DATABASE_URL="..." node scripts/delete-user.js <username>
```

Users can only be created/deleted via these local scripts. There is **no registration page** on the website.

---

## How Discord Embedding Works

When you paste an EmbedLink URL into Discord, Discord's scraper visits `/e/[slug]` and reads the Open Graph meta tags:

| File Type | Discord shows            |
|-----------|--------------------------|
| Image     | Inline image preview     |
| Video     | Inline playable video    |
| Other     | Title + description card |

The raw file is served from `/api/raw/[slug]` with the correct `Content-Type`.

---

## Security

| Threat | Defence |
|--------|---------|
| Brute-force login | 5 attempts / 15 min per IP + 200–500ms random delay |
| DB leak exposing passwords | bcrypt cost-12 hash — computationally infeasible to crack |
| Session hijacking | HttpOnly + Secure + SameSite=Strict cookie, 24h expiry |
| Unauthorised uploads | Every API route checks session on each request |
| MIME spoofing | Strict allowlist of accepted MIME types |
| Clickjacking | `X-Frame-Options: DENY` header |
| Timing attacks on bad usernames | Dummy bcrypt compare runs even when user not found |

---

## File Structure

```
discord-embed/
├── lib/
│   ├── db.ts              — Neon DB connection + schema
│   ├── auth.ts            — validateCredentials, session tokens, rate limiting
│   ├── cookies.ts         — Cookie helpers (no external dep)
│   └── fileTypes.ts       — MIME allowlist + helpers
├── pages/
│   ├── index.tsx          — Login page (username + password)
│   ├── dashboard.tsx      — File manager
│   ├── e/[slug].tsx       — Embed page (Discord scrapes this)
│   └── api/
│       ├── setup.ts       — DB init (one-time)
│       ├── upload.ts      — File upload
│       ├── files.ts       — List files
│       ├── files/[id].ts  — Delete file
│       ├── raw/[slug].ts  — Serve raw file bytes
│       └── auth/
│           ├── login.ts   — POST username+password → session cookie
│           ├── logout.ts  — Clear cookie
│           └── check.ts   — Validate active session
├── scripts/
│   ├── add-user.js        — Create a user
│   ├── list-users.js      — List all users
│   └── delete-user.js     — Remove a user
├── .env.example
├── vercel.json
└── README.md
```

---

## Troubleshooting

**"Invalid username or password"** — Make sure you created the user with `add-user.js` and are using the exact same credentials.

**Tables don't exist** — Run the `/api/setup` curl command.

**Video not embedding** — Discord needs `video/mp4`. Re-encode `.mov` files to MP4.

**File >4.5MB fails on Vercel free** — Vercel free caps request bodies at 4.5MB. Upgrade to Pro or compress files.
