DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Mountain Is You');
DELETE FROM public.information WHERE title = 'The Mountain Is You';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Mountain Is You',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Self-sabotage is protection</h2>
<ul><li>Many “bad” habits began as ways to stay emotionally safe.</li></ul>
<h2>2. The mountain is internal</h2>
<ul><li>Your biggest barriers are often patterns within you, not only outer circumstances.</li></ul>
<h2>3. Triggers are teachers</h2>
<ul><li>Emotional triggers point to unhealed beliefs and needs.</li></ul>
<h2>4. Identity death and discomfort</h2>
<ul><li>Growth asks you to release old identities and tolerate new discomfort.</li></ul>
<h1>PART 2 — THE MOUNTAIN IS YOU</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Transform self-sabotage</h3>
<p>Brianna Wiest’s The Mountain Is You frames personal growth as climbing an inner mountain: transforming self-sabotage into self-mastery. The title’s claim is that the obstacle is often not only “out there” — it is the pattern within you that recreates familiar struggle.</p>
<p>Wiest writes in a direct, essayistic style aimed at people who know what they should do and somehow still don’t. The book treats that gap not as proof of brokenness but as a solvable psychological puzzle.</p>
<p>The work is both compassionate and demanding: understand why you resist, then take responsibility for building a life that no longer needs the old protection strategies.</p>
<p>Wiest’s mountain metaphor works because external goals keep changing while internal patterns repeat. You can switch cities and jobs and still meet the same self-sabotage wearing new clothes. The climb is pattern-level.</p>
<p>Identity death explains why positive change can feel like grief. You may mourn the chaotic self, the martyred self, the cynical self — even while you know those identities cost you. Allow the grief without returning to the old pattern as comfort.</p>
<p><strong>Lesson:</strong> Treat self-sabotage as a transformable inner mountain, not as proof that you are hopeless.</p>
<h3>Chapter 2: Reframe self-sabotage as protection</h3>
<p>Wiest argues self-sabotage is often not laziness or lack of desire. It is outdated self-protection — a part of you seeking safety from fear, rejection, success, visibility, or change. The habit that blocks you may once have helped you survive.</p>
<p>That reframe matters because shame rarely ends sabotage. If you only attack yourself for procrastinating or choosing unavailable partners, you add pain without removing the protector’s reason for existing.</p>
<p>Ask what the behavior protects you from. Fear of failure? Fear of being seen? Fear of outgrowing your community? Understanding the protector is the first foothold on the mountain.</p>
<p>Seeing sabotage as protection reduces self-hatred and increases curiosity. Protectors formed for reasons — often intelligent reasons in an old context. They become problems when the context changes and the protector keeps driving.</p>
<p>Discomfort intolerance keeps people loyal to familiar misery. The nervous system prefers known pain to unknown peace. Training is deliberate exposure to the good-hard things: consistency, boundaries, receiving care, finishing.</p>
<p><strong>Lesson:</strong> Reframe self-sabotage as an outdated protection strategy — then address what it was trying to keep safe.</p>
<h3>Chapter 3: You are the mountain and the climber</h3>
<p>External problems matter — money, health, unfair systems. Wiest’s emphasis is that the recurring obstacle is frequently an internal pattern: the way you abandon goals when they matter, choose chaos when life is calm, or shrink when opportunity arrives.</p>
<p>Naming the pattern is a foothold. Vague dissatisfaction keeps you circling. Specific recognition — “I sabotage intimacy when it becomes real,” “I quit when I’m finally progressing” — makes change designable.</p>
<p>You are both the mountain and the climber: the pattern and the awareness that can work with it. That dual role is empowering, not blaming.</p>
<p>Specificity is a growth tool. “I ruin my life” is fog. “I pick fights when someone gets close” or “I overwork to avoid feeling lonely” is a map. You can intervene on a map.</p>
<p>Compassion without accountability becomes an excuse loop. Accountability without compassion becomes another abusive inner voice. Wiest’s path uses both: understand the protector, then stop letting it choose.</p>
<p><strong>Lesson:</strong> Name the recurring internal pattern clearly — you cannot climb a mountain you refuse to see.</p>
<h3>Chapter 4: Triggers, needs, and emotional intelligence</h3>
<p>Emotional triggers are not random noise. In Wiest’s framing, they point toward wounds, beliefs, and needs — places where the past is still interpreting the present. A trigger is information if you are willing to study it instead of only reacting from it.</p>
<p>Emotional intelligence here means feeling emotions without being fully ruled by them: observing the story, naming the need, and choosing a response aligned with your future self rather than your fear.</p>
<p>Motivation spikes fade. Building a life requires the capacity to stay present with discomfort long enough to act differently than your trigger demands.</p>
<p>Triggers reveal the unhealed story: I am only loved when useful; success makes me unsafe; rest is laziness; visibility means attack. Emotional intelligence means catching the story mid-activation and choosing a new behavior anyway.</p>
<p>Self-mastery, in this book, is not dominance over feelings. It is integration: feelings welcomed, patterns named, values chosen, actions aligned — climbing the internal mountain one honest step at a time.</p>
<p><strong>Lesson:</strong> Treat triggers as teachers about wounds and needs, and build emotional intelligence to respond rather than only react.</p>
<h3>Chapter 5: Let an old identity die</h3>
<p>Becoming who you want to be can require releasing who you had to be to survive earlier chapters of life. Wiest speaks to identity death: the grief of letting go of roles, coping styles, and self-images that once made sense.</p>
<p>People often sabotage success because success threatens belonging to an old identity — the underdog, the helper who never needs help, the person who stays small to stay safe. Growth can feel like betrayal of a former self.</p>
<p>Honor what the old identity did for you, then stop letting it drive. Gratitude plus release is more effective than pretending you never needed those armor pieces.</p>
<p>Identity death explains why positive change can feel like grief. You may mourn the chaotic self, the martyred self, the cynical self — even while you know those identities cost you. Allow the grief without returning to the old pattern as comfort.</p>
<p>Wiest’s mountain metaphor works because external goals keep changing while internal patterns repeat. You can switch cities and jobs and still meet the same self-sabotage wearing new clothes. The climb is pattern-level.</p>
<p><strong>Lesson:</strong> Allow outdated survival identities to end so a more aligned self can take responsibility for your life.</p>
<h3>Chapter 6: Discomfort is part of the path</h3>
<p>If you only choose comfort, you stay loyal to familiar pain. Growth asks you to tolerate the discomfort of new behavior — boundaries, consistency, rest, ambition — until it becomes home.</p>
<p>Wiest’s compassion does not remove responsibility. Understanding why you sabotage is the beginning; aligned action is the climb. Shame keeps you stuck; clarity plus new behavior moves you.</p>
<p>The mountain is you — which means the path through is also you: honesty, emotional skill, identity renewal, and a willingness to be uncomfortable on purpose for a life that fits.</p>
<p>Discomfort intolerance keeps people loyal to familiar misery. The nervous system prefers known pain to unknown peace. Training is deliberate exposure to the good-hard things: consistency, boundaries, receiving care, finishing.</p>
<p>Seeing sabotage as protection reduces self-hatred and increases curiosity. Protectors formed for reasons — often intelligent reasons in an old context. They become problems when the context changes and the protector keeps driving.</p>
<p><strong>Lesson:</strong> Stop waiting for comfort to arrive first — practice the discomfort that your next life requires.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781949759228-L.jpg',
    'Brianna Wiest on transforming self-sabotage into self-mastery — internal mountains, triggers, emotional intelligence, identity death, and discomfort.'
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
  ('How does Wiest reframe self-sabotage?', 'As proof you are hopeless', 'As often a form of self-protection that outlived its usefulness', 'As purely genetic destiny', 'As something to ignore', 'B', 1),
  ('What is the ''mountain'' in the book’s metaphor?', 'Only other people', 'Primarily internal obstacles and patterns you must climb through', 'A literal hiking guide', 'Your job title', 'B', 2),
  ('What do emotional triggers offer, according to this book’s themes?', 'Random noise only', 'Information about wounds, beliefs, and needs', 'Proof you should never feel', 'A reason to quit growth', 'B', 3),
  ('Why is discomfort important in Wiest’s framing?', 'Pain is the only goal', 'Avoiding discomfort can mean avoiding the life you want', 'Comfort always equals growth', 'Discomfort means you chose wrong forever', 'B', 4),
  ('What attitude does the book favor toward changing sabotage patterns?', 'Pure self-hatred', 'Understanding plus responsibility and new aligned action', 'Blame everyone else', 'Wait for motivation only', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
