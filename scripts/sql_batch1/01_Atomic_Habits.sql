DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Atomic Habits');
DELETE FROM public.information WHERE title = 'Atomic Habits';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Atomic Habits',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Tiny gains compound</h2>
<ul><li>Getting 1% better each day compounds into major change over a year.</li><li>Getting 1% worse compounds the other way.</li></ul>
<h2>2. Systems beat goals</h2>
<ul><li>You do not rise to the level of your goals; you fall to the level of your systems.</li></ul>
<h2>3. Identity-based habits</h2>
<ul><li>Focus on who you want to become; each action is a vote for that identity.</li></ul>
<h2>4. The habit loop and Four Laws</h2>
<ul><li>Cue, craving, response, reward — then make good habits obvious, attractive, easy, and satisfying.</li></ul>
<h2>5. Environment and stacking</h2>
<ul><li>Design surroundings, stack habits, and use the two-minute rule to start.</li></ul>
<h1>PART 2 — ATOMIC HABITS</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Why tiny changes matter</h3>
<p>Atomic Habits (2018) by James Clear is a practical guide to building good habits and breaking bad ones. Clear’s central claim is deceptively simple: small behaviors, repeated consistently, compound into remarkable results. The book is not about overnight transformation. It is about trajectory — the direction your daily actions are pointing you toward over months and years.</p>
<p>Clear popularized the idea that if you get 1% better each day, those gains compound. The reverse is also true: if you get 1% worse each day, decline compounds into collapse. In the moment, a tiny improvement feels almost invisible. Over a year, the difference between a rising and falling curve becomes enormous. That is why Clear treats habits as the compound interest of self-improvement.</p>
<p>This framing shifts attention away from dramatic overhauls. Motivation spikes and New Year’s resolutions often fail because they demand a sudden, unsustainable identity change. Atomic habits win by being small enough to start, clear enough to repeat, and aligned enough to reinforce who you want to become.</p>
<p><strong>Lesson:</strong> Treat improvement as a compounding trajectory, not a one-time event.</p>
<h3>Chapter 2: The 1% rule and the plateau of latent potential</h3>
<p>Improving by 1% a day is easy to dismiss because progress is rarely linear in how it feels. Clear describes a “plateau of latent potential”: you may work for weeks with little visible payoff, then suddenly see results after enough repetitions stack up. People quit in the valley before the breakthrough because they expect immediate evidence that the habit is “working.”</p>
<p>The practical implication is patience with process. Showing up when results are still invisible is part of the system. Clear also warns that small declines compound too — skipping the workout, eating “just this once,” checking the phone at every pause. Each choice seems minor; together they define your outcomes.</p>
<p>So the 1% rule is less a math trick than a mindset: obsess over the quality of today’s inputs. If the daily unit is right, time becomes an ally instead of a judge.</p>
<p><strong>Lesson:</strong> Stay consistent through the invisible plateau; compounding rewards the process you refuse to abandon.</p>
<h3>Chapter 3: Goals vs systems</h3>
<p>Clear’s most quoted line is that you do not rise to the level of your goals; you fall to the level of your systems. Goals set direction — lose weight, write a book, save money. Systems are the recurring processes that produce those outcomes: meal prep routines, daily writing blocks, automatic transfers.</p>
<p>Goals alone create a problem: once you hit them, motivation can collapse, or you live in a perpetual gap between “now” and “then.” Systems keep you in motion regardless of the scoreboard. Two people can share the same goal; the one with the better system usually wins.</p>
<p>Clear is not anti-goal. He is anti-goal-as-strategy. Use goals to aim; use systems to improve. If you only change the target and never change the process, you keep restarting the same story.</p>
<p><strong>Lesson:</strong> Aim with goals, but build and refine the daily systems that actually create progress.</p>
<h3>Chapter 4: Identity-based habits</h3>
<p>Clear distinguishes outcome-based habits (I want to lose twenty pounds) from identity-based habits (I am the kind of person who does not miss workouts). Outcome goals chase a result. Identity habits start with who you wish to become. Every small action is a “vote” for that identity.</p>
<p>Belief and behavior reinforce each other. Act like a reader often enough and “I am a reader” becomes credible. Skip reading for months and the identity fades. Clear’s advice is to cast small votes repeatedly rather than waiting for a dramatic proof event.</p>
<p>This also explains why willpower-only change fails. If your identity still says “I’m not a morning person” or “I’m bad with money,” your behavior will tend to snap back. Change the story you are proving with actions, and the habit has somewhere to live.</p>
<p><strong>Lesson:</strong> Ask who you want to become, then cast small daily votes that make that identity true.</p>
<h3>Chapter 5: The habit loop: cue, craving, response, reward</h3>
<p>Clear describes habits as a four-step neurological loop. A cue triggers your brain to initiate a behavior. A craving is the motivational force — the desire for a change in state. The response is the actual habit you perform. The reward satisfies the craving and teaches your brain whether to repeat the loop next time.</p>
<p>Without understanding the loop, people attack the wrong stage. They try to “just stop” a response while leaving the cue and craving intact. Or they add a new habit without making the cue obvious or the reward satisfying, so the loop never wires in.</p>
<p>The loop is also why environment matters so much. Cues live in places, times, people, and preceding actions. If your phone is the first thing you see in bed, the cue for scrolling is already loaded before you consciously decide anything.</p>
<p><strong>Lesson:</strong> Diagnose habits as cue → craving → response → reward, then intervene at the stage that actually drives the behavior.</p>
<h3>Chapter 6: The Four Laws of Behavior Change</h3>
<p>Clear maps four laws onto the loop for building good habits: (1) Make it obvious — design clear cues. (2) Make it attractive — pair habits with wanting. (3) Make it easy — reduce friction; start small. (4) Make it satisfying — give yourself an immediate reason to repeat. To break a bad habit, invert the laws: make the cue invisible, the craving unattractive, the response difficult, and the reward unsatisfying.</p>
<p>“Make it obvious” includes implementation intentions (“I will [BEHAVIOR] at [TIME] in [LOCATION]”) and habit stacking (“After [CURRENT HABIT], I will [NEW HABIT]”). “Make it easy” includes the two-minute rule: scale a habit down until the gateway version takes two minutes or less — read one page, put on running shoes, write one sentence. The point is to master showing up.</p>
<p>Satisfaction closes the loop. Clear emphasizes that the brain prioritizes immediate rewards. So good habits need a short-term payoff (a tracker checkmark, a small celebration) even when the real benefit is delayed. Bad habits often already feel good now and costly later — which is why inversion and friction are essential.</p>
<p><strong>Lesson:</strong> Build good habits with obvious–attractive–easy–satisfying; break bad ones by inverting those same laws.</p>
<h3>Chapter 7: Environment design, stacking, and starting tiny</h3>
<p>Willpower is fragile. Clear argues that self-control is often a design problem dressed up as a character problem. Shape your environment so good cues are visible and bad cues are removed. Put fruit on the counter; hide the junk food. Keep the guitar on a stand, not in a closet. Make the right action the path of least resistance.</p>
<p>Habit stacking links a new behavior to something you already do reliably, turning an existing routine into a cue. The two-minute rule lowers the activation energy so you stop negotiating with yourself about “the full workout” and instead become someone who always begins. Once you begin, momentum often carries you further — but even if it does not, you still cast the identity vote.</p>
<p>Taken together, Atomic Habits is a systems manual: improve by tiny percentages, vote for your identity, understand the loop, apply the Four Laws, and redesign your surroundings so the default choice is the helpful one.</p>
<p><strong>Lesson:</strong> Design your environment and start with a two-minute gateway so the right habit becomes the easy habit.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    'James Clear’s practical system for getting 1% better every day — identity, systems, the habit loop, and the Four Laws of Behavior Change.'
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
  ('According to Atomic Habits, what do you ''fall to the level of''?', 'Your motivation', 'Your systems', 'Your goals', 'Your talent', 'B', 1),
  ('What are the four steps of Clear’s habit loop?', 'Plan, act, review, repeat', 'Cue, craving, response, reward', 'Trigger, habit, streak, identity', 'Want, try, fail, restart', 'B', 2),
  ('What is the 1st law of behavior change for building a good habit?', 'Make it obvious', 'Make it rare', 'Make it expensive', 'Make it secret', 'A', 3),
  ('What does Clear mean by identity-based habits?', 'Copying a celebrity’s routine', 'Focusing on who you want to become, with actions as votes for that identity', 'Only tracking outcomes', 'Changing jobs first', 'B', 4),
  ('How do you break a bad habit using Clear’s framework?', 'Set a bigger goal', 'Invert the Four Laws (e.g. make the cue invisible)', 'Ignore the cue forever', 'Only use willpower', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
