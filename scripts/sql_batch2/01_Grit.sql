DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Grit');
DELETE FROM public.information WHERE title = 'Grit';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Grit',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Grit = passion + perseverance</h2>
<ul><li>Talent alone does not predict long-term achievement; sustained interest and effort do.</li></ul>
<h2>2. Effort counts twice</h2>
<ul><li>Talent × effort = skill; skill × effort = achievement.</li></ul>
<h2>3. Four psychological assets</h2>
<ul><li>Interest, practice, purpose, and hope develop grit over time.</li></ul>
<h2>4. Deliberate practice</h2>
<ul><li>Stretch goals, full concentration, feedback, and repetition until mastery.</li></ul>
<h2>5. Grit can grow</h2>
<ul><li>Culture, parenting, and personal habits can raise grit; the Grit Scale measures it.</li></ul>
<h1>PART 2 — GRIT</h1>
<h2>A 22-Minute Read Summary</h2>
<h3>Chapter 1: Why grit beats talent myths</h3>
<p>Angela Duckworth’s Grit (2016) argues that the secret to outstanding achievement is not genius in isolation but grit: passion and perseverance for long-term goals. Duckworth, a psychologist and former teacher, noticed that the students and cadets who succeeded were not always the most naturally gifted — they were the ones who kept going when others quit.</p>
<p>Her research at West Point, in spelling bees, and across workplaces repeatedly found that grit predicted who stayed and who excelled better than IQ or raw talent alone. That finding challenges a culture that worships “naturals.” Duckworth does not deny talent; she denies that talent is enough, or that lack of early ease means you cannot become excellent.</p>
<p>Grit is about consistency of interest and effort over years, not intensity for a week. Passion here means a durable fascination with a domain — not fleeting excitement. Perseverance means finishing what you start, bouncing back from setbacks, and treating failure as information rather than a verdict on identity.</p>
<p>Duckworth’s own career path — consulting, teaching, then psychology — models the book’s thesis. She kept refining a question that mattered to her: why do some people accomplish more with their ability than others? The answer she landed on was grit, measurable and teachable enough to change how schools and organizations think about potential.</p>
<p><strong>Lesson:</strong> Treat long-term passion and perseverance as more predictive of achievement than talent alone.</p>
<h3>Chapter 2: Effort counts twice</h3>
<p>Duckworth’s most memorable formula is: talent × effort = skill; skill × effort = achievement. Effort appears twice. First it turns potential into skill. Then it turns skill into tangible results. Someone with high talent who rarely practices can be outpaced by someone with moderate talent who trains relentlessly and then applies what they learn in the real world.</p>
<p>This reframes how we interpret early struggle. Difficulty learning a skill does not mean you lack a future in that field; it may mean you need more deliberate effort than a peer who starts easier. Conversely, early ease can become a trap if it teaches you that effort is optional.</p>
<p>Duckworth also distinguishes hard work from mere busyness. Effort that counts is directed at improvement and completion of meaningful goals, not frantic activity without a north star. The “twice” in the formula is a reminder: showing up once to learn is not the same as showing up again to perform and ship.</p>
<p>In practical terms, protect practice time and application time equally. Reading about a skill without rehearsing it builds little skill. Rehearsing without putting the skill into challenging use builds little achievement. Gritty people close both loops.</p>
<p><strong>Lesson:</strong> Multiply effort into both skill-building and achievement — talent without sustained effort underperforms.</p>
<h3>Chapter 3: Interest — falling in love with a craft</h3>
<p>Duckworth describes four psychological assets that grow grit: interest, practice, purpose, and hope. Interest comes first. You cannot grit your way through a life that permanently bores you. Passion often begins as a spark of curiosity, then deepens through exploration, not through a single lightning bolt of destiny.</p>
<p>Many people expect to “find their passion” fully formed. Duckworth’s research suggests passion develops: try things, notice what holds attention, then go deeper. Parents and mentors help by encouraging exploration without forcing premature specialization, then supporting deepening once interest sticks.</p>
<p>Interest also needs to survive the boring middle. Early novelty fades; grit requires enough fascination with the domain to keep caring after the honeymoon. That is why Duckworth emphasizes fit — aligning work with what intrinsically engages you — rather than grinding indefinitely against a total mismatch.</p>
<p>Ask: What topics do I return to voluntarily? What problems do I think about after the meeting ends? Those clues point toward interests worth developing into lasting passions.</p>
<p><strong>Lesson:</strong> Build grit on real interest — explore, then deepen, rather than forcing passion on command.</p>
<h3>Chapter 4: Practice — deliberate improvement</h3>
<p>Once interest exists, grit grows through deliberate practice: a focused method of improvement popularized by Anders Ericsson and central to Duckworth’s account. Deliberate practice is not repeating what is already easy. It means setting a stretch goal just beyond current ability, giving full concentration, seeking immediate feedback, and repeating with refinement until the weak spot improves.</p>
<p>Most people practice by going through the motions in their comfort zone. Gritty experts isolate weaknesses. A pianist does not only play favorite pieces; they slow down the hard passage. A salesperson reviews lost deals for patterns. Feedback — from a coach, data, or recording — turns effort into learning instead of empty repetition.</p>
<p>Duckworth notes that deliberate practice can feel effortful and even unpleasant in the moment. That is expected. Grit is partly the willingness to endure that discomfort because you care about the long-term goal. Flow can follow mastery; the practice that builds mastery is often not flow.</p>
<p>Design practice sessions with a single improvement target, a way to measure it, and a short feedback loop. Consistency beats heroic weekend marathons that leave you too drained to return.</p>
<p><strong>Lesson:</strong> Practice deliberately — stretch, concentrate, get feedback, and refine — instead of mindlessly repeating comfort-zone work.</p>
<h3>Chapter 5: Purpose and hope</h3>
<p>Purpose connects your craft to the well-being of others. Duckworth finds that the grittiest people often see their work as meaningful beyond the self — teaching, healing, building, serving a mission. Purpose does not require a saintly career; it requires a “beyond-the-self” purpose statement that makes daily effort feel worthwhile when motivation dips.</p>
<p>Hope, in Duckworth’s framing, is the expectation that your efforts can improve the future. It is related to growth mindset: believing that abilities can be developed. Without hope, setbacks become permanent labels (“I’m not a math person”). With hope, setbacks become problems to solve.</p>
<p>Purpose answers why the goal matters. Hope answers whether you can still get there after failure. Together they sustain perseverance when interest alone is not enough — during plateaus, criticism, or seasons when progress is invisible.</p>
<p>Write a one-sentence purpose that links your daily practice to someone else’s benefit. When you fail, rehearse a hopeful response: What is one controllable next step? Hope is a habit of interpretation, not a mood you wait for.</p>
<p><strong>Lesson:</strong> Anchor grit in purpose beyond yourself and in hopeful, growth-minded responses to setbacks.</p>
<h3>Chapter 6: The Grit Scale and growing grit</h3>
<p>Duckworth developed the Grit Scale — brief self-report items about consistency of interests and perseverance of effort. Higher scores correlated with retention and achievement in demanding settings. She is careful: self-report has limits, and grit is not the only virtue. Still, the scale makes an abstract trait discussable and trackable.</p>
<p>Grit can grow. Duckworth discusses “growing grit from the inside out” (interest, practice, purpose, hope) and “from the outside in” through culture — teams, families, and organizations that normalize hard things done together. A grit culture celebrates finishing, learning from failure, and long-term commitment rather than only celebrating innate brilliance.</p>
<p>Parenting for grit balances support and challenge: high warmth, high expectations. Overprotection can shrink perseverance; harshness without support can crush interest. Mentors matter: someone who models sticking with hard goals makes grit socially contagious.</p>
<p>Grit is not stubbornness at all costs. Duckworth distinguishes grit from foolish persistence in the wrong aim. Sometimes quitting a dead path frees energy for a better long-term goal. The test is whether you are abandoning a worthy commitment out of discomfort — or wisely redirecting passion.</p>
<p><strong>Lesson:</strong> Measure and cultivate grit through habits and culture — and aim perseverance at goals that still deserve it.</p>
<h3>Chapter 7: Becoming a gritty person</h3>
<p>Taken together, Grit offers a developmental path: discover and deepen interest, practice like an expert, connect work to purpose, and keep hope alive when results lag. Duckworth’s message is democratizing. You do not need to be the prodigy in the room; you need a clear long-term aim and the daily willingness to improve toward it.</p>
<p>Start by naming a multi-year goal that truly interests you. Protect deliberate practice on the calendar. Find a purpose link and a community that values finishing hard things. When you want to quit, ask whether the quit is strategic or merely escape from temporary frustration.</p>
<p>Grit is built in ordinary Tuesdays — another rehearsal, another draft, another attempt after rejection. Over years, those Tuesdays become the difference between potential and achievement.</p>
<p><strong>Lesson:</strong> Grow grit on purpose: long-term aim, deliberate practice, purpose, hope, and a culture that finishes what it starts.</p>',
    22,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781501111105-L.jpg',
    'Angela Duckworth’s research on grit: passion plus perseverance, effort counting twice, and the four psychological assets that build staying power.'
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
  ('What is Duckworth’s definition of grit?', 'Talent plus luck', 'Passion plus perseverance for long-term goals', 'Working only when inspired', 'Avoiding hard tasks', 'B', 1),
  ('In Duckworth’s formula, why does effort ''count twice''?', 'Effort is irrelevant to skill', 'Talent × effort = skill, and skill × effort = achievement', 'Effort only builds talent', 'Effort replaces purpose', 'B', 2),
  ('Which four psychological assets does Duckworth link to growing grit?', 'Fame, money, status, ease', 'Interest, practice, purpose, and hope', 'Speed, charisma, luck, networking', 'Rest, avoidance, comfort, praise', 'B', 3),
  ('What characterizes deliberate practice?', 'Only repeating easy skills for fun', 'Stretch goals, concentration, feedback, and refinement', 'Multitasking while practicing', 'Avoiding all feedback', 'B', 4),
  ('What does the Grit Scale primarily measure?', 'IQ score', 'Consistency of interests and perseverance of effort', 'Physical strength', 'Short-term mood', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
