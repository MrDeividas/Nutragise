DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Ego Is the Enemy');
DELETE FROM public.information WHERE title = 'Ego Is the Enemy';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Ego Is the Enemy',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Aspire without ego</h2>
<ul><li>Focus on apprenticeship and reality while building.</li></ul>
<h2>2. Success needs humility</h2>
<ul><li>Ego after wins destroys judgment.</li></ul>
<h2>3. Failure needs resilience</h2>
<ul><li>Ego turns setbacks into identity wounds.</li></ul>
<h2>4. Be a student always</h2>
<ul><li>Keep learning; bury the need to seem important.</li></ul>
<h2>5. Work, don’t advertise</h2>
<ul><li>Quiet craft beats loud branding early.</li></ul>
<h1>PART 2 — EGO IS THE ENEMY</h1>
<h2>A 27-Minute Read Summary</h2>
<h3>Chapter 1: Ego as the invisible opponent</h3>
<p>Ryan Holiday’s Ego Is the Enemy argues that ego — an unhealthy belief in your own importance — sabotages aspiring people, successful people, and failing people alike. Talent and luck matter, but ego decides whether those gifts compound or combust.</p>
<p>Holiday draws on Stoic themes and historical cases: leaders who listened versus leaders who needed to be the smartest in every room. The enemy is not confidence. Confidence is earned. Ego is unearned certainty plus hunger for recognition.</p>
<p>Early careers amplify ego risk because you have little skill and large fantasy. You want credit before craft. Holiday recommends anonymity as strategy: learn, assist, absorb standards, postpone the spotlight.</p>
<p>Practical test: do you want to be known for the work or do you want to do the work? When those conflict, ego chooses known. Choose work.</p>
<p>Keep a private metric dashboard: hours practiced, drafts finished, feedback integrated. Public metrics feed ego. Private metrics feed mastery.</p>
<p>When jealousy hits, treat it as data about what you value — then translate envy into a training plan instead of a bitterness hobby.</p>
<p><strong>Lesson:</strong> Treat ego as the opponent — prefer craft and learning over premature recognition.</p>
<h3>Chapter 2: Talk less, do more</h3>
<p>Ego loves announcing plans because announcements get dopamine without labor. Holiday warns against premature talk that substitutes for execution. Silence protects energy for building.</p>
<p>Share goals with accountability partners, not audiences. Broad broadcasting invites identity lock-in and fear of looking inconsistent when plans evolve.</p>
<p>Replace status updates with shipping cadence. Finish small public artifacts instead of narrating future masterpieces.</p>
<p>In meetings, ask more than you declare. Curiosity is anti-ego. Declarations can be useful; constant declarations are smell.</p>
<p>Track a talk-to-do ratio for a week. If talk dominates, impose a temporary announcement diet.</p>
<p>Let results introduce you. That patience feels like dying to ego — which is the point.</p>
<p><strong>Lesson:</strong> Quiet the announcement habit and let finished work speak.</p>
<h3>Chapter 3: The canvas strategy</h3>
<p>Holiday’s canvas strategy: find canvases for others — make bosses, teammates, and mentors look good — while you learn beside power. Helping someone else’s vision can accelerate your skill faster than guarding credit.</p>
<p>This is not permanent servitude. It is apprenticeship with eyes open. Choose canvases worth painting on — people with integrity and competence.</p>
<p>Ego hates being unseen. Canvas strategy requires delayed gratification. Keep private notes of skills gained so the ego gets a factual consolation prize.</p>
<p>Avoid toxic canvases that steal credit while blocking growth. Generosity toward exploiters is not virtue.</p>
<p>Weekly ask: whose canvas did I improve, and what skill did I steal legally through proximity?</p>
<p>Later, when you have your own canvas, remember who helped you — and offer apprentices the same ladder.</p>
<p><strong>Lesson:</strong> Advance by making others’ projects better while you quietly accumulate skill.</p>
<h3>Chapter 4: Live with purpose, not passion theater</h3>
<p>Passion as fireworks can be ego in costume — intense feelings used as proof you are special. Purpose is quieter: a standard of contribution you return to when feelings cool.</p>
<p>Holiday pushes sobriety about feelings. Motivation wavers; systems and duties carry you. Purpose answers why the boring middle exists.</p>
<p>Translate purpose into jobs-to-be-done this week. Vague destiny talk is ego candy.</p>
<p>If your ''passion'' requires constant applause, it may be ego. If it survives anonymity, it may be purpose.</p>
<p>Revisit purpose quarterly. Update as you learn. Dogmatic destiny can also be ego.</p>
<p>Pair purpose with duty: who relies on you showing up regardless of mood?</p>
<p><strong>Lesson:</strong> Prefer purpose and duty over passion performances that need constant applause.</p>
<h3>Chapter 5: Success makes ego louder</h3>
<p>Wins feed ego. Suddenly you discount critics, stop learning, and surround yourself with mirrors. Holiday treats success as a dangerous phase requiring humility protocols.</p>
<p>Install constraints: still take beginner classes, still ask naive questions, still schedule dissent, still do deep work before administration of fame.</p>
<p>Attribute wins accurately: timing, team, privilege, practice. Full self-credit is a lie that future-you will pay for.</p>
<p>Public success attracts flatteners and inflators. Choose feedback from people who loved you before the win.</p>
<p>Keep a ''beginner day'' monthly in some skill. Feel awkward on purpose.</p>
<p>Success without humility is a countdown to a preventable fall.</p>
<p><strong>Lesson:</strong> After wins, deliberately practice humility and keep learning.</p>
<h3>Chapter 6: The peril of branding yourself</h3>
<p>Personal branding can become ego management: packaging identity tighter than reality. Holiday prefers substance thickening faster than brand.</p>
<p>Share useful teaching, not constant self-mythology. Educate out, don’t inflate out.</p>
<p>If brand obligations force you to pretend certainty you lack, shrink brand or grow skill — ideally both in balance.</p>
<p>Measure brand by how many people you help and by work quality, not by vanity metrics alone.</p>
<p>Quiet seasons of building without posting are allowed. Algorithm addiction is a modern ego gym.</p>
<p>Be updateable. Brands that cannot admit change become prisons.</p>
<p><strong>Lesson:</strong> Let substance outrun branding — teach usefulness, avoid self-mythology.</p>
<h3>Chapter 7: Failure without ego collapse</h3>
<p>Ego turns failure into identity catastrophe: I failed becomes I am a failure. Holiday urges sobriety: failure is information plus bruised preference, not annihilation.</p>
<p>After a loss, run a blameless postmortem with blunt facts. Separate controllable mistakes from probability. Then train the controllable.</p>
<p>Avoid revenge goals fueled only by humiliation. Prefer goals fueled by craft standards.</p>
<p>Tell the story of the failure without starring as either villain forever or victim forever. Be a student in the story.</p>
<p>Keep working during shame. Motion metabolizes ego wounds faster than rumination.</p>
<p>Ask what the failure makes possible that success would have blocked.</p>
<p><strong>Lesson:</strong> Treat failure as information — refuse to turn it into an identity death sentence.</p>
<h3>Chapter 8: Dead time vs alive time</h3>
<p>Holiday contrasts dead time (waiting passively, resenting delay) with alive time (using constraint to train). Ego hates delays because delays withhold recognition. Students love delays as cover for practice.</p>
<p>Airport, injury, job search, creative rejection — each can be dead or alive based on choices.</p>
<p>Carry a small training kit for delayed seasons: books, drills, fitness, craft exercises, relationship repairs.</p>
<p>Alive time is not toxic productivity. Rest can be alive if intentional. Scroll-numbing is dead.</p>
<p>Review monthly: where did I convert waiting into training?</p>
<p>Teach teams to use project delays as polish time, not grievance time.</p>
<p><strong>Lesson:</strong> Turn delays into alive time for training instead of dead time for resentment.</p>
<h3>Chapter 9: Sobriety, stillness, observation</h3>
<p>Ego thrives on noise. Holiday praises stillness — space to see reality without image-management. Meditation, walks, journaling, and device-free hours reveal when ego is writing your script.</p>
<p>Observation without immediate reaction is a power skill. Reactivity often serves pride.</p>
<p>Build a daily stillness block even at ten minutes. Protect it like a meeting with someone powerful — because it is.</p>
<p>In conflict, pause long enough to ask: what would a non-ego move look like?</p>
<p>Leaders who never sit quietly govern by impulse and then call it vision.</p>
<p>Stillness is not escape from duty; it is maintenance for judgment.</p>
<p><strong>Lesson:</strong> Practice stillness so you can see reality without ego’s spin.</p>
<h3>Chapter 10: Always love</h3>
<p>Holiday closes aspiration/success/failure arcs with the reminder that love — of craft, of others, of truth — is the durable fuel. Ego is brittle fuel. Love keeps you working when the audience leaves.</p>
<p>Love here is active: care, standards for people you serve, fidelity to excellence when invisible.</p>
<p>Replace who is winning with who is helping. The second question wounds ego and heals purpose.</p>
<p>In failure, love keeps you from nihilism. In success, love keeps you from contempt.</p>
<p>Audit motives monthly: fear, vanity, love. Increase the third.</p>
<p>Choose projects that make love of craft easier than love of clout.</p>
<p><strong>Lesson:</strong> Fuel work with love of craft and people — ego fuel burns out.</p>
<h3>Chapter 11: Egomania at work</h3>
<p>Workplace ego shows as credit fights, meeting domination, refusal to apologize, and hypersensitivity to feedback. Holiday’s tools apply: be useful, stay curious, pick alive time, quarantine branding theater.</p>
<p>Managers should reward ego-down behaviors: raising others, admitting errors, teaching. What you celebrate multiplies.</p>
<p>Document decisions against ego: when you chose quiet usefulness over show.</p>
<p>If you work under an egomaniac, protect your canvas strategy boundaries and exit plans. Do not romance toxicity as mentorship forever.</p>
<p>Peer circles can run ego checks: Where did I make it about me this week?</p>
<p>Small apologies are anti-ego gym.</p>
<p><strong>Lesson:</strong> At work, reward usefulness and apologies — starve credit theater.</p>
<h3>Chapter 12: The endless student</h3>
<p>The throughline is perpetual studenthood. As long as you are a student, ego has less room. Graduation-as-identity is dangerous — it tells you you are finished.</p>
<p>Pick a learning plan that never zeros out. Always have a beginner corner.</p>
<p>Read opposing views. Ego wants confirmation; reality wants correction.</p>
<p>Find mentors and also be a mentor — teaching exposes gaps and practices generosity.</p>
<p>At life’s next stage — aspire, succeed, fail — reread Ego Is the Enemy. The enemy adapts.</p>
<p>Tonight, demote one ego project and promote one craft project.</p>
<p><strong>Lesson:</strong> Stay a student for life so ego never gets to declare you finished.</p>
<h3>Chapter EX1: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Chapter EX2: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Chapter EX3: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Chapter EX4: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Chapter EX5: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Chapter EX6: Living Ego Is the Enemy this month</h3>
<p>Insight without practice fades. This chapter turns the ideas of Ego Is the Enemy into a thirty-day field test. Week one: pick one principle from earlier chapters and define a visible daily behavior that proves you are practicing it. Keep the behavior smaller than your ego wants and more consistent than your mood wants. Write it where you will see it — bathroom mirror, phone lock screen, notebook first line.</p>
<p>Week two: add reflection. Each evening, score the day zero or one: did you do the behavior? No essays required. Patterns matter more than prose. If you miss two days, do not declare identity failure; restart the next morning. Courage and discipline compounds through returns, not through unbroken fantasy streaks.</p>
<p>Week three: involve one trusted person. Tell them what you are training and what help looks like — a check-in text, a walk, a quiet reminder without lectures. Isolation makes private vows fragile. Shared practice makes them social and therefore sturdier. If you lead a team or family, model the practice without forcing identical paths on everyone.</p>
<p>Week four: raise difficulty by about ten percent, not one hundred. Add a slightly harder edge: a longer conversation, a clearer boundary, an earlier wake time, a scarier creative share. Progressive overload is how muscles and character grow without injury. Reckless leaps create rebound avoidance.</p>
<p>Close the month with an after-action. What got easier? What still spikes fear, ego, laziness, or excuse-making? Which environment cues helped? Which people drained the practice? Adjust the next month’s single principle based on evidence. Reread one earlier chapter each Sunday to keep vocabulary alive. Books change lives when they become shared language for hard days, not when they remain decorative on a shelf.</p>
<p>If you stall, shrink the behavior again until it is embarrassingly doable, then rebuild. The goal is identity: someone who practices what they read. That identity is worth more than a perfect month.</p>
<p><strong>Lesson:</strong> Run a thirty-day practice cycle — small daily proof, nightly score, social support, then a slight difficulty raise.</p>

