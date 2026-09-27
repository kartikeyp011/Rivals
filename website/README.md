# Rivals — Official Website

Public marketing site for the **Rivals** mobile app, a competitive daily puzzle game where players face off in three distinct rounds to secure their Arena Score.

This repository contains the marketing website built with Next.js, detailing the game mechanics, features, and links to download the app.

---

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Plain CSS (Custom Design System with Animations & Reveal effects)
- **Typography**: Geist font (self-hosted)

---

## 📖 Website Sections Overview

The landing page (`src/app/page.tsx`) is structured into several key sections designed to introduce the game, highlight features, and drive app downloads.

### 1. Hero (`/components/sections/Hero.tsx`)
- **Purpose**: The main hook of the landing page.
- **Content**: Features the core tagline and game value proposition. It serves as the primary visual entry point, complete with eye-catching typography and an immediate call-to-action (CTA) to download or learn more.

### 2. The Daily Loop (`/components/sections/DailyLoop.tsx`)
- **Purpose**: Explains the core gameplay loop.
- **Content**: Outlines the three-step daily process for players:
  - **Step 1: Play three rounds** - Short, sharp, back-to-back mini-games (Word Duel, Cipher Break, Number Rush).
  - **Step 2: Get your Arena Score** - Performance across all three rounds combines into one definitive score for the day.
  - **Step 3: Beat your friends** - Compete on the Daily and All-Time leaderboards and maintain streaks.

### 3. The Arena / Rounds (`/components/sections/Rounds.tsx`)
- **Purpose**: Details the specific game modes available in the daily arena.
- **Content**:
  - **Word Duel (Round 01)**: A word puzzle where players crack the word in as few guesses as possible.
  - **Cipher Break (Round 02)**: Pattern decoding that rotates between Easy, Medium, and Hard tiers.
  - **Number Rush (Round 03)**: A math/logic puzzle focused on finding patterns to hit the target answer.
  - *Note*: Each round has a maximum score of 1000 points.

### 4. Friends & Leaderboards (`/components/sections/Friends.tsx`)
- **Purpose**: Showcases the social and competitive aspects of Rivals.
- **Content**: Explains how players can add friends, track rivalries, and see where they stand on the leaderboards. Emphasizes the motivation of beating peers and maintaining dominance.

### 5. Streaks & Rivals+ (`/components/sections/Streaks.tsx`)
- **Purpose**: Highlights player retention mechanics and premium features.
- **Content**:
  - **Streaks**: Encourages players to "Show up daily. Or don't," emphasizing the reward of keeping a daily play streak alive.
  - **Rivals+**: Introduces the premium subscription tier (Rivals+) that offers additional perks and features for dedicated players.

### 6. Download (`/components/sections/Download.tsx`)
- **Purpose**: The primary Call-to-Action section.
- **Content**: Prompts users to "CHOOSE YOUR PLATFORM. PREPARE FOR BATTLE." Provides download links/buttons for both **Apple iOS** (App Store) and **Android** (Google Play / Galaxy Store).

### 7. FAQ (`/components/sections/FAQ.tsx`)
- **Purpose**: Addresses common user questions and provides support info.
- **Content**:
  - A responsive accordion/list of frequently asked questions.
  - A "Still need help?" section directing users to contact support via email with a promise of a 24-hour response time.

---

## 💻 Local Development

To run the marketing site locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
The site will be available at [http://localhost:3000](http://localhost:3000).

## 🏗 Build & Production

To build the site for production:

```bash
npm run build
npm run start
```

## 🚀 Deployment (Vercel)

This Next.js app is optimized for Vercel deployment:
1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Set the **Root Directory** to `website`.
4. Click **Deploy**.

## 📝 Pre-Launch Checklist

Before launching the site publicly, ensure the following tasks are completed:
- [ ] Set real canonical domain in `src/app/layout.tsx` + `src/app/sitemap.ts`
- [ ] Insert real app screenshots inside the UI mock components
- [ ] Update the Open Graph image (`public/og-image.svg`)
- [ ] Finalize the Privacy Policy + Terms of Service copy
- [ ] Add the real support email address
- [ ] Insert the real App Store and Google Play / Galaxy Store URLs
