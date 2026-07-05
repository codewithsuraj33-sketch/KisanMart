-- KisanMart account settings security migration
-- Existing Supabase project mein SQL Editor se ek baar run karein.

-- Customer ko poori profile row update karne ka permission mat do,
-- warna direct API request se is_admin field bhi change ho sakti hai.
revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;

-- Account Settings page ke liye sirf safe fields editable hain.
grant update (full_name, phone) on table public.profiles to authenticated;
