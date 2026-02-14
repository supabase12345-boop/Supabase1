// ===================================
// ملف: supabase-config.js
// الوصف: إعدادات الاتصال بـ Supabase
// الإصدار: 3.0.0 - نسخة مستقرة
// ===================================

// معلومات الاتصال بـ Supabase
const SUPABASE_URL = 'https://tmksysprwgsbdmavlshm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80';

// تهيئة عميل Supabase
let supabaseClient = null;
let supabaseAvailable = false;

// التحقق من وجود مكتبة Supabase
if (typeof window !== 'undefined') {
    try {
        if (window.supabase) {
            // إنشاء عميل Supabase
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false
                }
            });
            
            supabaseAvailable = true;
            console.log('✅ Supabase connected successfully');
        } else {
            console.warn('⚠️ Supabase library not loaded');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
    }
}

// ========== دوال مساعدة للتعامل مع Supabase ==========
const supabaseHelpers = {
    // التحقق من التوفر
    isAvailable() {
        return supabaseAvailable && supabaseClient !== null;
    },

    // ===== دوال المستخدمين =====
    async getAllUsers() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async getUserById(userId) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user:', error);
            return { success: false, error: error.message };
        }
    },

    async loginUser(username, password) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            // البحث بالبريد الإلكتروني
            let { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', username)
                .eq('password', password)
                .maybeSingle();
            
            // إذا لم يجد، ابحث باسم المستخدم
            if (!data && !error) {
                const result = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .maybeSingle();
                
                data = result.data;
                error = result.error;
            }
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message };
        }
    },

    async createUser(userData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const newUser = {
                id: userData.id || Date.now(),
                name: userData.name || '',
                username: userData.username || '',
                email: userData.email || '',
                phone: userData.phone || '',
                password: userData.password || '',
                balance: userData.balance || 0,
                total_earned: userData.total_earned || 0,
                tasks_completed: userData.tasks_completed || 0,
                referral_code: userData.referral_code || userData.referralCode || null,
                referred_by: userData.referred_by || userData.referredBy || null,
                status: userData.status || 'active',
                is_admin: userData.is_admin || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    },

    async updateUser(userId, updates) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
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
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الباقات =====
    async getAllPackages() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .order('price', { ascending: true });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching packages:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createPackage(packageData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const dailyProfit = (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2);
            
            const newPackage = {
                id: packageData.id || Date.now(),
                name: packageData.name,
                price: parseFloat(packageData.price),
                profit: parseFloat(packageData.profit || 2.5),
                daily_profit: parseFloat(dailyProfit),
                tasks_count: parseInt(packageData.tasks || packageData.tasks_count || 5),
                duration: parseInt(packageData.duration || 30),
                category: packageData.category || 'standard',
                icon: packageData.icon || 'fa-bolt',
                color: packageData.color || '#3b82f6',
                features: packageData.features || ['ربح يومي', 'مهام يومية', 'دعم فني'],
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('packages')
                .insert([newPackage])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating package:', error);
            return { success: false, error: error.message };
        }
    },

    async deletePackage(packageId) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const { error } = await supabaseClient
                .from('packages')
                .delete()
                .eq('id', packageId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting package:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المهام =====
    async getAllTasks() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createTask(taskData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const newTask = {
                id: taskData.id || Date.now(),
                title: taskData.title,
                description: taskData.description || '',
                reward: parseFloat(taskData.reward),
                type: taskData.type || 'daily',
                status: 'active',
                package_categories: taskData.packageCategories || taskData.package_categories || ['standard'],
                difficulty: taskData.difficulty || 'easy',
                time_required: parseInt(taskData.timeRequired || taskData.time_required || 5),
                icon: taskData.icon || 'fa-tasks',
                completions: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([newTask])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating task:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteTask(taskId) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', taskId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting task:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الطلبات المعلقة =====
    async getPendingPackages() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching pending packages:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createPendingPackage(pendingData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const newPending = {
                id: pendingData.id || Date.now(),
                user_id: pendingData.user_id || pendingData.userId,
                user_name: pendingData.user_name || pendingData.userName,
                user_email: pendingData.user_email || pendingData.userEmail,
                package_id: pendingData.package_id || pendingData.packageId,
                package_name: pendingData.package_name || pendingData.packageName,
                amount: parseFloat(pendingData.amount),
                referred_by: pendingData.referred_by || pendingData.referredBy,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .insert([newPending])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating pending package:', error);
            return { success: false, error: error.message };
        }
    },

    async deletePendingPackage(pendingId) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const { error } = await supabaseClient
                .from('pending_packages')
                .delete()
                .eq('id', pendingId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting pending package:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال طلبات السحب =====
    async getWithdrawals() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createWithdrawal(withdrawalData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const fee = withdrawalData.fee || 
                       (withdrawalData.network === 'TRC20' ? 5 : 
                        withdrawalData.network === 'ERC20' ? 15 : 3);
            
            const newWithdrawal = {
                id: withdrawalData.id || Date.now(),
                user_id: withdrawalData.user_id || withdrawalData.userId,
                user_name: withdrawalData.user_name || withdrawalData.userName,
                amount: parseFloat(withdrawalData.amount),
                wallet: withdrawalData.wallet,
                network: withdrawalData.network || 'TRC20',
                fee: fee,
                total: parseFloat(withdrawalData.amount) + fee,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .insert([newWithdrawal])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            return { success: false, error: error.message };
        }
    },

    async updateWithdrawal(withdrawalId, updates) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
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
            console.error('Error updating withdrawal:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المعاملات =====
    async getTransactions(userId = null) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available', data: [] };
            }
            
            let query = supabaseClient
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            const { data, error } = await query.limit(500);
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createTransaction(transactionData) {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
            const newTransaction = {
                id: transactionData.id || Date.now(),
                user_id: transactionData.user_id || transactionData.userId,
                type: transactionData.type,
                amount: parseFloat(transactionData.amount),
                description: transactionData.description || '',
                status: transactionData.status || 'completed',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert([newTransaction])
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('Error creating transaction:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الإحصائيات =====
    async getDashboardStats() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'Supabase not available' };
            }
            
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
            
            if (usersError || packagesError || tasksError || pendingError) {
                throw new Error('Error fetching stats');
            }
            
            return {
                success: true,
                data: {
                    users: usersCount || 0,
                    packages: packagesCount || 0,
                    tasks: tasksCount || 0,
                    pending: pendingCount || 0
                }
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return { success: false, error: error.message };
        }
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.supabaseHelpers = supabaseHelpers;
    window.supabaseAvailable = supabaseAvailable;
    
    // اختبار بسيط
    console.log('📦 Supabase Config Loaded');
    console.log('🔌 Status:', supabaseAvailable ? 'Connected' : 'Disconnected');
}

// تصدير للاستخدام في وحدات ES
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, supabaseHelpers, supabaseAvailable };
}