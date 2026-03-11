# Debugging Meditation Audio Loading Error

## Error: -1008 NSURLErrorDomain

This error typically means the audio file URL is not accessible. Follow these steps:

## Step 1: Verify File Upload

1. Go to Supabase Dashboard → Storage → `meditation-audio` bucket
2. Check that `gratitude-5min.mp3` exists
3. **Important**: Note the EXACT filename (case-sensitive)
   - Is it `gratitude-5min.mp3`?
   - Or `Gratitude-5min.mp3`?
   - Or something else?

## Step 2: Verify Bucket Permissions

1. In Supabase Dashboard → Storage → `meditation-audio`
2. Click on the bucket settings
3. Ensure **Public bucket** is enabled
4. If not public, enable it

## Step 3: Get the Correct URL

1. In Supabase Dashboard → Storage → `meditation-audio`
2. Click on your MP3 file
3. Copy the **Public URL** shown
4. It should look like: `https://[project].supabase.co/storage/v1/object/public/meditation-audio/gratitude-5min.mp3`

## Step 4: Test the URL

1. Open the URL in a web browser
2. It should download or play the MP3 file
3. If it doesn't work, the bucket isn't public or the file path is wrong

## Step 5: Update the Code

If your filename is different, update `screens/MeditationScreen.tsx`:

```typescript
audioUrl: getMeditationAudioUrl('YOUR-EXACT-FILENAME.mp3'),
```

## Step 6: Alternative - Use Direct URL

If the `getPublicUrl` method isn't working, you can hardcode the URL temporarily:

In `screens/MeditationScreen.tsx`, replace:
```typescript
audioUrl: getMeditationAudioUrl('gratitude-5min.mp3'),
```

With:
```typescript
audioUrl: 'https://[your-project].supabase.co/storage/v1/object/public/meditation-audio/gratitude-5min.mp3',
```

## Common Issues

1. **Filename mismatch**: File is `Gratitude-5min.mp3` but code looks for `gratitude-5min.mp3`
2. **Bucket not public**: Storage bucket must be set to Public
3. **Wrong bucket name**: Should be exactly `meditation-audio`
4. **File not uploaded**: File doesn't exist in the bucket

## Quick Fix

If you want to test quickly, you can:
1. Copy the public URL from Supabase Dashboard
2. Temporarily hardcode it in the code
3. Test if it works
4. If it works, the issue is with the `getPublicUrl` method or filename
