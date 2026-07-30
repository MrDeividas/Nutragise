DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The One Thing');
DELETE FROM public.information WHERE title = 'The One Thing';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The One Thing',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Go small</h2>
<ul><li>Extraordinary results come from narrowing focus, not doing more.</li></ul>
<h2>2. The Focusing Question</h2>
<ul><li>“What’s the ONE Thing I can do such that by doing it everything else becomes easier or unnecessary?”</li></ul>
<h2>3. Dominoes</h2>
<ul><li>Line up priorities so each success knocks over the next.</li></ul>
<h2>4. Time blocking</h2>
<ul><li>Protect a daily block for your ONE Thing before the world interrupts.</li></ul>
<h2>5. Defeat the lies of busyness</h2>
<ul><li>Multitasking, willpower-all-day myths, and balanced-everything thinking dilute results.</li></ul>
<h1>PART 2 — THE ONE THING</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Extraordinary results require focus</h3>
<p>Gary Keller’s The One Thing (written with Jay Papasan, 2013) argues that success is sequential, not simultaneous. Keller, founder of a giant real-estate franchise network, noticed that breakthrough outcomes came from focusing on the few actions that mattered most — often one action at a time — rather than from heroic multitasking.</p>
<p>The book’s enemy is scattered effort: long to-do lists that create motion without progress. Keller’s thesis is that if you chase everything, you achieve diluted versions of everything. If you identify the lead domino and apply disproportionate energy there, other tasks either become easier or fall away as unnecessary.</p>
<p>“Go small” sounds paradoxical in a culture that celebrates bigger goals. Keller means go small in focus so you can go big in results. Narrowing is not thinking small; it is aiming precisely.</p>
<p>Audit your calendar for the past week. How many hours went to your most important outcome versus reactive noise? That ratio is your real strategy.</p>
<p><strong>Lesson:</strong> Extraordinary results come from narrowed focus on the highest-leverage action — not from doing more things.</p>
<h3>Chapter 2: The Focusing Question</h3>
<p>Keller’s central tool is the Focusing Question: “What’s the ONE Thing I can do such that by doing it everything else becomes easier or unnecessary?” The question forces leverage thinking. It is not “What can I do?” (infinite) or “What should I do someday?” (vague). It is the single action with cascading payoff.</p>
<p>You can ask it big-picture (life, career, relationships) and small-picture (this year, this month, this week, today). The answers should nest: today’s ONE Thing serves the week’s, which serves the year’s. That nesting creates alignment instead of random productivity.</p>
<p>The question also surfaces tradeoffs. Saying yes to the ONE Thing means saying no to good-but-not-essential tasks. Keller treats those nos as strategic, not rude.</p>
<p>Write the Focusing Question at the top of your daily note. Answer it before opening email. Let that answer own your first deep-work block.</p>
<p><strong>Lesson:</strong> Use the Focusing Question at multiple time scales to find the action that makes other work easier or obsolete.</p>
<h3>Chapter 3: The domino effect and priority line-up</h3>
<p>Keller uses successive dominoes as a metaphor: a small domino can topple a larger one if lined up correctly, and a chain can eventually topple something huge. In work terms, complete the lead priority that unlocks the next, rather than tapping many dominoes lightly.</p>
<p>Goal setting to the now connects future vision to present action. Start from a someday aim, then define five-year, one-year, monthly, weekly, and daily ONE Things that form a chain. Each day you tip only the current domino — but because it is lined up, the chain advances.</p>
<p>This is why to-do lists fail when they are unsorted piles. Without a lead domino, checking off easy tasks creates false progress while the real priority waits.</p>
<p>Identify the lead domino for your main goal this month. Schedule it first. Let secondary tasks queue behind it without guilt theater.</p>
<p><strong>Lesson:</strong> Line up priorities as successive dominoes — knock over the lead one that unlocks the rest.</p>
<h3>Chapter 4: Time blocking your ONE Thing</h3>
<p>Keller is adamant that the ONE Thing needs a time block — ideally a substantial daily block early, before meetings and messages fragment attention. Treat that block like a non-negotiable appointment with your future results. If it is not scheduled, the world’s urgent requests will eat it.</p>
<p>Time blocking also applies to planning and to personal life priorities. Keller rejects the fantasy of perfect equal balance every day; he prefers counterbalancing over time — seasons of disproportionate focus — while protecting indispensable personal domains so success does not destroy health or relationships.</p>
<p>Protecting the block requires saying no, delaying lower priorities, and sometimes disappointing people who want immediate access to you. That social friction is the price of extraordinary results.</p>
<p>Put a recurring 2–4 hour morning block on the calendar titled with your ONE Thing. Defend it as you would defend a flight you cannot miss.</p>
<p><strong>Lesson:</strong> Time-block your ONE Thing early and defend it — unscheduled priorities lose to other people’s urgency.</p>
<h3>Chapter 5: Lies that distract and the willpower budget</h3>
<p>Keller attacks common productivity myths: that everything matters equally, that multitasking is effective, that a disciplined person has endless willpower all day, that a fully balanced life happens simultaneously, that big is bad, that accountable means doing it alone without support. Multitasking, he notes, is usually task-switching with a cognitive tax.</p>
<p>Willpower is limited and depletable. Do the ONE Thing while willpower is freshest. Do not waste prime cognitive hours on email triage and then wonder why creative work feels impossible at night.</p>
<p>Live by priority, not by passion alone or by mood. Passion helps, but priority decides. Keller wants readers to become purpose-driven and priority-driven rather than reaction-driven.</p>
<p>Move your most important cognitive work to your peak-energy hours. Demote inbox and meetings to later slots whenever you control the schedule.</p>
<p><strong>Lesson:</strong> Reject multitasking myths and spend limited willpower on the ONE Thing first.</p>
<h3>Chapter 6: The path to extraordinary</h3>
<p>Putting it together: ask the Focusing Question, line up nested answers, time-block the daily lead domino, and keep saying no to diluting opportunities. Keller’s promise is not an easier life; it is a clearer one. Busy can be a social costume; productive is a results costume.</p>
<p>Accountability partners and supportive environments help you keep the block sacred. Review weekly: Did I honor the ONE Thing? What domino comes next? Extraordinary results are rarely explosions; they are focused days stacked until the chain topples something large.</p>
<p>Choose one professional ONE Thing and one personal ONE Thing for the next ninety days. Let those two answers reorganize your calendar. Everything else becomes secondary support or polite decline.</p>
<p>Keller’s model also helps overwhelmed high performers who confuse activity with advancement. If your week was full but your lead domino never fell, you were busy in the wrong direction. Recalibrate without self-drama: rename the priority, rebuild the block, and begin again tomorrow.</p>
<p>Over a career, successive ONE Things become a legacy chain — skills stacked, relationships deepened, products shipped. Extraordinary is usually the visible tip of years of protected focus.</p>
<p><strong>Lesson:</strong> Stack focused days on a nested ONE Thing chain until successive dominoes create extraordinary outcomes.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781885167774-L.jpg',
    'Gary Keller’s focus classic: the Focusing Question, successive dominoes, time blocking, and going small to achieve big results.'
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
  ('What is Keller’s Focusing Question aimed at finding?', 'Every task on a long list', 'The one action that makes everything else easier or unnecessary', 'Only recreational hobbies', 'What others want you to do first', 'B', 1),
  ('What does ''go small'' mean in The One Thing?', 'Think tiny goals forever', 'Narrow focus to the highest-leverage priority to achieve big results', 'Avoid ambition', 'Do only easy tasks', 'B', 2),
  ('Why does Keller emphasize time blocking?', 'Schedules don’t matter', 'To protect a non-negotiable period for the ONE Thing before interruptions win', 'To fill the day with meetings', 'To multitask better', 'B', 3),
  ('What is the domino metaphor about?', 'Playing games at work', 'Lining up priorities so successive successes unlock larger outcomes', 'Knocking over competitors personally', 'Avoiding planning', 'B', 4),
  ('When should you typically do your ONE Thing, per Keller’s willpower view?', 'When completely exhausted', 'When willpower and energy are freshest — often early', 'Only on weekends', 'After all emails are zero', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
