-- 050_holidays_2027.sql — company holidays for 2027 (paid)

INSERT INTO public.calendar_events (date, title, event_type, holiday_pay_type, all_day, status)
SELECT v.date::date, v.title, 'holiday', 'paid', TRUE, 'active'
FROM (VALUES
  ('2027-01-01', 'New Year''s Day'),
  ('2027-01-26', 'Republic Day'),
  ('2027-03-26', 'Good Friday'),
  ('2027-05-03', 'Early May Bank Holiday'),
  ('2027-08-15', 'Independence Day'),
  ('2027-10-20', 'Diwali'),
  ('2027-12-27', 'Christmas substitute'),
  ('2027-12-28', 'Boxing Day substitute')
) AS v(date, title)
WHERE NOT EXISTS (
  SELECT 1 FROM public.calendar_events ce
  WHERE ce.date = v.date::date AND ce.event_type = 'holiday'
);
