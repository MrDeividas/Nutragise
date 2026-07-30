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

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Compound Effect');
DELETE FROM public.information WHERE title = 'The Compound Effect';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Compound Effect',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Small choices compound</h2>
<ul><li>Tiny daily decisions create huge long-term differences.</li></ul>
<h2>2. Habits run your life</h2>
<ul><li>Track, replace, and design routines that serve your goals.</li></ul>
<h2>3. Momentum is everything</h2>
<ul><li>Consistency creates Big Mo — protect the streak.</li></ul>
<h2>4. Influences shape choices</h2>
<ul><li>Input, associations, and environment either lift or drain you.</li></ul>
<h2>5. Acceleration</h2>
<ul><li>When results appear, push harder — that is when compounding explodes.</li></ul>
<h1>PART 2 — THE COMPOUND EFFECT</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: The compound effect in action</h3>
<p>Darren Hardy’s The Compound Effect (2010) is a practical manifesto for personal success built on one idea: small, smart choices + consistency + time = radical difference. Hardy, long associated with SUCCESS magazine, writes as an operator rather than a theorist. His claim is that you do not need a miracle; you need a better average day, repeated.</p>
<p>He illustrates compounding with simple contrasts: three people start similar; one makes slightly better daily choices about food, learning, and relationships; another stays average; a third drifts slightly worse. Early on, the graphs look almost flat. Later, they diverge dramatically. That lag is why people quit good habits too soon and tolerate bad ones too long.</p>
<p>The compound effect also works in reverse. A cookie, a skipped workout, a ignored conversation — each seems harmless. Stacked for years, they become health crises, skill gaps, and broken trust. Hardy’s invitation is ruthless honesty about the trajectory of your current defaults.</p>
<p>You are always compounding something. The only question is whether today’s micro-choices point toward the life you say you want.</p>
<p><strong>Lesson:</strong> Respect the lag — small daily choices, sustained over time, create outsized outcomes.</p>
<h3>Chapter 2: Choices — own every input</h3>
<p>Hardy insists that every choice matters, including the ones you make on autopilot. Responsibility is the gateway: if you blame luck, bosses, or genetics for everything, you forfeit the steering wheel. Owning choices does not mean denying hardship; it means reclaiming the next decision.</p>
<p>He urges readers to become conscious of “choice points” — the moments where a better micro-decision is available. Put the phone in another room. Prepare breakfast the night before. Send the follow-up email. These are not glamorous, which is why they work: competitors ignore them.</p>
<p>Tracking is Hardy’s antidote to self-deception. When you measure spending, calories, or hours on deep work, patterns appear that memory softens. Awareness alone often improves behavior because invisible leaks become visible.</p>
<p>List the five daily choices that most affect your main goal. Track them for two weeks without trying to be perfect. Let the data confront the story you tell yourself.</p>
<p><strong>Lesson:</strong> Own and track your daily choices — what gets measured stops compounding in the dark.</p>
<h3>Chapter 3: Habits — install the compounding machine</h3>
<p>Habits are the compound effect on autopilot. Hardy argues that you do not rise to goals; you sink to routines. So the work is to identify keystone habits that cascade (exercise that improves sleep and mood; reading that improves decisions) and to replace toxic habits with incompatible better ones.</p>
<p>He recommends starting with manageable changes you can sustain — not a total life overhaul that collapses in ten days. Pair new habits with existing triggers. Design your environment so the good habit is easier than the bad one. Celebrate streaks carefully: the goal is identity as someone who shows up, not a fragile streak that shames you when broken.</p>
<p>Hardy also warns about “the rhythm of success.” When life gets busy, habits are the first casualty — exactly when you need them most. Protect core routines as non-negotiable infrastructure.</p>
<p>Pick one habit to install and one to eliminate this month. Make the new habit smaller than your ego wants, and the old habit harder to access than your willpower can fight.</p>
<p><strong>Lesson:</strong> Engineer habits that automatically compound the right behaviors every day.</p>
<h3>Chapter 4: Momentum — Big Mo</h3>
<p>Hardy’s “Big Mo” (momentum) is the payoff of consistency. Starting is hard; continuing gets easier as identity, skill, and results begin to reinforce each other. Like a merry-go-round, the first push takes the most force; once spinning, smaller pushes keep it going — and stopping feels costly.</p>
<p>This is why Hardy obsesses over not breaking the chain. Misses are expensive not only for the lost day but for the restart cost. Momentum also explains overnight-success illusions: observers see the spike after years of invisible spins.</p>
<p>Protect momentum with routines that survive travel, stress, and boredom. Have a “minimum viable day” version of your key habits so chaos cannot fully erase the streak. When you do break momentum, restart immediately — the compound effect forgives quick recovery better than long absences.</p>
<p>Ask before quitting a good practice: Am I bored, or am I done? Boredom often arrives right before momentum becomes visible.</p>
<p><strong>Lesson:</strong> Guard consistency — momentum multiplies effort once the flywheel is turning.</p>
<h3>Chapter 5: Influences — input, associations, environment</h3>
<p>Hardy breaks influences into three buckets: what you feed your mind, who you associate with, and the environments you inhabit. Garbage input compounds into garbage thinking. Optimistic, growth-oriented input compounds into better decisions.</p>
<p>Associations matter because standards are contagious. If your circle normalizes mediocrity, excellence feels weird. If your circle normalizes learning and follow-through, quitting early feels weird. Hardy is blunt: you may need to upgrade mentors, limit draining relationships, and seek peer pressure that pulls you up.</p>
<p>Environment is the silent architect of choice. A kitchen full of junk food, a desk with endless notifications, a commute that only plays outrage — these are not neutral. Design spaces and defaults that make the compound effect work for you.</p>
<p>Audit your week: media diet, five people you spend most time with, and the rooms where you make key choices. Change one influence in each category.</p>
<p><strong>Lesson:</strong> Curate inputs, associations, and environments — they compound your character whether you notice or not.</p>
<h3>Chapter 6: Acceleration — multiply when it matters</h3>
<p>When compounding finally shows results, Hardy says most people relax. That is the wrong move. Acceleration means adding new disciplines, raising standards, and pushing harder once the foundation exists — because incremental effort on a spinning flywheel creates disproportionate gains.</p>
<p>Acceleration is not frantic hustle from day one; it is earned intensity. After habits and momentum are established, add a stretch goal, a new skill layer, or a bolder ask. Hardy’s point is competitive: while others celebrate early wins by coasting, you reinvest.</p>
<p>The Compound Effect’s closing challenge is simple and severe. Your life is the sum of compounding choices. Choose on purpose, habitize the best ones, protect momentum, upgrade influences, and accelerate when the curve bends upward.</p>
<p>Hardy’s pragmatism is the book’s charm: fewer theories, more tracking sheets and streak protection. If you only remember one move, make it this — improve your average day by a little, then refuse to interrupt the streak. Time will do the dramatic work you cannot force in a weekend.</p>
<p><strong>Lesson:</strong> When results finally appear, accelerate — that is when compounding rewards extra effort most.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780981951249-L.jpg',
    'Darren Hardy on how small, smart choices compound into massive results — habits, momentum, influences, and acceleration.'
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
  ('What is the core idea of The Compound Effect?', 'One big breakthrough fixes everything', 'Small smart choices + consistency + time create massive results', 'Only talent matters', 'Avoid tracking anything', 'B', 1),
  ('Why does Hardy emphasize tracking choices?', 'To shame yourself daily', 'To reveal patterns self-deception hides', 'Because measurement replaces action', 'To impress others', 'B', 2),
  ('What is ''Big Mo'' in Hardy’s framework?', 'A financial product', 'Momentum created by consistent action', 'A type of mentor', 'A diet plan', 'B', 3),
  ('Which three influence categories does Hardy highlight?', 'Luck, weather, astrology', 'Input, associations, and environment', 'Titles, salaries, awards', 'Vacations, hobbies, naps', 'B', 4),
  ('When does Hardy say you should accelerate?', 'Before building any habits', 'When results appear and the flywheel is already turning', 'Only after retirement', 'Never — coast instead', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Four Agreements');
DELETE FROM public.information WHERE title = 'The Four Agreements';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Four Agreements',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Be impeccable with your word</h2>
<ul><li>Speak with integrity; words can create or destroy.</li></ul>
<h2>2. Don’t take anything personally</h2>
<ul><li>Others’ actions reflect them, not your worth.</li></ul>
<h2>3. Don’t make assumptions</h2>
<ul><li>Ask questions; unclear stories breed suffering.</li></ul>
<h2>4. Always do your best</h2>
<ul><li>Your best changes daily — sincerity over perfection.</li></ul>
<h1>PART 2 — THE FOUR AGREEMENTS</h1>
<h2>A 18-Minute Read Summary</h2>
<h3>Chapter 1: Domestication and the dream of the planet</h3>
<p>Don Miguel Ruiz’s The Four Agreements (1997) presents a compact spiritual-practical code drawn from Toltec wisdom traditions. Ruiz’s framing is that we are “domesticated” from childhood into a shared dream of rules, judgments, and fear-based agreements — about who we must be to be loved, safe, or acceptable.</p>
<p>That domestication creates an inner Judge and a Victim: one punishing, one suffering. We learn to punish ourselves with the same critical voice that once came from outside. Freedom, for Ruiz, begins when we notice these unconscious agreements and replace them with four new ones chosen deliberately.</p>
<p>The book is short by design. Its power is not encyclopedic theory but memorable vows you can practice in ordinary conversations, conflicts, and self-talk. Each agreement interrupts a common source of needless suffering.</p>
<p>Read it as a behavioral ethic for emotional hygiene: cleaner speech, less personalization, fewer invented stories, and sincere effort without self-cruelty.</p>
<p><strong>Lesson:</strong> Notice inherited fear-based agreements, then replace them with four deliberate vows.</p>
<h3>Chapter 2: Agreement 1 — Be impeccable with your word</h3>
<p>Impeccability with the word means speaking with integrity — saying only what you mean, avoiding using words to gossip about yourself or others, and using speech toward truth and love rather than poison. Ruiz treats the word as creative force: what you repeatedly say shapes belief and reality for you and for those who hear you.</p>
<p>Gossip is a primary target. Spreading rumors or tearing others down is black magic in Ruiz’s metaphor — spell-casting that harms. Equally important is self-talk. Calling yourself stupid, worthless, or doomed is still using the word against life. Impeccability starts in the private monologue.</p>
<p>This agreement is not about never being angry or never delivering hard feedback. It is about refusing to weaponize language carelessly. Clarity, honesty, and kindness can coexist with firmness. The standard is: Does this speech create more truth and dignity, or more fog and harm?</p>
<p>Before speaking (or posting), pause: Is it true? Is it necessary? Is it kind? If you must correct, aim at the behavior and the shared goal, not at the person’s identity.</p>
<p><strong>Lesson:</strong> Use your word to create truth and dignity — stop gossip and self-poisoning speech.</p>
<h3>Chapter 3: Agreement 2 — Don’t take anything personally</h3>
<p>Nothing others do is because of you, Ruiz argues — it is because of themselves. Their opinions, insults, and even praise are filtered through their own agreements, wounds, and moods. Taking everything personally makes you easy to manipulate: anyone can hook your emotions with a comment.</p>
<p>This does not mean ignoring feedback or living without boundaries. It means separating useful information from identity attack. If someone is cruel, that reveals their state more than your worth. If someone praises you, enjoy it without becoming addicted to external validation.</p>
<p>Personalization is exhausting because it makes you responsible for other people’s inner weather. Immunity to needless personalization creates peace — and paradoxically makes you freer to respond wisely rather than react defensively.</p>
<p>When criticized, ask two questions: Is there a factual lesson I can use? And can I leave their emotional charge with them? Learn the lesson; decline the shame that is not yours.</p>
<p><strong>Lesson:</strong> Refuse to absorb others’ actions as a verdict on your worth — respond to facts, not hooks.</p>
<h3>Chapter 4: Agreement 3 — Don’t make assumptions</h3>
<p>We suffer when we invent stories about what others think, feel, or intend — then treat those stories as facts. Ruiz says the fix is courageously asking questions and communicating clearly what you want. Assumptions thrive in silence and collapse in honest dialogue.</p>
<p>Assumptions show up in relationships (“They didn’t text, so they don’t care”), at work (“They skipped my idea, so I’m finished”), and in self-judgment (“I failed once, so I’m a failure”). Each leap fills uncertainty with fear-shaped fiction.</p>
<p>Clear asking feels vulnerable. People fear looking needy or foolish. Ruiz’s point is that the cost of not asking — years of resentment based on invented plots — is far higher. Say what you mean. Ask what they mean. Confirm agreements out loud.</p>
<p>Replace “I know why they did that” with “I don’t know — I should ask.” Make curiosity your default under ambiguity.</p>
<p><strong>Lesson:</strong> Ask and clarify instead of writing private fiction about other people’s motives.</p>
<h3>Chapter 5: Agreement 4 — Always do your best</h3>
<p>Your best changes from moment to moment — sick versus healthy, rested versus depleted. Ruiz’s fourth agreement is to do your best under current conditions, no more and no less. That sincerity prevents the guilt of under-trying and the self-abuse of perfectionism.</p>
<p>Doing your best is how you make the first three agreements livable. You will break them; everyone does. When you do your best, you learn without condemning yourself as irredeemable. Action replaces endless self-judgment. Regret shrinks because you know you showed up as fully as you could that day.</p>
<p>Perfectionism pretends there is one best forever. Ruiz’s best is adaptive: today’s best may be a quiet recovery day; tomorrow’s may be courageous confrontation. The vow is presence and sincerity, not identical output.</p>
<p>After a hard day, ask: Did I do my best with what I had? If yes, rest without prosecution. If no, adjust tomorrow without identity collapse.</p>
<p><strong>Lesson:</strong> Do today’s best — variable, sincere effort — then release shame and perfection theater.</p>
<h3>Chapter 6: Living the agreements</h3>
<p>The Four Agreements work as a set. Impeccable speech reduces the harm you put into the world. Not taking things personally reduces the harm you absorb. Not making assumptions reduces the harm you invent. Doing your best keeps you in practice without spiritual perfectionism.</p>
<p>Ruiz acknowledges that breaking free of old domestication takes repetition. You will gossip, personalize, assume, and half-try. The path is returning to the agreements faster each time — a new habit of freedom rather than a single awakening.</p>
<p>Used well, the book becomes a pocket ethics for emotional adulthood: cleaner words, sturdier boundaries of meaning, clearer questions, and compassionate effort.</p>
<p>A practical weekly review helps: Where did my word create harm? Where did I take bait personally? Where did I invent a story instead of asking? Where did I half-try and then prosecute myself? Each question points back to one agreement. Improvement is measured by faster recovery, not by never slipping.</p>
<p>Couples, teams, and families can adopt the agreements as shared norms. When everyone commits to clarity over assumption and dignity over gossip, conflict becomes cleaner. The agreements are personal vows first — and cultural upgrades second.</p>
<p><strong>Lesson:</strong> Practice all four agreements together, returning quickly when you break them.</p>',
    18,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg',
    'Don Miguel Ruiz’s Toltec-inspired code: be impeccable with your word, don’t take anything personally, don’t make assumptions, and always do your best.'
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
  ('What is the first agreement?', 'Always be right', 'Be impeccable with your word', 'Never speak', 'Win every argument', 'B', 1),
  ('What does ''don’t take anything personally'' mean?', 'Ignore all feedback forever', 'Others’ actions reflect them more than your worth', 'Never set boundaries', 'Agree with every insult', 'B', 2),
  ('How does Ruiz suggest you avoid assumptions?', 'Mind-read better', 'Ask questions and communicate clearly', 'Assume the worst always', 'Stay silent for years', 'B', 3),
  ('What is true of ''always do your best''?', 'Your best is identical every day', 'Your best changes with circumstances; sincerity matters', 'Only perfection counts', 'Best means outworking everyone', 'B', 4),
  ('In Ruiz’s framing, what does childhood ''domestication'' create?', 'Only practical skills', 'Unconscious fear-based agreements and inner judgment', 'Permanent freedom', 'Guaranteed success', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Ikigai');
DELETE FROM public.information WHERE title = 'Ikigai';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Ikigai',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Ikigai — reason for being</h2>
<ul><li>Where what you love, what you are good at, what the world needs, and what you can be paid for may overlap.</li></ul>
<h2>2. Longevity habits</h2>
<ul><li>Movement, community, diet, and mindset from Okinawa and beyond.</li></ul>
<h2>3. Flow and anti-stress</h2>
<ul><li>Absorbing activity protects mind and body.</li></ul>
<h2>4. Little things, lasting purpose</h2>
<ul><li>Ikigai is often found in daily rituals, not only grand careers.</li></ul>
<h2>5. Ten rules of ikigai</h2>
<ul><li>Practical maxims for a long, meaningful life.</li></ul>
<h1>PART 2 — IKIGAI</h1>
<h2>A 19-Minute Read Summary</h2>
<h3>Chapter 1: What is ikigai?</h3>
<p>Ikigai (2016) by Héctor García and Francesc Miralles popularizes a Japanese concept often translated as “a reason for being” — the sense that life is worth getting up for. The authors weave reporting from Okinawa, one of the world’s longevity blue zones, with psychology on flow, resilience, and purpose.</p>
<p>A widely shared diagram places ikigai at the intersection of what you love, what you are good at, what the world needs, and what you can be paid for. The book treats that diagram as a helpful prompt, not a bureaucratic form you must complete perfectly. Many people’s ikigai is quieter than a dream job title: gardening, teaching a grandchild, crafting, hosting, repairing.</p>
<p>The emotional core is morning motivation. When you have ikigai, effort feels connected to meaning. When you lack it, even comfortable days can feel empty. The authors invite readers to hunt for purpose in both vocation and small daily joys.</p>
<p>Ask what would make you excited to wake up this week — not someday. Ikigai often reveals itself in miniature before it appears as a life plan.</p>
<p><strong>Lesson:</strong> Seek a reason for being in the overlap of love, skill, contribution, and sustainability — including small daily joys.</p>
<h3>Chapter 2: Lessons from longevity cultures</h3>
<p>Drawing on Okinawan life, the authors highlight patterns associated with long, healthy years: gentle daily movement rather than sporadic extreme exercise; social connection and mutual support (moai — close-knit friend groups); a sense of community responsibility; and eating until mostly full (hara hachi bu — roughly 80% full) with a vegetable-forward, modest diet.</p>
<p>They also stress an anti-retirement mindset. Many elders continue purposeful activity — gardening, crafts, mentoring — because stopping all contribution can erode identity and vitality. Movement is woven into life (walking, standing, tending) rather than quarantined to a gym hour that can be skipped.</p>
<p>Longevity here is not a supplement stack. It is a lifestyle ecology: body in motion, stomach not stuffed, heart attached to people, mind attached to a reason to show up.</p>
<p>Borrow one longevity habit this month: a daily walk, an 80% rule at meals, or a recurring social ritual with people who know you.</p>
<p><strong>Lesson:</strong> Longevity grows from daily movement, community, modest eating, and continued purpose — not from retirement into emptiness.</p>
<h3>Chapter 3: Flow — the absorbing present</h3>
<p>The authors connect ikigai to Mihaly Csikszentmihalyi’s flow: the state of complete absorption where challenge and skill balance, time distorts, and self-consciousness fades. Flow activities — craft, sport, deep conversation, creative work — are both enjoyable and restorative compared with anxious rumination or empty scrolling.</p>
<p>Finding flow regularly is a practical path toward ikigai because it reveals what engages you at a neurological level. If you never enter absorption, your days may be filled yet unfulfilling. If you know which activities produce flow, you have clues to protect and expand.</p>
<p>Stress is framed as a longevity enemy when chronic. Flow, friendship, gentle movement, and meaningful work act as antidotes. The book’s tone is gentle: you do not need to optimize every hour; you need more hours that feel alive.</p>
<p>Schedule one flow-prone activity before the week fills with only obligations. Treat absorption as health infrastructure.</p>
<p><strong>Lesson:</strong> Seek regular flow states — they reveal and reinforce what makes life feel worth living.</p>
<h3>Chapter 4: Falling in love with life’s details</h3>
<p>García and Miralles emphasize that ikigai is often discovered in details: a morning tea ritual, tending plants, a neighborhood greeting, a craft practiced without applause. Western career culture can over-index on grand purpose statements and under-index on micro-joys that stabilize a life.</p>
<p>Resilience appears through accepting that life includes struggle while still choosing engagement. The authors discuss logotherapy-adjacent ideas — meaning as a stabilizer — and the importance of staying curious. An active mind exploring new skills in older age correlates with vitality.</p>
<p>This chapter’s quiet challenge: stop postponing joy until the “real” life begins. Ikigai is practiced in today’s ordinary scene, or it remains a poster on the wall.</p>
<p>Name three small rituals that already give you energy. Protect them like appointments. Expand one by 10% rather than inventing a brand-new identity overnight.</p>
<p><strong>Lesson:</strong> Build ikigai from treasured daily details and continued curiosity, not only from a dramatic career reinvention.</p>
<h3>Chapter 5: The ten rules of ikigai</h3>
<p>The book crystallizes guidance into ten rules commonly summarized as: stay active and don’t retire; take it slow; don’t fill your stomach; surround yourself with good friends; get in shape for your next birthday; smile; reconnect with nature; give thanks; live in the moment; and follow your ikigai.</p>
<p>Taken together, the rules are anti-hurry, anti-isolation, and anti-excess. They favor presence over hustle theater, gratitude over entitlement, and embodied life over purely digital existence. None require wealth; all require attention.</p>
<p>The “don’t retire” rule is often misunderstood. It does not mean grind forever in a toxic job. It means do not abandon all purposeful roles. Reinvent contribution if you leave a career — mentoring, volunteering, making, caring.</p>
<p>Pick two rules you currently violate most often. Practice them for thirty days as an experiment in felt energy, not as moral perfection.</p>
<p><strong>Lesson:</strong> Use the ten rules as a simple longevity-and-meaning checklist — active, social, moderate, grateful, present.</p>
<h3>Chapter 6: Finding your ikigai in practice</h3>
<p>Practically, start with questions: What do I love enough to do without applause? What am I skilled at that others value? What needs can I serve? What can sustain me materially? Where the answers overlap, explore. Where they do not, look for bridges — side projects, volunteering, skill-building — rather than demanding instant total alignment.</p>
<p>Ikigai is less a one-time discovery than a relationship you maintain. Seasons change; roles change; the reason for getting up may evolve. The authors’ gift is permission to treat meaning as ordinary, daily, and bodily — not only as a LinkedIn headline.</p>
<p>Leave the book with a small portfolio: one movement habit, one social anchor, one flow activity, one service, one gratitude practice. That portfolio is a living ikigai starter kit.</p>
<p>Ikigai is also a lens for midlife resets and retirement anxiety. Instead of asking only “What is my job?”, ask “What makes this week worth inhabiting?” The answer may be quieter than a brand, and more durable. Purpose that fits in an ordinary morning is purpose you can keep.</p>
<p><strong>Lesson:</strong> Assemble ikigai from love, skill, service, and sustainability — then keep adjusting as life seasons change.</p>',
    19,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg',
    'García and Miralles on the Japanese idea of ikigai — a reason for being — and habits linked to longevity, flow, and joyful purpose.'
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
  ('What does ikigai roughly mean?', 'A strict diet only', 'A reason for being / reason to get up', 'A type of martial art', 'A financial product', 'B', 1),
  ('What eating principle is associated with Okinawan longevity in the book?', 'Eat until painfully full', 'Hara hachi bu — stop around 80% full', 'Skip all vegetables', 'Only eat once a week', 'B', 2),
  ('How is flow related to ikigai?', 'Flow means constant stress', 'Absorbing challenge-skill balance reveals and fuels meaningful engagement', 'Flow requires doing nothing', 'Flow is only for athletes', 'B', 3),
  ('What do the authors suggest about retirement?', 'Stop all activity immediately', 'Stay active with purpose rather than abandoning contribution', 'Never leave a job', 'Purpose only exists at work', 'B', 4),
  ('Which is one of the ten rules of ikigai?', 'Fill every minute with hustle', 'Live in the moment / follow your ikigai', 'Avoid friends to stay focused', 'Never go outside', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
