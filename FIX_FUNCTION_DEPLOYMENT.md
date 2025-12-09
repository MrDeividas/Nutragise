# Fix: Function Deployment Error

## The Problem

Error: `Entrypoint path does not exist - /tmp/user_fn_.../source/index.ts`

This means Supabase is looking for a file called `index.ts` but can't find it.

## Solution

When creating a function in Supabase Dashboard:

### Option 1: Make sure index.ts exists

1. After clicking **Create function**, look at the **left sidebar** (file explorer)
2. You should see a file called `index.ts`
3. If you DON'T see it:
   - Click the **+** button (or **New File** button)
   - Name it exactly: `index.ts`
   - Click on it to open in the editor
4. Paste your code into this `index.ts` file
5. Click **Deploy**

### Option 2: Delete and recreate

If the function was created incorrectly:

1. Go to Edge Functions
2. Find the function that failed
3. Click the **three dots** (⋯) menu
4. Click **Delete function**
5. Create it again, making sure `index.ts` exists before pasting code

### Option 3: Use the file structure

Some Supabase dashboards require a specific structure:

1. Create function: `create-payment-intent`
2. In the file explorer, you should see:
   ```
   create-payment-intent/
     └── index.ts
   ```
3. If the structure is different, create `index.ts` manually
4. Paste code into `index.ts`
5. Deploy

## Quick Fix Steps

1. **Open the function** in Supabase Dashboard
2. **Check left sidebar** - do you see `index.ts`?
3. **If NO**: Click **+** → Create `index.ts` → Paste code
4. **If YES**: Click on `index.ts` → Delete all code → Paste new code
5. **Click Deploy**

## Still Not Working?

Try this alternative approach:

1. Delete the function completely
2. Create a new function with a different name (e.g., `create-payment-intent-v2`)
3. Make absolutely sure `index.ts` exists in the file tree
4. Paste code
5. Deploy
6. If it works, delete the old broken one

The key is: **Supabase MUST have a file called `index.ts` in the function directory**

