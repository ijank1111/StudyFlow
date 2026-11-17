-- Add explicit relationship between assignments and profiles for easier joining in the API
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS assignments_user_id_fkey,
ADD CONSTRAINT assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;