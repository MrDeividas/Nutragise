DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Power of Now');
DELETE FROM public.information WHERE title = 'The Power of Now';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Power of Now',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Only Now is real</h2>
<ul><li>Psychological time (dwelling in past/future) fuels much unnecessary suffering.</li></ul>
<h2>2. Ego is mind-made identity</h2>
<ul><li>The ego sustains itself through stories, comparison, and resistance.</li></ul>
<h2>3. Observe the pain-body</h2>
<ul><li>Old emotional pain can act like an energy field that seeks more pain — until you witness it.</li></ul>
<h2>4. Presence dissolves identification</h2>
<ul><li>Attention in the Now — breath, inner body, watching — breaks fusion with thought.</li></ul>
<h1>PART 2 — THE POWER OF NOW</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Presence as freedom</h3>
<p>Eckhart Tolle’s The Power of Now teaches that lasting peace is found by entering the present moment and recognizing yourself as more than the stream of thoughts. The book is spiritual psychology: liberation comes not from improving every story in the mind, but from awakening as the awareness in which stories appear.</p>
<p>Tolle writes from the claim that identification with thinking — especially compulsive, repetitive thinking — is the root of much human suffering. The mind is a tool; problems begin when the tool uses you.</p>
<p>The invitation is simple and radical: give your fullest attention to this moment. The Now is not a concept; it is the field in which life actually happens.</p>
<p>Tolle’s teaching sits in a long contemplative tradition, expressed in contemporary language: peace is not found in rearranging every circumstance, but in awakening out of compulsive identification with thought.</p>
<p>Resistance is often subtle: chronic complaining, rehearsing arguments, denying what you feel. Tolle invites acceptance of the present moment’s is-ness as the foundation for intelligent response — not as passive surrender to injustice forever.</p>
<p><strong>Lesson:</strong> Seek peace by returning attention to the present moment rather than trying to perfect every mental story.</p>
<h3>Chapter 2: You are not your mind</h3>
<p>Tolle distinguishes awareness from thought content. You can observe a thought; therefore you are not identical to that thought. Suffering intensifies when you are completely fused with thinking — especially narratives about what went wrong or what might go wrong.</p>
<p>Watching the thinker creates a gap: thought continues, but you are no longer lost inside every sentence. That gap is the beginning of presence. Presence is not anti-intelligence; it is freedom from involuntary mental noise.</p>
<p>Practically, this means catching yourself mid-rumination and noticing: Thinking is happening. The noticing is already a different state than being the thought.</p>
<p>“You are not your mind” is liberating for overthinkers. The mind can plan and analyze; it can also generate endless commentary that adds suffering on top of life’s ordinary challenges. Awareness is the space in which both useful thought and noise arise.</p>
<p>The pain-body concept helps explain sudden emotional hijacks that seem larger than the trigger. Old pain wants more pain. Naming and watching the activation prevents the pain-body from recruiting your entire mind overnight.</p>
<p><strong>Lesson:</strong> Practice observing thoughts so you stop living as if you are identical to every mental narrative.</p>
<h3>Chapter 3: Psychological time vs clock time</h3>
<p>Clock time is practical — appointments, planning, learning from the past. Psychological time is living as if past and future are more real than Now: replaying regrets, rehearsing worries, dwelling in identity stories built from memory and anticipation.</p>
<p>Tolle argues that psychological time fuels unnecessary suffering. Anxiety and guilt pull attention out of the only place life occurs. Even goal pursuit can become an escape from the present if the future is treated as the only place fulfillment exists.</p>
<p>Use clock time; do not inhabit psychological time as your home. When you notice worry-futures or shame-pasts absorbing you, return to sense perception, breath, or the inner body.</p>
<p>Psychological time steals the only place change can occur. You cannot heal the past in the past; you meet the leftover emotion now. You cannot live the future in advance; you prepare now. Returning to Now is practical, not mystical escapism.</p>
<p>Inner-body awareness is a concrete practice: feel the aliveness in your hands, your breath, your feet on the floor. Sensation anchors attention where thought cannot dominate as easily.</p>
<p><strong>Lesson:</strong> Use clock time for practicality, but do not live inside past/future mental stories at the expense of Now.</p>
<h3>Chapter 4: Ego and resistance</h3>
<p>The egoic self is a mind-made identity that seeks to strengthen itself through comparison, complaint, roles, and control. It needs conflict and “otherness” to feel separate and important. Much of what we call “my problems” is the ego’s narrative maintenance.</p>
<p>Resistance to what is — mental refusal of the present fact — creates friction. Tolle is not saying never act to change circumstances. He is saying that unconscious inner resistance multiplies pain beyond the facts. You can respond to a situation without mentally fighting reality moment to moment.</p>
<p>Presence weakens ego because ego lives on identification with thought-forms. When attention rests in Now, the story-self has less fuel.</p>
<p>Ego thrives on narrative continuity: my story, my wounds, my importance, my enemies. Presence does not erase memory; it loosens the grip of story as absolute identity so you can act more cleanly.</p>
<p>Watching thoughts is not fighting thoughts. Fighting creates more mind. Watching creates space. In that space, Tolle says, presence — your deeper identity — becomes obvious.</p>
<p><strong>Lesson:</strong> Notice egoic comparison and resistance — respond to life without mentally fighting the present moment.</p>
<h3>Chapter 5: The pain-body</h3>
<p>Tolle describes accumulated emotional pain as a “pain-body” — an energy field of old emotion that can lie dormant, then activate. When active, it feeds on negative thinking and drama, seeking experiences that match its frequency.</p>
<p>The shift is to feel and observe it without becoming it. The moment you witness anger, heaviness, or victim narratives as the pain-body rather than as absolute truth, identification weakens. Presence withdraws the food supply.</p>
<p>This does not mean suppressing emotion. It means allowing the feeling fully while staying aware — so emotion can move through without recruiting the entire mind into a story that prolongs it.</p>
<p>Resistance is often subtle: chronic complaining, rehearsing arguments, denying what you feel. Tolle invites acceptance of the present moment’s is-ness as the foundation for intelligent response — not as passive surrender to injustice forever.</p>
<p>Tolle’s teaching sits in a long contemplative tradition, expressed in contemporary language: peace is not found in rearranging every circumstance, but in awakening out of compulsive identification with thought.</p>
<p><strong>Lesson:</strong> When old emotional pain activates, observe it in presence instead of fusing with its story.</p>
<h3>Chapter 6: Practices of Now — inner body and watching</h3>
<p>Tolle offers simple anchors: noticing the breath, sensing the inner body (aliveness inside hands, chest, legs), single-tasking with full attention, time in nature, and watching thoughts without following every one. The inner body especially is a portal out of pure conceptualization into felt presence.</p>
<p>These are not achievements to collect. They are returns. You will leave the Now repeatedly; the practice is noticing and coming back without self-attack.</p>
<p>The Power of Now is ultimately disidentification training: return attention to this moment, and the mind’s tyranny loosens — not because every problem vanishes, but because you are no longer only the problem’s narrator.</p>
<p>The pain-body concept helps explain sudden emotional hijacks that seem larger than the trigger. Old pain wants more pain. Naming and watching the activation prevents the pain-body from recruiting your entire mind overnight.</p>
<p>“You are not your mind” is liberating for overthinkers. The mind can plan and analyze; it can also generate endless commentary that adds suffering on top of life’s ordinary challenges. Awareness is the space in which both useful thought and noise arise.</p>
<p><strong>Lesson:</strong> Anchor in breath, inner-body sensing, and watching — returning to Now whenever the mind pulls you away.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg',
    'Eckhart Tolle’s guide to presence — disidentifying from egoic thinking, psychological time, the pain-body, and returning to the Now.'
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
  ('What does Tolle say is ultimately real and primary for peace?', 'Only the future', 'The present moment (the Now)', 'Only memories', 'Other people’s opinions', 'B', 1),
  ('What is psychological time in Tolle’s teaching?', 'A clock on the wall', 'Living absorbed in past/future mental stories rather than the present', 'Airport schedules', 'Meditation timers only', 'B', 2),
  ('What is the pain-body?', 'A gym injury only', 'Accumulated emotional pain that can activate and feed on negativity', 'A medical diagnosis for everyone', 'A type of meditation cushion', 'B', 3),
  ('How does presence affect identification with pain?', 'It always increases drama', 'Observing without becoming the pain withdraws identification', 'It requires arguing with every thought', 'It means suppressing all feeling forever', 'B', 4),
  ('Which practice fits Tolle’s approach?', 'Constant multitasking', 'Anchoring attention in breath / inner body / present sensing', 'Refreshing social feeds', 'Replaying regrets all day', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Mountain Is You');
DELETE FROM public.information WHERE title = 'The Mountain Is You';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Mountain Is You',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Self-sabotage is protection</h2>
<ul><li>Many “bad” habits began as ways to stay emotionally safe.</li></ul>
<h2>2. The mountain is internal</h2>
<ul><li>Your biggest barriers are often patterns within you, not only outer circumstances.</li></ul>
<h2>3. Triggers are teachers</h2>
<ul><li>Emotional triggers point to unhealed beliefs and needs.</li></ul>
<h2>4. Identity death and discomfort</h2>
<ul><li>Growth asks you to release old identities and tolerate new discomfort.</li></ul>
<h1>PART 2 — THE MOUNTAIN IS YOU</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Transform self-sabotage</h3>
<p>Brianna Wiest’s The Mountain Is You frames personal growth as climbing an inner mountain: transforming self-sabotage into self-mastery. The title’s claim is that the obstacle is often not only “out there” — it is the pattern within you that recreates familiar struggle.</p>
<p>Wiest writes in a direct, essayistic style aimed at people who know what they should do and somehow still don’t. The book treats that gap not as proof of brokenness but as a solvable psychological puzzle.</p>
<p>The work is both compassionate and demanding: understand why you resist, then take responsibility for building a life that no longer needs the old protection strategies.</p>
<p>Wiest’s mountain metaphor works because external goals keep changing while internal patterns repeat. You can switch cities and jobs and still meet the same self-sabotage wearing new clothes. The climb is pattern-level.</p>
<p>Identity death explains why positive change can feel like grief. You may mourn the chaotic self, the martyred self, the cynical self — even while you know those identities cost you. Allow the grief without returning to the old pattern as comfort.</p>
<p><strong>Lesson:</strong> Treat self-sabotage as a transformable inner mountain, not as proof that you are hopeless.</p>
<h3>Chapter 2: Reframe self-sabotage as protection</h3>
<p>Wiest argues self-sabotage is often not laziness or lack of desire. It is outdated self-protection — a part of you seeking safety from fear, rejection, success, visibility, or change. The habit that blocks you may once have helped you survive.</p>
<p>That reframe matters because shame rarely ends sabotage. If you only attack yourself for procrastinating or choosing unavailable partners, you add pain without removing the protector’s reason for existing.</p>
<p>Ask what the behavior protects you from. Fear of failure? Fear of being seen? Fear of outgrowing your community? Understanding the protector is the first foothold on the mountain.</p>
<p>Seeing sabotage as protection reduces self-hatred and increases curiosity. Protectors formed for reasons — often intelligent reasons in an old context. They become problems when the context changes and the protector keeps driving.</p>
<p>Discomfort intolerance keeps people loyal to familiar misery. The nervous system prefers known pain to unknown peace. Training is deliberate exposure to the good-hard things: consistency, boundaries, receiving care, finishing.</p>
<p><strong>Lesson:</strong> Reframe self-sabotage as an outdated protection strategy — then address what it was trying to keep safe.</p>
<h3>Chapter 3: You are the mountain and the climber</h3>
<p>External problems matter — money, health, unfair systems. Wiest’s emphasis is that the recurring obstacle is frequently an internal pattern: the way you abandon goals when they matter, choose chaos when life is calm, or shrink when opportunity arrives.</p>
<p>Naming the pattern is a foothold. Vague dissatisfaction keeps you circling. Specific recognition — “I sabotage intimacy when it becomes real,” “I quit when I’m finally progressing” — makes change designable.</p>
<p>You are both the mountain and the climber: the pattern and the awareness that can work with it. That dual role is empowering, not blaming.</p>
<p>Specificity is a growth tool. “I ruin my life” is fog. “I pick fights when someone gets close” or “I overwork to avoid feeling lonely” is a map. You can intervene on a map.</p>
<p>Compassion without accountability becomes an excuse loop. Accountability without compassion becomes another abusive inner voice. Wiest’s path uses both: understand the protector, then stop letting it choose.</p>
<p><strong>Lesson:</strong> Name the recurring internal pattern clearly — you cannot climb a mountain you refuse to see.</p>
<h3>Chapter 4: Triggers, needs, and emotional intelligence</h3>
<p>Emotional triggers are not random noise. In Wiest’s framing, they point toward wounds, beliefs, and needs — places where the past is still interpreting the present. A trigger is information if you are willing to study it instead of only reacting from it.</p>
<p>Emotional intelligence here means feeling emotions without being fully ruled by them: observing the story, naming the need, and choosing a response aligned with your future self rather than your fear.</p>
<p>Motivation spikes fade. Building a life requires the capacity to stay present with discomfort long enough to act differently than your trigger demands.</p>
<p>Triggers reveal the unhealed story: I am only loved when useful; success makes me unsafe; rest is laziness; visibility means attack. Emotional intelligence means catching the story mid-activation and choosing a new behavior anyway.</p>
<p>Self-mastery, in this book, is not dominance over feelings. It is integration: feelings welcomed, patterns named, values chosen, actions aligned — climbing the internal mountain one honest step at a time.</p>
<p><strong>Lesson:</strong> Treat triggers as teachers about wounds and needs, and build emotional intelligence to respond rather than only react.</p>
<h3>Chapter 5: Let an old identity die</h3>
<p>Becoming who you want to be can require releasing who you had to be to survive earlier chapters of life. Wiest speaks to identity death: the grief of letting go of roles, coping styles, and self-images that once made sense.</p>
<p>People often sabotage success because success threatens belonging to an old identity — the underdog, the helper who never needs help, the person who stays small to stay safe. Growth can feel like betrayal of a former self.</p>
<p>Honor what the old identity did for you, then stop letting it drive. Gratitude plus release is more effective than pretending you never needed those armor pieces.</p>
<p>Identity death explains why positive change can feel like grief. You may mourn the chaotic self, the martyred self, the cynical self — even while you know those identities cost you. Allow the grief without returning to the old pattern as comfort.</p>
<p>Wiest’s mountain metaphor works because external goals keep changing while internal patterns repeat. You can switch cities and jobs and still meet the same self-sabotage wearing new clothes. The climb is pattern-level.</p>
<p><strong>Lesson:</strong> Allow outdated survival identities to end so a more aligned self can take responsibility for your life.</p>
<h3>Chapter 6: Discomfort is part of the path</h3>
<p>If you only choose comfort, you stay loyal to familiar pain. Growth asks you to tolerate the discomfort of new behavior — boundaries, consistency, rest, ambition — until it becomes home.</p>
<p>Wiest’s compassion does not remove responsibility. Understanding why you sabotage is the beginning; aligned action is the climb. Shame keeps you stuck; clarity plus new behavior moves you.</p>
<p>The mountain is you — which means the path through is also you: honesty, emotional skill, identity renewal, and a willingness to be uncomfortable on purpose for a life that fits.</p>
<p>Discomfort intolerance keeps people loyal to familiar misery. The nervous system prefers known pain to unknown peace. Training is deliberate exposure to the good-hard things: consistency, boundaries, receiving care, finishing.</p>
<p>Seeing sabotage as protection reduces self-hatred and increases curiosity. Protectors formed for reasons — often intelligent reasons in an old context. They become problems when the context changes and the protector keeps driving.</p>
<p><strong>Lesson:</strong> Stop waiting for comfort to arrive first — practice the discomfort that your next life requires.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781949759228-L.jpg',
    'Brianna Wiest on transforming self-sabotage into self-mastery — internal mountains, triggers, emotional intelligence, identity death, and discomfort.'
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
  ('How does Wiest reframe self-sabotage?', 'As proof you are hopeless', 'As often a form of self-protection that outlived its usefulness', 'As purely genetic destiny', 'As something to ignore', 'B', 1),
  ('What is the ''mountain'' in the book’s metaphor?', 'Only other people', 'Primarily internal obstacles and patterns you must climb through', 'A literal hiking guide', 'Your job title', 'B', 2),
  ('What do emotional triggers offer, according to this book’s themes?', 'Random noise only', 'Information about wounds, beliefs, and needs', 'Proof you should never feel', 'A reason to quit growth', 'B', 3),
  ('Why is discomfort important in Wiest’s framing?', 'Pain is the only goal', 'Avoiding discomfort can mean avoiding the life you want', 'Comfort always equals growth', 'Discomfort means you chose wrong forever', 'B', 4),
  ('What attitude does the book favor toward changing sabotage patterns?', 'Pure self-hatred', 'Understanding plus responsibility and new aligned action', 'Blame everyone else', 'Wait for motivation only', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
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
