-- Unschedule the existing hourly cron job
SELECT cron.unschedule('fetch-forex-news-hourly');

-- Create a new cron job to fetch forex news weekly (every Monday at 00:00)
SELECT cron.schedule(
  'fetch-forex-news-weekly',
  '0 0 * * 1', -- Every Monday at midnight
  $$
  SELECT
    net.http_post(
        url:='https://gjhbobzedztwinchfoyg.supabase.co/functions/v1/fetch-forex-news',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);