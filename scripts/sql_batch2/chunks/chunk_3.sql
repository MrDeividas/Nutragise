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

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Outliers');
DELETE FROM public.information WHERE title = 'Outliers';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Outliers',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Success is not solo genius</h2>
<ul><li>Outliers ride hidden advantages, timing, and culture — not talent alone.</li></ul>
<h2>2. 10,000 hours</h2>
<ul><li>Mastery requires enormous deliberate practice — and access to practice time.</li></ul>
<h2>3. Opportunity and timing</h2>
<ul><li>Birth dates, eras, and gateways create uneven chances.</li></ul>
<h2>4. Cultural legacy</h2>
<ul><li>Inherited cultural patterns shape persistence, communication, and risk.</li></ul>
<h2>5. Meaningful work and the Matthew effect</h2>
<ul><li>Autonomy, complexity, and reward matter; early advantages compound.</li></ul>
<h1>PART 2 — OUTLIERS</h1>
<h2>A 22-Minute Read Summary</h2>
<h3>Chapter 1: The myth of the self-made outlier</h3>
<p>Malcolm Gladwell’s Outliers (2008) reframes superstar success stories. We love narratives of lone genius — the scrappy founder, the prodigy, the self-made billionaire. Gladwell argues those stories are incomplete. Outliers are products of practice, yes, but also of hidden opportunities, cultural legacies, family background, and historical timing.</p>
<p>The book opens with patterns like Canadian hockey players disproportionately born in the first months of the year — a relative-age effect. Early birthdays make children older in their cohort, which leads to selection, better coaching, more practice, and further advantage. What looks like pure talent is partly an arbitrary cutoff date compounded by systems.</p>
<p>Gladwell’s moral is double-edged. Individuals still must work; communities and institutions also create or withhold the conditions for work to matter. Understanding outliers means studying the soil, not only the plant.</p>
<p>When you admire a success story, ask: What practice did they get? What gate opened? What culture prepared them? Expand the frame beyond personality worship.</p>
<p><strong>Lesson:</strong> Read success as the product of effort plus opportunity structures — not as pure solo genius.</p>
<h3>Chapter 2: The 10,000-hour rule and access to practice</h3>
<p>Gladwell popularized the idea that expertise in complex fields often requires on the order of 10,000 hours of practice — drawing on research associated with Anders Ericsson. The Beatles’ Hamburg residencies, Bill Gates’ unusual access to computer time as a teen — Gladwell’s cases emphasize not only grinding but unusual access to grinding.</p>
<p>The nuance critics rightly add: 10,000 is not magic, and deliberate practice quality matters. Gladwell’s useful stress is still valid for readers: mastery is rarely a weekend project, and many “overnight” successes were practicing when others could not get near the equipment, mentors, or stages.</p>
<p>So the rule is both inspiration and indictment. Inspiration: put in the hours. Indictment: ask who gets the hours. Societies that ration opportunity ration excellence.</p>
<p>If you want mastery, design a multi-year practice pipeline. If you lead, open doors so more people can accumulate serious hours — not only the already advantaged.</p>
<p><strong>Lesson:</strong> Aim for massive deliberate practice — and notice that access to practice time is itself an advantage.</p>
<h3>Chapter 3: Opportunity, timing, and demographic luck</h3>
<p>Gladwell examines how being born in the right year for a tech wave, a legal change, or an industry boom shapes outcomes. Jewish immigrant lawyers who arrived when New York’s establishment firms excluded them built skills in then-unfashionable niches that later exploded. Tech titans born in the mid-1950s hit adulthood as personal computing ignited.</p>
<p>This is not fatalism. It is context. Two equally driven people in different eras face different ceilings. Recognizing demographic luck should produce humility in winners and smarter policy for everyone else — more on-ramps, not only more pep talks.</p>
<p>Personally, scan for waves you can still catch: tools, industries, and skill intersections where timing still favors deep work. Opportunity is uneven; attention to timing is a skill.</p>
<p><strong>Lesson:</strong> Respect timing and structural opportunity — place yourself where waves and preparation can meet.</p>
<h3>Chapter 4: Practical intelligence and meaningful work</h3>
<p>Cognitive ability matters, Gladwell argues, but only to a point — beyond a threshold, other factors dominate. Practical intelligence — knowing how to navigate social systems, advocate for yourself, read situations — often comes from family environments that teach negotiation and agency. Two students with similar IQs can diverge because one knows how to talk to institutions and the other does not.</p>
<p>Meaningful work, in Gladwell’s telling, has complexity, autonomy, and a clear connection between effort and reward. Immigrant entrepreneurial stories often feature exhausting labor that still feels meaningful because the link between work and advancement is vivid. Distorted systems that break that link drain motivation.</p>
<p>Cultivate practical intelligence: ask for help, learn institutional rules, practice clear requests. Seek roles where effort still maps to reward — or redesign your projects so it does.</p>
<p><strong>Lesson:</strong> Past a cognitive threshold, practical intelligence and meaningful work conditions heavily shape outcomes.</p>
<h3>Chapter 5: Cultural legacy — planes, rice, and persistence</h3>
<p>Gladwell’s sections on cultural legacy explore how inherited patterns of communication and work shape modern performance. His analysis of plane crashes highlights mitigated speech — crews hesitating to speak assertively across hierarchy — as a risk factor. Culture is not destiny, but it is inertia; aviation safety improved partly by changing communication norms.</p>
<p>His rice-farming argument links certain agricultural traditions to cultures of persistent, precise work — then connects that legacy to attitudes toward math learning. Whether every anthropological link persuades every critic, the broader claim lands: deep cultural histories live inside present behavior.</p>
<p>For individuals, cultural legacy literacy means noticing your default conflict style, authority habits, and persistence scripts — then updating what no longer serves. For organizations, it means designing norms that make safe speech and sustained practice possible across backgrounds.</p>
<p><strong>Lesson:</strong> Cultural legacies shape communication and persistence — notice them, then redesign norms that block excellence or safety.</p>
<h3>Chapter 6: The Matthew effect and rewriting the story of success</h3>
<p>The Matthew effect — “to those who have, more will be given” — runs through Outliers. Early advantages attract more resources, which create more advantage. Relative-age effects in sports, streaming into gifted programs, early capital access — all can snowball.</p>
<p>Gladwell’s closing ethos is democratic: if outliers are made by ecosystems, we can build better ecosystems — more practice access, fairer cutoffs, richer cultural support for effort, more meaningful work. Personal takeaway: work insanely hard and advocate for wider on-ramps. Humility takeaway: winners should narrate their help, not only their hustle.</p>
<p>Rewrite your own success and failure stories with context included. Then put in the hours anyway — because opportunity without effort is also incomplete.</p>
<p>Parents, teachers, and managers can act on Outliers immediately: widen practice access, question arbitrary cutoffs, teach practical intelligence explicitly, and design work with autonomy and visible reward. Culture is not an excuse; it is a design space.</p>
<p>For the ambitious individual, Gladwell’s book is both fuel and humility. Fuel: accumulate serious hours in a meaningful field. Humility: remember the teachers, eras, families, and accidents that made those hours possible — then help create similar accidents for others.</p>
<p><strong>Lesson:</strong> Advantages compound (the Matthew effect) — pursue mastery while building fairer access to the conditions mastery requires.</p>',
    22,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780316017930-L.jpg',
    'Malcolm Gladwell on why outliers succeed — 10,000 hours, hidden opportunity, cultural legacy, meaningful work, and the Matthew effect.'
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
  ('What is Gladwell’s main critique of typical success stories?', 'Hard work never matters', 'They ignore hidden advantages, timing, and culture — not only individual talent', 'Only luck matters and effort is useless', 'Schools explain everything', 'B', 1),
  ('What does the 10,000-hour discussion emphasize?', 'Mastery needs no practice', 'Enormous practice — and unusual access to practice opportunities', 'One hour is enough', 'Talent replaces all practice', 'B', 2),
  ('What is the relative-age effect example in Outliers often about?', 'Random adult hobbies', 'Youth sports cutoff dates advantaging older children in a cohort', 'Astrology signs', 'Retirement ages', 'B', 3),
  ('What three qualities does Gladwell associate with meaningful work?', 'Fame, ease, and gossip', 'Complexity, autonomy, and a link between effort and reward', 'Strict obedience only', 'Short hours only', 'B', 4),
  ('What is the Matthew effect in this context?', 'Advantages compound — early gains attract more gains', 'Everyone starts equal forever', 'Practice reduces skill', 'Culture never matters', 'A', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Essentialism');
DELETE FROM public.information WHERE title = 'Essentialism';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Essentialism',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Less but better</h2>
<ul><li>Essentialism is the disciplined pursuit of what truly matters.</li></ul>
<h2>2. Tradeoffs are real</h2>
<ul><li>If you don’t choose, someone else chooses for you.</li></ul>
<h2>3. Explore, eliminate, execute</h2>
<ul><li>Discern essentials, cut the rest, make execution effortless.</li></ul>
<h2>4. Protect the asset</h2>
<ul><li>Sleep, play, and buffers sustain high-quality contribution.</li></ul>
<h2>5. Say no gracefully</h2>
<ul><li>Boundaries defend the essential against the merely good.</li></ul>
<h1>PART 2 — ESSENTIALISM</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: The disciplined pursuit of less</h3>
<p>Greg McKeown’s Essentialism (2014) defines a way of thinking: less but better. Non-essentialists say yes under social pressure, then live scattered, busy, and resentful. Essentialists explore what is vital, eliminate what is not, and build systems so the vital gets done with as little friction as possible.</p>
<p>McKeown’s trigger story is personal overload — success creating options, options creating diffusion, diffusion creating a sense of lost control. Essentialism is not laziness. It is deliberate concentration of effort on the highest contribution. Doing fewer things poorly is not the goal; doing the right things excellently is.</p>
<p>The essentialist mindset replaces “I have to” with “I choose,” replaces “It’s all important” with “Only a few things really matter,” and replaces “How can I fit it all in?” with “What tradeoff will I make?”</p>
<p>List everything competing for your attention this month. Circle at most three that create disproportionate value. Everything else becomes a candidate for elimination or deferral.</p>
<p><strong>Lesson:</strong> Adopt less-but-better as a discipline — concentrate on vital contribution instead of indiscriminate busyness.</p>
<h3>Chapter 2: Tradeoffs, choice, and the power of no</h3>
<p>Essentialists accept tradeoffs as inherent, not optional. Trying to eliminate tradeoffs eliminates excellence. If you refuse to choose, the world chooses for you — usually in favor of the loudest request, not the highest value.</p>
<p>Saying no is a core skill. McKeown offers graceful declines: pause, separate decision from relationship, give a clear no with a brief reason, and offer an alternative when appropriate. A unclear maybe helps no one. A clean no protects the yes that matters.</p>
<p>Boundary setting includes escaping from unproductive commitments already made — editing life midstream. Essentialism is continuous pruning, not a one-time spring clean.</p>
<p>Practice one graceful no this week to a good-but-not-essential request. Notice that disappointment is often temporary while resentment from overcommitment lingers.</p>
<p><strong>Lesson:</strong> Choose tradeoffs consciously and say no clearly — otherwise other people’s priorities will own your calendar.</p>
<h3>Chapter 3: Explore — discern what is essential</h3>
<p>The first phase is explore: create space to think, look, play, and sleep so you can see what actually matters. Non-essentialists are too busy executing to discern. Essentialists schedule thinking time, escape constant connectivity, and use criteria selective enough that most options fail the test.</p>
<p>McKeown suggests extreme criteria: if it is not a clear heck-yes, it is a no. Journaling, quiet, and intentional exploration of options beat reactive acceptance. Play is not frivolous — it sparks insight. Sleep is not optional — it protects judgment.</p>
<p>Exploration also means talking to people who help you reality-test contribution: What is the unique value I can add? What problem, if solved, unlocks others?</p>
<p>Block a weekly “explore” hour with phone off. Review commitments against a heck-yes standard. Protect sleep as a strategic asset, not a leftover.</p>
<p><strong>Lesson:</strong> Explore with space, sleep, and strict criteria so you can recognize the vital few.</p>
<h3>Chapter 4: Eliminate — cut the nonessential</h3>
<p>Eliminate means subtracting commitments, clutter, and false priorities. McKeown encourages zero-based commitment budgeting: pretend you have no prior obligations and only re-add what earns its place. Edit ruthlessly — in writing, calendars, and wardrobe metaphors alike.</p>
<p>Avoid the endowment effect of commitments: we overvalue what we already said yes to. Ask: If I did not already own this commitment, how much would I sacrifice to get it? Often the honest answer frees you.</p>
<p>Elimination is also social: clarify from the boss or client what the true priority is. Ambiguity keeps everything “important.” Essentialists force clarity.</p>
<p>Cancel or renegotiate one lingering commitment that no longer passes the contribution test. Feel the relief as data — your system was overloaded.</p>
<p><strong>Lesson:</strong> Ruthlessly eliminate nonessentials — re-choose commitments instead of carrying them by default.</p>
<h3>Chapter 5: Execute — make the essential effortless</h3>
<p>Execution for essentialists is about removing friction: build buffers, subtract until process is smooth, create small wins, and design routines that make the right action the easy action. Heroes who thrash through chaos look busy; systems that prevent chaos look calm and produce more.</p>
<p>McKeown emphasizes preparing margins — time buffers for the unexpected — rather than living at 100% utilization. Extreme utilization is fragility. He also celebrates focus rituals: one priority at a time, progress celebrated, distractions fenced.</p>
<p>When execution feels constantly hard, the essentialist response is not always “try harder.” It is “design better” — checklists, templates, batching, and environment design so willpower is less necessary.</p>
<p>For your top priority, remove two frictions (tools ready, location prepared, first step tiny) and add one buffer block for overflow. Make the essential path slippery-smooth.</p>
<p><strong>Lesson:</strong> Execute by design — buffers, routines, and friction removal beat heroic thrashing.</p>
<h3>Chapter 6: Living as an essentialist</h3>
<p>Essentialism becomes an identity when you repeatedly choose vital few over busy many. McKeown’s promise is not a smaller life but a more meaningful one — deeper relationships, better work, and less toxic stress. The nonessential often includes not only silly distractions but also good opportunities that do not fit your highest contribution.</p>
<p>Leadership applications are strong: essentialist teams clarify the real priority, kill pet projects bravely, and stop glorifying burnout theater. Personal applications are equally strong: protect sleep, schedule play, keep margins, and let your yes mean something because your no is real.</p>
<p>Choose a ninety-day essential intent — one contribution that would make the period a success. Align calendar, nos, sleep, and execution design to that intent. Review weekly: Did I live less but better?</p>
<p>Essentialism is especially powerful in seasons of too many good options. The pain is not choosing between good and bad; it is choosing between good and best. McKeown’s courage is to disappoint the good on purpose so the best can breathe.</p>
<p>If your days feel heavy with obligation and light on meaning, you do not necessarily need more motivation. You need fewer competing commitments and a clearer essential intent. Subtract until the vital has room.</p>
<p><strong>Lesson:</strong> Live essentialism as identity — fewer, better commitments, protected energy, and execution systems that keep the vital done.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780804137386-L.jpg',
    'Greg McKeown’s disciplined pursuit of less but better — explore, eliminate, execute, and protect the essential with sleep, play, and tradeoffs.'
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
  ('What is Essentialism’s core phrase?', 'More but faster', 'Less but better', 'Everything is equally important', 'Never say no', 'B', 1),
  ('What are the three phases McKeown emphasizes?', 'Ignore, delay, forget', 'Explore, eliminate, execute', 'Hustle, multitask, burn out', 'Copy, paste, coast', 'B', 2),
  ('How should essentialists treat tradeoffs?', 'Pretend they don’t exist', 'Accept and choose them consciously — or others will choose for you', 'Always say yes to avoid them', 'Only make tradeoffs once a year', 'B', 3),
  ('Why does McKeown value sleep and play in exploration?', 'They are wastes of time', 'They protect judgment and spark insight needed to discern essentials', 'Only athletes need them', 'They replace all hard work', 'B', 4),
  ('What is a practical elimination question for old commitments?', 'How can I add more?', 'If I didn’t already have this commitment, how hard would I work to get it?', 'Who can I blame?', 'How do I hide it?', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
