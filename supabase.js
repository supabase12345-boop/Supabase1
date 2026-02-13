// ===================================
// ملف: supabase.js
// الوصف: تهيئة الاتصال بـ Supabase وجميع دوال قاعدة البيانات
// الإصدار: 2.0.0
// ===================================

// ========== إعدادات الاتصال ==========
const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

// ========== متغيرات عامة ==========
let supabaseClient = null;
let connectionStatus = {
    initialized: false,
    connected: false,
    lastError: null
};

// ========== تهيئة الاتصال ==========
function initSupabase() {
    console.log('🔄 جاري تهيئة الاتصال بـ Supabase...');
    
    if (typeof supabase === 'undefined') {
        console.error('❌ مكتبة Supabase غير محملة. تأكد من إضافة:');
        console.error('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        connectionStatus.initialized = false;
        connectionStatus.lastError = 'مكتبة Supabase غير محملة';
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    'x-application-name': 'elite-investors'
                }
            }
        });
        
        connectionStatus.initialized = true;
        connectionStatus.connected = true;
        connectionStatus.lastError = null;
        
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        console.log('📊 قاعدة البيانات: elite-investors');
        
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل الاتصال بـ Supabase:', error);
        connectionStatus.initialized = false;
        connectionStatus.connected = false;
        connectionStatus.lastError = error.message;
        return null;
    }
}

// ========== دوال المساعدة ==========

// توليد كود إحالة فريد
function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

// تنفيذ استعلام مع معالجة الأخطاء
async function executeQuery(queryFn, fallbackData = null) {
    try {
        const result = await queryFn();
        return { 
            success: true, 
            data: result.data, 
            error: null,
            count: result.count
        };
    } catch (error) {
        console.error('❌ خطأ في استعلام Supabase:', error);
        return { 
            success: false, 
            data: fallbackData, 
            error: error.message,
            details: error
        };
    }
}

// التحقق من حالة الاتصال
function getConnectionStatus() {
    return {
        ...connectionStatus,
        clientExists: !!supabaseClient,
        timestamp: new Date().toISOString()
    };
}

// =============================================
// ========== دوال المستخدمين ==========
// =============================================

