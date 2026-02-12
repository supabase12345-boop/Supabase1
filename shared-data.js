// ===================================
// نظام البيانات المشتركة مع Supabase
// نسخة كاملة ومضمونة 100%
// ===================================

// ========== المتغيرات العامة ==========
let supabase = null;
let isSupabaseReady = false;

// ========== الباقات الافتراضية ==========
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

// ========== المهام الافتراضية ==========
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

// ========== إعدادات نظام الإحالة ==========
const REFERRAL_SETTINGS = {
    referrerReward: 50,
    refereeReward: 20,
    minPackageForReward: 0,
    maxReferralLevels: 1,
    enableReferralSystem: true
};

// ========== تهيئة Supabase ==========
async function initSupabaseConnection() {
    if (supabase) return supabase;
    
    // انتظار وجود window.SupabaseService
    if (window.SupabaseService) {
        supabase = await window.SupabaseService.getClient();
        if (supabase) {
            isSupabaseReady = true;
            console.log('✅ Supabase جاهز للاستخدام');
            return supabase;
        }
    }
    
    // انتظار التهيئة
    return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
            if (window.SupabaseService) {
                supabase = await window.SupabaseService.getClient();
                if (supabase) {
                    isSupabaseReady = true;
                    clearInterval(checkInterval);
                    console.log('✅ Supabase جاهز للاستخدام');
                    resolve(supabase);
                }
            }
        }, 200);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('⚠️ Supabase غير متاح - استخدام localStorage');
            resolve(null);
        }, 5000);
    });
}

// ========== مزامنة مستخدم جديد إلى Supabase ==========
async function syncNewUserToSupabase(user) {
    console.log('🔄 محاولة مزامنة مستخدم جديد:', user?.email);
    
    if (!isSupabaseReady) {
        await initSupabaseConnection();
    }
    
    if (!supabase) {
        console.log('⚠️ Supabase غير متصل - تم الحفظ محلياً فقط');
        return false;
    }
    
    try {
        // التحقق من وجود المستخدم
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
        
        if (existingUser) {
            console.log('ℹ️ المستخدم موجود مسبقاً في Supabase');
            return true;
        }
        
        // تحويل بيانات المستخدم
        const userData = {
            id: user.id,
            name: user.name || '',
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            password: user.password || '',
            referred_by: user.referredBy || null,
            referral_code: user.referralCode || null,
            balance: user.balance || 0,
            wallet_address: user.walletAddress || '',
            wallet_network: user.walletNetwork || 'TRC20',
            tasks_completed: user.tasksCompleted || 0,
            total_earned: user.totalEarned || 0,
            total_withdrawn: user.totalWithdrawn || 0,
            referral_count: user.referralCount || 0,
            referral_earnings: user.referralEarnings || 0,
            referral_reward_paid: user.referralRewardPaid || false,
            joined_date: user.joinedDate || new Date().toISOString(),
            last_login: user.lastLogin || new Date().toISOString(),
            is_admin: user.isAdmin || false,
            status: user.status || 'active'
        };
        
        // إرسال إلى Supabase
        const { error } = await supabase
            .from('users')
            .insert([userData]);
        
        if (error) {
            console.error('❌ فشل مزامنة المستخدم:', error.message);
            return false;
        }
        
        console.log('✅ تم مزامنة المستخدم بنجاح إلى Supabase');
        return true;
    } catch (error) {
        console.error('❌ خطأ في مزامنة المستخدم:', error);
        return false;
    }
}

