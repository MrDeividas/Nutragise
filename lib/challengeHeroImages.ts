import {
  normalizeHeroRegistryKey,
  normalizedChallengeHeroLookupKey,
} from './challengeTitleUtils';

/** Core-habit / curated cards with full-bleed hero art (same keys as ChallengeCard). */
const CHALLENGE_HERO_IMAGES: Record<string, number> = {
  Gym: require('../assets/challenge-cards/gym.png'),
  Exercise: require('../assets/challenge-cards/exercise.png'),
  Sleep: require('../assets/challenge-cards/sleep.png'),
  'Goal Update': require('../assets/challenge-cards/goal_update.png'),
  Microlearn: require('../assets/challenge-cards/microlearn.png'),
  Focus: require('../assets/challenge-cards/focus.png'),
  Reflection: require('../assets/challenge-cards/reflection.png'),
  Water: require('../assets/challenge-cards/water.png'),
  'Drinking Water': require('../assets/challenge-cards/water.png'),
  'Cold Shower': require('../assets/challenge-cards/cold_shower.png'),
  Meditation: require('../assets/challenge-cards/meditation.png'),
  'Screen Time': require('../assets/challenge-cards/screen_time.png'),
  '6AM Club': require('../assets/challenge-cards/six_am_club.png'),
  '6am Club': require('../assets/challenge-cards/six_am_club.png'),
  '6am club': require('../assets/challenge-cards/six_am_club.png'),
  'No Junk Food': require('../assets/challenge-cards/no_junk_food.png'),
  'Reduce Social Media': require('../assets/challenge-cards/reduce_social_media.png'),
  'Daily Sweat': require('../assets/challenge-cards/daily_sweat.png'),
  '100 Press Ups': require('../assets/challenge-cards/100_press_ups.png'),
  '100 Squats': require('../assets/challenge-cards/100_squats.png'),
  'Mobility Every Day': require('../assets/challenge-cards/mobility_every_day.png'),
  'Deep Work': require('../assets/challenge-cards/deep_work.png'),
  '15k Steps': require('../assets/challenge-cards/15k_steps.png'),
  '15K Steps': require('../assets/challenge-cards/15k_steps.png'),
  '15k Steps Daily': require('../assets/challenge-cards/15k_steps.png'),
  '15K Steps Daily': require('../assets/challenge-cards/15k_steps.png'),
  '10k Steps': require('../assets/challenge-cards/10k_steps.png'),
  '10K Steps': require('../assets/challenge-cards/10k_steps.png'),
  '10k Steps Daily': require('../assets/challenge-cards/10k_steps.png'),
  '10K Steps Daily': require('../assets/challenge-cards/10k_steps.png'),
  '10k Steps Free': require('../assets/challenge-cards/10k_steps.png'),
  '10K Steps Free': require('../assets/challenge-cards/10k_steps.png'),
  'Make Your Bed': require('../assets/challenge-cards/make_your_bed.png'),
  Gratitude: require('../assets/challenge-cards/gratitude.png'),
  'Go Outside': require('../assets/challenge-cards/go_outside.png'),
  'Spread Positivity': require('../assets/challenge-cards/spread_positivity.png'),
  'Accountability Starter': require('../assets/challenge-cards/accountability_starter.png'),
  '7AM Wake Up': require('../assets/challenge-cards/7am_wake_up.png'),
  '7am Wake Up': require('../assets/challenge-cards/7am_wake_up.png'),
  'Journal 1 Thought': require('../assets/challenge-cards/journal_1_thought.png'),
  'Gym Warrior Free': require('../assets/challenge-cards/gym_warrior_free.png'),
  'Gym Warrior': require('../assets/challenge-cards/gym_warrior_free.png'),
  'Free Gym Warrior': require('../assets/challenge-cards/gym_warrior_free.png'),
  'Be Happy': require('../assets/challenge-cards/be_happy.png'),
};

/** Case-insensitive hero lookup; fixes "Gym Warriror" typo in DB titles. */
const HERO_IMAGE_BY_NORMALIZED_KEY: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const [label, src] of Object.entries(CHALLENGE_HERO_IMAGES)) {
    m[normalizeHeroRegistryKey(label)] = src;
  }
  return m;
})();

/** User-created challenges (create flow) always use this art instead of title-matched heroes. */
const CUSTOM_USER_CHALLENGE_HERO = require('../assets/challenge-cards/custom_challenge.png');

/**
 * Same local hero asset used on ChallengeCard (require module id), or null if none.
 * Prefer this over `image_url` for curated / titled challenges.
 */
export function getChallengeCardHeroSource(
  title: string,
  isUserCreated?: boolean
): number | null {
  if (isUserCreated) return CUSTOM_USER_CHALLENGE_HERO;
  return HERO_IMAGE_BY_NORMALIZED_KEY[normalizedChallengeHeroLookupKey(title)] ?? null;
}
