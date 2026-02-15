
const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

let supabaseClient = null;

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
    console.log('Supabase connected');
    return supabaseClient;
}

window.supabaseClient = initSupabase();

function safeClient() {
    if (!window.supabaseClient) {
        throw new Error('Supabase not ready');
    }
    return window.supabaseClient;
}

// === ORIGINAL FUNCTIONS (NO LOGIC CHANGE) ===
async function registerUser(userData) {
    const client = safeClient();
    const { data: existing } = await client
        .from('users')
        .select('id')
        .or(`email.eq.${userData.email},username.eq.${userData.username}`)
        .maybeSingle();

    if (existing) return { success: false, error: 'exists' };

    const { data, error } = await client
        .from('users')
        .insert([userData])
        .select()
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

async function loginUser(usernameOrEmail, password) {
    const client = safeClient();
    const { data } = await client
        .from('users')
        .select('*')
        .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
        .maybeSingle();

    if (!data || data.password !== password) {
        return { success: false, error: 'invalid' };
    }
    return { success: true, data };
}

async function getUserById(id) {
    const client = safeClient();
    const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

window.supabaseHelpers = {
    registerUser,
    loginUser,
    getUserById
};
