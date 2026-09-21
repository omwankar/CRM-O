-- 051_notification_read_at.sql — track when a notification was read so
-- read items can disappear from the inbox after 24 hours.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

UPDATE public.notifications
SET read_at = COALESCE(read_at, NOW())
WHERE is_read = TRUE AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at
  ON public.notifications(user_id, is_read, read_at);
