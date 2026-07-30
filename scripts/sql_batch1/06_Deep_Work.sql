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
