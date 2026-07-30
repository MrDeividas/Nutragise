#!/usr/bin/env python3
"""Build researched microlearn book payloads for batch 1."""
from __future__ import annotations

import json
from pathlib import Path


def Q(text: str, a: str, b: str, c: str, d: str, ans: str) -> dict:
    return {
        "question_text": text,
        "option_a": a,
        "option_b": b,
        "option_c": c,
        "option_d": d,
        "correct_answer": ans,
    }


def book(
    title: str,
    author: str,
    minutes: int,
    cover: str,
    desc: str,
    html: str,
    questions: list[dict],
) -> dict:
    assert len(questions) == 5
    assert all(q["correct_answer"] in "ABCD" for q in questions)
    return {
        "title": title,
        "author": author,
        "duration_minutes": minutes,
        "cover_image_url": cover,
        "short_description": desc,
        "content_text": "\n".join(line.rstrip() for line in html.strip().splitlines()),
        "questions": questions,
    }


books: list[dict] = []

books.append(
    book(
        "Atomic Habits",
        "James Clear",
        12,
        "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        "James Clear’s practical system for getting 1% better every day — identity, systems, and the Four Laws of Behavior Change.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Tiny gains compound</h2>
<ul><li>Getting 1% better each day compounds into major change over a year.</li><li>Getting 1% worse compounds the other way.</li></ul>
<h2>2. Systems beat goals</h2>
<ul><li>You do not rise to the level of your goals; you fall to the level of your systems.</li></ul>
<h2>3. Identity-based habits</h2>
<ul><li>Focus on who you want to become; each action is a vote for that identity.</li></ul>
<h2>4. The Four Laws</h2>
<ul><li>Make it obvious, attractive, easy, and satisfying — invert to break bad habits.</li></ul>
<h1>PART 2 — ATOMIC HABITS</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: Why tiny changes matter</h3>
<p>Atomic Habits (2018) by James Clear is a practical guide to building good habits and breaking bad ones. Clear’s core claim: small behaviors, repeated consistently, compound into remarkable results. His public summary frames three big ideas: compound improvement, systems over goals, and identity-based habits.</p>
<h3>Lesson 1: The 1% rule</h3>
<p>Improving by 1% a day is easy to ignore in the moment, but those gains compound. The reverse is also true: small declines stack into collapse. Habit change is less about dramatic overhauls and more about the trajectory of daily actions.</p>
<h3>Lesson 2: Goals vs systems</h3>
<p>Goals set direction; systems create progress. Clear’s line — you do not rise to the level of your goals, you fall to the level of your systems — means lasting change comes from the process you repeat.</p>
<h3>Lesson 3: Identity-based habits</h3>
<p>Outcome-based habits chase a result. Identity-based habits start with who you want to become. Every small action is a vote for that identity. Change sticks when belief and behavior reinforce each other.</p>
<h3>Lesson 4: The habit loop</h3>
<p>Clear describes habits as a four-step loop: cue, craving, response, reward. The cue triggers attention, craving motivates, response is the behavior, and reward teaches the brain to repeat the loop.</p>
<h3>Lesson 5: The Four Laws of Behavior Change</h3>
<p>Mapped to the loop: (1) Make it obvious, (2) Make it attractive, (3) Make it easy, (4) Make it satisfying. To break a bad habit, invert them: invisible, unattractive, difficult, unsatisfying.</p>
<h3>Lesson 6: Environment design</h3>
<p>Willpower is fragile. Clear emphasizes shaping your environment so good cues are visible and bad cues are removed — making the right action the path of least resistance.</p>
<h3>Final Message: Fall in love with systems</h3>
<p>Start tiny, vote for your identity daily, and let compounding do the heavy lifting.</p>
""",
        [
            Q("According to Atomic Habits, what do you 'fall to the level of'?", "Your motivation", "Your systems", "Your goals", "Your talent", "B"),
            Q("What are the four steps of Clear’s habit loop?", "Plan, act, review, repeat", "Cue, craving, response, reward", "Trigger, habit, streak, identity", "Want, try, fail, restart", "B"),
            Q("What is the 1st law of behavior change for building a good habit?", "Make it obvious", "Make it rare", "Make it expensive", "Make it secret", "A"),
            Q("What does Clear mean by identity-based habits?", "Copying a celebrity’s routine", "Focusing on who you want to become, with actions as votes for that identity", "Only tracking outcomes", "Changing jobs first", "B"),
            Q("How do you break a bad habit using Clear’s framework?", "Set a bigger goal", "Invert the Four Laws (e.g. make the cue invisible)", "Ignore the cue forever", "Only use willpower", "B"),
        ],
    )
)

books.append(
    book(
        "The 7 Habits of Highly Effective People",
        "Stephen R. Covey",
        14,
        "https://covers.openlibrary.org/b/isbn/9781982137137-L.jpg",
        "Stephen R. Covey’s principle-centered classic: seven habits that move you from dependence to independence to interdependence.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Character over personality</h2>
<ul><li>Lasting effectiveness comes from principles and character, not quick techniques.</li></ul>
<h2>2. Private victory first</h2>
<ul><li>Habits 1–3 build independence: proactive choice, vision, and priority.</li></ul>
<h2>3. Public victory next</h2>
<ul><li>Habits 4–6 build interdependence: win-win, empathic listening, synergy.</li></ul>
<h2>4. Renewal</h2>
<ul><li>Habit 7 — Sharpen the Saw — sustains all the others.</li></ul>
<h1>PART 2 — THE 7 HABITS OF HIGHLY EFFECTIVE PEOPLE</h1>
<h2>A 14-Minute Read Summary</h2>
<h3>Introduction: A principle-centered approach</h3>
<p>Stephen R. Covey’s The 7 Habits of Highly Effective People (1989) argues that real effectiveness grows from character and timeless principles. Covey organizes the habits as a maturity continuum: dependence → independence (private victory) → interdependence (public victory), with renewal surrounding all.</p>
<h3>Lesson 1: Be Proactive</h3>
<p>Between stimulus and response is freedom to choose. Proactive people focus on their Circle of Influence — what they can affect — rather than living only in the Circle of Concern.</p>
<h3>Lesson 2: Begin with the End in Mind</h3>
<p>All things are created twice: first mentally, then physically. Covey urges a personal mission statement so daily action aligns with who you want to be.</p>
<h3>Lesson 3: Put First Things First</h3>
<p>This is personal management in action — prioritizing important work (often important but not urgent) over the merely urgent.</p>
<h3>Lesson 4: Think Win/Win</h3>
<p>Seek mutually beneficial agreements. Win/Win is an abundance mindset: success need not require someone else’s failure.</p>
<h3>Lesson 5: Seek First to Understand, Then to Be Understood</h3>
<p>Empathic listening comes before advocacy. Influence grows when people feel understood.</p>
<h3>Lesson 6: Synergize</h3>
<p>Creative cooperation values differences so combined effort can exceed what either person could do alone.</p>
<h3>Lesson 7: Sharpen the Saw</h3>
<p>Renew regularly in physical, mental, social/emotional, and spiritual dimensions. Without renewal, the other habits decay.</p>
<h3>Final Message: Private victory, then public victory</h3>
<p>Become reliable with yourself before expecting deep interdependence with others.</p>
""",
        [
            Q("What is Habit 1 in Covey’s framework?", "Sharpen the Saw", "Be Proactive", "Synergize", "Think Win/Win", "B"),
            Q("Habits 1–3 are mainly about achieving what?", "Interdependence", "Independence (private victory)", "Retirement", "Popularity", "B"),
            Q("What does 'Begin with the End in Mind' emphasize?", "Multitasking", "A clear personal vision / mission before acting", "Ignoring values", "Working longer hours", "B"),
            Q("What is Habit 5?", "Seek First to Understand, Then to Be Understood", "Always speak first", "Avoid conflict", "Put First Things First", "A"),
            Q("What does Sharpen the Saw mean?", "Buy new tools only", "Renew physical, mental, social/emotional, and spiritual capacity", "Cut people out of your life", "Work without breaks", "B"),
        ],
    )
)

