#!/usr/bin/env python3
"""Core Habits microlearn content payloads for Nutrapp."""
from __future__ import annotations

import re


def word_count(html: str) -> int:
    """Return readable word count after stripping HTML tags."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return len(text.split()) if text else 0


def Q(text: str, a: str, b: str, c: str, d: str, ans: str) -> dict:
    return {
        "question_text": text,
        "option_a": a,
        "option_b": b,
        "option_c": c,
        "option_d": d,
        "correct_answer": ans,
    }


def habit(
    slug: str,
    title: str,
    minutes: int,
    desc: str,
    html: str,
    questions: list[dict],
) -> dict:
    assert len(questions) == 5
    assert all(q["correct_answer"] in "ABCD" for q in questions)
    return {
        "slug": slug,
        "title": title,
        "duration_minutes": minutes,
        "short_description": desc,
        "content_text": "\n".join(line.rstrip() for line in html.strip().splitlines()),
        "questions": questions,
    }


HABITS: list[dict] = []

HABITS.append(
    habit(
        "sleep",
        "Sleep",
        8,
        "Consistent, high-quality sleep restores your brain, body, and willpower better than any productivity hack.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Sleep is biological infrastructure</h2>
<ul><li>Memory consolidation, immune function, and emotional regulation all depend on adequate sleep.</li></ul>
<h2>2. Circadian rhythm drives timing</h2>
<ul><li>Your body expects light, darkness, and regular bed/wake times — not random schedules.</li></ul>
<h2>3. Deep and REM sleep do different jobs</h2>
<ul><li>Deep sleep repairs the body; REM sleep integrates learning and emotional processing.</li></ul>
<h2>4. Sleep debt compounds</h2>
<ul><li>One bad night hurts focus; chronic short sleep raises risk for mood, weight, and chronic disease.</li></ul>
<h2>5. Environment and routine beat willpower</h2>
<ul><li>Cool, dark, quiet rooms and a wind-down ritual make good sleep the default.</li></ul>
<h1>PART 2 — SLEEP</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Why sleep is the foundation habit</h3>
<p>Sleep is not idle time — it is when your brain clears metabolic waste, consolidates memories, and resets emotional circuits. Research across neuroscience and epidemiology consistently links seven to nine hours of regular sleep with sharper cognition, better mood regulation, and lower long-term health risk. When you shortchange sleep to squeeze in more work, you often borrow from tomorrow's focus, patience, and decision quality.</p>
<p>Athletes, surgeons, and students all show measurable performance drops after even modest sleep restriction. Reaction time slows, creativity narrows, and you reach for sugar and caffeine to compensate — a cycle that further disrupts sleep. Treating sleep as a core habit means protecting it the way you protect meetings that matter: non-negotiable, scheduled, and defended from "just one more episode."</p>
<p>The glymphatic system — discovered in recent neuroscience — clears brain waste products primarily during sleep, offering a biological reason why chronic restriction feels like mental fog beyond mere tiredness.</p>
<p><strong>Lesson:</strong> Prioritize sleep as infrastructure for every other habit — without it, discipline and learning degrade faster than you notice.</p>
<h3>Chapter 2: Circadian rhythm and consistent timing</h3>
<p>Your suprachiasmatic nucleus — the brain's master clock — sets a roughly twenty-four-hour rhythm for hormones, body temperature, and alertness. Morning light advances the clock; late-night bright screens delay it. Irregular bedtimes confuse this system, producing social jet lag: you feel tired at the wrong hours and wired when you should wind down.</p>
<p>Studies on shift workers and students with variable schedules show higher rates of mood problems and metabolic disruption. A practical anchor is a fixed wake time, even on weekends, with bedtime adjusted to match your natural sleep need. Consistency trains your body to release melatonin predictably, making sleep onset faster and deeper over weeks.</p>
<p>Outdoor morning light within an hour of waking — even cloudy days — strengthens circadian anchoring more reliably than indoor bulbs alone for most people.</p>
<p><strong>Lesson:</strong> Stabilize wake time first — circadian consistency makes falling asleep and waking refreshed far easier.</p>
<h3>Chapter 3: What happens during deep and REM sleep</h3>
<p>Sleep cycles through light, deep (slow-wave), and REM stages about every ninety minutes. Deep sleep dominates early in the night and supports physical recovery, growth hormone release, and immune tuning. REM sleep increases toward morning and is rich in vivid dreams; it helps integrate new skills and process emotional experiences from the day.</p>
<p>Alcohol and some sleep aids suppress REM; chronic restriction leaves you mentally foggy even if total hours look adequate. Tracking how rested you feel — not just time in bed — helps you notice when you are missing restorative stages. Naps can help short-term alertness but rarely replace the full cycle architecture of a proper night.</p>
<p>Learning new motor skills — instrument, sport technique — shows measurable improvement after sleep-rich nights, linking your Microlearn and Workout habits directly to protecting REM and deep stages.</p>
<p><strong>Lesson:</strong> Aim for uninterrupted nightly cycles — deep and REM sleep do distinct repair work you cannot fully replace with caffeine.</p>
<h3>Chapter 4: The cost of sleep debt</h3>
<p>Sleep debt accumulates silently. After several nights of six-hour sleep, people often adapt subjectively — they feel "fine" — while objective tests show sustained deficits in attention and risk assessment. Chronic short sleep is associated with higher blood pressure, insulin resistance, and depression risk in large cohort studies.</p>
<p>Weekend catch-up sleep helps somewhat but does not fully erase metabolic and cognitive effects of a sleep-deprived workweek. Banking sleep before a demanding period (extra sleep for a week) can buffer one rough night better than relying on recovery afterward. The habit goal is prevention: regular sufficiency, not heroic rebound.</p>
<p>Driving after moderate sleep restriction impairs reaction time comparably to low-level alcohol in some lab studies — sleep debt is a safety issue, not only a productivity one.</p>
<p><strong>Lesson:</strong> Treat chronic short sleep as compounding debt — prevention through nightly sufficiency beats weekend recovery alone.</p>
<h3>Chapter 5: Designing your sleep environment</h3>
<p>Temperature matters: a slightly cool bedroom (around 65–68°F / 18–20°C) supports the natural drop in core body temperature that initiates sleep. Darkness signals melatonin production — blackout curtains or an eye mask help in urban settings. Noise disruptions fragment sleep even when you do not fully wake; white noise or earplugs can mask intermittent sounds.</p>
<p>Reserve the bed for sleep and intimacy, not scrolling or work, so your brain associates the space with rest. If you cannot sleep after twenty minutes, get up, do something calm in dim light, and return when sleepy — lying awake builds frustration and conditioned arousal. Small environmental upgrades often outperform willpower battles at midnight.</p>
<p>Replace glow-in-the-dark charger LEDs and standby lights — tiny photons matter when melatonin sensitivity peaks in biological darkness.</p>
<p><strong>Lesson:</strong> Shape a cool, dark, quiet, bed-only-for-sleep environment so rest becomes automatic rather than fought for.</p>
<h3>Chapter 6: A practical wind-down and morning routine</h3>
<p>Begin a wind-down thirty to sixty minutes before bed: dim lights, stop intense work, and swap stimulating content for reading, stretching, or journaling. Caffeine has a half-life of several hours — many people sleep better when they stop coffee by early afternoon. Morning bright light exposure, movement, and hydration reinforce the circadian signal that daytime is for activity and night is for rest.</p>
<p>Track sleep for two weeks: bed time, wake time, and next-day energy. Adjust in fifteen-minute increments rather than drastic overhauls. Pair this habit with your other core habits — exercise improves sleep quality, but intense late-evening workouts can delay sleep for some people; experiment and notice your pattern.</p>
<p>Write tomorrow's top three tasks before bed — offloading open loops onto paper reduces midnight rumination and supports your Reflect habit simultaneously.</p>
<p><strong>Lesson:</strong> Use a repeatable wind-down and morning light routine — small daily cues train your body to sleep deeply and wake clear.</p>
""",
        [
            Q("Why is sleep described as 'biological infrastructure' in this lesson?", "It wastes time you could use for work", "Memory, immunity, and mood regulation depend on adequate sleep", "Only athletes need consistent sleep", "Sleep only matters on weekends", "B"),
            Q("What is the recommended first step for circadian consistency?", "Change bedtime randomly each night", "Fix a consistent wake time, including weekends", "Sleep until noon on days off", "Use bright screens in bed", "B"),
            Q("Which sleep stage is especially linked to memory integration and emotional processing?", "Light sleep only", "REM sleep", "Wakefulness", "Deep sleep only, with no REM role", "B"),
            Q("What happens with chronic sleep debt according to research cited here?", "People always feel exhausted immediately", "Deficits in attention and health risk can persist even when you feel 'fine'", "Weekend sleep fully erases all debt", "Debt only affects mood, not cognition", "B"),
            Q("Which environmental change best supports melatonin and sleep onset?", "Bright overhead lights at midnight", "A cool, dark bedroom reserved mainly for sleep", "Working in bed to associate it with productivity", "Loud unpredictable noise", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "gym",
        "Workout",
        8,
        "Regular resistance training builds strength, bone density, and metabolic health that cardio alone cannot fully deliver.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Strength is a longevity investment</h2>
<ul><li>Muscle and bone density decline with age unless you train against resistance.</li></ul>
<h2>2. Progressive overload drives adaptation</h2>
<ul><li>Muscles grow when workload gradually increases — not when you repeat the same easy routine forever.</li></ul>
<h2>3. Compound movements give the most return</h2>
<ul><li>Squats, hinges, pushes, pulls, and carries train real-world movement patterns efficiently.</li></ul>
<h2>4. Recovery is part of training</h2>
<ul><li>Muscles repair and strengthen during rest; sleep and nutrition complete the workout.</li></ul>
<h2>5. Consistency beats perfection</h2>
<ul><li>Two or three solid sessions weekly for years outperform sporadic heroic gym marathons.</li></ul>
<h1>PART 2 — WORKOUT</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Why resistance training belongs in core habits</h3>
<p>Resistance training — lifting weights, using bands, or moving your body against load — is one of the most evidence-backed habits for long-term health. It increases lean muscle mass, improves insulin sensitivity, and supports joint stability. After age thirty, adults lose muscle steadily unless they train; sarcopenia raises fall risk and frailty decades later.</p>
<p>Unlike cardio alone, strength work loads bones and connective tissue, reducing osteoporosis risk. It also elevates resting metabolic rate modestly because muscle is metabolically active tissue. For mental health, structured lifting provides clear feedback loops — you either moved the weight or you did not — which builds confidence and stress tolerance alongside physical capacity.</p>
<p>Meta-analyses of randomized trials report improved insulin sensitivity when adults at metabolic risk add twice-weekly resistance training, even when scale weight changes modestly — a quiet lab marker that compounds over decades of consistent work.</p>
<p><strong>Lesson:</strong> Treat strength training as essential maintenance for muscle, bone, and metabolism — not an optional aesthetic extra.</p>
<h3>Chapter 2: Progressive overload explained</h3>
<p>Your body adapts to the stress you impose. Progressive overload means gradually increasing demand: more weight, more reps, slower tempo, or shorter rest. Without progression, you maintain but rarely improve. Beginners can add weight weekly; intermediate lifters may progress in smaller steps or cycle intensity over months.</p>
<p>Track sets, reps, and load in a notebook or app. When you hit the top of your rep range with good form across all sets, increase load slightly next session. Deload weeks — reducing volume or intensity periodically — help joints and nervous system recover while preserving habit continuity. Overload must be progressive, not reckless: form breakdown is a signal to stop, not push through.</p>
<p>Autoregulate on stressful weeks: hold loads steady rather than forcing jumps; on strong weeks, take the progression you earned with crisp reps instead of grinding through compromised technique.</p>
<p><strong>Lesson:</strong> Log workouts and increase load or reps systematically — adaptation requires gradually harder stimulus, not random effort.</p>
<h3>Chapter 3: Compound lifts and movement patterns</h3>
<p>Compound exercises train multiple joints and muscle groups: squat patterns, hip hinges (deadlifts, Romanian deadlifts), horizontal and vertical pushes and pulls, and loaded carries. They mirror daily life — picking up bags, standing from a chair, pushing doors — and deliver more training stimulus per minute than endless isolation curls.</p>
<p>A balanced beginner program might include goblet squats, dumbbell rows, push-ups or bench press, and a hinge variation twice weekly. Learn technique with light loads before chasing numbers; a qualified coach or reputable form videos reduce injury risk. Accessory isolation work has its place, but compounds should anchor the session.</p>
<p>Unilateral work — split squats, single-leg hinges — exposes left-right imbalances before barbell loads magnify them, a cheap insurance policy against preventable strains as weights climb.</p>
<p><strong>Lesson:</strong> Build sessions around squat, hinge, push, pull, and carry patterns — compounds give the highest return on training time.</p>
<h3>Chapter 4: Recovery, protein, and sleep</h3>
<p>Training provides the stimulus; recovery builds the result. Muscle protein synthesis peaks in the hours after lifting, supported by adequate protein intake — roughly 1.6–2.2 g per kg body weight for active people, spread across meals. Sleep deprivation blunts recovery hormones and increases injury susceptibility.</p>
<p>Schedule at least one rest day between hard sessions for the same muscle groups, or alternate upper and lower splits. Soreness is not the goal; manageable fatigue with improving performance is. Hydration and micronutrients matter at the margins, but consistency in training, protein, and sleep forms the base.</p>
<p>Distribute protein across breakfast, lunch, and dinner — repeated amino acid signals through the day support repair better than one oversized post-gym shake alone.</p>
<p><strong>Lesson:</strong> Pair lifting with sufficient protein and sleep — muscles grow between workouts, not during them.</p>
<h3>Chapter 5: Injury awareness and long-term joint health</h3>
<p>Strength training, done well, protects joints by strengthening supporting muscles and improving movement control. Done poorly — excessive load, ignored pain, or skipping warm-ups — it can cause setbacks. Warm up with lighter sets of the movements you will train; mobility work supports range of motion but does not replace loaded strength.</p>
<p>Sharp pain differs from muscle burn: stop and assess sharp or joint-line pain. Long-term lifters emphasize sustainable loads and full range of motion over ego lifting. Balance pushing and pulling volume to avoid rounded-shoulder posture from overemphasizing chest work alone.</p>
<p>Occasionally film your heaviest working set — video reveals hip shift, knee cave, or lumbar rounding that mirrors miss, giving corrections before small drift becomes a painful setback.</p>
<p><strong>Lesson:</strong> Lift with full range, balanced programming, and pain-aware form — longevity in the gym beats short-term maxes.</p>
<h3>Chapter 6: Building a sustainable workout habit</h3>
<p>Attach gym sessions to fixed calendar slots — same days and times each week — and prepare gear the night before. Start with two or three forty-five-minute sessions if you are new; intensity and exercise variety can grow as technique solidifies. Minimum effective dose beats zero: a short full-body workout maintains momentum on busy weeks.</p>
<p>Measure success in months and years: strength trends, energy, and how daily tasks feel. Celebrate showing up, then refine programming. Integrate this habit with sleep and nutrition core habits; they multiply your results more than any single supplement or program swap.</p>
<p>Train with a partner or class when solo drive fades — social accountability raises adherence in exercise research without changing the underlying physiology of progressive resistance at all.</p>
<p><strong>Lesson:</strong> Schedule two to three progressive full-body sessions weekly — consistency over years transforms health more than perfect programs you quit.</p>
""",
        [
            Q("What is a primary long-term benefit of resistance training emphasized in this lesson?", "It eliminates the need for sleep", "It helps preserve muscle and bone density as you age", "It replaces all cardiovascular exercise permanently", "It only improves appearance, not metabolism", "B"),
            Q("What is progressive overload?", "Doing the exact same workout forever", "Gradually increasing training demand over time", "Training to failure every single set", "Avoiding all tracking of weights and reps", "B"),
            Q("Which exercise category delivers the most efficient training stimulus per minute?", "Compound movements like squats and rows", "Only single-joint isolation without compounds", "Stretching without load", "Random exercises with no pattern", "A"),
            Q("When do muscles primarily adapt and grow stronger?", "During the workout only", "During recovery with adequate protein and sleep", "Only on rest days without any protein", "Immediately before warming up", "B"),
            Q("What is recommended for sustainable gym habit formation?", "Heroic daily marathons until burnout", "Two or three scheduled progressive sessions weekly", "Skipping form to lift maximum weight", "Never taking rest days", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "run",
        "Exercise",
        8,
        "Regular aerobic movement strengthens your heart, clears your head, and extends healthy years more reliably than sporadic intensity bursts.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Cardio protects the heart and brain</h2>
<ul><li>Moderate aerobic activity lowers blood pressure, improves lipid profiles, and supports cognitive aging.</li></ul>
<h2>2. Zone 2 builds an aerobic base</h2>
<ul><li>Steady conversational-pace work trains mitochondria and fat oxidation — the engine for endurance and health.</li></ul>
<h2>3. HIIT adds efficiency, not replacement</h2>
<ul><li>Short high-intensity intervals boost VO₂ max but work best layered on a base, not as the only training.</li></ul>
<h2>4. Movement beats all-or-nothing</h2>
<ul><li>Brisk walking counts; the best exercise plan is one you repeat most days of the week.</li></ul>
<h2>5. Recovery and progression prevent injury</h2>
<ul><li>Increase weekly volume gradually; rest days and easy days let tissues adapt.</li></ul>
<h1>PART 2 — EXERCISE</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Why aerobic exercise is non-negotiable</h3>
<p>Aerobic exercise — walking, jogging, cycling, swimming, dancing — raises heart rate sustainably and trains your cardiovascular system to deliver oxygen efficiently. Major health organizations recommend at least one hundred fifty minutes of moderate activity weekly because decades of epidemiology link it with lower all-cause mortality, reduced stroke and heart disease risk, and better mental health outcomes.</p>
<p>Exercise also increases BDNF, a protein supporting brain plasticity, which may explain why active people often report clearer thinking and lower anxiety. Unlike pharmaceutical fixes, movement addresses multiple systems at once: heart, lungs, muscles, mood, and sleep quality. As a core habit, daily or near-daily movement is less about athletic identity and more about biological maintenance.</p>
<p>Prospective studies following sedentary adults into active routines show reduced depression and anxiety symptoms within weeks — often before major fitness milestones — suggesting mood benefits are not only a side effect of looking fit.</p>
<p><strong>Lesson:</strong> Treat regular aerobic movement as preventive medicine for heart, brain, and mood — accessible starting with a brisk walk.</p>
<h3>Chapter 2: Building your aerobic base with Zone 2</h3>
<p>Zone 2 training is steady effort where you can still hold a conversation — roughly sixty to seventy percent of max heart rate for many people. It improves mitochondrial density and capillary networks, making everyday activity feel easier and supporting fat metabolism. Endurance athletes spend most training hours here; health-focused people benefit equally without racing.</p>
<p>Start with twenty to thirty minutes three times weekly, adding five to ten minutes every one to two weeks. Nasal breathing can help keep intensity honest. If you only ever sprint and collapse, you miss the aerobic foundation that makes life feel less breathless on stairs and during stress.</p>
<p>A heart-rate monitor or simple talk test keeps honest pace without lab testing — if you cannot speak in full sentences, you have drifted above Zone 2 regardless of what the treadmill display claims.</p>
<p><strong>Lesson:</strong> Invest weekly time at conversational pace — Zone 2 builds the aerobic engine everything else runs on.</p>
<h3>Chapter 3: When to add intensity</h3>
<p>High-intensity interval training — short bursts of hard effort with recovery — improves VO₂ max efficiently. One or two sessions weekly, after a base exists, can sharpen fitness without requiring hours daily. Examples include thirty-second hill sprints with full recovery, or four-minute brisk intervals during a walk.</p>
<p>Intensity without preparation raises injury and burnout risk. Pair HIIT with easy days and strength work for balanced physiology. Listen for persistent fatigue, sleep disruption, or declining performance — signs to pull back volume before illness or overtraining take hold.</p>
<p>Tabata-style four-minute blocks or six thirty-second hill sprints with full walk-down recovery deliver stimulus without requiring a complex program — simplicity sustains the habit when life gets crowded.</p>
<p><strong>Lesson:</strong> Layer one or two HIIT sessions on a Zone 2 base — intensity complements, not replaces, steady aerobic work.</p>
<h3>Chapter 4: Making movement fit real life</h3>
<p>The perfect program fails if it does not fit your schedule. Walking meetings, cycling commutes, stair climbing, and ten-minute movement snacks accumulate toward weekly targets. Habit stacking — exercise right after morning coffee or before shower — reduces decision fatigue.</p>
<p>Track steps or active minutes if motivation helps, but do not obsess over daily records; weekly patterns matter more. Bad weather, travel, and busy seasons happen; have a minimum version — fifteen minutes indoors, a hotel hallway lap — so identity as "someone who moves" stays intact.</p>
<p>Place walking shoes by the door and schedule movement like a meeting — visible cues and calendar blocks convert vague intention into steps actually taken before the day collapses into reactive screen time.</p>
<p><strong>Lesson:</strong> Design minimum viable movement for busy days — consistency of identity beats perfect sessions you skip.</p>
<h3>Chapter 5: Injury prevention and smart progression</h3>
<p>Most recreational injuries come from doing too much, too soon, after doing too little. Follow the ten-percent rule loosely: increase weekly duration or intensity gradually. Wear appropriate footwear; replace running shoes before cushioning collapses. Dynamic warm-ups — leg swings, light jogging — prepare tissues better than static stretching alone before activity.</p>
<p>Cross-train to vary impact: cycle on days you skip running, swim when joints complain. Pain that changes your gait deserves rest and professional assessment, not heroic continuation. Long-term exercisers win by still being active at sixty, not by peak mileage at twenty-five with ruined knees.</p>
<p>Replace shoes every three hundred to five hundred miles or when tread wear and knee niggles appear — cheap footwear renewal prevents expensive months lost to preventable overuse injuries.</p>
<p><strong>Lesson:</strong> Progress volume slowly and cross-train — staying uninjured keeps exercise compounding for decades.</p>
<h3>Chapter 6: Pairing exercise with sleep, nutrition, and goals</h3>
<p>Morning light and movement reinforce circadian rhythm; late intense sessions may delay sleep for some — notice your response. Hydrate before and after; whole-food meals supply energy without needing exotic supplements. If weight management is a goal, exercise improves health markers even when scale change is modest — do not undervalue fitness gained.</p>
<p>Connect movement to meaning: energy for family, mental clarity for creative work, or independence in old age. Review weekly: Did you hit one hundred fifty minutes? Adjust next week's calendar blocks accordingly. Exercise as a core habit means it appears on the plan before the week fills with everything else.</p>
<p>Log active minutes in your Reflect habit Sunday review — written accountability closes the loop between planned movement and the cardiovascular capacity you feel climbing stairs Monday morning.</p>
<p><strong>Lesson:</strong> Schedule movement first each week and link it to why it matters — protected time turns intention into physiology.</p>
""",
        [
            Q("What weekly moderate activity target do major health guidelines emphasize?", "Ten minutes total per month", "At least 150 minutes of moderate activity", "Only high-intensity sprinting daily", "No movement unless racing", "B"),
            Q("What characterizes Zone 2 aerobic training?", "All-out sprinting with no recovery", "Steady conversational-pace effort building mitochondrial fitness", "Complete rest with no heart rate increase", "Only weightlifting with no cardio", "B"),
            Q("How should HIIT relate to your overall exercise plan?", "Replace all easy aerobic work entirely", "Layer one or two sessions weekly on top of an aerobic base", "Avoid entirely for all health goals", "Perform HIIT daily without recovery", "B"),
            Q("What is a common cause of recreational exercise injuries?", "Gradual ten-percent volume increases", "Doing too much too soon after inactivity", "Always walking at conversational pace", "Cross-training with low-impact options", "B"),
            Q("What strategy helps maintain the exercise habit during busy weeks?", "Skip all movement until life calms down", "Use a minimum viable session to preserve identity and streak", "Only exercise when motivation feels perfect", "Double volume randomly without planning", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "meditation",
        "Meditation",
        7,
        "Daily meditation trains attention and emotional balance, reducing reactivity in ways that willpower alone rarely achieves.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Attention is trainable</h2>
<ul><li>Meditation strengthens the mental muscle of returning focus — useful far beyond the cushion.</li></ul>
<h2>2. Mindfulness is awareness without fusion</h2>
<ul><li>You notice thoughts and sensations without automatically becoming them.</li></ul>
<h2>3. Consistency beats duration</h2>
<ul><li>Five to fifteen daily minutes change brain connectivity more reliably than occasional hour-long retreats.</li></ul>
<h2>4. Stress response softens over time</h2>
<ul><li>Regular practice is linked to lower amygdala reactivity and improved emotional regulation in imaging studies.</li></ul>
<h2>5. Many doors, one skill</h2>
<ul><li>Breath focus, body scan, loving-kindness, and open monitoring all cultivate the same core capacity.</li></ul>
<h1>PART 2 — MEDITATION</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: What meditation actually trains</h3>
<p>Meditation is deliberate practice of attention and awareness. Unlike relaxation alone, it builds the skill of noticing when the mind wanders and gently returning to an anchor — often the breath, body sensations, or sounds. Neuroimaging studies on long-term meditators show changes in regions linked to attention, interoception, and emotion regulation, including the prefrontal cortex and insula.</p>
<p>These changes are not mystical; they resemble what happens when you train any capacity with repetition. Each time you catch distraction and refocus, you strengthen meta-awareness — knowing what your mind is doing while it is doing it. That skill transfers to conversations, cravings, and stressful emails: you create a half-second gap between stimulus and reaction.</p>
<p>Eight-week structured mindfulness programs in workplaces have documented reduced burnout and improved focus scores — evidence that modest daily practice accumulates without requiring monastery retreats or perfect tranquility.</p>
<p><strong>Lesson:</strong> Meditation is attention training — repeated return to an anchor builds awareness you use all day.</p>
<h3>Chapter 2: Mindfulness versus getting lost in thought</h3>
<p>Most mental suffering comes not from raw experience but from fusion with stories — "This feeling means I am failing forever." Mindfulness teaches you to observe thoughts as events in consciousness rather than absolute truths. You might note "planning" or "worry" and return to the breath instead of riding the narrative for ten minutes.</p>
<p>This is not suppression; emotions still arise and pass. Research on mindfulness-based interventions shows reductions in rumination and anxiety symptoms in many clinical trials, especially when practice is regular. The goal is clarity and choice, not blank emptiness or forced positivity.</p>
<p>Cognitive defusion techniques — naming "I am having the thought that…" — create distance without denying reality, a practical bridge between cushion practice and heated arguments at home or work.</p>
<p><strong>Lesson:</strong> Label thoughts and sensations without fusing with them — observation creates space for wiser responses.</p>
<h3>Chapter 3: Starting small and staying daily</h3>
<p>Begin with five minutes in a consistent place and time — after waking, before coffee, or before bed. Sit comfortably upright; eyes closed or softly down. Count breaths one to ten, restarting when you lose track. When boredom or restlessness appears, treat them as practice material, not failure.</p>
<p>Daily short sessions outperform sporadic long ones for habit formation and measurable stress benefits. Use a timer app without gamifying streaks into anxiety. Missing a day is normal; return the next without self-criticism — harsh inner commentary undermines the very equanimity you are cultivating.</p>
<p>Anchor meditation to an existing cue — after brushing teeth or before opening email — so the habit rides established neural pathways instead of competing with morning chaos for willpower.</p>
<p><strong>Lesson:</strong> Five daily minutes beats occasional marathons — repetition rewires attention more than rare intensity.</p>
<h3>Chapter 4: How meditation changes stress physiology</h3>
<p>Chronic stress keeps the sympathetic nervous system elevated — shallow breathing, tight jaw, scanning for threat. Meditation activates parasympathetic pathways, especially with slow exhale-focused breathing. Heart rate variability, a marker of adaptive stress response, often improves with consistent practice in research settings.</p>
<p>You are not eliminating stressors; you are changing your relationship to arousal. A mindful pause before replying can prevent an email you regret. Over months, practitioners often report lower baseline tension and faster recovery after conflict — not because life got easier, but because reactivity softened.</p>
<p>Box breathing — four counts in, hold, out, hold — offers a portable tool after practice sessions, usable before presentations or difficult conversations when you cannot sit formally.</p>
<p><strong>Lesson:</strong> Slow, conscious breathing during practice trains a calmer stress response you can invoke under pressure.</p>
<h3>Chapter 5: Exploring styles that fit you</h3>
<p>Focused-attention meditation uses one object — breath at the nostrils, belly rise, or a mantra. Open monitoring rests in broad awareness of whatever arises. Loving-kindness repeats phrases wishing well to yourself and others, strengthening social emotion circuits. Body scans systematically notice tension and release.</p>
<p>Try each for a week; keep what sustains engagement. Walking meditation suits restless temperaments — slow steps with sensation in the feet. There is no single orthodox path; the core habit is daily intentional awareness, not brand loyalty.</p>
<p>Apps and guided audio help beginners; graduate toward silent timers as confidence grows so practice survives without external voice dependency.</p>
<p><strong>Lesson:</strong> Sample breath focus, body scan, and loving-kindness — pick the style you will actually repeat daily.</p>
<h3>Chapter 6: Integrating mindfulness into ordinary life</h3>
<p>Formal sitting is the gym; informal mindfulness is game day. Practice single-tasking: one browser tab, full attention on one person speaking, tasting the first three bites of a meal. Set phone-free transitions — door to car, elevator to office — as micro-meditations.</p>
<p>Pair meditation with your Reflect and Sleep habits: journal insights after sitting, protect morning practice before inbox chaos. When you notice impatience in line, take one conscious breath before reacting. The habit succeeds when stillness leaks into motion, not when it stays isolated on a cushion.</p>
<p>Notice which triggers repeatedly hijack attention — email, news, certain people — and pre-commit one breath before engaging; targeted micro-pauses beat vague intentions to "be more mindful" someday.</p>
<p><strong>Lesson:</strong> Carry brief mindful pauses into daily transitions — meditation matters when it changes how you live, not only how you sit.</p>
""",
        [
            Q("What core skill does focused-attention meditation primarily train?", "Suppressing all emotions permanently", "Noticing distraction and returning to an anchor like the breath", "Achieving blank mind with no thoughts ever", "Replacing sleep entirely", "B"),
            Q("What does 'fusion with thoughts' mean in mindfulness language?", "Observing thoughts as passing mental events", "Believing every thought as absolute truth without distance", "Writing thoughts down only", "Ignoring bodily sensations", "B"),
            Q("What practice schedule does research-supported habit formation favor?", "Five daily minutes consistently", "One six-hour session per year only", "Only meditating when fully calm", "Hour-long sessions once a month", "A"),
            Q("How can meditation affect stress physiology according to this lesson?", "It eliminates all external stressors", "It can activate calmer parasympathetic patterns and improve stress recovery", "It increases chronic sympathetic arousal", "It only changes mood with no body effects", "B"),
            Q("What is an example of informal mindfulness integration?", "Multitasking five apps while eating", "One conscious breath before reacting in a stressful moment", "Never practicing outside formal sitting", "Avoiding all social interaction", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "update_goal",
        "Update Goal",
        7,
        "Reviewing and refining your goals weekly keeps effort aligned with what actually matters instead of what felt urgent months ago.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Goals decay without review</h2>
<ul><li>Priorities shift; stale targets drain motivation and misallocate time.</li></ul>
<h2>2. Outcomes need leading indicators</h2>
<ul><li>Break big aims into weekly behaviors you control — inputs predict outputs over time.</li></ul>
<h2>3. Less but clearer beats long lists</h2>
<ul><li>One to three active goals per life area maintain focus; everything else waits in a backlog.</li></ul>
<h2>4. Honest assessment enables adjustment</h2>
<ul><li>Weekly review surfaces blockers, wins, and goals that should be dropped or reframed.</li></ul>
<h2>5. Goals serve identity and values</h2>
<ul><li>The best goals connect to who you are becoming, not borrowed expectations.</li></ul>
<h1>PART 2 — UPDATE GOAL</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Why goals need maintenance</h3>
<p>A goal set in January and never revisited becomes wallpaper — visible but powerless. Life introduces new constraints, opportunities, and information. Without periodic updates, you may grind toward targets that no longer fit while neglecting emerging priorities. Weekly goal review is maintenance for direction, similar to sleep for the body or accounts for a business.</p>
<p>Research on goal-setting shows specific, challenging goals improve performance — but only when people track progress and adjust tactics. Locke and Latham's decades of work emphasize feedback loops. Updating goals is not failure; it is steering. Ships constantly correct course; they do not lock the rudder at departure.</p>
<p>Quarterly OKR-style reviews at companies exist because static annual plans fail in volatile environments — your personal goals deserve the same adaptive cadence at weekly scale.</p>
<p><strong>Lesson:</strong> Schedule weekly goal review — direction rots without feedback the same way skills decay without practice.</p>
<h3>Chapter 2: Separating outcomes from behaviors</h3>
<p>Outcome goals state results: "Run a half marathon," "Save five thousand dollars." Behavior goals state actions you control: "Run three times weekly," "Transfer two hundred dollars each payday." Outcomes motivate; behaviors drive progress. Each outcome on your list should map to one or two weekly leading indicators you can tick yes or no.</p>
<p>When a behavior streak is solid but outcomes lag, the goal may need reframing — wrong metric or unrealistic timeline. When behaviors slip, the issue is execution or environment design, not self-loathing. Update which behaviors matter most this week rather than vague promises to "try harder."</p>
<p>Example: "lose weight" becomes "log meals and walk thirty minutes five times" — binary weekly checks replace scale anxiety you cannot directly control day to day.</p>
<p><strong>Lesson:</strong> Tie every outcome goal to controllable weekly behaviors — you manage inputs; outcomes follow over time.</p>
<h3>Chapter 3: The power of limiting active goals</h3>
<p>Cognitive load theory explains why ten simultaneous priorities produce thrashing, not achievement. Limit active goals to what fits on one screen: perhaps one health, one career, one relationship, and one personal growth aim. Other ideas go to a someday list reviewed monthly, not daily.</p>
<p>Saying no — archiving a goal for now — frees energy for what counts. Completion rates rise when focus narrows. During weekly update, ask: "If I could only advance one goal next week, which would move my life most?" Let that answer reorder your calendar.</p>
<p Warren Buffett's rumored two-list exercise — circle top five, avoid the rest until the first five finish — is extreme but directionally correct for attention-limited humans.</p>
<p><strong>Lesson:</strong> Keep one to three active goals per domain — focused pursuit beats scattered ambition.</p>
<h3>Chapter 4: Running an effective weekly review</h3>
<p>Block twenty to thirty minutes: same day each week works best — Sunday evening or Monday morning. Scan each active goal: What happened last week? What blocked progress? What is the single next action? Write adjustments in your goal tool or journal; vague mental notes disappear by Wednesday.</p>
<p>Celebrate wins explicitly — dopamine reinforces continuation. For stalled goals, choose among three paths: shrink scope, change tactic, or pause the goal honestly. Avoid zombie goals that linger from guilt. Pair this ritual with Reflect habit time for deeper why-checking.</p>
<p>End each review with calendar edits — if it is not scheduled, it is not real; drag focus blocks and behavior triggers into next week before closing the doc.</p>
<p><strong>Lesson:</strong> Use a fixed weekly slot to log wins, blockers, and next actions — written review beats hoping you'll remember.</p>
<h3>Chapter 5: Aligning goals with values and identity</h3>
<p>Goals borrowed from comparison — their promotion, their body, their timeline — erode quickly under friction. Ask: "Why does this matter to me in five years?" Connect goals to identity statements: "I am someone who finishes creative projects," "I am a reliable partner." Identity-linked goals survive boring middle weeks better than pure vanity metrics.</p>
<p>Values conflicts surface in review: a career goal demanding eighty-hour weeks may clash with a health or family value. Updating might mean redefining success, not abandoning ambition. Clarity reduces background anxiety because your calendar matches declared priorities.</p>
<p>Write a one-line "because" under each active goal — revisiting the because during hard weeks separates temporary discomfort from fundamental misalignment worth quitting.</p>
<p><strong>Lesson:</strong> Filter goals through values and identity — aligned aims sustain effort when motivation dips.</p>
<h3>Chapter 6: Tools, metrics, and knowing when to quit</h3>
<p>Use simple systems: a shared doc, Notion board, or paper index card on your desk. Metrics should be legible — binary habits logged, dollars saved, pages drafted. Avoid vanity dashboards that look productive but lack decision value. Review trends over four-week windows, not single bad days.</p>
<p>Quitting is strategic when evidence shows a goal is wrong, not when discomfort appears. Sunk cost traps keep people in misaligned paths for years. Updating goals includes courageous stops — freeing resources for better bets. Next week, your calendar should reflect this week's honest update.</p>
<p>Archive paused goals with a revisit date — "someday/maybe June" — so guilt-free parking replaces endless zombie carryover cluttering every weekly review.</p>
<p><strong>Lesson:</strong> Track simple leading metrics and quit misaligned goals deliberately — updating includes stopping, not only adding.</p>
""",
        [
            Q("Why do goals 'decay' without regular review?", "Goals automatically improve over time", "Priorities and context change while stale targets misdirect effort", "Review is only needed once per decade", "Written goals never need adjustment", "B"),
            Q("What is the relationship between outcome and behavior goals?", "Behavior goals replace all outcome goals entirely", "Outcomes motivate; controllable weekly behaviors drive progress toward them", "Outcomes are less important than random tasks", "Behaviors should never be measured", "B"),
            Q("How many active goals per life area does this lesson recommend?", "As many as possible simultaneously", "One to three active goals to maintain focus", "Zero goals at all times", "Only goals others choose for you", "B"),
            Q("What should a weekly goal review include?", "Only celebrating without assessing blockers", "Wins, blockers, and a clear next action for each active goal", "Deleting all goals every week", "Avoiding any written record", "B"),
            Q("When is quitting a goal considered strategic?", "Whenever any discomfort appears", "When evidence shows the goal is misaligned, not merely difficult", "Never — all goals must continue forever", "Only when someone else tells you to stop", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "microlearn",
        "Microlearn",
        7,
        "Brief daily learning compounds into expertise — small consistent doses beat rare marathon study sessions for retention and motivation.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Spacing beats cramming</h2>
<ul><li>Distributed practice strengthens long-term memory better than single long sessions.</li></ul>
<h2>2. Active recall locks knowledge in</h2>
<ul><li>Quizzing yourself beats re-reading; effortful retrieval builds durable learning.</li></ul>
<h2>3. Micro-sessions lower the barrier</h2>
<ul><li>Five to fifteen minutes daily fits busy calendars and preserves streak psychology.</li></ul>
<h2>4. Curiosity needs structure</h2>
<ul><li>A queue of topics and one next lesson prevents random scrolling disguised as learning.</li></ul>
<h2>5. Learning serves application</h2>
<ul><li>Notes and one tiny action after each lesson transfer knowledge into life and work.</li></ul>
<h1>PART 2 — MICROLEARN</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: The science of learning in small doses</h3>
<p>Cognitive psychology has long documented the spacing effect: material reviewed across days is remembered longer than material crammed in one sitting. Hermann Ebbinghaus's forgetting curve shows memory decays rapidly without reinforcement; brief daily touchpoints flatten that decay. Microlearning aligns with how working memory and attention actually operate — short focused bursts with rest between them.</p>
<p>Mobile life fragments time into gaps — commutes, queues, coffee cooling. Microlearn habit claims those gaps intentionally instead of surrendering them to passive feeds. The compound interest metaphor applies: one lesson daily is three hundred sixty-five exposures yearly, each building on prior frames. Expertise rarely arrives from one heroic weekend.</p>
<p>Make It Stick authors Roediger and McDaniel emphasize that learning is deeper when effortful — micro-doses spread across the year align with that science better than binge-reading three books on vacation and forgetting most by autumn.</p>
<p><strong>Lesson:</strong> Daily short learning sessions exploit spacing — small repeated doses beat rare cramming for lasting memory.</p>
<h3>Chapter 2: Active recall and the testing effect</h3>
<p>Re-reading feels fluent and falsely signals mastery. Active recall — closing the book and explaining a concept, answering quiz questions, or writing from memory — forces retrieval pathways that strengthen storage. The testing effect shows that being quizzed on material improves retention more than additional study time alone.</p>
<p>After each microlesson, ask: What were three key ideas? What is one question I still have? Nutrapp's quiz questions exist for this reason — struggle is the point. If you cannot answer, revisit briefly, then test again tomorrow. Difficulty during learning predicts durability later.</p>
<p>Flashcards and blank-page summaries take two minutes but double retention versus highlighting — choose effort over comfort when closing each session.</p>
<p><strong>Lesson:</strong> Close each lesson with self-quiz or summary from memory — retrieval effort is what makes knowledge stick.</p>
<h3>Chapter 3: Designing a sustainable learning queue</h3>
<p>Without a queue, "learn something" becomes endless algorithmic browsing. Maintain a short list: next book summary, skill module, or language lesson. Finish one before hoarding ten more. Completion provides closure and identity reinforcement — you are someone who finishes ideas, not only bookmarks them.</p>
<p>Pick one primary track for a month — nutrition basics, leadership, coding fundamentals — so lessons connect into schema rather than isolated trivia. Rotate tracks only when the current one reaches a natural milestone. Boredom is a signal to increase challenge or apply knowledge, not necessarily to switch topics daily.</p>
<p>Cap your queue at three items — incoming recommendations go to a separate inbox reviewed monthly, preventing guilt stacks that make starting feel impossible.</p>
<p><strong>Lesson:</strong> Keep a finite learning queue and one monthly focus track — structure turns curiosity into completion.</p>
<h3>Chapter 4: Attention and environment for micro-sessions</h3>
<p>Even eight minutes require protected attention. Phone on do-not-disturb, one tab open, headphones if needed. Multitasking microlearning while watching TV yields little retention — the habit worth building is single-channel focus, which also supports your Focus core habit.</p>
<p>Same time and place cues help: morning coffee plus lesson, or post-lunch desk reset. Physical consistency trains the brain to enter learning mode faster. If energy is low, choose lighter content but keep the streak — showing up matters on tired days too.</p>
<p>Keep headphones and lesson app on home screen — reducing open friction by ten seconds measurably increases daily completion when willpower is depleted.</p>
<p><strong>Lesson:</strong> Protect eight distraction-free minutes with consistent cues — focused micro-sessions beat distracted long ones.</p>
<h3>Chapter 5: From consumption to application</h3>
<p>Knowledge unused atrophies in memory and relevance. After learning, write one sentence: "I will apply this by…" Examples: adjust sleep wind-down after a sleep lesson, try one progressive overload tweak after a workout module. Teaching someone else — a thirty-second voice note to a friend — deepens understanding further.</p>
<p>Keep a running "insights" note linked to your Reflect habit. Review monthly: which ideas changed behavior? Double down on domains with applied output; pause domains that stayed purely theoretical. Learning serves life, not leaderboard points alone.</p>
<p>Schedule a five-minute "implementation Friday" — one tiny experiment from the week's lessons — so knowledge exits your head before the next module arrives.</p>
<p><strong>Lesson:</strong> End each lesson with one concrete application or teach-back — use is what converts information into skill.</p>
<h3>Chapter 6: Building identity as a lifelong learner</h3>
<p>Identity language matters: say "I am learning daily" rather than "I should read more someday." Streaks and calendars visualize consistency; forgive misses and return next day without shame spirals. Pair Microlearn with Update Goal — align lessons with active goals so study feeds projects, not escapism.</p>
<p>Over years, microlearners accumulate frameworks that improve judgment in work, health, and relationships. You will not remember every fact; you will recognize patterns faster. That is the payoff — better thinking, not trivia hoarding. Open today's lesson before the feed wins.</p>
<p>Share one insight weekly with a friend or team — teaching cements identity and creates gentle accountability without performative hustle culture.</p>
<p><strong>Lesson:</strong> Claim learner identity with daily action — compounded microlessons sharpen judgment more than occasional inspiration.</p>
""",
        [
            Q("What does the spacing effect demonstrate about learning?", "Cramming once is best for long-term memory", "Distributed practice across days improves retention", "Learning only works in hour-long blocks", "Review never helps memory", "B"),
            Q("Why is active recall more effective than re-reading alone?", "It feels easier than reading", "Effortful retrieval strengthens memory pathways", "It avoids all difficulty during study", "It eliminates the need for quizzes", "B"),
            Q("What is recommended for managing learning topics?", "Endlessly bookmark without finishing", "Maintain a finite queue with one primary monthly focus track", "Switch random topics every day", "Never complete a module", "B"),
            Q("How should you end a microlesson for best retention?", "Immediately open social media", "Summarize from memory and note one application step", "Skip all review to save time", "Only re-read passively", "B"),
            Q("What long-term benefit does daily microlearning primarily build?", "Perfect recall of every fact", "Sharper pattern recognition and judgment over time", "Elimination of all need for experts", "Guaranteed career promotion alone", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "focus",
        "Focus",
        8,
        "Protected deep work blocks multiply the quality of everything you produce — fragmented attention is the hidden tax on modern life.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Attention is finite and fragmentable</h2>
<ul><li>Context switching carries a measurable cognitive cost that lingers after each interruption.</li></ul>
<h2>2. Deep work creates disproportionate value</h2>
<ul><li>Uninterrupted concentration on hard problems beats hours of shallow multitasking.</li></ul>
<h2>3. Environment design beats raw discipline</h2>
<ul><li>Notifications off, clear task, defined start and end — structure reduces willpower drain.</li></ul>
<h2>4. Time blocking protects priorities</h2>
<ul><li>Calendar slots for focus turn intentions into commitments others can see.</li></ul>
<h2>5. Rest enables sustained concentration</h2>
<ul><li>Breaks, sleep, and single-task recovery prevent attention burnout across the day.</li></ul>
<h1>PART 2 — FOCUS</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: The hidden cost of fragmented attention</h3>
<p>Every ping, tab switch, and "quick check" fractures the mental workspace you built for the task at hand. Research on task switching shows resuming deep work after interruption takes minutes, not seconds — the brain must reload context, goals, and partial solutions. Chronic fragmentation creates a persistent background fatigue: busy all day, finished little that required real thought.</p>
<p>Cal Newport's deep work concept names what knowledge workers lose when calendars fill with reactive communication. High-value output — writing, coding, strategy, design — demands sustained attention rarely compatible with always-on messaging. Focus as a core habit is economic: protect the hours that multiply career and creative capital.</p>
<p>Gloria Mark's interruption research found knowledge workers average only a few minutes between distractions — rebuilding that runway requires deliberate habit design, not vague intentions to try harder tomorrow.</p>
<p><strong>Lesson:</strong> Treat interruptions as expensive — each switch taxes the deep work you cannot afford to lose.</p>
<h3>Chapter 2: Defining deep work for your role</h3>
<p>Deep work is professional activity performed in a state of distraction-free concentration that pushes cognitive capabilities. Your version might be ninety minutes drafting, analyzing data, practicing an instrument, or studying technical material. Shallow work — email triage, status updates — still matters but should not expand to consume prime mental hours.</p>
<p>Audit one week: when did you last do sixty uninterrupted minutes on your hardest task? If the answer is uncomfortable, your Focus habit is under-built. Name one daily deep task the night before; ambiguity invites procrastination and inbox drift.</p>
<p>Write tomorrow's deep task on a sticky note visible at wake — specificity at night reduces morning negotiation with your phone.</p>
<p><strong>Lesson:</strong> Name one hard cognitive task nightly — deep work requires a declared target, not vague "be productive."</p>
<h3>Chapter 3: Engineering a focus-friendly environment</h3>
<p>Disable non-essential notifications during focus blocks — not permanently, but sacredly for the session. Close chat and email unless the task is communication itself. Physical cues help: closed door, headphones, phone in another room. Browser blockers on distracting sites remove temptation cheaper than repeated self-negotiation.</p>
<p>Batch shallow work into defined windows — late afternoon email, morning standup — so morning peak serves creation. Tell collaborators your focus hours; boundaries reduce guilt when you are slow to reply during blocks. Environment design makes the right behavior default.</p>
<p>Use a dedicated "focus playlist" or brown noise — sensory consistency signals brain mode shift faster than willpower alone each session.</p>
<p><strong>Lesson:</strong> Remove notification and device triggers during blocks — design beats heroic resistance to every ping.</p>
<h3>Chapter 4: Time blocking and the calendar as contract</h3>
<p>What gets scheduled gets done. Place focus blocks on your calendar like meetings with yourself — non-movable when possible. Start with twenty-five or fifty minutes if ninety feels daunting; Pomodoro-style intervals with short breaks build capacity. End each block with a note: next step when you resume, so restart friction drops.</p>
<p>Protect the first focus block of the day before reactive tasks colonize attention. Many executives and writers guard morning hours fiercely for this reason. Weekly review with Update Goal ensures blocks align with current priorities, not outdated projects.</p>
<p>Color-code focus blocks differently from meetings — visual distinction helps you defend them when colleagues request "just a quick slot."</p>
<p><strong>Lesson:</strong> Calendar focus blocks before shallow work fills the day — scheduled time is a contract with your priorities.</p>
<h3>Chapter 5: Managing energy, not just time</h3>
<p>Attention follows ultradian rhythms — roughly ninety-minute cycles of higher and lower alertness. Pushing through exhaustion produces shallow output and trains dislike of focus. Take real breaks: walk, hydrate, look distance — not break-as-scroll which re-fragments attention.</p>
<p>Sleep deprivation and constant context switching compound; pairing Focus with Sleep habit is non-optional for knowledge work. Caffeine can extend alertness but not replace rest. Match task difficulty to energy — creative work at peak, admin at trough.</p>
<p>Stand and move five minutes mid-morning — blood flow refresh often restores focus cheaper than another espresso when attention dips.</p>
<p><strong>Lesson:</strong> Align hard tasks with peak energy and take real breaks — sustained focus is a rhythm, not a marathon without pause.</p>
<h3>Chapter 6: Building focus as identity and culture</h3>
<p>Say no to low-value commitments that fracture your calendar. Communicate response-time norms — not instant availability. Measure days by deep work completed, not hours online. Over months, reputation for reliable output grows when you ship work only scattershot peers cannot.</p>
<p>Team cultures can respect focus: shared quiet hours, fewer meetings, async updates. Personally, log weekly deep hours; increase gradually. Focus is the habit that amplifies every other — learning sticks, goals advance, reflection deepens when attention is yours to command.</p>
<p>Share weekly deep-hour totals with an accountability partner — social visibility reinforces identity without toxic hustle comparison.</p>
<p><strong>Lesson:</strong> Track weekly deep hours and guard them culturally — focus identity turns protected time into your highest-leverage habit.</p>
""",
        [
            Q("What is a documented cost of task switching during knowledge work?", "Instant improvement in productivity", "Minutes of recovery time to reload mental context after each interruption", "No measurable cognitive effect", "Automatic deep work without effort", "B"),
            Q("How is deep work defined in this lesson?", "Multitasking email and creative writing simultaneously", "Distraction-free concentration pushing cognitive capabilities on hard tasks", "Only checking messages quickly", "Passive video consumption", "B"),
            Q("Which environmental change best supports focus blocks?", "Enabling all notifications for urgency", "Disabling non-essential notifications and removing phone from the workspace", "Keeping twenty browser tabs open", "Never telling collaborators your availability", "B"),
            Q("Why should focus blocks appear on your calendar?", "Calendars are decorative only", "Scheduled time acts as a commitment that protects priorities", "Shallow work should consume all calendar space", "Blocks should never include breaks", "B"),
            Q("How does this lesson recommend matching tasks to energy?", "Hard creative work at peak energy; admin at lower energy", "Always do hardest work when exhausted", "Never take breaks between blocks", "Ignore sleep because caffeine replaces rest", "A"),
        ],
    )
)

HABITS.append(
    habit(
        "reflect",
        "Reflect",
        7,
        "A few minutes of honest reflection turns experience into wisdom instead of repeating the same patterns on autopilot.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Experience alone does not teach</h2>
<ul><li>Without reflection, the same year repeats ten times — not ten years of growth.</li></ul>
<h2>2. Writing externalizes thought</h2>
<ul><li>Journaling slows rumination and reveals patterns invisible in fast mental loops.</li></ul>
<h2>3. Gratitude shifts attention</h2>
<ul><li>Deliberately noting what went well trains a balanced scan of reality, not toxic positivity.</li></ul>
<h2>4. Review closes feedback loops</h2>
<ul><li>Weekly reflection connects actions to outcomes and informs next week's goals.</li></ul>
<h2>5. Honesty without harshness</h2>
<ul><li>Self-compassion after setbacks increases retry rate; shame shuts down learning.</li></ul>
<h1>PART 2 — REFLECT</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Why reflection turns experience into learning</h3>
<p>Philosopher John Dewey wrote that we do not learn from experience alone but from reflecting on experience. Busy days pile events without integration — you react, move on, repeat. Reflection pauses the loop to ask: What happened? What did I contribute? What would I do differently? That pause converts raw data into adjusted behavior.</p>
<p>Military and medical training use after-action reviews for this reason: structured debrief regardless of outcome. Personal life rarely mandates debrief unless you build the habit. Five to fifteen evening minutes can outperform hours of unexamined hustle across a year.</p>
<p>Harvard Business School case studies on learning organizations show teams that debrief outperform those with equal raw experience — reflection is a force multiplier hiding in plain sight.</p>
<p><strong>Lesson:</strong> Pause to debrief your day — reflection is the step that makes experience teach instead of repeat.</p>
<h3>Chapter 2: The mechanics of effective journaling</h3>
<p>You need not write prose masterpieces. Prompts reduce blank-page friction: "One win, one challenge, one lesson." Stream-of-consciousness works for some; bullet lists work for others. Voice memos count if you replay and note one insight. Consistency and honesty matter more than literary quality.</p>
<p>Write in past tense for events, present tense for feelings — a technique therapists use to increase clarity. Date every entry so patterns emerge over weeks: recurring conflicts, energy dips on certain days, habits that correlate with mood. The journal becomes a personal dataset, not a diary for posterity.</p>
<p>Keep the journal visible on your nightstand with a pen attached — friction reduction beats relying on remembering to open an app after exhaustion.</p>
<p><strong>Lesson:</strong> Use simple prompts nightly — dated honest entries reveal patterns no amount of busyness will show.</p>
<h3>Chapter 3: Gratitude as cognitive rebalancing</h3>
<p>Evolution biases attention toward threat — useful for survival, costly for mood. Gratitude practice deliberately notices support, progress, and small pleasures. Research by Emmons and others links regular gratitude exercises with improved well-being and sleep in many studies, especially when specific rather than generic.</p>
<p>Write three specifics: "A colleague sent helpful feedback," not "I am grateful for life." Specificity engages memory and reduces rote ritual feel. Gratitude is not denial of problems; it prevents problems from occupying the entire mental frame.</p>
<p>Alternate gratitudes across domains — work, body, relationships — so practice stays fresh and scans your whole life, not only what went wrong.</p>
<p><strong>Lesson:</strong> List three specific gratitudes nightly — balanced attention improves mood without ignoring real problems.</p>
<h3>Chapter 4: Weekly review linking reflection to action</h3>
<p>Daily reflection captures texture; weekly reflection sees shape. Once per week, read recent entries and ask: What themes repeat? Which habits held? Where did I avoid hard truths? Connect insights to Update Goal — adjust behaviors, not just feelings.</p>
<p>End weekly review with one commitment for next week small enough to fail forward safely. Reflection without action becomes navel-gazing; action without reflection becomes blind hustle. Pair the two habits deliberately on the same calendar anchor.</p>
<p>Highlight one sentence from the week's entries that captures the main lesson — a single line you can reread months later when patterns repeat.</p>
<p><strong>Lesson:</strong> Weekly, scan entries for themes and set one behavior commitment — reflection must feed next week's actions.</p>
<h3>Chapter 5: Self-compassion when reviewing mistakes</h3>
<p>Harsh self-criticism after failure feels responsible but often triggers avoidance — why revisit pain if the inner voice attacks? Self-compassion researcher Kristin Neff distinguishes compassion from excuse-making: acknowledge difficulty, recognize common humanity, choose constructive next steps.</p>
<p>When journaling a mistake, add: "What would I tell a friend in this situation?" Shame loops replay the story; compassion loops extract the lesson and release the identity sting. Retry rates improve when reflection feels safe enough to be truthful.</p>
<p>Separate behavior from identity in writing — "I missed the workout" rather than "I am lazy" — language shapes whether tomorrow's retry feels possible.</p>
<p><strong>Lesson:</strong> Review mistakes with friend-level compassion — honesty plus kindness increases learning and retry.</p>
<h3>Chapter 6: Integrating reflection with the other core habits</h3>
<p>Reflect on sleep quality and workout consistency — notice correlations in energy and mood. Note microlearn insights worth applying. Record focus victories and distraction triggers. Screen time and cold shower experiments get documented outcomes, not vague memory.</p>
<p>Evening reflection also supports sleep: offload worries onto paper with a "tomorrow list" so the mind releases grip. Keep the ritual short, same time, same place — bed-adjacent but not phone-scrolling adjacent. You are building a life examined, not just a life lived.</p>
<p>Rate core habits 1–5 weekly in one line — quick numeric trends surface slippage before a full life audit feels overwhelming.</p>
<p>Even three sentences nightly beats zero — the habit wins on honesty and repetition, not literary length or perfect insight every evening.</p>
<p><strong>Lesson:</strong> Tie reflection to all core habits and offload worries nightly — examined days improve sleep and tomorrow's choices.</p>
""",
        [
            Q("According to Dewey's idea cited here, learning requires what?", "Only more busy experience without pause", "Reflection on experience, not experience alone", "Avoiding all mistakes permanently", "Never writing anything down", "B"),
            Q("What journaling approach does this lesson recommend?", "Long perfect essays only", "Simple dated prompts like one win, one challenge, one lesson", "Never reviewing past entries", "Only gratitude with no challenges", "B"),
            Q("Why should gratitude entries be specific?", "Generic lists work better for memory", "Specifics engage memory and feel authentic, improving well-being effects", "Specificity eliminates all problems", "Gratitude should ignore real difficulties entirely", "B"),
            Q("What closes the loop between weekly reflection and progress?", "Feelings alone without behavior change", "One small behavior commitment for the coming week", "Deleting all past journal entries", "Avoiding connection to goals", "B"),
            Q("How does self-compassion affect reflection on mistakes?", "It prevents all accountability", "It enables truthful review and higher retry rates versus shame loops", "It means never changing behavior", "It replaces the need for any goals", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "water",
        "Water",
        7,
        "Consistent hydration supports energy, cognition, and physical performance — mild dehydration impairs you before thirst always notices.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Water runs every system</h2>
<ul><li>Blood volume, temperature regulation, joint lubrication, and digestion all depend on adequate fluids.</li></ul>
<h2>2. Mild dehydration hurts cognition</h2>
<ul><li>Even one to two percent body water loss can reduce focus, mood, and headache threshold.</li></ul>
<h2>3. Thirst is a lagging signal</h2>
<ul><li>By the time you feel very thirsty, you may already be under-hydrated for peak performance.</li></ul>
<h2>4. Habit cues beat memory</h2>
<ul><li>Same bottle, morning glass, and drink-with-meal routines automate intake without tracking obsession.</li></ul>
<h2>5. Needs vary by context</h2>
<ul><li>Exercise, heat, altitude, and illness increase requirements — adjust rather than rigidly force gallons.</li></ul>
<h1>PART 2 — WATER</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: Hydration as baseline physiology</h3>
<p>Water is the medium in which metabolic reactions occur — roughly sixty percent of adult body weight. It transports nutrients, removes waste through kidneys, cushions joints, and stabilizes temperature through sweat and blood flow. Chronic low intake stresses these systems subtly before dramatic dehydration appears.</p>
<p>People often chase supplements while under-drinking plain water. No pill replaces adequate fluid for blood volume and cellular function. Making water a core habit addresses the boring foundation that makes every other performance habit work better — workouts, focus sessions, and sleep all suffer when fluids lag.</p>
<p>Even two percent dehydration can reduce endurance and lift performance — if you train hard while chronically under-drinking, you leave gains on the table regardless of program quality.</p>
<p><strong>Lesson:</strong> Treat daily hydration as physiological baseline — other habits underperform when water intake chronically lags.</p>
<h3>Chapter 2: Cognitive and mood effects of low intake</h3>
<p>Studies on mild dehydration — losses around one to two percent of body mass — show reduced concentration, increased perceived effort on tasks, and more headaches in controlled settings. You may interpret fog as poor sleep or stress when fluid is a contributing factor. Office air conditioning and heated buildings increase insensible water loss without obvious sweating.</p>
<p>Rehydration often produces quick subjective clarity, suggesting some deficits are reversible within hours. Tracking mood and focus alongside water intake for a week can reveal personal sensitivity. Not everyone needs identical volumes, but everyone needs awareness.</p>
<p>Students and drivers show measurable reaction-time dips in lab dehydration studies — everyday safety and learning also depend on fluids, not only athletic performance.</p>
<p><strong>Lesson:</strong> Notice focus and mood when hydration slips — mild deficits impair cognition before severe thirst arrives.</p>
<h3>Chapter 3: How much and when to drink</h3>
<p>General guidance for healthy adults often cites roughly two to three liters daily from all sources including food, with individual variation by size, activity, and climate. A practical heuristic: pale yellow urine most of the day, darker by morning is normal. Drink a glass upon waking to replace overnight losses; front-loading some intake before afternoon fatigue helps many people.</p>
<p>Sip during workouts — roughly every fifteen to twenty minutes for sustained sessions — and after, replacing sweat without over-chugging. Meals naturally include fluids; pairing water with each meal builds three automatic anchors. Extreme over-drinking is rare but possible; listen to body signals beyond rigid gallon challenges.</p>
<p>Weigh yourself before and after long runs — each pound lost roughly equals sixteen ounces fluid to replace, a practical field estimate many runners use successfully.</p>
<p><strong>Lesson:</strong> Anchor water to wake-up and meals — steady sipping beats chugging once when already depleted.</p>
<h3>Chapter 4: Building automatic hydration habits</h3>
<p>Visual cues dominate: a filled bottle on your desk, by the bed, in your bag. Choose a bottle size you enjoy using — straw, wide mouth, insulated — friction matters. Habit stack: after morning coffee, drink water before the next cup; after each bathroom trip, a few sips on return.</p>
<p>Phone reminders help initially, then fade as cues take over. Flavor with lemon or electrolytes if plain water bores you, but watch sugar in commercial drinks masquerading as hydration. The habit is the reach for water, not perfect purity doctrine.</p>
<p>Pre-fill bottles the night before and place one by your keys — morning grab-and-go removes the decision that derails hydration on rushed days.</p>
<p><strong>Lesson:</strong> Keep visible bottles and stack sips onto existing routines — environment automates hydration better than willpower alone.</p>
<h3>Chapter 5: Electrolytes, caffeine, and alcohol</h3>
<p>Heavy sweaters and long endurance sessions may need sodium and potassium replacement — sports drinks or balanced meals, not only plain water in extreme cases. Caffeine has mild diuretic effect but habitual coffee drinkers adapt; count it toward fluid somewhat while not replacing water entirely. Alcohol dehydrates; pairing drinks with water reduces next-day penalty.</p>
<p>Illness with fever, travel by air, and high altitude increase needs. Adjust upward temporarily without abandoning the habit structure. Kidney and heart conditions require medical personalization — this lesson targets generally healthy adults seeking daily consistency.</p>
<p>Whole fruits and vegetables contribute meaningful water volume — hydration is not only glasses counted but total daily fluid from food and beverages combined.</p>
<p><strong>Lesson:</strong> Adjust fluids for sweat, travel, and illness — plain water suffices daily; electrolytes matter in heavy loss contexts.</p>
<h3>Chapter 6: Tracking without obsession</h3>
<p>Some enjoy logging liters in an app; others rely on cues and urine color. Pick low-friction monitoring. Pair with Workout and Exercise habits — pre-hydrate before sessions, rehydrate after. Evening taper if frequent bathroom trips disrupt Sleep habit, but do not go to bed parched.</p>
<p>Weekly reflection note: energy on well-hydrated days versus not. Over months, adequate water feels normal and dehydration feels obviously worse — a useful internal alarm worth cultivating. Drink now; think clearer later.</p>
<p>Mark habit complete in Nutrapp when your bottle is empty twice daily — binary completion beats obsessive milliliter tracking for most people building the habit.</p>
<p><strong>Lesson:</strong> Use simple cues and weekly reflection — consistent hydration becomes self-reinforcing when you feel the difference.</p>
""",
        [
            Q("Why is water described as 'baseline physiology' for other habits?", "It replaces exercise and sleep", "Blood volume, temperature regulation, and waste removal depend on adequate fluids", "Only athletes need any water intake", "Supplements eliminate the need for fluids", "B"),
            Q("What can mild dehydration around 1–2% body mass affect?", "Nothing measurable", "Concentration, perceived effort, and headache likelihood", "Only skin appearance", "Long-term bone density directly", "B"),
            Q("What drinking pattern does this lesson recommend?", "Only drink when extremely thirsty at night", "Morning glass plus steady intake anchored to meals and visible bottles", "Avoid all fluids during exercise", "Drink entire daily quota in one sitting", "B"),
            Q("How can hydration habits become automatic?", "Hide all water sources", "Habit stacking and visible bottles at desk, bed, and bag", "Rely on memory alone without cues", "Replace water with sugary drinks only", "B"),
            Q("When might electrolyte replacement matter most?", "During sedentary desk work only", "Heavy sweating or long endurance sessions with significant salt loss", "Never — water is always sufficient in every context", "Only when avoiding all food", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "cold_shower",
        "Cold Shower",
        7,
        "Brief cold exposure builds stress resilience and alertness — a controlled discomfort that trains your nervous system to calm down faster.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Cold triggers adaptive stress</h2>
<ul><li>Short cold exposure activates sympathetic arousal followed by parasympathetic rebound — training flexibility.</li></ul>
<h2>2. Deliberate discomfort builds tolerance</h2>
<ul><li>Choosing hard things in small doses expands what daily life feels manageable.</li></ul>
<h2>3. Start warm, finish cold</h2>
<ul><li>Gradual adaptation reduces shock; end with thirty to ninety seconds cold for habit sustainability.</li></ul>
<h2>4. Breath is the control lever</h2>
<ul><li>Slow exhale-focused breathing during cold prevents panic and extends safe duration.</li></ul>
<h2>5. Not for every condition</h2>
<ul><li>Heart conditions, pregnancy, and acute illness require medical clearance before cold protocols.</li></ul>
<h1>PART 2 — COLD SHOWER</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: What cold exposure does to the body</h3>
<p>Cold water on skin triggers vasoconstriction, increased heart rate, and a surge of norepinephrine — the same stress axis activated by fear or excitement, but in a controlled dose. When exposure ends, warm blood returns to periphery and parasympathetic activity often increases, producing alert calm. Repeated bouts may improve stress tolerance, analogous to weight training for the nervous system.</p>
<p>Research on cold immersion — mostly small studies and popularized by Wim Hof and sports recovery literature — suggests benefits for mood alertness, possible immune markers, and reduced perceived stress when practiced regularly. Effects are not magic; consistency and safety matter more than extreme duration.</p>
<p>Dutch immersion studies reported increased anti-inflammatory markers after trained cold exposure — intriguing but not license for reckless extremes; shower-length doses capture much of the practical benefit.</p>
<p><strong>Lesson:</strong> Brief cold exposure trains stress-response flexibility — arousal followed by controlled calm.</p>
<h3>Chapter 2: Psychological benefits of chosen discomfort</h3>
<p>Modern life removes many physical challenges. Deliberate cold restores a daily proof: you can do hard things on purpose. That proof reduces avoidance in other domains — difficult conversations, workouts, focus blocks. The shower is a micro-arena where outcome is binary and immediate.</p>
<p>Mood lifts partly from norepinephrine and dopamine spikes reported after cold; partly from self-efficacy — "I did it already today." Morning cold can replace groggy scrolling with embodied wakefulness. The habit is as much identity training as physiology.</p>
<p>Stoic philosophers practiced voluntary discomfort to widen the gap between stimulus and complaint — your shower continues that tradition in modern plumbing.</p>
<p><strong>Lesson:</strong> Daily chosen discomfort builds self-efficacy — finishing cold showers makes other hard tasks feel more reachable.</p>
<h3>Chapter 3: A safe progressive protocol</h3>
<p>Begin after your normal warm shower: switch to cool for fifteen seconds, add five to ten seconds weekly until thirty to ninety seconds at the coldest setting you can sustain with steady breath. Face and chest exposure intensify sensation; start with back and limbs if needed. Never hyperventilate or stay in until numb confusion — exit while control remains.</p>
<p>Some prefer full cold start after adaptation; beginners should not. Track sensations in Reflect habit: energy two hours later, sleep impact. Evening cold energizes some and delays sleep for others — personalize timing.</p>
<p>Keep a small whiteboard in the bathroom logging cold seconds — visible progression motivates continuation better than vague memory of last week.</p>
<p><strong>Lesson:</strong> End warm showers with gradually lengthened cold — progress slowly and exit while breathing stays controlled.</p>
<h3>Chapter 4: Breathing through the shock</h3>
<p>Initial gasp reflex is automatic; panic breathing follows if unchecked. Extend exhale: four-count inhale nose, six to eight-count exhale mouth. This engages vagal tone and prevents lightheadedness. Avoid forced hyperventilation before cold — popular in advanced protocols but unnecessary for shower habit and risky without training.</p>
<p>Mantras or counting seconds give the mind a rail. Focus on one body area relaxing despite cold — shoulders down, jaw unclenched. Each session is practice returning agency over reflex — transferable to anger and anxiety spikes.</p>
<p>Practice the breath pattern under warm water first — pre-rehearsal reduces shock when cold hits and builds muscle memory before you need it.</p>
<p><strong>Lesson:</strong> Use slow extended exhales during cold — breath control converts panic reflex into manageable sensation.</p>
<h3>Chapter 5: Recovery, contrast therapy, and expectations</h3>
<p>Athletes use cold for soreness reduction post-effort; timing relative to strength training is debated — immediate cold may blunt some hypertrophy signals if you are maximizing muscle gain. For general wellness habit, post-shower cold or separate morning ritual suffices. Contrast — hot then cold — feels invigorating but is optional.</p>
<p>Do not expect cold to replace Sleep, Workout, or medical care. Skin and hair may dry with excessive exposure; moisturize if needed. Benefits plateau; consistency beats escalation to ice baths unless you enjoy them and have safety support.</p>
<p>Finnish sauna culture alternates heat and cold for circulation — you need not copy extremes; a thirty-second cold finish captures much of the invigorating contrast effect.</p>
<p><strong>Lesson:</strong> Keep shower cold brief and consistent — wellness habit, not replacement for sleep, training, or medicine.</p>
<h3>Chapter 6: Contraindications and making it stick</h3>
<p>Consult a clinician if you have cardiovascular disease, uncontrolled hypertension, Raynaud's, pregnancy, or are acutely ill. Never combine cold with alcohol or solo outdoor immersion without supervision. Pair habit with same shower routine daily — consistency cue after brushing teeth or post-workout rinse.</p>
<p>Log streaks lightly; skip guilt on sick days. Pair with Screen Time habit — cold shower first, phone second, prevents warm-bed scroll traps. Over weeks, the dread curve flattens; you begin to step in knowing the other side is only seconds away.</p>
<p>Prepare towel and clothes within arm's reach before turning cold — removing post-shower friction helps you start cold instead of skipping to stay comfortable.</p>
<p><strong>Lesson:</strong> Respect medical contraindications and anchor cold to your fixed shower routine — repetition lowers dread and builds resilience.</p>
""",
        [
            Q("What physiological pattern does brief cold exposure train?", "Permanent sympathetic panic without recovery", "Sympathetic arousal followed by parasympathetic rebound and calm", "Elimination of all stress hormones forever", "Complete loss of heart rate variability", "B"),
            Q("What psychological benefit comes from chosen daily discomfort?", "Avoidance of all challenging tasks", "Increased self-efficacy that transfers to other hard behaviors", "Guaranteed elimination of anxiety disorders", "Dependence on never showering warm", "B"),
            Q("What cold shower protocol is recommended for beginners?", "Immediate ten-minute ice bath alone outdoors", "Finish a warm shower with gradually lengthened cold seconds", "Hyperventilate heavily before entering cold", "Stay until confused and numb", "B"),
            Q("How should you breathe during the cold portion?", "Rapid panting without control", "Slow inhale with extended exhale to maintain control", "Hold breath the entire time", "Only breathe through gasping", "B"),
            Q("Who should seek medical clearance before cold exposure?", "Only competitive swimmers", "People with certain heart conditions, pregnancy, or acute illness", "Everyone must avoid all cold always", "Only people who drink enough water", "B"),
        ],
    )
)

HABITS.append(
    habit(
        "screen_time",
        "Screen Time",
        7,
        "Managing screen time protects attention, sleep, and mood — digital defaults are engineered to capture time you did not intend to spend.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Apps compete for your attention</h2>
<ul><li>Infinite feeds use variable rewards — the same psychology as slot machines.</li></ul>
<h2>2. Evening screens disrupt sleep</h2>
<ul><li>Blue light and stimulating content delay melatonin and keep the brain in alert mode.</li></ul>
<h2>3. Measurement enables change</h2>
<ul><li>You cannot manage what you do not track — weekly screen reports reveal hidden hours.</li></ul>
<h2>4. Friction beats willpower alone</h2>
<ul><li>Grayscale, app limits, and phone-free zones redesign defaults cheaper than constant resisting.</li></ul>
<h2>5. Replace, do not only restrict</h2>
<ul><li>Schedule alternatives — walk, reflect, microlearn — so empty time does not refill with scrolling.</li></ul>
<h1>PART 2 — SCREEN TIME</h1>
<h2>An 8-Minute Read on Why This Habit Matters</h2>
<h3>Chapter 1: The attention economy and your calendar</h3>
<p>Social and entertainment platforms monetize time-on-device. Engineers optimize notifications, autoplay, and infinite scroll to maximize engagement, not your stated goals. Cal Newport notes these tools are often slot machines in your pocket — variable rewards keep you checking "just once more." Unmanaged screen time is not a personal moral failure; it is a mismatch between Paleolithic attention and industrial-strength persuasion design.</p>
<p>Hours lost to passive consumption do not register as vividly as scheduled activities, creating an illusion of free time that is actually captured. Making Screen Time a core habit reclaims agency — you decide when devices serve you versus when you serve feeds.</p>
<p>Tristan Harris and other ethicists note that persuasive design exploits psychological vulnerabilities at scale — understanding the game is step one toward playing by your rules instead of the app's.</p>
<p><strong>Lesson:</strong> Recognize feeds as engineered capture — managing screen time is defending your attention against product design.</p>
<h3>Chapter 2: Sleep, light, and the evening cutoff</h3>
<p>Evening screen use delays sleep onset through multiple pathways: blue-enriched light suppresses melatonin, exciting content activates arousal systems, and "one more video" breaks bedtime intentions. Sleep research consistently associates late device use with shorter sleep duration and poorer quality in population studies.</p>
<p>Implement a digital curfew sixty to ninety minutes before bed: phone charges outside the bedroom, e-reader or paper if you need wind-down content. If must-use screens, enable night shift and lower brightness — helpful but weaker than stopping entirely. Pair with Sleep habit non-negotiably; the combo transforms rest faster than either alone.</p>
<p>Replace phone alarm with a bedside clock — removing the morning pickup eliminates the temptation to scroll before your feet hit the floor.</p>
<p><strong>Lesson:</strong> Set a pre-bed screen curfew — protecting melatonin and calm is worth more than one more scroll.</p>
<h3>Chapter 3: Audit and set intentional budgets</h3>
<p>Use built-in screen time reports weekly: total hours, top apps, pickup count. Pick one number to improve — often social or video category. Set daily app limits slightly below current average, not fantasy zero, to avoid rebound quitting the habit system.</p>
<p>Define allowed windows: "Social apps 7–7:30 p.m. only" turns vague reduction into a rule you can follow. Notify accountability partner or log in Reflect habit. Update Goal habit can include "under ninety minutes recreational screen daily" as a behavior target with weekly review.</p>
<p>Screenshot your weekly report into your journal — visual trend lines make slow creep visible before another month disappears into feeds.</p>
<p><strong>Lesson:</strong> Weekly audit plus one concrete app budget — measured reduction beats vague "use phone less" resolutions.</p>
<h3>Chapter 4: Environmental friction and grayscale</h3>
<p>Delete or log out of the most addictive apps on phone; use browser versions with friction. Move social icons off home screen into folders labeled with delay timers. Enable grayscale mode — color removal reduces dopamine punch of icons and photos, making phone less magnetizing at a glance.</p>
<p>Keep phone out of focus blocks and meals — physical distance beats notification willpower. Buy a basic alarm clock so bedroom phone is unnecessary. Each friction point is small; together they restore seconds that become hours monthly.</p>
<p>Require a ten-second pause screen or app timer before opening top offenders — micro-delay breaks autopilot opens you do not remember choosing.</p>
<p><strong>Lesson:</strong> Add friction — grayscale, logouts, off-home-screen, phone-free zones — design beats endless willpower battles.</p>
<h3>Chapter 5: Replacing scroll time with core habits</h3>
<p>Restriction alone leaves a void; boredom refills it. Pre-load alternatives: five-minute Microlearn instead of feed, Reflect prompt when urge hits, short walk after dinner. Stack "when I pick up phone mindlessly, I drink water first" — interrupts autopilot.</p>
<p>Batch necessary digital tasks — email, messages — into windows rather than continuous partial attention. Recreation remains legitimate; intention distinguishes rest from capture. A planned thirty-minute show relaxes; three-hour accidental binge drains.</p>
<p>Keep a paperback or puzzle where you usually scroll — physical objects in hand make default reach-for-phone less automatic on couch evenings.</p>
<p><strong>Lesson:</strong> Swap default scroll triggers for other core habits — replacement plans prevent empty time from refilling with feeds.</p>
<h3>Chapter 6: Social norms, children, and long-term identity</h3>
<p>Communicate response delays — not instant DM availability protects focus and reduces reciprocal phone pressure. Model screen boundaries for household; shared phone-free meals build connection research ties to adolescent well-being. Your identity shifts from "always reachable" to "present when it matters."</p>
<p>Long-term, managed screen time correlates with more books read, deeper relationships, and better sleep — not because screens are evil, but because time is finite. Review quarterly: are apps still aligned with values? Delete what failed the test. You are curating an attention portfolio, not detoxing once and relapsing silently.</p>
<p>Set an auto-reply or status during focus blocks — normalizing boundaries reduces guilt and trains others to expect thoughtful delay, not instant reaction.</p>
<p><strong>Lesson:</strong> Set communication norms and quarterly app reviews — intentional screen use supports presence, sleep, and the rest of your core habits.</p>
""",
        [
            Q("Why is unmanaged screen time compared to slot machines?", "Apps randomly delete your data", "Infinite feeds use variable rewards engineered to maximize engagement", "Phones have no effect on attention", "Screen time only affects battery life", "B"),
            Q("How does evening screen use affect sleep according to this lesson?", "It always improves melatonin", "Light and stimulating content delay sleep onset and reduce quality", "Only audio content matters, never light", "Screens have no relationship to sleep", "B"),
            Q("What first step does this lesson recommend for reducing screen time?", "Delete phone immediately forever", "Weekly audit of usage reports and one concrete app budget", "Never measure usage to avoid stress", "Use phone more to build tolerance", "B"),
            Q("What environmental tweak makes phones less visually rewarding?", "Maximum brightness and colorful icons", "Grayscale mode and moving addictive apps off the home screen", "More notifications for engagement", "Keeping phone on pillow at night", "B"),
            Q("Why emphasize replacement activities, not only restriction?", "Void time often refills with scrolling without alternatives", "Replacement means eliminating all recreation", "Core habits cannot fill any free time", "Restriction always fails so never try limits", "A"),
        ],
    )
)


if __name__ == "__main__":
    assert len(HABITS) == 11
    for h in HABITS:
        wc = word_count(h["content_text"])
        chapters = h["content_text"].count("<h3>Chapter")
        print(f"{h['slug']:16} words={wc:4}  chapters={chapters}  duration={h['duration_minutes']}m")