<h3>Application Lab 1: Ego Is the Enemy</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Ego Is the Enemy. Write the behavior as a verb phrase you can check yes or no. Examples: ask two curious questions before offering opinions; complete one anonymous practice session; take one fear-edge action before noon; protect one thirty-minute stillness block; make the bed before phone; review one failure without self-labels.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, you restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Specific intentions expose it — which is useful. Capture friction notes: what time of day failed, which people triggered ego or fear, which stories you told to justify delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo to yourself: what changed in skill, identity, or relationships; what remains hard; what you will continue for another fourteen days. Continuity beats novelty. If you want, reread one chapter that addresses your biggest miss and underline only action sentences. Then schedule the next lab on the calendar like a real appointment with someone you respect — because future-you is that someone.</p>
<p>Share one lesson learned with a teammate or friend without preaching. Teaching consolidates memory and turns private growth into culture. Keep the tone humble: here is what I am practicing, not here is why you are wrong. Over a quarter, stacked labs outperform one emotional binge of inspiration.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 2: Ego Is the Enemy</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Ego Is the Enemy. Write the behavior as a verb phrase you can check yes or no. Examples: ask two curious questions before offering opinions; complete one anonymous practice session; take one fear-edge action before noon; protect one thirty-minute stillness block; make the bed before phone; review one failure without self-labels.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, you restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Specific intentions expose it — which is useful. Capture friction notes: what time of day failed, which people triggered ego or fear, which stories you told to justify delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo to yourself: what changed in skill, identity, or relationships; what remains hard; what you will continue for another fourteen days. Continuity beats novelty. If you want, reread one chapter that addresses your biggest miss and underline only action sentences. Then schedule the next lab on the calendar like a real appointment with someone you respect — because future-you is that someone.</p>
<p>Share one lesson learned with a teammate or friend without preaching. Teaching consolidates memory and turns private growth into culture. Keep the tone humble: here is what I am practicing, not here is why you are wrong. Over a quarter, stacked labs outperform one emotional binge of inspiration.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 3: Ego Is the Enemy</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Ego Is the Enemy. Write the behavior as a verb phrase you can check yes or no. Examples: ask two curious questions before offering opinions; complete one anonymous practice session; take one fear-edge action before noon; protect one thirty-minute stillness block; make the bed before phone; review one failure without self-labels.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, you restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Specific intentions expose it — which is useful. Capture friction notes: what time of day failed, which people triggered ego or fear, which stories you told to justify delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo to yourself: what changed in skill, identity, or relationships; what remains hard; what you will continue for another fourteen days. Continuity beats novelty. If you want, reread one chapter that addresses your biggest miss and underline only action sentences. Then schedule the next lab on the calendar like a real appointment with someone you respect — because future-you is that someone.</p>
<p>Share one lesson learned with a teammate or friend without preaching. Teaching consolidates memory and turns private growth into culture. Keep the tone humble: here is what I am practicing, not here is why you are wrong. Over a quarter, stacked labs outperform one emotional binge of inspiration.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 4: Ego Is the Enemy</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Ego Is the Enemy. Write the behavior as a verb phrase you can check yes or no. Examples: ask two curious questions before offering opinions; complete one anonymous practice session; take one fear-edge action before noon; protect one thirty-minute stillness block; make the bed before phone; review one failure without self-labels.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, you restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Specific intentions expose it — which is useful. Capture friction notes: what time of day failed, which people triggered ego or fear, which stories you told to justify delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo to yourself: what changed in skill, identity, or relationships; what remains hard; what you will continue for another fourteen days. Continuity beats novelty. If you want, reread one chapter that addresses your biggest miss and underline only action sentences. Then schedule the next lab on the calendar like a real appointment with someone you respect — because future-you is that someone.</p>
<p>Share one lesson learned with a teammate or friend without preaching. Teaching consolidates memory and turns private growth into culture. Keep the tone humble: here is what I am practicing, not here is why you are wrong. Over a quarter, stacked labs outperform one emotional binge of inspiration.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>
',
    27,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781591847816-L.jpg',
    'Ryan Holiday on how ego sabotages aspiration, success, and failure — and how humility and reality keep you growing.'
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
  ('What does Holiday treat as the real enemy?', 'Other people’s success', 'Ego — an unhealthy belief in your own importance', 'Hard work', 'Quiet practice', 'B', 1),
  ('What is the canvas strategy?', 'Only paint for yourself forever', 'Help others succeed while you learn and build skill', 'Avoid all mentorship', 'Demand credit first', 'B', 2),
  ('What is alive time?', 'Scrolling until you feel better', 'Using delays and constraints to train and improve', 'Waiting angrily for recognition', 'Quitting when blocked', 'B', 3),
  ('Why is success dangerous in this book?', 'Money is evil', 'Wins can inflate ego and stop learning', 'Success never involves teams', 'Humility ruins careers', 'B', 4),
  ('What stance does Holiday recommend for life?', 'Graduate and stop learning', 'Remain a student so ego cannot declare you finished', 'Talk more than you work', 'Avoid all feedback', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
