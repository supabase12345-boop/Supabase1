// ===================================
// ملف تهيئة Supabase - الإصدار النهائي المصحح
// ===================================

// ========== إعدادات الاتصال ==========
const SUPABASE_URL = 'https://wabyirjjhndrwxvcrdvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYnlpcmpqaG5kcnd4dmNyZHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTM0OTAsImV4cCI6MjA4NjQ2OTQ5MH0.AWDpHfWQLBto-Jn8_9fO0UmPS5Da9pgX611Bl6Q6u2w';

// ========== كائن Supabase العام ==========
let supabase = null;

// ========== تهيئة فورية لـ Supabase ==========
(function initSupabaseClient() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storage: localStorage,
                    storageKey: 'supabase.auth.token'
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'x-application-name': 'elite-investors'
                    }
                }
            });
            console.log('✅ Supabase connected successfully');
        } else {
            console.error('❌ Supabase library not loaded');
            // محاولة تحميل المكتبة مرة أخرى
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: { persistSession: true }
                });
                console.log('✅ Supabase loaded and connected');
            };
            document.head.appendChild(script);
        }
    } catch (error) {
        console.error('❌ Supabase initialization error:', error);
    }
})();

// ========== دوال التحقق ==========
const SupabaseUtils = {
    // التحقق من الاتصال
    async checkConnection() {
        try {
            if (!supabase) return { success: false, error: 'Supabase not initialized' };
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error) throw error;
            return { success: true, message: 'Connected successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على عميل Supabase
    getClient() {
        return supabase;
    },

    // تهيئة يدوية
    async init() {
        if (supabase) return { success: true };
        return this.checkConnection();
    }
};

// ========== دوال المصادقة ==========
const SupabaseAuth = {
    // تسجيل الدخول
    async signIn(email, password) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // تسجيل الخروج
    async signOut() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    },

    // الحصول على المستخدم الحالي
    async getCurrentUser() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على الجلسة الحالية
    async getSession() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { success: true, session };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // التحقق من صلاحية المشرف
    async checkAdminAccess() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'غير مصرح' };
            
            const { data, error } = await supabase
                .from('users')
                .select('is_admin')
                .eq('id', parseInt(user.id))
                .single();
                
            if (error) throw error;
            return { success: true, isAdmin: data?.is_admin || false };
        } catch (error) {
            console.error('Admin check error:', error);
            return { success: false, error: error.message };
        }
    },

    // تحديث الجلسة
    async refreshSession() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إعادة تعيين كلمة المرور
    async resetPassword(email) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال المستخدمين ==========