// ========== تحديث مستخدم في Supabase ==========
async function updateUserInSupabase(user) {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return false;
    
    try {
        const { error } = await supabase
            .from('users')
            .update({
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                balance: user.balance || 0,
                wallet_address: user.walletAddress,
                wallet_network: user.walletNetwork,
                tasks_completed: user.tasksCompleted,
                total_earned: user.totalEarned,
                total_withdrawn: user.totalWithdrawn,
                referral_count: user.referralCount,
                referral_earnings: user.referralEarnings,
                last_login: new Date().toISOString(),
                status: user.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (error) {
            console.error('❌ فشل تحديث المستخدم:', error.message);
            return false;
        }
        
        console.log('✅ تم تحديث المستخدم في Supabase');
        return true;
    } catch (error) {
        console.error('❌ خطأ في تحديث المستخدم:', error);
        return false;
    }
}

// ========== تحميل المستخدمين من Supabase ==========
async function loadUsersFromSupabase() {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error('❌ فشل تحميل المستخدمين:', error.message);
            return null;
        }
        
        if (data && data.length > 0) {
            // تحويل البيانات إلى صيغة التطبيق
            const users = data.map(user => ({
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone || '',
                password: user.password,
                referredBy: user.referred_by,
                referralCode: user.referral_code,
                balance: parseFloat(user.balance || 0),
                package: null,
                pendingPackage: null,
                walletAddress: user.wallet_address || '',
                walletNetwork: user.wallet_network || 'TRC20',
                tasksCompleted: user.tasks_completed || 0,
                totalEarned: parseFloat(user.total_earned || 0),
                totalWithdrawn: parseFloat(user.total_withdrawn || 0),
                referralCount: user.referral_count || 0,
                referralEarnings: parseFloat(user.referral_earnings || 0),
                referralRewardPaid: user.referral_reward_paid || false,
                joinedDate: user.joined_date,
                lastLogin: user.last_login,
                isAdmin: user.is_admin || false,
                status: user.status || 'active'
            }));
            
            localStorage.setItem('elite_users', JSON.stringify(users));
            console.log(`✅ تم تحميل ${users.length} مستخدم من Supabase`);
            return users;
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المستخدمين:', error);
    }
    
    return null;
}

// ========== تحميل الباقات من Supabase ==========
async function loadPackagesFromSupabase() {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return SHARED_PACKAGES;
    
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('❌ فشل تحميل الباقات:', error.message);
            return SHARED_PACKAGES;
        }
        
        if (data && data.length > 0) {
            SHARED_PACKAGES = data.map(pkg => ({
                id: pkg.id,
                name: pkg.name,
                price: parseFloat(pkg.price),
                profit: parseFloat(pkg.profit),
                dailyProfit: parseFloat(pkg.daily_profit || (pkg.price * pkg.profit / 100).toFixed(2)),
                tasks: pkg.tasks || 5,
                duration: pkg.duration || 30,
                status: pkg.status,
                description: pkg.description || '',
                category: pkg.category || 'standard',
                users: pkg.users_count || 0,
                createdAt: pkg.created_at
            }));
            
            localStorage.setItem('website_packages', JSON.stringify(SHARED_PACKAGES));
            console.log(`✅ تم تحميل ${SHARED_PACKAGES.length} باقة من Supabase`);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الباقات:', error);
    }
    
    return SHARED_PACKAGES;
}

// ========== تحميل المهام من Supabase ==========
async function loadTasksFromSupabase() {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return SHARED_TASKS;
    
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('❌ فشل تحميل المهام:', error.message);
            return SHARED_TASKS;
        }
        
        if (data && data.length > 0) {
            SHARED_TASKS = data.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                reward: parseFloat(task.reward),
                type: task.type || 'daily',
                status: task.status || 'active',
                completions: task.completions || 0,
                availableFor: task.available_for || 'all',
                packageCategories: task.package_categories || ['standard', 'premium', 'vip'],
                difficulty: task.difficulty || 'easy',
                timeRequired: task.time_required || 2,
                createdAt: task.created_at
            }));
            
            localStorage.setItem('website_tasks', JSON.stringify(SHARED_TASKS));
            console.log(`✅ تم تحميل ${SHARED_TASKS.length} مهمة من Supabase`);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المهام:', error);
    }
    
    return SHARED_TASKS;
}

