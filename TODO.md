# ✅ Nutrapp – Development TODO List

---

## 🔧 Project Setup
- [x] Initialize Expo React Native project with TypeScript  
- [x] Install dependencies:
  - [x] @supabase/supabase-js
  - [x] react-navigation
  - [x] nativewind or tailwind-rn
  - [x] expo-image-picker or react-native-image-picker
  - [x] zustand or context API
- [x] Configure `.env` for Supabase URL & anon key
- [x] Create Supabase client
- [x] Test Supabase client

---

## 🔐 Authentication
- [x] Implement email/password sign-up & login
- [ ] Support anonymous onboarding
- [x] On first login, prompt user to:
  - [x] Upload avatar
  - [x] Choose username
  - [x] Write short bio

---

## 🏁 Goal Management
- [x] Create "New Goal" screen
  - [x] Inputs: title, description, category, target date
- [x] Save goals to Supabase `goals` table
- [x] List active goals
- [ ] Allow daily/weekly check-ins
- [x] Mark goals as completed

---

## 📸 Progress Tracking
- [ ] Progress photo upload screen
- [ ] Upload photo to Supabase Storage
- [ ] Link photo to goal
- [ ] Display goal timeline with uploaded photos

---

## 📰 Community Feed
- [ ] Design public feed screen
- [ ] Show posts: goal text + optional photo
- [ ] Allow users to:
  - [ ] Like posts
  - [ ] Comment on posts
  - [ ] Follow/unfollow other users

---

## 👤 User Profiles
- [x] Profile screen (own)
  - [x] Display: avatar, username, bio, stats
  - [ ] Edit profile screen
- [ ] View public profiles of other users
  - [ ] Show goals, timeline, follower stats
  - [ ] Follow/unfollow button

---

## 📁 Supabase Database Setup
- [ ] Create `users` table
  - id, email, username, avatar_url, bio
- [ ] Create `goals` table
  - id, user_id, title, description, category, start_date, end_date, completed
- [ ] Create `progress_photos` table
  - id, user_id, goal_id, photo_url, date_uploaded
- [ ] Create `posts` table
  - id, user_id, content, goal_id, created_at
- [ ] Create `followers` table
  - follower_id, following_id

---

## 🧭 Navigation & UX
- [x] Set up stack + bottom tab navigation
- [ ] Handle loading, error, and empty states
- [ ] Add smooth animations for progress and transitions
- [ ] Use motivational, clean UI design

---

## 🌟 Optional Stretch Goals
- [ ] Streak tracking system
- [ ] Push notifications for reminders
- [ ] Supabase Edge Functions for triggers
