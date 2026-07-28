import { ImageSourcePropType } from 'react-native';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'habits' | 'streaks' | 'journey' | 'social' | 'challenges' | 'progress' | 'milestones';

export type AchievementCriteria =
  | { type: 'habit_completions'; habit: string; count: number }
  | { type: 'custom_habit_completions'; count: number }
  | { type: 'streak_days'; count: number }
  | { type: 'weekend_warrior' }
  | { type: 'perfect_day'; minHabits: number }
  | { type: 'perfect_week' }
  | { type: 'comeback_kid'; gapDays: number }
  | { type: 'posts_count'; count: number }
  | { type: 'photos_count'; count: number }
  | { type: 'captioned_posts'; count: number }
  | { type: 'habit_showcase_post'; minHabits: number }
  | { type: 'post_distinct_dates'; count: number }
  | { type: 'public_post' }
  | { type: 'early_bird_post' }
  | { type: 'following_count'; count: number }
  | { type: 'followers_count'; count: number }
  | { type: 'habit_invites_sent'; count: number }
  | { type: 'partnerships_accepted'; count: number }
  | { type: 'nudges_sent'; count: number }
  | { type: 'likes_given'; count: number }
  | { type: 'comments_made'; count: number }
  | { type: 'challenges_joined'; count: number }
  | { type: 'challenges_completed'; count: number }
  | { type: 'challenges_won'; count: number }
  | { type: 'challenge_proofs'; count: number }
  | { type: 'challenge_daily' }
  | { type: 'challenge_weekly' }
  | { type: 'challenge_paid' }
  | { type: 'challenge_team'; minParticipants: number }
  | { type: 'challenge_rejoin' }
  | { type: 'challenge_clean_sheet' }
  | { type: 'level'; min: number }
  | { type: 'total_exp'; min: number }
  | { type: 'pillar_any'; minPercent: number }
  | { type: 'pillar_all'; minPercent: number }
  | { type: 'profile_exists' }
  | { type: 'active_days'; count: number }
  | { type: 'custom_habits_created'; count: number }
  | { type: 'flag'; key: string }
  | { type: 'is_pro' };

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  image: ImageSourcePropType;
  criteria: AchievementCriteria;
}