// تسجيل مستخدم جديد
async function registerUser(userData) {
    try {
        console.log('👤 محاولة تسجيل مستخدم جديد:', userData.email);
        
        // التحقق من وجود supabaseClient
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // التحقق من عدم وجود المستخدم مسبقاً
        const { data: existingUser, error: checkError } = await supabaseClient
            .from('users')
            .select('id, email, username')
            .or(`email.eq.${userData.email},username.eq.${userData.username}`)
            .maybeSingle();

        if (existingUser) {
            if (existingUser.email === userData.email) {
                return { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' };
            }
            if (existingUser.username === userData.username) {
                return { success: false, error: 'اسم المستخدم مستخدم مسبقاً' };
            }
        }

        // إنشاء معرف فريد
        const newId = Date.now();
        
        // إنشاء كود إحالة
        const referralCode = generateReferralCode(userData.username);
        
        // التحقق من صحة كود الإحالة
        let referredBy = null;
        if (userData.referralCode) {
            const { data: referrer } = await supabaseClient
                .from('users')
                .select('referral_code')
                .eq('referral_code', userData.referralCode)
                .maybeSingle();
            
            if (referrer) {
                referredBy = userData.referralCode;
                console.log('✅ تم التحقق من كود الإحالة:', referredBy);
            }
        }
        
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                id: newId,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                balance: 0,
                total_earned: 0,
                total_withdrawn: 0,
                tasks_completed: 0,
                referral_code: referralCode,
                referred_by: referredBy,
                referral_count: 0,
                referral_earnings: 0,
                referral_reward_paid: false,
                wallet_address: '',
                wallet_network: 'TRC20',
                is_admin: false,
                status: 'active',
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ خطأ في تسجيل المستخدم:', error);
            return { success: false, error: error.message, details: error };
        }

        console.log('✅ تم تسجيل المستخدم بنجاح:', data[0]?.email);
        
        // إذا كان هناك كود إحالة، سجل معاملة انتظار
        if (referredBy) {
            await createTransaction({
                userId: newId,
                type: 'تسجيل بإحالة',
                amount: 0,
                description: `تسجيل عن طريق كود الإحالة ${referredBy}`,
                status: 'pending',
                referralCode: referredBy
            });
        }
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ استثناء في تسجيل المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// تسجيل الدخول
async function loginUser(usernameOrEmail, password) {
    try {
        console.log('🔑 محاولة تسجيل دخول:', usernameOrEmail);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // البحث عن المستخدم بالبريد الإلكتروني أو اسم المستخدم
        const { data: userByEmail } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', usernameOrEmail)
            .maybeSingle();
        
        const { data: userByUsername } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', usernameOrEmail)
            .maybeSingle();
        
        const user = userByEmail || userByUsername;
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        if (user.password !== password) {
            return { success: false, error: 'كلمة المرور غير صحيحة' };
        }
        
        if (user.status === 'banned') {
            return { success: false, error: 'حسابك محظور' };
        }
        
        if (user.status === 'suspended') {
            return { success: false, error: 'حسابك معلق مؤقتاً' };
        }
        
        // تحديث آخر تسجيل دخول
        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        
        console.log('✅ تسجيل دخول ناجح:', user.email);
        
        return { success: true, data: user };
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على مستخدم بالمعرف
async function getUserById(id) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على جميع المستخدمين
async function getAllUsers() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('joined_date', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// تحديث مستخدم
async function updateUser(id, updates) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال الباقات ==========
// =============================================

// إضافة باقة جديدة
async function addPackage(packageData) {
    try {
        console.log('📦 محاولة إضافة باقة:', packageData.name);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // إنشاء معرف فريد
        const newId = Date.now();
        
        // حساب الربح اليومي
        const dailyProfit = (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2);
        
        const { data, error } = await supabaseClient
            .from('packages')
            .insert([{
                id: newId,
                name: packageData.name,
                price: parseFloat(packageData.price),
                profit_percentage: parseFloat(packageData.profit || 2.5),
                daily_profit: parseFloat(dailyProfit),
                tasks_count: parseInt(packageData.tasks || 5),
                duration: parseInt(packageData.duration || 30),
                category: packageData.category || 'standard',
                description: packageData.description || '',
                status: 'active',
                users_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ خطأ في إضافة الباقة:', error);
            return { success: false, error: error.message, details: error };
        }

        console.log('✅ تم إضافة الباقة بنجاح:', data[0]?.name);
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ استثناء في إضافة الباقة:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع الباقات
async function getAllPackages() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على باقة بالمعرف
async function getPackageById(id) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// تحديث باقة
async function updatePackage(id, updates) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('packages')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// حذف باقة (تعطيل)
async function deletePackage(id) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { error } = await supabaseClient
            .from('packages')
            .update({ status: 'deleted' })
            .eq('id', id);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال المهام ==========
// =============================================

// إضافة مهمة جديدة
async function addTask(taskData) {
    try {
        console.log('📋 محاولة إضافة مهمة:', taskData.title);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const newId = Date.now();
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([{
                id: newId,
                title: taskData.title,
                description: taskData.description,
                reward: parseFloat(taskData.reward),
                type: taskData.type || 'daily',
                available_for: taskData.availableFor || 'all',
                package_categories: taskData.packageCategories || ['standard'],
                difficulty: taskData.difficulty || 'easy',
                time_required: parseInt(taskData.timeRequired || 2),
                completions: 0,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ خطأ في إضافة المهمة:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ تم إضافة المهمة بنجاح:', data[0]?.title);
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ استثناء في إضافة المهمة:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع المهام
async function getAllTasks() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على مهام المستخدم حسب الفئة
async function getUserTasks(category) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .contains('package_categories', [category]);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// زيادة عدد مرات إكمال المهمة
async function incrementTaskCompletion(taskId) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // الحصول على العدد الحالي
        const { data: task } = await supabaseClient
            .from('tasks')
            .select('completions')
            .eq('id', taskId)
            .single();
        
        const newCount = (task?.completions || 0) + 1;
        
        const { error } = await supabaseClient
            .from('tasks')
            .update({ completions: newCount })
            .eq('id', taskId);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, completions: newCount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال الطلبات المعلقة ==========
// =============================================

// إضافة طلب اشتراك معلق
async function addPendingPackage(pendingData) {
    try {
        console.log('📝 محاولة إضافة طلب اشتراك:', pendingData.userName);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const newId = Date.now();
        
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .insert([{
                id: newId,
                user_id: pendingData.userId,
                user_name: pendingData.userName,
                user_email: pendingData.userEmail,
                user_phone: pendingData.userPhone,
                package_id: pendingData.packageId,
                package_name: pendingData.packageName,
                package_category: pendingData.packageCategory,
                amount: pendingData.amount,
                payment_proof: pendingData.paymentProof,
                wallet_address: pendingData.walletAddress,
                network: pendingData.network || 'TRC20',
                transaction_hash: pendingData.transactionHash,
                referred_by: pendingData.referredBy,
                fast_approval: pendingData.fastApproval || false,
                estimated_activation: pendingData.estimatedActivation || '3-6 ساعات',
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ خطأ في إضافة الطلب:', error);
            return { success: false, error: error.message, details: error };
        }

        console.log('✅ تم إضافة الطلب بنجاح:', data[0]?.id);
        
        // تحديث المستخدم بوجود طلب معلق
        await supabaseClient
            .from('users')
            .update({ 
                pending_package: {
                    id: newId,
                    name: pendingData.packageName,
                    amount: pendingData.amount,
                    requestedDate: new Date().toISOString(),
                    estimatedActivation: pendingData.estimatedActivation
                }
            })
            .eq('id', pendingData.userId);
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ استثناء في إضافة الطلب:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع الطلبات المعلقة
async function getPendingPackages() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الموافقة على طلب
async function approvePendingPackage(id) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // الحصول على بيانات الطلب
        const { data: pending } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (!pending) {
            return { success: false, error: 'الطلب غير موجود' };
        }
        
        // تحديث حالة الطلب
        await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'approved',
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        // الحصول على بيانات الباقة
        const { data: package_data } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('id', pending.package_id)
            .single();
        
        // تحديث المستخدم
        await supabaseClient
            .from('users')
            .update({ 
                package: {
                    id: package_data.id,
                    name: package_data.name,
                    amount: pending.amount,
                    price: package_data.price,
                    profit: package_data.profit_percentage,
                    dailyProfit: (pending.amount * package_data.profit_percentage / 100),
                    category: package_data.category,
                    purchaseDate: new Date().toISOString(),
                    duration: package_data.duration,
                    status: 'نشط'
                },
                pending_package: null
            })
            .eq('id', pending.user_id);
        
        // تسجيل معاملة
        await createTransaction({
            userId: pending.user_id,
            type: 'اشتراك',
            amount: pending.amount,
            description: `تفعيل باقة ${pending.package_name}`,
            status: 'completed'
        });
        
        // معالجة مكافآت الإحالة إذا وجدت
        if (pending.referred_by) {
            await processReferralRewards(pending.user_id);
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في الموافقة على الطلب:', error);
        return { success: false, error: error.message };
    }
}

// رفض الطلب
async function rejectPendingPackage(id, reason) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // الحصول على بيانات الطلب
        const { data: pending } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (!pending) {
            return { success: false, error: 'الطلب غير موجود' };
        }
        
        // تحديث حالة الطلب
        await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'rejected',
                notes: reason,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        // إلغاء الطلب المعلق للمستخدم
        await supabaseClient
            .from('users')
            .update({ pending_package: null })
            .eq('id', pending.user_id);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال المعاملات ==========
// =============================================

// إنشاء معاملة جديدة
async function createTransaction(transactionData) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const newId = Date.now();
        
        const { data, error } = await supabaseClient
            .from('transactions')
            .insert([{
                id: newId,
                user_id: transactionData.userId,
                type: transactionData.type,
                amount: transactionData.amount,
                description: transactionData.description,
                status: transactionData.status || 'completed',
                referral_code: transactionData.referralCode,
                referrer_name: transactionData.referrerName,
                referred_user_id: transactionData.referredUserId,
                referred_user_name: transactionData.referredUserName,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على معاملات المستخدم
async function getUserTransactions(userId) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على جميع المعاملات
async function getAllTransactions() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*, users:user_id(name, email)')
            .order('created_at', { ascending: false })
            .limit(500);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال طلبات السحب ==========
// =============================================

// إنشاء طلب سحب
async function createWithdrawal(withdrawalData) {
    try {
        console.log('💰 محاولة إنشاء طلب سحب:', withdrawalData.userId);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const newId = Date.now();
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([{
                id: newId,
                user_id: withdrawalData.userId,
                amount: withdrawalData.amount,
                wallet: withdrawalData.wallet,
                network: withdrawalData.network,
                fee: withdrawalData.fee,
                total: withdrawalData.total,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ خطأ في إنشاء طلب السحب:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ تم إنشاء طلب السحب بنجاح:', data[0]?.id);
        
        // خصم الرصيد
        await supabaseClient
            .from('users')
            .update({ 
                balance: withdrawalData.newBalance,
                total_withdrawn: withdrawalData.newTotalWithdrawn
            })
            .eq('id', withdrawalData.userId);
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ استثناء في إنشاء طلب السحب:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على طلبات سحب المستخدم
async function getUserWithdrawals(userId) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على جميع طلبات السحب
async function getAllWithdrawals() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*, users:user_id(name, email)')
            .order('created_at', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// الحصول على طلبات السحب المعلقة
async function getPendingWithdrawals() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*, users:user_id(name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// تحديث حالة طلب السحب
async function updateWithdrawalStatus(id, status, txHash = null) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        const updates = { 
            status: status,
            processed_at: new Date().toISOString()
        };
        if (txHash) updates.transaction_hash = txHash;
        
        const { error } = await supabaseClient
            .from('withdrawals')
            .update(updates)
            .eq('id', id);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال الإحالة ==========
// =============================================

// معالجة مكافآت الإحالة
async function processReferralRewards(userId) {
    try {
        console.log('🎁 معالجة مكافآت الإحالة للمستخدم:', userId);
        
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // الحصول على بيانات المستخدم
        const { data: user } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (!user || !user.referred_by) {
            return { success: false, message: 'لا يوجد كود إحالة' };
        }
        
        // الحصول على بيانات المحيل
        const { data: referrer } = await supabaseClient
            .from('users')
            .select('*')
            .eq('referral_code', user.referred_by)
            .single();
        
        if (!referrer) {
            return { success: false, message: 'لم يتم العثور على صاحب الكود' };
        }
        
        const REFERRER_REWARD = 50;
        const REFEREE_REWARD = 20;
        
        // تحديث رصيد المحال
        await supabaseClient
            .from('users')
            .update({ 
                balance: (user.balance || 0) + REFEREE_REWARD,
                referral_reward_paid: true,
                referral_reward_amount: REFEREE_REWARD
            })
            .eq('id', userId);
        
        // تحديث رصيد المحيل
        await supabaseClient
            .from('users')
            .update({ 
                balance: (referrer.balance || 0) + REFERRER_REWARD,
                referral_earnings: (referrer.referral_earnings || 0) + REFERRER_REWARD,
                referral_count: (referrer.referral_count || 0) + 1
            })
            .eq('id', referrer.id);
        
        // تسجيل المعاملات
        await createTransaction({
            userId: userId,
            type: 'مكافأة إحالة',
            amount: REFEREE_REWARD,
            description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
            referralCode: user.referred_by,
            referrerName: referrer.name
        });
        
        await createTransaction({
            userId: referrer.id,
            type: 'مكافأة إحالة',
            amount: REFERRER_REWARD,
            description: `💰 مكافأة إحالة: ${user.name}`,
            referredUserId: userId,
            referredUserName: user.name
        });
        
        console.log('✅ تم صرف المكافآت بنجاح');
        
        return { 
            success: true, 
            data: {
                referrer: { id: referrer.id, name: referrer.name, reward: REFERRER_REWARD },
                referee: { id: userId, name: user.name, reward: REFEREE_REWARD }
            }
        };
    } catch (error) {
        console.error('❌ خطأ في معالجة مكافآت الإحالة:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على إحصائيات الإحالة لمستخدم
async function getReferralStats(userId) {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // الحصول على المستخدم
        const { data: user } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (!user) {
            return { success: false, error: 'المستخدم غير موجود' };
        }
        
        // الحصول على المحالين
        const { data: referredUsers } = await supabaseClient
            .from('users')
            .select('*')
            .eq('referred_by', user.referral_code);
        
        const referredList = referredUsers || [];
        
        // حساب الإحصائيات
        const activeReferrals = referredList.filter(u => u.package !== null).length;
        const pendingReferrals = referredList.filter(u => u.pending_package !== null && !u.package).length;
        const totalEarned = user.referral_earnings || 0;
        
        // حساب العمولات المعلقة
        let pendingCommission = 0;
        for (const ref of referredList) {
            if (ref.package && !ref.referral_reward_paid) {
                pendingCommission += 50;
            }
        }
        
        return {
            success: true,
            data: {
                referralCode: user.referral_code,
                referredCount: referredList.length,
                activeReferrals: activeReferrals,
                pendingReferrals: pendingReferrals,
                totalEarned: totalEarned,
                pendingCommission: pendingCommission,
                conversionRate: referredList.length > 0 ? ((activeReferrals / referredList.length) * 100).toFixed(1) : 0,
                referredUsers: referredList.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    username: u.username,
                    joinedDate: u.joined_date,
                    hasPackage: !!u.package,
                    packageName: u.package?.name || 'لا يوجد',
                    packageAmount: u.package?.amount || 0,
                    rewardPaid: u.referral_reward_paid || false
                }))
            }
        };
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الإحالة:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// ========== دوال الإحصائيات ==========
// =============================================

// الحصول على إحصائيات لوحة التحكم
async function getDashboardStats() {
    try {
        if (!supabaseClient) {
            initSupabase();
            if (!supabaseClient) {
                return { success: false, error: 'فشل الاتصال بقاعدة البيانات' };
            }
        }
        
        // تنفيذ الاستعلامات بالتوازي
        const [usersRes, packagesRes, pendingRes, withdrawalsRes] = await Promise.all([
            supabaseClient.from('users').select('*', { count: 'exact', head: false }),
            supabaseClient.from('packages').select('*').eq('status', 'active'),
            supabaseClient.from('pending_packages').select('*').eq('status', 'pending'),
            supabaseClient.from('withdrawals').select('*')
        ]);
        
        const users = usersRes.data || [];
        const packages = packagesRes.data || [];
        const pending = pendingRes.data || [];
        const withdrawals = withdrawalsRes.data || [];
        
        // حساب الإحصائيات
        let totalDeposits = 0;
        let activeSubscriptions = 0;
        let activeUsers = 0;
        let suspendedUsers = 0;
        let bannedUsers = 0;
        let totalReferrals = 0;
        
        users.forEach(user => {
            if (user.package && user.package.status === 'نشط') {
                totalDeposits += user.package.amount || 0;
                activeSubscriptions++;
            }
            if (user.status === 'active' || !user.status) activeUsers++;
            if (user.status === 'suspended') suspendedUsers++;
            if (user.status === 'banned') bannedUsers++;
            if (user.referral_count) totalReferrals += user.referral_count;
        });
        
        const completedWithdrawals = withdrawals
            .filter(w => w.status === 'completed' || w.status === 'مكتمل')
            .reduce((sum, w) => sum + (w.amount || 0), 0);
        
        const pendingWithdrawals = withdrawals
            .filter(w => w.status === 'pending' || w.status === 'معلق')
            .length;
        
        return {
            success: true,
            data: {
                totalUsers: users.length,
                activeUsers: activeUsers,
                suspendedUsers: suspendedUsers,
                bannedUsers: bannedUsers,
                totalDeposits: totalDeposits,
                totalWithdrawals: completedWithdrawals,
                activeSubscriptions: activeSubscriptions,
                pendingPackages: pending.length,
                pendingWithdrawals: pendingWithdrawals,
                packagesCount: packages.length,
                totalReferrals: totalReferrals
            }
        };
    } catch (error) {
        console.error('❌ خطأ في جلب الإحصائيات:', error);
        return { success: false, data: null, error: error.message };
    }
}

// =============================================
// ========== التهيئة ==========
// =============================================

// تهيئة الاتصال عند تحميل الملف
initSupabase();

// تصدير الدوال والكائنات
window.supabaseClient = supabaseClient;
window.supabaseHelpers = {
    // الاتصال
    init: initSupabase,
    getStatus: getConnectionStatus,
    
    // المستخدمين
    registerUser,
    loginUser,
    getUserById,
    getAllUsers,
    updateUser,
    
    // الباقات
    addPackage,
    getAllPackages,
    getPackageById,
    updatePackage,
    deletePackage,
    
    // المهام
    addTask,
    getAllTasks,
    getUserTasks,
    incrementTaskCompletion,
    
    // الطلبات المعلقة
    addPendingPackage,
    getPendingPackages,
    approvePendingPackage,
    rejectPendingPackage,
    
    // المعاملات
    createTransaction,
    getUserTransactions,
    getAllTransactions,
    
    // طلبات السحب
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    getPendingWithdrawals,
    updateWithdrawalStatus,
    
    // الإحالة
    getReferralStats,
    processReferralRewards,
    
    // الإحصائيات
    getDashboardStats,
    
    // دوال مساعدة
    generateReferralCode
};

console.log('✅ تم تحميل جميع دوال Supabase بنجاح');
console.log('📊 عدد الدوال المتاحة:', Object.keys(window.supabaseHelpers).length);
