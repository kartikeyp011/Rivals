# Rivals — Mobile Application

This directory contains the **Rivals** mobile app, a cross-platform React Native application built with Expo. Rivals is a daily competitive puzzle game where players complete three rounds (Word Duel, Cipher Break, Number Rush) to secure their Arena Score and compete against friends.

## 🛠 Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Routing**: Expo Router (file-based routing)
- **Backend/Auth**: Supabase (Authentication, Database, Realtime)
- **Game Logic API**: Custom Python/FastAPI backend
- **Monetization**: RevenueCat (for Rivals+ Subscriptions)

## 🏗 Architecture Overview

The app is built to be client-side secure but server-authoritative.

- **Supabase** handles standard authentication, fetching user data, and real-time updates for social features (e.g., friend requests).
- **FastAPI Backend** acts as the trusted game server. It validates all puzzle answers, computes the final Arena Score, manages coin balances for wagers, and conducts anti-cheat checks to ensure competitive integrity.

## 📱 Core Sections & Flows

The mobile app (`/app` directory via Expo Router) is structured into the following core flows:

### 1. Onboarding & Authentication
- **Flow**: New users can sign up using email or OAuth.
- **Features**: Profile creation (display name, avatar) and tutorial onboarding, alongside receiving 100 starting coins.

### 2. Daily Arena (The Core Loop)
- **Flow**: The central dashboard where players launch the daily puzzle.
- **Rounds**:
  - **Word Duel**: Crack a word in minimum guesses.
  - **Cipher Break**: Decode a pattern (Easy/Medium/Hard).
  - **Number Rush**: Solve a logic/math puzzle under pressure.
- **Rules**: A player completes all three back-to-back in under 5 minutes. The final results are posted to the server to generate an **Arena Score**.

### 3. Leaderboards & Social
- **Flow**: Competing with friends and globally.
- **Features**:
  - **Friends List**: Add friends and track head-to-head performance.
  - **Daily & All-Time Rankings**: Compare the daily Arena Score on a friends-only leaderboard, or opt-in to the Global Leaderboard.

### 4. Wagers & Coin Economy
- **Flow**: Users can challenge their friends directly by staking in-game virtual coins.
- **Features**: Setting up wagers on today's Arena Score. Winner takes the pot. Managed entirely by the FastAPI backend to prevent client-side spoofing.

### 5. Rivals+ (Premium Subscription)
- **Flow**: RevenueCat-managed subscription tier.
- **Features**: Players can subscribe to unlock premium perks, advanced statistics, and streak-preservation mechanics.

## 🛒 App Store & Google Play Publishing Details

When preparing the app for release on the Apple App Store and Google Play Store, use the following finalized metadata from the product specification:

- **App Name**: Rivals
- **Subtitle (iOS)**: Daily Puzzles & Wagers *(Fits within 30-character limit)*
- **Short Description (Android)**: Daily 3-round puzzle arena. Duel friends, wager coins, and climb the leaderboard!
- **Core Session Target**: Under 5 minutes total.

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Supabase project and FastAPI backend running locally or configured in `.env`

### Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Duplicate `.env.example` (or similar) to `.env.local` and add your Supabase and FastAPI API keys.

3. **Start the Expo Development Server**
   ```bash
   npm run start
   ```

4. **Run on Device / Emulator**
   - Press `i` to open in an iOS simulator.
   - Press `a` to open in an Android emulator.
   - Scan the QR code using the **Expo Go** app on a physical device.

### Resetting the Project

To start fresh and reset the `app` routing directory to a blank state:
```bash
npm run reset-project
```

## 🧪 Testing & Linting

- **Linting**: Ensure code quality by running `npm run lint` (powered by ESLint).
- **TypeScript**: The project is strictly typed. Review `tsconfig.json` for rules.

## 🚀 Deployment

- **Over-The-Air (OTA) Updates**: Managed via Expo EAS Update.
- **App Store / Play Store**: Built using Expo Application Services (EAS Build). Configurations can be found in `eas.json` and `app.json`.
