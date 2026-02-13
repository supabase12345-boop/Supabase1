/**
 * Elite Investors - التطبيق الرئيسي
 * نسخة مربوطة بالكامل مع Supabase
 */

class InvestmentApp {
    constructor() {
        this.user = null;
        this.version = '3.0.0';
        this.debug = true;
        this.init();
    }

    async init() {
        this.log('🚀 تشغيل التطبيق v' + this.version);
        await this.checkAuth();
        this.setupEventListeners();
        this.initAnimations();
    }

    /* ================= AUTH ================= */

    async checkAuth() {
        const saved = localStorage.getItem('current_user');
        if (!saved) return;

        const parsed = JSON.parse(saved);

        // جلب أحدث نسخة من Supabase
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsed.id)
            .single();

        if (error || !data) {
            localStorage.removeItem('current_user');
            return;
        }

        this.user = data;
        this.updateAuthUI();
        this.updateUserStats();
    }

    async login(username, password) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${username},email.eq.${username}`)
            .eq('password', password)
            .single();

        if (error || !data) {
            return { success: false, error: 'بيانات الدخول غير صحيحة' };
        }

        this.user = data;
        localStorage.setItem('current_user', JSON.stringify(data));
        this.updateAuthUI();
        this.updateUserStats();

        return { success: true, user: data };
    }

    async register(userData) {
        // التحقق من وجود مستخدم
        const { data: exists } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${userData.username},email.eq.${userData.email}`);

        if (exists.length > 0) {
            return { success: false, error: 'اسم المستخدم أو البريد مستخدم مسبقاً' };
        }

        const newUser = {
            name: userData.name,
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            balance: 0,
            totalearned: 0,
            taskscompleted: 0,
            status: 'active',
            created_at: new Date()
        };

        const { data, error } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        this.user = data;
        localStorage.setItem('current_user', JSON.stringify(data));
        this.updateAuthUI();
        this.updateUserStats();

        return { success: true, user: data };
    }

    async saveUserData() {
        if (!this.user) return;

        await supabase
            .from('users')
            .update(this.user)
            .eq('id', this.user.id);

        localStorage.setItem('current_user', JSON.stringify(this.user));
    }

    logout() {
        this.user = null;
        localStorage.removeItem('current_user');
        location.href = 'index.html';
    }

    /* ================= UI ================= */

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');

        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.classList.add('active');
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenu) userMenu.classList.remove('active');
        }
    }

    updateUserStats() {
        if (!this.user) return;

        const balanceEl = document.getElementById('user-balance');
        const earnedEl = document.getElementById('total-earned');

        if (balanceEl) balanceEl.textContent = this.formatCurrency(this.user.balance || 0);
        if (earnedEl) earnedEl.textContent = this.formatCurrency(this.user.totalearned || 0);
    }

    formatCurrency(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    }

    /* ================= UTIL ================= */

    setupEventListeners() {
        window.addEventListener('beforeunload', () => {
            if (this.user) this.saveUserData();
        });
    }

    initAnimations() {
        console.log('🎬 Animations Ready');
    }

    log(msg) {
        if (this.debug) console.log(msg);
    }
}

/* ====== INIT ====== */

document.addEventListener('DOMContentLoaded', function () {
    window.app = new InvestmentApp();
});