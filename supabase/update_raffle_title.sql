-- Update existing raffle title to "Treat your hard work"
UPDATE raffles 
SET title = 'Treat your hard work'
WHERE title = 'January £150 Giveaway' OR title LIKE '%£150%Giveaway%';

