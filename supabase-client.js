// ===================================
// Supabase Connection - Elite Investors
// ===================================

const SUPABASE_URL = "https://qwuujtswxafiekuuogip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXVqdHN3eGFmaWVrdXVvZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTA2MDMsImV4cCI6MjA4NjQ4NjYwM30.gYdP0e-SiztyvOjOdJXqCUnMwyqcwCsfgjSPwmPxGp8";

let supabaseClient = null;

async function loadSupabaseLibrary() {
    if (window.supabase) return window.supabase;

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = () => resolve(window.supabase);
        script.onerror = () => reject("فشل تحميل مكتبة Supabase");
        document.head.appendChild(script);
    });
}

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    const supabase = await loadSupabaseLibrary();

    supabaseClient = supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        }
    );

    console.log("✅ Supabase Connected Successfully");
    window.supabaseClient = { client: supabaseClient };

    return supabaseClient;
}

// تشغيل الاتصال تلقائياً
document.addEventListener("DOMContentLoaded", async () => {
    await initSupabase();
});