// ===================================
// نظام البيانات المشتركة بين الصفحات - النسخة النهائية مع Supabase
// ===================================

// ========== نظام الباقات ==========
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

// ========== نظام المهام ==========
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

// ========== متغيرات التخزين المؤقت ==========
let CACHED_PACKAGES = null;
let CACHED_TASKS = null;
let LAST_SYNC_TIME = 0;
const SYNC_INTERVAL = 60000; // 60 ثانية

// ========== التحقق من الاتصال بـ Supabase ==========
function isSupabaseAvailable() {
    return typeof window.supabaseDb !== 'undefined' && window.supabaseDb !== null;
}

// ========== دوال الباقات ==========

// تحميل الباقات من Supabase
async function loadPackagesFromStorage() {
    try {
        if (isSupabaseAvailable()) {
            const packages = await window.supabaseDb.getPackages();
            if (packages && packages.length > 0) {
                SHARED_PACKAGES = packages;
                CACHED_PACKAGES = packages;
                return packages;
            }
        }
    } catch (e) {
        console.error('خطأ في تحميل الباقات من Supabase:', e);
    }
    
    try {
        const saved = localStorage.getItem('website_packages');
        if (saved) {
            SHARED_PACKAGES = JSON.parse(saved);
        }
    } catch (e) {
        console.error('خطأ في تحميل الباقات من التخزين المحلي:', e);
    }
    
    return SHARED_PACKAGES;
}

// حفظ الباقات في Supabase
async function savePackagesToStorage() {
    try {
        if (isSupabaseAvailable()) {
            for (const pkg of SHARED_PACKAGES) {
                const existing = await window.supabaseDb.getPackageById(pkg.id);
                if (existing) {
                    await window.supabaseDb.updatePackage(pkg.id, pkg);
                } else {
                    await window.supabaseDb.addPackage(pkg);
                }
            }
        }
    } catch (e) {
        console.error('خطأ في حفظ الباقات إلى Supabase:', e);
    }
    
    try {
        localStorage.setItem('website_packages', JSON.stringify(SHARED_PACKAGES));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ الباقات:', e);
        return false;
    }
}

// الحصول على جميع الباقات
async function getAllPackages() {
    if (CACHED_PACKAGES && Date.now() - LAST_SYNC_TIME < SYNC_INTERVAL) {
        return CACHED_PACKAGES;
    }
    
    await loadPackagesFromStorage();
    CACHED_PACKAGES = SHARED_PACKAGES;
    LAST_SYNC_TIME = Date.now();
    return SHARED_PACKAGES.filter(pkg => pkg.status === "active");
}

// الحصول على باقة بواسطة ID
async function getPackageById(id) {
    if (isSupabaseAvailable()) {
        try {
            const pkg = await window.supabaseDb.getPackageById(id);
            if (pkg) return pkg;
        } catch (e) {
            console.error('خطأ في جلب الباقة من Supabase:', e);
        }
    }
    
    return SHARED_PACKAGES.find(pkg => pkg.id === id);
}

// إضافة باقة جديدة
async function addNewPackage(packageData) {
    const dailyProfit = parseFloat((packageData.price * (packageData.profit || 2.5) / 100).toFixed(2));
    
    const newPackage = {
        id: Date.now(),
        name: packageData.name,
        price: parseFloat(packageData.price),
        profit: parseFloat(packageData.profit || 2.5),
        dailyProfit: dailyProfit,
        tasks: parseInt(packageData.tasks || 5),
        duration: parseInt(packageData.duration || 30),
        status: "active",
        category: packageData.category || "standard",
        description: packageData.description || "",
        users: 0,
        createdAt: new Date().toISOString()
    };
    
    SHARED_PACKAGES.push(newPackage);
    
    if (isSupabaseAvailable()) {
        try {
            await window.supabaseDb.addPackage(newPackage);
        } catch (e) {
            console.error('خطأ في حفظ الباقة إلى Supabase:', e);
        }
    }
    
    await savePackagesToStorage();
    broadcastUpdate('packages');
    return newPackage;
}

// حذف باقة
async function deletePackage(packageId) {
    const initialLength = SHARED_PACKAGES.length;
    SHARED_PACKAGES = SHARED_PACKAGES.filter(pkg => pkg.id !== packageId);
    
    if (SHARED_PACKAGES.length < initialLength) {
        if (isSupabaseAvailable()) {
            try {
                await window.supabaseDb.deletePackage(packageId);
            } catch (e) {
                console.error('خطأ في حذف الباقة من Supabase:', e);
            }
        }
        
        await savePackagesToStorage();
        broadcastUpdate('packages');
        return true;
    }
    return false;
}