books.append(
    book(
        "Think and Grow Rich",
        "Napoleon Hill",
        13,
        "https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg",
        "Napoleon Hill’s classic success philosophy — burning desire, faith, auto-suggestion, and organized planning.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Desire starts everything</h2>
<ul><li>A definite, burning desire — not a vague wish — is the starting point of achievement.</li></ul>
<h2>2. Faith + auto-suggestion</h2>
<ul><li>Belief programmed through emotionalized repetition reaches the subconscious.</li></ul>
<h2>3. Knowledge and plans</h2>
<ul><li>Specialized knowledge plus organized planning turn desire into action.</li></ul>
<h2>4. Persistence and Master Mind</h2>
<ul><li>Decision, persistence, and alliance with others sustain the chase.</li></ul>
<h1>PART 2 — THINK AND GROW RICH</h1>
<h2>A 13-Minute Read Summary</h2>
<h3>Introduction: A philosophy of achievement</h3>
<p>Napoleon Hill’s Think and Grow Rich (1937) presents a success philosophy focused on converting definite desire into its physical equivalent through mental and practical principles.</p>
<h3>Lesson 1: Desire</h3>
<p>Wishing is not enough. Hill insists on a burning desire with specifics: exact aim, what you will give in return, a timeline, a plan you begin at once, a written statement, and daily reading of that statement aloud with feeling.</p>
<h3>Lesson 2: Faith</h3>
<p>Faith is belief in attainment of desire — a mental state strengthened by affirmation and repeated instruction to the subconscious through auto-suggestion.</p>
<h3>Lesson 3: Auto-suggestion</h3>
<p>Auto-suggestion is self-administered suggestion — the bridge between conscious thought and subconscious action. Emotionalized repetition matters; empty words do little.</p>
<h3>Lesson 4: Specialized knowledge and organized planning</h3>
<p>Specialized knowledge must be applied through definite plans. If a plan fails, replace it — do not abandon the desire.</p>
<h3>Lesson 5: Decision and persistence</h3>
<p>Successful people decide promptly and change slowly. Persistence separates temporary defeat from permanent quitting.</p>
<h3>Lesson 6: The Master Mind</h3>
<p>The Master Mind is harmony of two or more minds working toward a definite purpose — multiplying knowledge and courage beyond solo effort.</p>
<h3>Final Message: Make desire definite</h3>
<p>Clarify desire, program belief, acquire needed knowledge, plan, persist, and ally with others.</p>
""",
        [
            Q("What does Hill say is the starting point of all achievement?", "Luck", "A burning, definite desire", "A large inheritance", "A perfect resume", "B"),
            Q("What is auto-suggestion in Think and Grow Rich?", "Asking strangers for advice once", "Self-suggestion that influences the subconscious through emotionalized repetition", "Ignoring your goals", "Only writing goals once", "B"),
            Q("According to Hill, what should you do if a plan fails?", "Quit the desire", "Replace the plan and continue", "Hide the failure", "Wait a year without acting", "B"),
            Q("What is the Master Mind principle?", "Working entirely alone forever", "A harmonious alliance of minds toward a definite purpose", "Memorizing quotes", "Avoiding mentors", "B"),
            Q("How does Hill say faith can be strengthened?", "By never thinking about goals", "Through affirmation and repeated instructions to the subconscious", "By sleeping more only", "By avoiding written goals", "B"),
        ],
    )
)

books.append(
    book(
        "The Psychology of Money",
        "Morgan Housel",
        12,
        "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
        "Morgan Housel’s essays on how behavior — not spreadsheets — drives financial outcomes: compounding, enough, and room for error.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Behavior beats brilliance</h2>
<ul><li>Soft skills with money matter more than raw IQ or complex formulas.</li></ul>
<h2>2. Compounding needs time</h2>
<ul><li>Wealth often comes from good returns left uninterrupted for decades.</li></ul>
<h2>3. Define “enough”</h2>
<ul><li>Without enough, goalposts move forever.</li></ul>
<h2>4. Room for error</h2>
<ul><li>Plans fail; margin of safety keeps you in the game.</li></ul>
<h1>PART 2 — THE PSYCHOLOGY OF MONEY</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: Money is a behavior story</h3>
<p>Morgan Housel’s The Psychology of Money (2020) argues financial success depends more on how you behave than on what you know.</p>
<h3>Lesson 1: No one’s crazy</h3>
<p>Everyone’s money views are shaped by personal history. “Rational” looks different depending on what someone lived through.</p>
<h3>Lesson 2: Confounding compounding</h3>
<p>Extraordinary outcomes often come from longevity in the game. The edge is less “highest return this year” and more “returns you can sustain without interruption.”</p>
<h3>Lesson 3: Getting wealthy vs staying wealthy</h3>
<p>Getting money can require optimism and risk-taking. Keeping it requires humility and paranoia about ruin.</p>
<h3>Lesson 4: Define “enough”</h3>
<p>When the goalpost always moves, risk-taking never stops. Knowing enough protects you from ego-driven decisions.</p>
<h3>Lesson 5: Room for error</h3>
<p>The most important part of a plan is planning on the plan not going according to plan. Margin of safety lets compounding work.</p>
<h3>Lesson 6: Save for flexibility</h3>
<p>Savings buys options and control over your time — one of money’s highest returns.</p>
<h3>Final Message: Reasonable beats perfect</h3>
<p>A strategy you can stick with beats an “optimal” strategy you abandon under stress.</p>
""",
        [
            Q("What does Housel argue matters more than pure financial brilliance?", "Secret stock tips", "Behavior and temperament with money", "Knowing every tax loophole on day one", "Never saving", "B"),
            Q("Why is compounding 'confounding' in Housel’s telling?", "It only works for one year", "Its power is easy to underestimate and requires long, uninterrupted time", "It requires daily trading", "It only applies to cash under a mattress", "B"),
            Q("What is 'room for error'?", "Ignoring all risk", "A margin of safety so you can survive when plans go wrong", "Maxing leverage", "Never investing", "B"),
            Q("What danger comes from never defining 'enough'?", "You save too much automatically", "Goalposts keep moving and risk-taking may never stop", "You become too humble", "Compounding speeds up too much", "B"),
            Q("According to Housel, what can saving buy beyond purchases?", "Only status", "Flexibility and control over your time", "Guaranteed market timing", "Freedom from all emotions", "B"),
        ],
    )
)

