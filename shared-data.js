// ===================================
// نظام البيانات المشتركة بين الصفحات - النسخة النهائية المصححة
// متوافق مع Supabase وجميع الصفحات
// ===================================

// ========== انتظار تحميل SupabaseClient ==========
window.waitForSupabase = function(callback, maxAttempts = 50) {
    let attempts = 0;
    
    function check() {
        attempts++;
        if (window.SupabaseClient && window.SupabaseClient.client) {
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(check, 100);
        } else {
            console.warn('⚠️ SupabaseClient not loaded after', maxAttempts, 'attempts');
            // استمر على أي حال - سنستخدم localStorage
            callback();
        }
    }
    
    check();
};

// ========== نظام الباقات الافتراضية ==========
let SHARED_PACKAGES = [
    {
        id: 1,
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
        id: 2,
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
        id: 3,
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

// ========== نظام المهام الافتراضية ==========
let SHARED_TASKS = [
    {
        id: 1,
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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

// ========== نظام كود الإحالة ==========
const REFERRAL_SETTINGS = {
    referrerReward: 50,
    refereeReward: 20,
    minPackageForReward: 0,
    maxReferralLevels: 1,
    enableReferralSystem: true
};

// ========== دوال كود الإحالة ==========
function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

// الحصول على إحصائيات الإحالة (مع دعم Supabase)
async function getReferralStats(userId) {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.referrals) {
        try {
            const result = await window.SupabaseClient.referrals.getStats(userId);
            if (result) return result;
        } catch (error) {
            console.warn('Supabase referral stats failed, using localStorage:', error);
        }
    }
    
    // الرجوع إلى localStorage
    return getReferralStatsFromLocal(userId);
}

function getReferralStatsFromLocal(userId) {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const currentUser = users.find(u => u.id === userId);
        
        if (!currentUser) return null;
        
        if (!currentUser.referralCode) {
            currentUser.referralCode = generateReferralCode(currentUser.username || `USER${userId}`);
            saveUsersToStorage(users);
        }
        
        const referredUsers = users.filter(u => u.referredBy === currentUser.referralCode);
        const activeReferrals = referredUsers.filter(u => u.package && u.package.status === 'نشط');
        const pendingReferrals = referredUsers.filter(u => u.pendingPackage && !u.package);
        const paidReferrals = referredUsers.filter(u => u.referralRewardPaid === true);
        
        let pendingCommission = 0;
        referredUsers.forEach(u => {
            if (u.package && u.package.amount && u.referralRewardPaid !== true) {
                pendingCommission += REFERRAL_SETTINGS.referrerReward;
            }
        });
        
        return {
            referralCode: currentUser.referralCode || '',
            referredCount: referredUsers.length,
            activeReferrals: activeReferrals.length,
            pendingReferrals: pendingReferrals.length,
            paidReferrals: paidReferrals.length,
            totalEarned: currentUser.referralEarnings || 0,
            pendingCommission: pendingCommission,
            conversionRate: referredUsers.length > 0 ? ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) : 0,
            referredUsers: referredUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                username: u.username,
                joinedDate: u.joinedDate,
                hasPackage: !!u.package,
                packageName: u.package ? u.package.name : 'لا يوجد',
                packageAmount: u.package ? u.package.amount : 0,
                rewardPaid: u.referralRewardPaid || false
            }))
        };
    } catch (error) {
        console.error('Error getting referral stats from localStorage:', error);
        return null;
    }
}

// معالجة مكافآت الإحالة عند الموافقة
async function processReferralRewardsOnApproval(userId, packageAmount) {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.referrals) {
        try {
            const result = await window.SupabaseClient.referrals.processReward(userId, packageAmount);
            if (result.success) return result;
        } catch (error) {
            console.warn('Supabase referral processing failed, using localStorage:', error);
        }
    }
    
    // الرجوع إلى localStorage
    return processReferralRewardsFromLocal(userId, packageAmount);
}

