DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Make Your Bed');
DELETE FROM public.information WHERE title = 'Make Your Bed';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Make Your Bed',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Make your bed</h2>
<ul><li>Start the day with a small completed standard that builds pride and momentum.</li></ul>
<h2>2. Paddle together</h2>
<ul><li>Life’s hard stretches require a crew — give and accept help.</li></ul>
<h2>3. Heart over appearance</h2>
<ul><li>Judge people by courage and will under strain, not surface traits.</li></ul>
<h2>4. Sugar cookies happen</h2>
<ul><li>Unfair discomfort will sand you; keep moving anyway.</li></ul>
<h2>5. Face the Circus</h2>
<ul><li>Extra hard reps build capacity for harder days.</li></ul>
<h2>6. Take calculated risks</h2>
<ul><li>Sometimes head-first is how you lead the pack.</li></ul>
<h2>7. Do not fear the sharks</h2>
<ul><li>Meet threats with composure and action.</li></ul>
<h2>8. Best in the dark / never ring the bell</h2>
<ul><li>Character shows in worst conditions; refuse to quit on worthy goals from pain alone.</li></ul>

<h1>PART 2 — MAKE YOUR BED</h1>
<h2>A 24-Minute Read Summary</h2>
<h3>Chapter 1: Start with the bed</h3>
<p>Admiral William H. McRaven’s Make Your Bed began as a University of Texas commencement address and became a compact book of SEAL-forged life lessons. The first lesson is almost provocatively ordinary: make your bed when you wake. Pull the sheets tight, tuck the corners, smooth the blanket, set the pillow. In basic training, a poorly made rack could fail room inspection for everyone living there. The standard was fussy on purpose.</p>
<p>McRaven’s claim is that a made bed is the first completed task of the day — a visible win you can point to before email, news, or chaos arrives. If the rest of the day collapses, you still return to evidence that you imposed order on something under your control. That matters psychologically more than the fabric arrangement itself.</p>
<p>Adults often reject micro-habits as beneath their ambition. They want transformation narratives, not tucked corners. McRaven pushes back: big change frequently begins with a behavior so finishable that excuses look silly. You cannot honestly claim you lacked time to make a bed. What you lacked was willingness to meet a small standard.</p>
<p>Discipline becomes real when it is checkable. A speech about excellence is fog. A bed that would survive inspection is data. Each morning you either keep a promise to yourself or you soft-negotiate. Soft negotiations compound into a self-image of someone who starts cloudy.</p>
<p>Install the habit as a closed loop: feet on floor, bed made before phone, room left only when the rack would pass a basic look. Track how the evening feel of the room changes. Notice that skipping becomes an early signal of slide. The bed is metaphor and mechanism at once — a metaphor you can touch is harder to dismiss.</p>
<p>If you share a home, make the bed without turning it into a scoreboard war. Model the standard; invite partnership. If travel wrecks the routine, recreate a tiny first win in hotel rooms: straighten, reset, begin. Portable discipline beats perfect conditions.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Begin each day with one small, completable standard that proves you can create order.</p>
<h3>Chapter 2: Find someone to help paddle</h3>
<p>SEAL boat crews row heavy inflatables through cold surf. Alone, the boat fights you. In sync, it moves. McRaven’s lesson is blunt: you will not thrive through life’s hardest stretches in heroic isolation. You need people who will paddle when water is ugly and spirits are thin.</p>
<p>This is not transactional networking — business cards traded for favors. It is interdependence under stress. In training, one weak paddler becomes everyone’s problem; a crew that refuses to abandon anyone becomes a different kind of power. McRaven extends that to spouses, friends, teammates, mentors, and communities.</p>
<p>Modern culture often glamorizes the lone wolf. Operators at the edge of self-reliance still train as teams because missions fail when ego refuses help. Asking for help is not fragility when the alternative is swamping the boat and drowning the mission.</p>
<p>Audit your crew with two questions: who do you call on a brutal day, and who would call you? If either list is thin, invest before the storm. Offer paddle strokes first — check-ins, practical help, shared load — so reciprocity has somewhere to grow. Crisis is a poor time to start recruiting.</p>
<p>Choose carefully. Some companions drain cadence. Some raise it. Seek people who want you upright, not people who need you stuck so they feel taller. Be the paddler who keeps rhythm when others tire.</p>
<p>At work, paddling looks like clear roles, covering a teammate’s gap without weaponizing it, and celebrating shared finishes. At home, it looks like dividing invisible labor and speaking needs early. Isolation dressed as strength is often fear in a costume.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Build and be a crew that paddles with you when life gets rough.</p>
<h3>Chapter 3: Measure a person by the size of their heart</h3>
<p>McRaven watched a smaller trainee outlast larger classmates through grit. Body type and first impressions predicted poorly who would endure mud, cold, and exhaustion. Heart — will plus care — showed under friction.</p>
<p>Judge people by courage, compassion, and persistence, not by polish, height, pedigree, or brand-name schools. Surface cues are tempting because they are fast. They are also frequently wrong. The person who looks the least impressive in week one may be the one still standing in week six.</p>
<p>This cuts both directions. Do not dismiss yourself for lacking an impressive exterior. Do not promote or trust solely because someone looks the part. Watch how people treat the tired, the junior, and the failed attempt. Heart is revealed in strain more than in highlight reels.</p>
<p>In hiring and friendship, prefer those whose effort rises when the easy story ends. In self-assessment, stop waiting to feel fully ready. Log acts of perseverance. Heart is a muscle trained by use, not a mystical trait you either got at birth or did not.</p>
<p>Compassion belongs inside toughness. McRaven’s heart is not soft avoidance. It is the courage to continue plus the humanity to lift others. Brute force without care makes brittle teams. Care without courage makes fragile ones.</p>
<p>Practice one weekly habit: notice and name someone’s quiet grit. Culture shifts when heart is seen. People repeat what gets respected.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Judge yourself and others by grit and heart under pressure, not by appearances.</p>
<h3>Chapter 4: Get over being a sugar cookie and keep moving</h3>
<p>Fail an inspection in training and you might roll in wet sand until coated — a sugar cookie — then train filthy all day. The sand was humiliation plus ongoing friction. Sometimes you will be sanded unfairly. Sometimes you will do everything right and still get sandy. McRaven’s counsel: keep moving.</p>
<p>Fairness is not a reliable operating system. Waiting for perfect justice before you act is a sophisticated stall. Sugar-cookie days train a specific toughness: discomfort without a permanent victim identity. Feel the grit; refuse to live inside the grievance.</p>
<p>Civilian sugar cookies look like office politics, a grade that ignored effort, a plan spoiled by weather, a rumor that outran the truth. Resentment freezes cadence. Movement — another draft, another workout, another courteous boundary — restores agency.</p>
<p>Invent a two-step recovery: name the unfairness once, then name the next controllable action. Do not rehearse the injustice enough times to make it your personality. The sand is real; your continued paddle is also real.</p>
<p>Leaders create sugar cookies too — sometimes by accident. If you hold standards, explain them, apply them consistently, and still expect people to move after setbacks. Humiliation without purpose is cruelty. Friction with growth is training.</p>
<p>When you catch yourself collecting sand stories, ask: what stroke can I take in the next ten minutes? Momentum is the antidote to sticky resentment.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> When life sands you unfairly, feel it — then keep moving without waiting for perfect fairness.</p>
<h3>Chapter 5: Do not be afraid of the circuses</h3>
<p>The Circus in BUD/S meant extra punishment PT piled onto an already punishing day. Trainees dreaded it. McRaven reframes it: Circuses made them stronger for later hell. What feels like piled-on punishment can become preparation if you meet it instead of organizing your life around avoidance.</p>
<p>Avoidance keeps capacity thin. Facing Circuses — hard conversations, deliberate practice, honest reviews, physical training you dislike, studying your weak subjects — expands the load you can carry. Fear shrinks the room. Reps enlarge it.</p>
<p>This is not misery tourism. Seek Circuses that align with your mission, not random self-harm. The question is whether the hard extra purchases future capability. If yes, lean in. If no, stop cosplaying toughness.</p>
<p>Inventory your avoidances. Which Circuses would make next month’s challenges smaller? Schedule one this week. Treat it like training: defined start, defined end, defined recovery. Infinite Circus without recovery becomes injury.</p>
<p>Teams need Circus culture without hazing. Challenge people in ways that grow competence and belonging. Extraneous humiliation destroys trust. Purposeful stretch builds it.</p>
<p>After a Circus, capture the lesson. What improved? What still breaks? Then raise the bar one notch, not ten. Progressive overload works for character too.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Face hard extras that build you — your Circuses become capacity, not just punishment.</p>
<h3>Chapter 6: Slide down the obstacle head first</h3>
<p>On the obstacle course, McRaven learned the head-first rope slide was faster — and that calculated risk separates finishers from leaders. Endless caution looks wise until opportunity closes. Sometimes the rational move is the intimidating one.</p>
<p>Risk here is not chaos. Assess downside, prepare recovery, commit. Half-committing forever is still losing. In careers, arts, entrepreneurship, and leadership, waiting for zero uncertainty hands the window to someone braver and adequately prepared.</p>
<p>People confuse safety with stillness. Stillness can be the larger risk: skills decay, networks thin, courage untested, options expire. The obstacle lesson is to choose the move that matches the mission even when your stomach drops.</p>
<p>Where are you tip-toeing? Name the fear specifically. Name the catastrophic fantasy and the probable reality. Define a backup. Then go. Boldness with preparation beats both reckless leap and permanent crouch.</p>
<p>Teach younger teammates the same distinction: courage is not the absence of fear; it is motion with eyes open. Celebrate smart risk even when outcomes wobble. Punish only reckless disregard of teammates and truth.</p>
<p>This week, pick one head-first move you have delayed. Make it small enough to start and real enough to matter.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Take calculated risks when endless caution would cost you the mission.</p>
<h3>Chapter 7: Do not back down from the sharks</h3>
<p>Night ocean swims make shark fear vivid. McRaven’s lesson: predators, literal and figurative, are met with composure and decisive action, not panic thrash. Fleeing blindly can make you look like prey. Facing with clarity is often safer.</p>
<p>Bullies, bad-faith critics, corrosive colleagues, and internal terror behave like sharks when they smell panic. Hold the line with boundaries, competence, calm speech, and refusal to be chased out of your own life. Do not feed frenzy with hysteria.</p>
<p>Courage compounds. Each time you meet a shark steadily, the next one is less mythical. Each unnecessary retreat teaches fear that retreat works. Choose your stands — not every provocation deserves a war — but do not default to surrender.</p>
<p>Prepare shark protocols before night swim. What will you say when criticized unfairly? What evidence will you gather? Who has your back? Improvisation under adrenaline is weaker than rehearsed composure.</p>
<p>Also check whether you have become someone else’s shark. Power without restraint turns leaders into threats. McRaven’s ethic includes strength and care together.</p>
<p>Identify one shark you have been circling away from. Prepare. Meet it once with steadiness. Log what happened. Fear shrinks when reality replaces imagination.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> When threats appear, face them with composure instead of panic or self-abandonment.</p>
<h3>Chapter 8: Be your very best in the darkest moments</h3>
<p>Underwater harassment drills force calm when vision, air, and comfort disappear. McRaven argues that darkest moments reveal and forge character. Daylight discipline is common. Night discipline is identity.</p>
<p>Personal darkness — grief, failure, illness, humiliation, betrayal — is when standards count most. Collapse can be understandable. Rising with integrity is transformative. Be the person who still tells truth, still helps a teammate, still does the next right thing when nobody is cheering.</p>
<p>Preparation helps. Habits built on easy days are the ones you can find without light. That is another reason to make the bed and paddle with others before storms — you are depositing composure for withdrawal later.</p>
<p>In dark hours, shrink the job. Excellence under collapse is usually small and stubborn: drink water, send one honest message, show up to the appointment, refuse one petty revenge. Cinematic heroics are rare; quiet fidelity is available.</p>
<p>Leaders must be their best when teams are scared. Panic from the top multiplies panic below. Steady presence is a force multiplier. Practice it in small fires so you have it for large ones.</p>
<p>After darkness, recover without pretending it was nothing. Integration beats denial. Then rebuild standards. Surviving is not the finish — becoming wiser and kinder is.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> In your darkest moments, commit to one best action — that is when character counts most.</p>
<h3>Chapter 9: Start singing when you are up to your neck in mud</h3>
<p>Hell Week includes lying in freezing mud until quitting seems rational. McRaven recalls singing with classmates — not because mud is fun, but because shared spirit keeps people from ringing the bell. Mood is partly chosen through action: song, humor, mutual encouragement.</p>
<p>Hope is not denial. It is a tool that keeps cadence when conditions scream stop. Leaders who spread despair sink boats. Leaders who generate morale under mud change completion rates without lying about the mud.</p>
<p>Civilian mud looks like endless projects, family strain, financial squeeze, grinding seasons with no viral win. Singing looks like gratitude that is specific, playlists that lift, jokes that do not punch down, and words that keep your people upright.</p>
<p>Do not outsource morale solely to others. Be early to lift tone. Also accept help when you are the one sinking. Pride that refuses comfort is another way to quit slowly.</p>
<p>Teams can institutionalize mud songs: rituals that mark hard phases, shared meals after brutal weeks, public credit for quiet work. Culture is designed or it defaults to complaint.</p>
<p>Next muddy week, ask: what is one spirit-lift I can offer in the next hour? Then do it before cynicism speaks first.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> When you are stuck in the mud, lift spirit — for yourself and your crew — so you do not quit.</p>
<h3>Chapter 10: Never, ever ring the bell</h3>
<p>A brass bell sat ready for quitters. Ring it and training ends. McRaven’s charge: do not ring the bell. Do not abandon yourself, your mission, or people counting on you merely because pain is loud and temporary.</p>
<p>Quitting can be wise when the goal is wrong or the cost is unethical. McRaven’s target is quitting from discomfort alone — fatigue inventing stories that make surrender feel sophisticated. Distinguish strategic exit from bell-ringing escape.</p>
<p>Grit without reflection traps people in toxic paths. Pair never-ring-the-bell with clear aims: finish what is worthy, endure what is necessary, leave what is hollow. The bell rule guards identity under strain; it is not a vow to stay forever in the wrong fight.</p>
<p>Write your markers in calm weather. What would count as quitting from fear versus changing course with courage? Decide before Hell Week so misery cannot redefine your values on the fly.</p>
<p>Publicly, rings are obvious. Privately, soft bells sound like endless delay, quiet ghosting on commitments, and chronic almost. Notice soft bells early.</p>
<p>When you want to ring, wait one more evolution. Often the urge peaks right before a breakthrough. Sometimes it does not — and then rethink the mission. But default to one more honest try.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Refuse to quit on worthy goals just because the pain is loud — know escape from wise exit.</p>
<h3>Chapter 11: If you want to change the world, start with morning discipline</h3>
<p>McRaven ties lessons into a civic plea: changing the world sounds grand, yet it is built from local standards. Societies improve when individuals keep small promises, help crews, and refuse to quit on what matters. Waiting for perfect systems before you act is another bell.</p>
<p>Morning discipline scales awkwardly and beautifully. One made bed does not rewrite history. Millions of people who keep standards, face Circuses, and paddle for others do. Culture is aggregated personal practice, not only policy documents.</p>
<p>Skeptics call this sentimental. McRaven’s counter is lived extremity: ordinary-looking people became extraordinaries through repeated choices under stress. Soft theory loses to hard habit when nights get cold.</p>
<p>Translate change-the-world rhetoric into today’s non-negotiables: bed, one Circus, one paddle stroke for someone else, one refusal to ring the soft bell. Ambition without morning mechanics is cosplay.</p>
<p>Teach this to kids and juniors without crushing them. Standards plus warmth. Challenge plus belonging. Circuses that grow, not hazing that scars.</p>
<p>Zoom out weekly: are your local disciplines aligned with the larger good you claim to want? If not, adjust the morning, not only the manifesto.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Change the world from local discipline outward — standards, service, and refusal to quit on what matters.</p>
<h3>Chapter 12: Carry the lessons past the beach</h3>
<p>Leave the beach metaphor and install the lessons where you live. Make the bed. Call your crew. Look for heart. Keep walking after sugar cookies. Enter Circuses. Take smart head-first risks. Face sharks. Bring your best to darkness. Sing in mud. Do not ring the bell on a life you still believe in.</p>
<p>McRaven’s gift is not secret SEAL lore for civilians to LARP. It is a portable ethic: small order, shared effort, toughness without self-pity, hope as practice. You do not need a trident to use it. You need consistency.</p>
<p>Revisit the speech’s simplicity when plans grow complicated. Complexity often hides avoidance. The bed remains every morning, asking whether you will begin with pride or drift into fog.</p>
<p>Build a weekly after-action: Which lesson did I practice? Which did I dodge? One adjustment for next week. Continuous improvement beats inspirational binge-watching.</p>
<p>Share one lesson with someone you paddle with. Teaching embeds learning. Crews sync when they share language for hard days — Circus, sugar cookie, never ring the bell — without turning jargon into superiority.</p>
<p>Tonight, set up tomorrow’s first win. Tomorrow, paddle with someone. This week, take one Circus and one calculated risk. That is the curriculum. Begin again each dawn.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Install McRaven’s lessons as daily practice: order, crew, courage, hope, and no quit on worthy aims.</p>
<h3>Chapter 13: Standards create freedom</h3>
<p>McRaven’s habits look restrictive until you notice what they free. Making the bed frees morning decision fatigue. A crew frees you from carrying every weight alone. Facing Circuses frees future-you from being overwhelmed by smaller loads. Not ringing the bell frees you from the lifelong regret of quitting on a worthy aim because a night was cold.</p>
<p>People often treat discipline as the opposite of freedom. SEAL logic — and Jocko’s phrase popularized later, discipline equals freedom — says structure purchases options. The person who cannot keep tiny promises has fewer doors open when larger opportunities arrive. Credibility, fitness, skill, and trust are freedoms earned by repetition.</p>
<p>Apply this at home: choose three non-negotiables that protect energy for what you care about. Keep them boringly consistent. Boredom in standards is a feature. Drama belongs in missions, not in whether you show up for basics.</p>
<p>When you feel trapped by routine, check whether the routine still serves a freer life. Update standards when missions change. Do not confuse stubborn ritual with purposeful discipline.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Keep simple standards because they purchase freedom, options, and self-trust.</p>
<h3>Chapter 14: A weekly McRaven drill</h3>
<p>Inspiration fades; drills persist. Build a weekly review with seven checks: Did I make the bed most mornings? Who did I paddle with, and who paddled with me? Where did I judge by heart instead of appearance? What sugar cookie did I move past? Which Circus did I face? What calculated risk did I take? Where did I almost ring a soft bell — and what did I do instead?</p>
<p>Score lightly, without self-cruelty. The goal is pattern awareness. If six checks are empty, you do not need shame; you need a narrower plan. Pick two lessons for the next seven days and ignore the rest temporarily. Depth beats scattered cosplay of all ten lessons at once.</p>
<p>Pair the drill with a teammate. Mutual accountability is paddling. Share one win and one miss. Ask for one help request. Close the loop the following week. Mentorship thrives on concrete language — Circus, sugar cookie, ring the bell — when used with humility, not superiority.</p>
<p>Finally, connect the drill to service. McRaven’s speech ends with changing the world. Ask: whose life got easier because I kept a standard this week? If the answer is only “mine,” add one paddle stroke for someone else next week. Personal excellence that never lifts others is incomplete relative to the ethic he teaches.</p>
<p>Print the seven checks. Put them where you make the bed. Let the morning and the week talk to each other. That is how a commencement speech becomes a lifestyle without becoming a cult of toughness.</p>

