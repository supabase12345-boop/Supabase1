// ===================================
// نظام البيانات المشتركة بين الصفحات - نسخة Supabase UUID
// ===================================

// ========== متغيرات التخزين المؤقت ==========
let CACHED_PACKAGES = null;
let CACHED_TASKS = null;
let LAST_SYNC_TIME = 0;
const SYNC_INTERVAL = 60000; // 60 ثانية

// ========== نظام كود الإحالة ==========
const REFERRAL_SETTINGS = {
    referrerReward: 50,
    refereeReward: 20,
    minPackageForReward: 0,
    maxReferralLevels: 1,
    enableReferralSystem: true
};

// ========== التحقق من الاتصال بـ Supabase ==========
function isSupabaseAvailable() {
    return typeof window.supabaseDb !== 'undefined' && window.supabaseDb !== null;
}

// ========== UUID Generator للاستخدام المحلي ==========
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ========== الباقات الثابتة (للنسخ الاحتياطي) ==========
const DEFAULT_PACKAGES = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        name: "الباقة الفضية",
        price: 500,
        profit: 2.5,
        dailyProfit: 12.5,
        tasks: 5,
        duration: 30,
        status: "active",
        description: "الباقة المثالية للمبتدئين",
        category: "standard",
        users: 0,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: "الباقة الذهبية",
        price: 1000,
        profit: 2.5,
        dailyProfit: 25,
        tasks: 5,
        duration: 30,
        status: "active",
        description: "الباقة الأكثر طلباً",
        category: "premium",
        users: 0,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        name: "الباقة الماسية",
        price: 5000,
        profit: 2.5,
        dailyProfit: 125,
        tasks: 5,
        duration: 30,
        status: "active",
        description: "للحصول على أفضل العوائد",
        category: "vip",
        users: 0,
        createdAt: "2024-01-01T00:00:00.000Z"
    }
];

// ========== المهام الثابتة (للنسخ الاحتياطي) ==========
const DEFAULT_TASKS = [
    {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: "مشاهدة فيديو تعليمي",
        description: "شاهد فيديو لمدة 2 دقيقة عن أساسيات الاستثمار",
        reward: 2.5,
        type: "daily",
        status: "active",
        completions: 0,
        availableFor: "all",
        packageCategories: ["standard", "premium", "vip"],
        difficulty: "easy",
        timeRequired: 2,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: "مشاركة رابط الإحالة",
        description: "شارك رابط الإحالة الخاص بك مع صديق واحد على الأقل",
        reward: 5,
        type: "daily",
        status: "active",
        completions: 0,
        availableFor: "all",
        packageCategories: ["premium", "vip"],
        difficulty: "medium",
        timeRequired: 3,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        title: "تقييم المنصة",
        description: "أكمل استبيان تقييم المنصة (5 أسئلة)",
        reward: 4,
        type: "daily",
        status: "active",
        completions: 0,
        availableFor: "premium",
        packageCategories: ["premium", "vip"],
        difficulty: "easy",
        timeRequired: 4,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        title: "تحليل السوق اليومي",
        description: "اقرأ تحليل السوق اليومي وأجب على سؤال واحد",
        reward: 6,
        type: "daily",
        status: "active",
        completions: 0,
        availableFor: "vip",
        packageCategories: ["vip"],
        difficulty: "hard",
        timeRequired: 5,
        createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        title: "مهمة حصرية VIP",
        description: "مهمة خاصة لمستخدمي VIP فقط - استشارة استثمارية",
        reward: 10,
        type: "daily",
        status: "active",
        completions: 0,
        availableFor: "vip",
        packageCategories: ["vip"],
        difficulty: "hard",
        timeRequired: 8,
        createdAt: "2024-01-01T00:00:00.000Z"
    }
];

// ========== دوال الباقات ==========

