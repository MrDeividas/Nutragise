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
DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Deep Work');
DELETE FROM public.information WHERE title = 'Deep Work';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Deep Work',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Deep work is rare and valuable</h2>
<ul><li>Focusing without distraction on hard cognitive tasks creates outsized value.</li></ul>
<h2>2. Choose a depth philosophy</h2>
<ul><li>Monastic, bimodal, rhythmic, or journalistic — pick a schedule that fits your life.</li></ul>
<h2>3. Train attention</h2>
<ul><li>Embrace boredom; quit network tools that fail a cost-benefit test.</li></ul>
<h2>4. Drain the shallows</h2>
<ul><li>Limit shallow work and end the day with a shutdown ritual.</li></ul>
<h1>PART 2 — DEEP WORK</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Focus as a superpower</h3>
<p>Cal Newport’s Deep Work (2016) defines deep work as professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.</p>
<p>Shallow work, by contrast, is non-cognitively demanding, logistical-style tasks, often performed while distracted — email, low-stakes meetings, status updates. Shallow work feels productive but rarely produces scarce value.</p>
<p>Newport’s hypothesis is economic and cultural: deep work is becoming increasingly valuable in the information economy while becoming increasingly rare as distraction becomes the default. That combination creates opportunity for people who can still focus.</p>
<p>Newport’s value argument is sharp: as routine tasks automate and communication tools multiply, the ability to learn hard things quickly and produce elite output becomes a career divider. Depth is not nostalgia; it is leverage.</p>
<p>Embracing boredom is offline training for online work. If every queue and red light becomes a phone session, you have trained craving for novelty. Break that loop and concentration stops feeling abnormal.</p>
<p><strong>Lesson:</strong> Treat distraction-free concentration on hard cognitive work as a rare, valuable skill worth defending.</p>
<h3>Chapter 2: Why depth wins</h3>
<p>Hard things learned quickly and high-quality output both depend on unbroken concentration. Newport draws on research about attention residue: switching tasks leaves a cognitive hangover that reduces performance on the next task. Constant email and chat fragment the mind.</p>
<p>Knowledge work that looks busy can hide emptiness. Clearing an inbox is visible; thinking hard for three hours is invisible until the artifact appears. Organizations often reward visible busyness over depth, which is why individuals must protect depth deliberately.</p>
<p>If your career depends on mastering hard skills and producing elite output, shallow defaults are not neutral — they are competitive disadvantages.</p>
<p>Attention residue explains why “quick checks” are expensive. Each glance at email leaves a cognitive aftertaste that degrades the deep task you return to. Batching shallow work protects the integrity of focus blocks.</p>
<p>Selective quitting of social tools is a craftsman’s audit. Newport asks you to measure tools against your deeply valued goals, not against vague FOMO. Any benefit is not enough benefit if the attention tax is steep.</p>
<p><strong>Lesson:</strong> Recognize that unbroken concentration is the engine of skill and quality — and busyness is not the same as depth.</p>
<h3>Chapter 3: Rule 1 — Work deeply (and pick a philosophy)</h3>
<p>Depth needs rituals, not vibes. Newport outlines depth philosophies: monastic (maximize isolation from shallow obligations), bimodal (divide time into clearly deep stretches and open stretches), rhythmic (daily consistent blocks — often the most practical), and journalistic (fit depth into whatever gaps appear — hardest without experience).</p>
<p>Whatever philosophy you choose, ritualize the variables: where you work, how long, how you start, what rules ban distraction, and how you measure progress. Willpower fades; rituals reduce the need to decide.</p>
<p>The rhythmic approach — a fixed daily deep appointment — is especially useful for people with ordinary jobs: same time, same place, same expectation of focus.</p>
<p>Depth philosophies prevent one-size-fits-none advice. A CEO may need bimodal retreats; a writer with kids may need rhythmic dawn blocks; a junior employee may only manage journalistic gaps until they gain autonomy. Choose the constraint that fits.</p>
<p>Draining the shallows can include office tactics: fewer open-ended office hours, batching email, declining low-value meetings, and making shallow work visible so it can be budgeted instead of endlessly expanded.</p>
<p><strong>Lesson:</strong> Choose a depth philosophy that fits your life, then ritualize place, duration, and distraction rules.</p>
<h3>Chapter 4: Rule 2 — Embrace boredom</h3>
<p>If you reach for a phone at every pause, your brain learns to need constant stimulation. Newport argues that the ability to concentrate intensely is a skill that must be trained, and constant connectivity undermines that training.</p>
<p>Embracing boredom means practicing being undistracted even when you are not formally “working deep” — walking without podcasts, waiting without scrolling. You teach the mind that every idle moment does not require a hit of novelty.</p>
<p>Without this training, deep work sessions become torture and fail. With it, focus becomes more durable because you are not fighting a daily addiction to interruption.</p>
<p>Rituals remove debate. Same location, same start cue, same banned tabs, same done metric. Deep work fails when every session begins with renegotiating whether you feel like focusing.</p>
<p>The shutdown ritual is psychological hygiene. Capturing open loops and declaring completion lets the mind rest. Without it, evenings become low-grade work anxiety and tomorrow’s deep block arrives already depleted.</p>
<p><strong>Lesson:</strong> Train focus by practicing boredom — stop using distraction as your default entertainment.</p>
<h3>Chapter 5: Rule 3 — Quit social media (selectively)</h3>
<p>Newport is not anti-tool; he is anti-default. He proposes an any-benefit mindset trap: people keep a network tool if they can name any benefit, ignoring substantial costs to attention and time. Instead, use a craftsman approach: adopt a tool only if its positive impacts substantially outweigh its negative impacts for your specific goals.</p>
<p>A thirty-day digital declutter — stepping away from optional online tools, then intentionally reintroducing only what proves valuable — is one of his practical experiments.</p>
<p>The point is intentionality. Social platforms can be useful; unconscious, all-day access rarely is for deep workers.</p>
<p>Embracing boredom is offline training for online work. If every queue and red light becomes a phone session, you have trained craving for novelty. Break that loop and concentration stops feeling abnormal.</p>
<p>Newport’s value argument is sharp: as routine tasks automate and communication tools multiply, the ability to learn hard things quickly and produce elite output becomes a career divider. Depth is not nostalgia; it is leverage.</p>
<p><strong>Lesson:</strong> Keep only network tools whose benefits clearly outweigh their attention costs for your goals.</p>
<h3>Chapter 6: Rule 4 — Drain the shallows and shut down</h3>
<p>Drain the shallows by scheduling your day, quantifying shallow work, and constraining it. Fixed-schedule productivity — finishing at a set time — forces prioritization so depth is not endlessly postponed by logistics.</p>
<p>Newport’s shutdown ritual closes open loops at day’s end: review unfinished tasks, capture next steps, then say a phrase like “shutdown complete.” The ritual signals to your mind that work is done, protecting evening recovery so tomorrow’s depth is possible.</p>
<p>Deep Work’s closing argument is craft: treat concentration like a skill you schedule, train, and defend in a world designed to fracture it.</p>
<p>Selective quitting of social tools is a craftsman’s audit. Newport asks you to measure tools against your deeply valued goals, not against vague FOMO. Any benefit is not enough benefit if the attention tax is steep.</p>
<p>Attention residue explains why “quick checks” are expensive. Each glance at email leaves a cognitive aftertaste that degrades the deep task you return to. Batching shallow work protects the integrity of focus blocks.</p>
<p><strong>Lesson:</strong> Limit shallow work, use a fixed schedule, and end with a shutdown ritual that closes loops and protects recovery.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
    'Cal Newport’s case for focused, distraction-free work — deep vs shallow, four rules, depth philosophies, and the shutdown ritual.'
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
  ('How does Newport define deep work?', 'Answering email quickly', 'Distraction-free concentration on cognitively demanding tasks', 'Attending more meetings', 'Multitasking on chat', 'B', 1),
  ('Which depth philosophy uses a daily consistent block?', 'Monastic only', 'Rhythmic', 'Never scheduling', 'Only weekend retreats forever', 'B', 2),
  ('What is Rule 2 in Deep Work?', 'Answer every notification', 'Embrace boredom to train focus', 'Post more online', 'Skip breaks forever', 'B', 3),
  ('What is a shutdown ritual for?', 'Starting more Slack channels', 'Closing open loops and signaling the workday is done', 'Checking email all night', 'Avoiding planning', 'B', 4),
  ('What does Newport say about deep work’s economic value?', 'It is useless today', 'It is becoming more valuable while becoming rarer', 'Only managers need it', 'It is the same as shallow work', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Mindset');
DELETE FROM public.information WHERE title = 'Mindset';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Mindset',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Two mindsets</h2>
<ul><li>Fixed: abilities are carved in stone. Growth: abilities can be developed.</li></ul>
<h2>2. Mindset changes meaning</h2>
<ul><li>Effort, failure, and challenge look different under each belief.</li></ul>
<h2>3. Praise and learning</h2>
<ul><li>Process praise supports growth; talent-only praise can fuel fixed thinking.</li></ul>
<h2>4. False growth mindset</h2>
<ul><li>Real growth needs strategies and feedback — not empty “try harder” talk.</li></ul>
<h1>PART 2 — MINDSET</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Beliefs that shape success</h3>
<p>Carol S. Dweck’s Mindset popularizes decades of research on implicit theories of intelligence: the fixed mindset versus the growth mindset. A fixed mindset treats qualities like intelligence and talent as largely static. A growth mindset treats them as cultivable through effort, strategies, and learning from others.</p>
<p>These beliefs are not just opinions; they become meaning systems. They change how you interpret challenge, effort, setbacks, and other people’s success. The same event — a hard test, a rejected proposal — can feel like a verdict or like information depending on mindset.</p>
<p>Dweck’s work spans classrooms, sports, business, and relationships. The unifying claim: the view you adopt for yourself profoundly affects the way you lead your life.</p>
<p>Dweck’s research reframes success psychology: it is not only talent and opportunity, but the meaning you assign to effort and struggle. Two students with equal ability can diverge because one treats difficulty as indictment and the other as instruction.</p>
<p>Process praise works because it points people toward controllable inputs. “You worked through that the hard way and adjusted your approach” teaches a repeatable method. “You’re a genius” teaches a label that tomorrow’s struggle can shatter.</p>
<p><strong>Lesson:</strong> Notice that your theory of ability — fixed or growth — quietly scripts how you respond to challenge.</p>
<h3>Chapter 2: The fixed mindset</h3>
<p>If you believe talent is static, you often need to prove yourself repeatedly. Challenges threaten identity because struggle can look like evidence you lack the gift. Effort can feel shameful — “If I were truly smart, I wouldn’t have to try.” Failure looks like a permanent label.</p>
<p>Fixed-mindset logic pushes people toward safer tasks where success is likely, away from stretches that risk exposure. Feedback feels like judgment. Other people’s success becomes a threat rather than a lesson.</p>
<p>None of this means fixed-mindset people lack ambition. It means ambition is tangled with proving and protecting an image of ability.</p>
<p>Fixed mindset creates a urgency to look talented now. That urgency makes shortcuts, cheating, blame, and safe goals more tempting. The self-image of being “the smart one” becomes a fragile asset that must be defended.</p>
<p>Organizations leak mindset. If leaders punish intelligent risks and only reward flawless outcomes, employees hide errors and stop innovating — regardless of posters about learning culture.</p>
<p><strong>Lesson:</strong> See how a fixed mindset turns challenges into threats and effort into a supposed sign of inadequate talent.</p>
<h3>Chapter 3: The growth mindset</h3>
<p>If you believe abilities can be developed, challenges become opportunities to improve. Effort is the path to mastery, not a shameful signal. Setbacks hurt, but they point to strategies still missing rather than to a final identity sentence.</p>
<p>Growth-minded people still care about winning and looking capable — but learning is allowed to matter more than immediate perfection. Asking for help is a tactic, not a confession of deficiency.</p>
<p>Importantly, growth mindset is not the belief that anyone can become anything with zero constraints. It is the belief that you do not know your limits in advance, and that improvement is possible with the right work.</p>
<p>Growth mindset creates permission to be a beginner repeatedly. Careers, arts, and relationships all require seasons of awkward incompetence. If awkwardness is intolerable, learning stalls.</p>
<p>False growth mindset is sneaky: it uses growth language as a brand while still ranking people as permanently gifted or not. Or it praises effort blindly while students spin their wheels without new strategies.</p>
<p><strong>Lesson:</strong> Treat abilities as developable through effort, strategies, and learning — so challenge becomes useful.</p>
<h3>Chapter 4: Failure, feedback, and the meaning of effort</h3>
<p>In a growth mindset, failure is painful but informative — a problem to work on. In a fixed mindset, failure can feel like an identity crisis, so people may avoid hard tasks that risk exposure or may hide deficiencies instead of repairing them.</p>
<p>Effort’s meaning flips too. Fixed: effort means you lack talent. Growth: effort is what activates talent. That flip changes whether you persist when something gets hard.</p>
<p>Feedback follows the same split. Growth seekers want accurate information even when it stings. Fixed protectors may dismiss, avoid, or personalize feedback to keep the self-image intact.</p>
<p>Failure’s interpretation is the fork in the road. Fixed: I failed, therefore I am a failure. Growth: I failed, therefore my strategy, preparation, or skill still needs work. Same event; different next chapter.</p>
<p>Changing mindset starts with awareness of triggers — defensiveness, comparison spikes, concealment — then a deliberate script: “I’m not there yet.” The word yet is small and powerful: it keeps the future open.</p>
<p><strong>Lesson:</strong> Reframe failure as useful information and effort as the path to mastery, not as shame.</p>
<h3>Chapter 5: Praise, parenting, and leadership cues</h3>
<p>Dweck’s research cautions that praising innate smartness can push fixed thinking: children (and adults) may avoid challenges that could disprove the “smart” label. Process-focused feedback — strategies, practice, persistence, and adjustment — better supports growth.</p>
<p>Leaders and teachers send mindset cues constantly: Do we celebrate only flawless outcomes, or also intelligent experiments? Do we treat struggle as normal in learning, or as embarrassment?</p>
<p>The implication is cultural, not just personal. Environments can pull people toward fixed or growth responses regardless of what posters on the wall say.</p>
<p>Process praise works because it points people toward controllable inputs. “You worked through that the hard way and adjusted your approach” teaches a repeatable method. “You’re a genius” teaches a label that tomorrow’s struggle can shatter.</p>
<p>Dweck’s research reframes success psychology: it is not only talent and opportunity, but the meaning you assign to effort and struggle. Two students with equal ability can diverge because one treats difficulty as indictment and the other as instruction.</p>
<p><strong>Lesson:</strong> Praise process — strategies, practice, persistence — rather than labeling people as innately smart or not.</p>
<h3>Chapter 6: False growth mindset — and changing beliefs</h3>
<p>Dweck has warned about a “false growth mindset”: saying growth words while still judging talent in fixed ways, or praising effort alone without teaching better strategies. “Just try harder” without skill-building is incomplete. Real growth mindset includes seeking effective methods, honest feedback, and learning from setbacks.</p>
<p>Mindsets can change. Believing they can is part of the point. Notice fixed-mindset triggers — defensiveness, comparison panic, urge to hide mistakes — then consciously reframe: This is hard, which means I’m at the edge of learning.</p>
<p>Mindset is not a pep talk. It is a trainable meaning system about what effort and failure say about you.</p>
<p>Organizations leak mindset. If leaders punish intelligent risks and only reward flawless outcomes, employees hide errors and stop innovating — regardless of posters about learning culture.</p>
<p>Fixed mindset creates a urgency to look talented now. That urgency makes shortcuts, cheating, blame, and safe goals more tempting. The self-image of being “the smart one” becomes a fragile asset that must be defended.</p>
<p><strong>Lesson:</strong> Avoid empty effort-praise; pair growth beliefs with real strategies, feedback, and honest learning.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780345472328-L.jpg',
    'Carol Dweck’s research on fixed vs growth mindset — how beliefs about ability shape challenge-seeking, effort, failure, praise, and resilience.'
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
  ('What is a fixed mindset?', 'Belief that abilities can always grow', 'Belief that qualities like intelligence are largely static', 'Belief that effort never matters for anyone', 'Belief that feedback is always wrong', 'B', 1),
  ('What is a growth mindset?', 'Avoiding all challenges', 'Belief that abilities can be developed through effort, strategies, and learning', 'Only caring about talent labels', 'Never practicing', 'B', 2),
  ('How does a growth mindset typically view failure?', 'As a permanent identity verdict', 'As painful but useful information for improvement', 'As proof you should quit forever', 'As unrelated to learning', 'B', 3),
  ('What kind of praise better supports growth, according to Dweck’s research themes?', 'Only praising innate smartness', 'Praising process: strategies, practice, and persistence', 'Never giving feedback', 'Praising only final rankings', 'B', 4),
  ('What is a risk of a ''false'' growth mindset?', 'Reading books', 'Praising effort alone without better strategies and real learning', 'Sleeping enough', 'Asking for help', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