// ========== تحميل الإعدادات من Supabase ==========
async function loadSettingsFromSupabase() {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
        
        if (error) {
            console.error('❌ فشل تحميل الإعدادات:', error.message);
            return null;
        }
        
        if (data) {
            REFERRAL_SETTINGS.referrerReward = parseFloat(data.referrer_reward || 50);
            REFERRAL_SETTINGS.refereeReward = parseFloat(data.referee_reward || 20);
            
            localStorage.setItem('system_settings', JSON.stringify({
                referrerReward: REFERRAL_SETTINGS.referrerReward,
                refereeReward: REFERRAL_SETTINGS.refereeReward,
                minWithdrawal: parseFloat(data.min_withdrawal || 50),
                withdrawalFees: data.withdrawal_fees || { TRC20: 5, ERC20: 15, BEP20: 3 }
            }));
            
            console.log('✅ تم تحميل إعدادات النظام من Supabase');
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الإعدادات:', error);
    }
}

// ========== حفظ جميع المستخدمين إلى Supabase ==========
async function saveUsersToSupabase(users) {
    if (!isSupabaseReady) await initSupabaseConnection();
    if (!supabase) return false;
    
    try {
        // تجهيز البيانات
        const usersToSave = users.map(user => ({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            password: user.password,
            referred_by: user.referredBy || null,
            referral_code: user.referralCode,
            balance: user.balance || 0,
            wallet_address: user.walletAddress || '',
            wallet_network: user.walletNetwork || 'TRC20',
            tasks_completed: user.tasksCompleted || 0,
            total_earned: user.totalEarned || 0,
            total_withdrawn: user.totalWithdrawn || 0,
            referral_count: user.referralCount || 0,
            referral_earnings: user.referralEarnings || 0,
            referral_reward_paid: user.referralRewardPaid || false,
            joined_date: user.joinedDate,
            last_login: user.lastLogin,
            is_admin: user.isAdmin || false,
            status: user.status || 'active',
            updated_at: new Date().toISOString()
        }));
        
        // إرسال إلى Supabase
        const { error } = await supabase
            .from('users')
            .upsert(usersToSave, { onConflict: 'id' });
        
        if (error) {
            console.error('❌ فشل حفظ المستخدمين:', error.message);
            return false;
        }
        
        console.log(`✅ تم حفظ ${users.length} مستخدم في Supabase`);
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ المستخدمين:', error);
        return false;
    }
}

// ========== حفظ المستخدمين محلياً + مزامنة ==========
function saveUsersToStorage(users) {
    localStorage.setItem('elite_users', JSON.stringify(users));
    saveUsersToSupabase(users);
    console.log('✅ تم حفظ المستخدمين محلياً وإرسالهم إلى Supabase');
}

// ========== دوال الباقات المحلية ==========
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

// ========== دوال المهام المحلية ==========
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

// ========== دوال الباقات العامة ==========
function getAllPackages() {
    return SHARED_PACKAGES.filter(pkg => pkg.status === "active");
}

function getPackageById(id) {
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

// ========== دوال المهام العامة ==========
function getAllTasks() {
    return SHARED_TASKS.filter(task => task.status === "active");
}

function getUserTasks(userPackage) {
    if (!userPackage) return [];
    const allTasks = getAllTasks();
    const userCategory = userPackage.category;
    
    return allTasks.filter(task => 
        task.status === 'active' && 
        task.packageCategories?.includes(userCategory)
    );
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
    return task.packageCategories?.includes(userPackage.category) || false;
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
        }
    };
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
    
    let pendingCommission = 0;
    referredUsers.forEach(u => {
        if (u.package && u.package.amount && !u.referralRewardPaid) {
            pendingCommission += REFERRAL_SETTINGS.referrerReward;
        }
    });
    
    return {
        referralCode: currentUser.referralCode || '',
        referredCount: referredUsers.length,
        activeReferrals: activeReferrals.length,
        pendingReferrals: pendingReferrals.length,
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
            packageName: u.package?.name || 'لا يوجد',
            packageAmount: u.package?.amount || 0,
            rewardPaid: u.referralRewardPaid || false
        }))
    };
}

