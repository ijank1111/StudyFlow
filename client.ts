import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cbtuztwmxjdzghjygrdd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidHV6dHdteGpkemdoanlncmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzA1MzksImV4cCI6MjA5MTI0NjUzOX0.Ny0HaD3z7yFtKfI6yc7dtIQE04uHf2yX6zKDkLFqSds";

// Initialize the Supabase client for the application
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);