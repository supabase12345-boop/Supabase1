// ========== إعدادات Supabase ==========
const SUPABASE_URL = "https://tmksysprwgsbdmavlshm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80";

// تهيئة عميل Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

// ========== دوال المساعدة لـ Supabase ==========
window.supabaseHelpers = {
    
    // ===== المستخدمين =====
    async getAllUsers() {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*, packages(*)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            return { success: false, error };
        }
    },

    async getUserById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*, packages(*)')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المستخدم:', error);
            return { success: false, error };
        }
    },

    async getUserByEmail(email) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = لا يوجد بيانات
            return { success: !error, data };
        } catch (error) {
            console.error('خطأ في جلب المستخدم بالبريد:', error);
            return { success: false, error };
        }
    },

    async getUserByUsername(username) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return { success: !error, data };
        } catch (error) {
            console.error('خطأ في جلب المستخدم باسم المستخدم:', error);
            return { success: false, error };
        }
    },

    async createUser(user) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .insert([user])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء المستخدم:', error);
            return { success: false, error };
        }
    },

    async updateUser(id, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث المستخدم:', error);
            return { success: false, error };
        }
    },

    async loginUser(email, password) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*, packages(*)')
                .eq('email', email)
                .eq('password', password)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            return { success: false, error };
        }
    },

    // ===== الباقات =====
    async getAllPackages() {
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .order('price', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الباقات:', error);
            return { success: false, error };
        }
    },

    async getActivePackages() {
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .eq('status', 'active')
                .order('price', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الباقات النشطة:', error);
            return { success: false, error };
        }
    },

    async getPackageById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الباقة:', error);
            return { success: false, error };
        }
    },

    async createPackage(pkg) {
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .insert([pkg])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء الباقة:', error);
            return { success: false, error };
        }
    },

    async updatePackage(id, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('packages')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث الباقة:', error);
            return { success: false, error };
        }
    },

    async deletePackage(id) {
        try {
            const { error } = await supabaseClient
                .from('packages')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف الباقة:', error);
            return { success: false, error };
        }
    },

    // ===== المهام =====
    async getAllTasks() {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المهام:', error);
            return { success: false, error };
        }
    },

    async getTasksByPackage(packageCategory) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .contains('package_categories', [packageCategory])
                .eq('status', 'active');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب مهام الباقة:', error);
            return { success: false, error };
        }
    },

    async createTask(task) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([task])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء المهمة:', error);
            return { success: false, error };
        }
    },

    async updateTask(id, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث المهمة:', error);
            return { success: false, error };
        }
    },

    async deleteTask(id) {
        try {
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف المهمة:', error);
            return { success: false, error };
        }
    },

    async incrementTaskCompletion(taskId) {
        try {
            // أولاً جلب المهمة
            const { data: task, error: fetchError } = await supabaseClient
                .from('tasks')
                .select('completions')
                .eq('id', taskId)
                .single();
            
            if (fetchError) throw fetchError;
            
            // ثم تحديثها
            const { data, error } = await supabaseClient
                .from('tasks')
                .update({ completions: (task.completions || 0) + 1 })
                .eq('id', taskId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في زيادة إنجازات المهمة:', error);
            return { success: false, error };
        }
    },

    // ===== الطلبات المعلقة =====
    async getPendingPackages() {
        try {
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .select('*, users(name, email), packages(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الطلبات المعلقة:', error);
            return { success: false, error };
        }
    },

    async getPendingPackageById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .select('*, users(*), packages(*)')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب الطلب المعلق:', error);
            return { success: false, error };
        }
    },

    async createPendingPackage(pending) {
        try {
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .insert([pending])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء الطلب المعلق:', error);
            return { success: false, error };
        }
    },

    async updatePendingPackage(id, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث الطلب المعلق:', error);
            return { success: false, error };
        }
    },

    async deletePendingPackage(id) {
        try {
            const { error } = await supabaseClient
                .from('pending_packages')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف الطلب المعلق:', error);
            return { success: false, error };
        }
    },

    // ===== طلبات السحب =====
    async getWithdrawals() {
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*, users(name, email)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب طلبات السحب:', error);
            return { success: false, error };
        }
    },

    async getUserWithdrawals(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب طلبات سحب المستخدم:', error);
            return { success: false, error };
        }
    },

    async getPendingWithdrawals() {
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*, users(name, email)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب طلبات السحب المعلقة:', error);
            return { success: false, error };
        }
    },

    async createWithdrawal(withdrawal) {
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .insert([withdrawal])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء طلب السحب:', error);
            return { success: false, error };
        }
    },

    async updateWithdrawal(id, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث طلب السحب:', error);
            return { success: false, error };
        }
    },

    // ===== المعاملات =====
    async getTransactions() {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*, users(name)')
                .order('created_at', { ascending: false })
                .limit(500);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المعاملات:', error);
            return { success: false, error };
        }
    },

    async getUserTransactions(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب معاملات المستخدم:', error);
            return { success: false, error };
        }
    },

    async createTransaction(transaction) {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert([transaction])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء المعاملة:', error);
            return { success: false, error };
        }
    },

    // ===== إحصائيات لوحة التحكم =====
    async getDashboardStats() {
        try {
            const [users, activeUsers, subscribers, tasks, pending, withdrawals] = await Promise.all([
                supabaseClient.from('users').select('*', { count: 'exact', head: true }),
                supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabaseClient.from('users').select('*', { count: 'exact', head: true }).not('package_id', 'is', null),
                supabaseClient.from('tasks').select('*', { count: 'exact', head: true }),
                supabaseClient.from('pending_packages').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabaseClient.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            return {
                success: true,
                data: {
                    users: users.count || 0,
                    activeUsers: activeUsers.count || 0,
                    subscribers: subscribers.count || 0,
                    tasks: tasks.count || 0,
                    pending: pending.count || 0,
                    withdrawals: withdrawals.count || 0
                }
            };
        } catch (error) {
            console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
            return { success: false, error };
        }
    },

    // ===== دوال إضافية =====
    async getReferralStats(referralCode) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('referred_by', referralCode);
            
            if (error) throw error;
            
            const total = data.length;
            const active = data.filter(u => u.package_id).length;
            const pending = data.filter(u => !u.package_id && u.pending_package).length;
            
            return {
                success: true,
                data: {
                    total,
                    active,
                    pending,
                    users: data
                }
            };
        } catch (error) {
            console.error('خطأ في جلب إحصائيات الإحالة:', error);
            return { success: false, error };
        }
    },

    async checkExistingUser(email, username) {
        try {
            const [emailCheck, usernameCheck] = await Promise.all([
                supabaseClient.from('users').select('id').eq('email', email).maybeSingle(),
                supabaseClient.from('users').select('id').eq('username', username).maybeSingle()
            ]);
            
            return {
                success: true,
                data: {
                    emailExists: !!emailCheck.data,
                    usernameExists: !!usernameCheck.data
                }
            };
        } catch (error) {
            console.error('خطأ في التحقق من وجود المستخدم:', error);
            return { success: false, error };
        }
    }
};

// التحقق من الاتصال
window.checkSupabaseConnection = async function() {
    try {
        const { error } = await supabaseClient.from('users').select('count', { count: 'exact', head: true });
        return !error;
    } catch (e) {
        return false;
    }
};

console.log('✅ تم تحميل إعدادات Supabase');