// تحميل الباقات من Supabase
async function loadPackagesFromStorage() {
    try {
        if (isSupabaseAvailable()) {
            const { data, error } = await window.supabaseDb.supabase
                .from('packages')
                .select('*')
                .eq('status', 'active');
            
            if (!error && data && data.length > 0) {
                CACHED_PACKAGES = data;
                return data;
            }
        }
    } catch (e) {
        console.error('خطأ في تحميل الباقات من Supabase:', e);
    }
    
    // استخدام الباقات الثابتة كنسخة احتياطية
    CACHED_PACKAGES = DEFAULT_PACKAGES;
    return DEFAULT_PACKAGES;
}

// الحصول على جميع الباقات
async function getAllPackages() {
    if (CACHED_PACKAGES && Date.now() - LAST_SYNC_TIME < SYNC_INTERVAL) {
        return CACHED_PACKAGES;
    }
    
    const packages = await loadPackagesFromStorage();
    LAST_SYNC_TIME = Date.now();
    return packages;
}

// الحصول على باقة بواسطة ID
async function getPackageById(id) {
    if (isSupabaseAvailable()) {
        try {
            const { data, error } = await window.supabaseDb.supabase
                .from('packages')
                .select('*')
                .eq('id', id)
                .single();
            
            if (!error && data) return data;
        } catch (e) {
            console.error('خطأ في جلب الباقة من Supabase:', e);
        }
    }
    
    const packages = await getAllPackages();
    return packages.find(pkg => pkg.id === id);
}

// إضافة باقة جديدة
async function addNewPackage(packageData) {
    const newId = generateUUID();
    const dailyProfit = parseFloat((packageData.price * (packageData.profit || 2.5) / 100).toFixed(2));
    
    const newPackage = {
        id: newId,
        name: packageData.name,
        price: parseFloat(packageData.price),
        profit: parseFloat(packageData.profit || 2.5),
        daily_profit: dailyProfit,
        tasks: parseInt(packageData.tasks || 5),
        duration: parseInt(packageData.duration || 30),
        status: "active",
        category: packageData.category || "standard",
        description: packageData.description || "",
        users_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('packages')
                .insert([newPackage]);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في حفظ الباقة إلى Supabase:', e);
        }
    }
    
    broadcastUpdate('packages');
    return newPackage;
}

// حذف باقة
async function deletePackage(packageId) {
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('packages')
                .delete()
                .eq('id', packageId);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في حذف الباقة من Supabase:', e);
        }
    }
    
    broadcastUpdate('packages');
    return true;
}

// تحديث باقة
async function updatePackage(packageId, updates) {
    updates.updated_at = new Date().toISOString();
    
    if (updates.price || updates.profit) {
        const price = updates.price || 0;
        const profit = updates.profit || 2.5;
        updates.daily_profit = parseFloat((price * profit / 100).toFixed(2));
    }
    
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('packages')
                .update(updates)
                .eq('id', packageId);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في تحديث الباقة في Supabase:', e);
        }
    }
    
    broadcastUpdate('packages');
    return true;
}

// ========== دوال المهام ==========

// تحميل المهام من Supabase
async function loadTasksFromStorage() {
    try {
        if (isSupabaseAvailable()) {
            const { data, error } = await window.supabaseDb.supabase
                .from('tasks')
                .select('*')
                .eq('status', 'active');
            
            if (!error && data && data.length > 0) {
                CACHED_TASKS = data;
                return data;
            }
        }
    } catch (e) {
        console.error('خطأ في تحميل المهام من Supabase:', e);
    }
    
    // استخدام المهام الثابتة كنسخة احتياطية
    CACHED_TASKS = DEFAULT_TASKS;
    return DEFAULT_TASKS;
}

// الحصول على جميع المهام
async function getAllTasks() {
    if (CACHED_TASKS && Date.now() - LAST_SYNC_TIME < SYNC_INTERVAL) {
        return CACHED_TASKS;
    }
    
    const tasks = await loadTasksFromStorage();
    LAST_SYNC_TIME = Date.now();
    return tasks;
}

// الحصول على مهمة بواسطة ID
async function getTaskById(id) {
    if (isSupabaseAvailable()) {
        try {
            const { data, error } = await window.supabaseDb.supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();
            
            if (!error && data) return data;
        } catch (e) {
            console.error('خطأ في جلب المهمة من Supabase:', e);
        }
    }
    
    const tasks = await getAllTasks();
    return tasks.find(task => task.id === id);
}

