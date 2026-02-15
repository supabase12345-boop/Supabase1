// ===================================
// supabase.js - Elite Capital (بدون مهام)
// ===================================

const SUPABASE_URL = 'https://aiorcrtfvhjpwjdsebzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb3JjcnRmdmhqcHdqZHNlYnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg3MDEsImV4cCI6MjA4NjU2NDcwMX0.drqTeWdeOzA24K68hSM88JHNGft_kH571_te7KwUETA';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ مكتبة Supabase غير محملة');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        console.log('✅ تم الاتصال بـ Supabase');
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل الاتصال:', error);
        return null;
    }
}

// ========== المستخدمين (بدون tasks_completed) ==========
async function registerUser(userData) {
    try {
        // التحقق من وجود المستخدم
        const { data: existing } = await supabaseClient
            .from('users')
            .select('id')
            .or(`email.eq.${userData.email},username.eq.${userData.username}`)
            .maybeSingle();
        
        if (existing) throw new Error('البريد أو اسم المستخدم مستخدم مسبقاً');
        
        // إنشاء كود إحالة
        const referralCode = generateReferralCode(userData.username);
        
        // إنشاء المستخدم (بدون tasks_completed)
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
                status: 'active',
                is_admin: false,
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data: newUser };
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        return { success: false, error: error.message };
    }
}

