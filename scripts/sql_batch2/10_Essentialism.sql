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