<p>Return to this chapter’s idea when the day gets loud. Ask one question only: what is the smallest action that would honor this lesson in the next hour? Then do that action before you renegotiate with comfort. McRaven’s stories stick because they convert values into verbs. Verbs change weeks; slogans do not.</p>
<p><strong>Lesson:</strong> Review weekly with concrete checks — then pick a few lessons to practice deeply with your crew.</p>
',
    24,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781455570249-L.jpg',
    'Admiral McRaven’s life lessons from Navy SEAL training — small wins, teamwork, and never ringing the bell.'
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
  ('Why does McRaven recommend making your bed each morning?', 'Because SEAL beds are inspected by the president', 'It gives a small completed win and a sense of pride to start the day', 'It replaces the need for teamwork', 'It guarantees a perfect day', 'B', 1),
  ('What does paddling together represent?', 'Working entirely alone to prove toughness', 'Needing a crew who helps you through hard stretches', 'Avoiding all difficult missions', 'Competing to sink others’ boats', 'B', 2),
  ('What is a ''sugar cookie'' lesson?', 'Always desserts after training', 'Life will sometimes sand you unfairly — keep moving', 'Only fair punishments matter', 'Quit when treated unfairly', 'B', 3),
  ('What does McRaven say about the Circus?', 'Avoid all extra hardship forever', 'Facing hard extras can make you stronger for later challenges', 'Circuses only happen to quitters', 'Punishment never builds capacity', 'B', 4),
  ('What does ''never ring the bell'' mainly urge?', 'Never change jobs even if toxic', 'Do not quit on worthy goals merely because the pain is loud', 'Always stay silent under stress', 'Ignore your teammates', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
