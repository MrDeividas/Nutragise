# Build Nutrapp – A React Native App with Supabase

## 📱 App Overview

**App Name:** Nutrapp  
**Brand:** Nutragise — *The Social Accountability App*

Build a full-featured **React Native** app using **Supabase** for auth, database, and storage. Users should be able to set health goals, track their progress visually, share milestones, and engage with a supportive community.

---

## 💻 Tech Stack

- React Native (Expo)
- TypeScript
- Supabase (Auth + DB + Storage)
- React Navigation
- NativeWind (Tailwind for RN)

---

## 🔐 Core Features

### 1. Authentication
- Email/password sign up & login (Supabase Auth)
- Profile creation: avatar, username, bio
- Anonymous onboarding supported

### 2. Goal Management
- Set personal goals (title, description, category, target date)
- Track completion with daily/weekly check-ins
- Store goals in Supabase DB

### 3. Progress Sharing
- Upload progress photos (Supabase Storage)
- Create visual timeline / transformation gallery
- Share milestones to public feed

### 4. Community Feed
- Public feed of shared milestones/goals
- Like, comment, follow system
- Fetch posts in real-time (Supabase Realtime DB)

### 5. User Profile
- Public profiles with:
  - Total goals
  - Goals completed
  - Followers/following
- Profile edit screen

### 6. Motivation System
- Optional: reminders, streak tracking
- Optional: edge functions or local push notifications

---

## 📂 Suggested Database Schema

### users
- id (uuid)
- username
- email
- bio
- avatar_url
- created_at

### goals
- id
- user_id (FK)
- title
- description
- category (habit, fitness, etc.)
- start_date
- end_date
- completed (bool)
- created_at

### progress_photos
- id
- user_id (FK)
- goal_id (FK)
- photo_url
- date_uploaded

### posts
- id
- user_id (FK)
- content
- goal_id (nullable)
- created_at

### followers
- follower_id
- following_id

---

## 🧭 Screens / Navigation

- Onboarding
- Sign In / Sign Up
- Home Feed
- Goal Tracker (List + Detail)
- Add Goal
- Upload Progress Photo
- Profile (own & others)
- Community Explore
- Settings

---

## 🧪 Dev Notes

- Use Zustand or React Context for global state/session
- Add error handling + UI loaders
- Use motivational UI with smooth transitions
- Modular file structure encouraged

---

## ✅ Deliverables

- Fully working app with the above features
- Supabase project configured
- All core CRUD flows working
- Clean UI with community feel

