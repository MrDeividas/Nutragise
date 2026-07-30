DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Subtle Art of Not Giving a F*ck');
DELETE FROM public.information WHERE title = 'The Subtle Art of Not Giving a F*ck';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Subtle Art of Not Giving a F*ck',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Not giving a f*ck is selective</h2>
<ul><li>Care deeply about few things that matter; stop bleeding attention everywhere.</li></ul>
<h2>2. The backwards law and Feedback Loop from Hell</h2>
<ul><li>Chasing constant positivity backfires; judging yourself for feeling bad multiplies suffering.</li></ul>
<h2>3. Choose better values</h2>
<ul><li>Good values are reality-based, controllable, and constructive.</li></ul>
<h2>4. Responsibility over fault</h2>
<ul><li>You may not be at fault for everything — you are responsible for your response.</li></ul>
<h1>PART 2 — THE SUBTLE ART OF NOT GIVING A F*CK</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: A counterintuitive approach</h3>
<p>Mark Manson’s The Subtle Art of Not Giving a F*ck argues that the constant pursuit of feeling good can make us more fragile. Modern culture sells endless positivity and self-esteem; Manson answers with a blunt alternative: life involves pain, and maturity is choosing values carefully so your limited care goes somewhere worthy.</p>
<p>The title is deliberately crude, but the thesis is disciplined. “Not giving a f*ck” does not mean apathy. It means selectively allocating concern. You will always care about something; the art is not caring about everything.</p>
<p>Struggle is unavoidable. The question becomes which struggle you choose — and which values make that struggle meaningful.</p>
<p>Manson’s blunt style is a delivery system for stoic-ish ideas: suffering is inevitable, entitlement is fragile, and meaning comes from chosen values rather than constant pleasure. The swearing is bait; the ethics are the meal.</p>
<p>Good values produce better problems. If you value continual growth, your problems are training plans and feedback. If you value never being disliked, your problems are endless shape-shifting and resentment.</p>
<p><strong>Lesson:</strong> Stop chasing perpetual feel-good vibes; selectively care about what truly matters.</p>
<h3>Chapter 2: The backwards law</h3>
<p>The backwards law (drawn from Alan Watts’ themes) says that pursuing a positive experience as an end in itself can be a negative experience — while accepting negative experience can open the door to a positive one. Chasing happiness frantically often produces anxiety about not being happy enough.</p>
<p>Trying to force constant positivity becomes its own burden. Accepting hard truths — that you are insecure sometimes, that projects fail, that you are not exceptional at everything — can free energy for honest living.</p>
<p>Manson’s tone is anti-entitlement: you are not owed a painless life. You are free to choose better problems.</p>
<p>The backwards law punctures the happiness industry. The more desperately you need to feel amazing, the more your life becomes a referendum on every mood. Accepting ordinary pain reduces the second-order panic about pain.</p>
<p>Bad values often depend on other people or on external events you do not control — absolute certainty, perpetual superiority, constant validation. They keep you reactive. Controllable values return you to agency.</p>
<p><strong>Lesson:</strong> Accept that chasing constant positivity can backfire — willingness to face struggle can be liberating.</p>
<h3>Chapter 3: The Feedback Loop from Hell</h3>
<p>The Feedback Loop from Hell is Manson’s name for feeling bad, then feeling bad about feeling bad. You are anxious — then ashamed of being anxious — then anxious about the shame. Self-judgment multiplies ordinary negative emotion into a spiral.</p>
<p>Short-circuit the loop by not condemning yourself for having normal negative emotions. Feeling fear or sadness is human; adding a second layer of “I shouldn’t feel this” is optional suffering.</p>
<p>This is subtler than “think happy thoughts.” It is permission to feel without turning feelings into a moral failure.</p>
<p>The Feedback Loop from Hell is extremely common in anxiety and shame. The first feeling is often workable; the self-attack about the first feeling is what becomes disabling. Drop the moral verdict on your emotions and the spiral loses a gear.</p>
<p>Fault vs responsibility is one of Manson’s most useful distinctions for trauma and luck. Fault asks who caused it. Responsibility asks who will steer what happens now. You can reject false blame and still pick up the wheel.</p>
<p><strong>Lesson:</strong> When you feel bad, do not multiply it by judging yourself for feeling bad.</p>
<h3>Chapter 4: You will always give a f*ck about something</h3>
<p>Attention and emotional energy are limited. If you give a f*ck about every insult, every social comparison, every trivial inconvenience, you have nothing left for the few domains that deserve you — relationships, craft, integrity, health.</p>
<p>Maturity, for Manson, looks like fewer but deeper concerns. Superficial people dilute care across endless micro-dramas. People with better priorities accept tradeoffs: saying no, disappointing some expectations, letting minor battles go.</p>
<p>The practical test: What are you willing to suffer for? That answer reveals your real values better than your Instagram captions.</p>
<p>Selective caring is a scarcity strategy for attention. Treat f*cks given like a budget. Overspending on petty offenses underfunds the few people and projects that deserve your life force.</p>
<p>Choosing your struggle is the book’s mature ending. Everyone suffers; not everyone suffers for a purpose they respect. Pick values, accept the pain that comes with them, and stop giving a f*ck about the rest.</p>
<p><strong>Lesson:</strong> Spend your limited care on chosen priorities — stop bleeding attention into everything.</p>
<h3>Chapter 5: Good values vs bad values</h3>
<p>Manson contrasts shaky values with better ones. Bad values tend to be superstitious, socially destructive, or not immediate/controllable — pleasure-only, always being right, constant positivity as performance, staying the victim as identity. Good values are reality-based, socially constructive, immediate, and controllable — honesty, curiosity, responsibility, creativity.</p>
<p>Values determine the quality of your problems. If your value is “always be the best,” every rival is a crisis. If your value is “be honest,” the work is clearer and more under your influence.</p>
<p>Choosing values is choosing your struggle. There is no value-neutral life; there is only unconscious inheritance versus deliberate selection.</p>
<p>Good values produce better problems. If you value continual growth, your problems are training plans and feedback. If you value never being disliked, your problems are endless shape-shifting and resentment.</p>
<p>Manson’s blunt style is a delivery system for stoic-ish ideas: suffering is inevitable, entitlement is fragile, and meaning comes from chosen values rather than constant pleasure. The swearing is bait; the ethics are the meal.</p>
<p><strong>Lesson:</strong> Prefer reality-based, controllable values like honesty, curiosity, and responsibility over fragile ego metrics.</p>
<h3>Chapter 6: Fault vs responsibility — choose your struggle</h3>
<p>Manson separates fault from responsibility. You might not be at fault for what happened to you — abuse, luck, unfair systems. You remain responsible for what you do next. Ownership is empowering, not a blame game; it returns agency.</p>
<p>People often avoid responsibility because it hurts to admit influence over their problems. But without responsibility, you wait forever for the world to fix your life.</p>
<p>The Subtle Art’s closing posture: life will have problems. Pick problems that align with values you respect — and stop giving your energy to everything else. That is the subtle art.</p>
<p>Bad values often depend on other people or on external events you do not control — absolute certainty, perpetual superiority, constant validation. They keep you reactive. Controllable values return you to agency.</p>
<p>The backwards law punctures the happiness industry. The more desperately you need to feel amazing, the more your life becomes a referendum on every mood. Accepting ordinary pain reduces the second-order panic about pain.</p>
<p><strong>Lesson:</strong> You may not be at fault for an event, but you are responsible for your response — choose struggles that match good values.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg',
    'Mark Manson’s counterintuitive guide to values — the backwards law, Feedback Loop from Hell, choosing what to care about, and responsibility over fault.'
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
  ('What is the Feedback Loop from Hell?', 'A workout plan', 'Feeling bad, then judging yourself for feeling bad, which multiplies suffering', 'A savings method', 'A networking strategy', 'B', 1),
  ('What does Manson say about ''not giving a f*ck''?', 'Care about nothing forever', 'Selectively care about what truly matters; stop wasting care everywhere', 'Never feel emotions', 'Avoid all responsibility', 'B', 2),
  ('Which are closer to Manson’s ''good values''?', 'Always being right and endless pleasure-chasing', 'Honesty, curiosity, and responsibility', 'Never being wrong', 'Constant performed positivity only', 'B', 3),
  ('What is the fault vs responsibility distinction?', 'They are identical', 'You may not be at fault for an event, but you are responsible for your response', 'Responsibility means blaming yourself for everything', 'Fault means you must fix others', 'B', 4),
  ('What is the backwards law idea in the book?', 'Wanting only positivity can create more negativity; accepting struggle can help', 'Always avoid hard things', 'Success needs zero discomfort', 'Feelings should be ignored permanently', 'A', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