// الحصول على مهام المستخدم حسب باقته
async function getUserTasks(userPackage) {
    if (!userPackage) return [];
    
    const allTasks = await getAllTasks();
    const userCategory = userPackage.category;
    
    return allTasks.filter(task => {
        if (task.status !== 'active') return false;
        if (!task.package_categories && !task.packageCategories) return false;
        const categories = task.package_categories || task.packageCategories || [];
        return categories.includes(userCategory);
    });
}

// زيادة عدد مرات إكمال المهمة
async function incrementTaskCompletion(taskId) {
    if (isSupabaseAvailable()) {
        try {
            const task = await getTaskById(taskId);
            if (task) {
                const newCompletions = (task.completions || 0) + 1;
                const { error } = await window.supabaseDb.supabase
                    .from('tasks')
                    .update({ 
                        completions: newCompletions,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', taskId);
                
                if (!error) return newCompletions;
            }
        } catch (e) {
            console.error('خطأ في تحديث المهمة في Supabase:', e);
        }
    }
    return 0;
}

// التحقق من إمكانية إكمال المهمة
async function canUserCompleteTask(taskId, userPackage) {
    if (!userPackage) return false;
    const task = await getTaskById(taskId);
    if (!task) return false;
    const categories = task.package_categories || task.packageCategories || [];
    return categories.includes(userPackage.category);
}

// إضافة مهمة جديدة
async function addNewTask(taskData) {
    if (!taskData.packageCategories || taskData.packageCategories.length === 0) {
        throw new Error('يجب اختيار فئة واحدة على الأقل');
    }
    
    const newId = generateUUID();
    
    const newTask = {
        id: newId,
        title: taskData.title,
        description: taskData.description,
        reward: parseFloat(taskData.reward),
        type: taskData.type || "daily",
        status: "active",
        completions: 0,
        available_for: taskData.availableFor || "all",
        package_categories: taskData.packageCategories,
        difficulty: taskData.difficulty || "easy",
        time_required: parseInt(taskData.timeRequired || 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('tasks')
                .insert([newTask]);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في حفظ المهمة إلى Supabase:', e);
        }
    }
    
    broadcastUpdate('tasks');
    return newTask;
}

// حذف مهمة
async function deleteTask(taskId) {
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في حذف المهمة من Supabase:', e);
        }
    }
    
    broadcastUpdate('tasks');
    return true;
}

// تحديث مهمة
async function updateTask(taskId, updates) {
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
    
    if (isSupabaseAvailable()) {
        try {
            const { error } = await window.supabaseDb.supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId);
            
            if (error) throw error;
        } catch (e) {
            console.error('خطأ في تحديث المهمة في Supabase:', e);
        }
    }
    
    broadcastUpdate('tasks');
    return true;
}

// الحصول على إحصائيات المهام
async function getTasksStats() {
    const allTasks = await getAllTasks();
    return {
        total: allTasks.length,
        daily: allTasks.filter(t => t.type === "daily").length,
        weekly: allTasks.filter(t => t.type === "weekly").length,
        totalCompletions: allTasks.reduce((sum, task) => sum + (task.completions || 0), 0),
        totalReward: allTasks.reduce((sum, task) => sum + task.reward, 0),
        byCategory: {
            standard: allTasks.filter(t => {
                const cats = t.package_categories || t.packageCategories || [];
                return cats.includes("standard");
            }).length,
            premium: allTasks.filter(t => {
                const cats = t.package_categories || t.packageCategories || [];
                return cats.includes("premium");
            }).length,
            vip: allTasks.filter(t => {
                const cats = t.package_categories || t.packageCategories || [];
                return cats.includes("vip");
            }).length
        }
    };
}

// ========== دوال كود الإحالة ==========

// توليد كود إحالة
async function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

