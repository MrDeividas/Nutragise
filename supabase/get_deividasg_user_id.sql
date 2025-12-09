-- Get user ID for deividasg
SELECT id, username, display_name
FROM profiles
WHERE username ILIKE '%deividasg%'
LIMIT 1;

