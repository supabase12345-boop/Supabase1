// ===================================
// نظام البيانات المشتركة - إصدار Supabase
// ===================================

// ========== التحقق من الاتصال ==========
function getSupabase() {
    return window.supabaseDb?.client;
}

// ========== دوال مساعدة ==========
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// توليد كود إحالة فريد
async function generateReferralCode(username) {
    const supabase = getSupabase();
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    
    let isUnique = false;
    let code = '';
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        code = `${cleanUsername}${random}${timestamp}`.substring(0, 12);
        
        if (supabase) {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', code)
                .maybeSingle();
            
            if (!data) isUnique = true;
        } else {
            isUnique = true;
        }
        attempts++;
    }
    
    return code;
}

// ========== دوال الباقات ==========

// الحصول على جميع الباقات النشطة
async function getAllPackages() {
    const supabase = getSupabase();
    if (!supabase) return [];
    
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
    const supabase = getSupabase();
    if (!supabase) return null;
    
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
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    const dailyProfit = parseFloat((packageData.price * (packageData.profit || 2.5) / 100).toFixed(2));
    
    const newPackage = {
        id: generateUUID(),
        name: packageData.name,
        price: parseFloat(packageData.price),
        profit: parseFloat(packageData.profit || 2.5),
        daily_profit: dailyProfit,
        tasks: parseInt(packageData.tasks || 5),
        duration: parseInt(packageData.duration || 30),
        status: 'active',
        category: packageData.category || 'standard',
        description: packageData.description || '',
        users_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabase
            .from('packages')
            .insert([newPackage])
            .select()
            .single();
        
        if (error) throw error;
        broadcastUpdate('packages');
        return data;
    } catch (error) {
        console.error('خطأ في إضافة الباقة:', error);
        throw error;
    }
}

// حذف باقة
async function deletePackage(packageId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    try {
        const { error } = await supabase
            .from('packages')
            .delete()
            .eq('id', packageId);
        
        if (error) throw error;
        broadcastUpdate('packages');
        return true;
    } catch (error) {
        console.error('خطأ في حذف الباقة:', error);
        throw error;
    }
}

// تحديث باقة
async function updatePackage(packageId, updates) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    updates.updated_at = new Date().toISOString();
    
    if (updates.price || updates.profit) {
        const price = updates.price || 0;
        const profit = updates.profit || 2.5;
        updates.daily_profit = parseFloat((price * profit / 100).toFixed(2));
    }
    
    try {
        const { data, error } = await supabase
            .from('packages')
            .update(updates)
            .eq('id', packageId)
            .select()
            .single();
        
        if (error) throw error;
        broadcastUpdate('packages');
        return data;
    } catch (error) {
        console.error('خطأ في تحديث الباقة:', error);
        throw error;
    }
}

// ========== دوال المهام ==========

// الحصول على جميع المهام النشطة
async function getAllTasks() {
    const supabase = getSupabase();
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب المهام:', error);
        return [];
    }
}

// الحصول على مهام المستخدم حسب باقته
async function getUserTasks(userPackage) {
    if (!userPackage || !userPackage.category) return [];
    
    const supabase = getSupabase();
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .contains('package_categories', [userPackage.category]);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('خطأ في جلب مهام المستخدم:', error);
        return [];
    }
}

// الحصول على مهمة بواسطة ID
async function getTaskById(id) {
    const supabase = getSupabase();
    if (!supabase) return null;
    
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
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    if (!taskData.packageCategories || taskData.packageCategories.length === 0) {
        throw new Error('يجب اختيار فئة واحدة على الأقل');
    }
    
    const newTask = {
        id: generateUUID(),
        title: taskData.title,
        description: taskData.description,
        reward: parseFloat(taskData.reward),
        type: taskData.type || 'daily',
        status: 'active',
        completions: 0,
        available_for: taskData.availableFor || 'all',
        package_categories: taskData.packageCategories,
        difficulty: taskData.difficulty || 'easy',
        time_required: parseInt(taskData.timeRequired || 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select()
            .single();
        
        if (error) throw error;
        broadcastUpdate('tasks');
        return data;
    } catch (error) {
        console.error('خطأ في إضافة المهمة:', error);
        throw error;
    }
}

// حذف مهمة
async function deleteTask(taskId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        broadcastUpdate('tasks');
        return true;
    } catch (error) {
        console.error('خطأ في حذف المهمة:', error);
        throw error;
    }
}

