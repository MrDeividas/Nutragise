DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Winning');
DELETE FROM public.information WHERE title = 'Winning';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Winning',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Winning costs</h2>
<ul><li>Pay the price consciously.</li></ul>
<h2>2. Decide</h2>
<ul><li>Ambiguity chooses average.</li></ul>
<h2>3. Mindset with evidence</h2>
<ul><li>Belief trained by hard finishes.</li></ul>
<h2>4. Honest rest vs fake work</h2>
<ul><li>Train or recover — don’t pretend.</li></ul>
<h2>5. Leads and losses</h2>
<ul><li>Tighten when ahead; learn when behind.</li></ul>
<h1>PART 2 — WINNING</h1>
<h2>A 27-Minute Read Summary</h2>
<h3>Chapter 1: Winning is not a vibe</h3>
<p>Grover’s Winning says excellence has costs — time, managed relationships, preparation pain. Wanting the podium without the price is fantasy.</p>
<p>Define winning with scoreboard clarity in your domain.</p>
<p>List costs you accept and ethical costs you refuse.</p>
<p>Align home stakeholders so standards are not silent surprises.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Accept winning’s costs consciously.</p>
<h3>Chapter 2: Burn ambiguity</h3>
<p>Ambiguous goals create ambiguous effort. Decide, cut options, commit for a cycle.</p>
<p>Indecision quietly selects average.</p>
<p>Write decisions down; stop endless re-polling.</p>
<p>Review after full cycles, not daily moods.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Decide clearly and commit through a cycle.</p>
<h3>Chapter 3: Mindset under watch</h3>
<p>Belief that holds under doubt is built from evidence of hard finishes, not posters.</p>
<p>Keep evidence logs of finished hard things.</p>
<p>Guard inputs that undermine belief without offering strategy.</p>
<p>After doubt, return to controllable prep.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Train belief with evidence and prep.</p>
<h3>Chapter 4: Soft day problem</h3>
<p>Rest is strategic. Fake work days destroy winning. Be honest: train or recover.</p>
<p>Define rest inclusions and exclusions.</p>
<p>Color-code the calendar; kill guilt-soothing half sessions.</p>
<p>Ask a partner: was today real?</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Truly train or truly recover — do not fake either.</p>
<h3>Chapter 5: When ahead, tighten</h3>
<p>Leads create softness. Champions tighten details when ahead.</p>
<p>Create ahead-protocols that keep basics alive.</p>
<p>Celebrate without dismantling tomorrow’s setup.</p>
<p>Ask where softness could enter this week.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Tighten standards when ahead.</p>
<h3>Chapter 6: Losing without becoming a loser</h3>
<p>Losing is information; loser is identity. Separate them.</p>
<p>Short mourning window, then fix controllables.</p>
<p>Install fix lists, not blame carnivals.</p>
<p>One improvement contract per loss.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Treat losing as information — then fix.</p>
<h3>Chapter 7: Pressure and loneliness</h3>
<p>High standards isolate. Manage loneliness with trusted few, not by lowering standards for belonging.</p>
<p>Find peers at your ambition level.</p>
<p>Keep tenderness at home while work is hard.</p>
<p>Schedule ordinary joys so winning does not erase personhood.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Manage loneliness without diluting standards.</p>
<h3>Chapter 8: Weapons: focus, craft, body</h3>
<p>Winning needs focus, craft depth, and physical capacity. Rivals exploit neglect.</p>
<p>Train each weapon weekly with drills.</p>
<p>Audit the weakest weapon monthly and raise it.</p>
<p>Device rules protect the focus weapon.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Train focus, craft, and body — raise the weakest.</p>
<h3>Chapter 9: No spare people</h3>
<p>Passenger mode is expensive. Clarify roles; contribute or exit.</p>
<p>Leaders remove role ambiguity early.</p>
<p>Hire for ownership.</p>
<p>Weekly: contributing or commenting?</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Drop passenger mode — own a contribution.</p>
<h3>Chapter 10: Winning ethics</h3>
<p>Dirty wins poison meaning. Set bright lines before pressure tempts you.</p>
<p>Teach juniors that integrity is part of winning.</p>
<p>Repair quickly if you cross a line.</p>
<p>Ask whether you will respect the win in ten years.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Keep ethical bright lines under pressure.</p>
<h3>Chapter 11: After the trophy</h3>
<p>If identity is only the trophy, emptiness follows. Anchor identity in craft and values.</p>
<p>Keep non-scoreboard relationships and interests.</p>
<p>Plan transitions early; help others win as a second act.</p>
<p>Practice gratitude after wins.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Build identity beyond trophies.</p>
<h3>Chapter 12: Start tomorrow morning</h3>
<p>Winning starts tonight: sleep, prep, plan, remove soft exits.</p>
<p>Pick one non-negotiable for thirty days.</p>
<p>Seek one pressure rep weekly.</p>
<p>Begin — deciding to win later is deciding not to now.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Prep tonight and lock one non-negotiable for thirty days.</p>
<h3>Application Lab 1: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 2: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 3: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 4: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 5: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 6: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 7: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 8: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 9: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 10: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 11: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 12: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 13: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 14: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 15: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 1: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 2: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 3: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 4: Winning</h3>
<p>Turn Winning into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>
',
    27,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781982169039-L.jpg',
    'Tim Grover on what winning actually costs — clarity, obsession, and refusing the soft middle.'
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
  ('What does Grover emphasize about winning?', 'It should cost nothing', 'Winning has real costs you must accept consciously', 'Only vibes', 'Ambiguity helps', 'B', 1),
  ('What is the soft day problem?', 'Rest is forbidden', 'Faking work instead of truly training or recovering', 'Weekends only', 'Calendars are bad', 'B', 2),
  ('How should you treat losing?', 'As permanent identity', 'As information — mourn briefly, then fix controllables', 'Blame forever', 'Ignore it', 'B', 3),
  ('Which weapons are highlighted?', 'Trash talk and luck', 'Focus, craft, and body', 'Talent only', 'Branding only', 'B', 4),
  ('What should you do when ahead?', 'Relax standards', 'Tighten details — softness starts collapses', 'Only hunt highlights', 'Ignore basics', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
