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
