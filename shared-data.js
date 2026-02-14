// ===================================
// ملف: shared-data.js
// الوصف: نظام البيانات المشتركة بين جميع صفحات الموقع
// الإصدار: 3.0.0 - الفاخر
// ===================================

// ========== البيانات الافتراضية ==========
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
        icon: "fa-bolt",
        color: "#3b82f6",
        features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم فني 24/7", "مدة 30 يوم"],
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
        icon: "fa-star",
        color: "#8b5cf6",
        features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم فني 24/7", "أولوية في الدعم"],
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
        icon: "fa-crown",
        color: "#f59e0b",
        features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم VIP خاص", "مكافآت حصرية"],
        createdAt: "2024-01-01T00:00:00.000Z"
    }
];

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
        icon: "fa-play",
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
        icon: "fa-share-alt",
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
        icon: "fa-star",
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
        icon: "fa-chart-line",
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
        icon: "fa-crown",
        createdAt: "2024-01-01T00:00:00.000Z"
    }
];

// ========== إعدادات الإحالة ==========
const REFERRAL_SETTINGS = {
    referrerReward: 50,
    refereeReward: 20,
    minPackageForReward: 0,
    maxReferralLevels: 1,
    enableReferralSystem: true,
    bonusForFirstReferral: 10,
    monthlyTopReferrerBonus: 100
};

// ========== إعدادات النظام ==========
const SYSTEM_SETTINGS = {
    siteName: "Elite Investors",
    version: "3.0.0",
    minWithdrawal: 50,
    withdrawalFees: {
        TRC20: 5,
        ERC20: 15,
        BEP20: 3
    },
    supportEmail: "support@elite-investors.com",
    telegramChannel: "https://t.me/elite_investors",
    maintenanceMode: false,
    registrationOpen: true
};

// ========== دوال كود الإحالة ==========
function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

function getReferralStats(userId) {
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
    
    let monthlyEarnings = 0;
    const currentMonth = new Date().getMonth();
    referredUsers.forEach(u => {
        if (u.package && u.referralRewardPaid && u.referralRewardDate) {
            const rewardMonth = new Date(u.referralRewardDate).getMonth();
            if (rewardMonth === currentMonth) {
                monthlyEarnings += REFERRAL_SETTINGS.referrerReward;
            }
        }
    });
    
    return {
        referralCode: currentUser.referralCode || '',
        referredCount: referredUsers.length,
        activeReferrals: activeReferrals.length,
        pendingReferrals: pendingReferrals.length,
        paidReferrals: paidReferrals.length,
        totalEarned: currentUser.referralEarnings || 0,
        monthlyEarnings: monthlyEarnings,
        pendingCommission: pendingCommission,
        conversionRate: referredUsers.length > 0 ? ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) : 0,
        referralLink: `${window.location.origin}/index.html?ref=${currentUser.referralCode}`,
        referredUsers: referredUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            username: u.username,
            joinedDate: u.joinedDate,
            hasPackage: !!u.package,
            packageName: u.package ? u.package.name : 'لا يوجد',
            packageAmount: u.package ? u.package.amount : 0,
            rewardPaid: u.referralRewardPaid || false,
            rewardDate: u.referralRewardDate || null
        }))
    };
}

async function processReferralRewardsOnApproval(userId, packageAmount) {
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
    
    // تحديث إحصائيات المحيل
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    
    // مكافأة المستخدم الجديد
    newUser.balance = (newUser.balance || 0) + REFERRAL_SETTINGS.refereeReward;
    newUser.referralRewardPaid = true;
    newUser.referralRewardAmount = REFERRAL_SETTINGS.refereeReward;
    newUser.referralRewardDate = new Date().toISOString();
    
    // مكافأة صاحب الكود
    referrer.balance = (referrer.balance || 0) + REFERRAL_SETTINGS.referrerReward;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_SETTINGS.referrerReward;
    
    // مكافأة أول إحالة (إضافية)
    if (referrer.referralCount === 1) {
        referrer.balance += REFERRAL_SETTINGS.bonusForFirstReferral || 10;
        referrer.referralEarnings += REFERRAL_SETTINGS.bonusForFirstReferral || 10;
    }
    
    // تسجيل معاملات المستخدم الجديد
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
    
    // تسجيل معاملات المحيل
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
    
    // تسجيل الإحالة في جدول الإحالات
    const referrals = JSON.parse(localStorage.getItem('referrals_list')) || [];
    referrals.push({
        id: Date.now(),
        referrerId: referrer.id,
        referrerName: referrer.name,
        referredId: newUser.id,
        referredName: newUser.name,
        referredEmail: newUser.email,
        packageAmount: packageAmount,
        referrerReward: REFERRAL_SETTINGS.referrerReward,
        refereeReward: REFERRAL_SETTINGS.refereeReward,
        status: 'completed',
        date: new Date().toISOString()
    });
    localStorage.setItem('referrals_list', JSON.stringify(referrals.slice(0, 500)));
    
    localStorage.setItem('elite_users', JSON.stringify(users));
    
    // تحديث current_user إذا كان موجوداً
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
        referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward + (referrer.referralCount === 1 ? REFERRAL_SETTINGS.bonusForFirstReferral : 0) },
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

