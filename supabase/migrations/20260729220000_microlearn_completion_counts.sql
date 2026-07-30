-- Public aggregate of microlearn engagement (no user identities exposed).
-- Used to rank "Trending" books in the library carousel.

CREATE OR REPLACE FUNCTION public.get_microlearn_completion_counts()
RETURNS TABLE (information_id uuid, completion_count bigint, start_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.information_id,
    COUNT(*) FILTER (WHERE up.completed = true)::bigint AS completion_count,
    COUNT(*)::bigint AS start_count
  FROM public.user_progress up
  GROUP BY up.information_id;
$$;

REVOKE ALL ON FUNCTION public.get_microlearn_completion_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_microlearn_completion_counts() TO anon, authenticated;

COMMENT ON FUNCTION public.get_microlearn_completion_counts() IS
  'Returns start/completion counts per information item for trending microlearn ranking.';