const SupabaseUsers = {
    // الحصول على جميع المستخدمين
    async getAll() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: false, error: error.message };
        }
    },

    // الحصول على مستخدم حسب ID
    async getById(id) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على مستخدم حسب البريد الإلكتروني
    async getByEmail(email) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على مستخدم حسب اسم المستخدم
    async getByUsername(username) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .maybeSingle();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إنشاء مستخدم جديد
    async create(userData) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            // التحقق من عدم تكرار البريد
            const existingEmail = await this.getByEmail(userData.email);
            if (existingEmail.success && existingEmail.data) {
                return { success: false, error: 'البريد الإلكتروني موجود مسبقاً' };
            }
            
            // التحقق من عدم تكرار اسم المستخدم
            const existingUsername = await this.getByUsername(userData.username);
            if (existingUsername.success && existingUsername.data) {
                return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
            }
            
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    id: userData.id,
                    name: userData.name,
                    username: userData.username,
                    email: userData.email,
                    phone: userData.phone,
                    password: userData.password,
                    referred_by: userData.referred_by || null,
                    balance: userData.balance || 0,
                    is_admin: userData.is_admin || false,
                    status: userData.status || 'active',
                    joined_date: userData.joined_date || new Date().toISOString(),
                    last_login: userData.last_login || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    },

    // تحديث مستخدم
    async update(id, updates) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // حذف مستخدم
    async delete(id) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // تحديث حالة المستخدم
    async updateStatus(id, status, reason = '') {
        return await this.update(id, { 
            status, 
            status_reason: reason,
            status_updated_at: new Date().toISOString()
        });
    },

    // إضافة رصيد
    async addBalance(id, amount, reason) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const user = await this.getById(id);
            if (!user.success) return user;
            
            const newBalance = (user.data.balance || 0) + amount;
            
            const result = await this.update(id, { 
                balance: newBalance,
                total_earned: amount > 0 ? (user.data.total_earned || 0) + amount : user.data.total_earned
            });
            
            if (result.success) {
                await SupabaseTransactions.create({
                    user_id: id,
                    type: amount > 0 ? 'إضافة رصيد' : 'خصم رصيد',
                    amount: Math.abs(amount),
                    description: reason,
                    admin: true,
                    date: new Date().toISOString()
                });
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إحصائيات المستخدمين
    async getStats() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const { count: total } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
                
            const { count: active } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
                
            const { count: suspended } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'suspended');
                
            const { count: banned } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'banned');
                
            const { count: withPackage } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .not('package', 'is', null);
                
            const { data: balances } = await supabase
                .from('users')
                .select('balance');
                
            const totalBalance = balances?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
            
            return {
                success: true,
                data: {
                    total: total || 0,
                    active: active || 0,
                    suspended: suspended || 0,
                    banned: banned || 0,
                    withPackage: withPackage || 0,
                    totalBalance: totalBalance
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال الباقات ==========
const SupabasePackages = {
    // الحصول على جميع الباقات النشطة
    async getAll() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .eq('status', 'active')
                .order('price', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching packages:', error);
            return { success: false, error: error.message };
        }
    },

    // الحصول على باقة حسب ID
    async getById(id) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('packages')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إضافة باقة جديدة
    async create(packageData) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const dailyProfit = (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2);
            
            const { data, error } = await supabase
                .from('packages')
                .insert([{
                    id: Date.now(),
                    name: packageData.name,
                    price: packageData.price,
                    profit: packageData.profit || 2.5,
                    daily_profit: parseFloat(dailyProfit),
                    tasks: packageData.tasks || 5,
                    duration: packageData.duration || 30,
                    status: 'active',
                    category: packageData.category || 'standard',
                    description: packageData.description || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // تحديث باقة
    async update(id, updates) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            if (updates.price || updates.profit) {
                const pkg = await this.getById(id);
                if (pkg.success) {
                    const price = updates.price || pkg.data.price;
                    const profit = updates.profit || pkg.data.profit;
                    updates.daily_profit = parseFloat((price * profit / 100).toFixed(2));
                }
            }
            
            const { data, error } = await supabase
                .from('packages')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // حذف باقة (تعطيل)
    async delete(id) {
        return await this.update(id, { status: 'deleted' });
    }
};

// ========== دوال المهام ==========
const SupabaseTasks = {
    // الحصول على جميع المهام
    async getAll() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'active')
                .order('reward', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return { success: false, error: error.message };
        }
    },

    // الحصول على مهمة حسب ID
    async getById(id) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إضافة مهمة
    async create(taskData) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    id: Date.now(),
                    title: taskData.title,
                    description: taskData.description,
                    reward: taskData.reward,
                    type: taskData.type || 'daily',
                    status: 'active',
                    completions: 0,
                    available_for: taskData.availableFor || 'all',
                    package_categories: taskData.packageCategories || ['standard', 'premium', 'vip'],
                    difficulty: taskData.difficulty || 'easy',
                    time_required: taskData.timeRequired || 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // تحديث مهمة
    async update(id, updates) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('tasks')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // حذف مهمة
    async delete(id) {
        return await this.update(id, { status: 'deleted' });
    },

    // زيادة عدد الإكمالات
    async incrementCompletion(taskId) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const task = await this.getById(taskId);
            if (!task.success) throw new Error('Task not found');
            
            const { data, error } = await supabase
                .from('tasks')
                .update({ 
                    completions: (task.data.completions || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على المهام حسب الفئة
    async getByCategory(category) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'active')
                .contains('package_categories', [category]);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال الطلبات المعلقة ==========
const SupabasePending = {
    // الحصول على جميع الطلبات المعلقة
    async getAll() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('pending_packages')
                .select('*')
                .eq('status', 'بانتظار المراجعة')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على طلب حسب ID
    async getById(id) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('pending_packages')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إنشاء طلب جديد
    async create(requestData) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('pending_packages')
                .insert([{
                    ...requestData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // قبول طلب
    async approve(id, adminId, notes = '') {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('pending_packages')
                .update({
                    status: 'مقبول',
                    processed_by: adminId,
                    processed_date: new Date().toISOString(),
                    notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // رفض طلب
    async reject(id, adminId, notes = '') {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('pending_packages')
                .update({
                    status: 'مرفوض',
                    processed_by: adminId,
                    processed_date: new Date().toISOString(),
                    notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال طلبات السحب ==========
const SupabaseWithdrawals = {
    // الحصول على جميع طلبات السحب
    async getAll(status = null) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            let query = supabase
                .from('withdrawals')
                .select(`
                    *,
                    users:user_id (name, email)
                `)
                .order('created_at', { ascending: false });
                
            if (status) {
                query = query.eq('status', status);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على طلبات سحب مستخدم
    async getByUser(userId) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إنشاء طلب سحب
    async create(userId, amount, wallet, network) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const fees = { TRC20: 5, ERC20: 15, BEP20: 3 };
            const fee = fees[network] || 5;
            const total = amount + fee;
            
            const { data, error } = await supabase
                .from('withdrawals')
                .insert([{
                    user_id: userId,
                    amount,
                    wallet_address: wallet,
                    network,
                    fee,
                    total,
                    status: 'معلق',
                    date: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // معالجة طلب سحب
    async process(id, status, txHash = '', notes = '') {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('withdrawals')
                .update({
                    status,
                    tx_hash: txHash,
                    processor_notes: notes,
                    processed_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // إحصائيات السحب
    async getStats() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*');
                
            if (error) throw error;
            
            const totalWithdrawn = data
                .filter(w => w.status === 'مكتمل')
                .reduce((sum, w) => sum + (w.amount || 0), 0);
                
            const pendingCount = data.filter(w => w.status === 'معلق').length;
            const completedCount = data.filter(w => w.status === 'مكتمل').length;
            const rejectedCount = data.filter(w => w.status === 'مرفوض').length;
            
            return {
                success: true,
                data: {
                    total: data.length,
                    pending: pendingCount,
                    completed: completedCount,
                    rejected: rejectedCount,
                    totalWithdrawn
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال الإحالة ==========
const SupabaseReferrals = {
    // إنشاء كود إحالة
    async generateCode(userId, username) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const code = `${username.toUpperCase().replace(/\s/g, '').substring(0, 5)}${Math.random().toString(36).substring(2, 7).toUpperCase()}${Date.now().toString().slice(-4)}`.substring(0, 12);
            
            const { data, error } = await supabase
                .from('users')
                .update({ 
                    referral_code: code,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على إحصائيات الإحالة
    async getStats(userId) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const user = await SupabaseUsers.getById(userId);
            if (!user.success || !user.data) return null;
            
            if (!user.data.referral_code) {
                await this.generateCode(userId, user.data.username || `user_${userId}`);
                return this.getStats(userId);
            }
            
            const { data: referrals } = await supabase
                .from('users')
                .select('*')
                .eq('referred_by', user.data.referral_code);
                
            const referredUsers = referrals || [];
            const activeReferrals = referredUsers.filter(u => u.package).length;
            const pendingReferrals = referredUsers.filter(u => u.pending_package && !u.package).length;
            
            let pendingCommission = 0;
            referredUsers.forEach(u => {
                if (u.package && !u.referral_reward_paid) {
                    pendingCommission += 50;
                }
            });
            
            return {
                referralCode: user.data.referral_code,
                referredCount: referredUsers.length,
                activeReferrals,
                pendingReferrals,
                paidReferrals: referredUsers.filter(u => u.referral_reward_paid).length,
                totalEarned: user.data.referral_earnings || 0,
                pendingCommission,
                conversionRate: referredUsers.length > 0 ? ((activeReferrals / referredUsers.length) * 100).toFixed(1) : 0,
                referredUsers: referredUsers.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    joinedDate: u.joined_date,
                    hasPackage: !!u.package,
                    packageName: u.package?.name,
                    packageAmount: u.package?.amount,
                    rewardPaid: u.referral_reward_paid || false
                }))
            };
        } catch (error) {
            console.error('Error getting referral stats:', error);
            return null;
        }
    },

    // معالجة مكافأة الإحالة
    async processReward(newUserId, packageAmount) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const newUser = await SupabaseUsers.getById(newUserId);
            if (!newUser.success || !newUser.data.referred_by) {
                return { success: false, error: 'لا يوجد كود إحالة' };
            }
            
            const { data: referrer, error: refError } = await supabase
                .from('users')
                .select('*')
                .eq('referral_code', newUser.data.referred_by)
                .single();
                
            if (refError || !referrer) {
                return { success: false, error: 'لم يتم العثور على صاحب الكود' };
            }
            
            const REFERRER_REWARD = 50;
            const REFEREE_REWARD = 20;
            
            // مكافأة المحال
            await SupabaseUsers.addBalance(
                newUserId, 
                REFEREE_REWARD, 
                `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`
            );
            
            // مكافأة المحيل
            await SupabaseUsers.addBalance(
                referrer.id, 
                REFERRER_REWARD, 
                `💰 مكافأة إحالة: ${newUser.data.name}`
            );
            
            // تحديث إحصائيات المحيل
            await SupabaseUsers.update(referrer.id, {
                referral_count: (referrer.referral_count || 0) + 1,
                referral_earnings: (referrer.referral_earnings || 0) + REFERRER_REWARD
            });
            
            // تحديث حالة مكافأة المحال
            await SupabaseUsers.update(newUserId, {
                referral_reward_paid: true,
                referral_reward_amount: REFEREE_REWARD,
                referral_reward_date: new Date().toISOString()
            });
            
            // تسجيل الإحالة
            await supabase
                .from('referrals')
                .insert([{
                    referrer_id: referrer.id,
                    referred_id: newUserId,
                    referral_code: newUser.data.referred_by,
                    package_amount: packageAmount,
                    commission_paid: true,
                    commission_amount: REFERRER_REWARD,
                    paid_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }]);
            
            return { 
                success: true,
                referrer: { id: referrer.id, name: referrer.name, reward: REFERRER_REWARD },
                referee: { id: newUserId, name: newUser.data.name, reward: REFEREE_REWARD }
            };
        } catch (error) {
            console.error('Error processing referral reward:', error);
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال المعاملات ==========
const SupabaseTransactions = {
    // إنشاء معاملة
    async create(transaction) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('transactions')
                .insert([{
                    ...transaction,
                    date: transaction.date || new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على معاملات المستخدم
    async getUserTransactions(userId, limit = 50) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // الحصول على جميع المعاملات
    async getAll(limit = 100) {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            const { data, error } = await supabase
                .from('transactions')
                .select('*, users:user_id(name, email)')
                .order('date', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دوال الإحصائيات ==========
const SupabaseStats = {
    // إحصائيات لوحة التحكم
    async getDashboardStats() {
        try {
            if (!supabase) throw new Error('Supabase not initialized');
            
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
                
            const { count: activeUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
                
            const { count: suspendedUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'suspended');
                
            const { count: bannedUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'banned');
                
            const { count: activeSubscriptions } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .not('package', 'is', null);
                
            const { count: pendingPackages } = await supabase
                .from('pending_packages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'بانتظار المراجعة');
                
            const withdrawals = await SupabaseWithdrawals.getStats();
            
            return {
                success: true,
                data: {
                    totalUsers: totalUsers || 0,
                    activeUsers: activeUsers || 0,
                    suspendedUsers: suspendedUsers || 0,
                    bannedUsers: bannedUsers || 0,
                    activeSubscriptions: activeSubscriptions || 0,
                    pendingPackages: pendingPackages || 0,
                    pendingWithdrawals: withdrawals.success ? withdrawals.data.pending : 0,
                    totalWithdrawals: withdrawals.success ? withdrawals.data.totalWithdrawn : 0
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ========== دالة التهيئة ==========
async function initSupabase() {
    if (!supabase) {
        console.warn('⏳ Supabase not initialized, retrying...');
        setTimeout(initSupabase, 100);
        return;
    }
    
    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connection verified');
        return { success: true };
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return { success: false, error: error.message };
    }
}

// ========== تصدير للاستخدام العام ==========
window.SupabaseClient = {
    // العميل
    client: supabase,
    getClient: SupabaseUtils.getClient,
    
    // التحقق
    checkConnection: SupabaseUtils.checkConnection,
    init: initSupabase,
    
    // المصادقة
    auth: SupabaseAuth,
    
    // المستخدمين
    users: SupabaseUsers,
    
    // الباقات
    packages: SupabasePackages,
    
    // المهام
    tasks: SupabaseTasks,
    
    // الطلبات المعلقة
    pending: SupabasePending,
    
    // طلبات السحب
    withdrawals: SupabaseWithdrawals,
    
    // الإحالة
    referrals: SupabaseReferrals,
    
    // المعاملات
    transactions: SupabaseTransactions,
    
    // الإحصائيات
    stats: SupabaseStats
};

// ========== تهيئة تلقائية ==========
if (typeof window !== 'undefined') {
    // تنفيذ التهيئة بعد تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initSupabase());
    } else {
        initSupabase();
    }
}

console.log('📦 SupabaseClient loaded and ready');