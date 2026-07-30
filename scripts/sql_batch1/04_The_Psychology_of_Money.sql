DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Psychology of Money');
DELETE FROM public.information WHERE title = 'The Psychology of Money';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Psychology of Money',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Behavior beats brilliance</h2>
<ul><li>Soft skills with money matter more than raw IQ or complex formulas.</li></ul>
<h2>2. Compounding needs time</h2>
<ul><li>Wealth often comes from good returns left uninterrupted for decades.</li></ul>
<h2>3. Getting vs staying wealthy</h2>
<ul><li>Optimism builds wealth; humility and caution help keep it.</li></ul>
<h2>4. Enough, margin, flexibility</h2>
<ul><li>Define enough, leave room for error, and save for control over your time.</li></ul>
<h1>PART 2 — THE PSYCHOLOGY OF MONEY</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Money is a behavior story</h3>
<p>Morgan Housel’s The Psychology of Money (2020) argues that financial success depends more on how you behave than on what you know. Brilliant people can go broke; ordinary savers can become wealthy. The difference is rarely a secret spreadsheet. It is temperament, patience, ego management, and the ability to stick with a plan.</p>
<p>Housel writes in short essays rather than a single theorem. The through-line is that money decisions are made by humans with histories, insecurities, and social pressures — not by calculators. Studying behavior is therefore not soft; it is the main event.</p>
<p>If you only optimize returns and ignore psychology, you design a strategy you will abandon under stress. The book’s invitation is to build a financial life you can actually live with.</p>
<p>Housel’s essays keep returning to a humble truth: financial outcomes are heavily influenced by luck, timing, and behavior under stress. Studying formulas without studying yourself leaves the largest variable unmanaged.</p>
<p>“Enough” is a psychological asset. Without it, every raise becomes the new baseline and every peer becomes a rival. With it, you can decline risks that exist only to feed ego or status anxiety.</p>
<p><strong>Lesson:</strong> Prioritize behavior and temperament with money over the pursuit of pure technical brilliance.</p>
<h3>Chapter 2: No one’s crazy — and compounding confounds</h3>
<p>Housel opens with empathy: no one’s crazy. Everyone’s views about money are shaped by personal history — inflation they lived through, jobs they lost, booms they witnessed. What looks irrational from the outside often makes sense inside someone’s lived experience.</p>
<p>Compounding is “confounding” because its power is easy to underestimate. Extraordinary outcomes often come less from the highest return this year and more from returns sustained without interruption for decades. Longevity in the game beats brilliant timing that you cannot stick with.</p>
<p>This reframes investing: the edge is often survival and consistency. Interrupt compounding with panic selling, leverage blowups, or lifestyle resets, and the math never gets to work.</p>
<p>“No one’s crazy” is an empathy tool and a caution. Before mocking another investor’s choices, remember their scar tissue differs from yours. Before copying a guru’s risk tolerance, remember their history, wealth, and obligations are not yours.</p>
<p>Room for error is how ordinary plans survive an extraordinary world. Markets, careers, and health do not follow your spreadsheet. Slack — cash, time, conservative assumptions — is what keeps compounding alive through surprises.</p>
<p><strong>Lesson:</strong> Respect that money views are personal — and protect long, uninterrupted compounding.</p>
<h3>Chapter 3: Getting wealthy vs staying wealthy</h3>
<p>Getting money and keeping money are different skills. Getting wealthy can require optimism, risk-taking, and boldness. Staying wealthy requires humility and a kind of paranoia about ruin — respect for what luck contributed and what a single bad decision can erase.</p>
<p>Housel emphasizes that survival matters more than maximization. A strategy with a small chance of catastrophic loss can be fatal even if the average outcome looks attractive. Staying in the game is the strategy.</p>
<p>This is why room for error and “enough” appear again and again. Ego says maximize. Survival says endure.</p>
<p>Compounding confounds because the big gains often arrive late. People quit strategies that are working slowly because the early years feel pointless. The investors who look like geniuses in hindsight are frequently the ones who simply did not interrupt the process.</p>
<p>Saving’s hidden return is control over your calendar. Money that buys options — to wait, retrain, leave a bad situation, support family — can matter more than money that buys another upgrade.</p>
<p><strong>Lesson:</strong> Use boldness to build wealth and humility — plus caution about ruin — to keep it.</p>
<h3>Chapter 4: Define “enough”</h3>
<p>Without a sense of enough, the goalposts move forever. Someone always has a nicer house, a hotter return, a more impressive lifestyle. If your happiness depends on beating a moving social target, risk-taking may never stop — and one unnecessary risk can undo years of progress.</p>
<p>Defining enough is not anti-ambition. It is anti-comparison as a bottomless hole. Enough creates the possibility of contentment and the ability to stop playing games that are no longer worth the downside.</p>
<p>Housel’s warning is psychological: social comparison and ego are expensive. Knowing enough protects you from decisions made to impress people you do not care about.</p>
<p>Getting wealthy can reward boldness; staying wealthy rewards paranoia about permanent loss. Housel’s pairing explains many blowups: someone brilliant at offense never learned defense, and one catastrophic mistake erased a lifetime of good ones.</p>
<p>Reasonable > rational is permission to design around human nature. A barbell of safety plus long-term ownership, or automatic saving you barely notice, may beat an optimal model that requires saintly discipline you do not have.</p>
<p><strong>Lesson:</strong> Define what “enough” means for you so goalposts stop moving and ego-driven risk loses its grip.</p>
<h3>Chapter 5: Room for error and the gap between plans and reality</h3>
<p>The most important part of a plan, Housel suggests, is planning on the plan not going according to plan. Room for error — a margin of safety — is what lets you survive surprises: job loss, market crashes, medical bills, bad timing.</p>
<p>Margin of safety is not pessimism; it is what allows optimism to compound. If every dollar is leveraged and every assumption must be correct, one shock ends the story. If you have slack, you can be wrong and still continue.</p>
<p>In practice this looks like lower leverage, cash buffers, diversified risk, and not needing the absolute maximum return to meet your goals.</p>
<p>“Enough” is a psychological asset. Without it, every raise becomes the new baseline and every peer becomes a rival. With it, you can decline risks that exist only to feed ego or status anxiety.</p>
<p>Housel’s essays keep returning to a humble truth: financial outcomes are heavily influenced by luck, timing, and behavior under stress. Studying formulas without studying yourself leaves the largest variable unmanaged.</p>
<p><strong>Lesson:</strong> Build a margin of safety so you can survive when plans go wrong and stay invested long enough to compound.</p>
<h3>Chapter 6: Saving for flexibility — and being reasonable</h3>
<p>Saving is often framed as delayed purchasing power. Housel adds a richer return: savings buy flexibility and control over your time. The ability to wait, to walk away, to take a breath — that optionality is one of money’s highest yields.</p>
<p>He also argues that reasonable beats rational. A theoretically optimal strategy you abandon in a panic is worse than a slightly suboptimal strategy you can stick with for decades. Your own psychology is a constraint; design around it.</p>
<p>The Psychology of Money’s closing mood is humility: history is full of surprises, luck plays a role, and the winners who endure are often those who stayed solvent, stayed patient, and stayed sane.</p>
<p>Room for error is how ordinary plans survive an extraordinary world. Markets, careers, and health do not follow your spreadsheet. Slack — cash, time, conservative assumptions — is what keeps compounding alive through surprises.</p>
<p>“No one’s crazy” is an empathy tool and a caution. Before mocking another investor’s choices, remember their scar tissue differs from yours. Before copying a guru’s risk tolerance, remember their history, wealth, and obligations are not yours.</p>
<p><strong>Lesson:</strong> Save for freedom over your time, and prefer a reasonable plan you can stick with over a perfect plan you will abandon.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
    'Morgan Housel’s essays on how behavior — not spreadsheets — drives financial outcomes: compounding, enough, room for error, and being reasonable.'
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
  ('What does Housel argue matters more than pure financial brilliance?', 'Secret stock tips', 'Behavior and temperament with money', 'Knowing every tax loophole on day one', 'Never saving', 'B', 1),
  ('Why is compounding ''confounding'' in Housel’s telling?', 'It only works for one year', 'Its power is easy to underestimate and requires long, uninterrupted time', 'It requires daily trading', 'It only applies to cash under a mattress', 'B', 2),
  ('What is ''room for error''?', 'Ignoring all risk', 'A margin of safety so you can survive when plans go wrong', 'Maxing leverage', 'Never investing', 'B', 3),
  ('What danger comes from never defining ''enough''?', 'You save too much automatically', 'Goalposts keep moving and risk-taking may never stop', 'You become too humble', 'Compounding speeds up too much', 'B', 4),
  ('According to Housel, what can saving buy beyond purchases?', 'Only status', 'Flexibility and control over your time', 'Guaranteed market timing', 'Freedom from all emotions', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
