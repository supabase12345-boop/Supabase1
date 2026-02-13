// ===================================
// ملف: app.js
// التطبيق الرئيسي - إصدار Supabase - كامل ومصحح
// ===================================

class InvestmentApp {
    constructor() {
        this.user = null;
        this.version = '2.0.0-supabase';
        this.debug = true;
        this.init();
    }
    
    async init() {
        this.log('🚀 بدء تشغيل التطبيق v' + this.version);
        await this.checkAuth();
        this.setupEventListeners();
        this.initAnimations();
        this.checkUrlReferral();
    }
    
    async checkAuth() {
        try {
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                // التحقق من صحة المستخدم في Supabase
                const user = await window.sharedData.getUserById(userData.id);
                if (user) {
                    this.user = user;
                    if (user.status === 'banned') {
                        this.log('⚠️ مستخدم محظور: ' + user.email);
                        this.showNotification('❌ حسابك محظور. يرجى التواصل مع الدعم الفني.', 'error');
                        await this.logout(true);
                        return;
                    }
                    localStorage.setItem('current_user', JSON.stringify(user));
                    this.log('👤 مستخدم نشط: ' + (user.name || user.email));
                    this.updateAuthUI();
                } else {
                    localStorage.removeItem('current_user');
                }
            }
        } catch (e) {
            console.error('خطأ في التحقق من المصادقة:', e);
        }
    }
    
    setupEventListeners() {
        window.addEventListener('data-updated', (event) => {
            this.log('📡 تحديث: ' + event.detail.type);
            this.handleDataUpdate(event.detail.type);
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.user) {
                localStorage.setItem('current_user', JSON.stringify(this.user));
            }
        });
        
        window.addEventListener('online', () => {
            this.showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('⚠️ لا يوجد اتصال بالإنترنت', 'warning');
        });
    }
    
    async handleDataUpdate(type) {
        switch(type) {
            case 'users':
                await this.refreshUserData();
                break;
            case 'packages':
                if (typeof loadPackages === 'function') loadPackages();
                break;
            case 'tasks':
                if (typeof loadUserTasks === 'function') loadUserTasks();
                break;
            case 'referrals':
                await this.loadUserReferralStats();
                break;
        }
    }
    
    async refreshUserData() {
        if (!this.user) return;
        try {
            const user = await window.sharedData.getUserById(this.user.id);
            if (user) {
                this.user = user;
                localStorage.setItem('current_user', JSON.stringify(user));
                this.updateUserStats();
                this.updateAuthUI();
            }
        } catch (e) {
            console.error('خطأ في تحديث بيانات المستخدم:', e);
        }
    }
    
    async loadUserReferralStats() {
        if (!this.user) return;
        try {
            const stats = await window.sharedData.getReferralStats(this.user.id);
            if (stats) {
                this.user.referralStats = stats;
                if (!this.user.referral_code && stats.referralCode) {
                    this.user.referral_code = stats.referralCode;
                    localStorage.setItem('current_user', JSON.stringify(this.user));
                }
            }
        } catch (e) {
            console.error('خطأ في تحميل إحصائيات الإحالة:', e);
        }
    }
    
    checkUrlReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && !this.user) {
            this.log('📨 كود إحالة في الرابط: ' + refCode);
            sessionStorage.setItem('pending_referral', refCode);
            setTimeout(() => {
                this.showNotification('🎁 لديك كود إحالة! سجل الآن واحصل على 20$', 'success');
            }, 1000);
        }
    }
    
    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated', 'fade-in-up');
                    if (entry.target.classList.contains('stat-card') ||
                        entry.target.classList.contains('package-card') ||
                        entry.target.classList.contains('task-item')) {
                        entry.target.style.animationDelay = Math.random() * 0.3 + 's';
                    }
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.fade-in, .slide-up, .stat-card, .package-card, .task-item, .section').forEach(el => {
            observer.observe(el);
        });
        
        this.log('🎬 تم تهيئة تأثيرات الحركة');
    }
    
    async login(username, password) {
        try {
            const user = await window.sharedData.loginUser(username, password);
            this.user = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            this.updateAuthUI();
            this.updateUserStats();
            this.log('✅ تسجيل دخول ناجح: ' + user.email);
            return { success: true, user };
        } catch (error) {
            this.log('❌ فشل تسجيل الدخول: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    async register(userData) {
        try {
            const pendingReferral = sessionStorage.getItem('pending_referral');
            if (pendingReferral && !userData.referralCode) {
                userData.referralCode = pendingReferral;
                sessionStorage.removeItem('pending_referral');
            }
            
            const user = await window.sharedData.registerUser(userData);
            this.user = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            this.updateAuthUI();
            this.log('✅ تم إنشاء حساب جديد: ' + user.email);
            
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
    
    async logout(force = false) {
        if (force || confirm('هل تريد تسجيل الخروج؟')) {
            if (this.user) {
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
    
    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const dropdownPackage = document.getElementById('dropdownPackage');
        
        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.classList.add('active');
            if (userAvatar) userAvatar.textContent = this.user.name?.charAt(0).toUpperCase() || 'م';
            if (userName) userName.textContent = this.user.name || 'مستخدم';
            if (userEmail) userEmail.textContent = this.user.email || '';
            if (dropdownName) dropdownName.textContent = this.user.name || 'مستخدم';
            if (dropdownEmail) dropdownEmail.textContent = this.user.email || '';
            
            if (dropdownPackage) {
                if (this.user.package) {
                    dropdownPackage.innerHTML = `<span class="badge" style="background: var(--primary);">${this.user.package.name}</span>`;
                } else {
                    dropdownPackage.innerHTML = `<span style="color: #94a3b8;">لا توجد باقة</span>`;
                }
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenu) userMenu.classList.remove('active');
        }
    }
    
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
        
        if (todayProfitEl && this.user.package) {
            const dailyProfit = this.user.package.dailyProfit || 
                (this.user.package.amount * 0.025);
            todayProfitEl.textContent = this.formatCurrency(dailyProfit);
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount).replace('US$', '$').replace('USD', '$');
    }
    
    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') return d.toLocaleDateString('ar-SA');
        if (format === 'long') return d.toLocaleDateString('ar-SA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        return d.toLocaleString('ar-SA');
    }
    
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
    
    log(message, data = null) {
        if (this.debug) {
            const timestamp = new Date().toLocaleTimeString('ar-SA');
            console.log(`[${timestamp}] ${message}`);
            if (data) console.log(data);
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('✅ تم النسخ إلى الحافظة', 'success');
            return true;
        } catch (err) {
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
}

// ========== دوال مساعدة عامة ==========

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

function truncateText(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// ========== إضافة الأنماط ==========
const style = document.createElement('style');
style.textContent = `
    .animated { animation-duration: 0.5s; animation-fill-mode: both; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up { animation-name: fadeInUp; }
    .toast-notification {
        position: fixed; bottom: 20px; left: 20px; right: 20px;
        background: var(--success); color: white; padding: 15px 20px;
        border-radius: 10px; z-index: 9999; animation: slideUp 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3); text-align: center;
        font-weight: 500;
    }
    .toast-notification.error { background: var(--danger); }
    .toast-notification.warning { background: var(--warning); }
    .toast-notification.info { background: var(--secondary); }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(100%); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// ========== التهيئة ==========
document.addEventListener('DOMContentLoaded', function() {
    window.app = new InvestmentApp();
});

// ========== التصدير ==========
window.InvestmentApp = InvestmentApp;
window.toggleSidebar = toggleSidebar;
window.scrollToSection = scrollToSection;
window.showToast = showToast;
window.truncateText = truncateText;