// ===================================
// نظام البيانات المشتركة بين الصفحات - متوافق مع Supabase وجاهز لـ GitHub Pages
// ===================================

// ========== نظام الباقات - تخزين محلي احتياطي ==========
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

// ========== نظام المهام - مرتبط بالباقات ==========
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

// ========== التحقق من توفر Supabase ==========
function isSupabaseAvailable() {
    return typeof window !== 'undefined' && 
           window.supabaseClient && 
           window.supabaseHelpers;
}

// ========== دوال كود الإحالة ==========
function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

function getReferralStats(userId) {
    // محاولة استخدام Supabase أولاً
    if (isSupabaseAvailable()) {
        // سيتم تنفيذها بشكل غير متزامن - هذه دالة متزامنة للتوافق
        console.log('استخدام التخزين المحلي للإحصائيات');
    }
    
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
}

async function processReferralRewardsOnApproval(userId, packageAmount) {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.processReferralRewards(userId);
            if (result.success) {
                console.log('✅ تم صرف المكافآت عبر Supabase');
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل Supabase، استخدام التخزين المحلي:', error);
        }
    }
    
    // التخزين المحلي كاحتياطي
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
    
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    
    newUser.balance = (newUser.balance || 0) + REFERRAL_SETTINGS.refereeReward;
    newUser.referralRewardPaid = true;
    newUser.referralRewardAmount = REFERRAL_SETTINGS.refereeReward;
    newUser.referralRewardDate = new Date().toISOString();
    
    referrer.balance = (referrer.balance || 0) + REFERRAL_SETTINGS.referrerReward;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_SETTINGS.referrerReward;
    
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
    
    localStorage.setItem('elite_users', JSON.stringify(users));
    
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
    
    console.log(`✅ تم صرف المكافآت محلياً: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
    
    broadcastUpdate('referrals');
    broadcastUpdate('users');
    
    return {
        referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward },
        referee: { id: newUser.id, name: newUser.name, reward: REFERRAL_SETTINGS.refereeReward }
    };
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
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.getAllTasks();
            if (result.success && result.data && result.data.length > 0) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل جلب المهام من Supabase، استخدام المحلي');
        }
    }
    
    return SHARED_TASKS.filter(task => task.status === "active");
}

async function getUserTasks(userPackage) {
    const allTasks = await getAllTasks();
    
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

function incrementTaskCompletion(taskId) {
    const task = SHARED_TASKS.find(t => t.id === taskId);
    if (task) {
        task.completions = (task.completions || 0) + 1;
        saveTasksToStorage();
        return task.completions;
    }
    return 0;
}

function canUserCompleteTask(taskId, userPackage) {
    if (!userPackage) return false;
    const task = getTaskById(taskId);
    if (!task) return false;
    return task.packageCategories && task.packageCategories.includes(userPackage.category);
}

function addNewTask(taskData) {
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
    
    SHARED_TASKS.push(newTask);
    saveTasksToStorage();
    broadcastUpdate('tasks');
    return newTask;
}

function deleteTask(taskId) {
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
    const allTasks = SHARED_TASKS.filter(t => t.status === "active");
    return {
        total: allTasks.length,
        daily: allTasks.filter(t => t.type === "daily").length,
        weekly: allTasks.filter(t => t.type === "weekly").length,
        totalCompletions: allTasks.reduce((sum, task) => sum + (task.completions || 0), 0),
        totalReward: allTasks.reduce((sum, task) => sum + task.reward, 0),
        byCategory: {
            standard: allTasks.filter(t => t.packageCategories?.includes("standard")).length,
            premium: allTasks.filter(t => t.packageCategories?.includes("premium")).length,
            vip: allTasks.filter(t => t.packageCategories?.includes("vip")).length
        }
    };
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
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.getAllPackages();
            if (result.success && result.data && result.data.length > 0) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل جلب الباقات من Supabase، استخدام المحلي');
        }
    }
    
    return SHARED_PACKAGES.filter(pkg => pkg.status === "active");
}

async function getPackageById(id) {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.getPackageById(id);
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل جلب الباقة من Supabase');
        }
    }
    
    return SHARED_PACKAGES.find(pkg => pkg.id === id);
}

function addNewPackage(packageData) {
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
    
    SHARED_PACKAGES.push(newPackage);
    savePackagesToStorage();
    broadcastUpdate('packages');
    return newPackage;
}

function deletePackage(packageId) {
    const initialLength = SHARED_PACKAGES.length;
    SHARED_PACKAGES = SHARED_PACKAGES.filter(pkg => pkg.id !== packageId);
    if (SHARED_PACKAGES.length < initialLength) {
        savePackagesToStorage();
        broadcastUpdate('packages');
        return true;
    }
    return false;
}

// ========== دوال المستخدمين ==========
function saveUsersToStorage(users) {
    localStorage.setItem('elite_users', JSON.stringify(users));
}

function addUserTransaction(userId, transaction) {
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    transactions.unshift({
        ...transaction,
        id: transaction.id || Date.now() + Math.random()
    });
    localStorage.setItem(`user_transactions_${userId}`, JSON.stringify(transactions.slice(0, 200)));
}

function getUserTransactions(userId, limit = 50) {
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    return transactions.slice(0, limit);
}

function getUserManagementStats() {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
    const withdrawals = getAllWithdrawals();
    
    let totalBalance = 0;
    let totalEarned = 0;
    let totalWithdrawn = 0;
    let activeWithPackage = 0;
    
    users.forEach(user => {
        totalBalance += user.balance || 0;
        totalEarned += user.totalEarned || 0;
        if (user.package && user.package.status === 'نشط') {
            activeWithPackage++;
        }
    });
    
    withdrawals.forEach(w => {
        if (w.status === 'مكتمل') {
            totalWithdrawn += w.amount;
        }
    });
    
    return {
        total: users.length,
        active: users.filter(u => u.status === 'active' || !u.status).length,
        suspended: users.filter(u => u.status === 'suspended').length,
        banned: users.filter(u => u.status === 'banned').length,
        withPackage: activeWithPackage,
        pendingPackages: pendingPackages.length,
        totalBalance: totalBalance,
        totalEarned: totalEarned,
        totalWithdrawn: totalWithdrawn
    };
}

function getUserDetails(userId) {
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
    
    const todayTasks = Object.keys(localStorage)
        .filter(key => key.startsWith('task_') && key.includes(today) && localStorage.getItem(key) === 'completed')
        .length;
    
    return {
        ...user,
        totalWithdrawn,
        pendingWithdrawals,
        totalDeposits,
        totalTaskEarnings,
        todayEarnings,
        todayTasks,
        withdrawalsCount: withdrawals.length,
        transactionsCount: transactions.length,
        referralStats: getReferralStats(userId)
    };
}

function updateUserStatus(userId, status, reason = '') {
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
    
    addSystemLog({
        action: 'تغيير حالة المستخدم',
        userId: userId,
        userName: users[userIndex].name,
        oldStatus: users[userIndex].status,
        newStatus: status,
        reason: reason,
        date: new Date().toISOString()
    });
    
    broadcastUpdate('users');
    return true;
}

function addUserBalance(userId, amount, reason = 'إضافة رصيد') {
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
}

function addSystemLog(log) {
    const logs = JSON.parse(localStorage.getItem('system_logs')) || [];
    logs.unshift({
        id: Date.now(),
        ...log
    });
    localStorage.setItem('system_logs', JSON.stringify(logs.slice(0, 500)));
}

// ========== دوال السحب ==========
function getAllWithdrawals() {
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
}

// ========== دوال الإحصائيات المتقدمة ==========
async function getDashboardStats() {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.getDashboardStats();
            if (result.success && result.data) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل جلب الإحصائيات من Supabase، استخدام المحلي');
        }
    }
    
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
    
    const today = new Date().toDateString();
    const todayDeposits = users
        .filter(u => u.package && new Date(u.package.purchaseDate).toDateString() === today)
        .reduce((sum, u) => sum + (u.package.amount || 0), 0);
    
    const todayWithdrawals = withdrawals
        .filter(w => w.status === 'مكتمل' && new Date(w.date).toDateString() === today)
        .reduce((sum, w) => sum + w.amount, 0);
    
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
        todayDeposits: todayDeposits,
        todayWithdrawals: todayWithdrawals,
        netRevenue: totalDeposits - totalWithdrawals,
        packagesCount: SHARED_PACKAGES.length
    };
}

// ========== دوال الطلبات المعلقة ==========
async function addPendingPackage(pendingData) {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.createPendingPackage(pendingData);
            if (result.success) {
                console.log('✅ تم حفظ الطلب في Supabase');
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل حفظ الطلب في Supabase، استخدام المحلي');
        }
    }
    
    // تخزين محلي احتياطي
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
    const newPending = {
        id: Date.now(),
        ...pendingData,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    pendingPackages.push(newPending);
    localStorage.setItem('pending_packages', JSON.stringify(pendingPackages));
    
    // تحديث المستخدم
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const userIndex = users.findIndex(u => u.id === pendingData.userId);
    if (userIndex !== -1) {
        users[userIndex].pendingPackage = {
            id: newPending.id,
            name: pendingData.packageName,
            amount: pendingData.amount,
            requestedDate: newPending.created_at,
            estimatedActivation: pendingData.estimatedActivation
        };
        localStorage.setItem('elite_users', JSON.stringify(users));
        
        const currentUser = JSON.parse(localStorage.getItem('current_user'));
        if (currentUser && currentUser.id === pendingData.userId) {
            currentUser.pendingPackage = users[userIndex].pendingPackage;
            localStorage.setItem('current_user', JSON.stringify(currentUser));
        }
    }
    
    broadcastUpdate('pending');
    return newPending;
}

// ========== دوال تسجيل الدخول والتسجيل ==========
async function loginUser(username, password) {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.loginUser(username, password);
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل تسجيل الدخول عبر Supabase، استخدام المحلي');
        }
    }
    
    // تخزين محلي احتياطي
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
    if (!user) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    
    if (user.status === 'banned') {
        throw new Error('حسابك محظور');
    }
    
    return user;
}

async function registerUser(userData) {
    // محاولة استخدام Supabase
    if (isSupabaseAvailable()) {
        try {
            const result = await window.supabaseHelpers.registerUser(userData);
            if (result.success) {
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ فشل التسجيل عبر Supabase، استخدام المحلي');
        }
    }
    
    // تخزين محلي احتياطي
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    
    if (users.some(u => u.username === userData.username)) {
        throw new Error('اسم المستخدم موجود مسبقاً');
    }
    
    if (users.some(u => u.email === userData.email)) {
        throw new Error('البريد الإلكتروني موجود مسبقاً');
    }
    
    if (userData.username.includes(' ')) {
        throw new Error('اسم المستخدم يجب ألا يحتوي على مسافات');
    }
    
    if (userData.password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    
    if (userData.password !== userData.confirmPassword) {
        throw new Error('كلمتا المرور غير متطابقتين');
    }
    
    // التحقق من صحة كود الإحالة
    let referredBy = null;
    if (userData.referralCode) {
        const referrer = users.find(u => u.referralCode === userData.referralCode);
        if (referrer) {
            referredBy = userData.referralCode;
        }
    }
    
    const newUser = {
        id: Date.now(),
        name: userData.name,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        referredBy: referredBy,
        referralCode: generateReferralCode(userData.username),
        balance: 0,
        package: null,
        pendingPackage: null,
        walletAddress: '',
        walletNetwork: 'TRC20',
        tasksCompleted: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        referralCount: 0,
        referralEarnings: 0,
        referralRewardPaid: false,
        joinedDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: false,
        status: 'active'
    };
    
    users.push(newUser);
    localStorage.setItem('elite_users', JSON.stringify(users));
    
    return newUser;
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

// ========== التهيئة ==========
function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة...');
    loadPackagesFromStorage();
    loadTasksFromStorage();
    console.log(`✅ تم تحميل ${SHARED_PACKAGES.length} باقة و ${SHARED_TASKS.length} مهمة`);
    console.log(`💰 نظام الإحالة: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
    
    // التحقق من Supabase
    if (isSupabaseAvailable()) {
        console.log('✅ Supabase متصل وجاهز للاستخدام');
    } else {
        console.log('⚠️ Supabase غير متصل - استخدام التخزين المحلي فقط');
    }
}