function getAllTasks() {
    return SHARED_TASKS.filter(task => task.status === "active");
}

function getUserTasks(userPackage) {
    const allTasks = getAllTasks();
    
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
        icon: taskData.icon || "fa-tasks",
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

function updateTask(taskId, updates) {
    const index = SHARED_TASKS.findIndex(t => t.id === taskId);
    if (index !== -1) {
        SHARED_TASKS[index] = { ...SHARED_TASKS[index], ...updates, updatedAt: new Date().toISOString() };
        saveTasksToStorage();
        broadcastUpdate('tasks');
        return true;
    }
    return false;
}

function getTasksStats() {
    const allTasks = getAllTasks();
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
        },
        byDifficulty: {
            easy: allTasks.filter(t => t.difficulty === "easy").length,
            medium: allTasks.filter(t => t.difficulty === "medium").length,
            hard: allTasks.filter(t => t.difficulty === "hard").length
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

function getAllPackages() {
    return SHARED_PACKAGES.filter(pkg => pkg.status === "active");
}

function getPackageById(id) {
    return SHARED_PACKAGES.find(pkg => pkg.id === id);
}

function addNewPackage(packageData) {
    const dailyProfit = (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2);
    
    const newPackage = {
        id: Date.now(),
        name: packageData.name,
        price: parseFloat(packageData.price),
        profit: parseFloat(packageData.profit || 2.5),
        dailyProfit: parseFloat(dailyProfit),
        tasks: parseInt(packageData.tasks || 5),
        duration: parseInt(packageData.duration || 30),
        status: "active",
        category: packageData.category || "standard",
        description: packageData.description || "",
        icon: packageData.icon || (packageData.category === 'vip' ? 'fa-crown' : packageData.category === 'premium' ? 'fa-star' : 'fa-bolt'),
        color: packageData.color || (packageData.category === 'vip' ? '#f59e0b' : packageData.category === 'premium' ? '#8b5cf6' : '#3b82f6'),
        features: packageData.features || [
            `ربح يومي ${packageData.profit || 2.5}%`,
            `${packageData.tasks || 5} مهام يومية`,
            "دعم فني 24/7",
            `مدة ${packageData.duration || 30} يوم`
        ],
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

function updatePackage(packageId, updates) {
    const index = SHARED_PACKAGES.findIndex(p => p.id === packageId);
    if (index !== -1) {
        if (updates.price || updates.profit) {
            const price = updates.price || SHARED_PACKAGES[index].price;
            const profit = updates.profit || SHARED_PACKAGES[index].profit;
            updates.dailyProfit = parseFloat((price * profit / 100).toFixed(2));
        }
        SHARED_PACKAGES[index] = { ...SHARED_PACKAGES[index], ...updates, updatedAt: new Date().toISOString() };
        savePackagesToStorage();
        broadcastUpdate('packages');
        return true;
    }
    return false;
}

function getPackagesStats() {
    const packages = getAllPackages();
    return {
        total: packages.length,
        totalValue: packages.reduce((sum, p) => sum + p.price, 0),
        byCategory: {
            standard: packages.filter(p => p.category === "standard").length,
            premium: packages.filter(p => p.category === "premium").length,
            vip: packages.filter(p => p.category === "vip").length
        },
        averagePrice: packages.length > 0 ? (packages.reduce((sum, p) => sum + p.price, 0) / packages.length).toFixed(2) : 0
    };
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
    let totalReferrals = 0;
    let totalReferralEarnings = 0;
    
    users.forEach(user => {
        totalBalance += user.balance || 0;
        totalEarned += user.totalEarned || 0;
        totalReferrals += user.referralCount || 0;
        totalReferralEarnings += user.referralEarnings || 0;
        if (user.package && user.package.status === 'نشط') {
            activeWithPackage++;
        }
    });
    
    withdrawals.forEach(w => {
        if (w.status === 'مكتمل' || w.status === 'completed') {
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
        totalWithdrawn: totalWithdrawn,
        totalReferrals: totalReferrals,
        totalReferralEarnings: totalReferralEarnings
    };
}

function getUserDetails(userId) {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const withdrawals = JSON.parse(localStorage.getItem(`user_withdrawals_${userId}`)) || [];
    const totalWithdrawn = withdrawals
        .filter(w => w.status === 'مكتمل' || w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'معلق' || w.status === 'pending').length;
    
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    const totalDeposits = transactions
        .filter(t => t.type === 'اشتراك' && (t.status === 'مكتمل' || t.status === 'completed'))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalTaskEarnings = transactions
        .filter(t => t.type === 'ربح' || t.type === 'مكافأة' || t.type === 'مكافأة إحالة')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const today = new Date().toDateString();
    const todayEarnings = transactions
        .filter(t => {
            const tDate = t.date ? new Date(t.date).toDateString() : '';
            return tDate === today && (t.type === 'ربح' || t.type === 'مكافأة' || t.type === 'مكافأة إحالة');
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    const todayTasks = Object.keys(localStorage)
        .filter(key => key.startsWith('task_') && key.includes(today) && localStorage.getItem(key) === 'completed')
        .length;
    
    // حساب أيام الاشتراك المتبقية
    let daysLeft = 0;
    if (user.package && user.package.purchaseDate) {
        const purchaseDate = new Date(user.package.purchaseDate);
        const endDate = new Date(purchaseDate);
        endDate.setDate(endDate.getDate() + (user.package.duration || 30));
        const today = new Date();
        daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
    }
    
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
        daysLeft: daysLeft,
        referralStats: getReferralStats(userId)
    };
}

function updateUserStatus(userId, status, reason = '') {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    const oldStatus = users[userIndex].status;
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
        oldStatus: oldStatus,
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

function getSystemLogs(limit = 100) {
    const logs = JSON.parse(localStorage.getItem('system_logs')) || [];
    return logs.slice(0, limit);
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
    
    return allWithdrawals.sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0));
}

function getWithdrawalsStats() {
    const withdrawals = getAllWithdrawals();
    return {
        total: withdrawals.length,
        pending: withdrawals.filter(w => w.status === 'pending' || w.status === 'معلق').length,
        completed: withdrawals.filter(w => w.status === 'completed' || w.status === 'مكتمل').length,
        rejected: withdrawals.filter(w => w.status === 'rejected' || w.status === 'مرفوض').length,
        totalAmount: withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
        totalFees: withdrawals.reduce((sum, w) => sum + (w.fee || 0), 0)
    };
}

// ========== دوال الإحصائيات المتقدمة ==========
function getDashboardStats() {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
    const tasks = getAllTasks();
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
    let newUsersToday = 0;
    let newUsersThisWeek = 0;
    let newUsersThisMonth = 0;
    
    const today = new Date().toDateString();
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    
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
        
        const joinDate = new Date(user.joinedDate || user.joined_date || 0);
        if (joinDate.toDateString() === today) newUsersToday++;
        if (joinDate > thisWeek) newUsersThisWeek++;
        if (joinDate > thisMonth) newUsersThisMonth++;
    });
    
    withdrawals.forEach(w => {
        if (w.status === 'مكتمل' || w.status === 'completed') {
            totalWithdrawals += w.amount;
        }
        if (w.status === 'معلق' || w.status === 'pending') {
            pendingWithdrawals++;
        }
    });
    
    const totalCompletions = tasks.reduce((sum, task) => sum + (task.completions || 0), 0);
    const totalTasksReward = tasks.reduce((sum, task) => sum + (task.reward * (task.completions || 0)), 0);
    
    const todayDeposits = users
        .filter(u => u.package && new Date(u.package.purchaseDate || u.package.purchase_date).toDateString() === today)
        .reduce((sum, u) => sum + (u.package.amount || 0), 0);
    
    const todayWithdrawals = withdrawals
        .filter(w => (w.status === 'completed' || w.status === 'مكتمل') && new Date(w.date || w.created_at || 0).toDateString() === today)
        .reduce((sum, w) => sum + w.amount, 0);
    
    return {
        totalUsers: users.length,
        activeUsers: activeUsers,
        suspendedUsers: suspendedUsers,
        bannedUsers: bannedUsers,
        newUsersToday: newUsersToday,
        newUsersThisWeek: newUsersThisWeek,
        newUsersThisMonth: newUsersThisMonth,
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
        packagesCount: SHARED_PACKAGES.length,
        conversionRate: users.length > 0 ? ((activeSubscriptions / users.length) * 100).toFixed(1) : 0
    };
}

// ========== دوال الطلبات المعلقة ==========
function getPendingPackagesStats() {
    const pending = JSON.parse(localStorage.getItem('pending_packages')) || [];
    let totalAmount = 0;
    let withReferral = 0;
    
    pending.forEach(p => {
        totalAmount += p.amount || 0;
        if (p.referredBy) withReferral++;
    });
    
    return {
        total: pending.length,
        totalAmount: totalAmount,
        withReferral: withReferral,
        averageAmount: pending.length > 0 ? (totalAmount / pending.length).toFixed(2) : 0
    };
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace('US$', '$').replace('USD', '$');
}

function formatDate(date, format = 'short') {
    const d = new Date(date);
    if (format === 'short') {
        return d.toLocaleDateString('ar-SA');
    } else if (format === 'long') {
        return d.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (format === 'time') {
        return d.toLocaleString('ar-SA');
    }
    return d.toLocaleDateString('ar-SA');
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
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
    console.log('🚀 تهيئة نظام البيانات المشتركة v3.0...');
    
    // تحميل البيانات من التخزين المحلي
    loadPackagesFromStorage();
    loadTasksFromStorage();
    
    // التأكد من وجود بيانات افتراضية إذا كانت التخزين فارغ
    if (SHARED_PACKAGES.length === 0) {
        console.log('📦 إضافة الباقات الافتراضية');
        SHARED_PACKAGES = [
            {
                id: 1,
                name: "الباقة الفضية",
                price: 500,
                profit: 2.5,
                dailyProfit: 12.5,
                tasks: 5,
                duration: 30,
                status: "active",
                category: "standard",
                icon: "fa-bolt",
                color: "#3b82f6",
                features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم فني 24/7", "مدة 30 يوم"],
                createdAt: new Date().toISOString()
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
                category: "premium",
                icon: "fa-star",
                color: "#8b5cf6",
                features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم فني 24/7", "أولوية في الدعم"],
                createdAt: new Date().toISOString()
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
                category: "vip",
                icon: "fa-crown",
                color: "#f59e0b",
                features: ["ربح يومي 2.5%", "5 مهام يومية", "دعم VIP خاص", "مكافآت حصرية"],
                createdAt: new Date().toISOString()
            }
        ];
        savePackagesToStorage();
    }
    
    if (SHARED_TASKS.length === 0) {
        console.log('📋 إضافة المهام الافتراضية');
        SHARED_TASKS = [
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
                icon: "fa-play",
                createdAt: new Date().toISOString()
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
                icon: "fa-share-alt",
                createdAt: new Date().toISOString()
            }
        ];
        saveTasksToStorage();
    }
    
    console.log(`✅ تم تحميل ${SHARED_PACKAGES.length} باقة و ${SHARED_TASKS.length} مهمة`);
    console.log(`💰 نظام الإحالة: ${REFERRAL_SETTINGS.referrerReward}$ للمحيل، ${REFERRAL_SETTINGS.refereeReward}$ للمحال`);
    console.log(`🎁 مكافأة أول إحالة: +${REFERRAL_SETTINGS.bonusForFirstReferral || 10}$`);
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
    getPackagesStats: getPackagesStats,
    
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
    addSystemLog: addSystemLog,
    getSystemLogs: getSystemLogs,
    
    // المعاملات
    addUserTransaction: addUserTransaction,
    getUserTransactions: getUserTransactions,
    
    // طلبات السحب
    getAllWithdrawals: getAllWithdrawals,
    getWithdrawalsStats: getWithdrawalsStats,
    
    // الطلبات المعلقة
    getPendingPackagesStats: getPendingPackagesStats,
    
    // الإحصائيات
    getDashboardStats: getDashboardStats,
    
    // إعدادات النظام
    SYSTEM_SETTINGS: SYSTEM_SETTINGS,
    
    // دوال مساعدة
    calculateDaysLeft: calculateDaysLeft,
    calculateTotalProfit: calculateTotalProfit,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    generateId: generateId,
    
    // البث
    broadcastUpdate: broadcastUpdate,
    
    // التهيئة
    init: initializeSharedData
};

// تصدير للاستخدام العام
if (typeof window !== 'undefined') {
    window.sharedData = SharedData;
    // تهيئة تلقائية
    SharedData.init();
}

// تصدير للاستخدام في وحدات ES (اختياري)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedData;
}