const img = (slug: string) => {
  switch (slug) {
    case 'first-reps': return require('../assets/achievements/first-reps.png');
    case 'first-miles': return require('../assets/achievements/first-miles.png');
    case 'first-rest': return require('../assets/achievements/first-rest.png');
    case 'first-sip': return require('../assets/achievements/first-sip.png');
    case 'first-mirror': return require('../assets/achievements/first-mirror.png');
    case 'first-deep-work': return require('../assets/achievements/first-deep-work.png');
    case 'first-goal-pulse': return require('../assets/achievements/first-goal-pulse.png');
    case 'first-breath': return require('../assets/achievements/first-breath.png');
    case 'first-lesson': return require('../assets/achievements/first-lesson.png');
    case 'first-chill': return require('../assets/achievements/first-chill.png');
    case 'first-unplug': return require('../assets/achievements/first-unplug.png');
    case 'first-custom': return require('../assets/achievements/first-custom.png');
    case 'gym-starter': return require('../assets/achievements/gym-starter.png');
    case 'run-starter': return require('../assets/achievements/run-starter.png');
    case 'sleep-starter': return require('../assets/achievements/sleep-starter.png');
    case 'water-starter': return require('../assets/achievements/water-starter.png');
    case 'reflect-starter': return require('../assets/achievements/reflect-starter.png');
    case 'focus-starter': return require('../assets/achievements/focus-starter.png');
    case 'meditation-starter': return require('../assets/achievements/meditation-starter.png');
    case 'microlearn-starter': return require('../assets/achievements/microlearn-starter.png');
    case 'gym-regular': return require('../assets/achievements/gym-regular.png');
    case 'run-regular': return require('../assets/achievements/run-regular.png');
    case 'sleep-regular': return require('../assets/achievements/sleep-regular.png');
    case 'water-regular': return require('../assets/achievements/water-regular.png');
    case 'reflect-regular': return require('../assets/achievements/reflect-regular.png');
    case 'focus-regular': return require('../assets/achievements/focus-regular.png');
    case 'meditation-regular': return require('../assets/achievements/meditation-regular.png');
    case 'microlearn-regular': return require('../assets/achievements/microlearn-regular.png');
    case 'gym-devotee': return require('../assets/achievements/gym-devotee.png');
    case 'run-devotee': return require('../assets/achievements/run-devotee.png');
    case 'sleep-devotee': return require('../assets/achievements/sleep-devotee.png');
    case 'water-devotee': return require('../assets/achievements/water-devotee.png');
    case 'reflect-devotee': return require('../assets/achievements/reflect-devotee.png');
    case 'focus-devotee': return require('../assets/achievements/focus-devotee.png');
    case 'meditation-devotee': return require('../assets/achievements/meditation-devotee.png');
    case 'microlearn-devotee': return require('../assets/achievements/microlearn-devotee.png');
    case 'spark': return require('../assets/achievements/spark.png');
    case 'on-fire': return require('../assets/achievements/on-fire.png');
    case 'steady-flame': return require('../assets/achievements/steady-flame.png');
    case 'unbroken': return require('../assets/achievements/unbroken.png');
    case 'iron-will': return require('../assets/achievements/iron-will.png');
    case 'centurion-streak': return require('../assets/achievements/centurion-streak.png');
    case 'weekend-warrior': return require('../assets/achievements/weekend-warrior.png');
    case 'perfect-day': return require('../assets/achievements/perfect-day.png');
    case 'perfect-week': return require('../assets/achievements/perfect-week.png');
    case 'comeback-kid': return require('../assets/achievements/comeback-kid.png');
    case 'first-frame': return require('../assets/achievements/first-frame.png');
    case 'storyteller': return require('../assets/achievements/storyteller.png');
    case 'chronicler': return require('../assets/achievements/chronicler.png');
    case 'archivist': return require('../assets/achievements/archivist.png');
    case 'photo-bug': return require('../assets/achievements/photo-bug.png');
    case 'gallery': return require('../assets/achievements/gallery.png');
    case 'caption-craft': return require('../assets/achievements/caption-craft.png');
    case 'habit-showcase': return require('../assets/achievements/habit-showcase.png');
    case 'week-in-review': return require('../assets/achievements/week-in-review.png');
    case 'month-of-moments': return require('../assets/achievements/month-of-moments.png');
    case 'public-presence': return require('../assets/achievements/public-presence.png');
    case 'early-bird-post': return require('../assets/achievements/early-bird-post.png');
    case 'first-follow': return require('../assets/achievements/first-follow.png');
    case 'circle-of-five': return require('../assets/achievements/circle-of-five.png');
    case 'community-builder': return require('../assets/achievements/community-builder.png');
    case 'first-follower': return require('../assets/achievements/first-follower.png');
    case 'rising-voice': return require('../assets/achievements/rising-voice.png');
    case 'local-legend': return require('../assets/achievements/local-legend.png');
    case 'accountability-rookie': return require('../assets/achievements/accountability-rookie.png');
    case 'partnered-up': return require('../assets/achievements/partnered-up.png');
    case 'squad-goals': return require('../assets/achievements/squad-goals.png');
    case 'friendly-nudge': return require('../assets/achievements/friendly-nudge.png');
    case 'motivator': return require('../assets/achievements/motivator.png');
    case 'first-like-given': return require('../assets/achievements/first-like-given.png');
    case 'cheerleader': return require('../assets/achievements/cheerleader.png');
    case 'conversation-starter': return require('../assets/achievements/conversation-starter.png');
    case 'first-entry': return require('../assets/achievements/first-entry.png');
    case 'competitor': return require('../assets/achievements/competitor.png');
    case 'challenge-regular': return require('../assets/achievements/challenge-regular.png');
    case 'finisher': return require('../assets/achievements/finisher.png');
    case 'champion': return require('../assets/achievements/champion.png');
    case 'repeat-champion': return require('../assets/achievements/repeat-champion.png');
    case 'proof-ready': return require('../assets/achievements/proof-ready.png');
    case 'proof-machine': return require('../assets/achievements/proof-machine.png');
    case 'daily-grinder': return require('../assets/achievements/daily-grinder.png');
    case 'weekly-warrior': return require('../assets/achievements/weekly-warrior.png');
    case 'paid-entry': return require('../assets/achievements/paid-entry.png');
    case 'team-player': return require('../assets/achievements/team-player.png');
    case 'comeback-challenge': return require('../assets/achievements/comeback-challenge.png');
    case 'clean-sheet': return require('../assets/achievements/clean-sheet.png');
    case 'level-up': return require('../assets/achievements/level-up.png');
    case 'getting-serious': return require('../assets/achievements/getting-serious.png');
    case 'seasoned': return require('../assets/achievements/seasoned.png');
    case 'first-thousand': return require('../assets/achievements/first-thousand.png');
    case 'exp-hunter': return require('../assets/achievements/exp-hunter.png');
    case 'pillar-spark': return require('../assets/achievements/pillar-spark.png');
    case 'pillar-strong': return require('../assets/achievements/pillar-strong.png');
    case 'balanced-four': return require('../assets/achievements/balanced-four.png');
    case 'welcome-aboard': return require('../assets/achievements/welcome-aboard.png');
    case 'week-one': return require('../assets/achievements/week-one.png');
    case 'habit-architect': return require('../assets/achievements/habit-architect.png');
    case 'insight-seeker': return require('../assets/achievements/insight-seeker.png');
    case 'pro-curious': return require('../assets/achievements/pro-curious.png');
    case 'pro-member': return require('../assets/achievements/pro-member.png');
    default: return require('../assets/achievements/welcome-aboard.png');
  }
};

