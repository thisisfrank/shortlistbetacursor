-- Add flag to track whether welcome webhook has been sent
-- This prevents missed webhooks (if user takes > 5 min to confirm) 
-- and duplicate webhooks (on subsequent logins)

-- Add the column with default false
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS has_received_welcome_email BOOLEAN DEFAULT false;

-- Update existing users to mark them as already welcomed (they're not new)
UPDATE public.user_profiles 
SET has_received_welcome_email = true 
WHERE has_received_welcome_email IS NULL OR has_received_welcome_email = false;

-- Add helpful comment
COMMENT ON COLUMN public.user_profiles.has_received_welcome_email IS 
'Tracks whether the welcome webhook has been sent to GHL. Set to true after first successful welcome notification.';

