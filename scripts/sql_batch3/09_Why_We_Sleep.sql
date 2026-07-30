DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Why We Sleep');
DELETE FROM public.information WHERE title = 'Why We Sleep';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Why We Sleep',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Sleep is not optional</h2>
<ul><li>Sleep drives health, learning, emotion, immunity.</li></ul>
<h2>2. NREM and REM</h2>
<ul><li>Different stages do different jobs.</li></ul>
<h2>3. Caffeine and alcohol costs</h2>
<ul><li>Common chemicals disrupt sleep quality.</li></ul>
<h2>4. Circadian design</h2>
<ul><li>Light, timing, and temperature matter.</li></ul>
<h2>5. Defend the night</h2>
<ul><li>Treat sleep as a non-negotiable pillar.</li></ul>
<h1>PART 2 — WHY WE SLEEP</h1>
<h2>A 32-Minute Read Summary</h2>
<h3>Chapter 1: Sleep or else</h3>
<p>Matthew Walker’s Why We Sleep argues sleep is essential maintenance for brain and body, not a luxury. Short sleep correlates with worse attention, mood, metabolism, immunity, and long-term disease risk.</p>
<p>Modern culture praises sleep sacrifice as commitment. Walker argues that bargain is often false economy.</p>
<p>Individual needs vary, but routinely sleeping far under needs is not a personality flex.</p>
<p>If you have a sleep disorder, seek medical care; this summary is education, not diagnosis.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Treat sleep as biological necessity, not optional grind-culture status.</p>
<h3>Chapter 2: Two worlds of sleep</h3>
<p>NREM supports restoration and certain memory processes; REM supports emotional processing and creative linkages. You need architecture across the night, not only total hours.</p>
<p>Cutting late sleep can disproportionately hit REM-rich periods for many schedules.</p>
<p>Fragmented sleep reduces quality even if time in bed looks long.</p>
<p>Consistent schedules protect architecture.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Protect full-night architecture — NREM and REM do different jobs.</p>
<h3>Chapter 3: Learning while you sleep</h3>
<p>Sleep helps consolidate memories after study. All-nighters often impair retention compared with sleeping.</p>
<p>Study then sleep beats study then restless scrolling until dawn.</p>
<p>Naps can help sometimes but do not replace nightly sleep.</p>
<p>Athletes and musicians consolidate skill with sleep.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Sleep after learning to consolidate — all-nighters often backfire.</p>
<h3>Chapter 4: Emotion and the tired brain</h3>
<p>Insufficient sleep amplifies emotional reactivity and weakens balanced regulation. Irritability and anxiety spikes are common when short on sleep.</p>
<p>Plan difficult talks after rest when possible.</p>
<p>Sleep is mental health hygiene alongside other care.</p>
<p>Track mood against sleep for two weeks.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Defend sleep to stabilize emotion and reduce reactivity.</p>
<h3>Chapter 5: Body systems on the line</h3>
<p>Walker links short sleep to metabolic strain, appetite hormone disruption, cardiovascular stress signals, and immune changes.</p>
<p>Risk is probabilistic, not destiny — but treating sleep as disposable is unwise.</p>
<p>Fitness adaptations happen in recovery; sleep debt stalls gains.</p>
<p>Sick days often follow chronically short nights.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> See sleep as whole-body maintenance for metabolism, heart, and immunity.</p>
<h3>Chapter 6: Caffeine’s half-life</h3>
<p>Caffeine blocks sleepiness signals and can linger for hours. Afternoon coffee can fragment night sleep for many people.</p>
<p>Experiment with early-afternoon cutoffs.</p>
<p>Needing caffeine to feel human daily may signal sleep debt or medical issues.</p>
<p>Swap late caffeine for walks, water, or daylight.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Set an early caffeine cutoff — it lingers longer than you feel.</p>
<h3>Chapter 7: Alcohol and so-called sleep</h3>
<p>Alcohol may help you pass out but often harms sleep architecture and increases fragmentation. Sedation is not healthy sleep.</p>
<p>Late drinking silently sabotages next-day cognition.</p>
<p>If alcohol is anxiety medicine, seek better tools — sleep loss worsens anxiety loops.</p>
<p>Try alcohol-free weeks and compare morning clarity.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Do not confuse alcohol sedation with restorative sleep.</p>
<h3>Chapter 8: Light, temperature, and timing</h3>
<p>Morning daylight anchors clocks; evening bright screens delay them. Cool, dark, quiet bedrooms improve continuity.</p>
<p>Reduce social jet lag by keeping schedules closer across the week.</p>
<p>Dim nights and bright mornings are free tools.</p>
<p>Shift work is biologically hard — maximize control where you can.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Use light, cool darkness, and consistent timing for circadian support.</p>
<h3>Chapter 9: Kids, schools, and sleep</h3>
<p>Early school starts often collide with adolescent delayed sleep phase, creating teen sleep debt.</p>
<p>Adults should model sleep respect — not boast about four-hour nights.</p>
<p>Protect children’s sleep windows at home.</p>
<p>Advocate for humane schedules where you have influence.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Respect developmental sleep needs — especially for teens.</p>
<h3>Chapter 10: Sleep myths and aids</h3>
<p>Myths include unlimited weekend banking, superiority of short sleep, and that older adults need almost none. Reality is nuanced.</p>
<p>Some aids sedate without natural architecture — seek medical advice; do not self-prescribe from a summary.</p>
<p>CBT-I is often first-line for insomnia in clinical care.</p>
<p>Beware magic supplement marketing.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Question sleep myths — seek clinical care for chronic insomnia.</p>
<h3>Chapter 11: Minimum viable night</h3>
<p>Wind-down ritual, caffeine cutoff, alcohol restraint, cool dark room, consistent bedtime, phones out of bed, morning light. Boring works.</p>
<p>Park racing thoughts on paper before bed.</p>
<p>Protect sleep like important meetings.</p>
<p>Behavioral tactics from clinicians help if you lie awake fighting.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Install a boring, consistent pre-sleep ritual and room setup.</p>
<h3>Chapter 12: Sleep as competitive edge</h3>
<p>In a culture that performs exhaustion, sleeping enough becomes a quiet advantage: judgment, mood, immunity, learning.</p>
<p>Leaders who sleep decide better for teams.</p>
<p>Refuse pride in deprivation.</p>
<p>Tonight set a bedtime alarm, not only a wake alarm.</p>
<p>Capture the idea in one actionable sentence and place it where decisions happen.</p>
<p>Teach one person a piece of this chapter; teaching embeds memory.</p>
<p>Sunday review: where did you practice this, and where did you drift?</p>
<p><strong>Lesson:</strong> Treat enough sleep as a performance edge — drop deprivation as identity.</p>
<h3>Application Lab 1: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 2: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 3: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 4: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 5: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 6: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 7: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 8: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 9: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 10: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 11: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 12: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 13: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 14: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Application Lab 15: Why We Sleep</h3>
<p>Turn Why We Sleep into a seven-day field test. Pick one yes/no behavior that proves you are practicing a core idea. Keep it small and binary. Put it on a card by your bed or kettle.</p>
<p>Design support: tools closer, distractions farther, one ally check-in. Decide a miss protocol — restart within a day without shame trials. Note friction patterns midweek and clarify any vague behavior.</p>
<p>End the week with a half-page memo: what improved, what is hard, what continues two more weeks. Reread one chapter tied to your biggest miss. Share one lesson without preaching. Schedule the next lab.</p>
<p>Protect sleep and relationships while training. If energy crashes, shrink the behavior until doable, then rebuild. Identity — someone who practices — beats a perfect week.</p>
<p>Stack labs across a month. Continuity outperforms binge motivation. Keep language practical: verbs, times, places. Measure approach days, not mood alone. Let the book become shared vocabulary with your crew for hard days.</p>
<p><strong>Lesson:</strong> Weekly yes/no labs plus a short memo turn reading into identity change.</p>

