DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = '12 Rules for Life');
DELETE FROM public.information WHERE title = '12 Rules for Life';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    '12 Rules for Life',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Stand up straight; treat yourself as someone you are responsible for helping</h2>
<ul><li>Embodied confidence and self-respect as ethical duties.</li></ul>
<h2>2. Choose friends who want the best for you</h2>
<ul><li>Social circles either elevate or drag you into chaos.</li></ul>
<h2>3. Compare yourself to who you were yesterday</h2>
<ul><li>Local progress beats toxic global comparison.</li></ul>
<h2>4. Set your house in perfect order before criticizing the world</h2>
<ul><li>Begin with controllable responsibility.</li></ul>
<h2>5. Pursue what is meaningful, not what is expedient</h2>
<ul><li>Long-term meaning over short-term impulse.</li></ul>
<h2>6. Tell the truth; be precise in your speech</h2>
<ul><li>Honesty and clarity reduce chaos.</li></ul>
<h2>7. Attend to small mercies; let children take risks</h2>
<ul><li>Pet a cat when you can; don’t overprotect kids out of adventure.</li></ul>
<h1>PART 2 — 12 RULES FOR LIFE</h1>
<h2>A 23-Minute Read Summary</h2>
<h3>Chapter 1: Rule 1 — Stand up straight with your shoulders back</h3>
<p>Jordan B. Peterson’s 12 Rules for Life (2018) mixes clinical psychology, mythology, evolutionary biology, and moral exhortation. Rule 1 uses lobster hierarchies as a provocative metaphor: creatures that win dominance contests often display more open, upright posture, and neurochemistry shifts with status. Peterson’s human point is not “become a bully.” It is that embodied posture and willingness to face the world feed back into confidence, opportunity, and mood.</p>
<p>Standing up straight is literal and metaphorical. Literally, adopt a stance that signals readiness rather than defeat. Metaphorically, accept the burden of Being — show up to life’s contests instead of curling into avoidance. People who chronically signal defeat invite more defeat; those who present themselves as capable often receive better invitations.</p>
<p>Critics debate the biology; the practical counsel remains usable: stop practicing bodily defeat. Walk into rooms as if you have a right to be there and a duty to contribute. Posture will not solve everything, but collapse helps nothing.</p>
<p>Tomorrow morning, deliberately square your shoulders, make the bed, and take one action you have been avoiding. Let the body lead the mind for a day.</p>
<p><strong>Lesson:</strong> Carry yourself as someone responsible for facing life — posture and willingness shape the feedback you receive.</p>
<h3>Chapter 2: Rule 2 — Treat yourself like someone you are responsible for helping</h3>
<p>Peterson notes a grim irony: people often care for pets more diligently than for themselves — administering medicine to a dog while neglecting their own prescriptions. Rule 2 asks you to see yourself as a person worthy of care, not as an object of contempt.</p>
<p>Self-contempt often hides as false virtue (“I don’t deserve good things”). Peterson reframes self-care as moral responsibility: you have a duty to the future human who inherits your choices. Sleep, health, finances, and promises kept are not vanity; they are stewardship.</p>
<p>Treating yourself as someone you help also means setting aims. A person you care for needs a plan, not endless self-punishment. Replace “I hate myself” loops with concrete aid: appointments made, habits installed, environments cleaned.</p>
<p>Write a care plan for yourself as if for a friend you love: health, work, relationships. Execute one item today without negotiating your worthiness.</p>
<p><strong>Lesson:</strong> Care for yourself as a duty of responsibility — you are someone worth helping, not a perpetual target of neglect.</p>
<h3>Chapter 3: Rule 3 — Make friends with people who want the best for you</h3>
<p>Not every social bond is nourishing. Some friendships reward failure, cynicism, or shared decline because your progress would expose their stagnation. Rule 3 is a permission slip to choose peers who celebrate your upward aim and tell you the truth when you drift.</p>
<p>Peterson is not advising snobbery; he is advising against rescuing people who refuse to aim up if that rescue destroys you. Compassion without discernment becomes enabling. Surround yourself, as much as possible, with people whose example makes good habits easier.</p>
<p>Audit your five closest influences. Who leaves you more responsible after contact? Who leaves you more chaotic? Increase time with the first group; set boundaries with the second.</p>
<p><strong>Lesson:</strong> Prefer friendships that want your best — upward-aiming peers over bonds that punish growth.</p>
<h3>Chapter 4: Rule 4 — Compare yourself to who you were yesterday, not to who someone else is today</h3>
<p>Modern life floods you with curated peaks of others’ lives. Global comparison produces envy and paralysis because there is always someone further ahead on some axis. Rule 4 relocates the race: beat your prior self on a local, controllable dimension.</p>
<p>This is not anti-ambition. Models can inspire. But the daily scoreboard should be personal: Did I improve the sentence I can control? Peterson ties this to meaning — a life organized around incremental responsibility produces steady dignity.</p>
<p>Pick one metric for thirty days — writing minutes, training sessions, kind acts, decluttered spaces. Compare only to yesterday’s you. Let others’ highlight reels exist without owning your nervous system.</p>
<p><strong>Lesson:</strong> Measure progress against yesterday’s self — local improvement beats toxic global comparison.</p>
<h3>Chapter 5: Rules 5–6 — Parent wisely; set your house in order</h3>
<p>Rule 5 advises: do not let your children do anything that makes you dislike them — because the world will like them even less if they become intolerable. Parenting requires courage to socialize children toward reciprocity, not endless indulgence disguised as love. Limits are a gift when they teach children how to be welcome among others.</p>
<p>Rule 6: set your house in perfect order before you criticize the world. Before grand ideological crusades, stop doing things you know to be wrong in your own life — broken promises, neglected duties, addictions, lies. Chaos at home undermines moral authority abroad. Begin with what you can fix.</p>
<p>Together these rules emphasize responsibility near at hand. Civilizational criticism is easy; personal order is hard. Peterson pushes readers toward the hard starting point.</p>
<p>List three disorders in your immediate life — room, calendar, finances, relationships. Fix one before posting another complaint about the world.</p>
<p><strong>Lesson:</strong> Socialize children toward being likable and useful; put your own house in order before condemning everything else.</p>
<h3>Chapter 6: Rules 7–8 — Meaning over expedience; tell the truth</h3>
<p>Rule 7: pursue what is meaningful, not what is expedient. Expedience grabs short-term relief — another avoidance, another easy lie, another impulse. Meaning accepts responsibility and delayed gratification for a story you can respect. Peterson links meaning to shouldering voluntary burdens that reduce suffering for self and others.</p>
<p>Rule 8: tell the truth — or, at least, don’t lie. Lies warp your map of reality until you cannot navigate. Living falsely creates a fog where catastrophes surprise you. Truth-telling is costly in the moment and cheaper across a life.</p>
<p>When tempted by an expedient shortcut, ask what meaningful path would make you stronger and more trustworthy in a year. Prefer that path even when it is slower.</p>
<p><strong>Lesson:</strong> Choose meaningful responsibility over short-term expedience, and speak truth so your map of reality stays usable.</p>
<h3>Chapter 7: Rules 9–12 — Listen, be precise, let kids skate, pet a cat</h3>
<p>Rule 9: assume that the person you are listening to might know something you don’t. Conversation becomes exploration rather than combat. Rule 10: be precise in your speech — vague language leaves dragons unnamed; precise naming makes problems solvable. Say what is wrong in the relationship, the contract, or the body without fog.</p>
<p>Rule 11: do not bother children when they are skateboarding — let them take reasonable risks. Overprotection can weaken courage; competence grows at the edge of danger well managed. Rule 12: pet a cat when you encounter one on the street — attend to small islands of beauty and grace when suffering is inevitable. Life includes tragedy; notice mercies anyway.</p>
<p>These closing rules balance steel and softness: radical honesty and precision, plus humility in listening, plus permission for adventure, plus gratitude for tiny goods.</p>
<p>Practice one precision conversation this week — name the real problem without insult. Practice one deliberate mercy — notice something lovely without irony.</p>
<p><strong>Lesson:</strong> Listen as if others know something; speak precisely; allow measured risk; notice small beauties amid suffering.</p>
<h3>Chapter 8: Aiming up as a daily ethic</h3>
<p>Across the twelve rules, Peterson’s through-line is responsibility as a path to meaning. Stand tall, care for yourself, choose better peers, improve locally, order what is near, aim at meaning, tell truth, listen, speak clearly, allow courage to develop, and notice grace. The book is demanding and polarizing; its usable core is an ethic of voluntary responsibility in a chaotic world.</p>
<p>You do not need to accept every analogy to adopt the practice: reduce lies, reduce disorder you control, reduce friendships that celebrate your worst, and increase truthful speech and incremental self-mastery. Meaning, in this framing, is what appears when you aim up and carry the resulting load.</p>
<p><strong>Lesson:</strong> Build meaning by aiming up daily — truth, order, responsibility, and attention to what still makes life lovely.</p>',
    23,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780345816023-L.jpg',
    'Jordan B. Peterson’s practical-philosophical rules for meaning and responsibility — posture, self-care, truth, precision, and aiming up.'
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
  ('What is the practical point of ''stand up straight with your shoulders back''?', 'Become aggressive toward everyone', 'Face life with embodied readiness; posture and willingness affect feedback and confidence', 'Ignore all social situations', 'Only think about lobsters', 'B', 1),
  ('What does Rule 2 ask you to do?', 'Neglect your health as humility', 'Treat yourself like someone you are responsible for helping', 'Put everyone else last always', 'Avoid all plans', 'B', 2),
  ('According to Rule 4, whom should you compare yourself to?', 'Only billionaires', 'Who you were yesterday, not everyone else today', 'Your enemies', 'Celebrities on social media', 'B', 3),
  ('What should you do before criticizing the world (Rule 6)?', 'Post more complaints', 'Set your house in order / stop doing what you know is wrong', 'Ignore your personal life', 'Quit all responsibilities', 'B', 4),
  ('What do Rules 8 and 10 emphasize together?', 'Vague speech and comforting lies', 'Tell the truth and be precise in your speech', 'Never listen to others', 'Avoid naming problems', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