// تحديث باقة
async function updatePackage(packageId, updates) {
    const index = SHARED_PACKAGES.findIndex(pkg => pkg.id === packageId);
    if (index === -1) return null;
    
    SHARED_PACKAGES[index] = { ...SHARED_PACKAGES[index], ...updates };
    
    if (updates.price || updates.profit) {
        const price = updates.price || SHARED_PACKAGES[index].price;
        const profit = updates.profit || SHARED_PACKAGES[index].profit;
        SHARED_PACKAGES[index].dailyProfit = parseFloat((price * profit / 100).toFixed(2));
    }
    
    if (isSupabaseAvailable()) {
        try {
            await window.supabaseDb.updatePackage(packageId, SHARED_PACKAGES[index]);
        } catch (e) {
            console.error('خطأ في تحديث الباقة في Supabase:', e);
        }
    }
    
    await savePackagesToStorage();
    broadcastUpdate('packages');
    return SHARED_PACKAGES[index];
}

// ========== دوال المهام ==========

// تحميل المهام من Supabase
async function loadTasksFromStorage() {
    try {
        if (isSupabaseAvailable()) {
            const tasks = await window.supabaseDb.getTasks();
            if (tasks && tasks.length > 0) {
                SHARED_TASKS = tasks;
                CACHED_TASKS = tasks;
                return tasks;
            }
        }
    } catch (e) {
        console.error('خطأ في تحميل المهام من Supabase:', e);
    }
    
    try {
        const saved = localStorage.getItem('website_tasks');
        if (saved) {
            SHARED_TASKS = JSON.parse(saved);
        }
    } catch (e) {
        console.error('خطأ في تحميل المهام من التخزين المحلي:', e);
    }
    
    return SHARED_TASKS;
}

// حفظ المهام في Supabase
async function saveTasksToStorage() {
    try {
        if (isSupabaseAvailable()) {
            for (const task of SHARED_TASKS) {
                const existing = await window.supabaseDb.getTaskById(task.id);
                if (existing) {
                    await window.supabaseDb.updateTask(task.id, task);
                } else {
                    await window.supabaseDb.addTask(task);
                }
            }
        }
    } catch (e) {
        console.error('خطأ في حفظ المهام إلى Supabase:', e);
    }
    
    try {
        localStorage.setItem('website_tasks', JSON.stringify(SHARED_TASKS));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ المهام:', e);
        return false;
    }
}

// الحصول على جميع المهام
async function getAllTasks() {
    if (CACHED_TASKS && Date.now() - LAST_SYNC_TIME < SYNC_INTERVAL) {
        return CACHED_TASKS.filter(task => task.status === "active");
    }
    
    await loadTasksFromStorage();
    CACHED_TASKS = SHARED_TASKS;
    LAST_SYNC_TIME = Date.now();
    return SHARED_TASKS.filter(task => task.status === "active");
}

// الحصول على مهمة بواسطة ID
async function getTaskById(id) {
    if (isSupabaseAvailable()) {
        try {
            const task = await window.supabaseDb.getTaskById(id);
            if (task) return task;
        } catch (e) {
            console.error('خطأ في جلب المهمة من Supabase:', e);
        }
    }
    
    return SHARED_TASKS.find(task => task.id === id);
}

// الحصول على مهام المستخدم حسب باقته
async function getUserTasks(userPackage) {
    if (!userPackage) return [];
    
    const allTasks = await getAllTasks();
    const userCategory = userPackage.category;
    
    return allTasks.filter(task => {
        if (task.status !== 'active') return false;
        if (!task.packageCategories) return false;
        return task.packageCategories.includes(userCategory);
    });
}

// زيادة عدد مرات إكمال المهمة
async function incrementTaskCompletion(taskId) {
    const task = SHARED_TASKS.find(t => t.id === taskId);
    if (task) {
        task.completions = (task.completions || 0) + 1;
        
        if (isSupabaseAvailable()) {
            try {
                await window.supabaseDb.incrementTaskCompletion(taskId);
            } catch (e) {
                console.error('خطأ في تحديث المهمة في Supabase:', e);
            }
        }
        
        await saveTasksToStorage();
        return task.completions;
    }
    return 0;
}

