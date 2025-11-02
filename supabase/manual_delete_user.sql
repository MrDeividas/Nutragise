-- Manual User Deletion Script
-- This script deletes all related records for a user before deleting the user
-- Replace 'USER_ID_HERE' with the actual user ID you want to delete

DO $$
DECLARE
    target_user_id UUID := 'USER_ID_HERE'; -- Replace with actual user ID
BEGIN
    -- Delete user's storage files (photos)
    DELETE FROM storage.objects 
    WHERE bucket_id = 'users' 
    AND (storage.foldername(name))[1] = target_user_id::text;
    
    -- Delete in reverse dependency order (child tables first, then parent tables)
    
    -- Delete challenge submissions
    DELETE FROM challenge_submissions WHERE user_id = target_user_id;
    
    -- Delete challenge participants
    DELETE FROM challenge_participants WHERE user_id = target_user_id;
    
    -- Delete challenge host records (optional - might want to transfer ownership instead)
    -- DELETE FROM challenges WHERE host_id = target_user_id;
    
    -- Delete progress photos
    DELETE FROM progress_photos WHERE user_id = target_user_id;
    
    -- Delete daily posts
    DELETE FROM daily_posts WHERE user_id = target_user_id;
    
    -- Delete posts
    DELETE FROM posts WHERE user_id = target_user_id;
    
    -- Delete goals
    DELETE FROM goals WHERE user_id = target_user_id;
    
    -- Delete follow relationships
    DELETE FROM follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    
    -- Delete notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    -- Delete direct messages (both sent and received)
    DELETE FROM direct_messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
    
    -- Delete profile (references auth.users)
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Delete user record (references auth.users)
    DELETE FROM users WHERE id = target_user_id;
    
    -- Finally, delete from auth.users (this is what Supabase dashboard does)
    -- Note: You might need to do this through Supabase Admin API or dashboard
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'User % and all related records deleted successfully', target_user_id;
END $$;

