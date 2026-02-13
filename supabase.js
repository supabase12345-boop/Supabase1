// ===================================
// تهيئة اتصال Supabase
// ===================================

const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

// إنشاء كائن Supabase
let supabaseClient = null;

// تهيئة الاتصال
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ مكتبة Supabase غير محملة');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });
        console.log('✅ تم الاتصال بـ Supabase بنجاح');
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل الاتصال بـ Supabase:', error);
        return null;
    }
}

// ===================================
// دوال المساعدة للتعامل مع Supabase
// ===================================

// تنفيذ استعلام مع معالجة الأخطاء
async function executeQuery(queryFn, fallbackData = null) {
    try {
        const result = await queryFn();
        return { success: true, data: result.data, error: null };
    } catch (error) {
        console.error('❌ خطأ في استعلام Supabase:', error);
        return { success: false, data: fallbackData, error: error.message };
    }
}

// ===================================
// إدارة المستخدمين
// ===================================

async function createUser(userData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .insert([{
                name: userData.name,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password, // ملاحظة: يجب تشفيرها في الإنتاج الحقيقي
                referral_code: userData.referralCode || null,
                balance: 0,
                total_earned: 0,
                total_withdrawn: 0,
                tasks_completed: 0,
                status: 'active',
                is_admin: false,
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString()
            }])
            .select();
    });
}

async function getUserByEmail(email) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
    });
}

async function getUserByUsername(username) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
    });
}

async function getUserById(id) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
    });
}

async function getAllUsers() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .select('*')
            .order('joined_date', { ascending: false });
    });
}

async function updateUser(id, updates) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('users')
            .update(updates)
            .eq('id', id)
            .select();
    });
}

// ===================================
// إدارة الباقات
// ===================================

async function createPackage(packageData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('packages')
            .insert([{
                name: packageData.name,
                price: packageData.price,
                profit_percentage: packageData.profit || 2.5,
                daily_profit: (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2),
                tasks_count: packageData.tasks || 5,
                duration: packageData.duration || 30,
                category: packageData.category || 'standard',
                description: packageData.description || '',
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select();
    });
}

async function getAllPackages() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
    });
}

async function getPackageById(id) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
    });
}

async function updatePackage(id, updates) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('packages')
            .update(updates)
            .eq('id', id)
            .select();
    });
}

async function deletePackage(id) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('packages')
            .update({ status: 'deleted' })
            .eq('id', id);
    });
}

// ===================================
// إدارة المهام
// ===================================

async function createTask(taskData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('tasks')
            .insert([{
                title: taskData.title,
                description: taskData.description,
                reward: taskData.reward,
                type: taskData.type || 'daily',
                available_for: taskData.availableFor || 'all',
                package_categories: taskData.packageCategories || ['standard'],
                difficulty: taskData.difficulty || 'easy',
                time_required: taskData.timeRequired || 2,
                completions: 0,
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select();
    });
}

async function getAllTasks() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
    });
}

async function getUserTasks(category) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .contains('package_categories', [category]);
    });
}

async function getTaskById(id) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();
    });
}

async function incrementTaskCompletion(taskId) {
    return executeQuery(async () => {
        const { data: task } = await supabaseClient
            .from('tasks')
            .select('completions')
            .eq('id', taskId)
            .single();
        
        return await supabaseClient
            .from('tasks')
            .update({ completions: (task?.completions || 0) + 1 })
            .eq('id', taskId);
    });
}

// ===================================
// إدارة الطلبات المعلقة
// ===================================

async function createPendingPackage(pendingData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('pending_packages')
            .insert([{
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
                created_at: new Date().toISOString()
            }])
            .select();
    });
}

async function getAllPendingPackages() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
    });
}

async function approvePendingPackage(id) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'approved',
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
    });
}

async function rejectPendingPackage(id, reason) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
    });
}

// ===================================
// إدارة المعاملات
// ===================================

async function createTransaction(transactionData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('transactions')
            .insert([{
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
    });
}

async function getUserTransactions(userId) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);
    });
}

async function getAllTransactions() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('transactions')
            .select('*, users:user_id(name, email)')
            .order('created_at', { ascending: false })
            .limit(500);
    });
}

// ===================================
// إدارة طلبات السحب
// ===================================

async function createWithdrawal(withdrawalData) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('withdrawals')
            .insert([{
                user_id: withdrawalData.userId,
                amount: withdrawalData.amount,
                wallet: withdrawalData.wallet,
                network: withdrawalData.network,
                fee: withdrawalData.fee,
                total: withdrawalData.total,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();
    });
}

async function getUserWithdrawals(userId) {
    return executeQuery(async () => {
        return await supabaseClient
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    });
}

async function getAllWithdrawals() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('withdrawals')
            .select('*, users:user_id(name, email)')
            .order('created_at', { ascending: false });
    });
}