// ========== التصدير ==========
const SharedData = {
    // الباقات
    packages: SHARED_PACKAGES,
    savePackages: savePackagesToStorage,
    loadPackages: loadPackagesFromStorage,
    addPackage: addNewPackage,
    deletePackage: deletePackage,
    getAllPackages: getAllPackages,
    getPackageById: getPackageById,
    
    // المهام
    tasks: SHARED_TASKS,
    saveTasks: saveTasksToStorage,
    loadTasks: loadTasksFromStorage,
    addTask: addNewTask,
    deleteTask: deleteTask,
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
    
    // إدارة المستخدمين
    getUserManagementStats: getUserManagementStats,
    getUserDetails: getUserDetails,
    updateUserStatus: updateUserStatus,
    addUserBalance: addUserBalance,
    addSystemLog: addSystemLog,
    
    // المعاملات
    addUserTransaction: addUserTransaction,
    getUserTransactions: getUserTransactions,
    
    // الإحصائيات
    getDashboardStats: getDashboardStats,
    getAllWithdrawals: getAllWithdrawals,
    
    // الطلبات المعلقة
    addPendingPackage: addPendingPackage,
    
    // المصادقة
    loginUser: loginUser,
    registerUser: registerUser,
    
    // دوال مساعدة
    calculateDaysLeft: calculateDaysLeft,
    calculateTotalProfit: calculateTotalProfit,
    
    // البث
    broadcastUpdate: broadcastUpdate,
    
    // التهيئة
    init: initializeSharedData
};

window.sharedData = SharedData;

if (typeof window !== 'undefined') {
    SharedData.init();
}