// الحصول على إحصائيات الإحالة
async function getReferralStats(userId) {
    if (!userId) return null;
    
    try {
        if (isSupabaseAvailable()) {
            // جلب المستخدم الحالي
            const { data: currentUser, error: userError } = await window.supabaseDb.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (userError || !currentUser) return null;
            
            // إنشاء كود إحالة إذا لم يكن موجوداً
            if (!currentUser.referral_code) {
                const newCode = await generateReferralCode(currentUser.username || `USER${userId}`);
                const { error: updateError } = await window.supabaseDb.supabase
                    .from('users')
                    .update({ referral_code: newCode })
                    .eq('id', userId);
                
                if (!updateError) currentUser.referral_code = newCode;
            }
            
            // جلب المستخدمين المحالين
            const { data: referredUsers, error: referredError } = await window.supabaseDb.supabase
                .from('users')
                .select('*')
                .eq('referred_by', currentUser.referral_code);
            
            if (referredError) throw referredError;
            
            const activeReferrals = referredUsers?.filter(u => u.package && u.package.status === 'نشط') || [];
            const pendingReferrals = referredUsers?.filter(u => u.pending_package && !u.package) || [];
            const paidReferrals = referredUsers?.filter(u => u.referral_reward_paid === true) || [];
            
            let pendingCommission = 0;
            referredUsers?.forEach(u => {
                if (u.package && u.package.amount && u.referral_reward_paid !== true) {
                    pendingCommission += REFERRAL_SETTINGS.referrerReward;
                }
            });
            
            return {
                referralCode: currentUser.referral_code || '',
                referredCount: referredUsers?.length || 0,
                activeReferrals: activeReferrals.length,
                pendingReferrals: pendingReferrals.length,
                paidReferrals: paidReferrals.length,
                totalEarned: currentUser.referral_earnings || 0,
                pendingCommission: pendingCommission,
                conversionRate: referredUsers?.length > 0 ? 
                    ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) : 0,
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
    } catch (e) {
        console.error('خطأ في جلب إحصائيات الإحالة:', e);
    }
    
    return null;
}

// معالجة مكافآت الإحالة
async function processReferralRewardsOnApproval(userId, packageAmount) {
    if (!isSupabaseAvailable()) return false;
    
    try {
        // جلب المستخدم الجديد
        const { data: newUser, error: userError } = await window.supabaseDb.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError || !newUser || !newUser.referred_by) return false;
        
        // جلب المحيل
        const { data: referrer, error: referrerError } = await window.supabaseDb.supabase
            .from('users')
            .select('*')
            .eq('referral_code', newUser.referred_by)
            .single();
        
        if (referrerError || !referrer) return false;
        
        if (newUser.referral_reward_paid === true) return false;
        
        // تحديث رصيد المستخدم الجديد
        await window.supabaseDb.supabase
            .from('users')
            .update({
                balance: (newUser.balance || 0) + REFERRAL_SETTINGS.refereeReward,
                referral_reward_paid: true,
                referral_reward_amount: REFERRAL_SETTINGS.refereeReward,
                referral_reward_date: new Date().toISOString()
            })
            .eq('id', userId);
        
        // تحديث رصيد المحيل
        await window.supabaseDb.supabase
            .from('users')
            .update({
                balance: (referrer.balance || 0) + REFERRAL_SETTINGS.referrerReward,
                referral_count: (referrer.referral_count || 0) + 1,
                referral_earnings: (referrer.referral_earnings || 0) + REFERRAL_SETTINGS.referrerReward
            })
            .eq('id', referrer.id);
        
        // إضافة معاملات
        const now = new Date().toISOString();
        
        await window.supabaseDb.supabase
            .from('transactions')
            .insert([
                {
                    id: generateUUID(),
                    user_id: userId,
                    type: 'مكافأة إحالة',
                    amount: REFERRAL_SETTINGS.refereeReward,
                    description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
                    date: new Date().toLocaleString('ar-SA'),
                    status: 'مكتمل',
                    referral_code: newUser.referred_by,
                    referrer_name: referrer.name,
                    created_at: now
                },
                {
                    id: generateUUID(),
                    user_id: referrer.id,
                    type: 'مكافأة إحالة',
                    amount: REFERRAL_SETTINGS.referrerReward,
                    description: `💰 مكافأة إحالة: ${newUser.name}`,
                    date: new Date().toLocaleString('ar-SA'),
                    status: 'مكتمل',
                    referred_user_id: userId,
                    referred_user_name: newUser.name,
                    created_at: now
                }
            ]);
        
        broadcastUpdate('referrals');
        broadcastUpdate('users');
        
        return {
            referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward },
            referee: { id: newUser.id, name: newUser.name, reward: REFERRAL_SETTINGS.refereeReward }
        };
    } catch (e) {
        console.error('خطأ في معالجة مكافآت الإحالة:', e);
        return false;
    }
}

