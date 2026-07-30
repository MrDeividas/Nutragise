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
