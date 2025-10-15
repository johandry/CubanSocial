// Supabase client setup using CDN
// Import from CDN for browser compatibility
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// These keys are safe to be public - they're designed for frontend applications
// Security is handled by Row Level Security (RLS) policies in the database
const SUPABASE_URL = 'https://blctxghtoucdtyvetsar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsY3R4Z2h0b3VjZHR5dmV0c2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjM2ODMsImV4cCI6MjA3MDUzOTY4M30.32q6691h1n4Ue_lFXxkaPnzGlz0917C5iljxLFCFDmc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