books.append(
    book(
        "Can't Hurt Me",
        "David Goggins",
        12,
        "https://covers.openlibrary.org/b/isbn/1544512287-L.jpg",
        "David Goggins’ memoir of mental toughness — the Accountability Mirror, Cookie Jar, and 40% Rule.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Callous the mind</h2>
<ul><li>Deliberate hard work builds mental calluses.</li></ul>
<h2>2. Accountability Mirror</h2>
<ul><li>Radical honesty about gaps between standards and behavior.</li></ul>
<h2>3. Cookie Jar</h2>
<ul><li>Past victories become fuel in the next hard moment.</li></ul>
<h2>4. The 40% Rule</h2>
<ul><li>When your mind says you’re done, you may still have far more capacity left.</li></ul>
<h1>PART 2 — CAN’T HURT ME</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: Master your mind</h3>
<p>Can't Hurt Me by David Goggins is a memoir and toughness manual about transforming limits through honest work and voluntary hardship.</p>
<h3>Lesson 1: Face the truth</h3>
<p>Growth starts with reality — inventory what you are actually doing, not what you intend someday.</p>
<h3>Lesson 2: The Accountability Mirror</h3>
<p>Goggins describes confronting himself daily with goals and hard truths on a mirror — blunt ownership of the gap.</p>
<h3>Lesson 3: Turn obstacles into fuel</h3>
<p>Doubt, failure, and pain can become energy for transformation when you refuse to let them write your limits.</p>
<h3>Lesson 4: The Cookie Jar</h3>
<p>When suffering spikes, draw on a mental jar of past wins and survived hardships as proof you can continue.</p>
<h3>Lesson 5: The 40% Rule</h3>
<p>Goggins argues that when your mind screams you are finished, you are often only around 40% of capacity — a mental governor protecting comfort. The training is learning to push past that first wall (without ignoring real medical limits).</p>
<h3>Lesson 6: Callousing the mind daily</h3>
<p>Toughness is built by repeatedly choosing hard things until discomfort becomes familiar.</p>
<h3>Final Message: You’re capable of more</h3>
<p>Tell yourself the truth, collect proof of resilience, and stop negotiating with the voice that quits early.</p>
""",
        [
            Q("What is the Accountability Mirror?", "A compliment journal only", "A daily radical-honesty practice facing your real gaps and goals", "A fitness app", "Ignoring feedback", "B"),
            Q("What is the Cookie Jar for Goggins?", "A diet plan", "A mental stockpile of past victories and survived hardships", "A savings account", "A list of excuses", "B"),
            Q("What does the 40% Rule claim?", "You should only ever use 40% effort", "When your mind says you’re done, you may still have substantial capacity left", "Sleep is unnecessary", "Talent is 40% genetics only", "B"),
            Q("What does 'callous the mind' mean in this book?", "Avoid all discomfort", "Strengthen mental toughness by repeatedly doing hard things", "Never set goals", "Only visualize success", "B"),
            Q("What does Goggins argue about most people’s capability usage?", "They always operate at 100%", "They often live far below their potential", "They should never train", "Limits are purely genetic and fixed", "B"),
        ],
    )
)

books.append(
    book(
        "Deep Work",
        "Cal Newport",
        12,
        "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
        "Cal Newport’s case for focused, distraction-free work — and four rules to make depth a habit in a shallow world.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Deep work is rare and valuable</h2>
<ul><li>Focusing without distraction on hard cognitive tasks creates outsized value.</li></ul>
<h2>2. Choose a depth philosophy</h2>
<ul><li>Monastic, bimodal, rhythmic, or journalistic — pick a schedule that fits your life.</li></ul>
<h2>3. Train attention</h2>
<ul><li>Embrace boredom; stop treating distraction as default entertainment.</li></ul>
<h2>4. Drain the shallows</h2>
<ul><li>Limit shallow work and end the day with a shutdown ritual.</li></ul>
<h1>PART 2 — DEEP WORK</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: Focus as a superpower</h3>
<p>Cal Newport’s Deep Work (2016) defines deep work as professional activities performed in a state of distraction-free concentration that push cognitive capabilities. Newport’s hypothesis: deep work is increasingly valuable and increasingly rare.</p>
<h3>Lesson 1: Why depth wins</h3>
<p>Hard things learned quickly and high-quality output both depend on unbroken concentration. Shallow work (email, logistics, low-cognitive tasks) feels productive but rarely creates scarce value.</p>
<h3>Lesson 2: Rule 1 — Work deeply</h3>
<p>Depth needs rituals. Newport outlines depth philosophies: monastic (maximize isolation), bimodal (long deep stretches), rhythmic (daily consistent blocks — often most practical), and journalistic (fit depth into gaps). Ritualize place, duration, and rules.</p>
<h3>Lesson 3: Rule 2 — Embrace boredom</h3>
<p>If you reach for a phone at every pause, your brain learns to need constant stimulation. Practice being bored so focus can endure.</p>
<h3>Lesson 4: Rule 3 — Quit social media (selectively)</h3>
<p>Newport is not anti-tool; he is anti-default. Audit network tools and keep only those whose benefits clearly outweigh their attention costs.</p>
<h3>Lesson 5: Rule 4 — Drain the shallows</h3>
<p>Schedule the day, quantify shallow work, and constrain it. Fixed-schedule productivity and a shutdown ritual (“shutdown complete”) protect recovery so tomorrow’s depth is possible.</p>
<h3>Final Message: Make depth non-negotiable</h3>
<p>Deep Work is a craft argument: treat concentration like a skill you schedule, train, and defend.</p>
""",
        [
            Q("How does Newport define deep work?", "Answering email quickly", "Distraction-free concentration on cognitively demanding tasks", "Attending more meetings", "Multitasking on chat", "B"),
            Q("Which depth philosophy uses a daily consistent block?", "Monastic only", "Rhythmic", "Never scheduling", "Only weekend retreats forever", "B"),
            Q("What is Rule 2 in Deep Work?", "Answer every notification", "Embrace boredom to train focus", "Post more online", "Skip breaks forever", "B"),
            Q("What is a shutdown ritual for?", "Starting more Slack channels", "Closing open loops and signaling the workday is done", "Checking email all night", "Avoiding planning", "B"),
            Q("What does Newport say about deep work’s economic value?", "It is useless today", "It is becoming more valuable while becoming rarer", "Only managers need it", "It is the same as shallow work", "B"),
        ],
    )
)