<h3>Deep Practice Block 1: Why We Sleep</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Why We Sleep as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>

<h3>Deep Practice Block 2: Why We Sleep</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Why We Sleep as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>

<h3>Deep Practice Block 3: Why We Sleep</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Why We Sleep as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>

<h3>Deep Practice Block 4: Why We Sleep</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Why We Sleep as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>

<h3>Deep Practice Block 5: Why We Sleep</h3>
<p>This block exists to push the reading into durable practice and to give you enough depth to teach the material. For the next ten days, treat Why We Sleep as a curriculum, not a one-time inspiration hit. Day one: reread your three favorite chapters and underline only sentences that tell you to do something. Rewrite those sentences as calendar actions with times and places.</p>
<p>Days two through four: run the actions at low intensity. Collect friction notes in a single page: what time failed, which people helped, which stories delayed you, which environment cues worked. Adjust the plan once based on evidence, not based on a dramatic reboot fantasy. Momentum likes boring continuity.</p>
<p>Days five through seven: raise difficulty about ten percent. Add a harder conversation, a stricter bedtime, a longer training block, a clearer boundary, or a public commitment — whichever matches the book’s thesis. Keep recovery intact. If sleep, relationships, or ethics start breaking, you are doing intensity theater, not mastery.</p>
<p>Days eight through ten: teach. Explain the book’s core model to one person using your own examples. Answer their skepticism without becoming a preacher. Teaching will reveal what you only thought you understood. Close with a written memo to future-you: what continues for the next month, what is retired, and what warning signs mean you are sliding.</p>
<p>Optional crew mode: form a two-to-four person circle reading the same title. Meet once for thirty minutes. Each person brings one win, one miss, and one ask. Keep the meeting practical. End on time. Culture is built in these small rooms more than in solitary screenshot highlights of book covers.</p>
<p>If you stall completely, shrink to a two-minute version of the key behavior and rebuild. Identity is the average of returns. The point of a long microlearn summary is not to impress yourself with length — it is to give enough surface area that one idea finally sticks hard enough to change a Tuesday.</p>
<p><strong>Lesson:</strong> Run a ten-day curriculum cycle — underline actions, practice, raise difficulty slightly, then teach and memo.</p>
',
    32,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781501144318-L.jpg',
    'Matthew Walker’s science of sleep — why it matters for health, learning, emotion, and longevity.'
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
  ('What is Walker’s core claim?', 'Sleep is optional for high performers', 'Sleep is essential biological maintenance for brain and body', 'Only REM matters', 'Caffeine replaces sleep', 'B', 1),
  ('Why do NREM and REM both matter?', 'They do identical jobs', 'Different stages support different restoration, memory, and emotional processes', 'Only total hours matter, never stages', 'REM is harmful', 'B', 2),
  ('How can caffeine hurt sleep?', 'It never lasts past thirty minutes', 'It can linger for hours and fragment night sleep', 'It always improves deep sleep', 'It only affects taste', 'B', 3),
  ('What is a problem with alcohol and sleep?', 'Alcohol creates perfect REM', 'Sedation is not the same as restorative sleep architecture', 'Alcohol has no sleep effect', 'Late drinking always helps learning', 'B', 4),
  ('What circadian tip is emphasized?', 'Bright screens late help sleep', 'Morning light and dim cool nights support the body clock', 'Ignore timing entirely', 'Vary bedtime wildly each day', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