async function getPendingWithdrawals() {
    return executeQuery(async () => {
        return await supabaseClient
            .from('withdrawals')
            .select('*, users:user_id(name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
    });
}

async function updateWithdrawalStatus(id, status, txHash = null) {
    return executeQuery(async () => {
        const updates = { 
            status: status,
            processed_at: new Date().toISOString()
        };
        if (txHash) updates.transaction_hash = txHash;
        
        return await supabaseClient
            .from('withdrawals')
            .update(updates)
            .eq('id', id);
    });
}

// ===================================
// إحصائيات المنصة
// ===================================

async function getDashboardStats() {
    try {
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
        
        let totalDeposits = 0;
        let activeSubscriptions = 0;
        let activeUsers = 0;
        let suspendedUsers = 0;
        let bannedUsers = 0;
        
        users.forEach(user => {
            if (user.package && user.package_status === 'active') {
                totalDeposits += user.package_amount || 0;
                activeSubscriptions++;
            }
            if (user.status === 'active' || !user.status) activeUsers++;
            if (user.status === 'suspended') suspendedUsers++;
            if (user.status === 'banned') bannedUsers++;
        });
        
        const completedWithdrawals = withdrawals
            .filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + w.amount, 0);
        
        return {
            success: true,
            data: {
                totalUsers: users.length,
                activeUsers,
                suspendedUsers,
                bannedUsers,
                totalDeposits,
                totalWithdrawals: completedWithdrawals,
                activeSubscriptions,
                pendingPackages: pending.length,
                pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
                packagesCount: packages.length
            }
        };
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return { success: false, data: null, error: error.message };
    }
}

// ===================================
// دوال المصادقة
// ===================================

async function loginUser(usernameOrEmail, password) {
    try {
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
            throw new Error('المستخدم غير موجود');
        }
        
        if (user.password !== password) {
            throw new Error('كلمة المرور غير صحيحة');
        }
        
        if (user.status === 'banned') {
            throw new Error('حسابك محظور');
        }
        
        // تحديث آخر تسجيل دخول
        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        
        return { success: true, data: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function registerUser(userData) {
    try {
        // التحقق من عدم تكرار البريد أو اسم المستخدم
        const { data: existingEmail } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', userData.email)
            .maybeSingle();
        
        if (existingEmail) {
            throw new Error('البريد الإلكتروني مستخدم مسبقاً');
        }
        
        const { data: existingUsername } = await supabaseClient
            .from('users')
            .select('id')
            .eq('username', userData.username)
            .maybeSingle();
        
        if (existingUsername) {
            throw new Error('اسم المستخدم مستخدم مسبقاً');
        }
        
        // إنشاء كود إحالة للمستخدم الجديد
        const referralCode = generateReferralCode(userData.username);
        
        const { data: newUser, error } = await supabaseClient
            .from('users')
            .insert([{
                name: userData.name,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                referral_code: referralCode,
                referred_by: userData.referralCode || null,
                balance: 0,
                total_earned: 0,
                total_withdrawn: 0,
                tasks_completed: 0,
                status: 'active',
                is_admin: false,
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // إذا كان هناك كود إحالة، سجل المعاملة (سيتم صرف المكافأة عند تفعيل الباقة)
        if (userData.referralCode) {
            await createTransaction({
                userId: newUser.id,
                type: 'تسجيل بإحالة',
                amount: 0,
                description: `تسجيل عن طريق كود الإحالة ${userData.referralCode}`,
                status: 'pending',
                referralCode: userData.referralCode
            });
        }
        
        return { success: true, data: newUser };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ===================================
// دوال الإحالة
// ===================================

function generateReferralCode(username) {
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

async function processReferralRewards(userId) {
    try {
        const { data: newUser } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (!newUser || !newUser.referred_by) {
            return { success: false, message: 'لا يوجد كود إحالة' };
        }
        
        const { data: referrer } = await supabaseClient
            .from('users')
            .select('*')
            .eq('referral_code', newUser.referred_by)
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
                balance: (newUser.balance || 0) + REFEREE_REWARD,
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
            referralCode: newUser.referred_by,
            referrerName: referrer.name
        });
        
        await createTransaction({
            userId: referrer.id,
            type: 'مكافأة إحالة',
            amount: REFERRER_REWARD,
            description: `💰 مكافأة إحالة: ${newUser.name}`,
            referredUserId: userId,
            referredUserName: newUser.name
        });
        
        return { 
            success: true, 
            data: {
                referrer: { id: referrer.id, name: referrer.name, reward: REFERRER_REWARD },
                referee: { id: userId, name: newUser.name, reward: REFEREE_REWARD }
            }
        };
    } catch (error) {
        console.error('خطأ في معالجة مكافآت الإحالة:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// التهيئة
// ===================================

// تهيئة الاتصال
initSupabase();

// تصدير الدوال
window.supabaseClient = supabaseClient;
window.supabaseHelpers = {
    // المستخدمين
    createUser,
    getUserByEmail,
    getUserByUsername,
    getUserById,
    getAllUsers,
    updateUser,
    
    // الباقات
    createPackage,
    getAllPackages,
    getPackageById,
    updatePackage,
    deletePackage,
    
    // المهام
    createTask,
    getAllTasks,
    getUserTasks,
    getTaskById,
    incrementTaskCompletion,
    
    // الطلبات المعلقة
    createPendingPackage,
    getAllPendingPackages,
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
    
    // الإحصائيات
    getDashboardStats,
    
    // المصادقة
    loginUser,
    registerUser,
    
    // الإحالة
    generateReferralCode,
    processReferralRewards
};

console.log('✅ تم تحميل جميع دوال Supabase');