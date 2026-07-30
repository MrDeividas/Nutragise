DELETE FROM public.questions WHERE information_id IN (SELECT id FROM public.information WHERE title = 'Meditations');
DELETE FROM public.information WHERE title = 'Meditations';
WITH inserted AS (
  INSERT INTO public.information (
    title, content_text, duration_minutes, category, difficulty_level,
    points_reward, is_active, cover_image_url, short_description
  )
  VALUES (
    'Meditations',
    '<h1>PART 1 — KEY LESSONS (OUTLINE)</h1>
<h2>1. Dichotomy of control</h2>
<ul><li>Focus on judgments and actions; release outcomes.</li></ul>
<h2>2. Mortality clarity</h2>
<ul><li>Memento mori sharpens priorities.</li></ul>
<h2>3. Virtue as the good</h2>
<ul><li>Justice, courage, wisdom, temperance.</li></ul>
<h2>4. Cosmopolitan duty</h2>
<ul><li>Serve the whole; avoid ego theater.</li></ul>
<h2>5. Accept nature’s course</h2>
<ul><li>Amor fati — meet events without melodrama.</li></ul>
<h1>PART 2 — MEDITATIONS</h1>
<h2>A 27-Minute Read Summary</h2>
<h3>Chapter 1: A private notebook for a public life</h3>
<p>Marcus Aurelius wrote Meditations as personal notes, not a book for fame. That origin matters: these are reminders a busy emperor used to stay sane amid war, plague, politics, and duty. The practicality is the point.</p>
<p>Stoicism here is not emotionlessness. It is training judgment so desire and aversion do not own you. Feelings arise; assent and action can be chosen.</p>
<p>Readers often expect quotes as posters. Better to treat Meditations as a mirror for daily conduct under pressure.</p>
<p>Marcus repeats himself because practice requires repetition. Do not demand novelty; demand sincerity.</p>
<p>Read slowly. One short section lived beats twenty skimmed.</p>
<p>Keep your own meditations — five lines nightly on where you lived or missed your principles.</p>
<p><strong>Lesson:</strong> Use Meditations as a personal practice mirror, not as poster quotes.</p>
<h3>Chapter 2: What is up to you</h3>
<p>The dichotomy of control: some things are up to you — judgments, intentions, choices — and many are not — others’ minds, weather, markets, mortality timing. Peace begins by investing care where agency lives.</p>
<p>You can control whether you speak truthfully; not whether everyone likes it. Train the first; stop bargaining with the second.</p>
<p>Anxiety often comes from gripping outcomes as if they were reins. Marcus returns the reins to character.</p>
<p>Morning preview: what is mine today? Evening review: where did I waste energy on the unownable?</p>
<p>This is not passivity. Action intensifies inside your sphere. Outside it, acceptance.</p>
<p>When interrupted, ask: is my virtue still available? Usually yes.</p>
<p><strong>Lesson:</strong> Invest effort in judgments and actions — release what is not yours to control.</p>
<h3>Chapter 3: Death as advisor</h3>
<p>Memento mori in Marcus is not gothic depression. Mortality awareness prioritizes what matters and shrinks petty feuds. You will die; so will your critics; so act with justice now.</p>
<p>Remembering finitude reduces endless delay. The work and the repair cannot wait for perfect mood.</p>
<p>Grief remains human. Stoicism asks for honest feeling without surrendering a life of contribution.</p>
<p>Practice: when annoyed by trivial slight, ask whether this will matter on your deathbed.</p>
<p>Use limited time to serve your roles — parent, citizen, craftsperson — excellently.</p>
<p>Do not weaponize death talk to bully others; use it to humble yourself.</p>
<p><strong>Lesson:</strong> Let mortality clarify priorities and shrink petty conflicts.</p>
<h3>Chapter 4: Virtue is enough</h3>
<p>For Stoics, virtue — wisdom, courage, justice, temperance — is the good. Externals like wealth and fame are preferred or dispreferred indifferents: usable, not ultimate.</p>
<p>Marcus holds office power yet drills himself not to make purple robes his identity. Character is the throne that matters.</p>
<p>When you lose an external, virtue remains actionable. That is the bet.</p>
<p>Temperance in food, speech, and attention is daily sanding of the self.</p>
<p>Justice shows in how you treat the rude and the powerless when you could get away with less.</p>
<p>Courage includes facing your own excuses.</p>
<p><strong>Lesson:</strong> Treat virtue as the true good — use externals without worshipping them.</p>
<h3>Chapter 5: People will be difficult</h3>
<p>Marcus reminds himself daily that he will meet the selfish, the ignorant, the angry. Expecting a frictionless social world breeds rage. Expecting humans breeds patience.</p>
<p>This does not require remaining in abuse. Boundaries can be just. The training is emotional — refuse to add your own injustice to theirs.</p>
<p>See others as parts of the same whole. Contempt for the body politic becomes contempt for yourself in another form.</p>
<p>When wronged, choose responses that keep you proud at day’s end.</p>
<p>Curiosity softens snap judgments: what pain or story drives this person?</p>
<p>Still leave rooms that demand you abandon virtue.</p>
<p><strong>Lesson:</strong> Expect difficult people — respond with justice, not matching injustice.</p>
<h3>Chapter 6: Cooperate with nature</h3>
<p>Living according to nature, for Marcus, includes accepting cosmic order and human social nature. Resist less against what must be; labor more for what should be.</p>
<p>Amor fati: meet events as raw material for excellence. Not celebrating harm, but refusing to be ruined by refusal of reality.</p>
<p>Obstacle becomes pathway for the practiced will — later Stoic phrasing captures Marcus’s drills.</p>
<p>Illness, delay, insult — ask what virtue they summon.</p>
<p>Nature also means your limits: sleep, hunger, aging. Respect them without self-disgust.</p>
<p>Align plans with reality’s grain; stop demand that the grain reverse.</p>
<p><strong>Lesson:</strong> Accept reality’s grain and use obstacles as raw material for virtue.</p>
<h3>Chapter 7: Attention is moral</h3>
<p>Where attention goes, character follows. Marcus polices impressions — the first takes of events — before they harden into stories that compel foolish acts.</p>
<p>Pause between stimulus and assent. That pause is freedom.</p>
<p>Modern feeds assault attention. A Marcus practice today includes guarding inputs as moral hygiene.</p>
<p>When strong impression arrives, describe it neutrally first: ''I am seeing a slight,'' not ''I am being destroyed.''</p>
<p>Meditation and journaling support this ancient cognitive move.</p>
<p>Choose worthy objects of attention: duties, learning, love.</p>
<p><strong>Lesson:</strong> Guard attention and pause before assenting to heated impressions.</p>
<h3>Chapter 8: Roles and duty</h3>
<p>Marcus held nested roles: human, Roman, emperor, family member. Excellence meant playing roles justly, not chasing whims. Duty anchors freedom.</p>
<p>Your roles differ; the structure helps. List roles and one next right action for each.</p>
<p>Avoid role confusion: social media celebrity is not a Stoic role worth dying for.</p>
<p>When roles conflict, weigh justice and the whole.</p>
<p>Duty to self includes stewardship of body and mind so you can serve.</p>
<p>Rest can be duty; collapse from performative toughness helps no one.</p>
<p><strong>Lesson:</strong> Play your real roles justly — duty directs freedom better than whim.</p>
<h3>Chapter 9: Anger is expensive</h3>
<p>Marcus works against anger because it damages the angrier party’s clarity and justice. Anger promises power and delivers slavery to whoever triggered you.</p>
<p>Delay response when hot. Seek facts. Prefer repair and prevention to revenge theater.</p>
<p>Forgiveness here is strategic clarity, not forced sentimentality.</p>
<p>If anger signals a boundary need, translate it into a calm request or exit.</p>
<p>Track anger triggers weekly; design fewer collisions.</p>
<p>Model calm under provocation for people who watch you.</p>
<p><strong>Lesson:</strong> Treat anger as expensive — delay, clarify, then choose a just response.</p>
<h3>Chapter 10: Simplicity and enough</h3>
<p>Imperial luxury surrounds Marcus; he coaches himself toward simplicity — enough food, enough sleep, plain motives. Excess is a distraction tax.</p>
<p>Enough is a practiced concept. Without it, desire expands forever.</p>
<p>Audit possessions and obligations for silence and focus.</p>
<p>Simplicity pairs with generosity: having enough includes sharing.</p>
<p>Spectacle addiction is old; Marcus’s warnings map neatly onto modern feeds.</p>
<p>Choose one luxury to downgrade this month and notice freed attention.</p>
<p><strong>Lesson:</strong> Practice enough — simplicity protects attention for virtue and duty.</p>
<h3>Chapter 11: Cooperate, then let go</h3>
<p>Act fully; release outcomes. The archer metaphor from Stoic tradition fits Marcus’s ethos: aim well, release the arrow, accept wind.</p>
<p>Modern knowledge work obsesses over outcomes dashboards. Keep them, but judge your days by process virtue too.</p>
<p>After honest effort, rumination is stolen life.</p>
<p>Team sports teach the same: control your role assignments.</p>
<p>Evening question: did I aim well? Not only: did the scoreboard obey me?</p>
<p>Teach children process pride early.</p>
<p><strong>Lesson:</strong> Aim and act fully, then release outcomes you never fully owned.</p>
<h3>Chapter 12: Return again to principles</h3>
<p>Marcus repeats because he fails and returns. That is the human loop. Meditations invites you into the same loop without self-hatred.</p>
<p>Keep short maxims you actually use under stress.</p>
<p>Community helps: discuss Stoic practice with friends who will not turn it into aesthetic cosplay.</p>
<p>When you fall, begin again immediately — the next impression is a new chance.</p>
<p>Reread Meditations annually through different life seasons; different lines land.</p>
<p>Tonight write three lines: what I controlled poorly, what I can still do justly before sleep, what I release.</p>
<p><strong>Lesson:</strong> Fail, return, repeat — keep short principles alive under stress.</p>
<h3>Application Lab 1: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 2: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 3: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 4: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 5: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 6: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 7: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 8: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 9: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 10: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 11: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 12: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 13: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 14: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>

<h3>Application Lab 15: Meditations</h3>
<p>Reading creates familiarity; labs create proof. For the next seven days, choose one concrete behavior that expresses a core idea from Meditations. Write the behavior as a verb phrase you can check yes or no. Keep it smaller than ego wants and more consistent than mood wants.</p>
<p>Create environmental support. Put tools in reach and temptations farther away. Tell one ally what you are training and when they should ask you about it. Prepare a miss protocol: if you skip a day, restart within twenty-four hours without a courtroom in your head. Shame is a poor coach; schedules are better coaches.</p>
<p>Midweek, raise clarity not intensity. Redefine the behavior if it was vague. Vague intentions hide avoidance. Capture friction notes: what time failed, which people triggered old patterns, which stories justified delay. Friction notes become next week’s system upgrades.</p>
<p>At week’s end, write a half-page memo: what changed in skill, identity, or relationships; what remains hard; what you will continue for fourteen more days. Continuity beats novelty. Reread one chapter that addresses your biggest miss and underline only action sentences.</p>
<p>Share one lesson with a teammate without preaching. Teaching consolidates memory and turns private growth into culture. Over a quarter, stacked labs outperform one emotional binge of inspiration. Schedule the next lab on the calendar like a meeting with someone you respect — future-you.</p>
<p><strong>Lesson:</strong> Convert the book into weekly yes/no behaviors, ally check-ins, and short end-of-week memos.</p>
',
    27,
    'Books',
    'beginner',
    1,
    true,
    'https://covers.openlibrary.org/b/isbn/9780140449334-L.jpg',
    'Marcus Aurelius’ private Stoic reflections on virtue, control, mortality, and living in accordance with nature.'
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
  ('What is the dichotomy of control?', 'Control other people first', 'Focus on your judgments and actions; release what is not up to you', 'Ignore all duties', 'Never feel emotion', 'B', 1),
  ('How does Marcus use mortality?', 'To justify cruelty', 'To clarify priorities and shrink pettiness', 'To avoid all action', 'To chase more fame', 'B', 2),
  ('What is the Stoic ''good'' emphasized here?', 'Wealth and purple robes', 'Virtue — wisdom, courage, justice, temperance', 'Never speaking', 'Winning arguments online', 'B', 3),
  ('How should you meet difficult people according to these notes?', 'With matching injustice', 'With expected patience and just responses — without abandoning boundaries', 'By pretending everyone is kind', 'By never leaving bad rooms', 'B', 4),
  ('What practice fits Meditations best?', 'Skim posters only', 'Daily reflection returning to principles after failing', 'One-time motivational binge', 'Avoid self-examination', 'B', 5)
) AS q(question_text, option_a, option_b, option_c, option_d, correct_answer, question_order);
