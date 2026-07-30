ALTER TABLE public.information
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS short_description text;

UPDATE public.information
SET
  cover_image_url = COALESCE(cover_image_url, 'https://images-na.ssl-images-amazon.com/images/I/81bsw6fnUiL.jpg'),
  short_description = COALESCE(
    short_description,
    'A guide to financial literacy and wealth building — the principles that separate assets from liabilities and how to make money work for you.'
  )
WHERE title = 'Rich Dad Poor Dad';
