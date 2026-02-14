// ===================================
// ملف: supabase-config.js
// الوصف: إعدادات Supabase - نسخة مبسطة للهاتف
// الإصدار: 1.0.0
// ===================================

// معلومات الاتصال بـ Supabase
const SUPABASE_URL = 'https://tmksysprwgsbdmavlshm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80';

// إنشاء عميل Supabase
let supabaseClient = null;
let supabaseAvailable = false;

// محاولة الاتصال
try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseAvailable = true;
        console.log('✅ Supabase متصل');
    } else {
        console.log('⚠️ مكتبة Supabase غير موجودة');
    }
} catch (e) {
    console.log('❌ خطأ في الاتصال:', e);
}

// دوال بسيطة للتعامل مع Supabase
const supabaseHelpers = {
    // التحقق من الاتصال
    isAvailable() {
        return supabaseAvailable && supabaseClient !== null;
    },

    // جلب جميع المستخدمين
    async getAllUsers() {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('users').select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // جلب مستخدم بواسطة ID
    async getUserById(id) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // تسجيل الدخول
    async loginUser(username, password) {
        if (!this.isAvailable()) return { success: false };
        try {
            // بالبريد
            let { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', username)
                .eq('password', password)
                .maybeSingle();
            
            // بالاسم
            if (!data) {
                const res = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .maybeSingle();
                data = res.data;
            }
            
            return { success: !!data, data };
        } catch (e) {
            return { success: false };
        }
    },

    // إنشاء مستخدم
    async createUser(user) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .insert([{
                    id: Date.now(),
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone || '',
                    password: user.password,
                    balance: 0,
                    status: 'active',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // تحديث مستخدم
    async updateUser(id, updates) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // جلب جميع الباقات
    async getAllPackages() {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('packages').select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // إنشاء باقة
    async createPackage(pkg) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .insert([{
                    id: Date.now(),
                    name: pkg.name,
                    price: pkg.price,
                    profit: pkg.profit || 2.5,
                    category: pkg.category || 'standard',
                    tasks: pkg.tasks || 5,
                    duration: pkg.duration || 30,
                    status: 'active',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // حذف باقة
    async deletePackage(id) {
        if (!this.isAvailable()) return { success: false };
        try {
            await supabaseClient.from('packages').delete().eq('id', id);
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    // جلب جميع المهام
    async getAllTasks() {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('tasks').select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // إنشاء مهمة
    async createTask(task) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([{
                    id: Date.now(),
                    title: task.title,
                    description: task.description || '',
                    reward: task.reward,
                    package_categories: task.packageCategories || ['standard'],
                    difficulty: task.difficulty || 'easy',
                    time_required: task.timeRequired || 5,
                    status: 'active',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // حذف مهمة
    async deleteTask(id) {
        if (!this.isAvailable()) return { success: false };
        try {
            await supabaseClient.from('tasks').delete().eq('id', id);
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    // جلب الطلبات المعلقة
    async getPendingPackages() {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('pending_packages').select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // إنشاء طلب معلق
    async createPendingPackage(p) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .insert([{
                    id: Date.now(),
                    user_id: p.userId,
                    user_name: p.userName,
                    package_name: p.packageName,
                    amount: p.amount,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // حذف طلب معلق
    async deletePendingPackage(id) {
        if (!this.isAvailable()) return { success: false };
        try {
            await supabaseClient.from('pending_packages').delete().eq('id', id);
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    },

    // جلب طلبات السحب
    async getWithdrawals() {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            const { data, error } = await supabaseClient.from('withdrawals').select('*');
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // إنشاء طلب سحب
    async createWithdrawal(w) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .insert([{
                    id: Date.now(),
                    user_id: w.userId,
                    user_name: w.userName,
                    amount: w.amount,
                    wallet: w.wallet,
                    network: w.network || 'TRC20',
                    fee: w.fee || 5,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // تحديث طلب سحب
    async updateWithdrawal(id, updates) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // جلب المعاملات
    async getTransactions(userId = null) {
        if (!this.isAvailable()) return { success: false, data: [] };
        try {
            let query = supabaseClient.from('transactions').select('*');
            if (userId) query = query.eq('user_id', userId);
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (e) {
            return { success: false, data: [] };
        }
    },

    // إنشاء معاملة
    async createTransaction(t) {
        if (!this.isAvailable()) return { success: false };
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert([{
                    id: Date.now(),
                    user_id: t.userId,
                    type: t.type,
                    amount: t.amount,
                    description: t.description || '',
                    status: t.status || 'completed',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (e) {
            return { success: false };
        }
    },

    // إحصائيات سريعة
    async getDashboardStats() {
        if (!this.isAvailable()) return { success: false };
        try {
            const { count: users } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
            const { count: packages } = await supabaseClient.from('packages').select('*', { count: 'exact', head: true });
            const { count: tasks } = await supabaseClient.from('tasks').select('*', { count: 'exact', head: true });
            const { count: pending } = await supabaseClient.from('pending_packages').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            
            return { 
                success: true, 
                data: { 
                    users: users || 0, 
                    packages: packages || 0, 
                    tasks: tasks || 0, 
                    pending: pending || 0 
                } 
            };
        } catch (e) {
            return { success: false };
        }
    }
};

// تصدير للاستخدام
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.supabaseHelpers = supabaseHelpers;
    window.supabaseAvailable = supabaseAvailable;
    console.log('✅ Supabase Config جاهز');
}