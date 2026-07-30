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
