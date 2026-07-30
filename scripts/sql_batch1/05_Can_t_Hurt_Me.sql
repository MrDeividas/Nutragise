DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Can''t Hurt Me');
DELETE FROM public.information WHERE title = 'Can''t Hurt Me';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Can''t Hurt Me',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Callous the mind</h2>
<ul><li>Deliberate hard work builds mental calluses.</li></ul>
<h2>2. Accountability Mirror</h2>
<ul><li>Radical honesty about gaps between standards and behavior.</li></ul>
<h2>3. Taking souls and the Cookie Jar</h2>
<ul><li>Compete with relentless effort; use past victories as fuel.</li></ul>
<h2>4. The 40% Rule</h2>
<ul><li>When your mind says you’re done, you may still have far more capacity left.</li></ul>
<h1>PART 2 — CAN’T HURT ME</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Master your mind</h3>
<p>Can''t Hurt Me by David Goggins is a memoir and toughness manual about transforming limits through honest work and voluntary hardship. Goggins tells a story of a brutal childhood, obesity, racism, and repeated failure — then of becoming a Navy SEAL, ultra-endurance athlete, and advocate for mental callousing.</p>
<p>The book’s thesis is blunt: most people live far below their potential because the mind negotiates for comfort. Goggins’ method is to stop lying to yourself, embrace suffering as training, and build proof that you can endure more than your first quitting voice allows.</p>
<p>This is not a gentle wellness book. It is a challenge to invent a harder standard — while still recognizing that real injuries and medical limits exist. The training target is the mental governor, not reckless self-destruction.</p>
<p>Goggins’ story is extreme on purpose: he uses autobiography as proof that identity can be rebuilt through suffering chosen and suffering endured. The reader is not asked to copy every feat, but to stop negotiating so early with discomfort.</p>
<p>The Cookie Jar works because memory is biased toward the present crisis. Under fatigue, you forget every prior impossible thing you already did. Deliberately recalling those moments restores evidence-based confidence.</p>
<p><strong>Lesson:</strong> Accept that most people underuse their capability — then train the mind to stop quitting at the first wall.</p>
<h3>Chapter 2: Face the truth and the Accountability Mirror</h3>
<p>Growth starts with reality. Goggins describes inventorying what you are actually doing — not what you intend someday. Excuses, half-efforts, and flattering stories are treated as enemies of progress.</p>
<p>The Accountability Mirror is his radical-honesty practice: confronting himself with goals and hard truths, often literally on a mirror with sticky notes. The point is ownership of the gap between standards and behavior. No audience, no branding — just you and the truth.</p>
<p>Without that confrontation, motivation stays theatrical. With it, every day has a scoreboard you cannot spin. The mirror does not hate you; it refuses to let you hide.</p>
<p>Facing the truth includes inventorying victim stories you still recycle. Goggins does not deny that real injustice and trauma happened; he denies that those facts must permanently cap your effort. Ownership is how he reclaims agency.</p>
<p>The 40% Rule should be handled with maturity: it targets the mental governor that protects comfort, not chest pain, fractures, or medical emergencies. The training question is “Is this discomfort or danger?” — then act accordingly.</p>
<p><strong>Lesson:</strong> Practice daily radical honesty about the gap between your standards and your actual behavior.</p>
<h3>Chapter 3: Taking souls — obstacles as fuel</h3>
<p>“Taking souls” is Goggins’ competitive mindset: when others expect you to fold, you answer with effort so relentless it unsettles them — and forges your own identity. Doubt, disrespect, and pain become fuel rather than verdicts.</p>
<p>The deeper idea is conversion: obstacles are not only barriers; they are raw material for transformation if you refuse to let them write your limits. Goggins’ life stories — failed attempts, Hell Week, ultra races — illustrate choosing to run toward the hard thing.</p>
<p>You do not need a rival in the room to use the principle. Any voice that says “people like you don’t finish” can become a reason to finish with interest.</p>
<p>The Accountability Mirror is ruthless kindness: it removes the audience and the excuses. Written goals stuck to a mirror turn mornings into confrontations with reality. Either you move the needle or you see, plainly, that you did not.</p>
<p>Callousing the mind is a daily practice, not a weekend retreat. Cold showers, extra study, honest training, difficult conversations — repeated friction teaches your nervous system that hard is survivable.</p>
<p><strong>Lesson:</strong> Turn doubt, disrespect, and difficulty into fuel for effort that rewrites what you believe you can do.</p>
<h3>Chapter 4: The Cookie Jar</h3>
<p>When suffering spikes, Goggins reaches into a mental “Cookie Jar” — a stockpile of past victories, survived hardships, and proof that he has been here before and continued. Each remembered win is a cookie: fuel for the next hard mile.</p>
<p>The Cookie Jar is not empty positivity. It is evidence. Your brain, under stress, forgets your résumé of resilience. Deliberately recalling it restores perspective: this pain is familiar; quitting is optional; you have receipts.</p>
<p>Building the jar requires collecting moments intentionally — races finished, nights studied, temptations refused — so that when the mind panics, you have more than slogans to answer with.</p>
<p>Taking souls is competitive theater with a private purpose. The point is not cruelty; it is forging an unbreakable standard when others expect collapse. Effort becomes identity formation under pressure.</p>
<p>Goggins’ final challenge is unromantic: most people know what to do. They lack a self they can trust to do it when it sucks. Build that trust with receipts — small and large — until the quitting voice loses authority.</p>
<p><strong>Lesson:</strong> Stock a mental Cookie Jar of past victories and hardships survived — then use it when suffering spikes.</p>
<h3>Chapter 5: The 40% Rule</h3>
<p>The 40% Rule is Goggins’ claim that when your mind first screams you are finished, you may only be around 40% of your capacity. The mind’s job includes protecting comfort; it throws a governor on effort long before the body is truly done.</p>
<p>Training, then, is learning to recognize that first wall as a mental negotiation, not an absolute limit — while still respecting genuine medical red flags. The skill is pushing past the false finish line into unused capacity.</p>
<p>This idea is dangerous if misread as “ignore all pain.” Used well, it is a challenge to curiosity: What if the voice that says stop is early? What if another gear exists?</p>
<p>The Cookie Jar works because memory is biased toward the present crisis. Under fatigue, you forget every prior impossible thing you already did. Deliberately recalling those moments restores evidence-based confidence.</p>
<p>Goggins’ story is extreme on purpose: he uses autobiography as proof that identity can be rebuilt through suffering chosen and suffering endured. The reader is not asked to copy every feat, but to stop negotiating so early with discomfort.</p>
<p><strong>Lesson:</strong> When your mind says you’re done, test whether substantial capacity remains — without ignoring real physical danger.</p>
<h3>Chapter 6: Callousing the mind daily</h3>
<p>Callousing the mind means strengthening toughness by repeatedly doing hard things until discomfort becomes familiar. Like skin on the hands, mental calluses form through friction — cold mornings, extra reps, honest work when no one is watching.</p>
<p>Goggins argues that without voluntary hardship, life’s involuntary hardship will find you unprepared. Daily discipline is inoculation. You choose the hard thing on purpose so you are not owned by the hard thing when it arrives uninvited.</p>
<p>Can''t Hurt Me’s final demand is consistency: tell yourself the truth, collect proof, take souls when challenged, open the Cookie Jar under pressure, push past the 40% wall, and callous the mind again tomorrow.</p>
<p>The 40% Rule should be handled with maturity: it targets the mental governor that protects comfort, not chest pain, fractures, or medical emergencies. The training question is “Is this discomfort or danger?” — then act accordingly.</p>
<p>Facing the truth includes inventorying victim stories you still recycle. Goggins does not deny that real injustice and trauma happened; he denies that those facts must permanently cap your effort. Ownership is how he reclaims agency.</p>
<p><strong>Lesson:</strong> Strengthen mental toughness by voluntarily choosing hard things until discomfort becomes familiar.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/1544512287-L.jpg',
    'David Goggins’ memoir of mental toughness — the Accountability Mirror, Taking Souls, Cookie Jar, 40% Rule, and callousing the mind.'
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
  ('What is the Accountability Mirror?', 'A compliment journal only', 'A daily radical-honesty practice facing your real gaps and goals', 'A fitness app', 'Ignoring feedback', 'B', 1),
  ('What is the Cookie Jar for Goggins?', 'A diet plan', 'A mental stockpile of past victories and survived hardships', 'A savings account', 'A list of excuses', 'B', 2),
  ('What does the 40% Rule claim?', 'You should only ever use 40% effort', 'When your mind says you’re done, you may still have substantial capacity left', 'Sleep is unnecessary', 'Talent is 40% genetics only', 'B', 3),
  ('What does ''callous the mind'' mean in this book?', 'Avoid all discomfort', 'Strengthen mental toughness by repeatedly doing hard things', 'Never set goals', 'Only visualize success', 'B', 4),
  ('What does Goggins argue about most people’s capability usage?', 'They always operate at 100%', 'They often live far below their potential', 'They should never train', 'Limits are purely genetic and fixed', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
