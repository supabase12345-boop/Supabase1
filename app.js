/**
 * Elite Investors - التطبيق الرئيسي
 * الإصدار: 3.0.0 (متوافق مع Supabase والتصميم الفاخر)
 */

class InvestmentApp {
    constructor() {
        this.user = null;
        this.version = '3.0.0';
        this.debug = true;
        this.supabaseAvailable = false;
        this.init();
    }
    
    /**
     * تهيئة التطبيق
     */
    async init() {
        this.log('🚀 بدء تشغيل Elite Investors v' + this.version);
        await this.checkSupabase();
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadUserData();
        this.initAnimations();
        this.checkUrlReferral();
    }
    
    /**
     * التحقق من توفر Supabase
     */
    async checkSupabase() {
        this.supabaseAvailable = !!(window.supabaseClient && window.supabaseHelpers);
        
        if (this.supabaseAvailable) {
            this.log('✅ متصل بـ Supabase');
            
            // محاولة جلب الإحصائيات للتحقق من الاتصال
            try {
                const stats = await window.supabaseHelpers.getDashboardStats();
                if (stats.success) {
                    this.log('📊 إحصائيات Supabase: ' + JSON.stringify(stats.data));
                }
            } catch (e) {
                this.log('⚠️ فشل جلب الإحصائيات من Supabase');
            }
        } else {
            this.log('⚠️ استخدام التخزين المحلي فقط');
        }
        
        // تحديث مؤشر الاتصال إذا كان موجوداً
        this.updateConnectionStatus();
        
        return this.supabaseAvailable;
    }
    
    /**
     * تحديث حالة الاتصال في الواجهة
     */
    updateConnectionStatus() {
        const statusDiv = document.getElementById('connectionStatus');
        const icon = document.getElementById('connectionIcon');
        const text = document.getElementById('connectionText');
        
        if (statusDiv) {
            if (this.supabaseAvailable) {
                statusDiv.className = 'connection-status online';
                if (icon) icon.className = 'fas fa-wifi';
                if (text) text.textContent = 'متصل بـ Supabase';
            } else {
                statusDiv.className = 'connection-status offline';
                if (icon) icon.className = 'fas fa-exclamation-triangle';
                if (text) text.textContent = 'تخزين محلي';
            }
        }
    }
    
    /**
     * التحقق من صلاحية المستخدم
     */
    async checkAuth() {
        try {
            const userData = localStorage.getItem('current_user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                
                // محاولة جلب أحدث بيانات المستخدم من Supabase
                if (this.supabaseAvailable) {
                    try {
                        const result = await window.supabaseHelpers.getUserById(parsedUser.id);
                        if (result.success && result.data) {
                            this.user = result.data;
                            
                            // تحديث التخزين المحلي
                            localStorage.setItem('current_user', JSON.stringify(this.user));
                            
                            // تحديث قائمة المستخدمين
                            await this.updateUsersList(this.user);
                            
                            this.log('👤 تم تحديث المستخدم من Supabase: ' + this.user.email);
                        } else {
                            this.user = parsedUser;
                            this.log('👤 استخدام البيانات المحلية للمستخدم');
                        }
                    } catch (error) {
                        this.log('⚠️ فشل جلب المستخدم من Supabase، استخدام المحلي');
                        this.user = parsedUser;
                    }
                } else {
                    this.user = parsedUser;
                }
                
                // التحقق من حالة المستخدم
                if (this.user.status === 'banned') {
                    this.log('⚠️ مستخدم محظور: ' + this.user.email);
                    this.showNotification('❌ حسابك محظور. يرجى التواصل مع الدعم الفني.', 'error');
                    this.logout(true);
                    return;
                }
                
                if (this.user.status === 'suspended') {
                    this.log('⚠️ مستخدم معلق: ' + this.user.email);
                    this.showNotification('⚠️ حسابك معلق مؤقتاً. بعض الخدمات غير متاحة.', 'warning');
                }
                
                this.log('👤 مستخدم نشط: ' + (this.user.name || this.user.email));
                this.updateAuthUI();
            }
        } catch (e) {
            console.error('خطأ في التحقق من المصادقة:', e);
            this.logout(true);
        }
    }
    
