# Test Upload Screen

This test screen is designed to debug image upload issues and isolate the 403 RLS error.

## How to Use

1. **Navigate to the test screen**: 
   - Go to Profile tab
   - Tap the red bug icon (🐛) in the top right corner

2. **Test Steps**:
   - **Pick Image**: Select an image from your gallery
   - **Test Auth Status**: Check if authentication is working properly
   - **Test Database Only**: Test inserting a record without image upload
   - **Test Full Upload**: Test the complete upload process (image + database)

3. **Debug Logs**: 
   - All actions are logged with timestamps
   - Check the logs section for detailed error information
   - Use "Clear Logs" to reset the log display

## What to Look For

- **403 RLS Error**: If you see this, it means Row Level Security is blocking the operation
- **Authentication Issues**: Check if the user ID matches between auth and your app
- **Storage Errors**: Check if the Supabase storage bucket exists and has proper permissions
- **Database Errors**: Check if foreign key constraints are working

## Expected Behavior

- **Auth Status**: Should show your user ID and email
- **Database Only**: Should insert a test record successfully
- **Full Upload**: Should upload image to storage and save record to database

## Common Issues

1. **Foreign Key Constraints**: Tables referencing `auth.users` instead of `public.users`
2. **Missing Permissions**: Database tables not granting access to authenticated users
3. **Storage Bucket**: `progress-photos` bucket might not exist or have wrong permissions
4. **RLS Policies**: Overly restrictive policies blocking legitimate operations

## Next Steps

After running the tests, share the debug logs to identify the exact point of failure. 