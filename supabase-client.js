// ===================================
// الاتصال بـ Supabase - Elite Investors
// ===================================

const SUPABASE_URL = 'https://qwuujtswxafiekuuogip.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dXVqdHN3eGFmaWVrdXVvZ2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTA2MDMsImV4cCI6MjA4NjQ4NjYwM30.gYdP0e-SiztyvOjOdJXqCUnMwyqcwCsfgjSPwmPxGp8';

// تهيئة عميل Supabase
let supabaseClient = null;

// تحميل مكتبة Supabase
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve(window.supabase);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            resolve(window.supabase);
        };
        script.onerror = () => {
            reject(new Error('فشل تحميل مكتبة Supabase'));
        };
        document.head.appendChild(script);
    });
}

// تهيئة الاتصال
async function initSupabase() {
    try {
        const supabase = await loadSupabaseLibrary();
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
        
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        
        // إنشاء الجداول إذا لم تكن موجودة
        await initializeTables();
        
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل الاتصال بـ Supabase:', error);
        return null;
    }
}

// إنشاء الجداول
async function initializeTables() {
    if (!supabaseClient) return;
    
    try {
        // التحقق من وجود الجداول وإنشائها
        const tables = [
            'users',
            'packages',
            'tasks',
            'subscriptions',
            'transactions',
            'withdrawals',
            'pending_packages',
            'referrals',
            'system_logs',
            'settings'
        ];
        
        for (const table of tables) {
            await createTableIfNotExists(table);
        }
        
        console.log('✅ تم تهيئة جداول قاعدة البيانات');
        
        // تحميل البيانات الافتراضية
        await loadDefaultData();
        
    } catch (error) {
        console.error('❌ فشل تهيئة الجداول:', error);
    }
}

// إنشاء جدول إذا لم يكن موجوداً
async function createTableIfNotExists(tableName) {
    if (!supabaseClient) return;
    
    try {
        // محاولة جلب سجل واحد للتحقق من وجود الجدول
        const { error } = await supabaseClient
            .from(tableName)
            .select('*')
            .limit(1);
        
        // إذا كان الخطأ يشير إلى عدم وجود الجدول
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`⚙️ جاري إنشاء جدول: ${tableName}`);
            
            // إنشاء الجدول عبر استعلام SQL المباشر
            await createTableViaSQL(tableName);
        }
    } catch (error) {
        console.error(`❌ فشل التحقق من جدول ${tableName}:`, error);
    }
}

