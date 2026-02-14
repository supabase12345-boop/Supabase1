// ===================================
// ملف: supabase-config.js
// الوصف: إعدادات الاتصال بـ Supabase
// الإصدار: 3.0.0 - النسخة النهائية
// ===================================

const SUPABASE_URL = 'https://tmksysprwgsbdmavlshm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80';

// تهيئة عميل Supabase
let supabaseClient = null;
let supabaseAvailable = false;

// التحقق من وجود مكتبة Supabase
if (typeof window === 'undefined') {
    console.warn('⚠️ بيئة المتصفح غير متوفرة');
} else {
    try {
        // التحقق من وجود مكتبة supabase
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.error('❌ مكتبة Supabase غير محملة. تأكد من إضافة السكريبت:');
            console.error('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        } else {
            // إنشاء عميل Supabase
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false,
                    storage: window.localStorage
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'x-application-name': 'elite-investors'
                    }
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
            
            // التحقق من نجاح الاتصال
            if (supabaseClient) {
                supabaseAvailable = true;
                console.log('✅ تم تهيئة عميل Supabase بنجاح');
                console.log('🔗 URL:', SUPABASE_URL);
                
                // اختبار الاتصال السريع
                supabaseClient
                    .from('users')
                    .select('count', { count: 'exact', head: true })
                    .then(({ count, error }) => {
                        if (error) {
                            console.warn('⚠️ تحذير: فشل اختبار الاتصال بقاعدة البيانات:', error.message);
                        } else {
                            console.log(`✅ اتصال قاعدة البيانات ناجح. عدد المستخدمين: ${count || 0}`);
                        }
                    })
                    .catch(err => {
                        console.warn('⚠️ تحذير: فشل اختبار الاتصال:', err.message);
                    });
            } else {
                console.error('❌ فشل إنشاء عميل Supabase');
            }
        }
    } catch (error) {
        console.error('❌ خطأ في تهيئة Supabase:', error);
        console.error('📝 تفاصيل الخطأ:', error.message);
    }
}

