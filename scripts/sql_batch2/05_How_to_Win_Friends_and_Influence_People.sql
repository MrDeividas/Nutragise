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