// إنشاء جدول عبر SQL
async function createTableViaSQL(tableName) {
    if (!supabaseClient) return;
    
    const sqlQueries = {
        users: `
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                phone TEXT,
                password TEXT,
                referred_by TEXT,
                referral_code TEXT UNIQUE,
                balance DECIMAL DEFAULT 0,
                wallet_address TEXT,
                wallet_network TEXT DEFAULT 'TRC20',
                tasks_completed INTEGER DEFAULT 0,
                total_earned DECIMAL DEFAULT 0,
                total_withdrawn DECIMAL DEFAULT 0,
                referral_count INTEGER DEFAULT 0,
                referral_earnings DECIMAL DEFAULT 0,
                referral_reward_paid BOOLEAN DEFAULT FALSE,
                joined_date TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP,
                is_admin BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'active',
                status_reason TEXT,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        packages: `
            CREATE TABLE IF NOT EXISTS packages (
                id BIGINT PRIMARY KEY,
                name TEXT NOT NULL,
                price DECIMAL NOT NULL,
                profit DECIMAL DEFAULT 2.5,
                daily_profit DECIMAL,
                tasks INTEGER DEFAULT 5,
                duration INTEGER DEFAULT 30,
                status TEXT DEFAULT 'active',
                description TEXT,
                category TEXT DEFAULT 'standard',
                users_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        tasks: `
            CREATE TABLE IF NOT EXISTS tasks (
                id BIGINT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                reward DECIMAL NOT NULL,
                type TEXT DEFAULT 'daily',
                status TEXT DEFAULT 'active',
                completions INTEGER DEFAULT 0,
                available_for TEXT DEFAULT 'all',
                package_categories JSONB DEFAULT '["standard", "premium", "vip"]'::jsonb,
                difficulty TEXT DEFAULT 'easy',
                time_required INTEGER DEFAULT 2,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        subscriptions: `
            CREATE TABLE IF NOT EXISTS subscriptions (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                package_id BIGINT NOT NULL,
                package_name TEXT,
                package_amount DECIMAL,
                daily_profit DECIMAL,
                purchase_date TIMESTAMP,
                end_date TIMESTAMP,
                duration INTEGER DEFAULT 30,
                status TEXT DEFAULT 'نشط',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        transactions: `
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                type TEXT NOT NULL,
                amount DECIMAL NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'مكتمل',
                date TEXT,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
        withdrawals: `
            CREATE TABLE IF NOT EXISTS withdrawals (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                amount DECIMAL NOT NULL,
                wallet TEXT NOT NULL,
                network TEXT DEFAULT 'TRC20',
                fee DECIMAL DEFAULT 5,
                total DECIMAL,
                status TEXT DEFAULT 'معلق',
                date TEXT,
                tx_hash TEXT,
                processed_date TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        pending_packages: `
            CREATE TABLE IF NOT EXISTS pending_packages (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                user_name TEXT,
                user_email TEXT,
                package_id BIGINT,
                package_name TEXT,
                package_category TEXT,
                amount DECIMAL,
                payment_proof TEXT,
                wallet_address TEXT,
                network TEXT DEFAULT 'TRC20',
                transaction_hash TEXT,
                date TEXT,
                requested_date TIMESTAMP,
                status TEXT DEFAULT 'بانتظار المراجعة',
                fast_approval BOOLEAN DEFAULT FALSE,
                referred_by TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        referrals: `
            CREATE TABLE IF NOT EXISTS referrals (
                id BIGINT PRIMARY KEY,
                referrer_id BIGINT NOT NULL,
                referred_id BIGINT NOT NULL,
                referrer_code TEXT,
                amount DECIMAL,
                status TEXT DEFAULT 'pending',
                reward_paid BOOLEAN DEFAULT FALSE,
                date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `,
        system_logs: `
            CREATE TABLE IF NOT EXISTS system_logs (
                id BIGINT PRIMARY KEY,
                action TEXT,
                user_id BIGINT,
                user_name TEXT,
                details JSONB,
                date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `,
        settings: `
            CREATE TABLE IF NOT EXISTS settings (
                id BIGINT PRIMARY KEY DEFAULT 1,
                referrer_reward DECIMAL DEFAULT 50,
                referee_reward DECIMAL DEFAULT 20,
                min_withdrawal DECIMAL DEFAULT 50,
                withdrawal_fees JSONB DEFAULT '{"TRC20": 5, "ERC20": 15, "BEP20": 3}'::jsonb,
                referral_active BOOLEAN DEFAULT TRUE,
                site_name TEXT DEFAULT 'Elite Investors',
                site_description TEXT,
                maintenance_mode BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `
    };
    
    if (sqlQueries[tableName]) {
        try {
            const { error } = await supabaseClient.rpc('exec_sql', {
                query: sqlQueries[tableName]
            });
            
            if (error) {
                console.warn(`⚠️ لا يمكن إنشاء جدول ${tableName} عبر RPC:`, error);
            }
        } catch (error) {
            console.warn(`⚠️ فشل إنشاء جدول ${tableName}:`, error);
        }
    }
}

// تحميل البيانات الافتراضية
async function loadDefaultData() {
    if (!supabaseClient) return;
    
    try {
        // التحقق من وجود الباقات
        const { data: existingPackages } = await supabaseClient
            .from('packages')
            .select('*')
            .limit(1);
        
        if (!existingPackages || existingPackages.length === 0) {
            console.log('📦 جاري تحميل الباقات الافتراضية...');
            
            const defaultPackages = window.SHARED_PACKAGES || [
                {
                    id: 1,
                    name: "الباقة الفضية",
                    price: 500,
                    profit: 2.5,
                    daily_profit: 12.5,
                    tasks: 5,
                    duration: 30,
                    status: "active",
                    description: "الباقة المثالية للمبتدئين",
                    category: "standard"
                },
                {
                    id: 2,
                    name: "الباقة الذهبية",
                    price: 1000,
                    profit: 2.5,
                    daily_profit: 25,
                    tasks: 5,
                    duration: 30,
                    status: "active",
                    description: "الباقة الأكثر طلباً",
                    category: "premium"
                },
                {
                    id: 3,
                    name: "الباقة الماسية",
                    price: 5000,
                    profit: 2.5,
                    daily_profit: 125,
                    tasks: 5,
                    duration: 30,
                    status: "active",
                    description: "للحصول على أفضل العوائد",
                    category: "vip"
                }
            ];
            
            for (const pkg of defaultPackages) {
                await supabaseClient
                    .from('packages')
                    .upsert(pkg, { onConflict: 'id' });
            }
        }
        
        // التحقق من وجود المهام
        const { data: existingTasks } = await supabaseClient
            .from('tasks')
            .select('*')
            .limit(1);
        
        if (!existingTasks || existingTasks.length === 0) {
            console.log('📋 جاري تحميل المهام الافتراضية...');
            
            const defaultTasks = window.SHARED_TASKS || [
                {
                    id: 1,
                    title: "مشاهدة فيديو تعليمي",
                    description: "شاهد فيديو لمدة 2 دقيقة عن أساسيات الاستثمار",
                    reward: 2.5,
                    type: "daily",
                    status: "active",
                    completions: 0,
                    available_for: "all",
                    package_categories: ["standard", "premium", "vip"],
                    difficulty: "easy",
                    time_required: 2
                },
                {
                    id: 2,
                    title: "مشاركة رابط الإحالة",
                    description: "شارك رابط الإحالة الخاص بك مع صديق واحد على الأقل",
                    reward: 5,
                    type: "daily",
                    status: "active",
                    completions: 0,
                    available_for: "all",
                    package_categories: ["premium", "vip"],
                    difficulty: "medium",
                    time_required: 3
                }
            ];
            
            for (const task of defaultTasks) {
                await supabaseClient
                    .from('tasks')
                    .upsert(task, { onConflict: 'id' });
            }
        }
        
        // التحقق من وجود إعدادات النظام
        const { data: existingSettings } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
        
        if (!existingSettings) {
            console.log('⚙️ جاري تحميل إعدادات النظام...');
            
            await supabaseClient
                .from('settings')
                .upsert({
                    id: 1,
                    referrer_reward: 50,
                    referee_reward: 20,
                    min_withdrawal: 50,
                    withdrawal_fees: { TRC20: 5, ERC20: 15, BEP20: 3 },
                    referral_active: true,
                    site_name: 'Elite Investors',
                    maintenance_mode: false
                }, { onConflict: 'id' });
        }
        
    } catch (error) {
        console.error('❌ فشل تحميل البيانات الافتراضية:', error);
    }
}

// ========== دوال مزامنة البيانات ==========

// مزامنة البيانات من Supabase
async function syncFromSupabase(table, localKey) {
    if (!supabaseClient) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from(table)
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            localStorage.setItem(localKey, JSON.stringify(data));
            console.log(`✅ تم تحديث ${table} من Supabase (${data.length} سجل)`);
        }
        
        return data;
    } catch (error) {
        console.error(`❌ فشل مزامنة ${table} من Supabase:`, error);
        return null;
    }
}

// مزامنة البيانات إلى Supabase
async function syncToSupabase(table, data, conflictColumn = 'id') {
    if (!supabaseClient || !data) return false;
    
    try {
        const { error } = await supabaseClient
            .from(table)
            .upsert(data, { onConflict: conflictColumn });
        
        if (error) throw error;
        
        console.log(`✅ تم مزامنة ${table} إلى Supabase`);
        return true;
    } catch (error) {
        console.error(`❌ فشل مزامنة ${table} إلى Supabase:`, error);
        return false;
    }
}

// ========== التهيئة ==========
let supabaseInitPromise = null;

async function getSupabaseClient() {
    if (!supabaseInitPromise) {
        supabaseInitPromise = initSupabase();
    }
    return supabaseInitPromise;
}

// تهيئة فورية
getSupabaseClient();

// ========== التصدير ==========
window.supabaseClient = {
    client: supabaseClient,
    init: getSupabaseClient,
    syncFrom: syncFromSupabase,
    syncTo: syncToSupabase
};

// إضافة دالة exec_sql إذا لم تكن موجودة
async function createExecSqlFunction() {
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient.rpc('exec_sql', {
            query: 'SELECT 1'
        });
        
        if (error && error.message.includes('function')) {
            console.log('⚠️ دالة exec_sql غير متوفرة. سيتم استخدام localStorage كاحتياطي.');
        }
    } catch (error) {
        console.log('⚠️ دالة exec_sql غير متوفرة. سيتم استخدام localStorage كاحتياطي.');
    }
}

createExecSqlFunction();