export const ACHIEVEMENT_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-reps',
    title: 'First Reps',
    description: 'Complete Gym once',
    category: 'habits',
    rarity: 'common',
    image: img('first-reps'),
    criteria: { type: 'habit_completions', habit: 'gym', count: 1 },
  },
  {
    id: 'first-miles',
    title: 'First Miles',
    description: 'Complete Run once',
    category: 'habits',
    rarity: 'common',
    image: img('first-miles'),
    criteria: { type: 'habit_completions', habit: 'run', count: 1 },
  },
  {
    id: 'first-rest',
    title: 'First Rest',
    description: 'Complete Sleep once',
    category: 'habits',
    rarity: 'common',
    image: img('first-rest'),
    criteria: { type: 'habit_completions', habit: 'sleep', count: 1 },
  },
  {
    id: 'first-sip',
    title: 'First Sip',
    description: 'Complete Water once',
    category: 'habits',
    rarity: 'common',
    image: img('first-sip'),
    criteria: { type: 'habit_completions', habit: 'water', count: 1 },
  },
  {
    id: 'first-mirror',
    title: 'First Mirror',
    description: 'Complete Reflect once',
    category: 'habits',
    rarity: 'common',
    image: img('first-mirror'),
    criteria: { type: 'habit_completions', habit: 'reflect', count: 1 },
  },
  {
    id: 'first-deep-work',
    title: 'First Deep Work',
    description: 'Complete Focus once',
    category: 'habits',
    rarity: 'common',
    image: img('first-deep-work'),
    criteria: { type: 'habit_completions', habit: 'focus', count: 1 },
  },
  {
    id: 'first-goal-pulse',
    title: 'First Goal Pulse',
    description: 'Complete Update Goal once',
    category: 'habits',
    rarity: 'common',
    image: img('first-goal-pulse'),
    criteria: { type: 'habit_completions', habit: 'update_goal', count: 1 },
  },
  {
    id: 'first-breath',
    title: 'First Breath',
    description: 'Complete Meditation once',
    category: 'habits',
    rarity: 'common',
    image: img('first-breath'),
    criteria: { type: 'habit_completions', habit: 'meditation', count: 1 },
  },
  {
    id: 'first-lesson',
    title: 'First Lesson',
    description: 'Complete Microlearn once',
    category: 'habits',
    rarity: 'common',
    image: img('first-lesson'),
    criteria: { type: 'habit_completions', habit: 'microlearn', count: 1 },
  },
  {
    id: 'first-chill',
    title: 'First Chill',
    description: 'Complete Cold Shower once',
    category: 'habits',
    rarity: 'common',
    image: img('first-chill'),
    criteria: { type: 'habit_completions', habit: 'cold_shower', count: 1 },
  },
  {
    id: 'first-unplug',
    title: 'First Unplug',
    description: 'Complete Screen Time once',
    category: 'habits',
    rarity: 'common',
    image: img('first-unplug'),
    criteria: { type: 'habit_completions', habit: 'screen_time', count: 1 },
  },
  {
    id: 'first-custom',
    title: 'First Custom',
    description: 'Complete any custom habit once',
    category: 'habits',
    rarity: 'common',
    image: img('first-custom'),
    criteria: { type: 'custom_habit_completions', count: 1 },
  },
  {
    id: 'gym-starter',
    title: 'Gym Starter',
    description: 'Complete Gym 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('gym-starter'),
    criteria: { type: 'habit_completions', habit: 'gym', count: 7 },
  },
  {
    id: 'run-starter',
    title: 'Run Starter',
    description: 'Complete Run 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('run-starter'),
    criteria: { type: 'habit_completions', habit: 'run', count: 7 },
  },
  {
    id: 'sleep-starter',
    title: 'Sleep Starter',
    description: 'Complete Sleep 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('sleep-starter'),
    criteria: { type: 'habit_completions', habit: 'sleep', count: 7 },
  },
  {
    id: 'water-starter',
    title: 'Water Starter',
    description: 'Complete Water 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('water-starter'),
    criteria: { type: 'habit_completions', habit: 'water', count: 7 },
  },
  {
    id: 'reflect-starter',
    title: 'Reflect Starter',
    description: 'Complete Reflect 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('reflect-starter'),
    criteria: { type: 'habit_completions', habit: 'reflect', count: 7 },
  },
  {
    id: 'focus-starter',
    title: 'Focus Starter',
    description: 'Complete Focus 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('focus-starter'),
    criteria: { type: 'habit_completions', habit: 'focus', count: 7 },
  },
  {
    id: 'meditation-starter',
    title: 'Meditation Starter',
    description: 'Complete Meditation 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('meditation-starter'),
    criteria: { type: 'habit_completions', habit: 'meditation', count: 7 },
  },
  {
    id: 'microlearn-starter',
    title: 'Microlearn Starter',
    description: 'Complete Microlearn 7 times',
    category: 'habits',
    rarity: 'common',
    image: img('microlearn-starter'),
    criteria: { type: 'habit_completions', habit: 'microlearn', count: 7 },
  },
  {
    id: 'gym-regular',
    title: 'Gym Regular',
    description: 'Complete Gym 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('gym-regular'),
    criteria: { type: 'habit_completions', habit: 'gym', count: 30 },
  },
  {
    id: 'run-regular',
    title: 'Run Regular',
    description: 'Complete Run 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('run-regular'),
    criteria: { type: 'habit_completions', habit: 'run', count: 30 },
  },
  {
    id: 'sleep-regular',
    title: 'Sleep Regular',
    description: 'Complete Sleep 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('sleep-regular'),
    criteria: { type: 'habit_completions', habit: 'sleep', count: 30 },
  },
  {
    id: 'water-regular',
    title: 'Water Regular',
    description: 'Complete Water 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('water-regular'),
    criteria: { type: 'habit_completions', habit: 'water', count: 30 },
  },
  {
    id: 'reflect-regular',
    title: 'Reflect Regular',
    description: 'Complete Reflect 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('reflect-regular'),
    criteria: { type: 'habit_completions', habit: 'reflect', count: 30 },
  },
  {
    id: 'focus-regular',
    title: 'Focus Regular',
    description: 'Complete Focus 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('focus-regular'),
    criteria: { type: 'habit_completions', habit: 'focus', count: 30 },
  },
  {
    id: 'meditation-regular',
    title: 'Meditation Regular',
    description: 'Complete Meditation 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('meditation-regular'),
    criteria: { type: 'habit_completions', habit: 'meditation', count: 30 },
  },
  {
    id: 'microlearn-regular',
    title: 'Microlearn Regular',
    description: 'Complete Microlearn 30 times',
    category: 'habits',
    rarity: 'rare',
    image: img('microlearn-regular'),
    criteria: { type: 'habit_completions', habit: 'microlearn', count: 30 },
  },
  {
    id: 'gym-devotee',
    title: 'Gym Devotee',
    description: 'Complete Gym 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('gym-devotee'),
    criteria: { type: 'habit_completions', habit: 'gym', count: 100 },
  },
  {
    id: 'run-devotee',
    title: 'Run Devotee',
    description: 'Complete Run 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('run-devotee'),
    criteria: { type: 'habit_completions', habit: 'run', count: 100 },
  },
  {
    id: 'sleep-devotee',
    title: 'Sleep Devotee',
    description: 'Complete Sleep 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('sleep-devotee'),
    criteria: { type: 'habit_completions', habit: 'sleep', count: 100 },
  },
  {
    id: 'water-devotee',
    title: 'Water Devotee',
    description: 'Complete Water 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('water-devotee'),
    criteria: { type: 'habit_completions', habit: 'water', count: 100 },
  },
  {
    id: 'reflect-devotee',
    title: 'Reflect Devotee',
    description: 'Complete Reflect 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('reflect-devotee'),
    criteria: { type: 'habit_completions', habit: 'reflect', count: 100 },
  },
  {
    id: 'focus-devotee',
    title: 'Focus Devotee',
    description: 'Complete Focus 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('focus-devotee'),
    criteria: { type: 'habit_completions', habit: 'focus', count: 100 },
  },
  {
    id: 'meditation-devotee',
    title: 'Meditation Devotee',
    description: 'Complete Meditation 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('meditation-devotee'),
    criteria: { type: 'habit_completions', habit: 'meditation', count: 100 },
  },
  {
    id: 'microlearn-devotee',
    title: 'Microlearn Devotee',
    description: 'Complete Microlearn 100 times',
    category: 'habits',
    rarity: 'epic',
    image: img('microlearn-devotee'),
    criteria: { type: 'habit_completions', habit: 'microlearn', count: 100 },
  },
  {
    id: 'spark',
    title: 'Spark',
    description: 'Reach a 3-day habit streak',
    category: 'streaks',
    rarity: 'common',
    image: img('spark'),
    criteria: { type: 'streak_days', count: 3 },
  },
  {
    id: 'on-fire',
    title: 'On Fire',
    description: 'Reach a 7-day habit streak',
    category: 'streaks',
    rarity: 'common',
    image: img('on-fire'),
    criteria: { type: 'streak_days', count: 7 },
  },
  {
    id: 'steady-flame',
    title: 'Steady Flame',
    description: 'Reach a 14-day habit streak',
    category: 'streaks',
    rarity: 'rare',
    image: img('steady-flame'),
    criteria: { type: 'streak_days', count: 14 },
  },
  {
    id: 'unbroken',
    title: 'Unbroken',
    description: 'Reach a 30-day habit streak',
    category: 'streaks',
    rarity: 'epic',
    image: img('unbroken'),
    criteria: { type: 'streak_days', count: 30 },
  },
  {
    id: 'iron-will',
    title: 'Iron Will',
    description: 'Reach a 60-day habit streak',
    category: 'streaks',
    rarity: 'epic',
    image: img('iron-will'),
    criteria: { type: 'streak_days', count: 60 },
  },
  {
    id: 'centurion-streak',
    title: 'Centurion Streak',
    description: 'Reach a 100-day habit streak',
    category: 'streaks',
    rarity: 'legendary',
    image: img('centurion-streak'),
    criteria: { type: 'streak_days', count: 100 },
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Complete habits on Saturday and Sunday in the same week',
    category: 'streaks',
    rarity: 'common',
    image: img('weekend-warrior'),
    criteria: { type: 'weekend_warrior' },
  },
  {
    id: 'perfect-day',
    title: 'Perfect Day',
    description: 'Complete 5+ habits in one day',
    category: 'streaks',
    rarity: 'rare',
    image: img('perfect-day'),
    criteria: { type: 'perfect_day', minHabits: 5 },
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Hit your daily target 7 days straight',
    category: 'streaks',
    rarity: 'epic',
    image: img('perfect-week'),
    criteria: { type: 'perfect_week' },
  },
  {
    id: 'comeback-kid',
    title: 'Comeback Kid',
    description: 'Complete a habit after a 7+ day gap',
    category: 'streaks',
    rarity: 'common',
    image: img('comeback-kid'),
    criteria: { type: 'comeback_kid', gapDays: 7 },
  },
  {
    id: 'first-frame',
    title: 'First Frame',
    description: 'Create your first journey post',
    category: 'journey',
    rarity: 'common',
    image: img('first-frame'),
    criteria: { type: 'posts_count', count: 1 },
  },
  {
    id: 'storyteller',
    title: 'Storyteller',
    description: 'Create 5 journey posts',
    category: 'journey',
    rarity: 'common',
    image: img('storyteller'),
    criteria: { type: 'posts_count', count: 5 },
  },
  {
    id: 'chronicler',
    title: 'Chronicler',
    description: 'Create 15 journey posts',
    category: 'journey',
    rarity: 'rare',
    image: img('chronicler'),
    criteria: { type: 'posts_count', count: 15 },
  },
  {
    id: 'archivist',
    title: 'Archivist',
    description: 'Create 50 journey posts',
    category: 'journey',
    rarity: 'epic',
    image: img('archivist'),
    criteria: { type: 'posts_count', count: 50 },
  },
  {
    id: 'photo-bug',
    title: 'Photo Bug',
    description: 'Upload 10 photos',
    category: 'journey',
    rarity: 'common',
    image: img('photo-bug'),
    criteria: { type: 'photos_count', count: 10 },
  },
  {
    id: 'gallery',
    title: 'Gallery',
    description: 'Upload 50 photos',
    category: 'journey',
    rarity: 'rare',
    image: img('gallery'),
    criteria: { type: 'photos_count', count: 50 },
  },
  {
    id: 'caption-craft',
    title: 'Caption Craft',
    description: 'Create 10 captioned posts',
    category: 'journey',
    rarity: 'common',
    image: img('caption-craft'),
    criteria: { type: 'captioned_posts', count: 10 },
  },
  {
    id: 'habit-showcase',
    title: 'Habit Showcase',
    description: 'Post including 3+ habits completed',
    category: 'journey',
    rarity: 'rare',
    image: img('habit-showcase'),
    criteria: { type: 'habit_showcase_post', minHabits: 3 },
  },
  {
    id: 'week-in-review',
    title: 'Week in Review',
    description: 'Post on 7 different dates',
    category: 'journey',
    rarity: 'rare',
    image: img('week-in-review'),
    criteria: { type: 'post_distinct_dates', count: 7 },
  },
  {
    id: 'month-of-moments',
    title: 'Month of Moments',
    description: 'Post on 20 different dates',
    category: 'journey',
    rarity: 'epic',
    image: img('month-of-moments'),
    criteria: { type: 'post_distinct_dates', count: 20 },
  },
  {
    id: 'public-presence',
    title: 'Public Presence',
    description: 'Make a public post',
    category: 'journey',
    rarity: 'common',
    image: img('public-presence'),
    criteria: { type: 'public_post' },
  },
  {
    id: 'early-bird-post',
    title: 'Early Bird Post',
    description: 'Post before 9am',
    category: 'journey',
    rarity: 'common',
    image: img('early-bird-post'),
    criteria: { type: 'early_bird_post' },
  },
  {
    id: 'first-follow',
    title: 'First Follow',
    description: 'Follow someone',
    category: 'social',
    rarity: 'common',
    image: img('first-follow'),
    criteria: { type: 'following_count', count: 1 },
  },
  {
    id: 'circle-of-five',
    title: 'Circle of Five',
    description: 'Follow 5 people',
    category: 'social',
    rarity: 'common',
    image: img('circle-of-five'),
    criteria: { type: 'following_count', count: 5 },
  },
  {
    id: 'community-builder',
    title: 'Community Builder',
    description: 'Follow 20 people',
    category: 'social',
    rarity: 'rare',
    image: img('community-builder'),
    criteria: { type: 'following_count', count: 20 },
  },
  {
    id: 'first-follower',
    title: 'First Follower',
    description: 'Gain 1 follower',
    category: 'social',
    rarity: 'common',
    image: img('first-follower'),
    criteria: { type: 'followers_count', count: 1 },
  },
  {
    id: 'rising-voice',
    title: 'Rising Voice',
    description: 'Reach 10 followers',
    category: 'social',
    rarity: 'rare',
    image: img('rising-voice'),
    criteria: { type: 'followers_count', count: 10 },
  },
  {
    id: 'local-legend',
    title: 'Local Legend',
    description: 'Reach 50 followers',
    category: 'social',
    rarity: 'epic',
    image: img('local-legend'),
    criteria: { type: 'followers_count', count: 50 },
  },
  {
    id: 'accountability-rookie',
    title: 'Accountability Rookie',
    description: 'Send a habit invite',
    category: 'social',
    rarity: 'common',
    image: img('accountability-rookie'),
    criteria: { type: 'habit_invites_sent', count: 1 },
  },
  {
    id: 'partnered-up',
    title: 'Partnered Up',
    description: 'Have an accepted partnership',
    category: 'social',
    rarity: 'common',
    image: img('partnered-up'),
    criteria: { type: 'partnerships_accepted', count: 1 },
  },
  {
    id: 'squad-goals',
    title: 'Squad Goals',
    description: 'Have 3 active partnerships',
    category: 'social',
    rarity: 'rare',
    image: img('squad-goals'),
    criteria: { type: 'partnerships_accepted', count: 3 },
  },
  {
    id: 'friendly-nudge',
    title: 'Friendly Nudge',
    description: 'Send a nudge',
    category: 'social',
    rarity: 'common',
    image: img('friendly-nudge'),
    criteria: { type: 'nudges_sent', count: 1 },
  },
  {
    id: 'motivator',
    title: 'Motivator',
    description: 'Send 10 nudges',
    category: 'social',
    rarity: 'rare',
    image: img('motivator'),
    criteria: { type: 'nudges_sent', count: 10 },
  },
  {
    id: 'first-like-given',
    title: 'First Like Given',
    description: 'Like a community post',
    category: 'social',
    rarity: 'common',
    image: img('first-like-given'),
    criteria: { type: 'likes_given', count: 1 },
  },
  {
    id: 'cheerleader',
    title: 'Cheerleader',
    description: 'Like 25 posts',
    category: 'social',
    rarity: 'common',
    image: img('cheerleader'),
    criteria: { type: 'likes_given', count: 25 },
  },
  {
    id: 'conversation-starter',
    title: 'Conversation Starter',
    description: 'Leave 5 comments',
    category: 'social',
    rarity: 'rare',
    image: img('conversation-starter'),
    criteria: { type: 'comments_made', count: 5 },
  },
  {
    id: 'first-entry',
    title: 'First Entry',
    description: 'Join a challenge',
    category: 'challenges',
    rarity: 'common',
    image: img('first-entry'),
    criteria: { type: 'challenges_joined', count: 1 },
  },
  {
    id: 'competitor',
    title: 'Competitor',
    description: 'Join 5 challenges',
    category: 'challenges',
    rarity: 'rare',
    image: img('competitor'),
    criteria: { type: 'challenges_joined', count: 5 },
  },
  {
    id: 'challenge-regular',
    title: 'Challenge Regular',
    description: 'Join 15 challenges',
    category: 'challenges',
    rarity: 'epic',
    image: img('challenge-regular'),
    criteria: { type: 'challenges_joined', count: 15 },
  },
  {
    id: 'finisher',
    title: 'Finisher',
    description: 'Complete a challenge',
    category: 'challenges',
    rarity: 'rare',
    image: img('finisher'),
    criteria: { type: 'challenges_completed', count: 1 },
  },
  {
    id: 'champion',
    title: 'Champion',
    description: 'Win a challenge',
    category: 'challenges',
    rarity: 'epic',
    image: img('champion'),
    criteria: { type: 'challenges_won', count: 1 },
  },
  {
    id: 'repeat-champion',
    title: 'Repeat Champion',
    description: 'Win 3 challenges',
    category: 'challenges',
    rarity: 'legendary',
    image: img('repeat-champion'),
    criteria: { type: 'challenges_won', count: 3 },
  },
  {
    id: 'proof-ready',
    title: 'Proof Ready',
    description: 'Submit first challenge proof',
    category: 'challenges',
    rarity: 'common',
    image: img('proof-ready'),
    criteria: { type: 'challenge_proofs', count: 1 },
  },
  {
    id: 'proof-machine',
    title: 'Proof Machine',
    description: 'Submit 20 challenge proofs',
    category: 'challenges',
    rarity: 'rare',
    image: img('proof-machine'),
    criteria: { type: 'challenge_proofs', count: 20 },
  },
  {
    id: 'daily-grinder',
    title: 'Daily Grinder',
    description: 'Join a daily recurring challenge',
    category: 'challenges',
    rarity: 'common',
    image: img('daily-grinder'),
    criteria: { type: 'challenge_daily' },
  },
  {
    id: 'weekly-warrior',
    title: 'Weekly Warrior',
    description: 'Join a weekly challenge',
    category: 'challenges',
    rarity: 'common',
    image: img('weekly-warrior'),
    criteria: { type: 'challenge_weekly' },
  },
  {
    id: 'paid-entry',
    title: 'Paid Entry',
    description: 'Join a paid challenge',
    category: 'challenges',
    rarity: 'rare',
    image: img('paid-entry'),
    criteria: { type: 'challenge_paid' },
  },
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Join a challenge with 5+ participants',
    category: 'challenges',
    rarity: 'common',
    image: img('team-player'),
    criteria: { type: 'challenge_team', minParticipants: 5 },
  },
  {
    id: 'comeback-challenge',
    title: 'Comeback Challenge',
    description: 'Rejoin a challenge after leaving',
    category: 'challenges',
    rarity: 'common',
    image: img('comeback-challenge'),
    criteria: { type: 'challenge_rejoin' },
  },
  {
    id: 'clean-sheet',
    title: 'Clean Sheet',
    description: 'Finish a challenge with 100% completion',
    category: 'challenges',
    rarity: 'legendary',
    image: img('clean-sheet'),
    criteria: { type: 'challenge_clean_sheet' },
  },
  {
    id: 'level-up',
    title: 'Level Up',
    description: 'Reach level 2',
    category: 'progress',
    rarity: 'common',
    image: img('level-up'),
    criteria: { type: 'level', min: 2 },
  },
  {
    id: 'getting-serious',
    title: 'Getting Serious',
    description: 'Reach level 5',
    category: 'progress',
    rarity: 'rare',
    image: img('getting-serious'),
    criteria: { type: 'level', min: 5 },
  },
  {
    id: 'seasoned',
    title: 'Seasoned',
    description: 'Reach level 10',
    category: 'progress',
    rarity: 'epic',
    image: img('seasoned'),
    criteria: { type: 'level', min: 10 },
  },
  {
    id: 'first-thousand',
    title: 'First Thousand',
    description: 'Earn 1,000 EXP',
    category: 'progress',
    rarity: 'rare',
    image: img('first-thousand'),
    criteria: { type: 'total_exp', min: 1000 },
  },
  {
    id: 'exp-hunter',
    title: 'EXP Hunter',
    description: 'Earn 5,000 EXP',
    category: 'progress',
    rarity: 'epic',
    image: img('exp-hunter'),
    criteria: { type: 'total_exp', min: 5000 },
  },
  {
    id: 'pillar-spark',
    title: 'Pillar Spark',
    description: 'Any pillar reaches 40%',
    category: 'progress',
    rarity: 'common',
    image: img('pillar-spark'),
    criteria: { type: 'pillar_any', minPercent: 40 },
  },
  {
    id: 'pillar-strong',
    title: 'Pillar Strong',
    description: 'Any pillar reaches 70%',
    category: 'progress',
    rarity: 'rare',
    image: img('pillar-strong'),
    criteria: { type: 'pillar_any', minPercent: 70 },
  },
  {
    id: 'balanced-four',
    title: 'Balanced Four',
    description: 'All four pillars at 50%+',
    category: 'progress',
    rarity: 'legendary',
    image: img('balanced-four'),
    criteria: { type: 'pillar_all', minPercent: 50 },
  },
  {
    id: 'welcome-aboard',
    title: 'Welcome Aboard',
    description: 'Finish onboarding / first day on Nutrapp',
    category: 'milestones',
    rarity: 'common',
    image: img('welcome-aboard'),
    criteria: { type: 'profile_exists' },
  },
  {
    id: 'week-one',
    title: 'Week One',
    description: 'Be active on 7 distinct days',
    category: 'milestones',
    rarity: 'common',
    image: img('week-one'),
    criteria: { type: 'active_days', count: 7 },
  },
  {
    id: 'habit-architect',
    title: 'Habit Architect',
    description: 'Create a custom habit',
    category: 'milestones',
    rarity: 'common',
    image: img('habit-architect'),
    criteria: { type: 'custom_habits_created', count: 1 },
  },
  {
    id: 'insight-seeker',
    title: 'Insight Seeker',
    description: 'Open Insights',
    category: 'milestones',
    rarity: 'common',
    image: img('insight-seeker'),
    criteria: { type: 'flag', key: 'insights_opened' },
  },
  {
    id: 'pro-curious',
    title: 'Pro Curious',
    description: 'Open the Upgrade to Pro modal',
    category: 'milestones',
    rarity: 'common',
    image: img('pro-curious'),
    criteria: { type: 'flag', key: 'pro_modal_opened' },
  },
  {
    id: 'pro-member',
    title: 'Pro Member',
    description: 'Become a Pro member',
    category: 'milestones',
    rarity: 'epic',
    image: img('pro-member'),
    criteria: { type: 'is_pro' },
  }
];

