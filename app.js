/**
 * app.js - التطبيق الرئيسي
 * Elite Capital - منصة الاستثمار الذكي
 */

class EliteApp {
    constructor() {
        this.user = null;
        this.version = '1.0.0';
        this.supabaseAvailable = false;
        this.init();
    }
    
    init() {
        console.log('🚀 بدء تشغيل Elite Capital v' + this.version);
        this.checkSupabase();
        this.setupEventListeners();
    }
    
    checkSupabase() {
        this.supabaseAvailable = typeof window !== 'undefined' && 
                                window.supabaseClient && 
                                window.supabaseHelpers;
        
        if (this.supabaseAvailable) {
            console.log('✅ متصل بـ Supabase');
        } else {
            console.log('⚠️ استخدام التخزين المحلي فقط');
        }
        
        return this.supabaseAvailable;
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.showNotification('✅ تم استعادة الاتصال بالإنترنت', 'success');
            this.checkSupabase();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('⚠️ لا يوجد اتصال بالإنترنت', 'warning');
            this.supabaseAvailable = false;
        });
    }
    
    async checkAuth() {
        try {
            const userData = localStorage.getItem('current_user');
            if (userData) {
                this.user = JSON.parse(userData);
                
                if (this.supabaseAvailable) {
                    const result = await window.supabaseHelpers.getUserById(this.user.id);
                    if (result.success && result.data) {
                        this.user = result.data;
                        localStorage.setItem('current_user', JSON.stringify(this.user));
                    }
                }
                
                if (this.user.status === 'banned') {
                    this.logout(true);
                    this.showNotification('❌ حسابك محظور', 'error');
                    return false;
                }
                
                return true;
            }
            return false;
        } catch (e) {
            console.error('خطأ في التحقق من المصادقة:', e);
            return false;
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount).replace('US$', '$');
    }
    
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
        }
        return d.toLocaleDateString('ar-SA');
    }
    
    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        notification.innerHTML = `${icon} ${message}`;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('✅ تم النسخ إلى الحافظة');
            return true;
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showNotification('✅ تم النسخ إلى الحافظة');
            return true;
        }
    }
    
    logout(force = false) {
        if (force || confirm('هل تريد تسجيل الخروج؟')) {
            this.user = null;
            localStorage.removeItem('current_user');
            this.showNotification('✅ تم تسجيل الخروج');
            
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }
    }
}

// تهيئة التطبيق
window.eliteApp = new EliteApp();

// دوال مساعدة عامة
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#f39c12'};
        color: white;
        padding: 12px 25px;
        border-radius: 50px;
        z-index: 9999;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        text-align: center;
        font-weight: 500;
        animation: slideUp 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), duration);
}

// إضافة أنماط CSS للـ toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 100%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
`;
document.head.appendChild(style);