// ========== دوال مساعدة للتعامل مع Supabase ==========
const supabaseHelpers = {
    /**
     * التحقق من توفر Supabase
     */
    isAvailable() {
        return supabaseAvailable && supabaseClient !== null;
    },

    /**
     * الحصول على حالة الاتصال
     */
    getStatus() {
        return {
            available: this.isAvailable(),
            clientExists: supabaseClient !== null,
            url: SUPABASE_URL
        };
    },

    // ===== دوال المستخدمين =====
    
    /**
     * جلب جميع المستخدمين
     */
    async getAllUsers() {
        try {
            if (!this.isAvailable()) {
                throw new Error('Supabase غير متاح');
            }
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { 
                success: true, 
                data: data || [],
                message: `تم جلب ${data?.length || 0} مستخدم`
            };
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            return { 
                success: false, 
                error: error.message,
                data: [] 
            };
        }
    },

    /**
     * جلب مستخدم بواسطة ID
     */
    async getUserById(userId) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * جلب مستخدم بواسطة البريد الإلكتروني
     */
    async getUserByEmail(email) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * جلب مستخدم بواسطة اسم المستخدم
     */
    async getUserByUsername(username) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('username', username)
                .maybeSingle();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * إنشاء مستخدم جديد
     */
    async createUser(userData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            // تحضير البيانات
            const newUser = {
                id: userData.id || Date.now(),
                name: userData.name || '',
                username: userData.username || '',
                email: userData.email || '',
                phone: userData.phone || '',
                password: userData.password || '',
                balance: parseFloat(userData.balance) || 0,
                total_earned: parseFloat(userData.total_earned) || 0,
                tasks_completed: parseInt(userData.tasks_completed) || 0,
                referral_code: userData.referral_code || userData.referralCode || null,
                referred_by: userData.referred_by || userData.referredBy || null,
                status: userData.status || 'active',
                is_admin: userData.is_admin || false,
                wallet_address: userData.wallet_address || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ تم إنشاء مستخدم جديد:', data.email);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في إنشاء المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تحديث مستخدم
     */
    async updateUser(userId, updates) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في تحديث المستخدم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تسجيل الدخول
     */
    async loginUser(username, password) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            console.log('🔍 محاولة تسجيل الدخول للمستخدم:', username);
            
            // محاولة البحث بالبريد الإلكتروني أولاً
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
            
            if (data) {
                console.log('✅ تم العثور على المستخدم:', data.name);
                return { success: true, data };
            } else {
                console.log('❌ لم يتم العثور على المستخدم');
                return { success: false, error: 'بيانات الدخول غير صحيحة' };
            }
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الباقات =====
    
    /**
     * جلب جميع الباقات
     */
    async getAllPackages() {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('packages')
                .select('*')
                .order('price', { ascending: true });
            
            if (error) throw error;
            
            return { 
                success: true, 
                data: data || [],
                message: `تم جلب ${data?.length || 0} باقة`
            };
        } catch (error) {
            console.error('❌ خطأ في جلب الباقات:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * إنشاء باقة جديدة
     */
    async createPackage(packageData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            
            console.log('✅ تم إنشاء باقة جديدة:', data.name);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في إنشاء الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تحديث باقة
     */
    async updatePackage(packageId, updates) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في تحديث الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * حذف باقة
     */
    async deletePackage(packageId) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { error } = await supabaseClient
                .from('packages')
                .delete()
                .eq('id', packageId);
            
            if (error) throw error;
            
            console.log('✅ تم حذف الباقة:', packageId);
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف الباقة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المهام =====
    
    /**
     * جلب جميع المهام
     */
    async getAllTasks() {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { 
                success: true, 
                data: data || [],
                message: `تم جلب ${data?.length || 0} مهمة`
            };
        } catch (error) {
            console.error('❌ خطأ في جلب المهام:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * جلب المهام حسب فئة الباقة
     */
    async getTasksByPackage(packageCategory) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .contains('package_categories', [packageCategory])
                .eq('status', 'active')
                .order('reward', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب مهام الباقة:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * إنشاء مهمة جديدة
     */
    async createTask(taskData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            
            console.log('✅ تم إنشاء مهمة جديدة:', data.title);
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في إنشاء المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تحديث مهمة
     */
    async updateTask(taskId, updates) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في تحديث المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * حذف مهمة
     */
    async deleteTask(taskId) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', taskId);
            
            if (error) throw error;
            
            console.log('✅ تم حذف المهمة:', taskId);
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * زيادة عدد إنجازات المهمة
     */
    async incrementTaskCompletion(taskId) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في زيادة إنجاز المهمة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الطلبات المعلقة =====
    
    /**
     * جلب الطلبات المعلقة
     */
    async getPendingPackages() {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب الطلبات المعلقة:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * إنشاء طلب معلق
     */
    async createPendingPackage(pendingData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في إنشاء طلب معلق:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تحديث طلب معلق
     */
    async updatePendingPackage(pendingId, updates) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('pending_packages')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', pendingId)
                .select()
                .single();
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تحديث الطلب المعلق:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * حذف طلب معلق
     */
    async deletePendingPackage(pendingId) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { error } = await supabaseClient
                .from('pending_packages')
                .delete()
                .eq('id', pendingId);
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف الطلب المعلق:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال طلبات السحب =====
    
    /**
     * جلب طلبات السحب
     */
    async getWithdrawals() {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            const { data, error } = await supabaseClient
                .from('withdrawals')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ خطأ في جلب طلبات السحب:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * إنشاء طلب سحب
     */
    async createWithdrawal(withdrawalData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في إنشاء طلب سحب:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تحديث طلب سحب
     */
    async updateWithdrawal(withdrawalId, updates) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في تحديث طلب السحب:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال المعاملات =====
    
    /**
     * جلب المعاملات
     */
    async getTransactions(userId = null) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في جلب المعاملات:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * إنشاء معاملة
     */
    async createTransaction(transactionData) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
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
            console.error('❌ خطأ في إنشاء معاملة:', error);
            return { success: false, error: error.message };
        }
    },

    // ===== دوال الإحصائيات =====
    
    /**
     * جلب إحصائيات لوحة التحكم
     */
    async getDashboardStats() {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            // جلب عدد المستخدمين
            const { count: usersCount, error: usersError } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            // جلب عدد المستخدمين النشطين
            const { count: activeUsersCount, error: activeUsersError } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            
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
            
            if (usersError || activeUsersError || packagesError || tasksError || pendingError || withdrawalsError) {
                throw new Error('خطأ في جلب الإحصائيات');
            }
            
            return {
                success: true,
                data: {
                    users: usersCount || 0,
                    activeUsers: activeUsersCount || 0,
                    packages: packagesCount || 0,
                    tasks: tasksCount || 0,
                    pending: pendingCount || 0,
                    withdrawals: withdrawalsCount || 0
                }
            };
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات لوحة التحكم:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * تنفيذ استعلام SQL مخصص (للمشرفين فقط)
     */
    async executeQuery(query) {
        try {
            if (!this.isAvailable()) throw new Error('Supabase غير متاح');
            
            // هذا يتطلب صلاحيات أعلى، قد لا يعمل مع anon key
            const { data, error } = await supabaseClient.rpc('execute_sql', { query_text: query });
            
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطأ في تنفيذ الاستعلام:', error);
            return { success: false, error: error.message };
        }
    }
};

// إضافة دالة اختبار سريع
supabaseHelpers.testConnection = async function() {
    console.log('🔍 جاري اختبار الاتصال بـ Supabase...');
    
    try {
        // اختبار جلب المستخدمين
        const usersResult = await this.getAllUsers();
        if (usersResult.success) {
            console.log(`✅ جلب المستخدمين: ${usersResult.data.length} مستخدم`);
        } else {
            console.log(`❌ فشل جلب المستخدمين: ${usersResult.error}`);
        }
        
        // اختبار جلب الباقات
        const packagesResult = await this.getAllPackages();
        if (packagesResult.success) {
            console.log(`✅ جلب الباقات: ${packagesResult.data.length} باقة`);
        } else {
            console.log(`❌ فشل جلب الباقات: ${packagesResult.error}`);
        }
        
        // اختبار تسجيل الدخول
        const loginResult = await this.loginUser('ahmed123', '123456');
        if (loginResult.success) {
            console.log(`✅ تسجيل الدخول: ${loginResult.data.name}`);
        } else {
            console.log(`❌ فشل تسجيل الدخول: ${loginResult.error}`);
        }
        
        return {
            success: usersResult.success && packagesResult.success,
            users: usersResult.data?.length || 0,
            packages: packagesResult.data?.length || 0,
            login: loginResult.success
        };
    } catch (error) {
        console.error('❌ خطأ في اختبار الاتصال:', error);
        return { success: false, error: error.message };
    }
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.supabaseClient = supabaseClient;
    window.supabaseHelpers = supabaseHelpers;
    window.supabaseAvailable = supabaseAvailable;
    
    // تشغيل اختبار تلقائي بعد 3 ثواني
    setTimeout(() => {
        if (supabaseAvailable) {
            console.log('🔄 تشغيل اختبار الاتصال التلقائي...');
            supabaseHelpers.testConnection().then(result => {
                if (result.success) {
                    console.log('✅ جميع اختبارات الاتصال ناجحة');
                } else {
                    console.log('⚠️ بعض اختبارات الاتصال فشلت');
                }
            });
        }
    }, 3000);
}

// تصدير للاستخدام في وحدات ES
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabaseClient, supabaseHelpers, supabaseAvailable };
}

console.log('📦 تم تحميل ملف supabase-config.js');