// ========== دوال المستخدمين (للتخزين المحلي المؤقت) ==========

// حفظ المستخدمين في localStorage (للنسخ الاحتياطي)
function saveUsersToStorage(users) {
    localStorage.setItem('elite_users', JSON.stringify(users));
}

// إضافة معاملة مستخدم (للنسخ الاحتياطي)
function addUserTransaction(userId, transaction) {
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    transactions.unshift({
        ...transaction,
        id: transaction.id || generateUUID()
    });
    localStorage.setItem(`user_transactions_${userId}`, JSON.stringify(transactions.slice(0, 200)));
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
    const dailyProfit = pkg.dailyProfit || (pkg.amount * (pkg.profit || 2.5) / 100);
    return parseFloat((dailyProfit * Math.min(daysPassed, pkg.duration || 30)).toFixed(2));
}

// ========== بث التحديثات ==========

// بث تحديث
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

// تهيئة البيانات المشتركة
async function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة...');
    
    await loadPackagesFromStorage();
    await loadTasksFromStorage();
    
    console.log(`✅ تم تحميل ${CACHED_PACKAGES?.length || 0} باقة و ${CACHED_TASKS?.length || 0} مهمة`);
    console.log(`💰 نظام الإحالة: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
}

// ========== التصدير ==========

const SharedData = {
    // الباقات
    packages: DEFAULT_PACKAGES,
    savePackages: loadPackagesFromStorage,
    loadPackages: loadPackagesFromStorage,
    addPackage: addNewPackage,
    deletePackage: deletePackage,
    updatePackage: updatePackage,
    getAllPackages: getAllPackages,
    getPackageById: getPackageById,
    
    // المهام
    tasks: DEFAULT_TASKS,
    saveTasks: loadTasksFromStorage,
    loadTasks: loadTasksFromStorage,
    addTask: addNewTask,
    deleteTask: deleteTask,
    updateTask: updateTask,
    getAllTasks: getAllTasks,
    getUserTasks: getUserTasks,
    getTaskById: getTaskById,
    incrementTaskCompletion: incrementTaskCompletion,
    canUserCompleteTask: canUserCompleteTask,
    getTasksStats: getTasksStats,
    
    // نظام الإحالة
    REFERRAL_SETTINGS: REFERRAL_SETTINGS,
    generateReferralCode: generateReferralCode,
    getReferralStats: getReferralStats,
    processReferralRewardsOnApproval: processReferralRewardsOnApproval,
    
    // إدارة المستخدمين (للتخزين المحلي)
    saveUsersToStorage: saveUsersToStorage,
    addUserTransaction: addUserTransaction,
    
    // دوال مساعدة
    calculateDaysLeft: calculateDaysLeft,
    calculateTotalProfit: calculateTotalProfit,
    
    // البث
    broadcastUpdate: broadcastUpdate,
    
    // تهيئة
    init: initializeSharedData,
    
    // UUID Generator
    generateUUID: generateUUID
};

// تصدير للاستخدام العام
window.sharedData = SharedData;

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
    // انتظار تحميل Supabase
    const waitForSupabase = setInterval(() => {
        if (typeof window.supabaseDb !== 'undefined' || !window.supabaseDb) {
            clearInterval(waitForSupabase);
            SharedData.init();
        }
    }, 100);
    
    // Timeout بعد 5 ثواني
    setTimeout(() => {
        clearInterval(waitForSupabase);
        if (!window.supabaseDb) {
            console.log('⚠️ لم يتم تحميل Supabase، استخدام الباقات والمهام الافتراضية');
            SharedData.init();
        }
    }, 5000);
}