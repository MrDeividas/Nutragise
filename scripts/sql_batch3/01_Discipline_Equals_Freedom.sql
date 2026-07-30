DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Discipline Equals Freedom');
DELETE FROM public.information WHERE title = 'Discipline Equals Freedom';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Discipline Equals Freedom',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Discipline creates options</h2>
<ul><li>Structure frees future-you from chaos.</li></ul>
<h2>2. Ownership</h2>
<ul><li>Own responses and standards instead of blame.</li></ul>
<h2>3. Default aggressive</h2>
<ul><li>Bias to mission-focused action.</li></ul>
<h2>4. Daily materials</h2>
<ul><li>Sleep, training, fuel, focus.</li></ul>
<h2>5. Hard things now</h2>
<ul><li>Attack problems early.</li></ul>
<h1>PART 2 — DISCIPLINE EQUALS FREEDOM</h1>
<h2>A 26-Minute Read Summary</h2>
<h3>Chapter 1: Freedom is on the far side of discipline</h3>
<p>Jocko Willink’s Discipline Equals Freedom argues that chosen constraints create real options. Avoiding structure feels free until impulses, clutter, and unfinished business own your calendar.</p>
<p>Wake, train, and do hard work before bargaining with mood, and you gain freedom to perform when stakes rise. Soft mornings look kind and become expensive.</p>
<p>Write freedom targets — calm mind, strong body, reliable craft — then reverse-engineer disciplines that purchase them.</p>
<p>When discipline feels like prison, check whether you are confusing comfort with freedom.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Choose constraints that buy freedom of body, craft, and mind.</p>
<h3>Chapter 2: Own everything you can</h3>
<p>Extreme Ownership runs through Jocko’s work: if it is in your world, own your piece. Blame comforts and costs power.</p>
<p>Ownership is not self-hate. It is agency — what can I improve, what do I do next?</p>
<p>Teams with ownership move faster because they skip courtroom theater.</p>
<p>After misses, run short debriefs: facts, causes, fix, owners.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Own responses and fixes — blame spends the power you need.</p>
<h3>Chapter 3: Default: aggressive</h3>
<p>Default aggressive means bias toward action in the mission’s direction — not cruelty. Move toward problems with a plan.</p>
<p>Passivity invites entropy. Early action shrinks fires.</p>
<p>Civilian translation: send the email, start the draft, schedule the hard talk.</p>
<p>Use five-minute timers to force first contact with dread tasks.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Default to disciplined action toward problems.</p>
<h3>Chapter 4: Detach, then decide</h3>
<p>Discipline includes detachment: step back, see the field, then choose. Panic and blind charge both fail.</p>
<p>Breathing and checklists restore detachment under civilian stress.</p>
<p>Leaders must detach so teams get clarity instead of contagion.</p>
<p>Practice on small irritations as reps for large ones.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Step back, see clearly, then act.</p>
<h3>Chapter 5: Daily materials machine</h3>
<p>Sleep, training, nutrition, and deep-work blocks are the machine. Soften them and speeches become theater.</p>
<p>Protect sleep as performance fuel. Train for body and will. Eat for fuel more days than entertainment.</p>
<p>Time-block deep work early; put distractions elsewhere.</p>
<p>If life blows up, shrink the machine but do not zero it.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Guard sleep, training, food, and focus blocks.</p>
<h3>Chapter 6: Do hard things now</h3>
<p>Hard things rarely shrink by waiting. Attack while small.</p>
<p>Anxiety is often unfinished action; completion lowers noise.</p>
<p>Break work into first five minutes — start beats motivation talks.</p>
<p>Keep a done list to prove motion to a brain that forgets.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Attack hard tasks early — waiting inflates them.</p>
<h3>Chapter 7: Adapt when broken</h3>
<p>Constraint is a chance to adapt training, not erase identity.</p>
<p>When one lane blocks, open another that still serves the mission.</p>
<p>Replace excuse stories with constraints plus new plans.</p>
<p>Document adaptations so setbacks become playbooks.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Adapt the work under constraints — keep the training identity.</p>
<h3>Chapter 8: Language and attention</h3>
<p>Clean language programs standards: I will do X at Y. Soft Monday lies erode freedom.</p>
<p>Attention discipline matters; feeds can undo morning wins by noon.</p>
<p>Short orders to self: stand up; open the file; start now.</p>
<p>Silence can be discipline when words would be complaint or ego.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Use clean language and guarded attention.</p>
<h3>Chapter 9: Lead with standards</h3>
<p>Discipline scales through leadership: clear intent, high standards, loyalty to the team.</p>
<p>Micromanagement is fear; abandonment is laziness. Train, trust, inspect.</p>
<p>What you tolerate becomes culture.</p>
<p>Share hard seasons; do not outsource only the grind.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Lead with clear standards and earned trust.</p>
<h3>Chapter 10: Walk toward fear</h3>
<p>Fear shrinks when approached repeatedly with preparation.</p>
<p>Feel fear, follow mission — Jocko’s practical posture.</p>
<p>After-action reviews convert fear into lessons.</p>
<p>Teach juniors that courage is practiced.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Approach fear with prep — courage is trained.</p>
<h3>Chapter 11: Sustain for decades</h3>
<p>Binge discipline fails. Sustainable rituals with deloads keep you free for decades.</p>
<p>Periodize intensity. Include recovery so standards survive.</p>
<p>Speed of return after travel or chaos is the skill.</p>
<p>Measure years, not heroic weekends.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Sustain discipline with rituals and deloads.</p>
<h3>Chapter 12: Build freedom tonight</h3>
<p>Lay out gear, prep food, set alarm, write top three tasks, park the phone away from the bed.</p>
<p>Tomorrow’s freedom is engineered tonight.</p>
<p>Tell a partner your seven-day non-negotiables.</p>
<p>Adjust one variable after a week, not all variables.</p>
<p>Write the idea in one sentence on paper and keep it where decisions happen.</p>
<p>Teach one person the idea this week; teaching exposes gaps and embeds memory.</p>
<p>Review on Sunday: where did you practice this, and where did you negotiate it away?</p>
<p><strong>Lesson:</strong> Prep tonight for tomorrow’s disciplined freedom.</p>
<h3>Application Lab 1: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 2: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 3: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 4: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 5: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 6: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 7: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 8: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 9: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 10: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 11: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 12: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 13: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 14: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Application Lab 15: Discipline Equals Freedom</h3>
<p>Turn Discipline Equals Freedom into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it smaller than ego wants and more consistent than mood wants. Write it on a card you will see morning and night.</p>
<p>Design the environment: tools closer, temptations farther, one ally who asks a non-nagging check-in question. Decide your miss protocol in advance — restart within a day without a shame courtroom. Track friction: time of day, people, stories you used to stall.</p>
<p>Midweek clarify the behavior if it was fuzzy. Vague plans hide avoidance. At week’s end write a half-page memo: what improved, what is still hard, what continues for two more weeks. Underline action lines from one chapter that addresses your biggest miss.</p>
<p>Share one lesson with a teammate without preaching. Stacking weekly labs beats binge inspiration. Put the next lab on your calendar like a meeting with someone you respect — future you.</p>
<p>If energy crashes, shrink the behavior again until it is doable, then rebuild. Identity is the aim: someone who practices what they read. Protect sleep and relationships while you train; broken foundations sabotage every doctrine.</p>
<p><strong>Lesson:</strong> Run weekly yes/no labs with ally support and a short written after-action.</p>

<h3>Deep Practice Block 1: Discipline Equals Freedom</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Discipline Equals Freedom as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>
',
    26,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781250156945-L.jpg',
    'Jocko Willink’s field manual for discipline — ownership, daily standards, and freedom through structure.'
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
  ('What does discipline equals freedom mean?', 'Avoid all constraints', 'Chosen constraints create more real options later', 'Never train', 'Only military people need discipline', 'B', 1),
  ('What is default aggressive here?', 'Cruelty', 'Bias toward mission-focused action on problems', 'No planning', 'Yelling', 'B', 2),
  ('Which daily materials matter most in the book’s ethos?', 'Only social media', 'Sleep, training, nutrition, focused work', 'Skipping sleep forever', 'Ignoring the body', 'B', 3),
  ('How should you treat ownership?', 'Blame first', 'Own responses and fixes to keep power', 'Never debrief', 'Avoid apologies', 'B', 4),
  ('What sustains discipline?', 'One heroic weekend', 'Sustainable rituals, deloads, and fast returns after disruption', 'Endless all-nighters', 'Dropping standards after a win', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
