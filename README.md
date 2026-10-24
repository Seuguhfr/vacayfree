# 🏖️ VacayFree — Group Vacation Free-Time Finder

> A clean, tactile, mobile-first web app to coordinate vacation dates with friends and find the best continuous trip window.

---

## ✨ Features

- **Zero-Friction Access**: No email registration or passwords. Friends open the link, enter their name, and set a simple 4-digit PIN so only they can edit their response.
- **Mobile-First Touch Calendar Painter**: Tap or drag across calendar days to quickly paint:
  - 🟢 **Available** (Full free day)
  - 🟡 **Maybe / If needed** (Flexible, remote work, or travel day)
  - 🔴 **Busy** (Unavailable)
  - 💬 **Day Notes**: Attach quick notes to specific dates (e.g., *"Arriving in evening"*, *"Can work remotely"*).
- **Smart Trip Window Finder (The Killer Feature)**: Automatically evaluates continuous date stretches across weeks or months (3-day weekend, 5 days, 1 week, 2 weeks, or custom) and ranks them by highest group attendance.
- **Visual Group Heatmap**: Darker green cells indicate higher friend availability at a glance. Tap any day to see the exact breakdown of who is free, maybe, or busy with their notes.
- **Organizer Admin Controls**: The creator gets a secret admin key/link to adjust dates, delete duplicate or typo entries, and lock the poll once dates are chosen.
- **Zero AI-Slop Design**: Built with clean typography, high contrast, subtle borders, and smooth micro-interactions inspired by Linear and Airbnb Calendar.
- **Deploy Anywhere**: Runs locally, on GitHub Pages, or on **Cloudflare Pages (`.pages.dev`)** with zero backend servers required.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Click **"Explore Live Demo"** to see how it works with sample friend data!

---

## 📦 Build for Production

```bash
npm run build
```

The production output is generated in the `dist/` directory.

---

## ☁️ Deploying to Cloudflare Pages (`.pages.dev`)

### Option A: Via GitHub (Recommended)
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of VacayFree"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your GitHub repository.
   - Configure build settings:
     - **Framework preset**: `Vite` (or `None`)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - Click **Save and Deploy**.
   - Your app will be live at `https://<project-name>.pages.dev`!

### Option B: Direct Deploy via Wrangler CLI
```bash
# Deploy dist folder directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=vacayfree
```

### (Optional) Enable Multi-Device Edge Sync
By default, VacayFree stores and manages responses locally with seamless export/import. To enable instant real-time synchronization between friends across different devices on Cloudflare:
1. Create a KV namespace:
   ```bash
   npx wrangler kv namespace create VACAY_KV
   ```
2. In Cloudflare Pages Dashboard under your project, go to **Settings** > **Functions** > **KV namespace bindings**, and bind `VACAY_KV` to the namespace you created.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Math**: [date-fns](https://date-fns.org/)
- **Celebration Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) (`.pages.dev`)
