-- Auto-hide posts from the feed when 3+ distinct users have pending reports.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS hidden_from_feed boolean NOT NULL DEFAULT false;

ALTER TABLE public.daily_posts
  ADD COLUMN IF NOT EXISTS hidden_from_feed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_hidden_from_feed_idx
  ON public.posts (hidden_from_feed)
  WHERE hidden_from_feed = true;

CREATE INDEX IF NOT EXISTS daily_posts_hidden_from_feed_idx
  ON public.daily_posts (hidden_from_feed)
  WHERE hidden_from_feed = true;

-- One pending report per reporter per post (prevents single-user spam)
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_unique_reporter_post_pending
  ON public.content_reports (reporter_id, post_id, post_source)
  WHERE post_id IS NOT NULL
    AND post_source IS NOT NULL
    AND review_status = 'pending';

CREATE OR REPLACE FUNCTION public.sync_post_hidden_from_feed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
  target_source text;
  reporter_count integer;
  should_hide boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
    target_source := OLD.post_source;
  ELSE
    target_post_id := NEW.post_id;
    target_source := NEW.post_source;
  END IF;

  IF target_post_id IS NULL OR target_source IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(DISTINCT reporter_id)::integer INTO reporter_count
  FROM public.content_reports
  WHERE post_id = target_post_id
    AND post_source = target_source
    AND review_status = 'pending'
    AND reason IN ('inappropriate_photo', 'inappropriate_content');

  should_hide := reporter_count >= 3;

  IF target_source = 'posts' THEN
    UPDATE public.posts
    SET hidden_from_feed = should_hide
    WHERE id = target_post_id
      AND hidden_from_feed IS DISTINCT FROM should_hide;
  ELSIF target_source = 'daily_posts' THEN
    UPDATE public.daily_posts
    SET hidden_from_feed = should_hide
    WHERE id = target_post_id
      AND hidden_from_feed IS DISTINCT FROM should_hide;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_hidden_from_feed ON public.content_reports;
CREATE TRIGGER trg_sync_post_hidden_from_feed
AFTER INSERT OR UPDATE OF review_status OR DELETE
ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_hidden_from_feed();
