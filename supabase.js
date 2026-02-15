// supabase.js
// نسخة نهائية تحل مشكلة name NOT NULL 100%

const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

let supabaseClient = null;

function initSupabase() {

    if (!window.supabase) {
        console.error("Supabase not loaded");
        return null;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    return supabaseClient;
}

window.supabaseClient = initSupabase();

function safeClient() {

    if (!window.supabaseClient) {
        throw new Error("Supabase not ready");
    }

    return window.supabaseClient;
}

// ========================
// GET USER
// ========================

function getCurrentUser() {

    const user = localStorage.getItem("user");

    if (!user) return null;

    return JSON.parse(user);
}

// ========================
// REGISTER (FORCED name FIX)
// ========================

async function registerUser(userData) {

    try {

        const client = safeClient();

        // تأكد name دائماً موجود
        let username =
            userData.username ||
            userData.name ||
            userData.email?.split('@')[0] ||
            "user_" + Date.now();

        const cleanData = {

            name: username,
            username: username,
            email: userData.email,
            password: userData.password,

            balance: 0,
            status: "active",
            created_at: new Date().toISOString()

        };

        const { data, error } = await client
            .from("users")
            .insert([cleanData])
            .select()
            .single();

        if (error) {

            console.error(error);

            return {
                success: false,
                error: error.message
            };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// LOGIN
// ========================

async function loginUser(login, password) {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from("users")
            .select("*")
            .or(`email.eq.${login},username.eq.${login}`)
            .maybeSingle();

        if (error || !data) {

            return {
                success: false,
                error: "User not found"
            };
        }

        if (data.password !== password) {

            return {
                success: false,
                error: "Wrong password"
            };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// LOGOUT
// ========================

function logoutUser() {

    localStorage.removeItem("user");

    window.location.href = "index.html";
}

// ========================
// GET PACKAGES
// ========================

async function getPackages() {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from("packages")
            .select("*")
            .order("price", { ascending: true });

        if (error) {

            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// UPDATE BALANCE
// ========================

async function updateBalance(userId, balance) {

    const client = safeClient();

    const { data, error } = await client
        .from("users")
        .update({ balance })
        .eq("id", userId)
        .select()
        .single();

    if (error) {

        return {
            success: false,
            error: error.message
        };
    }

    localStorage.setItem("user", JSON.stringify(data));

    return {
        success: true,
        data
    };
}

// ========================
// BUY PACKAGE
// ========================

async function buyPackage(packageId) {

    const client = safeClient();

    const user = getCurrentUser();

    if (!user) {

        return {
            success: false,
            error: "Login required"
        };
    }

    const { data: pkg, error } = await client
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .single();

    if (error) {

        return {
            success: false,
            error: error.message
        };
    }

    if (user.balance < pkg.price) {

        return {
            success: false,
            error: "Not enough balance"
        };
    }

    return await updateBalance(
        user.id,
        user.balance - pkg.price
    );
}

// ========================

window.supabaseHelpers = {

    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getPackages,
    updateBalance,
    buyPackage

};// supabase.js
// نسخة نهائية تحل مشكلة name NOT NULL 100%

const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

let supabaseClient = null;

function initSupabase() {

    if (!window.supabase) {
        console.error("Supabase not loaded");
        return null;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    return supabaseClient;
}

window.supabaseClient = initSupabase();

function safeClient() {

    if (!window.supabaseClient) {
        throw new Error("Supabase not ready");
    }

    return window.supabaseClient;
}

// ========================
// GET USER
// ========================

function getCurrentUser() {

    const user = localStorage.getItem("user");

    if (!user) return null;

    return JSON.parse(user);
}

// ========================
// REGISTER (FORCED name FIX)
// ========================

async function registerUser(userData) {

    try {

        const client = safeClient();

        // تأكد name دائماً موجود
        let username =
            userData.username ||
            userData.name ||
            userData.email?.split('@')[0] ||
            "user_" + Date.now();

        const cleanData = {

            name: username,
            username: username,
            email: userData.email,
            password: userData.password,

            balance: 0,
            status: "active",
            created_at: new Date().toISOString()

        };

        const { data, error } = await client
            .from("users")
            .insert([cleanData])
            .select()
            .single();

        if (error) {

            console.error(error);

            return {
                success: false,
                error: error.message
            };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// LOGIN
// ========================

async function loginUser(login, password) {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from("users")
            .select("*")
            .or(`email.eq.${login},username.eq.${login}`)
            .maybeSingle();

        if (error || !data) {

            return {
                success: false,
                error: "User not found"
            };
        }

        if (data.password !== password) {

            return {
                success: false,
                error: "Wrong password"
            };
        }

        localStorage.setItem("user", JSON.stringify(data));

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// LOGOUT
// ========================

function logoutUser() {

    localStorage.removeItem("user");

    window.location.href = "index.html";
}

// ========================
// GET PACKAGES
// ========================

async function getPackages() {

    try {

        const client = safeClient();

        const { data, error } = await client
            .from("packages")
            .select("*")
            .order("price", { ascending: true });

        if (error) {

            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            data
        };

    }
    catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

// ========================
// UPDATE BALANCE
// ========================

async function updateBalance(userId, balance) {

    const client = safeClient();

    const { data, error } = await client
        .from("users")
        .update({ balance })
        .eq("id", userId)
        .select()
        .single();

    if (error) {

        return {
            success: false,
            error: error.message
        };
    }

    localStorage.setItem("user", JSON.stringify(data));

    return {
        success: true,
        data
    };
}

// ========================
// BUY PACKAGE
// ========================

async function buyPackage(packageId) {

    const client = safeClient();

    const user = getCurrentUser();

    if (!user) {

        return {
            success: false,
            error: "Login required"
        };
    }

    const { data: pkg, error } = await client
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .single();

    if (error) {

        return {
            success: false,
            error: error.message
        };
    }

    if (user.balance < pkg.price) {

        return {
            success: false,
            error: "Not enough balance"
        };
    }

    return await updateBalance(
        user.id,
        user.balance - pkg.price
    );
}

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
