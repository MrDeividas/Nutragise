import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const STATS = [
  { label: 'Boost Your Energy', value: '38%' },
  { label: 'Reduce Fatigue', value: '15%' },
  { label: 'Gain Muscle Strength', value: '23%' },
  { label: 'Complete Goals', value: '20%' },
];

const RESEARCH_LINKS = [
  {
    title: 'How long does it take to form a habit?',
    domain: 'ucl.ac.uk',
    url: 'https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit',
  },
  {
    title: 'Making health habitual: the psychology of habit-formation',
    domain: 'bjgp.org',
    url: 'https://bjgp.org/content/62/605/664',
  },
  {
    title: 'Time to Form a Habit: A Systematic Review and Meta-Analysis',
    domain: 'mdpi.com',
    url: 'https://www.mdpi.com/2227-9032/12/23/2488',
  },
  {
    title: 'Busting the 21 days habit formation myth',
    domain: 'blogs.ucl.ac.uk',
    url: 'https://blogs.ucl.ac.uk/bsh/2012/06/29/busting-the-21-days-habit-formation-myth/',
  },
  {
    title: 'Building Habits: The Key to Lasting Behavior Change',
    domain: 'gsb.stanford.edu',
    url: 'https://www.gsb.stanford.edu/insights/building-habits-key-lasting-behavior-change',
  },
  {
    title: 'Psychology of Habit (Wood & Rünger, 2016)',
    domain: 'usc.edu',
    url: 'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/wood.runger.2016.pdf',
  },
];

const CITATIONS = [
  {
    badge: 'USC',
    badgeColor: '#990000',
    quote:
      'Habits form through repeated actions in stable contexts, taking weeks to months to become automatic.',
    cite: 'Wood, W., & Rünger, D. (2016). Psychology of Habit. Annual Review of Psychology.',
    url: 'https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/wood.runger.2016.pdf',
  },
  {
    badge: 'UCL',
    badgeColor: '#AC1F37',
    quote:
      '96 participants performed a daily behavior, and automaticity was modeled to plateau at an average of 66 days, with a range of 18–254 days.',
    cite: 'Lally, P., et al. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology.',
    url: 'https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit',
  },
  {
    badge: 'AH',
    badgeColor: '#1f2937',
    quote:
      'On average, it takes more than two months before a new behavior becomes automatic—66 days to be exact.',
    cite: 'Clear, J. (2018). Atomic Habits. Avery.',
    url: 'https://jamesclear.com/new-habit',
  },
];

const BENEFITS = [
  { before: 'Your ', bold1: 'physical strength', mid: ' will ', bold2: 'drastically improve', after: '' },
  { before: 'Your endurance and discipline will be ', bold1: '3x stronger', mid: '', bold2: '', after: '' },
  { before: 'You will feel ', bold1: 'more motivated and energized', mid: ' than ever', bold2: '', after: '' },
  { before: 'Your ', bold1: 'dopamine reward system', mid: ' will be refreshed', bold2: '', after: '' },
];

const HABIT_ICONS: Record<string, string> = {
  sleep: '😴',
  reflect: '✨',
  run: '🏃',
  update_goal: '📝',
  gym: '💪',
  meditation: '🧘',
  focus: '🎯',
  water: '💧',
  microlearn: '📚',
  screen_time: '📱',
  cold_shower: '🚿',
};

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    /* ignore */
  }
}

function formatTargetDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface NavProps {
  onNext: () => void;
  onBack: () => void;
}

