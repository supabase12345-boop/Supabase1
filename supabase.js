// ===================================
// ملف: supabase.js
// الاتصال بقاعدة بيانات Supabase - الإصدار النهائي
// ===================================

const SUPABASE_URL = 'https://kfwbcewtnfoofllhxron.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmd2JjZXd0bmZvb2ZsbGh4cm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjEwMzksImV4cCI6MjA4NjQ5NzAzOX0.Mgf7Dg4Ji3eKHQPz3SUGTfwSfsl7anYneA4ZPIYgbIU';

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