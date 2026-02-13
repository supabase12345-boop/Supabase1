/**
 * Elite Investors - التطبيق الرئيسي
 * نسخة متطورة مع دعم Supabase ونظام الإحالة (50$ + 20$)
 */

class InvestmentApp {
    constructor() {
        this.user = null;
        this.version = '2.0.0-supabase';
        this.debug = true;
        this.init();
    }
    
    /**
     * تهيئة التطبيق
     */
    async init() {
        this.log('🚀 بدء تشغيل التطبيق v' + this.version);
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadUserData();
        this.initAnimations();
        this.checkUrlReferral();
    }
    
    /**
     * التحقق من صلاحية المستخدم
     */
    async checkAuth() {
        try {
            const userData = localStorage.getItem('current_user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                
                // التحقق من صحة المستخدم في Supabase
                const user = await window.sharedData.getUserById(parsedUser.id);
                
                if (user) {
                    this.user = user;
                    
                    // التحقق من حالة المستخدم
                    if (this.user.status === 'banned') {
                        this.log('⚠️ مستخدم محظور: ' + this.user.email);
                        this.showNotification('❌ حسابك محظور. يرجى التواصل مع الدعم الفني.', 'error');
                        await this.logout(true);
                        return;
                    }
                    
                    this.log('👤 مستخدم نشط: ' + (this.user.name || this.user.email));
                    this.updateAuthUI();
                } else {
                    localStorage.removeItem('current_user');
                }
            }
        } catch (e) {
            console.error('خطأ في التحقق من المصادقة:', e);
            localStorage.removeItem('current_user');
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
                localStorage.setItem('current_user', JSON.stringify(this.user));
            }
        });
        
        // مستمع لتغيير حالة الاتصال
        window.addEventListener('online', () => {
            this.showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('⚠️ لا يوجد اتصال بالإنترنت', 'warning');
        });
    }
    
    /**
     * تحميل بيانات المستخدم
     */
    async loadUserData() {
        if (this.user) {
            this.updateUserStats();
            await this.loadUserReferralStats();
        }
    }
    
    /**
     * تحميل إحصائيات الإحالة للمستخدم
     */
    async loadUserReferralStats() {
        if (!this.user) return;
        
        try {
            const stats = await window.sharedData.getReferralStats(this.user.id);
            if (stats) {
                this.user.referralStats = stats;
                
                // تحديث كود الإحالة إذا كان موجوداً
                if (stats.referralCode && (!this.user.referral_code || this.user.referral_code !== stats.referralCode)) {
                    this.user.referral_code = stats.referralCode;
                    localStorage.setItem('current_user', JSON.stringify(this.user));
                }
            }
        } catch (e) {
            console.error('خطأ في تحميل إحصائيات الإحالة:', e);
        }
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
            
            // عرض رسالة للمستخدم
            setTimeout(() => {
                this.showNotification('🎁 لديك كود إحالة! سجل الآن واحصل على 20$', 'success');
            }, 1000);
        }
    }
    
    /**
     * معالجة تحديث البيانات
     */
    async handleDataUpdate(type) {
        switch(type) {
            case 'users':
                await this.refreshUserData();
                break;
            case 'packages':
                this.refreshPackages();
                break;
            case 'tasks':
                this.refreshTasks();
                break;
            case 'referrals':
                await this.loadUserReferralStats();
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
            const user = await window.sharedData.getUserById(this.user.id);
            if (user) {
                this.user = user;
                localStorage.setItem('current_user', JSON.stringify(this.user));
                this.updateUserStats();
                this.updateAuthUI();
            }
        } catch (e) {
            console.error('خطأ في تحديث بيانات المستخدم:', e);
        }
    }
    
    /**
     * تحديث الباقات
     */
    refreshPackages() {
        // يمكن تخصيص هذه الدالة حسب الصفحة
        if (typeof loadPackages === 'function') {
            loadPackages();
        }
    }
    
    /**
     * تحديث المهام
     */
    refreshTasks() {
        // يمكن تخصيص هذه الدالة حسب الصفحة
        if (typeof loadUserTasks === 'function') {
            loadUserTasks();
        }
    }
    
    /**
     * تحديث واجهة الإحالة
     */
    updateReferralUI() {
        // يمكن تخصيص هذه الدالة حسب الصفحة
        const referralElements = document.querySelectorAll('[data-referral]');
        if (referralElements.length > 0 && this.user?.referral_code) {
            referralElements.forEach(el => {
                if (el.tagName === 'INPUT') {
                    el.value = this.user.referral_code;
                } else {
                    el.textContent = this.user.referral_code;
                }
            });
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
                    
                    // إضافة تأثير متدرج للعناصر
                    if (entry.target.classList.contains('stat-card') ||
                        entry.target.classList.contains('package-card') ||
                        entry.target.classList.contains('task-item')) {
                        entry.target.style.animationDelay = Math.random() * 0.3 + 's';
                    }
                }
            });
        }, observerOptions);
        
        // مراقبة العناصر القابلة للحركة
        document.querySelectorAll('.fade-in, .slide-up, .stat-card, .package-card, .task-item, .section').forEach(el => {
            observer.observe(el);
        });
        
        this.log('🎬 تم تهيئة تأثيرات الحركة');
    }
    
    /**
     * تحديث واجهة المصادقة
     */
    updateAuthUI() {
        // تحديث أزرار تسجيل الدخول وقائمة المستخدم
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const dropdownPackage = document.getElementById('dropdownPackage');
        const userBalance = document.getElementById('user-balance');
        const userReferralCode = document.getElementById('userReferralCode');
        
        if (this.user) {
            // إخفاء زر تسجيل الدخول وإظهار قائمة المستخدم
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.classList.add('active');
            
            // تحديث الصورة الرمزية
            if (userAvatar) {
                userAvatar.textContent = this.user.name?.charAt(0).toUpperCase() || 'م';
            }
            
            // تحديث أسماء المستخدم
            if (userName) userName.textContent = this.user.name || 'مستخدم';
            if (userEmail) userEmail.textContent = this.user.email || '';
            if (dropdownName) dropdownName.textContent = this.user.name || 'مستخدم';
            if (dropdownEmail) dropdownEmail.textContent = this.user.email || '';
            
            // تحديث الرصيد
            if (userBalance) {
                userBalance.textContent = this.formatCurrency(this.user.balance || 0);
            }
            
            // تحديث معلومات الباقة في القائمة
            if (dropdownPackage) {
                if (this.user.package) {
                    dropdownPackage.innerHTML = `<span class="badge" style="background: var(--primary);">${this.user.package.name}</span>`;
                } else {
                    dropdownPackage.innerHTML = `<span style="color: #94a3b8;">لا توجد باقة</span>`;
                }
            }
            
            // تحديث كود الإحالة
            if (userReferralCode && this.user.referral_code) {
                if (userReferralCode.tagName === 'INPUT') {
                    userReferralCode.value = this.user.referral_code;
                } else {
                    userReferralCode.textContent = this.user.referral_code;
                }
            }
            
            // تحديث حالة المستخدم
            this.updateUserStatusUI();
        } else {
            // إظهار زر تسجيل الدخول وإخفاء قائمة المستخدم
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenu) userMenu.classList.remove('active');
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
            statusBadge.className = 'user-status suspended';
            statusBadge.title = 'حساب معلق مؤقتاً';
        } else if (this.user.status === 'banned') {
            statusBadge.className = 'user-status banned';
            statusBadge.title = 'حساب محظور';
        } else {
            statusBadge.className = 'user-status';
            statusBadge.title = 'حساب نشط';
        }
    }
    
    /**
     * تحديث إحصائيات المستخدم
     */
    updateUserStats() {
        if (!this.user) return;
        
        const balanceEl = document.getElementById('balance');
        const earnedEl = document.getElementById('total-earned');
        const tasksEl = document.getElementById('tasks-completed');
        const todayProfitEl = document.getElementById('today-profit');
        const withdrawableEl = document.getElementById('withdrawable-balance');
        
        if (balanceEl) balanceEl.textContent = this.formatCurrency(this.user.balance || 0);
        if (earnedEl) earnedEl.textContent = this.formatCurrency(this.user.total_earned || 0);
        if (tasksEl) tasksEl.textContent = this.user.tasks_completed || 0;
        if (withdrawableEl) withdrawableEl.textContent = this.formatCurrency(this.user.balance || 0);
        
        // حساب أرباح اليوم
        if (todayProfitEl && this.user.package) {
            const dailyProfit = this.user.package.dailyProfit || 
                (this.user.package.amount * (this.user.package.profit || 2.5) / 100);
            todayProfitEl.textContent = this.formatCurrency(dailyProfit);
        }
    }
    
    /**
     * تسجيل الدخول
     */
    async login(username, password) {
        try {
            const user = await window.sharedData.loginUser(username, password);
            
            this.user = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            
            this.log('✅ تسجيل دخول ناجح: ' + user.email);
            this.updateAuthUI();
            this.updateUserStats();
            
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
            // التحقق من وجود كود إحالة مخزن
            const pendingReferral = sessionStorage.getItem('pending_referral');
            if (pendingReferral && !userData.referralCode) {
                userData.referralCode = pendingReferral;
            }
            
            const user = await window.sharedData.registerUser(userData);
            
            this.user = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            
            this.log('✅ تم إنشاء حساب جديد: ' + user.email);
            this.updateAuthUI();
            
            // إزالة الكود المخزن بعد الاستخدام
            if (pendingReferral) {
                sessionStorage.removeItem('pending_referral');
            }
            
            return { 
                success: true, 
                user,
                hasReferral: !!user.referred_by 
            };
        } catch (error) {
            this.log('❌ فشل إنشاء الحساب: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * تسجيل الخروج
     */
    async logout(force = false) {
        if (force || confirm('هل تريد تسجيل الخروج؟')) {
            if (this.user) {
                this.log('👋 تسجيل خروج: ' + this.user.email);
            }
            
            this.user = null;
            localStorage.removeItem('current_user');
            this.updateAuthUI();
            
            this.showNotification('✅ تم تسجيل الخروج بنجاح', 'success');
            
            // إعادة التوجيه إلى الصفحة الرئيسية
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
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
            
            // طريقة بديلة
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
     * الحصول على رابط الإحالة
     */
    getReferralLink() {
        if (!this.user?.referral_code) return null;
        return window.location.origin + '/index.html?ref=' + this.user.referral_code;
    }
}

// ========== دوال مساعدة عامة ==========

/**
 * تبديل عرض الشريط الجانبي
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * التمرير إلى قسم معين
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * إظهار إشعار سريع
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * تصغير النص الطويل
 */
function truncateText(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * توليد معرف فريد (للاستخدام المحلي فقط)
 */
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

/**
 * حفظ البيانات في التخزين المحلي مع انتهاء الصلاحية
 */
function setWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * قراءة البيانات مع انتهاء الصلاحية
 */
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

/**
 * تهيئة التطبيق عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', function() {
    // إنشاء كائن التطبيق العام
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
        
        .user-status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-left: 5px;
        }
        
        .user-status.suspended {
            background: var(--warning);
            box-shadow: 0 0 5px var(--warning);
        }
        
        .user-status.banned {
            background: var(--danger);
            box-shadow: 0 0 5px var(--danger);
        }
        
        .user-status.active {
            background: var(--success);
            box-shadow: 0 0 5px var(--success);
        }
    `;
    document.head.appendChild(style);
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