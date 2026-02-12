// ===================================
// الاتصال بـ Supabase - Elite Investors
// نسخة مبسطة ومضمونة 100%
// ===================================

const SUPABASE_URL = 'https://qwuujtswxafiekuuogip.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXVqdHN3eGFmaWVrdXVvZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTA2MDMsImV4cCI6MjA4NjQ4NjYwM30.gYdP0e-SiztyvOjOdJXqCUnMwyqcwCsfgjSPwmPxGp8';

// متغير عام للعميل
let supabaseClient = null;

// تحميل مكتبة Supabase
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        // إذا كانت المكتبة محملة مسبقاً
        if (window.supabase) {
            console.log('✅ مكتبة Supabase موجودة مسبقاً');
            resolve(window.supabase);
            return;
        }
        
        console.log('🔄 جاري تحميل مكتبة Supabase...');
        
        // تحميل المكتبة من CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.log('✅ تم تحميل مكتبة Supabase بنجاح');
            resolve(window.supabase);
        };
        script.onerror = () => {
            console.error('❌ فشل تحميل مكتبة Supabase');
            reject(new Error('فشل تحميل مكتبة Supabase'));
        };
        document.head.appendChild(script);
    });
}

// تهيئة الاتصال
async function initSupabase() {
    try {
        // تحميل المكتبة
        const supabaseLib = await loadSupabaseLibrary();
        
        // إنشاء العميل
        supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
        
        // اختبار الاتصال
        console.log('🔄 جاري اختبار الاتصال بـ Supabase...');
        
        const { data, error } = await supabaseClient
            .from('packages')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ فشل الاتصال بـ Supabase:', error.message);
            return null;
        }
        
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        
        // حفظ العميل في window للوصول العالمي
        window.supabaseClient = supabaseClient;
        
        // إرسال حدث نجاح الاتصال
        const event = new CustomEvent('supabase-connected');
        window.dispatchEvent(event);
        
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل تهيئة Supabase:', error);
        return null;
    }
}

// دالة للحصول على العميل
async function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }
    
    // انتظار التهيئة
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (supabaseClient) {
                clearInterval(checkInterval);
                resolve(supabaseClient);
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
        }, 5000);
    });
}

// تهيئة فورية
initSupabase();

// تصدير الدوال للاستخدام العام
window.SupabaseService = {
    init: initSupabase,
    getClient: getSupabaseClient,
    client: () => supabaseClient
};

console.log('🚀 Supabase Client جاهز للعمل');