    /**
     * تحديث قائمة المستخدمين في التخزين المحلي
     */
    async updateUsersList(updatedUser) {
        try {
            const users = JSON.parse(localStorage.getItem('elite_users')) || [];
            const userIndex = users.findIndex(u => u.id === updatedUser.id);
            
            if (userIndex !== -1) {
                users[userIndex] = updatedUser;
            } else {
                users.push(updatedUser);
            }
            
            localStorage.setItem('elite_users', JSON.stringify(users));
        } catch (e) {
            console.error('خطأ في تحديث قائمة المستخدمين:', e);
        }
    }
    
    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // مستمع لتحديثات البيانات
        window.addEventListener('data-updated', (event) => {
            this.log('📡 تحديث: ' + event.detail.type);
            this.handleDataUpdate(event.detail.type);
        });
        
        // مستمع لحفظ البيانات قبل إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            if (this.user) {
                this.saveUserData();
            }
        });
        
        // مستمع لتغيير حالة الاتصال
        window.addEventListener('online', () => {
            this.showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
            this.syncOfflineData();
            this.checkSupabase();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('⚠️ لا يوجد اتصال بالإنترنت', 'warning');
            this.supabaseAvailable = false;
            this.updateConnectionStatus();
        });
    }
    
    /**
     * تحميل بيانات المستخدم
     */
    async loadUserData() {
        if (this.user) {
            this.updateUserStats();
            await this.loadUserReferralStats();
            await this.loadUserTasks();
        }
    }
    
    /**
     * تحميل إحصائيات الإحالة للمستخدم
     */
    async loadUserReferralStats() {
        if (!this.user) return;
        
        try {
            // استخدام shared-data إذا كان متاحاً
            if (window.sharedData) {
                const stats = await window.sharedData.getReferralStats(this.user.id);
                if (stats) {
                    this.user.referralStats = stats;
                    
                    // إنشاء كود إحالة إذا لم يكن موجوداً
                    if (!this.user.referralCode && !this.user.referral_code && stats.referralCode) {
                        this.user.referralCode = stats.referralCode;
                        this.user.referral_code = stats.referralCode;
                        this.saveUserData();
                    }
                }
            }
        } catch (e) {
            console.error('خطأ في تحميل إحصائيات الإحالة:', e);
        }
    }
    
    /**
     * تحميل مهام المستخدم
     */
    async loadUserTasks() {
        if (!this.user || !this.user.package) return;
        
        try {
            if (window.sharedData) {
                const tasks = await window.sharedData.getUserTasks(this.user.package);
                if (tasks && tasks.length) {
                    this.user.tasks = tasks;
                    this.displayTasks(tasks);
                }
            }
        } catch (e) {
            console.error('خطأ في تحميل المهام:', e);
        }
    }
    
    /**
     * عرض المهام في الواجهة
     */
    displayTasks(tasks) {
        const tasksContainer = document.getElementById('tasksList');
        if (!tasksContainer) return;
        
        const today = new Date().toDateString();
        let html = '';
        
        tasks.forEach(task => {
            const completed = localStorage.getItem(`task_${task.id}_${today}`);
            const categoryClass = task.package_categories?.includes('vip') ? 'vip' : 
                                 task.package_categories?.includes('premium') ? 'premium' : 'standard';
            
            html += `
                <div class="task-card ${completed ? 'completed' : ''}">
                    <div class="task-info">
                        <h4>
                            ${task.title}
                            <span class="task-badge ${categoryClass}">
                                ${task.package_categories?.includes('vip') ? 'VIP' : 
                                  task.package_categories?.includes('premium') ? 'ذهبية' : 'فضية'}
                            </span>
                        </h4>
                        <p>${task.description || 'أكمل المهمة للحصول على المكافأة'}</p>
                    </div>
                    <div style="text-align: left;">
                        <div class="task-reward">+${task.reward}$</div>
                        <button class="btn btn-sm btn-success" onclick="window.app.completeTask(${task.id}, ${task.reward})" ${completed ? 'disabled' : ''}>
                            ${completed ? '✓ مكتملة' : 'إكمال'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        tasksContainer.innerHTML = html || '<div class="empty-state"><i class="fas fa-check-circle"></i><br>لا توجد مهام متاحة اليوم</div>';
    }
    
    /**
     * إكمال مهمة
     */
    async completeTask(taskId, reward) {
        if (!this.user) return;
        
        const today = new Date().toDateString();
        if (localStorage.getItem(`task_${taskId}_${today}`)) return;
        
        // زيادة عدد إنجازات المهمة
        if (this.supabaseAvailable) {
            try {
                await window.supabaseHelpers.incrementTaskCompletion(taskId);
            } catch (e) {
                this.log('⚠️ فشل تحديث إنجازات المهمة في Supabase');
            }
        }
        
        if (window.sharedData) {
            await window.sharedData.incrementTaskCompletion(taskId);
        }
        
        // تحديث رصيد المستخدم
        this.user.balance = (this.user.balance || 0) + reward;
        this.user.totalEarned = (this.user.totalEarned || 0) + reward;
        this.user.tasksCompleted = (this.user.tasksCompleted || 0) + 1;
        
        // حفظ حالة إكمال المهمة
        localStorage.setItem(`task_${taskId}_${today}`, 'completed');
        
        // حفظ بيانات المستخدم
        await this.saveUserData();
        
        // إضافة معاملة
        this.addTransaction({
            type: 'ربح',
            amount: reward,
            description: 'إكمال مهمة يومية'
        });
        
        // تحديث الواجهة
        this.updateUserStats();
        await this.loadUserTasks();
        
        this.showNotification(`✅ +${reward}$`);
    }
    
    /**
     * التحقق من وجود كود إحالة في الرابط
     */
    checkUrlReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && !this.user) {
            this.log('📨 كود إحالة في الرابط: ' + refCode);
            
            // تخزين الكود في sessionStorage للاستخدام عند التسجيل
            sessionStorage.setItem('pending_referral', refCode);
            
            // تحديث حقل كود الإحالة في نموذج التسجيل إذا كان موجوداً
            const referralField = document.getElementById('registerReferral');
            if (referralField) {
                referralField.value = refCode;
            }
            
            // عرض رسالة للمستخدم
            setTimeout(() => {
                this.showNotification('🎁 لديك كود إحالة! سجل الآن واحصل على 20$', 'success');
            }, 1000);
        }
    }
    
    /**
     * معالجة تحديث البيانات
     */
    handleDataUpdate(type) {
        switch(type) {
            case 'users':
                this.refreshUserData();
                break;
            case 'packages':
                this.refreshPackages();
                break;
            case 'tasks':
                this.refreshTasks();
                break;
            case 'referrals':
                this.loadUserReferralStats();
                this.updateReferralUI();
                break;
        }
    }
    
    /**
     * تحديث بيانات المستخدم
     */
    async refreshUserData() {
        if (!this.user) return;
        
        try {
            let updatedUser = null;
            
            // محاولة التحديث من Supabase
            if (this.supabaseAvailable) {
                try {
                    const result = await window.supabaseHelpers.getUserById(this.user.id);
                    if (result.success && result.data) {
                        updatedUser = result.data;
                    }
                } catch (error) {
                    this.log('⚠️ فشل تحديث المستخدم من Supabase');
                }
            }
            
            // استخدام التخزين المحلي كاحتياطي
            if (!updatedUser) {
                const users = JSON.parse(localStorage.getItem('elite_users')) || [];
                updatedUser = users.find(u => u.id === this.user.id);
            }
            
            if (updatedUser) {
                this.user = updatedUser;
                localStorage.setItem('current_user', JSON.stringify(this.user));
                this.updateUserStats();
                this.updateAuthUI();
                await this.loadUserReferralStats();
            }
        } catch (e) {
            console.error('خطأ في تحديث بيانات المستخدم:', e);
        }
    }
    
    /**
     * تحديث الباقات
     */
    async refreshPackages() {
        if (typeof loadPackages === 'function') {
            await loadPackages();
        }
    }
    
    /**
     * تحديث المهام
     */
    async refreshTasks() {
        await this.loadUserTasks();
    }
    
    /**
     * تحديث واجهة الإحالة
     */
    updateReferralUI() {
        if (!this.user) return;
        
        const referralCode = this.user.referralCode || this.user.referral_code;
        
        const referralCodeDisplay = document.getElementById('userReferralCode');
        if (referralCodeDisplay && referralCode) {
            referralCodeDisplay.textContent = referralCode;
        }
        
        const referralSection = document.getElementById('referralCodeDisplay');
        if (referralSection && referralCode) {
            referralSection.innerHTML = `
                <h3 style="margin-bottom: 15px;">كود الإحالة الخاص بك</h3>
                <div class="referral-code-box">${referralCode}</div>
                <button class="btn btn-primary" onclick="window.app.copyToClipboard('${referralCode}')" style="margin-top: 15px;">
                    <i class="fas fa-copy"></i> نسخ الكود
                </button>
            `;
        }
        
        // تحديث إحصائيات الإحالة
        if (this.user.referralStats) {
            const stats = this.user.referralStats;
            document.getElementById('totalReferrals').textContent = stats.referredCount || 0;
            document.getElementById('activeReferrals').textContent = stats.activeReferrals || 0;
            document.getElementById('pendingReferrals').textContent = stats.pendingReferrals || 0;
        }
    }
    
    /**
     * تهيئة تأثيرات الحركة
     */
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated', 'fade-in-up');
                    
                    if (entry.target.classList.contains('stat-item') ||
                        entry.target.classList.contains('package-card') ||
                        entry.target.classList.contains('task-card')) {
                        entry.target.style.animationDelay = Math.random() * 0.3 + 's';
                    }
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.stat-item, .package-card, .task-card, .page').forEach(el => {
            observer.observe(el);
        });
        
        this.log('🎬 تم تهيئة تأثيرات الحركة');
    }
    
    /**
     * مزامنة البيانات غير المتصلة
     */
    async syncOfflineData() {
        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue')) || [];
        
        if (offlineQueue.length > 0 && this.supabaseAvailable) {
            this.log('🔄 مزامنة ' + offlineQueue.length + ' عملية غير متصلة');
            
            const successfulSyncs = [];
            
            for (let i = 0; i < offlineQueue.length; i++) {
                const item = offlineQueue[i];
                
                try {
                    if (item.type === 'complete_task' && window.supabaseHelpers) {
                        await window.supabaseHelpers.incrementTaskCompletion(item.taskId);
                        successfulSyncs.push(i);
                    } else if (item.type === 'create_withdrawal' && window.supabaseHelpers) {
                        await window.supabaseHelpers.createWithdrawal(item.data);
                        successfulSyncs.push(i);
                    } else if (item.type === 'create_transaction' && window.supabaseHelpers) {
                        await window.supabaseHelpers.createTransaction(item.data);
                        successfulSyncs.push(i);
                    } else if (item.type === 'update_user' && window.supabaseHelpers) {
                        await window.supabaseHelpers.updateUser(item.userId, item.data);
                        successfulSyncs.push(i);
                    }
                } catch (e) {
                    console.error('❌ فشل مزامنة العملية:', e);
                }
            }
            
            const newQueue = offlineQueue.filter((_, index) => !successfulSyncs.includes(index));
            localStorage.setItem('offline_queue', JSON.stringify(newQueue));
            
            if (successfulSyncs.length > 0) {
                this.showNotification(`✅ تمت مزامنة ${successfulSyncs.length} عملية`, 'success');
            }
        }
    }
    
    /**
     * إضافة عملية إلى قائمة الانتظار للمزامنة لاحقاً
     */
    addToOfflineQueue(item) {
        const offlineQueue = JSON.parse(localStorage.getItem('offline_queue')) || [];
        offlineQueue.push({
            ...item,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
        this.log('📦 تمت إضافة العملية إلى قائمة الانتظار');
    }
    
    /**
     * تحديث واجهة المصادقة
     */
    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const dropdownPackage = document.getElementById('dropdownPackage');
        const userStats = document.getElementById('userStats');
        
        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.classList.add('active');
            
            if (userAvatar) {
                userAvatar.textContent = this.user.name?.charAt(0).toUpperCase() || 'م';
            }
            
            if (userName) userName.textContent = this.user.name || 'مستخدم';
            if (userEmail) userEmail.textContent = this.user.email || '';
            if (dropdownName) dropdownName.textContent = this.user.name || 'مستخدم';
            if (dropdownEmail) dropdownEmail.textContent = this.user.email || '';
            
            if (dropdownPackage) {
                if (this.user.package) {
                    dropdownPackage.innerHTML = `<span class="status-badge status-active">${this.user.package.name}</span>`;
                } else {
                    dropdownPackage.innerHTML = `<span style="color: var(--text-muted);">لا توجد باقة</span>`;
                }
            }
            
            if (userStats) userStats.classList.add('active');
            
            this.updateUserStatusUI();
            this.updateReferralUI();
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenu) userMenu.classList.remove('active');
            if (userStats) userStats.classList.remove('active');
        }
    }
    
    /**
     * تحديث واجهة حالة المستخدم
     */
    updateUserStatusUI() {
        if (!this.user) return;
        
        const statusBadge = document.getElementById('userStatusBadge');
        if (!statusBadge) return;
        
        if (this.user.status === 'suspended') {
            statusBadge.className = 'status-badge status-suspended';
            statusBadge.title = 'حساب معلق مؤقتاً';
        } else if (this.user.status === 'banned') {
            statusBadge.className = 'status-badge status-banned';
            statusBadge.title = 'حساب محظور';
        } else {
            statusBadge.className = 'status-badge status-active';
            statusBadge.title = 'حساب نشط';
        }
    }
    
    /**
     * تحديث إحصائيات المستخدم
     */
    updateUserStats() {
        if (!this.user) return;
        
        const balanceEl = document.getElementById('userBalance');
        const earnedEl = document.getElementById('totalEarned');
        const tasksEl = document.getElementById('tasksCompleted');
        const todayProfitEl = document.getElementById('todayProfit');
        const withdrawableEl = document.getElementById('withdrawableBalance');
        const packageDisplay = document.getElementById('userPackageDisplay');
        
        if (balanceEl) balanceEl.textContent = this.formatCurrency(this.user.balance || 0);
        if (earnedEl) earnedEl.textContent = this.formatCurrency(this.user.totalEarned || this.user.total_earned || 0);
        if (tasksEl) tasksEl.textContent = this.user.tasksCompleted || this.user.tasks_completed || 0;
        if (withdrawableEl) withdrawableEl.textContent = this.formatCurrency(this.user.balance || 0);
        
        if (todayProfitEl && this.user.package) {
            const dailyProfit = this.user.package.dailyProfit || 
                this.user.package.daily_profit ||
                (this.user.package.amount * (this.user.package.profit || this.user.package.profit_percentage || 2.5) / 100);
            todayProfitEl.textContent = this.formatCurrency(dailyProfit);
        } else if (todayProfitEl) {
            todayProfitEl.textContent = this.formatCurrency(0);
        }
        
        if (packageDisplay) {
            if (this.user.package) {
                packageDisplay.innerHTML = `<span class="package-badge">✅ ${this.user.package.name}</span>`;
            } else {
                packageDisplay.innerHTML = '';
            }
        }
    }
    
    /**
     * تسجيل الدخول
     */
    async login(username, password) {
        try {
            let user = null;
            
            // محاولة تسجيل الدخول عبر Supabase
            if (this.supabaseAvailable) {
                try {
                    const result = await window.supabaseHelpers.loginUser(username, password);
                    if (result.success) {
                        user = result.data;
                        this.log('✅ تسجيل دخول عبر Supabase');
                    }
                } catch (error) {
                    this.log('⚠️ فشل تسجيل الدخول عبر Supabase: ' + error.message);
                }
            }
            
            // استخدام التخزين المحلي كاحتياطي
            if (!user) {
                const users = JSON.parse(localStorage.getItem('elite_users')) || [];
                user = users.find(u => 
                    (u.username === username || u.email === username) && 
                    u.password === password
                );
                
                if (user) {
                    this.log('✅ تسجيل دخول عبر التخزين المحلي');
                }
            }
            
            if (!user) {
                throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
            
            if (user.status === 'banned') {
                throw new Error('حسابك محظور. يرجى التواصل مع الدعم الفني');
            }
            
            if (user.status === 'suspended') {
                this.showNotification('⚠️ حسابك معلق مؤقتاً', 'warning');
            }
            
            // تحديث آخر تسجيل دخول
            user.last_login = new Date().toISOString();
            if (this.supabaseAvailable) {
                try {
                    await window.supabaseHelpers.updateUser(user.id, { last_login: user.last_login });
                } catch (error) {
                    this.log('⚠️ فشل تحديث آخر تسجيل دخول في Supabase');
                    this.addToOfflineQueue({
                        type: 'update_user',
                        userId: user.id,
                        data: { last_login: user.last_login }
                    });
                }
            }
            
            this.user = user;
            
            localStorage.setItem('current_user', JSON.stringify(user));
            await this.updateUsersList(user);
            
            this.log('✅ تسجيل دخول ناجح: ' + user.email);
            this.updateAuthUI();
            this.updateUserStats();
            await this.loadUserReferralStats();
            
            return { success: true, user };
        } catch (error) {
            this.log('❌ فشل تسجيل الدخول: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * تسجيل مستخدم جديد
     */
    async register(userData) {
        try {
            let newUser = null;
            let referredBy = null;
            
            // التحقق من صحة البيانات
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
            if (userData.referralCode) {
                // محاولة التحقق من الكود في Supabase
                if (this.supabaseAvailable) {
                    try {
                        const { data: users } = await window.supabaseClient
                            .from('users')
                            .select('*')
                            .eq('referral_code', userData.referralCode)
                            .maybeSingle();
                        
                        if (users) {
                            referredBy = userData.referralCode;
                            this.log('✅ تم التحقق من كود الإحالة في Supabase');
                        }
                    } catch (error) {
                        this.log('⚠️ فشل التحقق من كود الإحالة في Supabase');
                    }
                }
                
                // استخدام التخزين المحلي كاحتياطي
                if (!referredBy) {
                    const users = JSON.parse(localStorage.getItem('elite_users')) || [];
                    const referrer = users.find(u => u.referralCode === userData.referralCode || u.referral_code === userData.referralCode);
                    if (referrer) {
                        referredBy = userData.referralCode;
                        this.log('✅ تم التحقق من كود الإحالة في التخزين المحلي');
                    }
                }
            }
            
            // إنشاء كود إحالة للمستخدم الجديد
            const referralCode = this.generateReferralCode(userData.username);
            
            // إعداد بيانات المستخدم الجديد
            const newUserData = {
                name: userData.name,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                referred_by: referredBy,
                referral_code: referralCode,
                balance: 0,
                total_earned: 0,
                tasks_completed: 0,
                package: null,
                pending_package: null,
                wallet_address: '',
                status: 'active',
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString()
            };
            
            // محاولة التسجيل في Supabase
            if (this.supabaseAvailable) {
                try {
                    const result = await window.supabaseHelpers.createUser(newUserData);
                    if (result.success) {
                        newUser = result.data;
                        this.log('✅ تم التسجيل في Supabase');
                    }
                } catch (error) {
                    this.log('⚠️ فشل التسجيل في Supabase: ' + error.message);
                }
            }
            
            // استخدام التخزين المحلي كاحتياطي
            if (!newUser) {
                const users = JSON.parse(localStorage.getItem('elite_users')) || [];
                
                // التحقق من عدم وجود مستخدم بنفس الاسم أو البريد
                if (users.some(u => u.username === userData.username)) {
                    throw new Error('اسم المستخدم موجود مسبقاً');
                }
                
                if (users.some(u => u.email === userData.email)) {
                    throw new Error('البريد الإلكتروني موجود مسبقاً');
                }
                
                newUser = {
                    id: Date.now(),
                    ...newUserData
                };
                
                users.push(newUser);
                localStorage.setItem('elite_users', JSON.stringify(users));
                this.log('✅ تم التسجيل في التخزين المحلي');
            }
            
            this.user = newUser;
            localStorage.setItem('current_user', JSON.stringify(newUser));
            
            this.log('✅ تم إنشاء حساب جديد: ' + newUser.email);
            
            return { 
                success: true, 
                user: newUser,
                hasReferral: !!referredBy 
            };
        } catch (error) {
            this.log('❌ فشل إنشاء الحساب: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * توليد كود إحالة
     */
    generateReferralCode(username) {
        if (!username) username = 'USER';
        const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
    }
    
    /**
     * تسجيل الخروج
     */
    logout(force = false) {
        if (force || confirm('هل تريد تسجيل الخروج؟')) {
            if (this.user) {
                this.user.last_logout = new Date().toISOString();
                this.saveUserData();
                this.log('👋 تسجيل خروج: ' + this.user.email);
            }
            
            this.user = null;
            localStorage.removeItem('current_user');
            this.updateAuthUI();
            
            this.showNotification('✅ تم تسجيل الخروج بنجاح', 'success');
            
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        }
    }
    
    /**
     * حفظ بيانات المستخدم
     */
    async saveUserData() {
        if (!this.user) return false;
        
        try {
            const users = JSON.parse(localStorage.getItem('elite_users')) || [];
            const userIndex = users.findIndex(u => u.id === this.user.id);
            
            if (userIndex !== -1) {
                users[userIndex] = this.user;
            } else {
                users.push(this.user);
            }
            
            localStorage.setItem('elite_users', JSON.stringify(users));
            localStorage.setItem('current_user', JSON.stringify(this.user));
            
            if (this.supabaseAvailable) {
                try {
                    await window.supabaseHelpers.updateUser(this.user.id, this.user);
                } catch (error) {
                    this.log('⚠️ فشل تحديث المستخدم في Supabase');
                    this.addToOfflineQueue({
                        type: 'update_user',
                        userId: this.user.id,
                        data: this.user
                    });
                }
            }
            
            return true;
        } catch (e) {
            console.error('خطأ في حفظ بيانات المستخدم:', e);
            return false;
        }
    }
    
    /**
     * تنسيق العملة
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('US$', '$').replace('USD', '$');
    }
    
    /**
     * تنسيق التاريخ
     */
    formatDate(date, format = 'short') {
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
    
    /**
     * إظهار إشعار
     */
    showNotification(message, type = 'success', duration = 5000) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        notification.innerHTML = `${icon} ${message}`;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }
    
    /**
     * تسجيل الأحداث
     */
    log(message, data = null) {
        if (this.debug) {
            const timestamp = new Date().toLocaleTimeString('ar-SA');
            console.log(`[${timestamp}] ${message}`);
            if (data) console.log(data);
        }
    }
    
    /**
     * التحقق من حالة المستخدم
     */
    checkUserAccess() {
        if (!this.user) return false;
        
        if (this.user.status === 'banned') {
            this.showNotification('❌ حسابك محظور. يرجى التواصل مع الدعم الفني.', 'error');
            return false;
        }
        
        if (this.user.status === 'suspended') {
            this.showNotification('⚠️ حسابك معلق مؤقتاً. بعض الخدمات غير متاحة.', 'warning');
            return true;
        }
        
        return true;
    }
    
    /**
     * نسخ نص إلى الحافظة
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('✅ تم النسخ إلى الحافظة', 'success');
            return true;
        } catch (err) {
            console.error('❌ فشل النسخ:', err);
            
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            this.showNotification('✅ تم النسخ إلى الحافظة', 'success');
            return true;
        }
    }
    
    /**
     * الحصول على حالة الاتصال
     */
    getConnectionStatus() {
        return {
            online: navigator.onLine,
            supabase: this.supabaseAvailable
        };
    }
    
    /**
     * تحديث رصيد المستخدم
     */
    async addBalance(amount, reason = '') {
        if (!this.user || amount <= 0) return false;
        
        this.user.balance = (this.user.balance || 0) + amount;
        this.user.totalEarned = (this.user.totalEarned || 0) + amount;
        
        await this.saveUserData();
        this.updateUserStats();
        
        this.addTransaction({
            type: 'إضافة رصيد',
            amount: amount,
            description: reason || 'إضافة رصيد'
        });
        
        return true;
    }
    
    /**
     * إضافة معاملة
     */
    addTransaction(transaction) {
        if (!this.user) return;
        
        const transactions = JSON.parse(localStorage.getItem(`user_transactions_${this.user.id}`)) || [];
        transactions.unshift({
            id: Date.now(),
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            status: transaction.status || 'مكتمل',
            created_at: new Date().toISOString()
        });
        localStorage.setItem(`user_transactions_${this.user.id}`, JSON.stringify(transactions.slice(0, 200)));
        
        if (this.supabaseAvailable) {
            try {
                window.supabaseHelpers.createTransaction({
                    user_id: this.user.id,
                    type: transaction.type,
                    amount: Math.abs(transaction.amount),
                    description: transaction.description,
                    status: transaction.status || 'completed'
                });
            } catch (error) {
                this.log('⚠️ فشل حفظ المعاملة في Supabase');
                this.addToOfflineQueue({
                    type: 'create_transaction',
                    data: {
                        user_id: this.user.id,
                        type: transaction.type,
                        amount: Math.abs(transaction.amount),
                        description: transaction.description,
                        status: transaction.status || 'completed'
                    }
                });
            }
        }
    }
    
    /**
     * الحصول على معاملات المستخدم
     */
    getTransactions(limit = 50) {
        if (!this.user) return [];
        return JSON.parse(localStorage.getItem(`user_transactions_${this.user.id}`)) || [];
    }
    
    /**
     * طلب سحب
     */
    async requestWithdrawal(amount, wallet, network) {
        if (!this.user) return { success: false, error: 'يجب تسجيل الدخول' };
        
        const fees = { 'TRC20': 5, 'ERC20': 15, 'BEP20': 3 };
        const fee = fees[network] || 5;
        const total = amount + fee;
        
        if (amount < 50) {
            return { success: false, error: 'الحد الأدنى 50$' };
        }
        
        if (amount > (this.user.balance || 0)) {
            return { success: false, error: 'الرصيد غير كافي' };
        }
        
        if (!wallet) {
            return { success: false, error: 'أدخل عنوان المحفظة' };
        }
        
        // خصم الرصيد
        this.user.balance -= total;
        
        const withdrawal = {
            id: Date.now(),
            user_id: this.user.id,
            user_name: this.user.name,
            amount: amount,
            wallet: wallet,
            network: network,
            fee: fee,
            total: total,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // حفظ في Supabase
        if (this.supabaseAvailable) {
            try {
                await window.supabaseHelpers.createWithdrawal(withdrawal);
            } catch (error) {
                this.log('⚠️ فشل حفظ طلب السحب في Supabase');
                this.addToOfflineQueue({
                    type: 'create_withdrawal',
                    data: withdrawal
                });
            }
        }
        
        // حفظ في التخزين المحلي
        const withdrawals = JSON.parse(localStorage.getItem(`user_withdrawals_${this.user.id}`)) || [];
        withdrawals.unshift(withdrawal);
        localStorage.setItem(`user_withdrawals_${this.user.id}`, JSON.stringify(withdrawals));
        
        await this.saveUserData();
        
        this.addTransaction({
            type: 'سحب',
            amount: -total,
            description: `طلب سحب ${amount}$ (${fee}$ رسوم ${network})`
        });
        
        return { success: true, withdrawal };
    }
}

// ========== دوال مساعدة عامة ==========

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function truncateText(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function setWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
        const item = JSON.parse(itemStr);
        const now = new Date();
        
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    } catch {
        return localStorage.getItem(key);
    }
}

function isSupabaseAvailable() {
    return !!(window.supabaseClient && window.supabaseHelpers);
}

// ========== التهيئة عند تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', function() {
    window.app = new InvestmentApp();
    
    // إضافة أنماط CSS إضافية للتأثيرات
    const style = document.createElement('style');
    style.textContent = `
        .animated {
            animation-duration: 0.5s;
            animation-fill-mode: both;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in-up {
            animation-name: fadeInUp;
        }
        
        .toast-notification {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 9999;
            animation: slideUp 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            text-align: center;
            font-weight: 500;
        }
        
        .toast-notification.error {
            background: var(--danger);
        }
        
        .toast-notification.warning {
            background: var(--warning);
        }
        
        .toast-notification.info {
            background: var(--secondary);
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(100%);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-muted);
        }
        
        .empty-state i {
            font-size: 60px;
            margin-bottom: 20px;
            opacity: 0.5;
        }
        
        .task-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            margin-right: 10px;
        }
        
        .task-badge.standard { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .task-badge.premium { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
        .task-badge.vip { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    `;
    document.head.appendChild(style);
    
    // إضافة مؤشر حالة الاتصال إذا لم يكن موجوداً
    if (!document.getElementById('connectionStatus')) {
        const connectionDiv = document.createElement('div');
        connectionDiv.className = 'connection-status online';
        connectionDiv.id = 'connectionStatus';
        connectionDiv.innerHTML = `
            <i class="fas fa-wifi" id="connectionIcon"></i>
            <span id="connectionText">متصل</span>
        `;
        document.body.appendChild(connectionDiv);
    }
    
    // تحديث حالة الاتصال كل 5 ثواني
    setInterval(() => {
        if (window.app) {
            window.app.updateConnectionStatus();
        }
    }, 5000);
});

// تصدير للاستخدام العام
window.InvestmentApp = InvestmentApp;
window.toggleSidebar = toggleSidebar;
window.scrollToSection = scrollToSection;
window.showToast = showToast;
window.truncateText = truncateText;
window.generateId = generateId;
window.setWithExpiry = setWithExpiry;
window.getWithExpiry = getWithExpiry;
window.isSupabaseAvailable = isSupabaseAvailable;