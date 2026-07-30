DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Mindset');
DELETE FROM public.information WHERE title = 'Mindset';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Mindset',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Two mindsets</h2>
<ul><li>Fixed: abilities are carved in stone. Growth: abilities can be developed.</li></ul>
<h2>2. Mindset changes meaning</h2>
<ul><li>Effort, failure, and challenge look different under each belief.</li></ul>
<h2>3. Praise and learning</h2>
<ul><li>Process praise supports growth; talent-only praise can fuel fixed thinking.</li></ul>
<h2>4. False growth mindset</h2>
<ul><li>Real growth needs strategies and feedback — not empty “try harder” talk.</li></ul>
<h1>PART 2 — MINDSET</h1>
<h2>A 20-Minute Read Summary</h2>
<h3>Chapter 1: Beliefs that shape success</h3>
<p>Carol S. Dweck’s Mindset popularizes decades of research on implicit theories of intelligence: the fixed mindset versus the growth mindset. A fixed mindset treats qualities like intelligence and talent as largely static. A growth mindset treats them as cultivable through effort, strategies, and learning from others.</p>
<p>These beliefs are not just opinions; they become meaning systems. They change how you interpret challenge, effort, setbacks, and other people’s success. The same event — a hard test, a rejected proposal — can feel like a verdict or like information depending on mindset.</p>
<p>Dweck’s work spans classrooms, sports, business, and relationships. The unifying claim: the view you adopt for yourself profoundly affects the way you lead your life.</p>
<p>Dweck’s research reframes success psychology: it is not only talent and opportunity, but the meaning you assign to effort and struggle. Two students with equal ability can diverge because one treats difficulty as indictment and the other as instruction.</p>
<p>Process praise works because it points people toward controllable inputs. “You worked through that the hard way and adjusted your approach” teaches a repeatable method. “You’re a genius” teaches a label that tomorrow’s struggle can shatter.</p>
<p><strong>Lesson:</strong> Notice that your theory of ability — fixed or growth — quietly scripts how you respond to challenge.</p>
<h3>Chapter 2: The fixed mindset</h3>
<p>If you believe talent is static, you often need to prove yourself repeatedly. Challenges threaten identity because struggle can look like evidence you lack the gift. Effort can feel shameful — “If I were truly smart, I wouldn’t have to try.” Failure looks like a permanent label.</p>
<p>Fixed-mindset logic pushes people toward safer tasks where success is likely, away from stretches that risk exposure. Feedback feels like judgment. Other people’s success becomes a threat rather than a lesson.</p>
<p>None of this means fixed-mindset people lack ambition. It means ambition is tangled with proving and protecting an image of ability.</p>
<p>Fixed mindset creates a urgency to look talented now. That urgency makes shortcuts, cheating, blame, and safe goals more tempting. The self-image of being “the smart one” becomes a fragile asset that must be defended.</p>
<p>Organizations leak mindset. If leaders punish intelligent risks and only reward flawless outcomes, employees hide errors and stop innovating — regardless of posters about learning culture.</p>
<p><strong>Lesson:</strong> See how a fixed mindset turns challenges into threats and effort into a supposed sign of inadequate talent.</p>
<h3>Chapter 3: The growth mindset</h3>
<p>If you believe abilities can be developed, challenges become opportunities to improve. Effort is the path to mastery, not a shameful signal. Setbacks hurt, but they point to strategies still missing rather than to a final identity sentence.</p>
<p>Growth-minded people still care about winning and looking capable — but learning is allowed to matter more than immediate perfection. Asking for help is a tactic, not a confession of deficiency.</p>
<p>Importantly, growth mindset is not the belief that anyone can become anything with zero constraints. It is the belief that you do not know your limits in advance, and that improvement is possible with the right work.</p>
<p>Growth mindset creates permission to be a beginner repeatedly. Careers, arts, and relationships all require seasons of awkward incompetence. If awkwardness is intolerable, learning stalls.</p>
<p>False growth mindset is sneaky: it uses growth language as a brand while still ranking people as permanently gifted or not. Or it praises effort blindly while students spin their wheels without new strategies.</p>
<p><strong>Lesson:</strong> Treat abilities as developable through effort, strategies, and learning — so challenge becomes useful.</p>
<h3>Chapter 4: Failure, feedback, and the meaning of effort</h3>
<p>In a growth mindset, failure is painful but informative — a problem to work on. In a fixed mindset, failure can feel like an identity crisis, so people may avoid hard tasks that risk exposure or may hide deficiencies instead of repairing them.</p>
<p>Effort’s meaning flips too. Fixed: effort means you lack talent. Growth: effort is what activates talent. That flip changes whether you persist when something gets hard.</p>
<p>Feedback follows the same split. Growth seekers want accurate information even when it stings. Fixed protectors may dismiss, avoid, or personalize feedback to keep the self-image intact.</p>
<p>Failure’s interpretation is the fork in the road. Fixed: I failed, therefore I am a failure. Growth: I failed, therefore my strategy, preparation, or skill still needs work. Same event; different next chapter.</p>
<p>Changing mindset starts with awareness of triggers — defensiveness, comparison spikes, concealment — then a deliberate script: “I’m not there yet.” The word yet is small and powerful: it keeps the future open.</p>
<p><strong>Lesson:</strong> Reframe failure as useful information and effort as the path to mastery, not as shame.</p>
<h3>Chapter 5: Praise, parenting, and leadership cues</h3>
<p>Dweck’s research cautions that praising innate smartness can push fixed thinking: children (and adults) may avoid challenges that could disprove the “smart” label. Process-focused feedback — strategies, practice, persistence, and adjustment — better supports growth.</p>
<p>Leaders and teachers send mindset cues constantly: Do we celebrate only flawless outcomes, or also intelligent experiments? Do we treat struggle as normal in learning, or as embarrassment?</p>
<p>The implication is cultural, not just personal. Environments can pull people toward fixed or growth responses regardless of what posters on the wall say.</p>
<p>Process praise works because it points people toward controllable inputs. “You worked through that the hard way and adjusted your approach” teaches a repeatable method. “You’re a genius” teaches a label that tomorrow’s struggle can shatter.</p>
<p>Dweck’s research reframes success psychology: it is not only talent and opportunity, but the meaning you assign to effort and struggle. Two students with equal ability can diverge because one treats difficulty as indictment and the other as instruction.</p>
<p><strong>Lesson:</strong> Praise process — strategies, practice, persistence — rather than labeling people as innately smart or not.</p>
<h3>Chapter 6: False growth mindset — and changing beliefs</h3>
<p>Dweck has warned about a “false growth mindset”: saying growth words while still judging talent in fixed ways, or praising effort alone without teaching better strategies. “Just try harder” without skill-building is incomplete. Real growth mindset includes seeking effective methods, honest feedback, and learning from setbacks.</p>
<p>Mindsets can change. Believing they can is part of the point. Notice fixed-mindset triggers — defensiveness, comparison panic, urge to hide mistakes — then consciously reframe: This is hard, which means I’m at the edge of learning.</p>
<p>Mindset is not a pep talk. It is a trainable meaning system about what effort and failure say about you.</p>
<p>Organizations leak mindset. If leaders punish intelligent risks and only reward flawless outcomes, employees hide errors and stop innovating — regardless of posters about learning culture.</p>
<p>Fixed mindset creates a urgency to look talented now. That urgency makes shortcuts, cheating, blame, and safe goals more tempting. The self-image of being “the smart one” becomes a fragile asset that must be defended.</p>
<p><strong>Lesson:</strong> Avoid empty effort-praise; pair growth beliefs with real strategies, feedback, and honest learning.</p>',
    20,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780345472328-L.jpg',
    'Carol Dweck’s research on fixed vs growth mindset — how beliefs about ability shape challenge-seeking, effort, failure, praise, and resilience.'
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
  ('What is a fixed mindset?', 'Belief that abilities can always grow', 'Belief that qualities like intelligence are largely static', 'Belief that effort never matters for anyone', 'Belief that feedback is always wrong', 'B', 1),
  ('What is a growth mindset?', 'Avoiding all challenges', 'Belief that abilities can be developed through effort, strategies, and learning', 'Only caring about talent labels', 'Never practicing', 'B', 2),
  ('How does a growth mindset typically view failure?', 'As a permanent identity verdict', 'As painful but useful information for improvement', 'As proof you should quit forever', 'As unrelated to learning', 'B', 3),
  ('What kind of praise better supports growth, according to Dweck’s research themes?', 'Only praising innate smartness', 'Praising process: strategies, practice, and persistence', 'Never giving feedback', 'Praising only final rankings', 'B', 4),
  ('What is a risk of a ''false'' growth mindset?', 'Reading books', 'Praising effort alone without better strategies and real learning', 'Sleeping enough', 'Asking for help', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