async function loginUser(usernameOrEmail, password) {
    try {
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
            .maybeSingle();
        
        if (error) throw error;
        if (!user) throw new Error('المستخدم غير موجود');
        if (user.password !== password) throw new Error('كلمة المرور غير صحيحة');
        if (user.status === 'banned') throw new Error('حسابك محظور');
        
        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        
        return { success: true, data: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUserById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUser(id, updates) {
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
        return { success: false, error: error.message };
    }
}

// ========== الباقات ==========
async function getAllPackages() {
    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getPackageById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createPackage(packageData) {
    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .insert([{
                name: packageData.name,
                price: packageData.price,
                daily_profit: packageData.dailyProfit,
                profit_percentage: (packageData.dailyProfit / packageData.price) * 100,
                duration: packageData.duration || 30,
                category: packageData.category || 'standard',
                description: packageData.description || '',
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updatePackage(id, updates) {
    try {
        const { error } = await supabaseClient
            .from('packages')
            .update(updates)
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deletePackage(id) {
    try {
        const { error } = await supabaseClient
            .from('packages')
            .update({ status: 'deleted' })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== طلبات الاشتراك ==========
async function createPendingPackage(pendingData) {
    try {
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .insert([{
                user_id: pendingData.userId,
                user_name: pendingData.userName,
                user_email: pendingData.userEmail,
                package_id: pendingData.packageId,
                package_name: pendingData.packageName,
                package_category: pendingData.packageCategory,
                amount: pendingData.amount,
                payment_proof: pendingData.paymentProof || null,
                wallet_address: pendingData.walletAddress,
                network: 'TRC20',
                referred_by: pendingData.referredBy || null,
                fast_approval: !!pendingData.paymentProof,
                estimated_activation: pendingData.paymentProof ? 'ساعة واحدة' : '3-6 ساعات',
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getPendingPackages() {
    try {
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function approvePendingPackage(id, adminId) {
    try {
        const { data: pending, error: fetchError } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // تحديث حالة الطلب
        await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'approved',
                processed_by: adminId,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        // إنشاء اشتراك جديد
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        const { data: subscription } = await supabaseClient
            .from('subscriptions')
            .insert([{
                user_id: pending.user_id,
                package_id: pending.package_id,
                package_name: pending.package_name,
                package_category: pending.package_category,
                amount: pending.amount,
                daily_profit: pending.amount * 0.025,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        // تحديث المستخدم
        await supabaseClient
            .from('users')
            .update({ 
                current_subscription_id: subscription.id,
                has_active_subscription: true
            })
            .eq('id', pending.user_id);
        
        // تسجيل معاملة إيداع
        await supabaseClient
            .from('transactions')
            .insert([{
                user_id: pending.user_id,
                type: 'اشتراك',
                amount: pending.amount,
                description: `اشتراك في باقة ${pending.package_name}`,
                status: 'completed',
                created_at: new Date().toISOString()
            }]);
        
        // معالجة الإحالة
        if (pending.referred_by) {
            await processReferralRewards(pending.user_id, pending.referred_by);
        }
        
        return { success: true, data: subscription };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function rejectPendingPackage(id, reason, adminId) {
    try {
        const { error } = await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                processed_by: adminId,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== الإحالة ==========
function generateReferralCode(username) {
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

async function processReferralRewards(newUserId, referralCode) {
    try {
        const { data: referrer } = await supabaseClient
            .from('users')
            .select('*')
            .eq('referral_code', referralCode)
            .single();
        
        if (!referrer) return { success: false };
        
        const REFERRER_REWARD = 50;
        const REFEREE_REWARD = 20;
        
        const { data: newUser } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', newUserId)
            .single();
        
        // تحديث رصيد المحال
        await supabaseClient
            .from('users')
            .update({ 
                balance: (newUser.balance || 0) + REFEREE_REWARD,
                referral_reward_paid: true
            })
            .eq('id', newUserId);
        
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
        const transactions = [
            {
                user_id: newUserId,
                type: 'مكافأة إحالة',
                amount: REFEREE_REWARD,
                description: `مكافأة تسجيل عن طريق ${referrer.name}`,
                status: 'completed',
                created_at: new Date().toISOString()
            },
            {
                user_id: referrer.id,
                type: 'مكافأة إحالة',
                amount: REFERRER_REWARD,
                description: `مكافأة إحالة: ${newUser.name}`,
                status: 'completed',
                created_at: new Date().toISOString()
            }
        ];
        
        await supabaseClient.from('transactions').insert(transactions);
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في معالجة الإحالة:', error);
        return { success: false };
    }
}

async function getReferralStats(userId) {
    try {
        const { data: user } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        const { data: referredUsers } = await supabaseClient
            .from('users')
            .select('id, name, email, joined_date, has_active_subscription, referral_reward_paid')
            .eq('referred_by', user.referral_code);
        
        const { data: transactions } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'مكافأة إحالة');
        
        const totalEarned = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const activeReferrals = referredUsers?.filter(u => u.has_active_subscription).length || 0;
        
        return {
            success: true,
            data: {
                referralCode: user.referral_code,
                totalReferrals: referredUsers?.length || 0,
                activeReferrals: activeReferrals,
                totalEarned: totalEarned,
                referredUsers: referredUsers || []
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== الاشتراكات ==========
async function getUserSubscription(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== طلبات السحب ==========
async function createWithdrawal(withdrawalData) {
    try {
        const { data: user } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', withdrawalData.userId)
            .single();
        
        const totalAmount = withdrawalData.amount + withdrawalData.fee;
        if (user.balance < totalAmount) {
            throw new Error('الرصيد غير كافي');
        }
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([{
                user_id: withdrawalData.userId,
                amount: withdrawalData.amount,
                wallet: withdrawalData.wallet,
                network: withdrawalData.network,
                fee: withdrawalData.fee,
                total: totalAmount,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        await supabaseClient.rpc('decrement_balance', {
            user_id: withdrawalData.userId,
            amount: totalAmount
        });
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getUserWithdrawals(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllWithdrawals(status = null) {
    try {
        let query = supabaseClient
            .from('withdrawals')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false });
        
        if (status) query = query.eq('status', status);
        
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateWithdrawalStatus(id, status, adminId, txHash = null) {
    try {
        const updates = { 
            status,
            processed_by: adminId,
            processed_at: new Date().toISOString()
        };
        if (txHash) updates.transaction_hash = txHash;
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (status === 'rejected') {
            await supabaseClient.rpc('increment_balance', {
                user_id: data.user_id,
                amount: data.total
            });
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== المعاملات ==========
async function getUserTransactions(userId, limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== إحصائيات المسؤول ==========
async function getDashboardStats() {
    try {
        const [usersRes, packagesRes, pendingPackagesRes, subscriptionsRes, withdrawalsRes] = await Promise.all([
            supabaseClient.from('users').select('*', { count: 'exact' }),
            supabaseClient.from('packages').select('*').eq('status', 'active'),
            supabaseClient.from('pending_packages').select('*').eq('status', 'pending'),
            supabaseClient.from('subscriptions').select('*').eq('status', 'active'),
            supabaseClient.from('withdrawals').select('*')
        ]);
        
        const users = usersRes.data || [];
        const withdrawals = withdrawalsRes.data || [];
        
        const totalDeposits = users.reduce((sum, u) => sum + (u.total_earned || 0), 0);
        const totalWithdrawals = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0);
        
        return {
            success: true,
            data: {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.status === 'active').length,
                suspendedUsers: users.filter(u => u.status === 'suspended').length,
                bannedUsers: users.filter(u => u.status === 'banned').length,
                totalDeposits,
                totalWithdrawals,
                activeSubscriptions: subscriptionsRes.data?.length || 0,
                pendingPackages: pendingPackagesRes.data?.length || 0,
                pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
                packagesCount: packagesRes.data?.length || 0
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('joined_date', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUserStatus(id, status) {
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ status })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== التهيئة ==========
initSupabase();

window.supabaseClient = supabaseClient;
window.supabaseHelpers = {
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    createPendingPackage,
    getPendingPackages,
    approvePendingPackage,
    rejectPendingPackage,
    generateReferralCode,
    getReferralStats,
    getUserSubscription,
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus,
    getUserTransactions,
    getDashboardStats,
    getAllUsers,
    updateUserStatus
};

console.log('✅ تم تحميل جميع دوال Supabase (بدون مهام)');