export const ACHIEVEMENT_BY_ID: Record<string, BadgeDefinition> = Object.fromEntries(
  ACHIEVEMENT_DEFINITIONS.map((d) => [d.id, d])
);

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENT_DEFINITIONS.length;

const RARITY_HARDNESS: Record<AchievementRarity, number> = {
  legendary: 4000,
  epic: 3000,
  rare: 2000,
  common: 1000,
};

/** Higher = harder to obtain */
export function achievementDifficultyScore(def: Pick<BadgeDefinition, 'rarity' | 'criteria'>): number {
  const base = RARITY_HARDNESS[def.rarity] ?? 0;
  const c = def.criteria;
  let weight = 0;
  switch (c.type) {
    case 'habit_completions':
    case 'custom_habit_completions':
    case 'streak_days':
    case 'posts_count':
    case 'photos_count':
    case 'captioned_posts':
    case 'post_distinct_dates':
    case 'following_count':
    case 'followers_count':
    case 'habit_invites_sent':
    case 'partnerships_accepted':
    case 'nudges_sent':
    case 'likes_given':
    case 'comments_made':
    case 'challenges_joined':
    case 'challenges_completed':
    case 'challenges_won':
    case 'challenge_proofs':
    case 'active_days':
    case 'custom_habits_created':
      weight = c.count;
      break;
    case 'perfect_day':
    case 'habit_showcase_post':
    case 'challenge_team':
      weight = 'minHabits' in c ? c.minHabits : c.minParticipants;
      break;
    case 'comeback_kid':
      weight = c.gapDays;
      break;
    case 'level':
      weight = c.min * 10;
      break;
    case 'total_exp':
      weight = c.min / 10;
      break;
    case 'pillar_any':
    case 'pillar_all':
      weight = c.minPercent;
      break;
    case 'challenge_clean_sheet':
    case 'is_pro':
      weight = 80;
      break;
    case 'perfect_week':
    case 'challenge_paid':
      weight = 40;
      break;
    case 'weekend_warrior':
    case 'public_post':
    case 'early_bird_post':
    case 'challenge_daily':
    case 'challenge_weekly':
    case 'challenge_rejoin':
    case 'profile_exists':
    case 'flag':
      weight = 5;
      break;
    default:
      weight = 1;
  }
  return base + weight;
}

/** Hardest first → easiest last */
export function sortAchievementsHardestFirst<T extends Pick<BadgeDefinition, 'rarity' | 'criteria' | 'id'>>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const diff = achievementDifficultyScore(b) - achievementDifficultyScore(a);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}
