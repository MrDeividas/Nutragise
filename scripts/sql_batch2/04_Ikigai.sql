DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Ikigai');
DELETE FROM public.information WHERE title = 'Ikigai';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Ikigai',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
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
<p>Ikigai is also a lens for midlife resets and retirement anxiety. Instead of asking only “What is my job?”, ask “What makes this week worth inhabiting?” The answer may be quieter than a brand, and more durable. Purpose that fits in an ordinary morning is purpose you can keep.</p>
<p><strong>Lesson:</strong> Assemble ikigai from love, skill, service, and sustainability — then keep adjusting as life seasons change.</p>',
    19,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg',
    'García and Miralles on the Japanese idea of ikigai — a reason for being — and habits linked to longevity, flow, and joyful purpose.'
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
  ('What does ikigai roughly mean?', 'A strict diet only', 'A reason for being / reason to get up', 'A type of martial art', 'A financial product', 'B', 1),
  ('What eating principle is associated with Okinawan longevity in the book?', 'Eat until painfully full', 'Hara hachi bu — stop around 80% full', 'Skip all vegetables', 'Only eat once a week', 'B', 2),
  ('How is flow related to ikigai?', 'Flow means constant stress', 'Absorbing challenge-skill balance reveals and fuels meaningful engagement', 'Flow requires doing nothing', 'Flow is only for athletes', 'B', 3),
  ('What do the authors suggest about retirement?', 'Stop all activity immediately', 'Stay active with purpose rather than abandoning contribution', 'Never leave a job', 'Purpose only exists at work', 'B', 4),
  ('Which is one of the ten rules of ikigai?', 'Fill every minute with hustle', 'Live in the moment / follow your ikigai', 'Avoid friends to stay focused', 'Never go outside', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