// التحقق من إمكانية إكمال المهمة
function canUserCompleteTask(taskId, userPackage) {
    if (!userPackage) return false;
    const task = SHARED_TASKS.find(t => t.id === taskId);
    if (!task) return false;
    if (!task.packageCategories) return false;
    return task.packageCategories.includes(userPackage.category);
}

// إضافة مهمة جديدة
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
    
    SHARED_TASKS.push(newTask);
    
    if (isSupabaseAvailable()) {
        try {
            await window.supabaseDb.addTask(newTask);
        } catch (e) {
            console.error('خطأ في حفظ المهمة إلى Supabase:', e);
        }
    }
    
    await saveTasksToStorage();
    broadcastUpdate('tasks');
    return newTask;
}

// حذف مهمة
async function deleteTask(taskId) {
    const initialLength = SHARED_TASKS.length;
    SHARED_TASKS = SHARED_TASKS.filter(task => task.id !== taskId);
    
    if (SHARED_TASKS.length < initialLength) {
        if (isSupabaseAvailable()) {
            try {
                await window.supabaseDb.deleteTask(taskId);
            } catch (e) {
                console.error('خطأ في حذف المهمة من Supabase:', e);
            }
        }
        
        await saveTasksToStorage();
        broadcastUpdate('tasks');
        return true;
    }
    return false;
}

// تحديث مهمة
async function updateTask(taskId, updates) {
    const index = SHARED_TASKS.findIndex(task => task.id === taskId);
    if (index === -1) return null;
    
    SHARED_TASKS[index] = { ...SHARED_TASKS[index], ...updates };
    
    if (isSupabaseAvailable()) {
        try {
            await window.supabaseDb.updateTask(taskId, SHARED_TASKS[index]);
        } catch (e) {
            console.error('خطأ في تحديث المهمة في Supabase:', e);
        }
    }
    
    await saveTasksToStorage();
    broadcastUpdate('tasks');
    return SHARED_TASKS[index];
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
            standard: allTasks.filter(t => t.packageCategories?.includes("standard")).length,
            premium: allTasks.filter(t => t.packageCategories?.includes("premium")).length,
            vip: allTasks.filter(t => t.packageCategories?.includes("vip")).length
        }
    };
}

// ========== دوال كود الإحالة ==========

// توليد كود إحالة
async function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    
    if (isSupabaseAvailable()) {
        try {
            return await window.supabaseDb.generateReferralCode(username);
        } catch (e) {
            console.error('خطأ في توليد كود الإحالة من Supabase:', e);
        }
    }
    
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

// الحصول على إحصائيات الإحالة
async function getReferralStats(userId) {
    if (isSupabaseAvailable()) {
        try {
            return await window.supabaseDb.getReferralStats(userId);
        } catch (e) {
            console.error('خطأ في جلب إحصائيات الإحالة من Supabase:', e);
        }
    }
    
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const currentUser = users.find(u => u.id === userId);
    
    if (!currentUser) return null;
    
    if (!currentUser.referralCode) {
        currentUser.referralCode = await generateReferralCode(currentUser.username || `USER${userId}`);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('elite_users', JSON.stringify(users));
        }
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

// معالجة مكافآت الإحالة
async function processReferralRewardsOnApproval(userId, packageAmount) {
    if (isSupabaseAvailable()) {
        try {
            return await window.supabaseDb.processReferralRewardsOnApproval(userId, packageAmount);
        } catch (e) {
            console.error('خطأ في معالجة مكافآت الإحالة من Supabase:', e);
        }
    }
    
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
    
    addUserTransaction(newUser.id, {
        type: 'مكافأة إحالة',
        amount: REFERRAL_SETTINGS.refereeReward,
        description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        referralCode: newUser.referredBy,
        referrerName: referrer.name
    });
    
    addUserTransaction(referrer.id, {
        type: 'مكافأة إحالة',
        amount: REFERRAL_SETTINGS.referrerReward,
        description: `💰 مكافأة إحالة: ${newUser.name}`,
        date: new Date().toLocaleString('ar-SA'),
        status: 'مكتمل',
        referredUserId: newUser.id,
        referredUserName: newUser.name
    });
    
    broadcastUpdate('referrals');
    broadcastUpdate('users');
    
    return {
        referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward },
        referee: { id: newUser.id, name: newUser.name, reward: REFERRAL_SETTINGS.refereeReward }
    };
}

// ========== دوال المستخدمين ==========

// حفظ المستخدمين
function saveUsersToStorage(users) {
    localStorage.setItem('elite_users', JSON.stringify(users));
}