function processReferralRewardsFromLocal(userId, packageAmount) {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const newUser = users.find(u => u.id === userId);
        
        if (!newUser || !newUser.referredBy) {
            console.log('⚠️ لا يوجد كود إحالة');
            return false;
        }
        
        const referrer = users.find(u => u.referralCode === newUser.referredBy);
        if (!referrer) {
            console.log('⚠️ لم يتم العثور على صاحب الكود');
            return false;
        }
        
        if (newUser.referralRewardPaid === true) {
            console.log('⚠️ تم صرف المكافأة مسبقاً');
            return false;
        }
        
        // تحديث إحصائيات صاحب الكود
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        
        // إضافة مكافأة للمشترك الجديد (20$)
        newUser.balance = (newUser.balance || 0) + REFERRAL_SETTINGS.refereeReward;
        newUser.referralRewardPaid = true;
        newUser.referralRewardAmount = REFERRAL_SETTINGS.refereeReward;
        newUser.referralRewardDate = new Date().toISOString();
        
        // إضافة مكافأة لصاحب الكود (50$)
        referrer.balance = (referrer.balance || 0) + REFERRAL_SETTINGS.referrerReward;
        referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_SETTINGS.referrerReward;
        
        // تسجيل المعاملات
        addUserTransaction(newUser.id, {
            id: Date.now(),
            type: 'مكافأة إحالة',
            amount: REFERRAL_SETTINGS.refereeReward,
            description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
            date: new Date().toLocaleString('ar-SA'),
            status: 'مكتمل',
            referralCode: newUser.referredBy,
            referrerName: referrer.name
        });
        
        addUserTransaction(referrer.id, {
            id: Date.now() + 1,
            type: 'مكافأة إحالة',
            amount: REFERRAL_SETTINGS.referrerReward,
            description: `💰 مكافأة إحالة: ${newUser.name}`,
            date: new Date().toLocaleString('ar-SA'),
            status: 'مكتمل',
            referredUserId: newUser.id,
            referredUserName: newUser.name
        });
        
        // حفظ التغييرات
        localStorage.setItem('elite_users', JSON.stringify(users));
        
        // تحديث المستخدم الحالي
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (currentUser) {
            if (currentUser.id === newUser.id) {
                currentUser.balance = newUser.balance;
                currentUser.referralRewardPaid = true;
                localStorage.setItem('current_user', JSON.stringify(currentUser));
            }
            if (currentUser.id === referrer.id) {
                currentUser.balance = referrer.balance;
                currentUser.referralEarnings = referrer.referralEarnings;
                localStorage.setItem('current_user', JSON.stringify(currentUser));
            }
        }
        
        console.log(`✅ تم صرف المكافآت: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
        
        broadcastUpdate('referrals');
        broadcastUpdate('users');
        
        return {
            referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward },
            referee: { id: newUser.id, name: newUser.name, reward: REFERRAL_SETTINGS.refereeReward }
        };
    } catch (error) {
        console.error('Error processing referral rewards from localStorage:', error);
        return false;
    }
}

// ========== دوال الباقات ==========
function loadPackagesFromStorage() {
    try {
        const saved = localStorage.getItem('website_packages');
        if (saved) {
            SHARED_PACKAGES = JSON.parse(saved);
        }
    } catch (e) {
        console.error('خطأ في تحميل الباقات:', e);
    }
    return SHARED_PACKAGES;
}

function savePackagesToStorage() {
    try {
        localStorage.setItem('website_packages', JSON.stringify(SHARED_PACKAGES));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ الباقات:', e);
        return false;
    }
}

async function getAllPackages() {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.packages) {
        try {
            const result = await window.SupabaseClient.packages.getAll();
            if (result.success && result.data) {
                SHARED_PACKAGES = result.data;
                localStorage.setItem('website_packages', JSON.stringify(SHARED_PACKAGES));
                return SHARED_PACKAGES;
            }
        } catch (error) {
            console.warn('Supabase packages failed, using localStorage:', error);
        }
    }
    // الرجوع إلى localStorage
    return SHARED_PACKAGES.filter(pkg => pkg.status === "active");
}

function getPackageById(id) {
    return SHARED_PACKAGES.find(pkg => pkg.id === id);
}

async function addNewPackage(packageData) {
    const newPackage = {
        id: Date.now(),
        name: packageData.name,
        price: parseFloat(packageData.price),
        profit: parseFloat(packageData.profit || 2.5),
        dailyProfit: parseFloat((packageData.price * (packageData.profit || 2.5) / 100).toFixed(2)),
        tasks: parseInt(packageData.tasks || 5),
        duration: parseInt(packageData.duration || 30),
        status: "active",
        category: packageData.category || "standard",
        description: packageData.description || "",
        users: 0,
        createdAt: new Date().toISOString()
    };
    
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.packages) {
        try {
            await window.SupabaseClient.packages.create(newPackage);
        } catch (error) {
            console.warn('Supabase package creation failed, saving to localStorage:', error);
        }
    }
    
    SHARED_PACKAGES.push(newPackage);
    savePackagesToStorage();
    broadcastUpdate('packages');
    return newPackage;
}

async function deletePackage(packageId) {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.packages) {
        try {
            await window.SupabaseClient.packages.delete(packageId);
        } catch (error) {
            console.warn('Supabase package deletion failed, removing from localStorage:', error);
        }
    }
    
    const initialLength = SHARED_PACKAGES.length;
    SHARED_PACKAGES = SHARED_PACKAGES.filter(pkg => pkg.id !== packageId);
    if (SHARED_PACKAGES.length < initialLength) {
        savePackagesToStorage();
        broadcastUpdate('packages');
        return true;
    }
    return false;
}

// ========== دوال المهام ==========
function loadTasksFromStorage() {
    try {
        const saved = localStorage.getItem('website_tasks');
        if (saved) {
            SHARED_TASKS = JSON.parse(saved);
        }
    } catch (e) {
        console.error('خطأ في تحميل المهام:', e);
    }
    return SHARED_TASKS;
}

function saveTasksToStorage() {
    try {
        localStorage.setItem('website_tasks', JSON.stringify(SHARED_TASKS));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ المهام:', e);
        return false;
    }
}

async function getAllTasks() {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.tasks) {
        try {
            const result = await window.SupabaseClient.tasks.getAll();
            if (result.success && result.data) {
                SHARED_TASKS = result.data;
                localStorage.setItem('website_tasks', JSON.stringify(SHARED_TASKS));
                return SHARED_TASKS;
            }
        } catch (error) {
            console.warn('Supabase tasks failed, using localStorage:', error);
        }
    }
    // الرجوع إلى localStorage
    return SHARED_TASKS.filter(task => task.status === "active");
}

function getUserTasks(userPackage) {
    const allTasks = SHARED_TASKS.filter(task => task.status === "active");
    
    if (!userPackage) {
        return [];
    }
    
    const userCategory = userPackage.category;
    
    return allTasks.filter(task => {
        if (task.status !== 'active') return false;
        if (!task.packageCategories) return false;
        return task.packageCategories.includes(userCategory);
    });
}

function getTaskById(id) {
    return SHARED_TASKS.find(task => task.id === id);
}

function canUserCompleteTask(taskId, userPackage) {
    if (!userPackage) return false;
    const task = getTaskById(taskId);
    if (!task) return false;
    return task.packageCategories && task.packageCategories.includes(userPackage.category);
}

function incrementTaskCompletion(taskId) {
    const task = SHARED_TASKS.find(t => t.id === taskId);
    if (task) {
        task.completions = (task.completions || 0) + 1;
        saveTasksToStorage();
        
        // محاولة تحديث Supabase
        if (window.SupabaseClient && window.SupabaseClient.tasks) {
            window.SupabaseClient.tasks.incrementCompletion(taskId).catch(error => {
                console.warn('Supabase task increment failed:', error);
            });
        }
        
        return task.completions;
    }
    return 0;
}

async function addNewTask(taskData) {
    if (!taskData.packageCategories || taskData.packageCategories.length === 0) {
        throw new Error('يجب اختيار فئة واحدة على الأقل');
    }
    
    const newTask = {
        id: Date.now(),
        title: taskData.title,
        description: taskData.description,
        reward: parseFloat(taskData.reward),
        type: taskData.type || "daily",
        status: "active",
        completions: 0,
        availableFor: taskData.availableFor || "all",
        packageCategories: taskData.packageCategories,
        difficulty: taskData.difficulty || "easy",
        timeRequired: parseInt(taskData.timeRequired || 2),
        createdAt: new Date().toISOString()
    };
    
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.tasks) {
        try {
            await window.SupabaseClient.tasks.create(newTask);
        } catch (error) {
            console.warn('Supabase task creation failed, saving to localStorage:', error);
        }
    }
    
    SHARED_TASKS.push(newTask);
    saveTasksToStorage();
    broadcastUpdate('tasks');
    return newTask;
}

async function deleteTask(taskId) {
    // محاولة استخدام Supabase أولاً
    if (window.SupabaseClient && window.SupabaseClient.tasks) {
        try {
            await window.SupabaseClient.tasks.delete(taskId);
        } catch (error) {
            console.warn('Supabase task deletion failed, removing from localStorage:', error);
        }
    }
    
    const initialLength = SHARED_TASKS.length;
    SHARED_TASKS = SHARED_TASKS.filter(task => task.id !== taskId);
    if (SHARED_TASKS.length < initialLength) {
        saveTasksToStorage();
        broadcastUpdate('tasks');
        return true;
    }
    return false;
}

function getTasksStats() {
    const allTasks = SHARED_TASKS.filter(task => task.status === "active");
    return {
        total: allTasks.length,
        daily: allTasks.filter(t => t.type === "daily").length,
        weekly: allTasks.filter(t => t.type === "weekly").length,
        totalCompletions: allTasks.reduce((sum, task) => sum + (task.completions || 0), 0),
        totalReward: allTasks.reduce((sum, task) => sum + task.reward, 0),
        averageReward: allTasks.length > 0 ? (allTasks.reduce((sum, task) => sum + task.reward, 0) / allTasks.length).toFixed(2) : 0,
        byCategory: {
            standard: allTasks.filter(t => t.packageCategories?.includes("standard")).length,
            premium: allTasks.filter(t => t.packageCategories?.includes("premium")).length,
            vip: allTasks.filter(t => t.packageCategories?.includes("vip")).length
        },
        byDifficulty: {
            easy: allTasks.filter(t => t.difficulty === "easy").length,
            medium: allTasks.filter(t => t.difficulty === "medium").length,
            hard: allTasks.filter(t => t.difficulty === "hard").length
        }
    };
}

// ========== دوال المستخدمين ==========
function saveUsersToStorage(users) {
    try {
        localStorage.setItem('elite_users', JSON.stringify(users));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ المستخدمين:', e);
        return false;
    }
}

function addUserTransaction(userId, transaction) {
    try {
        const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
        transactions.unshift({
            ...transaction,
            id: transaction.id || Date.now() + Math.random()
        });
        localStorage.setItem(`user_transactions_${userId}`, JSON.stringify(transactions.slice(0, 200)));
        return true;
    } catch (e) {
        console.error('خطأ في إضافة معاملة:', e);
        return false;
    }
}

function getUserTransactions(userId, limit = 50) {
    try {
        const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
        return transactions.slice(0, limit);
    } catch (e) {
        console.error('خطأ في جلب المعاملات:', e);
        return [];
    }
}

function getUserManagementStats() {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
        
        let totalBalance = 0;
        let totalEarned = 0;
        let activeWithPackage = 0;
        
        users.forEach(user => {
            totalBalance += user.balance || 0;
            totalEarned += user.totalEarned || 0;
            if (user.package && user.package.status === 'نشط') activeWithPackage++;
        });
        
        return {
            total: users.length,
            active: users.filter(u => u.status === 'active' || !u.status).length,
            suspended: users.filter(u => u.status === 'suspended').length,
            banned: users.filter(u => u.status === 'banned').length,
            withPackage: activeWithPackage,
            pendingPackages: pendingPackages.length,
            totalBalance: totalBalance,
            totalEarned: totalEarned
        };
    } catch (e) {
        console.error('خطأ في جلب إحصائيات المستخدمين:', e);
        return {
            total: 0, active: 0, suspended: 0, banned: 0,
            withPackage: 0, pendingPackages: 0, totalBalance: 0, totalEarned: 0
        };
    }
}

function getUserDetails(userId) {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const user = users.find(u => u.id === userId);
        if (!user) return null;
        
        const withdrawals = JSON.parse(localStorage.getItem(`user_withdrawals_${userId}`)) || [];
        const totalWithdrawn = withdrawals
            .filter(w => w.status === 'مكتمل')
            .reduce((sum, w) => sum + w.amount, 0);
        const pendingWithdrawals = withdrawals.filter(w => w.status === 'معلق').length;
        
        const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
        const totalDeposits = transactions
            .filter(t => t.type === 'اشتراك' && t.status === 'مكتمل')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalTaskEarnings = transactions
            .filter(t => t.type === 'ربح' || t.type === 'مكافأة' || t.type === 'مكافأة إحالة')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const today = new Date().toDateString();
        const todayEarnings = transactions
            .filter(t => {
                const tDate = new Date(t.date).toDateString();
                return tDate === today && (t.type === 'ربح' || t.type === 'مكافأة' || t.type === 'مكافأة إحالة');
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            ...user,
            totalWithdrawn,
            pendingWithdrawals,
            totalDeposits,
            totalTaskEarnings,
            todayEarnings,
            withdrawalsCount: withdrawals.length,
            transactionsCount: transactions.length
        };
    } catch (e) {
        console.error('خطأ في جلب تفاصيل المستخدم:', e);
        return null;
    }
}

function updateUserStatus(userId, status, reason = '') {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;
        
        users[userIndex].status = status;
        users[userIndex].statusReason = reason;
        users[userIndex].statusUpdatedAt = new Date().toISOString();
        
        localStorage.setItem('elite_users', JSON.stringify(users));
        
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (currentUser && currentUser.id === userId) {
            currentUser.status = status;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
        }
        
        broadcastUpdate('users');
        return true;
    } catch (e) {
        console.error('خطأ في تحديث حالة المستخدم:', e);
        return false;
    }
}

function addUserBalance(userId, amount, reason = 'إضافة رصيد') {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1 || amount <= 0) return false;
        
        users[userIndex].balance = (users[userIndex].balance || 0) + amount;
        localStorage.setItem('elite_users', JSON.stringify(users));
        
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (currentUser && currentUser.id === userId) {
            currentUser.balance = users[userIndex].balance;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
        }
        
        addUserTransaction(userId, {
            type: 'إضافة رصيد',
            amount: amount,
            description: reason,
            date: new Date().toLocaleString('ar-SA'),
            admin: true
        });
        
        broadcastUpdate('users');
        return true;
    } catch (e) {
        console.error('خطأ في إضافة رصيد:', e);
        return false;
    }
}

// ========== دوال السحب ==========
function getAllWithdrawals() {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        let allWithdrawals = [];
        
        users.forEach(user => {
            const userWithdrawals = JSON.parse(localStorage.getItem(`user_withdrawals_${user.id}`)) || [];
            userWithdrawals.forEach(w => {
                allWithdrawals.push({
                    ...w,
                    userName: user.name,
                    userEmail: user.email,
                    userId: user.id
                });
            });
        });
        
        return allWithdrawals.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('خطأ في جلب طلبات السحب:', e);
        return [];
    }
}

// ========== دوال الإحصائيات ==========
function getDashboardStats() {
    try {
        const users = JSON.parse(localStorage.getItem('elite_users')) || [];
        const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
        const tasks = SHARED_TASKS.filter(t => t.status === "active");
        const withdrawals = getAllWithdrawals();
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalProfits = 0;
        let activeSubscriptions = 0;
        let pendingWithdrawals = 0;
        let totalReferralEarnings = 0;
        let totalReferrals = 0;
        let suspendedUsers = 0;
        let bannedUsers = 0;
        let activeUsers = 0;
        
        users.forEach(user => {
            if (user.package && user.package.status === 'نشط') {
                totalDeposits += user.package.amount || 0;
                activeSubscriptions++;
            }
            totalProfits += user.totalEarned || 0;
            totalReferralEarnings += user.referralEarnings || 0;
            totalReferrals += user.referralCount || 0;
            
            if (user.status === 'active' || !user.status) activeUsers++;
            if (user.status === 'suspended') suspendedUsers++;
            if (user.status === 'banned') bannedUsers++;
        });
        
        withdrawals.forEach(w => {
            if (w.status === 'مكتمل') {
                totalWithdrawals += w.amount;
            }
            if (w.status === 'معلق') {
                pendingWithdrawals++;
            }
        });
        
        const totalCompletions = tasks.reduce((sum, task) => sum + (task.completions || 0), 0);
        const totalTasksReward = tasks.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);
        
        return {
            totalUsers: users.length,
            activeUsers: activeUsers,
            suspendedUsers: suspendedUsers,
            bannedUsers: bannedUsers,
            totalDeposits: totalDeposits,
            totalWithdrawals: totalWithdrawals,
            totalProfits: totalProfits,
            activeSubscriptions: activeSubscriptions,
            pendingPackages: pendingPackages.length,
            pendingWithdrawals: pendingWithdrawals,
            totalTasks: tasks.length,
            totalCompletions: totalCompletions,
            totalTasksReward: totalTasksReward,
            totalReferralEarnings: totalReferralEarnings,
            totalReferrals: totalReferrals,
            packagesCount: SHARED_PACKAGES.length
        };
    } catch (e) {
        console.error('خطأ في جلب إحصائيات الداشبورد:', e);
        return {
            totalUsers: 0, activeUsers: 0, suspendedUsers: 0, bannedUsers: 0,
            totalDeposits: 0, totalWithdrawals: 0, totalProfits: 0,
            activeSubscriptions: 0, pendingPackages: 0, pendingWithdrawals: 0,
            totalTasks: 0, totalCompletions: 0, totalTasksReward: 0,
            totalReferralEarnings: 0, totalReferrals: 0, packagesCount: SHARED_PACKAGES.length
        };
    }
}

// ========== دوال مساعدة ==========
function calculateDaysLeft(purchaseDate, duration = 30) {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const endDate = new Date(purchase);
    endDate.setDate(endDate.getDate() + duration);
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
}

function calculateTotalProfit(pkg) {
    if (!pkg || !pkg.purchaseDate) return 0;
    const daysPassed = Math.ceil((new Date() - new Date(pkg.purchaseDate)) / (1000 * 60 * 60 * 24));
    const dailyProfit = pkg.dailyProfit || (pkg.amount * (pkg.profit || 2.5) / 100);
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

// ========== مزامنة مع Supabase ==========
async function syncWithSupabase() {
    if (!window.SupabaseClient) return;
    
    try {
        // مزامنة الباقات
        const packagesResult = await window.SupabaseClient.packages.getAll();
        if (packagesResult.success && packagesResult.data) {
            SHARED_PACKAGES = packagesResult.data;
            localStorage.setItem('website_packages', JSON.stringify(SHARED_PACKAGES));
            console.log('✅ تمت مزامنة الباقات مع Supabase');
        }
        
        // مزامنة المهام
        const tasksResult = await window.SupabaseClient.tasks.getAll();
        if (tasksResult.success && tasksResult.data) {
            SHARED_TASKS = tasksResult.data;
            localStorage.setItem('website_tasks', JSON.stringify(SHARED_TASKS));
            console.log('✅ تمت مزامنة المهام مع Supabase');
        }
        
        broadcastUpdate('packages');
        broadcastUpdate('tasks');
        
    } catch (error) {
        console.error('❌ فشل المزامنة مع Supabase:', error);
    }
}

// ========== التهيئة ==========
async function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة...');
    
    // تحميل البيانات من localStorage
    loadPackagesFromStorage();
    loadTasksFromStorage();
    
    // محاولة المزامنة مع Supabase
    window.waitForSupabase(async () => {
        console.log('✅ SupabaseClient جاهز، بدء المزامنة...');
        await syncWithSupabase();
    });
    
    console.log(`✅ تم تحميل ${SHARED_PACKAGES.length} باقة و ${SHARED_TASKS.length} مهمة`);
    console.log(`💰 نظام الإحالة: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
}

// ========== التصدير ==========
const SharedData = {
    // الباقات
    packages: SHARED_PACKAGES,
    savePackages: savePackagesToStorage,
    loadPackages: loadPackagesFromStorage,
    getAllPackages: getAllPackages,
    getPackageById: getPackageById,
    addPackage: addNewPackage,
    deletePackage: deletePackage,
    
    // المهام
    tasks: SHARED_TASKS,
    saveTasks: saveTasksToStorage,
    loadTasks: loadTasksFromStorage,
    getAllTasks: getAllTasks,
    getUserTasks: getUserTasks,
    getTaskById: getTaskById,
    incrementTaskCompletion: incrementTaskCompletion,
    canUserCompleteTask: canUserCompleteTask,
    getTasksStats: getTasksStats,
    addTask: addNewTask,
    deleteTask: deleteTask,
    
    // نظام الإحالة
    REFERRAL_SETTINGS: REFERRAL_SETTINGS,
    generateReferralCode: generateReferralCode,
    getReferralStats: getReferralStats,
    processReferralRewardsOnApproval: processReferralRewardsOnApproval,
    
    // إدارة المستخدمين
    getUserManagementStats: getUserManagementStats,
    getUserDetails: getUserDetails,
    updateUserStatus: updateUserStatus,
    addUserBalance: addUserBalance,
    
    // المعاملات
    addUserTransaction: addUserTransaction,
    getUserTransactions: getUserTransactions,
    
    // الإحصائيات
    getDashboardStats: getDashboardStats,
    getAllWithdrawals: getAllWithdrawals,
    
    // دوال مساعدة
    calculateDaysLeft: calculateDaysLeft,
    calculateTotalProfit: calculateTotalProfit,
    
    // البث
    broadcastUpdate: broadcastUpdate,
    
    // مزامنة
    syncWithSupabase: syncWithSupabase,
    
    // تهيئة
    init: initializeSharedData
};

// ========== تهيئة فورية ==========
window.sharedData = SharedData;

// تنفيذ التهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SharedData.init());
    } else {
        SharedData.init();
    }
}

console.log('📦 SharedData loaded and ready');