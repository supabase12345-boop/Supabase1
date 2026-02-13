// ===================================
// ملف الاتصال بـ Supabase
// ===================================

const SUPABASE_URL = 'https://kfwbcewtnfoofllhxron.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmd2JjZXd0bmZvb2ZsbGh4cm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjEwMzksImV4cCI6MjA4NjQ5NzAzOX0.Mgf7Dg4Ji3eKHQPz3SUGTfwSfsl7anYneA4ZPIYgbIU';

// تحميل مكتبة Supabase
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
supabaseScript.onload = initializeSupabase;
document.head.appendChild(supabaseScript);

let supabase;

function initializeSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        
        // تهيئة الجداول
        initializeTables();
    }
}

// تهيئة الجداول في Supabase
async function initializeTables() {
    try {
        // التحقق من وجود الجداول وإنشائها إذا لم تكن موجودة
        await createTablesIfNotExist();
        console.log('✅ تم تهيئة الجداول بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة الجداول:', error);
    }
}

// إنشاء الجداول إذا لم تكن موجودة
async function createTablesIfNotExist() {
    // سيتم إنشاء الجداول يدوياً من خلال SQL Editor في Supabase
    // هذه الدالة للتحقق من الاتصال فقط
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
        console.log('⚠️ الجداول غير موجودة. يرجى إنشائها باستخدام SQL Editor في Supabase');
        console.log(`
            -- SQL لإنشاء الجداول في Supabase:
            
            -- جدول المستخدمين
            CREATE TABLE users (
                id BIGINT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password TEXT NOT NULL,
                referred_by TEXT,
                referral_code TEXT,
                balance DECIMAL DEFAULT 0,
                total_earned DECIMAL DEFAULT 0,
                total_withdrawn DECIMAL DEFAULT 0,
                tasks_completed INTEGER DEFAULT 0,
                referral_count INTEGER DEFAULT 0,
                referral_earnings DECIMAL DEFAULT 0,
                referral_reward_paid BOOLEAN DEFAULT FALSE,
                joined_date TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP,
                is_admin BOOLEAN DEFAULT FALSE,
                status TEXT DEFAULT 'active',
                status_reason TEXT,
                wallet_address TEXT,
                wallet_network TEXT DEFAULT 'TRC20',
                package JSONB,
                pending_package JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول الباقات
            CREATE TABLE packages (
                id BIGINT PRIMARY KEY,
                name TEXT NOT NULL,
                price DECIMAL NOT NULL,
                profit DECIMAL DEFAULT 2.5,
                daily_profit DECIMAL,
                tasks INTEGER DEFAULT 5,
                duration INTEGER DEFAULT 30,
                status TEXT DEFAULT 'active',
                category TEXT DEFAULT 'standard',
                description TEXT,
                users_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول المهام
            CREATE TABLE tasks (
                id BIGINT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                reward DECIMAL NOT NULL,
                type TEXT DEFAULT 'daily',
                status TEXT DEFAULT 'active',
                completions INTEGER DEFAULT 0,
                available_for TEXT DEFAULT 'all',
                package_categories TEXT[],
                difficulty TEXT DEFAULT 'easy',
                time_required INTEGER DEFAULT 2,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول الاشتراكات المعلقة
            CREATE TABLE pending_packages (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                user_name TEXT,
                user_email TEXT,
                user_phone TEXT,
                package_id BIGINT NOT NULL,
                package_name TEXT,
                package_category TEXT,
                amount DECIMAL NOT NULL,
                payment_proof TEXT,
                wallet_address TEXT,
                network TEXT DEFAULT 'TRC20',
                transaction_hash TEXT,
                date TEXT,
                requested_date TIMESTAMP DEFAULT NOW(),
                status TEXT DEFAULT 'بانتظار المراجعة',
                fast_approval BOOLEAN DEFAULT FALSE,
                estimated_activation TEXT,
                referred_by TEXT,
                notes TEXT,
                processed_by BIGINT,
                processed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول المعاملات
            CREATE TABLE transactions (
                id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                type TEXT NOT NULL,
                amount DECIMAL NOT NULL,
                description TEXT,
                date TEXT,
                status TEXT DEFAULT 'مكتمل',
                referral_code TEXT,
                referrer_name TEXT,
                referred_user_id BIGINT,
                referred_user_name TEXT,
                admin BOOLEAN DEFAULT FALSE,
                notes TEXT,
                tx_hash TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول طلبات السحب
            CREATE TABLE withdrawals (
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
                notes TEXT,
                processor_notes TEXT,
                processed_by BIGINT,
                processed_date TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول إحصائيات النظام
            CREATE TABLE system_stats (
                id SERIAL PRIMARY KEY,
                total_users INTEGER DEFAULT 0,
                total_deposits DECIMAL DEFAULT 0,
                total_withdrawals DECIMAL DEFAULT 0,
                total_profits DECIMAL DEFAULT 0,
                active_subscriptions INTEGER DEFAULT 0,
                date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            -- جدول إعدادات النظام
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- إضافة البيانات الأولية للباقات
            INSERT INTO packages (id, name, price, profit, daily_profit, tasks, duration, category, description)
            VALUES 
                (1, 'الباقة الفضية', 500, 2.5, 12.5, 5, 30, 'standard', 'الباقة المثالية للمبتدئين'),
                (2, 'الباقة الذهبية', 1000, 2.5, 25, 5, 30, 'premium', 'الباقة الأكثر طلباً'),
                (3, 'الباقة الماسية', 5000, 2.5, 125, 5, 30, 'vip', 'للحصول على أفضل العوائد');
            
            -- إضافة البيانات الأولية للمهام
            INSERT INTO tasks (id, title, description, reward, package_categories, difficulty, time_required)
            VALUES 
                (1, 'مشاهدة فيديو تعليمي', 'شاهد فيديو لمدة 2 دقيقة عن أساسيات الاستثمار', 2.5, ARRAY['standard', 'premium', 'vip'], 'easy', 2),
                (2, 'مشاركة رابط الإحالة', 'شارك رابط الإحالة الخاص بك مع صديق واحد على الأقل', 5, ARRAY['premium', 'vip'], 'medium', 3),
                (3, 'تقييم المنصة', 'أكمل استبيان تقييم المنصة (5 أسئلة)', 4, ARRAY['premium', 'vip'], 'easy', 4),
                (4, 'تحليل السوق اليومي', 'اقرأ تحليل السوق اليومي وأجب على سؤال واحد', 6, ARRAY['vip'], 'hard', 5),
                (5, 'مهمة حصرية VIP', 'مهمة خاصة لمستخدمي VIP فقط - استشارة استثمارية', 10, ARRAY['vip'], 'hard', 8);
            
            -- إضافة إعدادات النظام
            INSERT INTO system_settings (key, value)
            VALUES 
                ('referral_settings', '{"referrerReward": 50, "refereeReward": 20, "enableReferralSystem": true, "minPackageForReward": 0, "maxReferralLevels": 1}'::jsonb),
                ('withdrawal_settings', '{"minWithdrawal": 50, "fees": {"TRC20": 5, "ERC20": 15, "BEP20": 3}}'::jsonb);
        `);
    }
}

