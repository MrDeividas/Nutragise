DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Relentless');
DELETE FROM public.information WHERE title = 'Relentless';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Relentless',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Cooler, Closer, Cleaner</h2>
<ul><li>Three levels; Cleaners own the standard.</li></ul>
<h2>2. Dark side</h2>
<ul><li>Controlled intensity without soft bargains.</li></ul>
<h2>3. Pressure privilege</h2>
<ul><li>Seek deciding moments.</li></ul>
<h2>4. Trust few</h2>
<ul><li>Deep truth-tellers over noisy circles.</li></ul>
<h2>5. Prep obsession</h2>
<ul><li>Details before lights.</li></ul>
<h1>PART 2 — RELENTLESS</h1>
<h2>A 28-Minute Read Summary</h2>
<h3>Chapter 1: Coolers, Closers, Cleaners</h3>
<p>Tim Grover sorts performers into Coolers who maintain, Closers who finish late, and Cleaners who impose relentless standards all day.</p>
<p>Most people overrate themselves as Cleaners. Honest inventory hurts and helps.</p>
<p>Cleaners still need recovery and ethics; intensity without aim burns careers.</p>
<p>Ask who raises the standard when nobody watches.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Assess Cooler/Closer/Cleaner honestly — raise unwatched standards.</p>
<h3>Chapter 2: Dark side controlled</h3>
<p>Dark side means controlled fire — doing uncomfortable work others skip — not abuse.</p>
<p>Channel emotion into training and execution, not drama.</p>
<p>Write rules for what intensity may and may not touch — family is usually off-limits.</p>
<p>Quiet preparation can be more relentless than loud anger.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Aim intensity at craft — never use it as a pass to harm people.</p>
<h3>Chapter 3: You don’t get to like it</h3>
<p>Excellence often feels ugly in process. Preference is optional; the standard is not during committed hours.</p>
<p>Motivation is weather; standards are climate.</p>
<p>Periodize enjoyment so you do not quit the craft forever.</p>
<p>Log days you performed without liking it — that identity matters.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Meet the standard even when you do not like the work.</p>
<h3>Chapter 4: Pressure is where Cleaners live</h3>
<p>Cleaners seek pressure because that is where outcomes are decided.</p>
<p>Practice with stakes: timers, audiences, consequences.</p>
<p>Reframe pressure as privilege — you earned a stage.</p>
<p>Volunteer for one high-stakes rep monthly.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Seek pressure as privilege and train steadiness inside it.</p>
<h3>Chapter 5: Trust few, trust deep</h3>
<p>Relentless careers need rare truth-tellers, not large opinion choruses.</p>
<p>Trust grows from competence and confidentiality.</p>
<p>If nobody can criticize you, you are unprotected.</p>
<p>Name your three truth-tellers and trim the rest.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Keep a small hard-truth circle.</p>
<h3>Chapter 6: Cleaner preparation</h3>
<p>Preparation is relentlessness before cameras. Amateurs hope game day elevates them.</p>
<p>Checklists beat memory under fatigue.</p>
<p>Prep the night before so morning is execution.</p>
<p>Measure prep hours like performance hours.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Obsess over prep before the lights.</p>
<h3>Chapter 7: Keep going when ugly</h3>
<p>Relentless means continuing intelligent work when aesthetics disappear.</p>
<p>Differentiate push-through from medical shutdown.</p>
<p>Ugly-day protocols: shortened high-quality sessions instead of zeros.</p>
<p>Teammates watch ugly days closely.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> On ugly days, shorten but do not go to zero.</p>
<h3>Chapter 8: Language of standards</h3>
<p>Blunt clear standards beat soft exits. Done or not done.</p>
<p>Avoid theatrical trash talk that replaces prep.</p>
<p>Rewrite three excuses into next actions.</p>
<p>Use blunt kindness with others: clear and respectful.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Replace soft exit talk with clear standards.</p>
<h3>Chapter 9: Relentless beyond sport</h3>
<p>Apply Cleaner standards to shipping, study, sales, and craft consistency.</p>
<p>Define Cleaner behaviors for your job.</p>
<p>Do not import sports cruelty into home life.</p>
<p>Weekly: where did I lower an unwatched standard?</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Translate Cleaner standards into craft — protect home.</p>
<h3>Chapter 10: Ego vs standard</h3>
<p>Ego wants credit; standards want results. Chase results.</p>
<p>Celebrate quietly; return to prep.</p>
<p>Filter criticism for signal.</p>
<p>After wins ask what a Cleaner would improve next.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Chase standards over credit.</p>
<h3>Chapter 11: Recovery as part of war</h3>
<p>Relentless fails without recovery. Sleep, mobility, and true off-switches keep the weapon sharp.</p>
<p>Schedule recovery like training.</p>
<p>Guilt during rest is often fake discipline.</p>
<p>Injury signals are not loyalty tests.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Recover on purpose — sharp lasts longer than brittle.</p>
<h3>Chapter 12: Hard to compete against</h3>
<p>Become hard to compete against all day through consistent average days.</p>
<p>Make your average better than others’ motivated days.</p>
<p>Stack unbeatable habits for twelve weeks.</p>
<p>Tonight pick one prep obsession for tomorrow.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Make average days dangerously consistent.</p>
<h3>Application Lab 1: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 2: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 3: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 4: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 5: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 6: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 7: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 8: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 9: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 10: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 11: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 12: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 13: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 14: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 15: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 1: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 2: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 3: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 4: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 5: Relentless</h3>
<p>Turn Relentless into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>
',
    28,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781476710938-L.jpg',
    'Tim Grover’s elite performer mindset — Cleaners vs Contenders, dark side drive, and staying uncomfortably excellent.'
  )
  RETURNING id
)
INSERT INTO public.questions (
  information_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order
)
SELECT i.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.question_order
FROM inserted i
CROSS JOIN (
  VALUES
  ('What are Grover’s three types?', 'Starters, bench, fans', 'Coolers, Closers, and Cleaners', 'Loud, louder, loudest', 'Winners only', 'B', 1),
  ('What is the dark side here?', 'Abuse', 'Controlled intensity that refuses soft self-bargains', 'No recovery ever', 'Ignoring all coaches', 'B', 2),
  ('How should Cleaners treat pressure?', 'Avoid it', 'Seek it as privilege and train to stay steady', 'Only complain', 'Outsource always', 'B', 3),
  ('Why trust few?', 'Friends are useless', 'Deep truth-tellers protect standards; noise dilutes them', 'Isolation maximizes ego helpfully always', 'Never accept critique', 'B', 4),
  ('What makes you hard to compete against?', 'Trash talk', 'Dangerously consistent average days and prep', 'Only highlights', 'Skipping recovery forever', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
