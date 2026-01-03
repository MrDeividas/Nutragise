# Nutrapp – The Social Accountability App

## 📱 App Overview

**App Name:** Nutrapp  
**Brand:** Nutragise — *The Social Accountability App*

A full-featured **React Native** app using **Supabase** for authentication, database, and storage. Users can set health goals, track daily habits, participate in challenges, invest in accountability, and engage with a supportive community.

---

## 💻 Tech Stack

- **React Native** (Expo)
- **TypeScript**
- **Supabase** (Auth + Database + Storage + Realtime)
- **React Navigation** (Stack + Tab navigation)
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** (State management)
- **Stripe** (Payment processing for challenge investments)

---

## 🔐 Core Features

### 1. Authentication & Profiles
- Email/password sign up & login (Supabase Auth)
- Profile creation: avatar, username, bio, display name
- Anonymous onboarding supported
- Profile settings and customization

### 2. Daily Habits Tracking
- Track core habits: gym, run, meditation, cold shower, water intake
- Custom habits creation
- Daily completion tracking with visual indicators
- Streak tracking and progress visualization
- Habit accountability partners system
- Real-time partner progress sync

### 3. Goals Management
- Set personal goals (title, description, category, target date)
- Track completion with daily/weekly check-ins
- Visual progress tracking
- Goal interactions (likes, comments)
- Store goals in Supabase DB

### 4. Challenges System
- **Free Challenges**: Join without investment
- **Investment Challenges**: Pay entry fee (£10) to participate
- Daily recurring challenges (e.g., Daily Smile Challenge)
- Weekly recurring challenges
- Challenge requirements and submissions
- Participant tracking and leaderboards
- Challenge pots and investment distribution

### 5. Wallet & Investment System
- User wallet with balance tracking
- Add funds via Stripe integration
- Invest in challenges (£10 entry fee)
- Automatic pot distribution to winners
- Transaction history
- Platform fee handling
- Daily proof tracking for forfeiture calculation

### 6. Community & Social
- Public feed of shared milestones/goals
- Like, comment, follow system
- Direct messaging (DMs)
- User profiles with stats
- Followers/following system
- Real-time updates (Supabase Realtime)

### 7. Insights & Reflection
- Daily reflection questionnaire
- Motivation and stress tracking
- Progress charts and analytics
- Emoji trend tracking
- Pillar progress system (Strength & Fitness, Mental Wellness, etc.)
- AI-powered insights

### 8. Notifications
- Push notifications for:
  - Habit partner invitations
  - Challenge updates
  - Goal reminders
  - Social interactions
  - Achievement unlocks

---

## 📂 Database Schema

### Core Tables
- `profiles` - User profiles and settings
- `goals` - User goals and targets
- `daily_habits` - Daily habit completion tracking
- `custom_habits` - User-created custom habits
- `challenges` - Challenge definitions
- `challenge_participants` - User participation in challenges
- `challenge_submissions` - Challenge proof submissions
- `challenge_requirements` - Challenge requirements
- `posts` - Social feed posts
- `comments` - Post comments
- `likes` - Post/goal likes
- `follows` - User follow relationships

### Wallet & Investment Tables
- `user_wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `challenge_pots` - Challenge investment pots
- `daily_proof_tracking` - Daily proof verification

### Accountability Tables
- `habit_accountability_partners` - Partner relationships
- `habit_partner_progress` - Partner completion tracking

### Insights Tables
- `daily_insights` - Daily reflection data
- `pillar_progress` - Pillar-based progress tracking

---

## 🧭 Screens / Navigation

### Main Tabs
- **Community** - Feed of posts and updates
- **Action** - Daily habits, goals, and active challenges
- **Compete** - Available challenges (Free & Invest sections)
- **Insights** - Progress charts and reflections
- **Profile** - User profile and settings

### Stack Screens
- **Onboarding** - First-time user setup
- **Sign In / Sign Up** - Authentication
- **Goal Detail** - Individual goal view
- **Challenge Detail** - Challenge information and participation
- **Wallet** - Wallet balance and transactions
- **Notifications** - Notification center
- **DM Screen** - Direct messaging
- **User Profile** - View other users' profiles
- **Profile Settings** - Edit profile and preferences
- **Leaderboard** - Challenge leaderboards

---

## 🎯 Key Features in Detail

### Daily Habits System
- **Core Habits**: Gym, Run, Meditation, Cold Shower, Water
- **Custom Habits**: Users can create their own habits
- **Accountability Partners**: Invite friends to track habits together
- **Real-time Sync**: Partner completions sync in real-time
- **Streak Tracking**: Visual streak indicators and rewards

### Challenge Investment System
- **Entry Fees**: Challenges can require £10 investment
- **Pot System**: All investments go into a shared pot
- **Daily Proof**: Users must submit daily proof to keep investment
- **Forfeiture**: Missing a day results in losing investment share
- **Distribution**: Winners split the pot (minus platform fee)
- **Stripe Integration**: Secure payment processing

### Wallet System
- **Balance Tracking**: Real-time wallet balance
- **Add Funds**: Stripe payment integration
- **Transaction History**: Complete transaction log
- **Automatic Deductions**: Entry fees deducted automatically
- **Payouts**: Automatic payouts to winners

---

## 🧪 Development Notes

### State Management
- **Zustand** stores for:
  - `authStore` - Authentication state
  - `goalsStore` - Goals management
  - `socialStore` - Social interactions
  - `themeStore` - Theme preferences
  - `onboardingStore` - Onboarding state

### Services
- `challengesService` - Challenge CRUD and participation
- `walletService` - Wallet operations
- `challengePotService` - Pot management
- `habitInviteService` - Accountability partners
- `dailyHabitsService` - Habit tracking
- `socialService` - Social features
- `insightService` - Insights and reflections

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key (backend)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `DEEPSEEK_API_KEY` - AI insights API key

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Stripe account (for payment features)

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with your Supabase and Stripe keys:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Run Development Server
```bash
npm start
```

---

## 📝 Recent Updates

### Challenge Investment System
- Implemented wallet system with Stripe integration
- Daily recurring challenges with investment pots
- Automatic forfeiture calculation for missed days
- Pot distribution to winners

### Habit Accountability Partners
- Partner invitation system
- Real-time progress synchronization
- Competitive tracking mode

### Insights & Reflection
- Daily reflection questionnaire
- Motivation and stress tracking
- Progress visualization with charts

---

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User authentication via Supabase Auth
- Secure payment processing via Stripe
- Environment variables for sensitive keys

---

## 📄 License

Private project - All rights reserved

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.