/** Page 1 — habit-formation research + stats + sourced links */
export function ScienceDaysStep({ onNext, onBack }: NavProps) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Continue" onPress={onNext} />}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.hero}>
          <Ionicons name="sunny-outline" size={28} color={OB.accentWarm} style={{ marginBottom: 12 }} />
          <Text style={styles.heroLead}>Top scientific research shows that it takes</Text>
          <Text style={styles.heroDays}>just a little over 2 months</Text>
          <Text style={styles.heroTail}>
            to build lasting habits and{' '}
            <Text style={styles.heroAccent}>transform your life.</Text>
          </Text>
        </Animated.View>

        <View style={styles.statGrid}>
          {STATS.map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(40 + i * 40)} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Ionicons name="caret-up" size={14} color={OB.primary} />
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={styles.researchCard}>
          <Text style={styles.researchTitle}>Scientific research</Text>
          {RESEARCH_LINKS.map((item) => (
            <TouchableOpacity
              key={item.url}
              style={styles.linkRow}
              onPress={() => openUrl(item.url)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="link-outline" size={14} color={OB.primaryDark} />
              </View>
              <Text style={styles.linkTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.linkDomain} numberOfLines={1}>
                {item.domain}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

/** Page 2 — citation cards + trust badges */
export function SciencePlanStep({ onNext, onBack }: NavProps) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Continue" onPress={onNext} />}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.hero}>
          <Ionicons name="sunny-outline" size={28} color={OB.accentWarm} style={{ marginBottom: 12 }} />
          <Text style={styles.planHeadline}>Nutragise’s Science-Backed Plan</Text>
        </Animated.View>

        {CITATIONS.map((c, i) => (
          <Animated.View key={c.cite} entering={FadeInDown.delay(60 + i * 50)}>
            <TouchableOpacity
              style={styles.citeCard}
              onPress={() => openUrl(c.url)}
              activeOpacity={0.85}
            >
              <View style={[styles.citeBadge, { backgroundColor: c.badgeColor }]}>
                <Text style={styles.citeBadgeText}>{c.badge}</Text>
              </View>
              <View style={styles.citeBody}>
                <Text style={styles.citeQuote}>{c.quote}</Text>
                <Text style={styles.citeSource}>{c.cite}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.trustRow}>
          <View style={styles.trustBadge}>
            <Ionicons name="ribbon-outline" size={22} color={OB.primaryDark} />
            <Text style={styles.trustText}>1,500+ CITED{'\n'}GOOGLE SCHOLAR</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="ribbon-outline" size={22} color={OB.accentWarm} />
            <Text style={styles.trustText}>1,000,000+ SOLD{'\n'}NY TIMES BESTSELLER</Text>
          </View>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

interface ProgramProps extends NavProps {
  name?: string;
  selectedHabits: string[];
}

/** Page 3 — personalized program (~2 months) */
export function ProgramStartStep({ name, selectedHabits, onNext, onBack }: ProgramProps) {
  const display = name?.trim() || 'friend';
  const targetDate = useMemo(() => formatTargetDate(66), []);
  const icons = useMemo(() => {
    const fromSelection = selectedHabits
      .map((id) => HABIT_ICONS[id])
      .filter(Boolean)
      .slice(0, 8);
    if (fromSelection.length >= 4) return fromSelection;
    return ['😴', '💧', '🏃', '💪', '🧘', '📚', '📱', '🚿'];
  }, [selectedHabits]);

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Start My Program" onPress={onNext} showArrow={false} />}
    >
      <ScrollView contentContainerStyle={styles.programContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={{ alignItems: 'center' }}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={22} color={OB.primaryDark} />
          </View>
          <Text style={styles.programTitle}>
            {display}, we’ll help you become the best version of yourself in just a little over 2 months.
          </Text>
          <Text style={styles.programSub}>
            But you have to put the work in. Stick with it, and we promise you’ll feel more consistent — with a habit system you can actually keep — by:
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)} style={styles.dateCard}>
          <Text style={styles.dateText}>{targetDate}</Text>
        </Animated.View>

        <View style={styles.benefitList}>
          {BENEFITS.map((b, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(120 + i * 40)} style={styles.benefitRow}>
              <Ionicons name="checkmark" size={18} color={OB.textSoft} style={{ marginTop: 2 }} />
              <Text style={styles.benefitText}>
                {b.before}
                {b.bold1 ? <Text style={styles.benefitBold}>{b.bold1}</Text> : null}
                {b.mid}
                {b.bold2 ? <Text style={styles.benefitBold}>{b.bold2}</Text> : null}
                {b.after}
              </Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.habitIconRow}>
          {icons.map((emoji, i) => (
            <View key={`${emoji}-${i}`} style={[styles.habitIcon, i === 0 && styles.habitIconOn]}>
              <Text style={styles.habitEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  heroLead: {
    fontSize: 15,
    color: OB.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  heroDays: {
    fontSize: 34,
    fontWeight: '900',
    color: OB.accentCoral,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 40,
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  heroTail: {
    fontSize: 16,
    color: OB.text,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    fontWeight: '600',
  },
  heroAccent: {
    color: OB.accentCoral,
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: OB.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: OB.border,
  },
  statLabel: {
    fontSize: 12,
    color: OB.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: OB.text,
  },
  researchCard: {
    backgroundColor: OB.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: OB.border,
  },
  researchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OB.border,
  },
  linkIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: OB.text,
  },
  linkDomain: {
    maxWidth: 96,
    fontSize: 11,
    color: OB.textSoft,
    textAlign: 'right',
  },
  planHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    lineHeight: 34,
    maxWidth: 300,
  },
  citeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: OB.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: OB.border,
  },
  citeBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citeBadgeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  citeBody: {
    flex: 1,
    gap: 8,
  },
  citeQuote: {
    fontSize: 14,
    fontWeight: '700',
    color: OB.text,
    lineHeight: 20,
  },
  citeSource: {
    fontSize: 11,
    color: OB.textMuted,
    lineHeight: 16,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  trustBadge: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: OB.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: OB.border,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '800',
    color: OB.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  programContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: OB.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#ECFDF5',
  },
  programTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  programSub: {
    fontSize: 14,
    color: OB.textMuted,
    textAlign: 'center',
    marginBottom: 18,
  },
  dateCard: {
    backgroundColor: OB.white,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: OB.primary,
    marginBottom: 22,
    ...OB.cardShadow,
    shadowColor: OB.primary,
    shadowOpacity: 0.2,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '900',
    color: OB.text,
  },
  benefitList: {
    gap: 14,
    marginBottom: 22,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: OB.text,
    lineHeight: 22,
  },
  benefitBold: {
    fontWeight: '800',
  },
  habitIconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: OB.white,
    borderWidth: 1,
    borderColor: OB.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconOn: {
    borderColor: OB.primary,
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  habitEmoji: {
    fontSize: 18,
  },
});
