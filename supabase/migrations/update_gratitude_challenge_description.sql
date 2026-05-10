-- Clarify Gratitude challenge: paper + photo upload (About + requirements copy).

UPDATE challenges
SET description = 'Name one thing you''re grateful for every day. Training your brain to notice the good is one of the most powerful habits you can build. Requirement: write it on a piece of paper, take a photo of what you wrote, and upload that picture as your daily proof.'
WHERE title = 'Gratitude';

UPDATE challenge_requirements
SET requirement_text = 'Write one thing you''re grateful for on paper each day, photograph it, and upload the photo — 7 days required to pass.'
WHERE challenge_id IN (SELECT id FROM challenges WHERE title = 'Gratitude');
