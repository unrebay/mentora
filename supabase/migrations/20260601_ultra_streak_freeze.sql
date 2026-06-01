-- Ultra perk: streak auto-freeze (Duolingo-style).
-- Backward-compatible: p_freeze_enabled defaults to false, so existing
-- (main/prod) callers that pass only 3 args are unaffected.

-- 1) Columns for freeze affirmation + streak-saver dedupe.
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS last_freeze_at timestamptz;
ALTER TABLE public.users         ADD COLUMN IF NOT EXISTS streak_saver_sent_at timestamptz;

-- 2) Replace increment_xp with a 4-arg version (drop the old 3-arg to avoid overload ambiguity).
DROP FUNCTION IF EXISTS public.increment_xp(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.increment_xp(
  p_user_id uuid,
  p_subject text,
  p_amount integer DEFAULT 10,
  p_freeze_enabled boolean DEFAULT false
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_new_xp     INTEGER;
  v_new_streak INTEGER;
  v_total_xp   INTEGER;
BEGIN
  -- EXECUTE granted only to 'authenticated'; route validates via auth.getUser().

  INSERT INTO public.user_progress (user_id, subject, xp_total, streak_days, best_streak, last_active_at)
  VALUES (p_user_id, p_subject, p_amount, 1, 1, now())
  ON CONFLICT (user_id, subject)
  DO UPDATE SET
    xp_total       = public.user_progress.xp_total + p_amount,
    last_active_at = now(),
    streak_days    = CASE
      WHEN public.user_progress.last_active_at::date = current_date - 1
        THEN public.user_progress.streak_days + 1
      WHEN public.user_progress.last_active_at::date = current_date
        THEN public.user_progress.streak_days
      -- Ultra auto-freeze: exactly one missed day → streak survives.
      WHEN p_freeze_enabled AND public.user_progress.last_active_at::date = current_date - 2
        THEN public.user_progress.streak_days + 1
      ELSE 1
    END,
    -- Record when a freeze was used (for "Ultra saved your streak" affirmation).
    last_freeze_at = CASE
      WHEN p_freeze_enabled AND public.user_progress.last_active_at::date = current_date - 2
        THEN now()
      ELSE public.user_progress.last_freeze_at
    END,
    best_streak    = GREATEST(
      COALESCE(public.user_progress.best_streak, 0),
      CASE
        WHEN public.user_progress.last_active_at::date = current_date - 1
          THEN public.user_progress.streak_days + 1
        WHEN public.user_progress.last_active_at::date = current_date
          THEN public.user_progress.streak_days
        WHEN p_freeze_enabled AND public.user_progress.last_active_at::date = current_date - 2
          THEN public.user_progress.streak_days + 1
        ELSE 1
      END
    );

  SELECT xp_total, streak_days
  INTO v_new_xp, v_new_streak
  FROM public.user_progress
  WHERE user_id = p_user_id AND subject = p_subject;

  SELECT COALESCE(SUM(xp_total), 0) INTO v_total_xp
  FROM public.user_progress
  WHERE user_id = p_user_id;

  IF v_new_xp >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'first_steps', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  IF v_new_xp >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'curious_mind', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  IF v_new_xp >= 500 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'deep_diver', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_new_streak >= 3 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'on_a_roll', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  IF v_new_streak >= 7 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'week_warrior', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  IF v_total_xp >= 1000 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'knowledge_seeker', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  IF v_total_xp >= 5000 THEN
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    VALUES (p_user_id, 'scholar', now()) ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_xp(uuid, text, integer, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_xp(uuid, text, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_xp(uuid, text, integer, boolean) TO service_role;
