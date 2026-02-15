// supabase.js
// جاهز 100% ويستخدم نفس بيانات مشروعك

const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

let supabaseClient = null;

// ========================
// INIT
// ========================

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    console.log('Supabase connected successfully');
    return supabaseClient;
}

window.supabaseClient = initSupabase();

// ========================
// SAFE CLIENT
// ========================

function safeClient() {
    if (!window.supabaseClient) {
        throw new Error('Supabase not ready');
    }
    return window.supabaseClient;
}

// ========================
// REGISTER USER (FIXED confirmPassword ERROR)
// ========================

async function registerUser(userData) {
    try {

        const client = safeClient();

        // حذف confirmPassword اذا موجود
        const cleanData = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            balance: 0,
            status: 'active',
            created_at: new Date().toISOString()
        };

        // تحقق من وجود المستخدم
        const { data: existing } = await client
            .from('users')
            .select('id')
            .or(`email.eq.${cleanData.email},username.eq.${cleanData.username}`)
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'exists' };
        }

        // إنشاء المستخدم
        const { data, error } = await client
            .from('users')
            .insert([cleanData])
            .select()
            .single();

        if (error) {
            console.error(error);
            return { success: false, error: error.message };
        }

        // حفظ في localStorage
        localStorage.setItem("user", JSON.stringify(data));

        return { success: true, data };

    } catch (err) {

        console.error(err);
        return { success: false, error: err.message };

    }
}

// ========================
// LOGIN
// ========================

async function loginUser(usernameOrEmail, password) {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from('users')
            .select('*')
            .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
            .eq('status', 'active')
            .maybeSingle();

        if (error || !data) {
            return { success: false, error: 'invalid' };
        }

        if (data.password !== password) {
            return { success: false, error: 'invalid' };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return { success: true, data };

    } catch (err) {

        return { success: false, error: err.message };

    }

}

// ========================
// GET CURRENT USER
// ========================

function getCurrentUser() {

    const user = localStorage.getItem("user");

    if (!user) return null;

    return JSON.parse(user);

}

// ========================
// LOGOUT
// ========================

function logoutUser() {

    localStorage.removeItem("user");

    window.location.href = "index.html";

}

// ========================
// GET PACKAGES (FIXED)
// ========================

async function getPackages() {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });

        if (error) {
            console.error(error);
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (err) {

        return { success: false, error: err.message };

    }

}

// ========================
// UPDATE BALANCE
// ========================

async function updateBalance(userId, newBalance) {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return { success: true, data };

    } catch (err) {

        return { success: false, error: err.message };

    }

}

// ========================
// BUY PACKAGE
// ========================

async function buyPackage(packageId) {

    try {

        const client = safeClient();

        const user = getCurrentUser();

        if (!user) {
            return { success: false, error: 'not_logged' };
        }

        const { data: pkg, error } = await client
            .from('packages')
            .select('*')
            .eq('id', packageId)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (user.balance < pkg.price) {
            return { success: false, error: 'no_balance' };
        }

        const newBalance = user.balance - pkg.price;

        return await updateBalance(user.id, newBalance);

    } catch (err) {

        return { success: false, error: err.message };

    }

}

// ========================
// EXPORT
// ========================

window.supabaseHelpers = {

    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getPackages,
    updateBalance,
    buyPackage

};
