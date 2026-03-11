# Meditation MP3 Upload Guide

## Where to Upload Meditation MP3 Files

### Option 1: Supabase Storage (Recommended for Production)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Create or Use Storage Bucket**
   - Go to **Storage** in the left sidebar
   - Create a new bucket called `meditation-audio` (or use existing `public` bucket)
   - Set bucket to **Public** if you want direct access via URL

3. **Upload MP3 Files**
   - Click on the bucket
   - Click **Upload file** or drag and drop
   - Upload your MP3 files (e.g., `gratitude-5min.mp3`)
   - Files will be accessible at: `https://[your-project].supabase.co/storage/v1/object/public/meditation-audio/gratitude-5min.mp3`

4. **Update MeditationScreen.tsx**
   - In the `meditationSessions` array, add the `audioUrl` property:
   ```typescript
   {
     id: '1',
     title: 'Gratitude',
     duration: '5 min',
     category: 'Mindfulness & Compassion',
     icon: 'heart-outline',
     audioUrl: 'https://[your-project].supabase.co/storage/v1/object/public/meditation-audio/gratitude-5min.mp3',
   }
   ```

### Option 2: Local Assets (For Development/Testing)

1. **Place MP3 in assets folder**
   - Add your MP3 file to: `assets/sounds/gratitude-5min.mp3`

2. **Import and use in code**
   ```typescript
   import gratitudeAudio from '../assets/sounds/gratitude-5min.mp3';
   
   {
     id: '1',
     title: 'Gratitude',
     duration: '5 min',
     category: 'Mindfulness & Compassion',
     icon: 'heart-outline',
     audioUrl: gratitudeAudio, // Local asset
   }
   ```

### Option 3: CDN or External Hosting

- Upload to any CDN (Cloudflare, AWS S3, etc.)
- Use the public URL in the `audioUrl` field

## Recommended Storage Structure

```
Supabase Storage Bucket: meditation-audio/
├── gratitude-5min.mp3
├── calm-10min.mp3
├── focus-8min.mp3
├── grow-12min.mp3
└── connect-15min.mp3
```

## File Naming Convention

Use descriptive names:
- `gratitude-5min.mp3`
- `calm-10min.mp3`
- `focus-8min.mp3`

## Next Steps

1. Upload your `gratitude-5min.mp3` file to Supabase Storage
2. Copy the public URL
3. Update the `audioUrl` in `MeditationScreen.tsx` for the Gratitude meditation session
