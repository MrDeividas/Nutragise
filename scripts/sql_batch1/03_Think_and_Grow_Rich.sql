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