// ========== دوال المستخدمين ==========

// الحصول على جميع المستخدمين
async function getUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        return [];
    }
}

// الحصول على مستخدم بواسطة ID
async function getUserById(id) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        return null;
    }
}

// الحصول على مستخدم بواسطة اسم المستخدم أو البريد
async function getUserByUsernameOrEmail(usernameOrEmail) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        return null;
    }
}

// الحصول على مستخدم بواسطة كود الإحالة
async function getUserByReferralCode(code) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', code)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        return null;
    }
}

// إضافة مستخدم جديد
async function addUser(userData) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        return null;
    }
}

// تحديث مستخدم
async function updateUser(id, updates) {
    try {
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        return null;
    }
}

// حذف مستخدم
async function deleteUser(id) {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        return false;
    }
}

// ========== دوال الباقات ==========

// الحصول على جميع الباقات
async function getPackages() {
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب الباقات:', error);
        return [];
    }
}

// الحصول على باقة بواسطة ID
async function getPackageById(id) {
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في جلب الباقة:', error);
        return null;
    }
}

// إضافة باقة جديدة
async function addPackage(packageData) {
    try {
        packageData.daily_profit = parseFloat((packageData.price * (packageData.profit || 2.5) / 100).toFixed(2));
        packageData.id = Date.now();
        
        const { data, error } = await supabase
            .from('packages')
            .insert([packageData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة الباقة:', error);
        return null;
    }
}

// تحديث باقة
async function updatePackage(id, updates) {
    try {
        if (updates.price || updates.profit) {
            updates.daily_profit = parseFloat(((updates.price || 0) * (updates.profit || 2.5) / 100).toFixed(2));
        }
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('packages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث الباقة:', error);
        return null;
    }
}

// حذف باقة
async function deletePackage(id) {
    try {
        const { error } = await supabase
            .from('packages')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('خطأ في حذف الباقة:', error);
        return false;
    }
}

// ========== دوال المهام ==========

// الحصول على جميع المهام
async function getTasks() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .order('id', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب المهام:', error);
        return [];
    }
}

// الحصول على مهمة بواسطة ID
async function getTaskById(id) {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في جلب المهمة:', error);
        return null;
    }
}

