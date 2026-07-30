DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'How to Win Friends and Influence People');
DELETE FROM public.information WHERE title = 'How to Win Friends and Influence People';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'How to Win Friends and Influence People',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
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
<p><strong>Lesson:</strong> Use Carnegie’s tools as an ethic of respect — influence then becomes a byproduct of trust.</p>',
    23,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg',
    'Dale Carnegie’s timeless classic on human relations — appreciation, genuine interest, names, listening, and leading without resentment.'
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
  ('What does Carnegie advise instead of criticizing first?', 'Public shaming', 'Avoid criticism/condemnation/complaint; use sincere appreciation and better framing', 'Silent treatment forever', 'Argue until you win', 'B', 1),
  ('Why does Carnegie emphasize a person’s name?', 'Names are legally required in chat', 'A person’s name is deeply important to them; remembering it shows respect', 'Names replace listening', 'Only celebrities care', 'B', 2),
  ('What is meant by arousing an ''eager want''?', 'Threaten people into action', 'Frame requests in terms of the other person’s interests and desires', 'Hide your goal completely', 'Only talk about yourself', 'B', 3),
  ('How should you handle being wrong, according to Carnegie?', 'Never admit it', 'Admit it quickly and emphatically', 'Blame a teammate', 'Change the subject forever', 'B', 4),
  ('What is a key leadership principle for correcting others?', 'Humiliate them publicly so they learn', 'Praise first, save face, encourage improvement, invite ownership', 'Only use written reprimands', 'Ignore all mistakes', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Almanack of Naval Ravikant');
DELETE FROM public.information WHERE title = 'The Almanack of Naval Ravikant';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Almanack of Naval Ravikant',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
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
<p>Naval’s aphorisms reward rereading because they are compressed. One week, focus only on specific knowledge. Another, only on leverage. Another, only on meditation. The Almanack is less a novel to finish than a handbook to cycle through as your career and mind evolve.</p>
<p>Above all, play long-term games: with your craft, your collaborators, and your own attention. Compounding needs time, and time needs a mind calm enough to stay the course.</p>
<p><strong>Lesson:</strong> Build leveraged creative work and a peaceful mind together — freedom needs both balance sheet and inner quiet.</p>',
    21,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/id/10449931-L.jpg',
    'Eric Jorgenson’s curated guide to Naval Ravikant’s thinking on wealth, specific knowledge, leverage, judgment, and happiness.'
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
  ('How does Naval distinguish wealth from status?', 'They are identical', 'Wealth is assets that earn while you sleep; status is zero-sum social rank', 'Status creates all wealth', 'Wealth is only cash in a wallet', 'B', 1),
  ('What is specific knowledge?', 'Whatever a standard school course teaches everyone', 'Unique, hard-to-train knowledge that feels like play to you', 'Memorizing trivia', 'Only credentials from elite schools', 'B', 2),
  ('Which leverage forms does Naval call more permissionless?', 'Only government jobs', 'Code and media', 'Only physical labor', 'Only inheritance', 'B', 3),
  ('Why is judgment so important in Naval’s framework?', 'Judgment never matters', 'Leverage amplifies decisions, so clear thinking becomes extremely valuable', 'Judgment replaces all skill', 'Only short-term thinking counts', 'B', 4),
  ('How does Naval frame happiness?', 'Only as buying more things', 'As a skill related to peace, presence, and managing desire — aided by meditation', 'As ignoring health', 'As winning status fights', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);

DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The One Thing');
DELETE FROM public.information WHERE title = 'The One Thing';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The One Thing',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
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
<p>Keller’s model also helps overwhelmed high performers who confuse activity with advancement. If your week was full but your lead domino never fell, you were busy in the wrong direction. Recalibrate without self-drama: rename the priority, rebuild the block, and begin again tomorrow.</p>
<p>Over a career, successive ONE Things become a legacy chain — skills stacked, relationships deepened, products shipped. Extraordinary is usually the visible tip of years of protected focus.</p>
<p><strong>Lesson:</strong> Stack focused days on a nested ONE Thing chain until successive dominoes create extraordinary outcomes.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781885167774-L.jpg',
    'Gary Keller’s focus classic: the Focusing Question, successive dominoes, time blocking, and going small to achieve big results.'
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
  ('What is Keller’s Focusing Question aimed at finding?', 'Every task on a long list', 'The one action that makes everything else easier or unnecessary', 'Only recreational hobbies', 'What others want you to do first', 'B', 1),
  ('What does ''go small'' mean in The One Thing?', 'Think tiny goals forever', 'Narrow focus to the highest-leverage priority to achieve big results', 'Avoid ambition', 'Do only easy tasks', 'B', 2),
  ('Why does Keller emphasize time blocking?', 'Schedules don’t matter', 'To protect a non-negotiable period for the ONE Thing before interruptions win', 'To fill the day with meetings', 'To multitask better', 'B', 3),
  ('What is the domino metaphor about?', 'Playing games at work', 'Lining up priorities so successive successes unlock larger outcomes', 'Knocking over competitors personally', 'Avoiding planning', 'B', 4),
  ('When should you typically do your ONE Thing, per Keller’s willpower view?', 'When completely exhausted', 'When willpower and energy are freshest — often early', 'Only on weekends', 'After all emails are zero', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
