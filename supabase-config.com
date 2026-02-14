// ========== إعدادات Supabase ==========
const SUPABASE_URL = "https://tmksysprwgsbdmavlshm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80";

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// تخزين الكائنات في window للوصول إليها من جميع الملفات
window.supabase = supabase;

// دوال المساعدة الشائعة
window.supabaseHelpers = {
    // المستخدمين
    async getAllUsers() {
        return await supabase.from('users').select('*');
    },
    
    async getUserById(id) {
        return await supabase.from('users').select('*').eq('id', id).single();
    },
    
    async createUser(user) {
        return await supabase.from('users').insert([user]);
    },
    
    async updateUser(id, updates) {
        return await supabase.from('users').update(updates).eq('id', id);
    },
    
    // الباقات
    async getAllPackages() {
        return await supabase.from('packages').select('*').eq('status', 'active');
    },
    
    async getPackageById(id) {
        return await supabase.from('packages').select('*').eq('id', id).single();
    },
    
    async createPackage(pkg) {
        return await supabase.from('packages').insert([pkg]);
    },
    
    // المهام
    async getAllTasks() {
        return await supabase.from('tasks').select('*').eq('status', 'active');
    },
    
    async getTasksByCategory(category) {
        return await supabase.from('tasks').select('*').contains('package_categories', [category]);
    },
    
    // الطلبات المعلقة
    async getPendingPackages() {
        return await supabase.from('pending_packages').select('*').eq('status', 'pending');
    },
    
    // طلبات السحب
    async getWithdrawals() {
        return await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    },
    
    // المعاملات
    async getTransactions(userId) {
        return await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    }
};

console.log('✅ Supabase initialized with helpers');