// إضافة مهمة جديدة
async function addTask(taskData) {
    try {
        taskData.id = Date.now();
        
        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة المهمة:', error);
        return null;
    }
}

// تحديث مهمة
async function updateTask(id, updates) {
    try {
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث المهمة:', error);
        return null;
    }
}

// حذف مهمة
async function deleteTask(id) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('خطأ في حذف المهمة:', error);
        return false;
    }
}

// زيادة عدد مرات إكمال المهمة
async function incrementTaskCompletion(id) {
    try {
        const task = await getTaskById(id);
        if (!task) return 0;
        
        const newCompletions = (task.completions || 0) + 1;
        
        const { data, error } = await supabase
            .from('tasks')
            .update({ completions: newCompletions, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return newCompletions;
    } catch (error) {
        console.error('خطأ في تحديث المهمة:', error);
        return 0;
    }
}

// الحصول على مهام المستخدم حسب بضته
async function getUserTasks(packageCategory) {
    try {
        const allTasks = await getTasks();
        
        return allTasks.filter(task => {
            if (task.status !== 'active') return false;
            if (!task.package_categories) return false;
            return task.package_categories.includes(packageCategory);
        });
    } catch (error) {
        console.error('خطأ في جلب مهام المستخدم:', error);
        return [];
    }
}

// ========== دوال الطلبات المعلقة ==========

// الحصول على جميع الطلبات المعلقة
async function getPendingPackages() {
    try {
        const { data, error } = await supabase
            .from('pending_packages')
            .select('*')
            .eq('status', 'بانتظار المراجعة')
            .order('requested_date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب الطلبات المعلقة:', error);
        return [];
    }
}

// إضافة طلب معلق
async function addPendingPackage(packageData) {
    try {
        packageData.id = Date.now();
        packageData.requested_date = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('pending_packages')
            .insert([packageData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة الطلب المعلق:', error);
        return null;
    }
}

// تحديث طلب معلق
async function updatePendingPackage(id, updates) {
    try {
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('pending_packages')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث الطلب المعلق:', error);
        return null;
    }
}

// حذف طلب معلق
async function deletePendingPackage(id) {
    try {
        const { error } = await supabase
            .from('pending_packages')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('خطأ في حذف الطلب المعلق:', error);
        return false;
    }
}

// ========== دوال المعاملات ==========

// الحصول على معاملات المستخدم
async function getUserTransactions(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب المعاملات:', error);
        return [];
    }
}

// إضافة معاملة
async function addTransaction(transactionData) {
    try {
        transactionData.id = Date.now() + Math.floor(Math.random() * 1000);
        transactionData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('transactions')
            .insert([transactionData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة المعاملة:', error);
        return null;
    }
}

// ========== دوال طلبات السحب ==========

// الحصول على طلبات سحب المستخدم
async function getUserWithdrawals(userId) {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب طلبات السحب:', error);
        return [];
    }
}

// الحصول على جميع طلبات السحب
async function getAllWithdrawals() {
    try {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب طلبات السحب:', error);
        return [];
    }
}

// إضافة طلب سحب
async function addWithdrawal(withdrawalData) {
    try {
        withdrawalData.id = Date.now();
        withdrawalData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('withdrawals')
            .insert([withdrawalData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في إضافة طلب السحب:', error);
        return null;
    }
}

// تحديث طلب سحب
async function updateWithdrawal(id, updates) {
    try {
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('withdrawals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث طلب السحب:', error);
        return null;
    }
}

// ========== دوال إعدادات النظام ==========

// الحصول على إعدادات النظام
async function getSystemSettings(key) {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        
        if (error) throw error;
        return data ? data.value : null;
    } catch (error) {
        console.error('خطأ في جلب إعدادات النظام:', error);
        return null;
    }
}

// تحديث إعدادات النظام
async function updateSystemSettings(key, value) {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({ 
                key, 
                value, 
                updated_at: new Date().toISOString() 
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطأ في تحديث إعدادات النظام:', error);
        return null;
    }
}

// ========== دوال الإحصائيات ==========

// تحديث إحصائيات النظام
async function updateSystemStats() {
    try {
        const users = await getUsers();
        const packages = await getPackages();
        const withdrawals = await getAllWithdrawals();
        const pendingPackages = await getPendingPackages();
        
        let totalDeposits = 0;
        let activeSubscriptions = 0;
        let totalWithdrawals = 0;
        
        users.forEach(user => {
            if (user.package && user.package.status === 'نشط') {
                totalDeposits += user.package.amount || 0;
                activeSubscriptions++;
            }
        });
        
        withdrawals.forEach(w => {
            if (w.status === 'مكتمل') {
                totalWithdrawals += w.amount || 0;
            }
        });
        
        const stats = {
            total_users: users.length,
            total_deposits: totalDeposits,
            total_withdrawals: totalWithdrawals,
            active_subscriptions: activeSubscriptions,
            date: new Date().toISOString().split('T')[0]
        };
        
        const { error } = await supabase
            .from('system_stats')
            .insert([stats]);
        
        if (error) throw error;
        return stats;
    } catch (error) {
        console.error('خطأ في تحديث إحصائيات النظام:', error);
        return null;
    }
}

// الحصول على إحصائيات لوحة التحكم
async function getDashboardStats() {
    try {
        const users = await getUsers();
        const pendingPackages = await getPendingPackages();
        const tasks = await getTasks();
        const withdrawals = await getAllWithdrawals();
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalProfits = 0;
        let activeSubscriptions = 0;
        let pendingWithdrawals = 0;
        let totalReferralEarnings = 0;
        let totalReferrals = 0;
        let suspendedUsers = 0;
        let bannedUsers = 0;
        let activeUsers = 0;
        
        users.forEach(user => {
            if (user.package && user.package.status === 'نشط') {
                totalDeposits += user.package.amount || 0;
                activeSubscriptions++;
            }
            totalProfits += user.total_earned || 0;
            totalReferralEarnings += user.referral_earnings || 0;
            totalReferrals += user.referral_count || 0;
            
            if (user.status === 'active' || !user.status) activeUsers++;
            if (user.status === 'suspended') suspendedUsers++;
            if (user.status === 'banned') bannedUsers++;
        });
        
        withdrawals.forEach(w => {
            if (w.status === 'مكتمل') {
                totalWithdrawals += w.amount;
            }
            if (w.status === 'معلق') {
                pendingWithdrawals++;
            }
        });
        
        const totalCompletions = tasks.reduce((sum, task) => sum + (task.completions || 0), 0);
        const totalTasksReward = tasks.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);
        
        const today = new Date().toDateString();
        const todayDeposits = users
            .filter(u => u.package && new Date(u.package.purchaseDate).toDateString() === today)
            .reduce((sum, u) => sum + (u.package.amount || 0), 0);
        
        return {
            totalUsers: users.length,
            activeUsers: activeUsers,
            suspendedUsers: suspendedUsers,
            bannedUsers: bannedUsers,
            totalDeposits: totalDeposits,
            totalWithdrawals: totalWithdrawals,
            totalProfits: totalProfits,
            activeSubscriptions: activeSubscriptions,
            pendingPackages: pendingPackages.length,
            pendingWithdrawals: pendingWithdrawals,
            totalTasks: tasks.length,
            totalCompletions: totalCompletions,
            totalTasksReward: totalTasksReward,
            totalReferralEarnings: totalReferralEarnings,
            totalReferrals: totalReferrals,
            todayDeposits: todayDeposits,
            netRevenue: totalDeposits - totalWithdrawals,
            packagesCount: packages.length
        };
    } catch (error) {
        console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
        return {};
    }
}

// ========== دوال الإحالة ==========

// توليد كود إحالة فريد
async function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    let isUnique = false;
    let code = '';
    
    while (!isUnique) {
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        code = `${cleanUsername}${random}${timestamp}`.substring(0, 12);
        
        const existing = await getUserByReferralCode(code);
        if (!existing) {
            isUnique = true;
        }
    }
    
    return code;
}

// الحصول على إحصائيات الإحالة للمستخدم
async function getReferralStats(userId) {
    try {
        const users = await getUsers();
        const currentUser = await getUserById(userId);
        
        if (!currentUser) return null;
        
        if (!currentUser.referral_code) {
            const newCode = await generateReferralCode(currentUser.username || `USER${userId}`);
            currentUser.referral_code = newCode;
            await updateUser(userId, { referral_code: newCode });
        }
        
        const referredUsers = users.filter(u => u.referred_by === currentUser.referral_code);
        const activeReferrals = referredUsers.filter(u => u.package && u.package.status === 'نشط');
        const pendingReferrals = referredUsers.filter(u => u.pending_package && !u.package);
        const paidReferrals = referredUsers.filter(u => u.referral_reward_paid === true);
        
        let pendingCommission = 0;
        const referralSettings = await getSystemSettings('referral_settings') || { referrerReward: 50 };
        
        referredUsers.forEach(u => {
            if (u.package && u.package.amount && u.referral_reward_paid !== true) {
                pendingCommission += referralSettings.referrerReward || 50;
            }
        });
        
        return {
            referralCode: currentUser.referral_code || '',
            referredCount: referredUsers.length,
            activeReferrals: activeReferrals.length,
            pendingReferrals: pendingReferrals.length,
            paidReferrals: paidReferrals.length,
            totalEarned: currentUser.referral_earnings || 0,
            pendingCommission: pendingCommission,
            conversionRate: referredUsers.length > 0 ? ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) : 0,
            referredUsers: referredUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                username: u.username,
                joinedDate: u.joined_date,
                hasPackage: !!u.package,
                packageName: u.package ? u.package.name : 'لا يوجد',
                packageAmount: u.package ? u.package.amount : 0,
                rewardPaid: u.referral_reward_paid || false
            }))
        };
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الإحالة:', error);
        return null;
    }
}