books.append(
    book(
        "Mindset",
        "Carol S. Dweck",
        11,
        "https://covers.openlibrary.org/b/isbn/9780345472328-L.jpg",
        "Carol Dweck’s research on fixed vs growth mindset — how beliefs about ability shape challenge-seeking, effort, and resilience.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Two mindsets</h2>
<ul><li>Fixed: abilities are carved in stone. Growth: abilities can be developed.</li></ul>
<h2>2. Mindset changes meaning</h2>
<ul><li>Effort, failure, and challenge look different under each belief.</li></ul>
<h2>3. Growth seeks stretch</h2>
<ul><li>Growth mindset treats difficulty as information, not a verdict on worth.</li></ul>
<h2>4. Mindsets can change</h2>
<ul><li>Beliefs are powerful — and learnable.</li></ul>
<h1>PART 2 — MINDSET</h1>
<h2>An 11-Minute Read Summary</h2>
<h3>Introduction: Beliefs that shape success</h3>
<p>Carol S. Dweck’s Mindset popularizes decades of research on implicit theories of intelligence: fixed mindset versus growth mindset.</p>
<h3>Lesson 1: Fixed mindset</h3>
<p>If you believe talent is static, you often need to prove yourself repeatedly. Challenges threaten identity, effort can feel like evidence you lack ability, and failure looks like a permanent label.</p>
<h3>Lesson 2: Growth mindset</h3>
<p>If you believe abilities can be developed through effort, strategies, and help from others, challenges become opportunities to improve. Effort is the path to mastery, not a shameful signal.</p>
<h3>Lesson 3: Failure and feedback</h3>
<p>In a growth mindset, failure is painful but informative — a problem to work on. In a fixed mindset, failure can feel like an identity crisis, so people may avoid hard tasks that risk exposure.</p>
<h3>Lesson 4: Praise and learning</h3>
<p>Dweck’s work cautions that praising innate smartness can push fixed thinking. Process-focused feedback — strategies, practice, persistence — better supports growth.</p>
<h3>Lesson 5: False growth mindset</h3>
<p>Saying “just try harder” without learning better strategies is not enough. Real growth mindset includes seeking effective methods and honest feedback.</p>
<h3>Final Message: Beliefs are trainable</h3>
<p>Mindset is not a pep talk; it is a meaning system. Notice fixed-mindset triggers, then reframe challenge as a chance to get better.</p>
""",
        [
            Q("What is a fixed mindset?", "Belief that abilities can always grow", "Belief that qualities like intelligence are largely static", "Belief that effort never matters for anyone", "Belief that feedback is always wrong", "B"),
            Q("What is a growth mindset?", "Avoiding all challenges", "Belief that abilities can be developed through effort, strategies, and learning", "Only caring about talent labels", "Never practicing", "B"),
            Q("How does a growth mindset typically view failure?", "As a permanent identity verdict", "As painful but useful information for improvement", "As proof you should quit forever", "As unrelated to learning", "B"),
            Q("What kind of praise better supports growth, according to Dweck’s research themes?", "Only praising innate smartness", "Praising process: strategies, practice, and persistence", "Never giving feedback", "Praising only final rankings", "B"),
            Q("What is a risk of a 'false' growth mindset?", "Reading books", "Praising effort alone without better strategies and real learning", "Sleeping enough", "Asking for help", "B"),
        ],
    )
)

books.append(
    book(
        "The Power of Now",
        "Eckhart Tolle",
        12,
        "https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg",
        "Eckhart Tolle’s guide to presence — disidentifying from egoic thinking and meeting life in the present moment.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Only Now is real</h2>
<ul><li>Psychological time (dwelling in past/future) fuels much unnecessary suffering.</li></ul>
<h2>2. Ego is mind-made identity</h2>
<ul><li>The ego sustains itself through stories, comparison, and resistance.</li></ul>
<h2>3. Observe the pain-body</h3>
<ul><li>Old emotional pain can act like an energy field that seeks more pain — until you witness it.</li></ul>
<h2>4. Presence dissolves identification</h2>
<ul><li>Attention in the Now breaks unconscious fusion with thought and emotion.</li></ul>
<h1>PART 2 — THE POWER OF NOW</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: Presence as freedom</h3>
<p>Eckhart Tolle’s The Power of Now teaches that peace is found by entering the present moment and recognizing yourself as more than the stream of thoughts.</p>
<h3>Lesson 1: You are not your mind</h3>
<p>Tolle distinguishes awareness from thought content. Suffering intensifies when you are completely identified with thinking — especially repetitive narratives about past and future.</p>
<h3>Lesson 2: Psychological time</h3>
<p>Clock time is practical. Psychological time is living as if past and future are more real than Now. Worry and regret pull attention out of the only place life actually happens.</p>
<h3>Lesson 3: Ego and resistance</h3>
<p>The egoic self seeks to strengthen its identity through complaint, comparison, and control. Much pain comes from resisting what is, rather than responding consciously.</p>
<h3>Lesson 4: The pain-body</h3>
<p>Tolle describes accumulated emotional pain as a “pain-body” that can become active and feed on negative thinking. The shift is to feel and observe it without becoming it — presence withdraws identification.</p>
<h3>Lesson 5: Practices of Now</h3>
<p>Simple anchors help: noticing breath, sensing the inner body, single-tasking, time in nature, and watching thoughts without following every one.</p>
<h3>Final Message: Enter the present</h3>
<p>The Power of Now is a disidentification training: return attention to this moment, and the mind’s tyranny loosens.</p>
""",
        [
            Q("What does Tolle say is ultimately real and primary for peace?", "Only the future", "The present moment (the Now)", "Only memories", "Other people’s opinions", "B"),
            Q("What is psychological time in Tolle’s teaching?", "A clock on the wall", "Living absorbed in past/future mental stories rather than the present", "Airport schedules", "Meditation timers only", "B"),
            Q("What is the pain-body?", "A gym injury only", "Accumulated emotional pain that can activate and feed on negativity", "A medical diagnosis for everyone", "A type of meditation cushion", "B"),
            Q("How does presence affect identification with pain?", "It always increases drama", "Observing without becoming the pain withdraws identification", "It requires arguing with every thought", "It means suppressing all feeling forever", "B"),
            Q("Which practice fits Tolle’s approach?", "Constant multitasking", "Anchoring attention in breath / inner body / present sensing", "Refreshing social feeds", "Replaying regrets all day", "B"),
        ],
    )
)