// إضافة معاملة مستخدم
function addUserTransaction(userId, transaction) {
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    transactions.unshift({
        ...transaction,
        id: transaction.id || Date.now() + Math.random()
    });
    localStorage.setItem(`user_transactions_${userId}`, JSON.stringify(transactions.slice(0, 200)));
}

// الحصول على إحصائيات إدارة المستخدمين
function getUserManagementStats() {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
    
    let totalBalance = 0;
    let totalEarned = 0;
    let activeWithPackage = 0;
    
    users.forEach(user => {
        totalBalance += user.balance || 0;
        totalEarned += user.totalEarned || 0;
        if (user.package && user.package.status === 'نشط') {
            activeWithPackage++;
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
        totalEarned: totalEarned
    };
}

// الحصول على تفاصيل المستخدم
function getUserDetails(userId) {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const withdrawals = JSON.parse(localStorage.getItem(`user_withdrawals_${userId}`)) || [];
    const totalWithdrawn = withdrawals
        .filter(w => w.status === 'مكتمل')
        .reduce((sum, w) => sum + w.amount, 0);
    
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
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
        todayEarnings,
        withdrawalsCount: withdrawals.length,
        transactionsCount: transactions.length
    };
}

// تحديث حالة المستخدم
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
    
    broadcastUpdate('users');
    return true;
}

// إضافة رصيد للمستخدم
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

// ========== دوال السحب ==========

// الحصول على جميع طلبات السحب
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

// الحصول على إحصائيات لوحة التحكم
function getDashboardStats() {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
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
    
    const totalCompletions = SHARED_TASKS.reduce((sum, task) => sum + (task.completions || 0), 0);
    const totalTasksReward = SHARED_TASKS.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);
    
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
        totalTasks: SHARED_TASKS.length,
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

// ========== المزامنة مع Supabase ==========

// مزامنة جميع البيانات مع Supabase
async function syncAllWithSupabase() {
    if (!isSupabaseAvailable()) return;
    
    try {
        await loadPackagesFromStorage();
        await loadTasksFromStorage();
        console.log('✅ تمت مزامنة البيانات مع Supabase');
    } catch (e) {
        console.error('❌ فشلت مزامنة البيانات مع Supabase:', e);
    }
}

// ========== التهيئة ==========

// تهيئة البيانات المشتركة
async function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة...');
    
    await loadPackagesFromStorage();
    await loadTasksFromStorage();
    
    if (isSupabaseAvailable()) {
        syncAllWithSupabase();
        setInterval(syncAllWithSupabase, 300000); // كل 5 دقائق
    }
    
    console.log(`✅ تم تحميل ${SHARED_PACKAGES.length} باقة و ${SHARED_TASKS.length} مهمة`);
    console.log(`💰 نظام الإحالة: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
}

// ========== التصدير ==========

const SharedData = {
    // الباقات
    packages: SHARED_PACKAGES,
    savePackages: savePackagesToStorage,
    loadPackages: loadPackagesFromStorage,
    addPackage: addNewPackage,
    deletePackage: deletePackage,
    updatePackage: updatePackage,
    getAllPackages: getAllPackages,
    getPackageById: getPackageById,
    
    // المهام
    tasks: SHARED_TASKS,
    saveTasks: saveTasksToStorage,
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
    
    // إدارة المستخدمين
    getUserManagementStats: getUserManagementStats,
    getUserDetails: getUserDetails,
    updateUserStatus: updateUserStatus,
    addUserBalance: addUserBalance,
    saveUsersToStorage: saveUsersToStorage,
    addUserTransaction: addUserTransaction,
    
    // المعاملات
    addUserTransaction: addUserTransaction,
    
    // الإحصائيات
    getDashboardStats: getDashboardStats,
    getAllWithdrawals: getAllWithdrawals,
    
    // دوال مساعدة
    calculateDaysLeft: calculateDaysLeft,
    calculateTotalProfit: calculateTotalProfit,
    
    // البث
    broadcastUpdate: broadcastUpdate,
    
    // المزامنة
    syncAllWithSupabase: syncAllWithSupabase,
    
    // تهيئة
    init: initializeSharedData
};

// تصدير للاستخدام العام
window.sharedData = SharedData;

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
    // انتظار تحميل Supabase أولاً
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
            console.log('⚠️ لم يتم تحميل Supabase، استخدام التخزين المحلي');
            SharedData.init();
        }
    }, 5000);
}