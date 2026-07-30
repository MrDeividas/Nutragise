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
DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Think and Grow Rich');
DELETE FROM public.information WHERE title = 'Think and Grow Rich';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Think and Grow Rich',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Desire starts everything</h2>
<ul><li>A definite, burning desire — not a vague wish — is the starting point of achievement.</li></ul>
<h2>2. Faith + auto-suggestion</h2>
<ul><li>Belief programmed through emotionalized repetition reaches the subconscious.</li></ul>
<h2>3. Knowledge and plans</h2>
<ul><li>Specialized knowledge plus organized planning turn desire into action.</li></ul>
<h2>4. Decision, persistence, Master Mind</h2>
<ul><li>Decide promptly, persist through temporary defeat, and ally with harmonious minds.</li></ul>
<h1>PART 2 — THINK AND GROW RICH</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: A philosophy of achievement</h3>
<p>Napoleon Hill’s Think and Grow Rich (1937) presents a success philosophy focused on converting a definite desire into its physical equivalent. Written after years of studying successful people (famously inspired by Andrew Carnegie’s challenge), the book treats “riches” broadly — money, yes, but also the mental habits that produce achievement.</p>
<p>Hill’s approach mixes practical steps with mental conditioning: clarify desire, build faith, use auto-suggestion, acquire specialized knowledge, organize plans, decide quickly, persist, and form a Master Mind alliance. Critics debate some of Hill’s storytelling; the enduring value is the structured insistence that vague wishing is not a plan.</p>
<p>Read as a system, the book says achievement is not accidental. It is desire made definite, believed emotionally, supported by knowledge, executed through plans, and sustained by persistence and alliance.</p>
<p>Hill’s larger claim is that thoughts mixed with definiteness of purpose, persistence, and burning desire can be transmuted into riches — not by magic alone, but by organizing the mind so behavior follows. The book is a mental conditioning system attached to practical action steps.</p>
<p>Specialized knowledge can be hired or allied. Hill’s point frees perfectionists who think they must personally master every domain before starting. Organize knowledge toward a purpose; do not confuse collecting facts with applying them.</p>
<p><strong>Lesson:</strong> Treat success as a definite desire translated into belief, knowledge, plans, and persistence — not as a vague wish.</p>
<h3>Chapter 2: Desire — the starting point</h3>
<p>Hill insists wishing is not enough. The starting point of all achievement is a burning, definite desire. He outlines a practical formula: fix in your mind the exact amount or aim you want; determine what you will give in return; establish a definite date; create a definite plan and begin at once; write a clear statement of aim, timeline, and plan; read that statement aloud twice daily with feeling — night and morning.</p>
<p>Specificity matters. “I want to be rich someday” has no purchase on the subconscious or the calendar. A written, dated, emotionally charged aim becomes a daily instruction. Desire without definiteness dissipates; desire with definiteness organizes attention.</p>
<p>Hill’s tone is uncompromising: temporary defeat is not failure if desire remains. The desire is the constant; methods may change.</p>
<p>The six-step desire method is designed to make goals sensory and urgent: exact aim, exchange of value, deadline, immediate action, written statement, and emotionalized daily reading. Hill wants desire to occupy both conscious attention and subconscious expectancy.</p>
<p>Organized planning includes building a practical alliance and testing plans in the world. When a plan fails, Hill’s instruction is clinical: replace the plan. Temporary defeat is a signal to revise methods, not a verdict on the worthiness of the desire.</p>
<p><strong>Lesson:</strong> Replace vague wishes with a burning, written, dated desire you review daily with emotion.</p>
<h3>Chapter 3: Faith and auto-suggestion</h3>
<p>Faith, for Hill, is the visualization of and belief in attainment of desire. It is a mental state that can be induced by affirmation and repeated instructions to the subconscious mind. Doubt and fear are faith in reverse — emotionalized beliefs that also program behavior.</p>
<p>Auto-suggestion is the bridge: self-administered suggestion. Hill argues that thoughts mixed with emotion and repeated reach the subconscious and influence action. Empty, mechanical repetition does little; emotionalized repetition matters. You are both the sender and receiver of the message.</p>
<p>Together, faith and auto-suggestion are Hill’s conditioning engine. You do not wait to “feel ready.” You deliberately feed the mind images and statements aligned with the definite desire until belief becomes more natural than disbelief.</p>
<p>Faith, in Hill’s usage, is not necessarily religious doctrine; it is conviction that the desire is attainable. He warns that fear and doubt are also “faith” of a destructive kind — emotionalized beliefs that program hesitation and self-sabotage.</p>
<p>Decision, for Hill, is a habit of mind. People who poll every acquaintance before choosing often inherit confusion. Prompt decision protects purpose from dilution; slow change of decision protects plans from every passing opinion.</p>
<p><strong>Lesson:</strong> Strengthen faith through emotionalized auto-suggestion — repeated, felt instructions to your subconscious.</p>
<h3>Chapter 4: Specialized knowledge and organized planning</h3>
<p>Hill distinguishes general knowledge from specialized knowledge. Specialized knowledge is what you apply toward a definite purpose — and you need not personally possess every piece of it. You can organize access through education, experience, and alliances (the Master Mind).</p>
<p>Knowledge becomes power only when organized into definite plans of action and directed toward a goal. Hill emphasizes organized planning: create a plan, put it into action, and if it fails, replace it with a new plan. Do not abandon the desire because a method failed.</p>
<p>This is one of the book’s most practical corrections to magical thinking. Desire and faith without plans are daydreams. Plans without desire and persistence are brittle. The combination is the working philosophy.</p>
<p>Auto-suggestion fails when practiced as dry memorization. Hill insists on feeling: read your written statement with emotion, visualize possession of the aim, and refuse to dwell on the opposite. The subconscious, he argues, responds to emotionalized thought.</p>
<p>Persistence is cultivated by habit. Surround yourself with reminders of purpose, reduce negative influences, and keep acting after enthusiasm cools. The Master Mind then multiplies persistence by adding courage, accountability, and complementary skill when solo willpower dips.</p>
<p><strong>Lesson:</strong> Apply specialized knowledge through definite plans — and replace failed plans without quitting the desire.</p>
<h3>Chapter 5: Decision and persistence</h3>
<p>Hill observes that successful people reach decisions promptly and change them slowly. Unsuccessful people decide slowly and change often — often under the influence of others’ opinions. Procrastination is a decision by default.</p>
<p>Persistence is the sustained effort necessary to induce faith and carry plans through temporary defeat. Hill lists causes of persistence failure (indefinite purpose, lack of desire, fear of criticism) and treats persistence as a state of mind that can be cultivated: definite purpose, desire, self-reliance, accurate knowledge, willpower, habit.</p>
<p>Temporary defeat is information. Quitting converts defeat into failure. Decision gets you moving; persistence keeps you in the game long enough for a workable plan to succeed.</p>
<p>Specialized knowledge can be hired or allied. Hill’s point frees perfectionists who think they must personally master every domain before starting. Organize knowledge toward a purpose; do not confuse collecting facts with applying them.</p>
<p>Hill’s larger claim is that thoughts mixed with definiteness of purpose, persistence, and burning desire can be transmuted into riches — not by magic alone, but by organizing the mind so behavior follows. The book is a mental conditioning system attached to practical action steps.</p>
<p><strong>Lesson:</strong> Decide promptly, change slowly, and treat persistence as the bridge across temporary defeat.</p>
<h3>Chapter 6: The Master Mind alliance</h3>
<p>The Master Mind principle is the coordination of knowledge and effort in a spirit of harmony between two or more people, for the attainment of a definite purpose. Hill claims this alliance creates a “third mind” — a multiplier of courage, ideas, and accountability beyond solo effort.</p>
<p>Harmony is non-negotiable. A group in conflict is not a Master Mind; it is friction. Choose people whose abilities complement yours and whose commitment to the purpose is real. Carnegie, in Hill’s telling, attributed much of his success to organizing such alliances.</p>
<p>Think and Grow Rich closes its practical arc here: definite desire, programmed faith, applied knowledge, organized plans, firm decisions, persistence — and other minds in harmony so you are not carrying the entire load alone.</p>
<p>Organized planning includes building a practical alliance and testing plans in the world. When a plan fails, Hill’s instruction is clinical: replace the plan. Temporary defeat is a signal to revise methods, not a verdict on the worthiness of the desire.</p>
<p>The six-step desire method is designed to make goals sensory and urgent: exact aim, exchange of value, deadline, immediate action, written statement, and emotionalized daily reading. Hill wants desire to occupy both conscious attention and subconscious expectancy.</p>
<p><strong>Lesson:</strong> Form a harmonious Master Mind alliance around a definite purpose to multiply knowledge and resolve.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg',
    'Napoleon Hill’s classic success philosophy — burning desire, faith, auto-suggestion, specialized knowledge, organized planning, and the Master Mind.'
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
  ('What does Hill say is the starting point of all achievement?', 'Luck', 'A burning, definite desire', 'A large inheritance', 'A perfect resume', 'B', 1),
  ('What is auto-suggestion in Think and Grow Rich?', 'Asking strangers for advice once', 'Self-suggestion that influences the subconscious through emotionalized repetition', 'Ignoring your goals', 'Only writing goals once', 'B', 2),
  ('According to Hill, what should you do if a plan fails?', 'Quit the desire', 'Replace the plan and continue', 'Hide the failure', 'Wait a year without acting', 'B', 3),
  ('What is the Master Mind principle?', 'Working entirely alone forever', 'A harmonious alliance of minds toward a definite purpose', 'Memorizing quotes', 'Avoiding mentors', 'B', 4),
  ('How does Hill say faith can be strengthened?', 'By never thinking about goals', 'Through affirmation and repeated instructions to the subconscious', 'By sleeping more only', 'By avoiding written goals', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Psychology of Money');
DELETE FROM public.information WHERE title = 'The Psychology of Money';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Psychology of Money',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Behavior beats brilliance</h2>
<ul><li>Soft skills with money matter more than raw IQ or complex formulas.</li></ul>
<h2>2. Compounding needs time</h2>
<ul><li>Wealth often comes from good returns left uninterrupted for decades.</li></ul>
<h2>3. Getting vs staying wealthy</h2>
<ul><li>Optimism builds wealth; humility and caution help keep it.</li></ul>
<h2>4. Enough, margin, flexibility</h2>
<ul><li>Define enough, leave room for error, and save for control over your time.</li></ul>
<h1>PART 2 — THE PSYCHOLOGY OF MONEY</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Money is a behavior story</h3>
<p>Morgan Housel’s The Psychology of Money (2020) argues that financial success depends more on how you behave than on what you know. Brilliant people can go broke; ordinary savers can become wealthy. The difference is rarely a secret spreadsheet. It is temperament, patience, ego management, and the ability to stick with a plan.</p>
<p>Housel writes in short essays rather than a single theorem. The through-line is that money decisions are made by humans with histories, insecurities, and social pressures — not by calculators. Studying behavior is therefore not soft; it is the main event.</p>
<p>If you only optimize returns and ignore psychology, you design a strategy you will abandon under stress. The book’s invitation is to build a financial life you can actually live with.</p>
<p>Housel’s essays keep returning to a humble truth: financial outcomes are heavily influenced by luck, timing, and behavior under stress. Studying formulas without studying yourself leaves the largest variable unmanaged.</p>
<p>“Enough” is a psychological asset. Without it, every raise becomes the new baseline and every peer becomes a rival. With it, you can decline risks that exist only to feed ego or status anxiety.</p>
<p><strong>Lesson:</strong> Prioritize behavior and temperament with money over the pursuit of pure technical brilliance.</p>
<h3>Chapter 2: No one’s crazy — and compounding confounds</h3>
<p>Housel opens with empathy: no one’s crazy. Everyone’s views about money are shaped by personal history — inflation they lived through, jobs they lost, booms they witnessed. What looks irrational from the outside often makes sense inside someone’s lived experience.</p>
<p>Compounding is “confounding” because its power is easy to underestimate. Extraordinary outcomes often come less from the highest return this year and more from returns sustained without interruption for decades. Longevity in the game beats brilliant timing that you cannot stick with.</p>
<p>This reframes investing: the edge is often survival and consistency. Interrupt compounding with panic selling, leverage blowups, or lifestyle resets, and the math never gets to work.</p>
<p>“No one’s crazy” is an empathy tool and a caution. Before mocking another investor’s choices, remember their scar tissue differs from yours. Before copying a guru’s risk tolerance, remember their history, wealth, and obligations are not yours.</p>
<p>Room for error is how ordinary plans survive an extraordinary world. Markets, careers, and health do not follow your spreadsheet. Slack — cash, time, conservative assumptions — is what keeps compounding alive through surprises.</p>
<p><strong>Lesson:</strong> Respect that money views are personal — and protect long, uninterrupted compounding.</p>
<h3>Chapter 3: Getting wealthy vs staying wealthy</h3>
<p>Getting money and keeping money are different skills. Getting wealthy can require optimism, risk-taking, and boldness. Staying wealthy requires humility and a kind of paranoia about ruin — respect for what luck contributed and what a single bad decision can erase.</p>
<p>Housel emphasizes that survival matters more than maximization. A strategy with a small chance of catastrophic loss can be fatal even if the average outcome looks attractive. Staying in the game is the strategy.</p>
<p>This is why room for error and “enough” appear again and again. Ego says maximize. Survival says endure.</p>
<p>Compounding confounds because the big gains often arrive late. People quit strategies that are working slowly because the early years feel pointless. The investors who look like geniuses in hindsight are frequently the ones who simply did not interrupt the process.</p>
<p>Saving’s hidden return is control over your calendar. Money that buys options — to wait, retrain, leave a bad situation, support family — can matter more than money that buys another upgrade.</p>
<p><strong>Lesson:</strong> Use boldness to build wealth and humility — plus caution about ruin — to keep it.</p>
<h3>Chapter 4: Define “enough”</h3>
<p>Without a sense of enough, the goalposts move forever. Someone always has a nicer house, a hotter return, a more impressive lifestyle. If your happiness depends on beating a moving social target, risk-taking may never stop — and one unnecessary risk can undo years of progress.</p>
<p>Defining enough is not anti-ambition. It is anti-comparison as a bottomless hole. Enough creates the possibility of contentment and the ability to stop playing games that are no longer worth the downside.</p>
<p>Housel’s warning is psychological: social comparison and ego are expensive. Knowing enough protects you from decisions made to impress people you do not care about.</p>
<p>Getting wealthy can reward boldness; staying wealthy rewards paranoia about permanent loss. Housel’s pairing explains many blowups: someone brilliant at offense never learned defense, and one catastrophic mistake erased a lifetime of good ones.</p>
<p>Reasonable > rational is permission to design around human nature. A barbell of safety plus long-term ownership, or automatic saving you barely notice, may beat an optimal model that requires saintly discipline you do not have.</p>
<p><strong>Lesson:</strong> Define what “enough” means for you so goalposts stop moving and ego-driven risk loses its grip.</p>
<h3>Chapter 5: Room for error and the gap between plans and reality</h3>
<p>The most important part of a plan, Housel suggests, is planning on the plan not going according to plan. Room for error — a margin of safety — is what lets you survive surprises: job loss, market crashes, medical bills, bad timing.</p>
<p>Margin of safety is not pessimism; it is what allows optimism to compound. If every dollar is leveraged and every assumption must be correct, one shock ends the story. If you have slack, you can be wrong and still continue.</p>
<p>In practice this looks like lower leverage, cash buffers, diversified risk, and not needing the absolute maximum return to meet your goals.</p>
<p>“Enough” is a psychological asset. Without it, every raise becomes the new baseline and every peer becomes a rival. With it, you can decline risks that exist only to feed ego or status anxiety.</p>
<p>Housel’s essays keep returning to a humble truth: financial outcomes are heavily influenced by luck, timing, and behavior under stress. Studying formulas without studying yourself leaves the largest variable unmanaged.</p>
<p><strong>Lesson:</strong> Build a margin of safety so you can survive when plans go wrong and stay invested long enough to compound.</p>
<h3>Chapter 6: Saving for flexibility — and being reasonable</h3>
<p>Saving is often framed as delayed purchasing power. Housel adds a richer return: savings buy flexibility and control over your time. The ability to wait, to walk away, to take a breath — that optionality is one of money’s highest yields.</p>
<p>He also argues that reasonable beats rational. A theoretically optimal strategy you abandon in a panic is worse than a slightly suboptimal strategy you can stick with for decades. Your own psychology is a constraint; design around it.</p>
<p>The Psychology of Money’s closing mood is humility: history is full of surprises, luck plays a role, and the winners who endure are often those who stayed solvent, stayed patient, and stayed sane.</p>
<p>Room for error is how ordinary plans survive an extraordinary world. Markets, careers, and health do not follow your spreadsheet. Slack — cash, time, conservative assumptions — is what keeps compounding alive through surprises.</p>
<p>“No one’s crazy” is an empathy tool and a caution. Before mocking another investor’s choices, remember their scar tissue differs from yours. Before copying a guru’s risk tolerance, remember their history, wealth, and obligations are not yours.</p>
<p><strong>Lesson:</strong> Save for freedom over your time, and prefer a reasonable plan you can stick with over a perfect plan you will abandon.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
    'Morgan Housel’s essays on how behavior — not spreadsheets — drives financial outcomes: compounding, enough, room for error, and being reasonable.'
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
  ('What does Housel argue matters more than pure financial brilliance?', 'Secret stock tips', 'Behavior and temperament with money', 'Knowing every tax loophole on day one', 'Never saving', 'B', 1),
  ('Why is compounding ''confounding'' in Housel’s telling?', 'It only works for one year', 'Its power is easy to underestimate and requires long, uninterrupted time', 'It requires daily trading', 'It only applies to cash under a mattress', 'B', 2),
  ('What is ''room for error''?', 'Ignoring all risk', 'A margin of safety so you can survive when plans go wrong', 'Maxing leverage', 'Never investing', 'B', 3),
  ('What danger comes from never defining ''enough''?', 'You save too much automatically', 'Goalposts keep moving and risk-taking may never stop', 'You become too humble', 'Compounding speeds up too much', 'B', 4),
  ('According to Housel, what can saving buy beyond purchases?', 'Only status', 'Flexibility and control over your time', 'Guaranteed market timing', 'Freedom from all emotions', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
