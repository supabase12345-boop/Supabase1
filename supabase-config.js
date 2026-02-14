// ===================================
// ملف: supabase-config.js
// الوصف: إعدادات الاتصال بـ Supabase
// الإصدار: 3.0.0
// ===================================

const SUPABASE_URL = 'https://tmksysprwgsbdmavlshm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80';

// تهيئة عميل Supabase
let supabaseClient = null;

try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
        console.log('✅ تم تهيئة عميل Supabase');
    } else {
        console.warn('⚠️ مكتبة Supabase غير متوفرة');
    }
} catch (error) {
    console.error('❌ فشل تهيئة Supabase:', error);
}

// ========== دوال مساعدة للتعامل مع Supabase ==========
const supabaseHelpers = {
    // ===== دوال المستخدمين =====
    async getAllUsers() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async getUserById(userId) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في جلب المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    async createUser(userData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('users')
                .insert([{
                    ...userData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    async updateUser(userId, updates) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    async loginUser(username, password) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .or(`username.eq.${username},email.eq.${username}`)
                .eq('password', password)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الباقات =====
    async getAllPackages() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .order('price', { ascending: true });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب الباقات:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createPackage(packageData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('packages')
                .insert([{
                    ...packageData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    async updatePackage(packageId, updates) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('packages')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', packageId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    async deletePackage(packageId) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { error } = await supabaseClient
                .from('packages')
                .delete()
                .eq('id', packageId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المهام (الجديدة) =====
    async getAllTasks() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب المهام:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async getTasksByPackage(packageCategory) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .contains('package_categories', [packageCategory])
                .eq('status', 'active')
                .order('reward', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب مهام الباقة:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createTask(taskData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([{
                    title: taskData.title,
                    description: taskData.description,
                    reward: parseFloat(taskData.reward),
                    type: taskData.type || 'daily',
                    status: 'active',
                    package_categories: taskData.packageCategories || ['standard'],
                    difficulty: taskData.difficulty || 'easy',
                    time_required: parseInt(taskData.timeRequired) || 2,
                    icon: taskData.icon || 'fa-tasks',
                    completions: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    async updateTask(taskId, updates) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteTask(taskId) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', taskId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    async incrementTaskCompletion(taskId) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            // أولاً جلب المهمة لمعرفة العدد الحالي
            const { data: task, error: fetchError } = await supabaseClient
                .from('tasks')
                .select('completions')
                .eq('id', taskId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const currentCompletions = task?.completions || 0;
            
            // تحديث العدد
            const { data, error } = await supabaseClient
                .from('tasks')
                .update({
                    completions: currentCompletions + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في زيادة إنجاز المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الطلبات المعلقة =====
    async getPendingPackages() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب الطلبات المعلقة:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createPendingPackage(pendingData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .insert([{
                    ...pendingData,
                    created_at: new Date().toISOString(),
                    status: 'pending'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء طلب معلق:', error);
            return { success: false, error: error.message };
        }
    },

    async updatePendingPackage(pendingId, updates) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .update(updates)
                .eq('id', pendingId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث الطلب المعلق:', error);
            return { success: false, error: error.message };
        }
    },

    async deletePendingPackage(pendingId) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { error } = await supabaseClient
                .from('pending_packages')
                .delete()
                .eq('id', pendingId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('خطأ في حذف الطلب المعلق:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال طلبات السحب =====
    async getWithdrawals() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب طلبات السحب:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createWithdrawal(withdrawalData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .insert([{
                    ...withdrawalData,
                    created_at: new Date().toISOString(),
                    status: 'pending'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء طلب سحب:', error);
            return { success: false, error: error.message };
        }
    },

    async updateWithdrawal(withdrawalId, updates) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', withdrawalId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في تحديث طلب السحب:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المعاملات =====
    async getTransactions(userId = null) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            let query = supabaseClient
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('خطأ في جلب المعاملات:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createTransaction(transactionData) {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert([{
                    ...transactionData,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('خطأ في إنشاء معاملة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الإحصائيات =====
    async getDashboardStats() {
        try {
            if (!supabaseClient) throw new Error('Supabase غير مهيأ');
            
            // جلب عدد المستخدمين
            const { count: usersCount, error: usersError } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            // جلب عدد الباقات
            const { count: packagesCount, error: packagesError } = await supabaseClient
                .from('packages')
                .select('*', { count: 'exact', head: true });
            
            // جلب عدد المهام
            const { count: tasksCount, error: tasksError } = await supabaseClient
                .from('tasks')
                .select('*', { count: 'exact', head: true });
            
            // جلب الطلبات المعلقة
            const { count: pendingCount, error: pendingError } = await supabaseClient
                .from('pending_packages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            
            // جلب طلبات السحب المعلقة
            const { count: withdrawalsCount, error: withdrawalsError } = await supabaseClient
                .from('withdrawals')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            
            if (usersError || packagesError || tasksError || pendingError || withdrawalsError) {
                throw new Error('خطأ في جلب الإحصائيات');
            }
            
            return {
                success: true,
                data: {
                    users: usersCount || 0,
                    packages: packagesCount || 0,
                    tasks: tasksCount || 0,
                    pending: pendingCount || 0,
                    withdrawals: withdrawalsCount || 0
                }
            };
        } catch (error) {
            console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
            return { success: false, error: error.message };
        }
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.supabaseHelpers = supabaseHelpers;
}

// تصدير للاستخدام في وحدات ES
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, supabaseHelpers };
}