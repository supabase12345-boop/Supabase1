// ==========================================
// Supabase Config
// ==========================================

const SUPABASE_URL = "https://kjivdgfacwvdcfaxdedb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaXZkZ2ZhY3d2ZGNmYXhkZWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODY1MDksImV4cCI6MjA4NjU2MjUwOX0.3SW2jU-Cu3i4Ms5yIFjaDZZ8DQCVI78Rc0ZIyFeFaXo";

// إنشاء الاتصال مباشرة
window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);