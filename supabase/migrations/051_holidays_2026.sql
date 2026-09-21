-- 051_holidays_2026.sql — company holidays for 2026 (paid), matching the office list:
-- New Year's Day, Republic Day, Good Friday, Early May Bank Holiday,
-- Independence Day, Diwali, Christmas Day, Boxing Day substitute.

INSERT INTO public.calendar_events (date, title, event_type, holiday_pay_type, all_day, status)
SELECT v.date::date, v.title, 'holiday', 'paid', TRUE, 'active'
FROM (VALUES
  ('2026-01-01', 'New Year''s Day'),
  ('2026-01-26', 'Republic Day'),
  ('2026-04-03', 'Good Friday'),
  ('2026-05-04', 'Early May Bank Holiday'),
  ('2026-08-15', 'Independence Day'),
  ('2026-11-08', 'Diwali'),
  ('2026-12-25', 'Christmas Day'),
  ('2026-12-28', 'Boxing Day (substitute)')
) AS v(date, title)
WHERE NOT EXISTS (
  SELECT 1 FROM public.calendar_events ce
  WHERE ce.date = v.date::date AND ce.event_type = 'holiday'
);