# fix typo in Power of Now outline h3 -> h2
books[-1]["content_text"] = books[-1]["content_text"].replace(
    "<h2>3. Observe the pain-body</h3>",
    "<h2>3. Observe the pain-body</h2>",
)

books.append(
    book(
        "The Mountain Is You",
        "Brianna Wiest",
        11,
        "https://covers.openlibrary.org/b/isbn/9781949759228-L.jpg",
        "Brianna Wiest on transforming self-sabotage into self-mastery — the mountain you must climb is often internal.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Self-sabotage is protection</h2>
<ul><li>Many “bad” habits began as ways to stay emotionally safe.</li></ul>
<h2>2. The mountain is internal</h2>
<ul><li>Your biggest barriers are often patterns within you, not only outer circumstances.</li></ul>
<h2>3. Triggers are teachers</h2>
<ul><li>Emotional triggers point to unhealed beliefs and needs.</li></ul>
<h2>4. Growth requires discomfort</h2>
<ul><li>Avoiding discomfort can mean avoiding your life.</li></ul>
<h1>PART 2 — THE MOUNTAIN IS YOU</h1>
<h2>An 11-Minute Read Summary</h2>
<h3>Introduction: Transform self-sabotage</h3>
<p>Brianna Wiest’s The Mountain Is You frames personal growth as climbing an inner mountain: transforming self-sabotage into self-mastery.</p>
<h3>Lesson 1: Reframe self-sabotage</h3>
<p>Wiest argues self-sabotage is often not laziness but outdated self-protection — a part of you seeking safety from fear, rejection, or change.</p>
<h3>Lesson 2: You are the mountain and the climber</h3>
<p>External problems matter, but the recurring obstacle is frequently an internal pattern. Naming that pattern is the first foothold.</p>
<h3>Lesson 3: Build emotional intelligence</h3>
<p>Motivation spikes fade. Progress depends on feeling emotions without being ruled by them — observing triggers, needs, and stories with honesty.</p>
<h3>Lesson 4: Let an old identity go</h3>
<p>Becoming who you want to be can require releasing who you had to be to survive earlier chapters of life.</p>
<h3>Lesson 5: Discomfort is part of the path</h3>
<p>If you only choose comfort, you stay loyal to familiar pain. Growth asks you to tolerate the discomfort of new behavior until it becomes home.</p>
<h3>Final Message: Climb with compassion</h3>
<p>Shame rarely ends sabotage. Understanding what the pattern protects — then choosing aligned action — does.</p>
""",
        [
            Q("How does Wiest reframe self-sabotage?", "As proof you are hopeless", "As often a form of self-protection that outlived its usefulness", "As purely genetic destiny", "As something to ignore", "B"),
            Q("What is the 'mountain' in the book’s metaphor?", "Only other people", "Primarily internal obstacles and patterns you must climb through", "A literal hiking guide", "Your job title", "B"),
            Q("What do emotional triggers offer, according to this book’s themes?", "Random noise only", "Information about wounds, beliefs, and needs", "Proof you should never feel", "A reason to quit growth", "B"),
            Q("Why is discomfort important in Wiest’s framing?", "Pain is the only goal", "Avoiding discomfort can mean avoiding the life you want", "Comfort always equals growth", "Discomfort means you chose wrong forever", "B"),
            Q("What attitude does the book favor toward changing sabotage patterns?", "Pure self-hatred", "Understanding plus responsibility and new aligned action", "Blame everyone else", "Wait for motivation only", "B"),
        ],
    )
)

books.append(
    book(
        "The Subtle Art of Not Giving a F*ck",
        "Mark Manson",
        12,
        "https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg",
        "Mark Manson’s counterintuitive guide to values — choose what to care about, accept struggle, and escape the Feedback Loop from Hell.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Not giving a f*ck is selective</h2>
<ul><li>Care deeply about few things that matter; stop bleeding attention everywhere.</li></ul>
<h2>2. The Feedback Loop from Hell</h2>
<ul><li>Feeling bad about feeling bad multiplies suffering.</li></ul>
<h2>3. Choose better values</h2>
<ul><li>Good values are reality-based, controllable, and constructive.</li></ul>
<h2>4. Responsibility over fault</h2>
<ul><li>You may not be at fault for everything — you are responsible for your response.</li></ul>
<h1>PART 2 — THE SUBTLE ART OF NOT GIVING A F*CK</h1>
<h2>A 12-Minute Read Summary</h2>
<h3>Introduction: A counterintuitive approach</h3>
<p>Mark Manson’s The Subtle Art of Not Giving a F*ck argues that constant pursuit of feeling good can make us more fragile. Maturity is choosing values carefully and accepting that struggle is unavoidable.</p>
<h3>Lesson 1: The backwards law</h3>
<p>Chasing perpetual positivity often backfires. Trying to force a positive experience can itself become a negative experience. Accepting hard truths can free energy.</p>
<h3>Lesson 2: The Feedback Loop from Hell</h3>
<p>You feel anxious, then anxious about being anxious — a self-judgment spiral. Short-circuit it by not condemning yourself for having normal negative emotions.</p>
<h3>Lesson 3: You will always give a f*ck about something</h3>
<p>The question is not whether to care — it is what is worth caring about. Attention is limited; spend it on values you chose.</p>
<h3>Lesson 4: Good values vs bad values</h3>
<p>Manson contrasts shaky values (pleasure-only, always being right, constant positivity as a performance) with better values like honesty, curiosity, and responsibility — more controllable and reality-based.</p>
<h3>Lesson 5: Fault vs responsibility</h3>
<p>You might not be at fault for what happened to you. You remain responsible for what you do next. Ownership is empowering, not a blame game.</p>
<h3>Final Message: Choose your struggle</h3>
<p>Life will have problems. Pick problems that align with values you respect — and stop giving your energy to everything else.</p>
""",
        [
            Q("What is the Feedback Loop from Hell?", "A workout plan", "Feeling bad, then judging yourself for feeling bad, which multiplies suffering", "A savings method", "A networking strategy", "B"),
            Q("What does Manson say about 'not giving a f*ck'?", "Care about nothing forever", "Selectively care about what truly matters; stop wasting care everywhere", "Never feel emotions", "Avoid all responsibility", "B"),
            Q("Which are closer to Manson’s 'good values'?", "Always being right and endless pleasure-chasing", "Honesty, curiosity, and responsibility", "Never being wrong", "Constant performed positivity only", "B"),
            Q("What is the fault vs responsibility distinction?", "They are identical", "You may not be at fault for an event, but you are responsible for your response", "Responsibility means blaming yourself for everything", "Fault means you must fix others", "B"),
            Q("What is the backwards law idea in the book?", "Wanting only positivity can create more negativity; accepting struggle can help", "Always avoid hard things", "Success needs zero discomfort", "Feelings should be ignored permanently", "A"),
        ],
    )
)

out = Path(__file__).resolve().parent / "microlearn_batch1_books.json"
out.write_text(json.dumps(books, indent=2, ensure_ascii=False))
print(f"Wrote {len(books)} books to {out}")
for b in books:
    print("-", b["title"], b["duration_minutes"], "min", len(b["questions"]), "Qs")