// معالجة مكافآت الإحالة
async function processReferralRewardsOnApproval(userId, packageAmount) {
    try {
        const users = await getUsers();
        const newUser = users.find(u => u.id === userId);
        
        if (!newUser || !newUser.referred_by) {
            console.log('⚠️ لا يوجد كود إحالة');
            return false;
        }
        
        const referrer = users.find(u => u.referral_code === newUser.referred_by);
        if (!referrer) {
            console.log('⚠️ لم يتم العثور على صاحب الكود');
            return false;
        }
        
        if (newUser.referral_reward_paid === true) {
            console.log('⚠️ تم صرف المكافأة مسبقاً');
            return false;
        }
        
        const referralSettings = await getSystemSettings('referral_settings') || { referrerReward: 50, refereeReward: 20 };
        const referrerReward = referralSettings.referrerReward || 50;
        const refereeReward = referralSettings.refereeReward || 20;
        
        // تحديث المحال
        await updateUser(newUser.id, {
            balance: (newUser.balance || 0) + refereeReward,
            referral_reward_paid: true,
            referral_reward_amount: refereeReward,
            referral_reward_date: new Date().toISOString()
        });
        
        // تحديث المحيل
        await updateUser(referrer.id, {
            balance: (referrer.balance || 0) + referrerReward,
            referral_count: (referrer.referral_count || 0) + 1,
            referral_earnings: (referrer.referral_earnings || 0) + referrerReward
        });
        
        // إضافة معاملات
        await addTransaction({
            user_id: newUser.id,
            type: 'مكافأة إحالة',
            amount: refereeReward,
            description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
            date: new Date().toLocaleString('ar-SA'),
            status: 'مكتمل',
            referral_code: newUser.referred_by,
            referrer_name: referrer.name
        });
        
        await addTransaction({
            user_id: referrer.id,
            type: 'مكافأة إحالة',
            amount: referrerReward,
            description: `💰 مكافأة إحالة: ${newUser.name}`,
            date: new Date().toLocaleString('ar-SA'),
            status: 'مكتمل',
            referred_user_id: newUser.id,
            referred_user_name: newUser.name
        });
        
        console.log(`✅ تم صرف المكافآت: ${referrerReward}$ للمحيل، ${refereeReward}$ للمحال`);
        
        return {
            referrer: { id: referrer.id, name: referrer.name, reward: referrerReward },
            referee: { id: newUser.id, name: newUser.name, reward: refereeReward }
        };
    } catch (error) {
        console.error('خطأ في معالجة مكافآت الإحالة:', error);
        return false;
    }
}

// ========== تصدير الدوال ==========

window.supabaseDb = {
    // المستخدمين
    getUsers,
    getUserById,
    getUserByUsernameOrEmail,
    getUserByReferralCode,
    addUser,
    updateUser,
    deleteUser,
    
    // الباقات
    getPackages,
    getPackageById,
    addPackage,
    updatePackage,
    deletePackage,
    
    // المهام
    getTasks,
    getTaskById,
    addTask,
    updateTask,
    deleteTask,
    incrementTaskCompletion,
    getUserTasks,
    
    // الطلبات المعلقة
    getPendingPackages,
    addPendingPackage,
    updatePendingPackage,
    deletePendingPackage,
    
    // المعاملات
    getUserTransactions,
    addTransaction,
    
    // طلبات السحب
    getUserWithdrawals,
    getAllWithdrawals,
    addWithdrawal,
    updateWithdrawal,
    
    // إعدادات النظام
    getSystemSettings,
    updateSystemSettings,
    
    // الإحصائيات
    getDashboardStats,
    updateSystemStats,
    
    // الإحالة
    generateReferralCode,
    getReferralStats,
    processReferralRewardsOnApproval
};

console.log('📦 Supabase database module loaded');
</script>