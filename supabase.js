// ======================================================
//                Supabase Configuration
// ======================================================

const SUPABASE_URL = "https://kjivdgfacwvdcfaxdedb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaXZkZ2ZhY3d2ZGNmYXhkZWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODY1MDksImV4cCI6MjA4NjU2MjUwOX0.3SW2jU-Cu3i4Ms5yIFjaDZZ8DQCVI78Rc0ZIyFeFaXo";

// ======================================================
//                Create Client (مرة واحدة فقط)
// ======================================================

let supabaseClient = null;

function createSupabaseClient() {

    if (!supabaseClient && typeof supabase !== "undefined") {

        supabaseClient = supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

        console.log("✅ Supabase Connected Successfully");
    }

    return supabaseClient;
}

// ======================================================
//         انتظار جاهزية Supabase قبل الاستخدام
// ======================================================

async function waitForSupabase() {

    return new Promise((resolve) => {

        const checkInterval = setInterval(() => {

            if (typeof supabase !== "undefined") {

                clearInterval(checkInterval);

                const client = createSupabaseClient();
                resolve(client);
            }

        }, 50);

    });

}

// ======================================================
//            متاح لكل الصفحات عبر window
// ======================================================

window.supabaseDb = {

    get client() {
        return createSupabaseClient();
    },

    wait: waitForSupabase

};

// ======================================================
//        تهيئة تلقائية عند تحميل الصفحة
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
    await waitForSupabase();
});