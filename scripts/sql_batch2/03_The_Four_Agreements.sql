DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'The Four Agreements');
DELETE FROM public.information WHERE title = 'The Four Agreements';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'The Four Agreements',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
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
<p>A practical weekly review helps: Where did my word create harm? Where did I take bait personally? Where did I invent a story instead of asking? Where did I half-try and then prosecute myself? Each question points back to one agreement. Improvement is measured by faster recovery, not by never slipping.</p>
<p>Couples, teams, and families can adopt the agreements as shared norms. When everyone commits to clarity over assumption and dignity over gossip, conflict becomes cleaner. The agreements are personal vows first — and cultural upgrades second.</p>
<p><strong>Lesson:</strong> Practice all four agreements together, returning quickly when you break them.</p>',
    18,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg',
    'Don Miguel Ruiz’s Toltec-inspired code: be impeccable with your word, don’t take anything personally, don’t make assumptions, and always do your best.'
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
  ('What is the first agreement?', 'Always be right', 'Be impeccable with your word', 'Never speak', 'Win every argument', 'B', 1),
  ('What does ''don’t take anything personally'' mean?', 'Ignore all feedback forever', 'Others’ actions reflect them more than your worth', 'Never set boundaries', 'Agree with every insult', 'B', 2),
  ('How does Ruiz suggest you avoid assumptions?', 'Mind-read better', 'Ask questions and communicate clearly', 'Assume the worst always', 'Stay silent for years', 'B', 3),
  ('What is true of ''always do your best''?', 'Your best is identical every day', 'Your best changes with circumstances; sincerity matters', 'Only perfection counts', 'Best means outworking everyone', 'B', 4),
  ('In Ruiz’s framing, what does childhood ''domestication'' create?', 'Only practical skills', 'Unconscious fear-based agreements and inner judgment', 'Permanent freedom', 'Guaranteed success', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