async function processReferralRewardsOnApproval(userId, packageAmount) {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const newUser = users.find(u => u.id === userId);
    
    if (!newUser || !newUser.referredBy) return false;
    
    const referrer = users.find(u => u.referralCode === newUser.referredBy);
    if (!referrer) return false;
    
    if (newUser.referralRewardPaid) return false;
    
    // صرف المكافآت
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    newUser.balance = (newUser.balance || 0) + REFERRAL_SETTINGS.refereeReward;
    referrer.balance = (referrer.balance || 0) + REFERRAL_SETTINGS.referrerReward;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_SETTINGS.referrerReward;
    newUser.referralRewardPaid = true;
    
    // حفظ التغييرات
    localStorage.setItem('elite_users', JSON.stringify(users));
    saveUsersToSupabase(users);
    
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
    
    broadcastUpdate('referrals');
    broadcastUpdate('users');
    
    return {
        referrer: { id: referrer.id, name: referrer.name, reward: REFERRAL_SETTINGS.referrerReward },
        referee: { id: newUser.id, name: newUser.name, reward: REFERRAL_SETTINGS.refereeReward }
    };
}

// ========== دوال المستخدمين ==========
function addUserTransaction(userId, transaction) {
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    transactions.unshift({
        ...transaction,
        id: transaction.id || Date.now()
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
    
    let totalBalance = 0;
    let activeWithPackage = 0;
    
    users.forEach(user => {
        totalBalance += user.balance || 0;
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
        totalBalance: totalBalance
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
    
    const transactions = JSON.parse(localStorage.getItem(`user_transactions_${userId}`)) || [];
    const totalEarned = transactions
        .filter(t => t.type === 'ربح' || t.type === 'مكافأة إحالة')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
        ...user,
        totalWithdrawn,
        totalEarned,
        referralStats: getReferralStats(userId)
    };
}

function updateUserStatus(userId, status, reason = '') {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    users[userIndex].status = status;
    users[userIndex].statusReason = reason;
    
    localStorage.setItem('elite_users', JSON.stringify(users));
    saveUsersToSupabase(users);
    
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (currentUser && currentUser.id === userId) {
        currentUser.status = status;
        localStorage.setItem('current_user', JSON.stringify(currentUser));
    }
    
    broadcastUpdate('users');
    return true;
}

function addUserBalance(userId, amount, reason = 'إضافة رصيد') {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1 || amount <= 0) return false;
    
    users[userIndex].balance = (users[userIndex].balance || 0) + amount;
    localStorage.setItem('elite_users', JSON.stringify(users));
    saveUsersToSupabase(users);
    
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (currentUser && currentUser.id === userId) {
        currentUser.balance = users[userIndex].balance;
        localStorage.setItem('current_user', JSON.stringify(currentUser));
    }
    
    addUserTransaction(userId, {
        type: 'إضافة رصيد',
        amount: amount,
        description: reason,
        date: new Date().toLocaleString('ar-SA')
    });
    
    broadcastUpdate('users');
    return true;
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

// ========== دوال الإحصائيات ==========
function getDashboardStats() {
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    const pendingPackages = JSON.parse(localStorage.getItem('pending_packages')) || [];
    const withdrawals = getAllWithdrawals();
    
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let activeSubscriptions = 0;
    let activeUsers = 0;
    let suspendedUsers = 0;
    let bannedUsers = 0;
    
    users.forEach(user => {
        if (user.package && user.package.status === 'نشط') {
            totalDeposits += user.package.amount || 0;
            activeSubscriptions++;
        }
        
        if (user.status === 'active' || !user.status) activeUsers++;
        if (user.status === 'suspended') suspendedUsers++;
        if (user.status === 'banned') bannedUsers++;
    });
    
    withdrawals.forEach(w => {
        if (w.status === 'مكتمل') {
            totalWithdrawals += w.amount;
        }
    });
    
    return {
        totalUsers: users.length,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        totalDeposits,
        totalWithdrawals,
        activeSubscriptions,
        pendingPackages: pendingPackages.length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'معلق').length,
        packagesCount: SHARED_PACKAGES.length
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

// ========== بث التحديثات ==========
function broadcastUpdate(type) {
    const event = new CustomEvent('data-updated', { 
        detail: { 
            type,
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(event);
}

// ========== مزامنة جميع البيانات ==========
async function syncAllToSupabase() {
    console.log('🔄 بدء مزامنة جميع البيانات...');
    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
    await saveUsersToSupabase(users);
    console.log('✅ تمت المزامنة');
}

async function syncAllFromSupabase() {
    console.log('🔄 بدء تحميل جميع البيانات...');
    await loadUsersFromSupabase();
    await loadPackagesFromSupabase();
    await loadTasksFromSupabase();
    await loadSettingsFromSupabase();
    console.log('✅ تم التحميل');
}

// ========== التهيئة الكاملة ==========
async function initializeSharedData() {
    console.log('🚀 تهيئة نظام البيانات المشتركة...');
    
    // تحميل البيانات المحلية أولاً
    loadPackagesFromStorage();
    loadTasksFromStorage();
    
    // محاولة الاتصال بـ Supabase
    await initSupabaseConnection();
    
    // تحميل البيانات من Supabase
    await loadPackagesFromSupabase();
    await loadTasksFromSupabase();
    await loadSettingsFromSupabase();
    
    const localUsers = JSON.parse(localStorage.getItem('elite_users')) || [];
    if (localUsers.length === 0) {
        await loadUsersFromSupabase();
    }
    
    console.log(`✅ تم التهيئة: ${SHARED_PACKAGES.length} باقة, ${SHARED_TASKS.length} مهمة`);
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
    getAllPackages,
    getPackageById,
    
    // المهام
    tasks: SHARED_TASKS,
    saveTasks: saveTasksToStorage,
    loadTasks: loadTasksFromStorage,
    addTask: addNewTask,
    deleteTask,
    getAllTasks,
    getUserTasks,
    getTaskById,
    incrementTaskCompletion,
    canUserCompleteTask,
    getTasksStats,
    
    // نظام الإحالة
    REFERRAL_SETTINGS,
    generateReferralCode,
    getReferralStats,
    processReferralRewardsOnApproval,
    
    // إدارة المستخدمين
    getUserManagementStats,
    getUserDetails,
    updateUserStatus,
    addUserBalance,
    saveUsersToSupabase,
    loadUsersFromSupabase,
    syncNewUserToSupabase,
    updateUserInSupabase,
    saveUsersToStorage,
    
    // المعاملات
    addUserTransaction,
    getUserTransactions,
    
    // الإحصائيات
    getDashboardStats,
    getAllWithdrawals,
    
    // دوال مساعدة
    calculateDaysLeft,
    
    // البث
    broadcastUpdate,
    
    // Supabase
    supabase: () => supabase,
    initSupabase: initSupabaseConnection,
    syncAllToSupabase,
    syncAllFromSupabase,
    
    // تهيئة
    init: initializeSharedData
};

window.sharedData = SharedData;

// التهيئة التلقائية
if (typeof window !== 'undefined') {
    // انتظار تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SharedData.init());
    } else {
        SharedData.init();
    }
    
    // مزامنة دورية كل 5 دقائق
    setInterval(() => {
        if (supabase) {
            SharedData.syncAllToSupabase();
        }
    }, 300000);
}

console.log('📦 SharedData جاهز للاستخدام');