// تحديث مهمة
async function updateTask(taskId, updates) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');
    
    updates.updated_at = new Date().toISOString();
    
    if (updates.packageCategories) {
        updates.package_categories = updates.packageCategories;
        delete updates.packageCategories;
    }
    
    if (updates.availableFor) {
        updates.available_for = updates.availableFor;
        delete updates.availableFor;
    }
    
    if (updates.timeRequired) {
        updates.time_required = updates.timeRequired;
        delete updates.timeRequired;
    }
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();
        
        if (error) throw error;
        broadcastUpdate('tasks');
        return data;
    } catch (error) {
        console.error('خطأ في تحديث المهمة:', error);
        throw error;
    }
}

// زيادة عدد مرات إكمال المهمة
async function incrementTaskCompletion(taskId) {
    const supabase = getSupabase();
    if (!supabase) return 0;
    
    try {
        const task = await getTaskById(taskId);
        if (!task) return 0;
        
        const newCompletions = (task.completions || 0) + 1;
        
        const { error } = await supabase
            .from('tasks')
            .update({ 
                completions: newCompletions,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        return newCompletions;
    } catch (error) {
        console.error('خطأ في تحديث المهمة:', error);
        return 0;
    }
}

// التحقق من إمكانية إكمال المهمة
async function canUserCompleteTask(taskId, userPackage) {
    if (!userPackage || !userPackage.category) return false;
    const task = await getTaskById(taskId);
    if (!task) return false;
    return task.package_categories?.includes(userPackage.category) || false;
}

// إحصائيات المهام
async function getTasksStats() {
    const tasks = await getAllTasks();
    return {
        total: tasks.length,
        daily: tasks.filter(t => t.type === 'daily').length,
        weekly: tasks.filter(t => t.type === 'weekly').length,
        totalCompletions: tasks.reduce((sum, task) => sum + (task.completions || 0), 0),
        totalReward: tasks.reduce((sum, task) => sum + task.reward, 0),
        byCategory: {
            standard: tasks.filter(t => t.package_categories?.includes('standard')).length,
            premium: tasks.filter(t => t.package_categories?.includes('premium')).length,
            vip: tasks.filter(t => t.package_categories?.includes('vip')).length
        }
    };
}

// ========== دوال المستخدمين ==========

// تسجيل مستخدم جديد
async function registerUser(userData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    // التحقق من عدم التكرار
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${userData.username},email.eq.${userData.email}`)
        .maybeSingle();

    if (existingUser) {
        throw new Error('اسم المستخدم أو البريد الإلكتروني موجود مسبقاً');
    }

    // التحقق من كود الإحالة
    let referredBy = null;
    if (userData.referralCode) {
        const { data: referrer } = await supabase
            .from('users')
            .select('id, name, referral_code')
            .eq('referral_code', userData.referralCode)
            .maybeSingle();

        if (referrer) {
            referredBy = userData.referralCode;
        }
    }

    const userId = generateUUID();
    const referralCode = await generateReferralCode(userData.username);

    const newUser = {
        id: userId,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        referred_by: referredBy,
        referral_code: referralCode,
        balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        tasks_completed: 0,
        referral_count: 0,
        referral_earnings: 0,
        referral_reward_paid: false,
        joined_date: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_admin: false,
        status: 'active',
        wallet_address: '',
        wallet_network: 'TRC20',
        package: null,
        pending_package: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

    if (error) throw error;
    
    broadcastUpdate('users');
    return data;
}

// تسجيل الدخول
async function loginUser(usernameOrEmail, password) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
        .eq('password', password)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    if (data.status === 'banned') throw new Error('حسابك محظور');

    // تحديث آخر تسجيل دخول
    await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

    return data;
}

// الحصول على مستخدم بواسطة ID
async function getUserById(id) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

// تحديث مستخدم
async function updateUser(id, updates) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    broadcastUpdate('users');
    return data;
}

// الحصول على جميع المستخدمين (للمشرفين)
async function getAllUsers() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}

// حذف مستخدم
async function deleteUser(userId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
    broadcastUpdate('users');
    return true;
}

// تحديث حالة المستخدم
async function updateUserStatus(userId, status, reason = '') {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const { data, error } = await supabase
        .from('users')
        .update({
            status: status,
            status_reason: reason,
            status_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    broadcastUpdate('users');
    return data;
}

// إضافة رصيد للمستخدم
async function addUserBalance(userId, amount, reason = 'إضافة رصيد') {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const user = await getUserById(userId);
    if (!user) throw new Error('المستخدم غير موجود');

    const newBalance = (user.balance || 0) + amount;

    const { data, error } = await supabase
        .from('users')
        .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;

    await addTransaction({
        user_id: userId,
        type: 'إضافة رصيد',
        amount: amount,
        description: reason,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        admin: true
    });

    broadcastUpdate('users');
    return data;
}

// ========== دوال الإحالة ==========

// الحصول على إحصائيات الإحالة
async function getReferralStats(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const user = await getUserById(userId);
    if (!user) return null;

    // الحصول على المحالين
    const { data: referredUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('referred_by', user.referral_code);

    if (error) return null;

    const activeReferrals = referredUsers?.filter(u => u.package && u.package.status === 'نشط') || [];
    const pendingReferrals = referredUsers?.filter(u => u.pending_package && !u.package) || [];
    const paidReferrals = referredUsers?.filter(u => u.referral_reward_paid === true) || [];

    let pendingCommission = 0;
    referredUsers?.forEach(u => {
        if (u.package && u.package.amount && u.referral_reward_paid !== true) {
            pendingCommission += 50;
        }
    });

    return {
        referralCode: user.referral_code || '',
        referredCount: referredUsers?.length || 0,
        activeReferrals: activeReferrals.length,
        pendingReferrals: pendingReferrals.length,
        paidReferrals: paidReferrals.length,
        totalEarned: user.referral_earnings || 0,
        pendingCommission: pendingCommission,
        conversionRate: referredUsers?.length > 0 ? ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) : 0,
        referredUsers: referredUsers?.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            username: u.username,
            joinedDate: u.joined_date,
            hasPackage: !!u.package,
            packageName: u.package ? u.package.name : 'لا يوجد',
            packageAmount: u.package ? u.package.amount : 0,
            rewardPaid: u.referral_reward_paid || false
        })) || []
    };
}

// معالجة مكافآت الإحالة
async function processReferralRewardsOnApproval(userId) {
    const supabase = getSupabase();
    if (!supabase) return false;

    const newUser = await getUserById(userId);
    if (!newUser || !newUser.referred_by) return false;

    const { data: referrer } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', newUser.referred_by)
        .single();

    if (!referrer) return false;
    if (newUser.referral_reward_paid) return false;

    const REFERRER_REWARD = 50;
    const REFEREE_REWARD = 20;

    // تحديث رصيد المستخدم الجديد
    await updateUser(newUser.id, {
        balance: (newUser.balance || 0) + REFEREE_REWARD,
        referral_reward_paid: true,
        referral_reward_amount: REFEREE_REWARD,
        referral_reward_date: new Date().toISOString()
    });

    // تحديث رصيد المحيل
    await updateUser(referrer.id, {
        balance: (referrer.balance || 0) + REFERRER_REWARD,
        referral_count: (referrer.referral_count || 0) + 1,
        referral_earnings: (referrer.referral_earnings || 0) + REFERRER_REWARD
    });

    // إضافة المعاملات
    await addTransaction({
        user_id: newUser.id,
        type: 'مكافأة إحالة',
        amount: REFEREE_REWARD,
        description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        referral_code: newUser.referred_by,
        referrer_name: referrer.name
    });

    await addTransaction({
        user_id: referrer.id,
        type: 'مكافأة إحالة',
        amount: REFERRER_REWARD,
        description: `💰 مكافأة إحالة: ${newUser.name}`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        referred_user_id: newUser.id,
        referred_user_name: newUser.name
    });

    broadcastUpdate('referrals');
    broadcastUpdate('users');
    
    return {
        referrer: { id: referrer.id, name: referrer.name, reward: REFERRER_REWARD },
        referee: { id: newUser.id, name: newUser.name, reward: REFEREE_REWARD }
    };
}

// ========== دوال الطلبات المعلقة ==========

// إضافة طلب اشتراك معلق
async function addPendingPackage(packageData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const newPending = {
        id: generateUUID(),
        user_id: packageData.userId,
        user_name: packageData.userName,
        user_email: packageData.userEmail,
        user_phone: packageData.userPhone,
        package_id: packageData.packageId,
        package_name: packageData.packageName,
        package_category: packageData.packageCategory,
        amount: packageData.amount,
        payment_proof: packageData.paymentProof,
        wallet_address: packageData.walletAddress,
        network: packageData.network || 'TRC20',
        transaction_hash: packageData.transactionHash,
        date: packageData.date,
        requested_date: new Date().toISOString(),
        status: 'بانتظار المراجعة',
        fast_approval: packageData.fastApproval || false,
        estimated_activation: packageData.estimatedActivation,
        referred_by: packageData.referredBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('pending_packages')
        .insert([newPending])
        .select()
        .single();

    if (error) throw error;

    // تحديث المستخدم
    await updateUser(packageData.userId, {
        pending_package: {
            id: packageData.packageId,
            name: packageData.packageName,
            amount: packageData.amount,
            dailyProfit: (packageData.amount * 2.5 / 100),
            category: packageData.packageCategory,
            requestedDate: new Date().toISOString(),
            fastApproval: packageData.fastApproval || false,
            estimatedActivation: packageData.estimatedActivation
        }
    });

    broadcastUpdate('pending');
    return data;
}

// الحصول على جميع الطلبات المعلقة
async function getPendingPackages() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('pending_packages')
        .select('*')
        .eq('status', 'بانتظار المراجعة')
        .order('requested_date', { ascending: false });

    if (error) return [];
    return data || [];
}

// قبول طلب اشتراك
async function approvePendingPackage(pendingId, adminId, notes = '') {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    // الحصول على الطلب
    const { data: pending, error: fetchError } = await supabase
        .from('pending_packages')
        .select('*')
        .eq('id', pendingId)
        .single();

    if (fetchError) throw fetchError;

    // الحصول على الباقة
    const package_ = await getPackageById(pending.package_id);
    if (!package_) throw new Error('الباقة غير موجودة');

    // تحديث المستخدم
    const user = await getUserById(pending.user_id);
    if (!user) throw new Error('المستخدم غير موجود');

    await updateUser(pending.user_id, {
        package: {
            id: package_.id,
            name: package_.name,
            amount: pending.amount,
            price: package_.price,
            profit: package_.profit,
            dailyProfit: (pending.amount * (package_.profit || 2.5) / 100),
            category: package_.category,
            purchaseDate: new Date().toISOString(),
            duration: package_.duration || 30,
            status: 'نشط'
        },
        pending_package: null
    });

    // معالجة مكافآت الإحالة
    if (user.referred_by) {
        await processReferralRewardsOnApproval(user.id);
    }

    // تحديث الطلب
    await supabase
        .from('pending_packages')
        .update({
            status: 'مقبول',
            processed_by: adminId,
            processed_at: new Date().toISOString(),
            notes: notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', pendingId);

    // إضافة معاملة
    await addTransaction({
        user_id: pending.user_id,
        type: 'اشتراك',
        amount: pending.amount,
        description: `تفعيل باقة ${pending.package_name}`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        notes: notes
    });

    broadcastUpdate('pending');
    broadcastUpdate('users');
    broadcastUpdate('packages');
    
    return true;
}

// رفض طلب اشتراك
async function rejectPendingPackage(pendingId, adminId, notes = '') {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const { data: pending } = await supabase
        .from('pending_packages')
        .select('*')
        .eq('id', pendingId)
        .single();

    if (pending) {
        // إزالة الطلب المعلق من المستخدم
        await updateUser(pending.user_id, {
            pending_package: null
        });
    }

    const { error } = await supabase
        .from('pending_packages')
        .update({
            status: 'مرفوض',
            processed_by: adminId,
            processed_at: new Date().toISOString(),
            notes: notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', pendingId);

    if (error) throw error;

    broadcastUpdate('pending');
    return true;
}

// ========== دوال المعاملات ==========

// إضافة معاملة
async function addTransaction(transactionData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const newTransaction = {
        id: generateUUID(),
        user_id: transactionData.user_id,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        date: transactionData.date || new Date().toLocaleString('ar-SA'),
        status: transactionData.status || 'مكتمل',
        referral_code: transactionData.referral_code,
        referrer_name: transactionData.referrer_name,
        referred_user_id: transactionData.referred_user_id,
        referred_user_name: transactionData.referred_user_name,
        admin: transactionData.admin || false,
        notes: transactionData.notes,
        tx_hash: transactionData.tx_hash,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()
        .single();

    if (error) throw error;
    broadcastUpdate('transactions');
    return data;
}

// الحصول على معاملات المستخدم
async function getUserTransactions(userId, limit = 50) {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return [];
    return data || [];
}

// الحصول على جميع المعاملات (للمشرفين)
async function getAllTransactions() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('transactions')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) return [];
    
    return (data || []).map(t => ({
        ...t,
        userName: t.users?.name,
        userEmail: t.users?.email
    }));
}

// ========== دوال طلبات السحب ==========

// إضافة طلب سحب
async function addWithdrawal(withdrawalData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const newWithdrawal = {
        id: generateUUID(),
        user_id: withdrawalData.user_id,
        amount: withdrawalData.amount,
        wallet: withdrawalData.wallet,
        network: withdrawalData.network || 'TRC20',
        fee: withdrawalData.fee || 5,
        total: withdrawalData.total,
        status: 'معلق',
        date: new Date().toLocaleString('ar-SA'),
        notes: withdrawalData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('withdrawals')
        .insert([newWithdrawal])
        .select()
        .single();

    if (error) throw error;

    // خصم المبلغ من رصيد المستخدم
    const user = await getUserById(withdrawalData.user_id);
    if (user) {
        await updateUser(withdrawalData.user_id, {
            balance: (user.balance || 0) - withdrawalData.total
        });
    }

    // إضافة معاملة
    await addTransaction({
        user_id: withdrawalData.user_id,
        type: 'سحب',
        amount: -withdrawalData.total,
        description: `طلب سحب ${withdrawalData.amount}$ (${withdrawalData.fee}$ رسوم ${withdrawalData.network})`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'معلق'
    });

    broadcastUpdate('withdrawals');
    return data;
}

// الحصول على طلبات سحب المستخدم
async function getUserWithdrawals(userId) {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}

// الحصول على جميع طلبات السحب (للمشرفين)
async function getAllWithdrawals() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('withdrawals')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false });

    if (error) return [];
    
    return (data || []).map(w => ({
        ...w,
        userName: w.users?.name,
        userEmail: w.users?.email
    }));
}

// تحديث حالة طلب سحب
async function updateWithdrawalStatus(withdrawalId, status, adminId, txHash = '', notes = '') {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const updates = {
        status: status,
        processed_by: adminId,
        processed_date: new Date().toLocaleString('ar-SA'),
        notes: notes,
        updated_at: new Date().toISOString()
    };

    if (txHash) updates.tx_hash = txHash;

    const { data, error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', withdrawalId)
        .select()
        .single();

    if (error) throw error;

    // إذا كان مرفوضاً، إعادة المبلغ للرصيد
    if (status === 'مرفوض') {
        const withdrawal = await supabase
            .from('withdrawals')
            .select('*')
            .eq('id', withdrawalId)
            .single();

        if (withdrawal.data) {
            const user = await getUserById(withdrawal.data.user_id);
            if (user) {
                await updateUser(withdrawal.data.user_id, {
                    balance: (user.balance || 0) + withdrawal.data.total
                });
            }
        }
    }

    broadcastUpdate('withdrawals');
    return data;
}

// ========== دوال إحصائيات لوحة التحكم ==========

// الحصول على إحصائيات لوحة التحكم
async function getDashboardStats() {
    const supabase = getSupabase();
    if (!supabase) return {};

    try {
        // عدد المستخدمين
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // المستخدمين النشطين
        const { count: activeUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // المستخدمين المعلقين
        const { count: suspendedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'suspended');

        // المستخدمين المحظورين
        const { count: bannedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'banned');

        // الطلبات المعلقة
        const { count: pendingPackages } = await supabase
            .from('pending_packages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'بانتظار المراجعة');

        const { count: pendingWithdrawals } = await supabase
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'معلق');

        // عدد الباقات
        const { count: packagesCount } = await supabase
            .from('packages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // إجمالي الإيداعات (من المستخدمين)
        const { data: users } = await supabase
            .from('users')
            .select('package');

        let totalDeposits = 0;
        let activeSubscriptions = 0;

        users?.forEach(user => {
            if (user.package && user.package.status === 'نشط') {
                totalDeposits += user.package.amount || 0;
                activeSubscriptions++;
            }
        });

        // إجمالي المسحوبات
        const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('status', 'مكتمل');

        const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

        // إجمالي المهام
        const tasks = await getAllTasks();
        const totalCompletions = tasks.reduce((sum, task) => sum + (task.completions || 0), 0);
        const totalTasksReward = tasks.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);

        return {
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            suspendedUsers: suspendedUsers || 0,
            bannedUsers: bannedUsers || 0,
            totalDeposits: totalDeposits,
            totalWithdrawals: totalWithdrawals,
            activeSubscriptions: activeSubscriptions,
            pendingPackages: pendingPackages || 0,
            pendingWithdrawals: pendingWithdrawals || 0,
            totalTasks: tasks.length,
            totalCompletions: totalCompletions,
            totalTasksReward: totalTasksReward,
            packagesCount: packagesCount || 0,
            netRevenue: totalDeposits - totalWithdrawals
        };
    } catch (error) {
        console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
        return {};
    }
}

// إحصائيات إدارة المستخدمين
async function getUserManagementStats() {
    const supabase = getSupabase();
    if (!supabase) return {};

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

    const { count: pendingPackages } = await supabase
        .from('pending_packages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'بانتظار المراجعة');

    // حساب إجمالي الأرصدة
    const { data: users } = await supabase
        .from('users')
        .select('balance, package');

    let totalBalance = 0;
    let activeWithPackage = 0;

    users?.forEach(user => {
        totalBalance += user.balance || 0;
        if (user.package && user.package.status === 'نشط') {
            activeWithPackage++;
        }
    });

    return {
        total: total || 0,
        active: active || 0,
        suspended: suspended || 0,
        banned: banned || 0,
        withPackage: activeWithPackage,
        pendingPackages: pendingPackages || 0,
        totalBalance: totalBalance,
        totalEarned: 0,
        totalWithdrawn: 0
    };
}

// تفاصيل المستخدم
async function getUserDetails(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const user = await getUserById(userId);
    if (!user) return null;

    // المعاملات
    const transactions = await getUserTransactions(userId);
    
    // طلبات السحب
    const withdrawals = await getUserWithdrawals(userId);
    const totalWithdrawn = withdrawals
        .filter(w => w.status === 'مكتمل')
        .reduce((sum, w) => sum + w.amount, 0);

    // أرباح اليوم
    const today = new Date().toDateString();
    const todayEarnings = transactions
        .filter(t => {
            const tDate = new Date(t.date).toDateString();
            return tDate === today && ['ربح', 'مكافأة', 'مكافأة إحالة'].includes(t.type);
        })
        .reduce((sum, t) => sum + t.amount, 0);

    // إحصائيات الإحالة
    const referralStats = await getReferralStats(userId);

    return {
        ...user,
        totalWithdrawn,
        todayEarnings,
        withdrawalsCount: withdrawals.length,
        transactionsCount: transactions.length,
        referralStats
    };
}

// ========== دوال إعدادات النظام ==========

// الحصول على إعدادات النظام
async function getSystemSettings(key) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

    if (error) return null;
    return data?.value || null;
}

// تحديث إعدادات النظام
async function updateSystemSettings(key, value) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase غير متصل');

    const { data, error } = await supabase
        .from('system_settings')
        .upsert({
            key: key,
            value: value,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ========== دوال مساعدة ==========

// حساب الأيام المتبقية
function calculateDaysLeft(purchaseDate, duration = 30) {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const endDate = new Date(purchase);
    endDate.setDate(endDate.getDate() + duration);
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
}

// حساب إجمالي الأرباح
function calculateTotalProfit(pkg) {
    if (!pkg || !pkg.purchaseDate) return 0;
    const daysPassed = Math.ceil((new Date() - new Date(pkg.purchaseDate)) / (1000 * 60 * 60 * 24));
    const dailyProfit = pkg.dailyProfit || (pkg.amount * 0.025);
    return parseFloat((dailyProfit * Math.min(daysPassed, pkg.duration || 30)).toFixed(2));
}

// ========== بث التحديثات ==========

function broadcastUpdate(type) {
    const event = new CustomEvent('data-updated', { 
        detail: { 
            type: type,
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(event);
}

// ========== التهيئة ==========

async function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة مع Supabase...');
    
    const supabase = getSupabase();
    if (supabase) {
        console.log('✅ Supabase متصل وجاهز للعمل');
    } else {
        console.warn('⚠️ Supabase غير متصل، بعض الوظائف قد لا تعمل');
    }
    
    console.log('📦 نظام البيانات المشتركة جاهز');
}

// ========== التصدير ==========

const SharedData = {
    // الباقات
    getAllPackages,
    getPackageById,
    addPackage,
    deletePackage,
    updatePackage,
    
    // المهام
    getAllTasks,
    getUserTasks,
    getTaskById,
    addTask,
    deleteTask,
    updateTask,
    incrementTaskCompletion,
    canUserCompleteTask,
    getTasksStats,
    
    // المستخدمين
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    getAllUsers,
    deleteUser,
    updateUserStatus,
    addUserBalance,
    
    // الإحالة
    generateReferralCode,
    getReferralStats,
    processReferralRewardsOnApproval,
    
    // الطلبات المعلقة
    addPendingPackage,
    getPendingPackages,
    approvePendingPackage,
    rejectPendingPackage,
    
    // المعاملات
    addTransaction,
    getUserTransactions,
    getAllTransactions,
    
    // طلبات السحب
    addWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus,
    
    // الإحصائيات
    getDashboardStats,
    getUserManagementStats,
    getUserDetails,
    
    // إعدادات النظام
    getSystemSettings,
    updateSystemSettings,
    
    // دوال مساعدة
    calculateDaysLeft,
    calculateTotalProfit,
    
    // البث
    broadcastUpdate,
    
    // التهيئة
    init: initializeSharedData
};

window.sharedData = SharedData;

// تهيئة تلقائية
if (typeof window !== 'undefined') {
    setTimeout(() => {
        SharedData.init();
    }, 1000);
}