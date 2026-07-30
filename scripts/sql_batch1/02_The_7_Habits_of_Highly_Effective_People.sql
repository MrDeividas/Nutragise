DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The 7 Habits of Highly Effective People');
DELETE FROM public.information WHERE title = 'The 7 Habits of Highly Effective People';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The 7 Habits of Highly Effective People',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Character over personality</h2>
<ul><li>Lasting effectiveness comes from principles and character, not quick techniques.</li></ul>
<h2>2. Private victory first</h2>
<ul><li>Habits 1–3 build independence: proactive choice, vision, and priority.</li></ul>
<h2>3. Public victory next</h2>
<ul><li>Habits 4–6 build interdependence: win-win, empathic listening, synergy.</li></ul>
<h2>4. Renewal</h2>
<ul><li>Habit 7 — Sharpen the Saw — sustains all the others.</li></ul>
<h1>PART 2 — THE 7 HABITS OF HIGHLY EFFECTIVE PEOPLE</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: A principle-centered approach</h3>
<p>Stephen R. Covey’s The 7 Habits of Highly Effective People (1989) argues that real effectiveness grows from character and timeless principles, not from personality tricks or quick social techniques. Covey contrasts the “Character Ethic” with the “Personality Ethic”: the former builds integrity and alignment with principles; the latter chases image, tactics, and short-term influence.</p>
<p>Covey organizes the habits along a maturity continuum: dependence → independence (private victory) → interdependence (public victory). You cannot skip the private victory and expect healthy interdependence. Renewal (Habit 7) surrounds and sustains the whole journey.</p>
<p>The book’s promise is practical: if you internalize principles — responsibility, vision, prioritization, mutual benefit, understanding, creative cooperation, and continuous renewal — effectiveness becomes a way of being rather than a performance you put on.</p>
<p>Covey’s Character Ethic claims that lasting trust is an inside-out job: private integrity becomes public credibility. Techniques without character eventually collapse under pressure, because people sense incongruence. The 7 Habits are therefore not seven tips — they are a sequential maturation path.</p>
<p>Win/Win is not niceness and not soft negotiation. It requires courage plus consideration: enough courage to advocate your needs, enough consideration to honor theirs. If Win/Win is impossible, Covey prefers No Deal over forced Lose/Win peacekeeping that breeds resentment.</p>
<p><strong>Lesson:</strong> Build effectiveness on character and principles, not on personality techniques alone.</p>
<h3>Chapter 2: Habit 1 — Be Proactive</h3>
<p>Between stimulus and response, Covey says, humans have freedom to choose. Proactivity is not merely taking initiative; it is taking responsibility for your response based on values. Reactive people are driven by moods, weather, and other people’s behavior. Proactive people act from chosen principles.</p>
<p>Covey’s Circle of Concern vs Circle of Influence is central here. The Circle of Concern includes everything you care about — much of which you cannot control. The Circle of Influence includes what you can affect through your choices. Proactive people expand influence by working inside that circle; reactive people shrink it by living in blame and complaint.</p>
<p>Language reveals the difference: “There’s nothing I can do” versus “Let’s look at alternatives.” Habit 1 is the foundation because without response-ability, the other habits have no engine.</p>
<p>Proactivity also shows up in language and focus. When you catch yourself saying “I have to” or “That’s just how I am,” Covey invites a rewrite toward choice: “I choose,” “I prefer,” “I will.” Those linguistic shifts are not word games; they train responsibility.</p>
<p>Empathic listening is demanding because you must set aside your autobiography long enough to inhabit another frame. Most “listening” is loading a reply. Habit 5 says diagnosis precedes prescription — in medicine and in human conversation.</p>
<p><strong>Lesson:</strong> Focus energy on your Circle of Influence — choose your response instead of being driven by conditions.</p>
<h3>Chapter 3: Habit 2 — Begin with the End in Mind</h3>
<p>Covey teaches that all things are created twice: first mentally, then physically. Begin with the End in Mind means clarifying what “done well” looks like before you invest days in activity. Without a personal vision, you can climb the ladder of success only to find it leaning against the wrong wall.</p>
<p>A personal mission statement is Covey’s practical tool: a written constitution for your life covering roles, values, and contribution. It becomes a criterion for decisions. When opportunities conflict, you return to the end you defined.</p>
<p>This habit is about leadership of self. Management asks how to do things efficiently; leadership asks whether you are doing the right things. Habit 2 provides the compass.</p>
<p>Begin with the End in Mind applies at multiple scales: a life mission, a week’s roles, a meeting’s purpose, a conversation’s desired outcome. Without a mental creation first, physical effort scatters. Leadership decides what “done” means; management then schedules the how.</p>
<p>Synergy depends on valuing difference rather than merely tolerating it. When teams suppress dissent to stay comfortable, they get compromise at best. When they explore conflict with trust, they can invent third alternatives neither side brought into the room.</p>
<p><strong>Lesson:</strong> Define a clear personal vision or mission so daily action aligns with who you want to become.</p>
<h3>Chapter 4: Habit 3 — Put First Things First</h3>
<p>Habit 3 is personal management in action — putting first things first. Covey’s time matrix distinguishes urgent vs important. Many people live in Quadrant I (urgent and important crises) or Quadrant III (urgent but unimportant interruptions). Effectiveness grows in Quadrant II: important but not urgent work — prevention, relationships, planning, renewal.</p>
<p>Putting first things first requires saying no to good opportunities that are not aligned with your mission. Efficiency is not enough if you are efficiently doing the wrong things. Schedule priorities; do not prioritize whatever shows up on the schedule.</p>
<p>Together, Habits 1–3 form the Private Victory: independence. You become a person who chooses, aims, and executes on what matters — reliable with yourself before asking deep trust from others.</p>
<p>Quadrant II living requires saying no — sometimes to good, urgent-feeling requests that do not serve your mission. Covey’s point is that if you do not prioritize your life, someone else will fill your calendar for you. Importance is a values decision, not an inbox decision.</p>
<p>Sharpen the Saw is preventive maintenance for the human instrument. Sleep, exercise, reading, deep relationships, and reconnection to purpose are not rewards after effectiveness — they are prerequisites for sustained effectiveness. Neglect renewal and Habits 1–6 quietly decay.</p>
<p><strong>Lesson:</strong> Prioritize important (often non-urgent) work over the merely urgent noise.</p>
<h3>Chapter 5: Habits 4–5 — Think Win/Win and Seek First to Understand</h3>
<p>Habit 4, Think Win/Win, seeks mutually beneficial agreements. It rests on an abundance mindset: there is enough for creative solutions where both sides can succeed. Win/Lose and Lose/Win are common defaults; Win/Win requires character (integrity, maturity, abundance) and supportive systems of agreements.</p>
<p>Habit 5, Seek First to Understand, Then to Be Understood, is Covey’s communication keystone. Most people listen with the intent to reply. Empathic listening — seeking to understand another’s frame of reference — comes before advocacy. Influence grows when people feel understood.</p>
<p>Covey notes you diagnose before you prescribe. In relationships and leadership, premature advice is a form of disrespect. Understanding first creates the emotional bank account that makes your later words land.</p>
<p>Win/Win is not niceness and not soft negotiation. It requires courage plus consideration: enough courage to advocate your needs, enough consideration to honor theirs. If Win/Win is impossible, Covey prefers No Deal over forced Lose/Win peacekeeping that breeds resentment.</p>
<p>Covey’s Character Ethic claims that lasting trust is an inside-out job: private integrity becomes public credibility. Techniques without character eventually collapse under pressure, because people sense incongruence. The 7 Habits are therefore not seven tips — they are a sequential maturation path.</p>
<p><strong>Lesson:</strong> Pursue mutual benefit, and listen empathically before you try to persuade.</p>
<h3>Chapter 6: Habit 6 — Synergize</h3>
<p>Synergy is creative cooperation: the whole is greater than the sum of its parts. Habit 6 values differences — of perspective, strength, and experience — as fuel for third alternatives neither side imagined alone. Compromise splits the difference; synergy invents a better way.</p>
<p>Synergy requires the private victory (you can be open without collapsing) and Habits 4–5 (trust and understanding). Without those foundations, “brainstorming” becomes politics or conflict avoidance.</p>
<p>In practice, synergy looks like genuine curiosity about disagreement: What does this person see that I am missing? How could both of our concerns be honored in a new design?</p>
<p>Empathic listening is demanding because you must set aside your autobiography long enough to inhabit another frame. Most “listening” is loading a reply. Habit 5 says diagnosis precedes prescription — in medicine and in human conversation.</p>
<p>Proactivity also shows up in language and focus. When you catch yourself saying “I have to” or “That’s just how I am,” Covey invites a rewrite toward choice: “I choose,” “I prefer,” “I will.” Those linguistic shifts are not word games; they train responsibility.</p>
<p><strong>Lesson:</strong> Treat differences as raw material for third alternatives, not as threats.</p>
<h3>Chapter 7: Habit 7 — Sharpen the Saw</h3>
<p>Habit 7 is renewal across four dimensions: physical (body), mental (mind), social/emotional (relationships), and spiritual (purpose/values). Covey’s metaphor is the lumberjack too busy cutting to sharpen the saw — activity without renewal decays performance.</p>
<p>Renewal is not optional self-care fluff; it is what makes Habits 1–6 sustainable. Without rest, learning, relationship investment, and reconnection to purpose, proactive energy drains and you slide back into reactivity.</p>
<p>The maturity continuum ends not at independence but at interdependence — plus continuous renewal. Private victory, public victory, then keep the instrument sharp.</p>
<p>Synergy depends on valuing difference rather than merely tolerating it. When teams suppress dissent to stay comfortable, they get compromise at best. When they explore conflict with trust, they can invent third alternatives neither side brought into the room.</p>
<p>Begin with the End in Mind applies at multiple scales: a life mission, a week’s roles, a meeting’s purpose, a conversation’s desired outcome. Without a mental creation first, physical effort scatters. Leadership decides what “done” means; management then schedules the how.</p>
<p><strong>Lesson:</strong> Renew regularly in physical, mental, social/emotional, and spiritual dimensions so the other habits can last.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781982137137-L.jpg',
    'Stephen R. Covey’s principle-centered classic: seven habits that move you from dependence to independence to interdependence.'
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
  ('What is Habit 1 in Covey’s framework?', 'Sharpen the Saw', 'Be Proactive', 'Synergize', 'Think Win/Win', 'B', 1),
  ('Habits 1–3 are mainly about achieving what?', 'Interdependence', 'Independence (private victory)', 'Retirement', 'Popularity', 'B', 2),
  ('What does ''Begin with the End in Mind'' emphasize?', 'Multitasking', 'A clear personal vision / mission before acting', 'Ignoring values', 'Working longer hours', 'B', 3),
  ('What is Habit 5?', 'Seek First to Understand, Then to Be Understood', 'Always speak first', 'Avoid conflict', 'Put First Things First', 'A', 4),
  ('What does Sharpen the Saw mean?', 'Buy new tools only', 'Renew physical, mental, social/emotional, and spiritual capacity', 'Cut people out of your life', 'Work without breaks', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
