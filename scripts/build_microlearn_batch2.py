#!/usr/bin/env python3
"""Build researched microlearn book payloads for batch 2 (expanded format)."""
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
    content = "\n".join(line.rstrip() for line in html.strip().splitlines())
    return {
        "title": title,
        "author": author,
        "duration_minutes": minutes,
        "cover_image_url": cover,
        "short_description": desc,
        "content_text": content,
        "questions": questions,
    }


books: list[dict] = []

# ---------------------------------------------------------------------------
# 1. Grit
# ---------------------------------------------------------------------------
books.append(
    book(
        "Grit",
        "Angela Duckworth",
        22,
        "https://covers.openlibrary.org/b/isbn/9781501111105-L.jpg",
        "Angela Duckworth’s research on grit: passion plus perseverance, effort counting twice, and the four psychological assets that build staying power.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Grit = passion + perseverance</h2>
<ul><li>Talent alone does not predict long-term achievement; sustained interest and effort do.</li></ul>
<h2>2. Effort counts twice</h2>
<ul><li>Talent × effort = skill; skill × effort = achievement.</li></ul>
<h2>3. Four psychological assets</h2>
<ul><li>Interest, practice, purpose, and hope develop grit over time.</li></ul>
<h2>4. Deliberate practice</h2>
<ul><li>Stretch goals, full concentration, feedback, and repetition until mastery.</li></ul>
<h2>5. Grit can grow</h2>
<ul><li>Culture, parenting, and personal habits can raise grit; the Grit Scale measures it.</li></ul>
<h1>PART 2 — GRIT</h1>
<h2>A 22-Minute Read Summary</h2>
<h3>Chapter 1: Why grit beats talent myths</h3>
<p>Angela Duckworth’s Grit (2016) argues that the secret to outstanding achievement is not genius in isolation but grit: passion and perseverance for long-term goals. Duckworth, a psychologist and former teacher, noticed that the students and cadets who succeeded were not always the most naturally gifted — they were the ones who kept going when others quit.</p>
<p>Her research at West Point, in spelling bees, and across workplaces repeatedly found that grit predicted who stayed and who excelled better than IQ or raw talent alone. That finding challenges a culture that worships “naturals.” Duckworth does not deny talent; she denies that talent is enough, or that lack of early ease means you cannot become excellent.</p>
<p>Grit is about consistency of interest and effort over years, not intensity for a week. Passion here means a durable fascination with a domain — not fleeting excitement. Perseverance means finishing what you start, bouncing back from setbacks, and treating failure as information rather than a verdict on identity.</p>
<p>Duckworth’s own career path — consulting, teaching, then psychology — models the book’s thesis. She kept refining a question that mattered to her: why do some people accomplish more with their ability than others? The answer she landed on was grit, measurable and teachable enough to change how schools and organizations think about potential.</p>
<p><strong>Lesson:</strong> Treat long-term passion and perseverance as more predictive of achievement than talent alone.</p>
<h3>Chapter 2: Effort counts twice</h3>
<p>Duckworth’s most memorable formula is: talent × effort = skill; skill × effort = achievement. Effort appears twice. First it turns potential into skill. Then it turns skill into tangible results. Someone with high talent who rarely practices can be outpaced by someone with moderate talent who trains relentlessly and then applies what they learn in the real world.</p>
<p>This reframes how we interpret early struggle. Difficulty learning a skill does not mean you lack a future in that field; it may mean you need more deliberate effort than a peer who starts easier. Conversely, early ease can become a trap if it teaches you that effort is optional.</p>
<p>Duckworth also distinguishes hard work from mere busyness. Effort that counts is directed at improvement and completion of meaningful goals, not frantic activity without a north star. The “twice” in the formula is a reminder: showing up once to learn is not the same as showing up again to perform and ship.</p>
<p>In practical terms, protect practice time and application time equally. Reading about a skill without rehearsing it builds little skill. Rehearsing without putting the skill into challenging use builds little achievement. Gritty people close both loops.</p>
<p><strong>Lesson:</strong> Multiply effort into both skill-building and achievement — talent without sustained effort underperforms.</p>
<h3>Chapter 3: Interest — falling in love with a craft</h3>
<p>Duckworth describes four psychological assets that grow grit: interest, practice, purpose, and hope. Interest comes first. You cannot grit your way through a life that permanently bores you. Passion often begins as a spark of curiosity, then deepens through exploration, not through a single lightning bolt of destiny.</p>
<p>Many people expect to “find their passion” fully formed. Duckworth’s research suggests passion develops: try things, notice what holds attention, then go deeper. Parents and mentors help by encouraging exploration without forcing premature specialization, then supporting deepening once interest sticks.</p>
<p>Interest also needs to survive the boring middle. Early novelty fades; grit requires enough fascination with the domain to keep caring after the honeymoon. That is why Duckworth emphasizes fit — aligning work with what intrinsically engages you — rather than grinding indefinitely against a total mismatch.</p>
<p>Ask: What topics do I return to voluntarily? What problems do I think about after the meeting ends? Those clues point toward interests worth developing into lasting passions.</p>
<p><strong>Lesson:</strong> Build grit on real interest — explore, then deepen, rather than forcing passion on command.</p>
<h3>Chapter 4: Practice — deliberate improvement</h3>
<p>Once interest exists, grit grows through deliberate practice: a focused method of improvement popularized by Anders Ericsson and central to Duckworth’s account. Deliberate practice is not repeating what is already easy. It means setting a stretch goal just beyond current ability, giving full concentration, seeking immediate feedback, and repeating with refinement until the weak spot improves.</p>
<p>Most people practice by going through the motions in their comfort zone. Gritty experts isolate weaknesses. A pianist does not only play favorite pieces; they slow down the hard passage. A salesperson reviews lost deals for patterns. Feedback — from a coach, data, or recording — turns effort into learning instead of empty repetition.</p>
<p>Duckworth notes that deliberate practice can feel effortful and even unpleasant in the moment. That is expected. Grit is partly the willingness to endure that discomfort because you care about the long-term goal. Flow can follow mastery; the practice that builds mastery is often not flow.</p>
<p>Design practice sessions with a single improvement target, a way to measure it, and a short feedback loop. Consistency beats heroic weekend marathons that leave you too drained to return.</p>
<p><strong>Lesson:</strong> Practice deliberately — stretch, concentrate, get feedback, and refine — instead of mindlessly repeating comfort-zone work.</p>
<h3>Chapter 5: Purpose and hope</h3>
<p>Purpose connects your craft to the well-being of others. Duckworth finds that the grittiest people often see their work as meaningful beyond the self — teaching, healing, building, serving a mission. Purpose does not require a saintly career; it requires a “beyond-the-self” purpose statement that makes daily effort feel worthwhile when motivation dips.</p>
<p>Hope, in Duckworth’s framing, is the expectation that your efforts can improve the future. It is related to growth mindset: believing that abilities can be developed. Without hope, setbacks become permanent labels (“I’m not a math person”). With hope, setbacks become problems to solve.</p>
<p>Purpose answers why the goal matters. Hope answers whether you can still get there after failure. Together they sustain perseverance when interest alone is not enough — during plateaus, criticism, or seasons when progress is invisible.</p>
<p>Write a one-sentence purpose that links your daily practice to someone else’s benefit. When you fail, rehearse a hopeful response: What is one controllable next step? Hope is a habit of interpretation, not a mood you wait for.</p>
<p><strong>Lesson:</strong> Anchor grit in purpose beyond yourself and in hopeful, growth-minded responses to setbacks.</p>
<h3>Chapter 6: The Grit Scale and growing grit</h3>
<p>Duckworth developed the Grit Scale — brief self-report items about consistency of interests and perseverance of effort. Higher scores correlated with retention and achievement in demanding settings. She is careful: self-report has limits, and grit is not the only virtue. Still, the scale makes an abstract trait discussable and trackable.</p>
<p>Grit can grow. Duckworth discusses “growing grit from the inside out” (interest, practice, purpose, hope) and “from the outside in” through culture — teams, families, and organizations that normalize hard things done together. A grit culture celebrates finishing, learning from failure, and long-term commitment rather than only celebrating innate brilliance.</p>
<p>Parenting for grit balances support and challenge: high warmth, high expectations. Overprotection can shrink perseverance; harshness without support can crush interest. Mentors matter: someone who models sticking with hard goals makes grit socially contagious.</p>
<p>Grit is not stubbornness at all costs. Duckworth distinguishes grit from foolish persistence in the wrong aim. Sometimes quitting a dead path frees energy for a better long-term goal. The test is whether you are abandoning a worthy commitment out of discomfort — or wisely redirecting passion.</p>
<p><strong>Lesson:</strong> Measure and cultivate grit through habits and culture — and aim perseverance at goals that still deserve it.</p>
<h3>Chapter 7: Becoming a gritty person</h3>
<p>Taken together, Grit offers a developmental path: discover and deepen interest, practice like an expert, connect work to purpose, and keep hope alive when results lag. Duckworth’s message is democratizing. You do not need to be the prodigy in the room; you need a clear long-term aim and the daily willingness to improve toward it.</p>
<p>Start by naming a multi-year goal that truly interests you. Protect deliberate practice on the calendar. Find a purpose link and a community that values finishing hard things. When you want to quit, ask whether the quit is strategic or merely escape from temporary frustration.</p>
<p>Grit is built in ordinary Tuesdays — another rehearsal, another draft, another attempt after rejection. Over years, those Tuesdays become the difference between potential and achievement.</p>
<p><strong>Lesson:</strong> Grow grit on purpose: long-term aim, deliberate practice, purpose, hope, and a culture that finishes what it starts.</p>
""",
        [
            Q("What is Duckworth’s definition of grit?", "Talent plus luck", "Passion plus perseverance for long-term goals", "Working only when inspired", "Avoiding hard tasks", "B"),
            Q("In Duckworth’s formula, why does effort 'count twice'?", "Effort is irrelevant to skill", "Talent × effort = skill, and skill × effort = achievement", "Effort only builds talent", "Effort replaces purpose", "B"),
            Q("Which four psychological assets does Duckworth link to growing grit?", "Fame, money, status, ease", "Interest, practice, purpose, and hope", "Speed, charisma, luck, networking", "Rest, avoidance, comfort, praise", "B"),
            Q("What characterizes deliberate practice?", "Only repeating easy skills for fun", "Stretch goals, concentration, feedback, and refinement", "Multitasking while practicing", "Avoiding all feedback", "B"),
            Q("What does the Grit Scale primarily measure?", "IQ score", "Consistency of interests and perseverance of effort", "Physical strength", "Short-term mood", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 2. The Compound Effect
# ---------------------------------------------------------------------------
books.append(
    book(
        "The Compound Effect",
        "Darren Hardy",
        20,
        "https://covers.openlibrary.org/b/isbn/9780981951249-L.jpg",
        "Darren Hardy on how small, smart choices compound into massive results — habits, momentum, influences, and acceleration.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Small choices compound</h2>
<ul><li>Tiny daily decisions create huge long-term differences.</li></ul>
<h2>2. Habits run your life</h2>
<ul><li>Track, replace, and design routines that serve your goals.</li></ul>
<h2>3. Momentum is everything</h2>
<ul><li>Consistency creates Big Mo — protect the streak.</li></ul>
<h2>4. Influences shape choices</h2>
<ul><li>Input, associations, and environment either lift or drain you.</li></ul>
<h2>5. Acceleration</h2>
<ul><li>When results appear, push harder — that is when compounding explodes.</li></ul>
<h1>PART 2 — THE COMPOUND EFFECT</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: The compound effect in action</h3>
<p>Darren Hardy’s The Compound Effect (2010) is a practical manifesto for personal success built on one idea: small, smart choices + consistency + time = radical difference. Hardy, long associated with SUCCESS magazine, writes as an operator rather than a theorist. His claim is that you do not need a miracle; you need a better average day, repeated.</p>
<p>He illustrates compounding with simple contrasts: three people start similar; one makes slightly better daily choices about food, learning, and relationships; another stays average; a third drifts slightly worse. Early on, the graphs look almost flat. Later, they diverge dramatically. That lag is why people quit good habits too soon and tolerate bad ones too long.</p>
<p>The compound effect also works in reverse. A cookie, a skipped workout, a ignored conversation — each seems harmless. Stacked for years, they become health crises, skill gaps, and broken trust. Hardy’s invitation is ruthless honesty about the trajectory of your current defaults.</p>
<p>You are always compounding something. The only question is whether today’s micro-choices point toward the life you say you want.</p>
<p><strong>Lesson:</strong> Respect the lag — small daily choices, sustained over time, create outsized outcomes.</p>
<h3>Chapter 2: Choices — own every input</h3>
<p>Hardy insists that every choice matters, including the ones you make on autopilot. Responsibility is the gateway: if you blame luck, bosses, or genetics for everything, you forfeit the steering wheel. Owning choices does not mean denying hardship; it means reclaiming the next decision.</p>
<p>He urges readers to become conscious of “choice points” — the moments where a better micro-decision is available. Put the phone in another room. Prepare breakfast the night before. Send the follow-up email. These are not glamorous, which is why they work: competitors ignore them.</p>
<p>Tracking is Hardy’s antidote to self-deception. When you measure spending, calories, or hours on deep work, patterns appear that memory softens. Awareness alone often improves behavior because invisible leaks become visible.</p>
<p>List the five daily choices that most affect your main goal. Track them for two weeks without trying to be perfect. Let the data confront the story you tell yourself.</p>
<p><strong>Lesson:</strong> Own and track your daily choices — what gets measured stops compounding in the dark.</p>
<h3>Chapter 3: Habits — install the compounding machine</h3>
<p>Habits are the compound effect on autopilot. Hardy argues that you do not rise to goals; you sink to routines. So the work is to identify keystone habits that cascade (exercise that improves sleep and mood; reading that improves decisions) and to replace toxic habits with incompatible better ones.</p>
<p>He recommends starting with manageable changes you can sustain — not a total life overhaul that collapses in ten days. Pair new habits with existing triggers. Design your environment so the good habit is easier than the bad one. Celebrate streaks carefully: the goal is identity as someone who shows up, not a fragile streak that shames you when broken.</p>
<p>Hardy also warns about “the rhythm of success.” When life gets busy, habits are the first casualty — exactly when you need them most. Protect core routines as non-negotiable infrastructure.</p>
<p>Pick one habit to install and one to eliminate this month. Make the new habit smaller than your ego wants, and the old habit harder to access than your willpower can fight.</p>
<p><strong>Lesson:</strong> Engineer habits that automatically compound the right behaviors every day.</p>
<h3>Chapter 4: Momentum — Big Mo</h3>
<p>Hardy’s “Big Mo” (momentum) is the payoff of consistency. Starting is hard; continuing gets easier as identity, skill, and results begin to reinforce each other. Like a merry-go-round, the first push takes the most force; once spinning, smaller pushes keep it going — and stopping feels costly.</p>
<p>This is why Hardy obsesses over not breaking the chain. Misses are expensive not only for the lost day but for the restart cost. Momentum also explains overnight-success illusions: observers see the spike after years of invisible spins.</p>
<p>Protect momentum with routines that survive travel, stress, and boredom. Have a “minimum viable day” version of your key habits so chaos cannot fully erase the streak. When you do break momentum, restart immediately — the compound effect forgives quick recovery better than long absences.</p>
<p>Ask before quitting a good practice: Am I bored, or am I done? Boredom often arrives right before momentum becomes visible.</p>
<p><strong>Lesson:</strong> Guard consistency — momentum multiplies effort once the flywheel is turning.</p>
<h3>Chapter 5: Influences — input, associations, environment</h3>
<p>Hardy breaks influences into three buckets: what you feed your mind, who you associate with, and the environments you inhabit. Garbage input compounds into garbage thinking. Optimistic, growth-oriented input compounds into better decisions.</p>
<p>Associations matter because standards are contagious. If your circle normalizes mediocrity, excellence feels weird. If your circle normalizes learning and follow-through, quitting early feels weird. Hardy is blunt: you may need to upgrade mentors, limit draining relationships, and seek peer pressure that pulls you up.</p>
<p>Environment is the silent architect of choice. A kitchen full of junk food, a desk with endless notifications, a commute that only plays outrage — these are not neutral. Design spaces and defaults that make the compound effect work for you.</p>
<p>Audit your week: media diet, five people you spend most time with, and the rooms where you make key choices. Change one influence in each category.</p>
<p><strong>Lesson:</strong> Curate inputs, associations, and environments — they compound your character whether you notice or not.</p>
<h3>Chapter 6: Acceleration — multiply when it matters</h3>
<p>When compounding finally shows results, Hardy says most people relax. That is the wrong move. Acceleration means adding new disciplines, raising standards, and pushing harder once the foundation exists — because incremental effort on a spinning flywheel creates disproportionate gains.</p>
<p>Acceleration is not frantic hustle from day one; it is earned intensity. After habits and momentum are established, add a stretch goal, a new skill layer, or a bolder ask. Hardy’s point is competitive: while others celebrate early wins by coasting, you reinvest.</p>
<p>The Compound Effect’s closing challenge is simple and severe. Your life is the sum of compounding choices. Choose on purpose, habitize the best ones, protect momentum, upgrade influences, and accelerate when the curve bends upward.</p>
<p><strong>Lesson:</strong> When results finally appear, accelerate — that is when compounding rewards extra effort most.</p>
""",
        [
            Q("What is the core idea of The Compound Effect?", "One big breakthrough fixes everything", "Small smart choices + consistency + time create massive results", "Only talent matters", "Avoid tracking anything", "B"),
            Q("Why does Hardy emphasize tracking choices?", "To shame yourself daily", "To reveal patterns self-deception hides", "Because measurement replaces action", "To impress others", "B"),
            Q("What is 'Big Mo' in Hardy’s framework?", "A financial product", "Momentum created by consistent action", "A type of mentor", "A diet plan", "B"),
            Q("Which three influence categories does Hardy highlight?", "Luck, weather, astrology", "Input, associations, and environment", "Titles, salaries, awards", "Vacations, hobbies, naps", "B"),
            Q("When does Hardy say you should accelerate?", "Before building any habits", "When results appear and the flywheel is already turning", "Only after retirement", "Never — coast instead", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 3. The Four Agreements
# ---------------------------------------------------------------------------
books.append(
    book(
        "The Four Agreements",
        "Don Miguel Ruiz",
        18,
        "https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg",
        "Don Miguel Ruiz’s Toltec-inspired code: be impeccable with your word, don’t take anything personally, don’t make assumptions, and always do your best.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Be impeccable with your word</h2>
<ul><li>Speak with integrity; words can create or destroy.</li></ul>
<h2>2. Don’t take anything personally</h2>
<ul><li>Others’ actions reflect them, not your worth.</li></ul>
<h2>3. Don’t make assumptions</h2>
<ul><li>Ask questions; unclear stories breed suffering.</li></ul>
<h2>4. Always do your best</h2>
<ul><li>Your best changes daily — sincerity over perfection.</li></ul>
<h1>PART 2 — THE FOUR AGREEMENTS</h1>
<h2>A 18-Minute Read Summary</h2>
<h3>Chapter 1: Domestication and the dream of the planet</h3>
<p>Don Miguel Ruiz’s The Four Agreements (1997) presents a compact spiritual-practical code drawn from Toltec wisdom traditions. Ruiz’s framing is that we are “domesticated” from childhood into a shared dream of rules, judgments, and fear-based agreements — about who we must be to be loved, safe, or acceptable.</p>
<p>That domestication creates an inner Judge and a Victim: one punishing, one suffering. We learn to punish ourselves with the same critical voice that once came from outside. Freedom, for Ruiz, begins when we notice these unconscious agreements and replace them with four new ones chosen deliberately.</p>
<p>The book is short by design. Its power is not encyclopedic theory but memorable vows you can practice in ordinary conversations, conflicts, and self-talk. Each agreement interrupts a common source of needless suffering.</p>
<p>Read it as a behavioral ethic for emotional hygiene: cleaner speech, less personalization, fewer invented stories, and sincere effort without self-cruelty.</p>
<p><strong>Lesson:</strong> Notice inherited fear-based agreements, then replace them with four deliberate vows.</p>
<h3>Chapter 2: Agreement 1 — Be impeccable with your word</h3>
<p>Impeccability with the word means speaking with integrity — saying only what you mean, avoiding using words to gossip about yourself or others, and using speech toward truth and love rather than poison. Ruiz treats the word as creative force: what you repeatedly say shapes belief and reality for you and for those who hear you.</p>
<p>Gossip is a primary target. Spreading rumors or tearing others down is black magic in Ruiz’s metaphor — spell-casting that harms. Equally important is self-talk. Calling yourself stupid, worthless, or doomed is still using the word against life. Impeccability starts in the private monologue.</p>
<p>This agreement is not about never being angry or never delivering hard feedback. It is about refusing to weaponize language carelessly. Clarity, honesty, and kindness can coexist with firmness. The standard is: Does this speech create more truth and dignity, or more fog and harm?</p>
<p>Before speaking (or posting), pause: Is it true? Is it necessary? Is it kind? If you must correct, aim at the behavior and the shared goal, not at the person’s identity.</p>
<p><strong>Lesson:</strong> Use your word to create truth and dignity — stop gossip and self-poisoning speech.</p>
<h3>Chapter 3: Agreement 2 — Don’t take anything personally</h3>
<p>Nothing others do is because of you, Ruiz argues — it is because of themselves. Their opinions, insults, and even praise are filtered through their own agreements, wounds, and moods. Taking everything personally makes you easy to manipulate: anyone can hook your emotions with a comment.</p>
<p>This does not mean ignoring feedback or living without boundaries. It means separating useful information from identity attack. If someone is cruel, that reveals their state more than your worth. If someone praises you, enjoy it without becoming addicted to external validation.</p>
<p>Personalization is exhausting because it makes you responsible for other people’s inner weather. Immunity to needless personalization creates peace — and paradoxically makes you freer to respond wisely rather than react defensively.</p>
<p>When criticized, ask two questions: Is there a factual lesson I can use? And can I leave their emotional charge with them? Learn the lesson; decline the shame that is not yours.</p>
<p><strong>Lesson:</strong> Refuse to absorb others’ actions as a verdict on your worth — respond to facts, not hooks.</p>
<h3>Chapter 4: Agreement 3 — Don’t make assumptions</h3>
<p>We suffer when we invent stories about what others think, feel, or intend — then treat those stories as facts. Ruiz says the fix is courageously asking questions and communicating clearly what you want. Assumptions thrive in silence and collapse in honest dialogue.</p>
<p>Assumptions show up in relationships (“They didn’t text, so they don’t care”), at work (“They skipped my idea, so I’m finished”), and in self-judgment (“I failed once, so I’m a failure”). Each leap fills uncertainty with fear-shaped fiction.</p>
<p>Clear asking feels vulnerable. People fear looking needy or foolish. Ruiz’s point is that the cost of not asking — years of resentment based on invented plots — is far higher. Say what you mean. Ask what they mean. Confirm agreements out loud.</p>
<p>Replace “I know why they did that” with “I don’t know — I should ask.” Make curiosity your default under ambiguity.</p>
<p><strong>Lesson:</strong> Ask and clarify instead of writing private fiction about other people’s motives.</p>
<h3>Chapter 5: Agreement 4 — Always do your best</h3>
<p>Your best changes from moment to moment — sick versus healthy, rested versus depleted. Ruiz’s fourth agreement is to do your best under current conditions, no more and no less. That sincerity prevents the guilt of under-trying and the self-abuse of perfectionism.</p>
<p>Doing your best is how you make the first three agreements livable. You will break them; everyone does. When you do your best, you learn without condemning yourself as irredeemable. Action replaces endless self-judgment. Regret shrinks because you know you showed up as fully as you could that day.</p>
<p>Perfectionism pretends there is one best forever. Ruiz’s best is adaptive: today’s best may be a quiet recovery day; tomorrow’s may be courageous confrontation. The vow is presence and sincerity, not identical output.</p>
<p>After a hard day, ask: Did I do my best with what I had? If yes, rest without prosecution. If no, adjust tomorrow without identity collapse.</p>
<p><strong>Lesson:</strong> Do today’s best — variable, sincere effort — then release shame and perfection theater.</p>
<h3>Chapter 6: Living the agreements</h3>
<p>The Four Agreements work as a set. Impeccable speech reduces the harm you put into the world. Not taking things personally reduces the harm you absorb. Not making assumptions reduces the harm you invent. Doing your best keeps you in practice without spiritual perfectionism.</p>
<p>Ruiz acknowledges that breaking free of old domestication takes repetition. You will gossip, personalize, assume, and half-try. The path is returning to the agreements faster each time — a new habit of freedom rather than a single awakening.</p>
<p>Used well, the book becomes a pocket ethics for emotional adulthood: cleaner words, sturdier boundaries of meaning, clearer questions, and compassionate effort.</p>
<p><strong>Lesson:</strong> Practice all four agreements together, returning quickly when you break them.</p>
""",
        [
            Q("What is the first agreement?", "Always be right", "Be impeccable with your word", "Never speak", "Win every argument", "B"),
            Q("What does 'don’t take anything personally' mean?", "Ignore all feedback forever", "Others’ actions reflect them more than your worth", "Never set boundaries", "Agree with every insult", "B"),
            Q("How does Ruiz suggest you avoid assumptions?", "Mind-read better", "Ask questions and communicate clearly", "Assume the worst always", "Stay silent for years", "B"),
            Q("What is true of 'always do your best'?", "Your best is identical every day", "Your best changes with circumstances; sincerity matters", "Only perfection counts", "Best means outworking everyone", "B"),
            Q("In Ruiz’s framing, what does childhood 'domestication' create?", "Only practical skills", "Unconscious fear-based agreements and inner judgment", "Permanent freedom", "Guaranteed success", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 4. Ikigai
# ---------------------------------------------------------------------------
books.append(
    book(
        "Ikigai",
        "Héctor García & Francesc Miralles",
        19,
        "https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg",
        "García and Miralles on the Japanese idea of ikigai — a reason for being — and habits linked to longevity, flow, and joyful purpose.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Ikigai — reason for being</h2>
<ul><li>Where what you love, what you are good at, what the world needs, and what you can be paid for may overlap.</li></ul>
<h2>2. Longevity habits</h2>
<ul><li>Movement, community, diet, and mindset from Okinawa and beyond.</li></ul>
<h2>3. Flow and anti-stress</h2>
<ul><li>Absorbing activity protects mind and body.</li></ul>
<h2>4. Little things, lasting purpose</h2>
<ul><li>Ikigai is often found in daily rituals, not only grand careers.</li></ul>
<h2>5. Ten rules of ikigai</h2>
<ul><li>Practical maxims for a long, meaningful life.</li></ul>
<h1>PART 2 — IKIGAI</h1>
<h2>A 19-Minute Read Summary</h2>
<h3>Chapter 1: What is ikigai?</h3>
<p>Ikigai (2016) by Héctor García and Francesc Miralles popularizes a Japanese concept often translated as “a reason for being” — the sense that life is worth getting up for. The authors weave reporting from Okinawa, one of the world’s longevity blue zones, with psychology on flow, resilience, and purpose.</p>
<p>A widely shared diagram places ikigai at the intersection of what you love, what you are good at, what the world needs, and what you can be paid for. The book treats that diagram as a helpful prompt, not a bureaucratic form you must complete perfectly. Many people’s ikigai is quieter than a dream job title: gardening, teaching a grandchild, crafting, hosting, repairing.</p>
<p>The emotional core is morning motivation. When you have ikigai, effort feels connected to meaning. When you lack it, even comfortable days can feel empty. The authors invite readers to hunt for purpose in both vocation and small daily joys.</p>
<p>Ask what would make you excited to wake up this week — not someday. Ikigai often reveals itself in miniature before it appears as a life plan.</p>
<p><strong>Lesson:</strong> Seek a reason for being in the overlap of love, skill, contribution, and sustainability — including small daily joys.</p>
<h3>Chapter 2: Lessons from longevity cultures</h3>
<p>Drawing on Okinawan life, the authors highlight patterns associated with long, healthy years: gentle daily movement rather than sporadic extreme exercise; social connection and mutual support (moai — close-knit friend groups); a sense of community responsibility; and eating until mostly full (hara hachi bu — roughly 80% full) with a vegetable-forward, modest diet.</p>
<p>They also stress an anti-retirement mindset. Many elders continue purposeful activity — gardening, crafts, mentoring — because stopping all contribution can erode identity and vitality. Movement is woven into life (walking, standing, tending) rather than quarantined to a gym hour that can be skipped.</p>
<p>Longevity here is not a supplement stack. It is a lifestyle ecology: body in motion, stomach not stuffed, heart attached to people, mind attached to a reason to show up.</p>
<p>Borrow one longevity habit this month: a daily walk, an 80% rule at meals, or a recurring social ritual with people who know you.</p>
<p><strong>Lesson:</strong> Longevity grows from daily movement, community, modest eating, and continued purpose — not from retirement into emptiness.</p>
<h3>Chapter 3: Flow — the absorbing present</h3>
<p>The authors connect ikigai to Mihaly Csikszentmihalyi’s flow: the state of complete absorption where challenge and skill balance, time distorts, and self-consciousness fades. Flow activities — craft, sport, deep conversation, creative work — are both enjoyable and restorative compared with anxious rumination or empty scrolling.</p>
<p>Finding flow regularly is a practical path toward ikigai because it reveals what engages you at a neurological level. If you never enter absorption, your days may be filled yet unfulfilling. If you know which activities produce flow, you have clues to protect and expand.</p>
<p>Stress is framed as a longevity enemy when chronic. Flow, friendship, gentle movement, and meaningful work act as antidotes. The book’s tone is gentle: you do not need to optimize every hour; you need more hours that feel alive.</p>
<p>Schedule one flow-prone activity before the week fills with only obligations. Treat absorption as health infrastructure.</p>
<p><strong>Lesson:</strong> Seek regular flow states — they reveal and reinforce what makes life feel worth living.</p>
<h3>Chapter 4: Falling in love with life’s details</h3>
<p>García and Miralles emphasize that ikigai is often discovered in details: a morning tea ritual, tending plants, a neighborhood greeting, a craft practiced without applause. Western career culture can over-index on grand purpose statements and under-index on micro-joys that stabilize a life.</p>
<p>Resilience appears through accepting that life includes struggle while still choosing engagement. The authors discuss logotherapy-adjacent ideas — meaning as a stabilizer — and the importance of staying curious. An active mind exploring new skills in older age correlates with vitality.</p>
<p>This chapter’s quiet challenge: stop postponing joy until the “real” life begins. Ikigai is practiced in today’s ordinary scene, or it remains a poster on the wall.</p>
<p>Name three small rituals that already give you energy. Protect them like appointments. Expand one by 10% rather than inventing a brand-new identity overnight.</p>
<p><strong>Lesson:</strong> Build ikigai from treasured daily details and continued curiosity, not only from a dramatic career reinvention.</p>
<h3>Chapter 5: The ten rules of ikigai</h3>
<p>The book crystallizes guidance into ten rules commonly summarized as: stay active and don’t retire; take it slow; don’t fill your stomach; surround yourself with good friends; get in shape for your next birthday; smile; reconnect with nature; give thanks; live in the moment; and follow your ikigai.</p>
<p>Taken together, the rules are anti-hurry, anti-isolation, and anti-excess. They favor presence over hustle theater, gratitude over entitlement, and embodied life over purely digital existence. None require wealth; all require attention.</p>
<p>The “don’t retire” rule is often misunderstood. It does not mean grind forever in a toxic job. It means do not abandon all purposeful roles. Reinvent contribution if you leave a career — mentoring, volunteering, making, caring.</p>
<p>Pick two rules you currently violate most often. Practice them for thirty days as an experiment in felt energy, not as moral perfection.</p>
<p><strong>Lesson:</strong> Use the ten rules as a simple longevity-and-meaning checklist — active, social, moderate, grateful, present.</p>
<h3>Chapter 6: Finding your ikigai in practice</h3>
<p>Practically, start with questions: What do I love enough to do without applause? What am I skilled at that others value? What needs can I serve? What can sustain me materially? Where the answers overlap, explore. Where they do not, look for bridges — side projects, volunteering, skill-building — rather than demanding instant total alignment.</p>
<p>Ikigai is less a one-time discovery than a relationship you maintain. Seasons change; roles change; the reason for getting up may evolve. The authors’ gift is permission to treat meaning as ordinary, daily, and bodily — not only as a LinkedIn headline.</p>
<p>Leave the book with a small portfolio: one movement habit, one social anchor, one flow activity, one service, one gratitude practice. That portfolio is a living ikigai starter kit.</p>
<p><strong>Lesson:</strong> Assemble ikigai from love, skill, service, and sustainability — then keep adjusting as life seasons change.</p>
""",
        [
            Q("What does ikigai roughly mean?", "A strict diet only", "A reason for being / reason to get up", "A type of martial art", "A financial product", "B"),
            Q("What eating principle is associated with Okinawan longevity in the book?", "Eat until painfully full", "Hara hachi bu — stop around 80% full", "Skip all vegetables", "Only eat once a week", "B"),
            Q("How is flow related to ikigai?", "Flow means constant stress", "Absorbing challenge-skill balance reveals and fuels meaningful engagement", "Flow requires doing nothing", "Flow is only for athletes", "B"),
            Q("What do the authors suggest about retirement?", "Stop all activity immediately", "Stay active with purpose rather than abandoning contribution", "Never leave a job", "Purpose only exists at work", "B"),
            Q("Which is one of the ten rules of ikigai?", "Fill every minute with hustle", "Live in the moment / follow your ikigai", "Avoid friends to stay focused", "Never go outside", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 5. How to Win Friends and Influence People
# ---------------------------------------------------------------------------
books.append(
    book(
        "How to Win Friends and Influence People",
        "Dale Carnegie",
        23,
        "https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg",
        "Dale Carnegie’s timeless classic on human relations — appreciation, genuine interest, names, listening, and leading without resentment.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Don’t criticize, condemn, or complain</h2>
<ul><li>Criticism puts people on the defensive and rarely changes hearts.</li></ul>
<h2>2. Give honest, sincere appreciation</h2>
<ul><li>The deepest urge is to feel important — feed it truthfully.</li></ul>
<h2>3. Arouse in the other person an eager want</h2>
<ul><li>Frame requests in terms of their interests.</li></ul>
<h2>4. Become genuinely interested; smile; remember names</h2>
<ul><li>Warmth and personal recognition open doors.</li></ul>
<h2>5. Listen; talk in terms of their interests; make them feel important</h2>
<ul><li>Influence follows attention and respect.</li></ul>
<h2>6. Lead without humiliation</h2>
<ul><li>Admit faults, ask questions, let others save face, praise improvement.</li></ul>
<h1>PART 2 — HOW TO WIN FRIENDS AND INFLUENCE PEOPLE</h1>
<h2>A 23-Minute Read Summary</h2>
<h3>Chapter 1: Why human relations still decide outcomes</h3>
<p>Dale Carnegie’s How to Win Friends and Influence People (1936) remains one of the most widely read practical books on interpersonal skill. Carnegie wrote for a world of sales floors, offices, and living rooms — yet his core claim travels well: technical competence is not enough if you cannot work with people. Success, he argued, depends heavily on the ability to understand, appreciate, and persuade other human beings without coercion.</p>
<p>The book is organized around principles illustrated with stories — historical figures, business cases, and everyday encounters. Modern readers sometimes flinch at the salesy anecdotes; the enduring value is the psychological realism underneath. People protect their pride. People hunger to feel important. People change more readily when they feel understood than when they feel attacked.</p>
<p>Carnegie is not teaching manipulation as an ideal. He repeatedly insists that techniques fail without sincerity. Feigned interest is eventually detected. The principles work best as habits of genuine respect, not as tricks.</p>
<p>Read the book as a curriculum in emotional intelligence before that phrase existed: reduce ego friction, increase dignity, and align requests with the other person’s motives.</p>
<p><strong>Lesson:</strong> Treat skill with people as a decisive professional and personal advantage — grounded in sincerity, not theatrical charm.</p>
<h3>Chapter 2: Fundamental techniques — criticism, appreciation, and eager wants</h3>
<p>Carnegie’s first major section opens with a hard rule: don’t criticize, condemn, or complain. Criticism wounds pride and triggers defensiveness; people then justify themselves rather than change. Even when you are “right,” public condemnation often loses the relationship and the result. If behavior must be addressed, Carnegie prefers private, respectful approaches later in the book — not a first reflex of blame.</p>
<p>Instead, give honest, sincere appreciation. Carnegie cites the human desire to feel important as a primary driver of behavior. Flattery is cheap and spotted; specific appreciation for real effort or character is fuel. Catch people doing something right and name it clearly.</p>
<p>Third: arouse in the other person an eager want. Influence is not about what you want; it is about connecting your request to what they already value — status, safety, growth, contribution, ease. Carnegie’s fishing metaphor is blunt: bait the hook with what the fish likes, not with what you like.</p>
<p>Before a hard conversation, write two columns: my goal, their likely wants. Redesign your ask so it advances at least one of theirs. Replace a complaint with a specific appreciation plus a forward request.</p>
<p><strong>Lesson:</strong> Drop reflexive criticism, practice sincere appreciation, and frame asks in terms of the other person’s wants.</p>
<h3>Chapter 3: Six ways to make people like you</h3>
<p>Carnegie’s friendship principles are deceptively simple. Become genuinely interested in other people — ask about their lives, work, and hopes, and mean it. Smile — a basic signal of goodwill that costs little and changes first impressions. Remember that a person’s name is, to that person, the sweetest sound; learn names and use them respectfully.</p>
<p>Be a good listener. Encourage others to talk about themselves. Most people are starved for attentive hearing; giving it creates connection faster than dazzling monologues. Talk in terms of the other person’s interests — their hobbies, problems, and goals — rather than steering every conversation back to your résumé.</p>
<p>Finally, make the other person feel important — and do it sincerely. Dignity is not a limited resource. Elevating someone’s standing in a conversation costs you nothing and often unlocks cooperation.</p>
<p>In your next meeting, aim for a 2:1 question-to-statement ratio, use the person’s name once naturally, and end by reflecting something that matters to them. Interest is a practice, not a personality type.</p>
<p><strong>Lesson:</strong> Likeability grows from genuine interest, warmth, names, listening, and sincere respect for others’ importance.</p>
<h3>Chapter 4: How to win people to your way of thinking</h3>
<p>Carnegie’s persuasion section begins with avoiding arguments. You can win an argument and lose a friend, a sale, or a collaborator. When conflict arises, he advises showing respect for others’ opinions and never saying “You’re wrong” as an opening move — it hardens faces instantly.</p>
<p>If you are wrong, admit it quickly and emphatically. Paradoxically, owning a mistake often disarms critics and restores trust faster than defensive lawyering. Begin in a friendly way. Get the other person saying “yes, yes” early by starting from points of agreement — a pattern that builds psychological momentum toward cooperation.</p>
<p>Let the other person do a great deal of the talking. Let them feel the idea is theirs when possible — people support what they help create. Try honestly to see things from their point of view; sympathy for their ideas and desires is persuasive because it is rare. Appeal to nobler motives; dramatize your ideas; and when appropriate, throw down a challenge that invites excellence rather than compliance.</p>
<p>In disagreement, open with common ground and curiosity: “Help me understand how you see it.” Offer your view as a hypothesis, not a verdict. Ask what would make the plan work for them.</p>
<p><strong>Lesson:</strong> Persuade by respect, admission of error, agreement momentum, listening, and empathy — not by verbal combat.</p>
<h3>Chapter 5: Be a leader — change attitudes without resentment</h3>
<p>Leadership principles in Carnegie focus on correction without humiliation. Begin with praise and honest appreciation before noting a problem. Call attention to mistakes indirectly when possible. Talk about your own mistakes before criticizing the other person — shared fallibility reduces shame.</p>
<p>Ask questions instead of giving direct orders when you can; questions invite ownership. Let the other person save face. Praise every improvement, however slight — reinforcement shapes behavior better than punishment alone. Give the other person a fine reputation to live up to; people often rise to the story you tell about them when it is credible and generous.</p>
<p>Use encouragement; make faults seem easy to correct. Make the other person happy about doing what you suggest by linking the task to their identity, growth, or recognition. The through-line is dignity: people change more willingly when their self-respect remains intact.</p>
<p>Before giving corrective feedback, write one sincere praise, one shared mistake of your own, and one question that invites their solution. Deliver privately whenever possible.</p>
<p><strong>Lesson:</strong> Lead change by protecting dignity — praise first, save face, encourage improvement, and invite ownership.</p>
<h3>Chapter 6: Making the principles habitual</h3>
<p>Carnegie urged readers to review the principles regularly and to apply one at a time until it becomes natural. The book’s density is why it rewards slower reading: each principle is simple to quote and hard to live when you are tired, threatened, or eager to be right.</p>
<p>The modern application is broad: remote teams, customer chats, family conflict, networking. The medium changes; pride and the hunger to feel important do not. Where digital life encourages hot takes and public shaming, Carnegie’s bias toward private respect and sincere appreciation is almost countercultural.</p>
<p>Choose three principles for thirty days — for example: no public criticism, two sincere appreciations daily, and listening first in every disagreement. Track incidents where ego almost won. Influence compounds through reputation: people learn whether you leave them bigger or smaller after an interaction.</p>
<p><strong>Lesson:</strong> Practice a few Carnegie principles until they become reflex — sincerity plus dignity beats clever tactics.</p>
<h3>Chapter 7: The deeper ethic beneath the tactics</h3>
<p>Read charitably, Carnegie’s classic is less about “getting your way” than about building a social world where cooperation is easier than conflict. The principles assume that other people are not obstacles but partners whose motives deserve attention. That stance alone changes how you enter rooms.</p>
<p>When the principles are used cynically, they curdle into manipulation and are eventually punished by distrust. When used sincerely, they create relational capital: people return calls, forgive missteps, and bring you opportunities because interactions with you feel safe and elevating.</p>
<p>That is the compound interest of human relations — Carnegie’s true product. Mastery is not memorizing twenty-nine principles; it is becoming someone whose default is curiosity, appreciation, and respect under pressure.</p>
<p><strong>Lesson:</strong> Use Carnegie’s tools as an ethic of respect — influence then becomes a byproduct of trust.</p>
""",
        [
            Q("What does Carnegie advise instead of criticizing first?", "Public shaming", "Avoid criticism/condemnation/complaint; use sincere appreciation and better framing", "Silent treatment forever", "Argue until you win", "B"),
            Q("Why does Carnegie emphasize a person’s name?", "Names are legally required in chat", "A person’s name is deeply important to them; remembering it shows respect", "Names replace listening", "Only celebrities care", "B"),
            Q("What is meant by arousing an 'eager want'?", "Threaten people into action", "Frame requests in terms of the other person’s interests and desires", "Hide your goal completely", "Only talk about yourself", "B"),
            Q("How should you handle being wrong, according to Carnegie?", "Never admit it", "Admit it quickly and emphatically", "Blame a teammate", "Change the subject forever", "B"),
            Q("What is a key leadership principle for correcting others?", "Humiliate them publicly so they learn", "Praise first, save face, encourage improvement, invite ownership", "Only use written reprimands", "Ignore all mistakes", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 6. The Almanack of Naval Ravikant
# ---------------------------------------------------------------------------
books.append(
    book(
        "The Almanack of Naval Ravikant",
        "Eric Jorgenson",
        21,
        "https://covers.openlibrary.org/b/id/10449931-L.jpg",
        "Eric Jorgenson’s curated guide to Naval Ravikant’s thinking on wealth, specific knowledge, leverage, judgment, and happiness.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Wealth vs money vs status</h2>
<ul><li>Seek wealth-creating assets; avoid status games that drain you.</li></ul>
<h2>2. Specific knowledge</h2>
<ul><li>Knowledge that feels like play to you and can’t be easily trained into others.</li></ul>
<h2>3. Leverage</h2>
<ul><li>Labor, capital, code, and media multiply output without linear time.</li></ul>
<h2>4. Judgment and accountability</h2>
<ul><li>Clear thinking under skin-in-the-game responsibility compounds.</li></ul>
<h2>5. Happiness is a skill</h2>
<ul><li>Peace, present-mindedness, and meditation matter as much as wealth.</li></ul>
<h1>PART 2 — THE ALMANACK OF NAVAL RAVIKANT</h1>
<h2>A 21-Minute Read Summary</h2>
<h3>Chapter 1: A modern philosophy of wealth and happiness</h3>
<p>The Almanack of Naval Ravikant (2020), compiled by Eric Jorgenson, organizes entrepreneur and investor Naval Ravikant’s tweets, interviews, and talks into a readable handbook. Two parallel threads run through it: how to create wealth, and how to create happiness. Naval treats both as learnable, not as lottery tickets.</p>
<p>Wealth, for Naval, is assets that earn while you sleep — businesses, products, investments — distinct from money (the medium you exchange) and from status (your rank in a social hierarchy). Status games are zero-sum and often anxious; wealth creation can be positive-sum. The book repeatedly warns ambitious people not to confuse applause with freedom.</p>
<p>The tone is aphoristic and sharp. Jorgenson’s contribution is structure: clustering Naval’s ideas so a reader can study them as a system rather than as scattered viral posts.</p>
<p>Hold a simple scoreboard: Are you building equity in skills and assets, or only collecting status tokens? Redirect energy toward the former.</p>
<p><strong>Lesson:</strong> Pursue wealth-creating assets and skills; do not confuse money-in-the-moment or status with freedom.</p>
<h3>Chapter 2: Specific knowledge and the passion for craft</h3>
<p>Specific knowledge is Naval’s key career concept: knowledge that cannot be trained easily, often found at the edge of your curiosity and unique life path. It feels like play to you and looks like work to others. If society can train thousands of people to do it via a standard curriculum, it is less likely to be specific — and less likely to command outsized returns.</p>
<p>You build specific knowledge by following genuine interests deeply, reading obsessively, and combining unusual skills. Authenticity matters because faking interest collapses under the years of practice required. Naval’s advice is not “follow passion” as a poster; it is “follow what feels like play and keep compounding skill until the market notices.”</p>
<p>Specific knowledge pairs with accountability: putting your name on outcomes. Reputation then becomes an asset. People who are uniquely good and personally responsible become magnets for opportunity.</p>
<p>Map skills that come unusually easy to you and that others request help with. Double down there for a decade rather than chasing every hot generic credential.</p>
<p><strong>Lesson:</strong> Build specific knowledge through authentic obsession — unique, hard-to-train skill that feels like play to you.</p>
<h3>Chapter 3: Leverage — labor, capital, code, media</h3>
<p>Naval argues that permissioned leverage (labor and capital) historically required others’ approval — hiring teams, raising money. Newer forms of leverage — code and media — are permissionless: you can write software or create content that serves thousands without a gatekeeper’s blessing. That shift shapes modern careers.</p>
<p>Labor leverage means people working with you; capital leverage means money multiplying decisions; code leverage means software copying your work at near-zero marginal cost; media leverage means an audience distributing your ideas. The highest aspiration in Naval’s framing is to combine specific knowledge with accountability and permissionless leverage.</p>
<p>Without leverage, your inputs stay roughly linear with time. With leverage, judgment becomes extremely valuable because one good decision can scale. That is why Naval prioritizes clear thinking and long-term reputation over busywork.</p>
<p>Ask: Where can my judgment be applied once and benefit many? Move career effort toward products, content, or capital allocation rather than only trading hours for wages.</p>
<p><strong>Lesson:</strong> Seek leverage — especially permissionless code and media — so judgment scales beyond your calendar.</p>
<h3>Chapter 4: Judgment, long-term games, and reading</h3>
<p>In a leveraged world, judgment is the scarce resource. Naval emphasizes thinking clearly, understanding incentives, and playing long-term games with long-term people. Compound interest applies to relationships and reputation as much as to capital: trust multiplies collaboration; distrust taxes everything.</p>
<p>Reading is Naval’s foundational habit — especially foundational science, philosophy, and timeless texts over most news. He favors understanding first principles over collecting fashionable opinions. Decision quality improves when you know the math of compounding, the psychology of bias, and the history of incentives.</p>
<p>Patience appears as a wealth skill. Many outstanding outcomes require years of quiet work before the curve bends. Impatience pushes people into status hustles and premature quitting.</p>
<p>Upgrade judgment weekly: read something foundational, review one past decision’s incentives, and choose collaborators who play long-term games.</p>
<p><strong>Lesson:</strong> Invest in judgment and long-term trust — leveraged careers amplify thinking quality above raw effort.</p>
<h3>Chapter 5: Happiness, peace, and meditation</h3>
<p>Naval’s happiness thread is as central as wealth. He describes happiness less as continuous pleasure and more as peace — a default state of low internecine conflict in the mind. Desire, especially for what you cannot presently affect, is contracted unhappiness. Managing desire is therefore a happiness skill.</p>
<p>Presence matters. The mind’s habit of living in regret and anxiety steals the only life you actually have — this moment. Meditation, for Naval, is a practical tool to observe thoughts without being owned by them, training peace as a skill rather than waiting for circumstances to perfect themselves.</p>
<p>Health basics — sleep, exercise, diet — support mental clarity. Freedom includes calendaring white space. A wealthy, busy, status-anxious life can still be miserable if the mind never rests.</p>
<p>Define happiness as peace you can practice: reduce needless desires, meditate or sit quietly daily, and protect health as cognitive infrastructure.</p>
<p><strong>Lesson:</strong> Train happiness as peace and presence — meditation and desire-management matter alongside wealth-building.</p>
<h3>Chapter 6: Integrating wealth and peace</h3>
<p>The Almanack’s synthesis is that wealth without peace is a treadmill, and peace without agency can become passivity. Naval’s ideal is specific knowledge + leverage + accountability creating financial freedom, paired with a mind trained toward gratitude and presence so freedom is actually felt.</p>
<p>Practical integration looks like: choose work that compounds skill; build products or content; keep ethics and reputation clean; avoid status addiction; and daily reclaim mental quiet. The book does not offer a single career path. It offers a philosophy of leverage and a philosophy of mind.</p>
<p>Leave with two dashboards. External: skills, assets, leverage. Internal: peace, health, relationships. Optimize both, or the win feels empty.</p>
<p><strong>Lesson:</strong> Build leveraged creative work and a peaceful mind together — freedom needs both balance sheet and inner quiet.</p>
""",
        [
            Q("How does Naval distinguish wealth from status?", "They are identical", "Wealth is assets that earn while you sleep; status is zero-sum social rank", "Status creates all wealth", "Wealth is only cash in a wallet", "B"),
            Q("What is specific knowledge?", "Whatever a standard school course teaches everyone", "Unique, hard-to-train knowledge that feels like play to you", "Memorizing trivia", "Only credentials from elite schools", "B"),
            Q("Which leverage forms does Naval call more permissionless?", "Only government jobs", "Code and media", "Only physical labor", "Only inheritance", "B"),
            Q("Why is judgment so important in Naval’s framework?", "Judgment never matters", "Leverage amplifies decisions, so clear thinking becomes extremely valuable", "Judgment replaces all skill", "Only short-term thinking counts", "B"),
            Q("How does Naval frame happiness?", "Only as buying more things", "As a skill related to peace, presence, and managing desire — aided by meditation", "As ignoring health", "As winning status fights", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 7. The One Thing
# ---------------------------------------------------------------------------
books.append(
    book(
        "The One Thing",
        "Gary Keller",
        20,
        "https://covers.openlibrary.org/b/isbn/9781885167774-L.jpg",
        "Gary Keller’s focus classic: the Focusing Question, successive dominoes, time blocking, and going small to achieve big results.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Go small</h2>
<ul><li>Extraordinary results come from narrowing focus, not doing more.</li></ul>
<h2>2. The Focusing Question</h2>
<ul><li>“What’s the ONE Thing I can do such that by doing it everything else becomes easier or unnecessary?”</li></ul>
<h2>3. Dominoes</h2>
<ul><li>Line up priorities so each success knocks over the next.</li></ul>
<h2>4. Time blocking</h2>
<ul><li>Protect a daily block for your ONE Thing before the world interrupts.</li></ul>
<h2>5. Defeat the lies of busyness</h2>
<ul><li>Multitasking, willpower-all-day myths, and balanced-everything thinking dilute results.</li></ul>
<h1>PART 2 — THE ONE THING</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Extraordinary results require focus</h3>
<p>Gary Keller’s The One Thing (written with Jay Papasan, 2013) argues that success is sequential, not simultaneous. Keller, founder of a giant real-estate franchise network, noticed that breakthrough outcomes came from focusing on the few actions that mattered most — often one action at a time — rather than from heroic multitasking.</p>
<p>The book’s enemy is scattered effort: long to-do lists that create motion without progress. Keller’s thesis is that if you chase everything, you achieve diluted versions of everything. If you identify the lead domino and apply disproportionate energy there, other tasks either become easier or fall away as unnecessary.</p>
<p>“Go small” sounds paradoxical in a culture that celebrates bigger goals. Keller means go small in focus so you can go big in results. Narrowing is not thinking small; it is aiming precisely.</p>
<p>Audit your calendar for the past week. How many hours went to your most important outcome versus reactive noise? That ratio is your real strategy.</p>
<p><strong>Lesson:</strong> Extraordinary results come from narrowed focus on the highest-leverage action — not from doing more things.</p>
<h3>Chapter 2: The Focusing Question</h3>
<p>Keller’s central tool is the Focusing Question: “What’s the ONE Thing I can do such that by doing it everything else becomes easier or unnecessary?” The question forces leverage thinking. It is not “What can I do?” (infinite) or “What should I do someday?” (vague). It is the single action with cascading payoff.</p>
<p>You can ask it big-picture (life, career, relationships) and small-picture (this year, this month, this week, today). The answers should nest: today’s ONE Thing serves the week’s, which serves the year’s. That nesting creates alignment instead of random productivity.</p>
<p>The question also surfaces tradeoffs. Saying yes to the ONE Thing means saying no to good-but-not-essential tasks. Keller treats those nos as strategic, not rude.</p>
<p>Write the Focusing Question at the top of your daily note. Answer it before opening email. Let that answer own your first deep-work block.</p>
<p><strong>Lesson:</strong> Use the Focusing Question at multiple time scales to find the action that makes other work easier or obsolete.</p>
<h3>Chapter 3: The domino effect and priority line-up</h3>
<p>Keller uses successive dominoes as a metaphor: a small domino can topple a larger one if lined up correctly, and a chain can eventually topple something huge. In work terms, complete the lead priority that unlocks the next, rather than tapping many dominoes lightly.</p>
<p>Goal setting to the now connects future vision to present action. Start from a someday aim, then define five-year, one-year, monthly, weekly, and daily ONE Things that form a chain. Each day you tip only the current domino — but because it is lined up, the chain advances.</p>
<p>This is why to-do lists fail when they are unsorted piles. Without a lead domino, checking off easy tasks creates false progress while the real priority waits.</p>
<p>Identify the lead domino for your main goal this month. Schedule it first. Let secondary tasks queue behind it without guilt theater.</p>
<p><strong>Lesson:</strong> Line up priorities as successive dominoes — knock over the lead one that unlocks the rest.</p>
<h3>Chapter 4: Time blocking your ONE Thing</h3>
<p>Keller is adamant that the ONE Thing needs a time block — ideally a substantial daily block early, before meetings and messages fragment attention. Treat that block like a non-negotiable appointment with your future results. If it is not scheduled, the world’s urgent requests will eat it.</p>
<p>Time blocking also applies to planning and to personal life priorities. Keller rejects the fantasy of perfect equal balance every day; he prefers counterbalancing over time — seasons of disproportionate focus — while protecting indispensable personal domains so success does not destroy health or relationships.</p>
<p>Protecting the block requires saying no, delaying lower priorities, and sometimes disappointing people who want immediate access to you. That social friction is the price of extraordinary results.</p>
<p>Put a recurring 2–4 hour morning block on the calendar titled with your ONE Thing. Defend it as you would defend a flight you cannot miss.</p>
<p><strong>Lesson:</strong> Time-block your ONE Thing early and defend it — unscheduled priorities lose to other people’s urgency.</p>
<h3>Chapter 5: Lies that distract and the willpower budget</h3>
<p>Keller attacks common productivity myths: that everything matters equally, that multitasking is effective, that a disciplined person has endless willpower all day, that a fully balanced life happens simultaneously, that big is bad, that accountable means doing it alone without support. Multitasking, he notes, is usually task-switching with a cognitive tax.</p>
<p>Willpower is limited and depletable. Do the ONE Thing while willpower is freshest. Do not waste prime cognitive hours on email triage and then wonder why creative work feels impossible at night.</p>
<p>Live by priority, not by passion alone or by mood. Passion helps, but priority decides. Keller wants readers to become purpose-driven and priority-driven rather than reaction-driven.</p>
<p>Move your most important cognitive work to your peak-energy hours. Demote inbox and meetings to later slots whenever you control the schedule.</p>
<p><strong>Lesson:</strong> Reject multitasking myths and spend limited willpower on the ONE Thing first.</p>
<h3>Chapter 6: The path to extraordinary</h3>
<p>Putting it together: ask the Focusing Question, line up nested answers, time-block the daily lead domino, and keep saying no to diluting opportunities. Keller’s promise is not an easier life; it is a clearer one. Busy can be a social costume; productive is a results costume.</p>
<p>Accountability partners and supportive environments help you keep the block sacred. Review weekly: Did I honor the ONE Thing? What domino comes next? Extraordinary results are rarely explosions; they are focused days stacked until the chain topples something large.</p>
<p>Choose one professional ONE Thing and one personal ONE Thing for the next ninety days. Let those two answers reorganize your calendar. Everything else becomes secondary support or polite decline.</p>
<p><strong>Lesson:</strong> Stack focused days on a nested ONE Thing chain until successive dominoes create extraordinary outcomes.</p>
""",
        [
            Q("What is Keller’s Focusing Question aimed at finding?", "Every task on a long list", "The one action that makes everything else easier or unnecessary", "Only recreational hobbies", "What others want you to do first", "B"),
            Q("What does 'go small' mean in The One Thing?", "Think tiny goals forever", "Narrow focus to the highest-leverage priority to achieve big results", "Avoid ambition", "Do only easy tasks", "B"),
            Q("Why does Keller emphasize time blocking?", "Schedules don’t matter", "To protect a non-negotiable period for the ONE Thing before interruptions win", "To fill the day with meetings", "To multitask better", "B"),
            Q("What is the domino metaphor about?", "Playing games at work", "Lining up priorities so successive successes unlock larger outcomes", "Knocking over competitors personally", "Avoiding planning", "B"),
            Q("When should you typically do your ONE Thing, per Keller’s willpower view?", "When completely exhausted", "When willpower and energy are freshest — often early", "Only on weekends", "After all emails are zero", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 8. 12 Rules for Life
# ---------------------------------------------------------------------------
books.append(
    book(
        "12 Rules for Life",
        "Jordan B. Peterson",
        23,
        "https://covers.openlibrary.org/b/isbn/9780345816023-L.jpg",
        "Jordan B. Peterson’s practical-philosophical rules for meaning and responsibility — posture, self-care, truth, precision, and aiming up.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Stand up straight; treat yourself as someone you are responsible for helping</h2>
<ul><li>Embodied confidence and self-respect as ethical duties.</li></ul>
<h2>2. Choose friends who want the best for you</h2>
<ul><li>Social circles either elevate or drag you into chaos.</li></ul>
<h2>3. Compare yourself to who you were yesterday</h2>
<ul><li>Local progress beats toxic global comparison.</li></ul>
<h2>4. Set your house in perfect order before criticizing the world</h2>
<ul><li>Begin with controllable responsibility.</li></ul>
<h2>5. Pursue what is meaningful, not what is expedient</h2>
<ul><li>Long-term meaning over short-term impulse.</li></ul>
<h2>6. Tell the truth; be precise in your speech</h2>
<ul><li>Honesty and clarity reduce chaos.</li></ul>
<h2>7. Attend to small mercies; let children take risks</h2>
<ul><li>Pet a cat when you can; don’t overprotect kids out of adventure.</li></ul>
<h1>PART 2 — 12 RULES FOR LIFE</h1>
<h2>A 23-Minute Read Summary</h2>
<h3>Chapter 1: Rule 1 — Stand up straight with your shoulders back</h3>
<p>Jordan B. Peterson’s 12 Rules for Life (2018) mixes clinical psychology, mythology, evolutionary biology, and moral exhortation. Rule 1 uses lobster hierarchies as a provocative metaphor: creatures that win dominance contests often display more open, upright posture, and neurochemistry shifts with status. Peterson’s human point is not “become a bully.” It is that embodied posture and willingness to face the world feed back into confidence, opportunity, and mood.</p>
<p>Standing up straight is literal and metaphorical. Literally, adopt a stance that signals readiness rather than defeat. Metaphorically, accept the burden of Being — show up to life’s contests instead of curling into avoidance. People who chronically signal defeat invite more defeat; those who present themselves as capable often receive better invitations.</p>
<p>Critics debate the biology; the practical counsel remains usable: stop practicing bodily defeat. Walk into rooms as if you have a right to be there and a duty to contribute. Posture will not solve everything, but collapse helps nothing.</p>
<p>Tomorrow morning, deliberately square your shoulders, make the bed, and take one action you have been avoiding. Let the body lead the mind for a day.</p>
<p><strong>Lesson:</strong> Carry yourself as someone responsible for facing life — posture and willingness shape the feedback you receive.</p>
<h3>Chapter 2: Rule 2 — Treat yourself like someone you are responsible for helping</h3>
<p>Peterson notes a grim irony: people often care for pets more diligently than for themselves — administering medicine to a dog while neglecting their own prescriptions. Rule 2 asks you to see yourself as a person worthy of care, not as an object of contempt.</p>
<p>Self-contempt often hides as false virtue (“I don’t deserve good things”). Peterson reframes self-care as moral responsibility: you have a duty to the future human who inherits your choices. Sleep, health, finances, and promises kept are not vanity; they are stewardship.</p>
<p>Treating yourself as someone you help also means setting aims. A person you care for needs a plan, not endless self-punishment. Replace “I hate myself” loops with concrete aid: appointments made, habits installed, environments cleaned.</p>
<p>Write a care plan for yourself as if for a friend you love: health, work, relationships. Execute one item today without negotiating your worthiness.</p>
<p><strong>Lesson:</strong> Care for yourself as a duty of responsibility — you are someone worth helping, not a perpetual target of neglect.</p>
<h3>Chapter 3: Rule 3 — Make friends with people who want the best for you</h3>
<p>Not every social bond is nourishing. Some friendships reward failure, cynicism, or shared decline because your progress would expose their stagnation. Rule 3 is a permission slip to choose peers who celebrate your upward aim and tell you the truth when you drift.</p>
<p>Peterson is not advising snobbery; he is advising against rescuing people who refuse to aim up if that rescue destroys you. Compassion without discernment becomes enabling. Surround yourself, as much as possible, with people whose example makes good habits easier.</p>
<p>Audit your five closest influences. Who leaves you more responsible after contact? Who leaves you more chaotic? Increase time with the first group; set boundaries with the second.</p>
<p><strong>Lesson:</strong> Prefer friendships that want your best — upward-aiming peers over bonds that punish growth.</p>
<h3>Chapter 4: Rule 4 — Compare yourself to who you were yesterday, not to who someone else is today</h3>
<p>Modern life floods you with curated peaks of others’ lives. Global comparison produces envy and paralysis because there is always someone further ahead on some axis. Rule 4 relocates the race: beat your prior self on a local, controllable dimension.</p>
<p>This is not anti-ambition. Models can inspire. But the daily scoreboard should be personal: Did I improve the sentence I can control? Peterson ties this to meaning — a life organized around incremental responsibility produces steady dignity.</p>
<p>Pick one metric for thirty days — writing minutes, training sessions, kind acts, decluttered spaces. Compare only to yesterday’s you. Let others’ highlight reels exist without owning your nervous system.</p>
<p><strong>Lesson:</strong> Measure progress against yesterday’s self — local improvement beats toxic global comparison.</p>
<h3>Chapter 5: Rules 5–6 — Parent wisely; set your house in order</h3>
<p>Rule 5 advises: do not let your children do anything that makes you dislike them — because the world will like them even less if they become intolerable. Parenting requires courage to socialize children toward reciprocity, not endless indulgence disguised as love. Limits are a gift when they teach children how to be welcome among others.</p>
<p>Rule 6: set your house in perfect order before you criticize the world. Before grand ideological crusades, stop doing things you know to be wrong in your own life — broken promises, neglected duties, addictions, lies. Chaos at home undermines moral authority abroad. Begin with what you can fix.</p>
<p>Together these rules emphasize responsibility near at hand. Civilizational criticism is easy; personal order is hard. Peterson pushes readers toward the hard starting point.</p>
<p>List three disorders in your immediate life — room, calendar, finances, relationships. Fix one before posting another complaint about the world.</p>
<p><strong>Lesson:</strong> Socialize children toward being likable and useful; put your own house in order before condemning everything else.</p>
<h3>Chapter 6: Rules 7–8 — Meaning over expedience; tell the truth</h3>
<p>Rule 7: pursue what is meaningful, not what is expedient. Expedience grabs short-term relief — another avoidance, another easy lie, another impulse. Meaning accepts responsibility and delayed gratification for a story you can respect. Peterson links meaning to shouldering voluntary burdens that reduce suffering for self and others.</p>
<p>Rule 8: tell the truth — or, at least, don’t lie. Lies warp your map of reality until you cannot navigate. Living falsely creates a fog where catastrophes surprise you. Truth-telling is costly in the moment and cheaper across a life.</p>
<p>When tempted by an expedient shortcut, ask what meaningful path would make you stronger and more trustworthy in a year. Prefer that path even when it is slower.</p>
<p><strong>Lesson:</strong> Choose meaningful responsibility over short-term expedience, and speak truth so your map of reality stays usable.</p>
<h3>Chapter 7: Rules 9–12 — Listen, be precise, let kids skate, pet a cat</h3>
<p>Rule 9: assume that the person you are listening to might know something you don’t. Conversation becomes exploration rather than combat. Rule 10: be precise in your speech — vague language leaves dragons unnamed; precise naming makes problems solvable. Say what is wrong in the relationship, the contract, or the body without fog.</p>
<p>Rule 11: do not bother children when they are skateboarding — let them take reasonable risks. Overprotection can weaken courage; competence grows at the edge of danger well managed. Rule 12: pet a cat when you encounter one on the street — attend to small islands of beauty and grace when suffering is inevitable. Life includes tragedy; notice mercies anyway.</p>
<p>These closing rules balance steel and softness: radical honesty and precision, plus humility in listening, plus permission for adventure, plus gratitude for tiny goods.</p>
<p>Practice one precision conversation this week — name the real problem without insult. Practice one deliberate mercy — notice something lovely without irony.</p>
<p><strong>Lesson:</strong> Listen as if others know something; speak precisely; allow measured risk; notice small beauties amid suffering.</p>
<h3>Chapter 8: Aiming up as a daily ethic</h3>
<p>Across the twelve rules, Peterson’s through-line is responsibility as a path to meaning. Stand tall, care for yourself, choose better peers, improve locally, order what is near, aim at meaning, tell truth, listen, speak clearly, allow courage to develop, and notice grace. The book is demanding and polarizing; its usable core is an ethic of voluntary responsibility in a chaotic world.</p>
<p>You do not need to accept every analogy to adopt the practice: reduce lies, reduce disorder you control, reduce friendships that celebrate your worst, and increase truthful speech and incremental self-mastery. Meaning, in this framing, is what appears when you aim up and carry the resulting load.</p>
<p><strong>Lesson:</strong> Build meaning by aiming up daily — truth, order, responsibility, and attention to what still makes life lovely.</p>
""",
        [
            Q("What is the practical point of 'stand up straight with your shoulders back'?", "Become aggressive toward everyone", "Face life with embodied readiness; posture and willingness affect feedback and confidence", "Ignore all social situations", "Only think about lobsters", "B"),
            Q("What does Rule 2 ask you to do?", "Neglect your health as humility", "Treat yourself like someone you are responsible for helping", "Put everyone else last always", "Avoid all plans", "B"),
            Q("According to Rule 4, whom should you compare yourself to?", "Only billionaires", "Who you were yesterday, not everyone else today", "Your enemies", "Celebrities on social media", "B"),
            Q("What should you do before criticizing the world (Rule 6)?", "Post more complaints", "Set your house in order / stop doing what you know is wrong", "Ignore your personal life", "Quit all responsibilities", "B"),
            Q("What do Rules 8 and 10 emphasize together?", "Vague speech and comforting lies", "Tell the truth and be precise in your speech", "Never listen to others", "Avoid naming problems", "B"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 9. Outliers
# ---------------------------------------------------------------------------
books.append(
    book(
        "Outliers",
        "Malcolm Gladwell",
        22,
        "https://covers.openlibrary.org/b/isbn/9780316017930-L.jpg",
        "Malcolm Gladwell on why outliers succeed — 10,000 hours, hidden opportunity, cultural legacy, meaningful work, and the Matthew effect.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Success is not solo genius</h2>
<ul><li>Outliers ride hidden advantages, timing, and culture — not talent alone.</li></ul>
<h2>2. 10,000 hours</h2>
<ul><li>Mastery requires enormous deliberate practice — and access to practice time.</li></ul>
<h2>3. Opportunity and timing</h2>
<ul><li>Birth dates, eras, and gateways create uneven chances.</li></ul>
<h2>4. Cultural legacy</h2>
<ul><li>Inherited cultural patterns shape persistence, communication, and risk.</li></ul>
<h2>5. Meaningful work and the Matthew effect</h2>
<ul><li>Autonomy, complexity, and reward matter; early advantages compound.</li></ul>
<h1>PART 2 — OUTLIERS</h1>
<h2>A 22-Minute Read Summary</h2>
<h3>Chapter 1: The myth of the self-made outlier</h3>
<p>Malcolm Gladwell’s Outliers (2008) reframes superstar success stories. We love narratives of lone genius — the scrappy founder, the prodigy, the self-made billionaire. Gladwell argues those stories are incomplete. Outliers are products of practice, yes, but also of hidden opportunities, cultural legacies, family background, and historical timing.</p>
<p>The book opens with patterns like Canadian hockey players disproportionately born in the first months of the year — a relative-age effect. Early birthdays make children older in their cohort, which leads to selection, better coaching, more practice, and further advantage. What looks like pure talent is partly an arbitrary cutoff date compounded by systems.</p>
<p>Gladwell’s moral is double-edged. Individuals still must work; communities and institutions also create or withhold the conditions for work to matter. Understanding outliers means studying the soil, not only the plant.</p>
<p>When you admire a success story, ask: What practice did they get? What gate opened? What culture prepared them? Expand the frame beyond personality worship.</p>
<p><strong>Lesson:</strong> Read success as the product of effort plus opportunity structures — not as pure solo genius.</p>
<h3>Chapter 2: The 10,000-hour rule and access to practice</h3>
<p>Gladwell popularized the idea that expertise in complex fields often requires on the order of 10,000 hours of practice — drawing on research associated with Anders Ericsson. The Beatles’ Hamburg residencies, Bill Gates’ unusual access to computer time as a teen — Gladwell’s cases emphasize not only grinding but unusual access to grinding.</p>
<p>The nuance critics rightly add: 10,000 is not magic, and deliberate practice quality matters. Gladwell’s useful stress is still valid for readers: mastery is rarely a weekend project, and many “overnight” successes were practicing when others could not get near the equipment, mentors, or stages.</p>
<p>So the rule is both inspiration and indictment. Inspiration: put in the hours. Indictment: ask who gets the hours. Societies that ration opportunity ration excellence.</p>
<p>If you want mastery, design a multi-year practice pipeline. If you lead, open doors so more people can accumulate serious hours — not only the already advantaged.</p>
<p><strong>Lesson:</strong> Aim for massive deliberate practice — and notice that access to practice time is itself an advantage.</p>
<h3>Chapter 3: Opportunity, timing, and demographic luck</h3>
<p>Gladwell examines how being born in the right year for a tech wave, a legal change, or an industry boom shapes outcomes. Jewish immigrant lawyers who arrived when New York’s establishment firms excluded them built skills in then-unfashionable niches that later exploded. Tech titans born in the mid-1950s hit adulthood as personal computing ignited.</p>
<p>This is not fatalism. It is context. Two equally driven people in different eras face different ceilings. Recognizing demographic luck should produce humility in winners and smarter policy for everyone else — more on-ramps, not only more pep talks.</p>
<p>Personally, scan for waves you can still catch: tools, industries, and skill intersections where timing still favors deep work. Opportunity is uneven; attention to timing is a skill.</p>
<p><strong>Lesson:</strong> Respect timing and structural opportunity — place yourself where waves and preparation can meet.</p>
<h3>Chapter 4: Practical intelligence and meaningful work</h3>
<p>Cognitive ability matters, Gladwell argues, but only to a point — beyond a threshold, other factors dominate. Practical intelligence — knowing how to navigate social systems, advocate for yourself, read situations — often comes from family environments that teach negotiation and agency. Two students with similar IQs can diverge because one knows how to talk to institutions and the other does not.</p>
<p>Meaningful work, in Gladwell’s telling, has complexity, autonomy, and a clear connection between effort and reward. Immigrant entrepreneurial stories often feature exhausting labor that still feels meaningful because the link between work and advancement is vivid. Distorted systems that break that link drain motivation.</p>
<p>Cultivate practical intelligence: ask for help, learn institutional rules, practice clear requests. Seek roles where effort still maps to reward — or redesign your projects so it does.</p>
<p><strong>Lesson:</strong> Past a cognitive threshold, practical intelligence and meaningful work conditions heavily shape outcomes.</p>
<h3>Chapter 5: Cultural legacy — planes, rice, and persistence</h3>
<p>Gladwell’s sections on cultural legacy explore how inherited patterns of communication and work shape modern performance. His analysis of plane crashes highlights mitigated speech — crews hesitating to speak assertively across hierarchy — as a risk factor. Culture is not destiny, but it is inertia; aviation safety improved partly by changing communication norms.</p>
<p>His rice-farming argument links certain agricultural traditions to cultures of persistent, precise work — then connects that legacy to attitudes toward math learning. Whether every anthropological link persuades every critic, the broader claim lands: deep cultural histories live inside present behavior.</p>
<p>For individuals, cultural legacy literacy means noticing your default conflict style, authority habits, and persistence scripts — then updating what no longer serves. For organizations, it means designing norms that make safe speech and sustained practice possible across backgrounds.</p>
<p><strong>Lesson:</strong> Cultural legacies shape communication and persistence — notice them, then redesign norms that block excellence or safety.</p>
<h3>Chapter 6: The Matthew effect and rewriting the story of success</h3>
<p>The Matthew effect — “to those who have, more will be given” — runs through Outliers. Early advantages attract more resources, which create more advantage. Relative-age effects in sports, streaming into gifted programs, early capital access — all can snowball.</p>
<p>Gladwell’s closing ethos is democratic: if outliers are made by ecosystems, we can build better ecosystems — more practice access, fairer cutoffs, richer cultural support for effort, more meaningful work. Personal takeaway: work insanely hard and advocate for wider on-ramps. Humility takeaway: winners should narrate their help, not only their hustle.</p>
<p>Rewrite your own success and failure stories with context included. Then put in the hours anyway — because opportunity without effort is also incomplete.</p>
<p><strong>Lesson:</strong> Advantages compound (the Matthew effect) — pursue mastery while building fairer access to the conditions mastery requires.</p>
""",
        [
            Q("What is Gladwell’s main critique of typical success stories?", "Hard work never matters", "They ignore hidden advantages, timing, and culture — not only individual talent", "Only luck matters and effort is useless", "Schools explain everything", "B"),
            Q("What does the 10,000-hour discussion emphasize?", "Mastery needs no practice", "Enormous practice — and unusual access to practice opportunities", "One hour is enough", "Talent replaces all practice", "B"),
            Q("What is the relative-age effect example in Outliers often about?", "Random adult hobbies", "Youth sports cutoff dates advantaging older children in a cohort", "Astrology signs", "Retirement ages", "B"),
            Q("What three qualities does Gladwell associate with meaningful work?", "Fame, ease, and gossip", "Complexity, autonomy, and a link between effort and reward", "Strict obedience only", "Short hours only", "B"),
            Q("What is the Matthew effect in this context?", "Advantages compound — early gains attract more gains", "Everyone starts equal forever", "Practice reduces skill", "Culture never matters", "A"),
        ],
    )
)

# ---------------------------------------------------------------------------
# 10. Essentialism
# ---------------------------------------------------------------------------
books.append(
    book(
        "Essentialism",
        "Greg McKeown",
        20,
        "https://covers.openlibrary.org/b/isbn/9780804137386-L.jpg",
        "Greg McKeown’s disciplined pursuit of less but better — explore, eliminate, execute, and protect the essential with sleep, play, and tradeoffs.",
        """
<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Less but better</h2>
<ul><li>Essentialism is the disciplined pursuit of what truly matters.</li></ul>
<h2>2. Tradeoffs are real</h2>
<ul><li>If you don’t choose, someone else chooses for you.</li></ul>
<h2>3. Explore, eliminate, execute</h2>
<ul><li>Discern essentials, cut the rest, make execution effortless.</li></ul>
<h2>4. Protect the asset</h2>
<ul><li>Sleep, play, and buffers sustain high-quality contribution.</li></ul>
<h2>5. Say no gracefully</h2>
<ul><li>Boundaries defend the essential against the merely good.</li></ul>
<h1>PART 2 — ESSENTIALISM</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: The disciplined pursuit of less</h3>
<p>Greg McKeown’s Essentialism (2014) defines a way of thinking: less but better. Non-essentialists say yes under social pressure, then live scattered, busy, and resentful. Essentialists explore what is vital, eliminate what is not, and build systems so the vital gets done with as little friction as possible.</p>
<p>McKeown’s trigger story is personal overload — success creating options, options creating diffusion, diffusion creating a sense of lost control. Essentialism is not laziness. It is deliberate concentration of effort on the highest contribution. Doing fewer things poorly is not the goal; doing the right things excellently is.</p>
<p>The essentialist mindset replaces “I have to” with “I choose,” replaces “It’s all important” with “Only a few things really matter,” and replaces “How can I fit it all in?” with “What tradeoff will I make?”</p>
<p>List everything competing for your attention this month. Circle at most three that create disproportionate value. Everything else becomes a candidate for elimination or deferral.</p>
<p><strong>Lesson:</strong> Adopt less-but-better as a discipline — concentrate on vital contribution instead of indiscriminate busyness.</p>
<h3>Chapter 2: Tradeoffs, choice, and the power of no</h3>
<p>Essentialists accept tradeoffs as inherent, not optional. Trying to eliminate tradeoffs eliminates excellence. If you refuse to choose, the world chooses for you — usually in favor of the loudest request, not the highest value.</p>
<p>Saying no is a core skill. McKeown offers graceful declines: pause, separate decision from relationship, give a clear no with a brief reason, and offer an alternative when appropriate. A unclear maybe helps no one. A clean no protects the yes that matters.</p>
<p>Boundary setting includes escaping from unproductive commitments already made — editing life midstream. Essentialism is continuous pruning, not a one-time spring clean.</p>
<p>Practice one graceful no this week to a good-but-not-essential request. Notice that disappointment is often temporary while resentment from overcommitment lingers.</p>
<p><strong>Lesson:</strong> Choose tradeoffs consciously and say no clearly — otherwise other people’s priorities will own your calendar.</p>
<h3>Chapter 3: Explore — discern what is essential</h3>
<p>The first phase is explore: create space to think, look, play, and sleep so you can see what actually matters. Non-essentialists are too busy executing to discern. Essentialists schedule thinking time, escape constant connectivity, and use criteria selective enough that most options fail the test.</p>
<p>McKeown suggests extreme criteria: if it is not a clear heck-yes, it is a no. Journaling, quiet, and intentional exploration of options beat reactive acceptance. Play is not frivolous — it sparks insight. Sleep is not optional — it protects judgment.</p>
<p>Exploration also means talking to people who help you reality-test contribution: What is the unique value I can add? What problem, if solved, unlocks others?</p>
<p>Block a weekly “explore” hour with phone off. Review commitments against a heck-yes standard. Protect sleep as a strategic asset, not a leftover.</p>
<p><strong>Lesson:</strong> Explore with space, sleep, and strict criteria so you can recognize the vital few.</p>
<h3>Chapter 4: Eliminate — cut the nonessential</h3>
<p>Eliminate means subtracting commitments, clutter, and false priorities. McKeown encourages zero-based commitment budgeting: pretend you have no prior obligations and only re-add what earns its place. Edit ruthlessly — in writing, calendars, and wardrobe metaphors alike.</p>
<p>Avoid the endowment effect of commitments: we overvalue what we already said yes to. Ask: If I did not already own this commitment, how much would I sacrifice to get it? Often the honest answer frees you.</p>
<p>Elimination is also social: clarify from the boss or client what the true priority is. Ambiguity keeps everything “important.” Essentialists force clarity.</p>
<p>Cancel or renegotiate one lingering commitment that no longer passes the contribution test. Feel the relief as data — your system was overloaded.</p>
<p><strong>Lesson:</strong> Ruthlessly eliminate nonessentials — re-choose commitments instead of carrying them by default.</p>
<h3>Chapter 5: Execute — make the essential effortless</h3>
<p>Execution for essentialists is about removing friction: build buffers, subtract until process is smooth, create small wins, and design routines that make the right action the easy action. Heroes who thrash through chaos look busy; systems that prevent chaos look calm and produce more.</p>
<p>McKeown emphasizes preparing margins — time buffers for the unexpected — rather than living at 100% utilization. Extreme utilization is fragility. He also celebrates focus rituals: one priority at a time, progress celebrated, distractions fenced.</p>
<p>When execution feels constantly hard, the essentialist response is not always “try harder.” It is “design better” — checklists, templates, batching, and environment design so willpower is less necessary.</p>
<p>For your top priority, remove two frictions (tools ready, location prepared, first step tiny) and add one buffer block for overflow. Make the essential path slippery-smooth.</p>
<p><strong>Lesson:</strong> Execute by design — buffers, routines, and friction removal beat heroic thrashing.</p>
<h3>Chapter 6: Living as an essentialist</h3>
<p>Essentialism becomes an identity when you repeatedly choose vital few over busy many. McKeown’s promise is not a smaller life but a more meaningful one — deeper relationships, better work, and less toxic stress. The nonessential often includes not only silly distractions but also good opportunities that do not fit your highest contribution.</p>
<p>Leadership applications are strong: essentialist teams clarify the real priority, kill pet projects bravely, and stop glorifying burnout theater. Personal applications are equally strong: protect sleep, schedule play, keep margins, and let your yes mean something because your no is real.</p>
<p>Choose a ninety-day essential intent — one contribution that would make the period a success. Align calendar, nos, sleep, and execution design to that intent. Review weekly: Did I live less but better?</p>
<p><strong>Lesson:</strong> Live essentialism as identity — fewer, better commitments, protected energy, and execution systems that keep the vital done.</p>
""",
        [
            Q("What is Essentialism’s core phrase?", "More but faster", "Less but better", "Everything is equally important", "Never say no", "B"),
            Q("What are the three phases McKeown emphasizes?", "Ignore, delay, forget", "Explore, eliminate, execute", "Hustle, multitask, burn out", "Copy, paste, coast", "B"),
            Q("How should essentialists treat tradeoffs?", "Pretend they don’t exist", "Accept and choose them consciously — or others will choose for you", "Always say yes to avoid them", "Only make tradeoffs once a year", "B"),
            Q("Why does McKeown value sleep and play in exploration?", "They are wastes of time", "They protect judgment and spark insight needed to discern essentials", "Only athletes need them", "They replace all hard work", "B"),
            Q("What is a practical elimination question for old commitments?", "How can I add more?", "If I didn’t already have this commitment, how hard would I work to get it?", "Who can I blame?", "How do I hide it?", "B"),
        ],
    )
)


def main() -> None:
    out = Path(__file__).resolve().parent / "microlearn_batch2_books.json"
    out.write_text(json.dumps(books, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(books)} books to {out}")
    print()
    print(f"{'Title':<42} {'Chars':>6} {'Min':>4} {'Ch':>3}")
    print("-" * 60)
    for b in books:
        ch = b["content_text"].count("<h3>Chapter")
        n = len(b["content_text"])
        flag = "OK" if n >= 7000 else "SHORT"
        print(f"{b['title']:<42} {n:>6} {b['duration_minutes']:>4} {ch:>3}  {flag}")
        if n < 7000:
            raise SystemExit(f"Content too short: {b['title']} ({n})")
        if not (18 <= b["duration_minutes"] <= 23):
            raise SystemExit(f"Duration out of range: {b['title']}")
        if len(b["questions"]) != 5:
            raise SystemExit(f"Need 5 questions: {b['title']}")


if __name__ == "__main__":
    main()

