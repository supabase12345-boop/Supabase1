// ===================================
// ملف الاتصال بـ Supabase
// ===================================

const SUPABASE_URL = 'https://kjivdgfacwvdcfaxdedb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaXZkZ2ZhY3d2ZGNmYXhkZWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODY1MDksImV4cCI6MjA4NjU2MjUwOX0.3SW2jU-Cu3i4Ms5yIFjaDZZ8DQCVI78Rc0ZIyFeFaXo';

// إنشاء عميل Supabase
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        return supabaseClient;
    }
    return null;
}

// تهيئة فورية
if (typeof window !== 'undefined') {
    window.supabaseDb = {
        client: null,
        init: initSupabase
    };
    
    // محاولة الاتصال بعد تحميل المكتبة
    setTimeout(() => {
        window.supabaseDb.client = initSupabase();
    }, 500);
}