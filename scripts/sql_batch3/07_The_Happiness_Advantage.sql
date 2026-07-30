DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Happiness Advantage');
DELETE FROM public.information WHERE title = 'The Happiness Advantage';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Happiness Advantage',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Happiness fuels success</h2>
<ul><li>Raise positivity to raise performance — not only the reverse.</li></ul>
<h2>2. Tetris effect</h2>
<ul><li>Train brains to spot opportunity, not only problems.</li></ul>
<h2>3. Fulcrum and lever</h2>
<ul><li>Mindset fulcrum changes what effort can move.</li></ul>
<h2>4. Social investment</h2>
<ul><li>Relationships strongly predict thriving.</li></ul>
<h2>5. 20-second rule</h2>
<ul><li>Design friction for habits.</li></ul>
<h1>PART 2 — THE HAPPINESS ADVANTAGE</h1>
<h2>A 27-Minute Read Summary</h2>
<h3>Chapter 1: Success follows happiness more than we admit</h3>
<p>Shawn Achor’s The Happiness Advantage flips the usual formula: we think success will make us happy later. Research he popularizes shows that happiness and optimism often fuel success by improving creativity, resilience, and social connection now.</p>
<p>Waiting to be happy until the next goal creates a treadmill. Each win moves the goalposts. Happiness as a skill interrupts the treadmill.</p>
<p>Happiness here means positive emotional tone and meaning — not fake cheer. Clinical depression needs clinical care; Achor’s tools are for everyday cognitive patterns.</p>
<p>Measure leading indicators: sleep, gratitude practice, social contact, exercise — not only lagging trophies.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Practice positivity skills now — do not postpone happiness until after success.</p>
<h3>Chapter 2: The fulcrum and the lever</h3>
<p>Achor’s metaphor: your mindset is a fulcrum; your effort is a lever. Move the fulcrum — how you see possibility — and the same lever moves more weight.</p>
<p>Two people with equal skills get different outcomes when one scans for threats only and the other scans for levers.</p>
<p>Reframe tasks toward growth: what skill does this build? what relationship does this strengthen?</p>
<p>Beware toxic positivity that denies real risk; realistic optimism sees problems and agency.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Move your mindset fulcrum so the same effort moves more.</p>
<h3>Chapter 3: The Tetris effect</h3>
<p>After hours of Tetris, people see blocks everywhere. Brains habituate to patterns they practice. Problem-only careers create problem-only vision.</p>
<p>Train a positive Tetris effect: daily scans for three specific good things, opportunities, or moments of growth.</p>
<p>This is not ignoring issues; it balances a brain that overweights threats.</p>
<p>Teams can open meetings with wins before issues to retrain collective vision.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Practice spotting wins and opportunities daily so your brain learns that pattern.</p>
<h3>Chapter 4: Falling up</h3>
<p>Failure can become fuel when you map paths upward — what learning, relationship, or strategy emerges. Falling up is not denying pain; it is refusing to waste pain.</p>
<p>After setbacks, write: facts, feelings, future experiments.</p>
<p>Avoid victim or villain extremes; choose student posture.</p>
<p>Share falling-up stories at work to destigmatize learning.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> After failure, map one upward path of learning and experiments.</p>
<h3>Chapter 5: The Zorro circle</h3>
<p>When overwhelmed, shrink focus to a small circle of control — like Zorro mastering a small ring first — then expand. Small mastery rebuilds efficacy.</p>
<p>Panic expands the circle to everything; competence shrinks then grows.</p>
<p>Pick one metric or habit circle for fourteen days.</p>
<p>Expand only after consistency.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> When overwhelmed, master a small circle of control first.</p>
<h3>Chapter 6: The 20-second rule</h3>
<p>Lower activation energy for good habits by twenty seconds — prepare gear, open apps to the right screen, put fruit in sight. Raise friction for bad habits by twenty seconds — delete easy shortcuts, move snacks, log out.</p>
<p>Willpower is limited; design wins.</p>
<p>Evening prep is 20-second engineering for morning you.</p>
<p>Audit one habit this week for friction direction.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Move good habits twenty seconds closer and bad habits twenty seconds farther.</p>
<h3>Chapter 7: Social investment</h3>
<p>Achor emphasizes social support as a huge happiness and performance predictor. Invest in relationships as seriously as you invest in skill.</p>
<p>Schedule friend and family time before the calendar fills with only tasks.</p>
<p>At work, deepen a few alliances with help and appreciation.</p>
<p>Lonely high achievers underperform their potential and feel worse.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Invest in relationships as a core performance strategy.</p>
<h3>Chapter 8: Praise and storytelling</h3>
<p>How we narrate work changes engagement. Specific praise for effort and strategy beats vague great job or only outcome praise.</p>
<p>Tell stories of resilience, not only highlight reels.</p>
<p>Managers: end weeks with public specific thanks.</p>
<p>Personally: journal wins with cause-and-effect stories.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Use specific praise and resilience stories to shape culture.</p>
<h3>Chapter 9: Ripples on teams</h3>
<p>Emotions contagiously ripple. One person’s tone changes rooms. Happiness advantage becomes a social responsibility: manage your weather.</p>
<p>Leaders’ moods amplify. Regulate before you broadcast.</p>
<p>Positive ripples include helping behaviors and fair conflict.</p>
<p>Negative ripples include chronic sarcasm without repair.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Manage your emotional weather — it ripples through teams.</p>
<h3>Chapter 10: Sustain practices</h3>
<p>Achor’s principles stick as practices: gratitude, journaling, exercise, meditation, kindness, and social time. Rotate without abandoning.</p>
<p>Five minutes daily beats rare marathons.</p>
<p>Pair practices to existing habits.</p>
<p>Track streaks lightly; restart without drama.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Install tiny daily happiness practices and restart quickly after misses.</p>
<h3>Chapter 11: Realistic optimism at work</h3>
<p>Bring happiness advantage to goals without denying budgets and deadlines. Optimistic realists set stretch goals with contingency plans.</p>
<p>Scan for resources and allies, not only gaps.</p>
<p>Celebrate progress publicly to feed Tetris effects.</p>
<p>Protect psychological safety so people can speak problems early.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Combine honesty about constraints with agency and progress celebration.</p>
<h3>Chapter 12: Your thirty-day happiness sprint</h3>
<p>For thirty days: daily three gratitudes, one kindness, one exercise bout, one social touchpoint, and a nightly win note. Keep each tiny.</p>
<p>Measure energy and focus subjectively weekly.</p>
<p>Then keep the two practices with highest payoff.</p>
<p>Reread Achor when the success treadmill returns.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Run a tiny thirty-day practice sprint, then keep what works.</p>
<h3>Application Lab 1: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 2: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 3: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 4: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 5: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 6: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 7: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 8: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 9: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 10: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 11: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 12: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 13: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 14: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 15: The Happiness Advantage</h3>
<p>Turn The Happiness Advantage into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Deep Practice Block 1: The Happiness Advantage</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat The Happiness Advantage as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>

<h3>Deep Practice Block 2: The Happiness Advantage</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat The Happiness Advantage as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>
',
    27,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780307591548-L.jpg',
    'Shawn Achor’s positive psychology case that happiness fuels success — not the other way around.'
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
  ('What is the happiness advantage idea?', 'Success must come before any happiness', 'Positive mindset and happiness skills help drive success now', 'Only money causes happiness', 'Emotions never affect performance', 'B', 1),
  ('What is the Tetris effect here?', 'Only playing games at work', 'Brains see more of what they practice noticing — train opportunity scanning', 'Ignoring all problems forever', 'Multitasking blocks', 'B', 2),
  ('What is the 20-second rule?', 'Wait twenty seconds before every decision forever', 'Lower friction for good habits and raise friction for bad ones', 'Exercise only twenty seconds', 'Never prepare gear', 'B', 3),
  ('Why invest socially?', 'Relationships do not matter', 'Social support strongly predicts thriving and performance', 'Only network for status', 'Isolate to win', 'B', 4),
  ('What is a Zorro circle?', 'A fencing class only', 'A small circle of control to master when overwhelmed, then expand', 'A gossip circle', 'Avoiding all goals', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
