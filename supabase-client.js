// ===================================
// اتصال Supabase - Elite Investors
// ===================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// إعدادات Supabase - غيرها ببيانات مشروعك
const SUPABASE_URL = 'https://ghwkiwyschtsdwkorocx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod2tpd3lzY2h0c2R3a29yb2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODk0OTIsImV4cCI6MjA4NjQ2NTQ5Mn0.7CGzpnQTnXKi5nr-FOWfObci9G8vEHTGfnQV8kQ1Wc0'

// إنشاء كائن الاتصال
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ========== دوال المستخدمين ==========
class SupabaseAPI {
  // ----- المستخدمين -----
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async getUserByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle()
    
    if (error) throw error
    return data
  }

  async createUser(userData) {
    // إنشاء كود إحالة
    const referralCode = this.generateReferralCode(userData.username)
    
    const newUser = {
      id: Date.now(),
      name: userData.name,
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      referred_by: userData.referralCode || null,
      referral_code: referralCode,
      balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      referral_earnings: 0,
      referral_count: 0,
      referral_reward_paid: false,
      package: null,
      pending_package: null,
      wallet_address: '',
      wallet_network: 'TRC20',
      tasks_completed: 0,
      joined_date: new Date().toISOString(),
      last_login: new Date().toISOString(),
      is_admin: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateUser(id, updates) {
    updates.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateUserStatus(userId, status, reason = '') {
    const { data, error } = await supabase
      .from('users')
      .update({
        status: status,
        status_reason: reason,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    // تسجيل في سجل النظام
    await this.addSystemLog({
      action: 'تغيير حالة المستخدم',
      user_id: userId,
      new_status: status,
      reason: reason,
      date: new Date().toISOString()
    })
    
    return data
  }

  async addUserBalance(userId, amount, reason = 'إضافة رصيد') {
    // جلب المستخدم أولاً
    const user = await this.getUserById(userId)
    const newBalance = (user.balance || 0) + amount
    
    // تحديث الرصيد
    const { data, error } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    // إضافة معاملة
    await this.addTransaction({
      user_id: userId,
      type: 'إضافة رصيد',
      amount: amount,
      description: reason,
      date: new Date().toLocaleString('ar-SA'),
      admin: true
    })
    
    return data
  }

  // ----- الباقات -----
  async getPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('status', 'active')
      .order('price', { ascending: true })
    
    if (error) throw error
    return data
  }

  async getPackageById(id) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async addPackage(packageData) {
    const dailyProfit = (packageData.price * (packageData.profit || 2.5) / 100).toFixed(2)
    
    const newPackage = {
      id: Date.now(),
      name: packageData.name,
      price: parseFloat(packageData.price),
      profit: parseFloat(packageData.profit || 2.5),
      daily_profit: parseFloat(dailyProfit),
      tasks: parseInt(packageData.tasks || 5),
      duration: parseInt(packageData.duration || 30),
      status: 'active',
      category: packageData.category || 'standard',
      description: packageData.description || '',
      users_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('packages')
      .insert([newPackage])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deletePackage(packageId) {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId)
    
    if (error) throw error
    return true
  }

  // ----- المهام -----
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: true })
    
    if (error) throw error
    return data
  }

  async getUserTasks(userId, userPackage) {
    if (!userPackage) return []
    
    const allTasks = await this.getTasks()
    const userCategory = userPackage.category
    
    return allTasks.filter(task => 
      task.package_categories && task.package_categories.includes(userCategory)
    )
  }

  async addTask(taskData) {
    const newTask = {
      id: Date.now(),
      title: taskData.title,
      description: taskData.description,
      reward: parseFloat(taskData.reward),
      type: taskData.type || 'daily',
      status: 'active',
      completions: 0,
      available_for: taskData.availableFor || 'all',
      package_categories: taskData.packageCategories,
      difficulty: taskData.difficulty || 'easy',
      time_required: parseInt(taskData.timeRequired || 2),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) throw error
    return true
  }

  async completeTask(userId, taskId, reward) {
    const today = new Date().toISOString().split('T')[0]
    
    // التحقق من عدم إكمال المهمة اليوم
    const { data: existing } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('completed_date', today)
      .maybeSingle()
    
    if (existing) {
      throw new Error('لقد أكملت هذه المهمة اليوم بالفعل')
    }
    
    // إضافة إكمال المهمة
    const { error: completionError } = await supabase
      .from('task_completions')
      .insert([{
        id: Date.now(),
        user_id: userId,
        task_id: taskId,
        completed_date: today,
        reward: reward,
        created_at: new Date().toISOString()
      }])
    
    if (completionError) throw completionError
    
    // زيادة عدد الإكمالات في المهمة
    const task = await this.getTaskById(taskId)
    await supabase
      .from('tasks')
      .update({ 
        completions: (task.completions || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
    
    // تحديث رصيد المستخدم
    const user = await this.getUserById(userId)
    await this.updateUser(userId, {
      balance: (user.balance || 0) + reward,
      total_earned: (user.total_earned || 0) + reward,
      tasks_completed: (user.tasks_completed || 0) + 1
    })
    
    // إضافة معاملة
    await this.addTransaction({
      user_id: userId,
      type: 'ربح',
      amount: reward,
      description: `إكمال مهمة: ${task.title}`,
      date: new Date().toLocaleString('ar-SA')
    })
    
    return true
  }

  async getTaskById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // ----- نظام الإحالة -----
  generateReferralCode(username) {
    if (!username) username = 'USER'
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5)
    const random = Math.random().toString(36).substring(2, 7).toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12)
  }

  async getReferralStats(userId) {
    const user = await this.getUserById(userId)
    
    if (!user) return null
    
    // إنشاء كود إحالة إذا لم يكن موجوداً
    if (!user.referral_code) {
      const referralCode = this.generateReferralCode(user.username)
      await this.updateUser(userId, { referral_code: referralCode })
      user.referral_code = referralCode
    }
    
    // جلب المحالين
    const { data: referredUsers } = await supabase
      .from('users')
      .select('*')
      .eq('referred_by', user.referral_code)
    
    const activeReferrals = referredUsers?.filter(u => u.package?.status === 'نشط') || []
    const pendingReferrals = referredUsers?.filter(u => u.pending_package && !u.package) || []
    const paidReferrals = referredUsers?.filter(u => u.referral_reward_paid === true) || []
    
    // حساب العمولات المعلقة
    let pendingCommission = 0
    referredUsers?.forEach(u => {
      if (u.package && u.package.amount && !u.referral_reward_paid) {
        const settings = await this.getSettings()
        pendingCommission += settings.referrer_reward
      }
    })
    
    return {
      referralCode: user.referral_code,
      referredCount: referredUsers?.length || 0,
      activeReferrals: activeReferrals.length,
      pendingReferrals: pendingReferrals.length,
      paidReferrals: paidReferrals.length,
      totalEarned: user.referral_earnings || 0,
      pendingCommission: pendingCommission,
      conversionRate: referredUsers?.length > 0 
        ? ((activeReferrals.length / referredUsers.length) * 100).toFixed(1) 
        : 0,
      referredUsers: referredUsers?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        joinedDate: u.joined_date,
        hasPackage: !!u.package,
        packageName: u.package?.name || 'لا يوجد',
        packageAmount: u.package?.amount || 0,
        rewardPaid: u.referral_reward_paid || false
      })) || []
    }
  }

  async processReferralRewards(userId) {
    const user = await this.getUserById(userId)
    
    if (!user || !user.referred_by) {
      throw new Error('لا يوجد كود إحالة')
    }
    
    const settings = await this.getSettings()
    
    // جلب صاحب الكود
    const { data: referrer } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', user.referred_by)
      .single()
    
    if (!referrer) {
      throw new Error('لم يتم العثور على صاحب الكود')
    }
    
    if (user.referral_reward_paid) {
      throw new Error('تم صرف المكافأة مسبقاً')
    }
    
    // صرف مكافأة المحال
    await this.updateUser(userId, {
      balance: (user.balance || 0) + settings.referee_reward,
      referral_reward_paid: true,
      updated_at: new Date().toISOString()
    })
    
    // صرف مكافأة المحيل
    await this.updateUser(referrer.id, {
      balance: (referrer.balance || 0) + settings.referrer_reward,
      referral_earnings: (referrer.referral_earnings || 0) + settings.referrer_reward,
      referral_count: (referrer.referral_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    
    // إضافة معاملات
    await this.addTransaction({
      user_id: userId,
      type: 'مكافأة إحالة',
      amount: settings.referee_reward,
      description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
      date: new Date().toLocaleString('ar-SA'),
      referral_code: user.referred_by,
      referrer_name: referrer.name
    })
    
    await this.addTransaction({
      user_id: referrer.id,
      type: 'مكافأة إحالة',
      amount: settings.referrer_reward,
      description: `💰 مكافأة إحالة: ${user.name}`,
      date: new Date().toLocaleString('ar-SA'),
      referred_user_id: userId,
      referred_user_name: user.name
    })
    
    return {
      referrer: { id: referrer.id, name: referrer.name, reward: settings.referrer_reward },
      referee: { id: userId, name: user.name, reward: settings.referee_reward }
    }
  }

  // ----- الطلبات المعلقة -----
  async getPendingPackages() {
    const { data, error } = await supabase
      .from('pending_packages')
      .select('*')
      .eq('status', 'بانتظار المراجعة')
      .order('requested_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  async addPendingPackage(pendingData) {
    const newPending = {
      id: Date.now(),
      ...pendingData,
      requested_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('pending_packages')
      .insert([newPending])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async approvePendingPackage(pendingId, adminId) {
    // جلب الطلب
    const { data: pending } = await supabase
      .from('pending_packages')
      .select('*')
      .eq('id', pendingId)
      .single()
    
    if (!pending) throw new Error('الطلب غير موجود')
    
    // تحديث حالة الطلب
    await supabase
      .from('pending_packages')
      .update({
        status: 'مقبول',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingId)
    
    // جلب الباقة
    const pkg = await this.getPackageById(pending.package_id)
    
    // تحديث المستخدم
    const user = await this.getUserById(pending.user_id)
    
    await this.updateUser(pending.user_id, {
      package: {
        id: pkg.id,
        name: pkg.name,
        amount: pending.amount,
        price: pkg.price,
        profit: pkg.profit,
        daily_profit: (pending.amount * (pkg.profit || 2.5) / 100),
        category: pkg.category,
        purchase_date: new Date().toISOString(),
        duration: pkg.duration || 30,
        status: 'نشط'
      },
      pending_package: null,
      updated_at: new Date().toISOString()
    })
    
    // معالجة مكافأة الإحالة
    if (user.referred_by) {
      try {
        await this.processReferralRewards(user.id)
      } catch (e) {
        console.log('خطأ في صرف مكافأة الإحالة:', e.message)
      }
    }
    
    // إضافة معاملة
    await this.addTransaction({
      user_id: pending.user_id,
      type: 'اشتراك',
      amount: pending.amount,
      description: `تفعيل باقة ${pending.package_name}`,
      date: new Date().toLocaleString('ar-SA'),
      status: 'مكتمل'
    })
    
    return true
  }

  async rejectPendingPackage(pendingId, adminId, notes = '') {
    const { error } = await supabase
      .from('pending_packages')
      .update({
        status: 'مرفوض',
        notes: notes,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingId)
    
    if (error) throw error
    
    // تحديث المستخدم
    const pending = await supabase
      .from('pending_packages')
      .select('user_id')
      .eq('id', pendingId)
      .single()
    
    if (pending.data) {
      await this.updateUser(pending.data.user_id, {
        pending_package: null,
        updated_at: new Date().toISOString()
      })
    }
    
    return true
  }

  // ----- طلبات السحب -----
  async getWithdrawals(filters = {}) {
    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data.map(w => ({
      ...w,
      userName: w.users?.name,
      userEmail: w.users?.email
    }))
  }

  async addWithdrawal(userId, withdrawalData) {
    const settings = await this.getSettings()
    const fee = settings.withdrawal_fees[withdrawalData.network] || 5
    const total = withdrawalData.amount + fee
    
    // التحقق من الرصيد
    const user = await this.getUserById(userId)
    if ((user.balance || 0) < total) {
      throw new Error('الرصيد غير كافي')
    }
    
    // خصم الرصيد
    await this.updateUser(userId, {
      balance: (user.balance || 0) - total,
      total_withdrawn: (user.total_withdrawn || 0) + withdrawalData.amount,
      updated_at: new Date().toISOString()
    })
    
    // إنشاء طلب السحب
    const newWithdrawal = {
      id: Date.now(),
      user_id: userId,
      amount: withdrawalData.amount,
      wallet: withdrawalData.wallet,
      network: withdrawalData.network,
      fee: fee,
      total: total,
      status: 'معلق',
      date: new Date().toLocaleString('ar-SA'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([newWithdrawal])
      .select()
      .single()
    
    if (error) throw error
    
    // إضافة معاملة
    await this.addTransaction({
      user_id: userId,
      type: 'سحب',
      amount: -total,
      description: `طلب سحب ${withdrawalData.amount}$ (${fee}$ رسوم ${withdrawalData.network})`,
      date: new Date().toLocaleString('ar-SA'),
      status: 'معلق'
    })
    
    return data
  }

  async approveWithdrawal(withdrawalId, adminId, txHash) {
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()
    
    if (!withdrawal) throw new Error('الطلب غير موجود')
    
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'مكتمل',
        tx_hash: txHash,
        processed_by: adminId,
        processed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
    
    if (error) throw error
    
    // تحديث معاملة المستخدم
    await supabase
      .from('transactions')
      .update({ status: 'مكتمل' })
      .eq('user_id', withdrawal.user_id)
      .eq('type', 'سحب')
      .eq('amount', -withdrawal.total)
      .order('created_at', { ascending: false })
      .limit(1)
    
    return true
  }

  async rejectWithdrawal(withdrawalId, adminId, notes = '') {
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()
    
    if (!withdrawal) throw new Error('الطلب غير موجود')
    
    // تحديث حالة الطلب
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'مرفوض',
        processor_notes: notes,
        processed_by: adminId,
        processed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
    
    if (error) throw error
    
    // إعادة الرصيد للمستخدم
    const user = await this.getUserById(withdrawal.user_id)
    await this.updateUser(withdrawal.user_id, {
      balance: (user.balance || 0) + withdrawal.total,
      updated_at: new Date().toISOString()
    })
    
    // إضافة معاملة
    await this.addTransaction({
      user_id: withdrawal.user_id,
      type: 'إلغاء سحب',
      amount: withdrawal.total,
      description: `تم إلغاء طلب السحب رقم #${withdrawal.id} وإعادة المبلغ للرصيد`,
      date: new Date().toLocaleString('ar-SA'),
      notes: notes
    })
    
    return true
  }

  // ----- المعاملات -----
  async getTransactions(userId = null, limit = 100) {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }

  async addTransaction(transactionData) {
    const newTransaction = {
      id: Date.now() + Math.random(),
      ...transactionData,
      created_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([newTransaction])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // ----- الإعدادات -----
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (error) {
      // إنشاء الإعدادات الافتراضية إذا لم تكن موجودة
      const defaultSettings = {
        id: 1,
        referrer_reward: 50,
        referee_reward: 20,
        min_withdrawal: 50,
        withdrawal_fees: { TRC20: 5, ERC20: 15, BEP20: 3 },
        referral_active: true,
        site_name: 'Elite Investors',
        updated_at: new Date().toISOString()
      }
      
      const { data: newData, error: insertError } = await supabase
        .from('settings')
        .insert([defaultSettings])
        .select()
        .single()
      
      if (insertError) throw insertError
      return newData
    }
    
    return data
  }

  async updateSettings(updates) {
    updates.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // ----- الإحصائيات -----
  async getDashboardStats() {
    const [
      users,
      pendingPackages,
      withdrawals,
      tasks,
      packages
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('pending_packages').select('*').eq('status', 'بانتظار المراجعة'),
      supabase.from('withdrawals').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('packages').select('*')
    ])
    
    const today = new Date().toISOString().split('T')[0]
    
    let totalDeposits = 0
    let totalWithdrawals = 0
    let totalProfits = 0
    let activeSubscriptions = 0
    let pendingWithdrawals = 0
    let totalReferralEarnings = 0
    let totalReferrals = 0
    let suspendedUsers = 0
    let bannedUsers = 0
    let activeUsers = 0
    let todayDeposits = 0
    
    users.data?.forEach(user => {
      if (user.package && user.package.status === 'نشط') {
        totalDeposits += user.package.amount || 0
        activeSubscriptions++
        
        if (user.package.purchase_date?.split('T')[0] === today) {
          todayDeposits += user.package.amount || 0
        }
      }
      totalProfits += user.total_earned || 0
      totalReferralEarnings += user.referral_earnings || 0
      totalReferrals += user.referral_count || 0
      
      if (user.status === 'active' || !user.status) activeUsers++
      if (user.status === 'suspended') suspendedUsers++
      if (user.status === 'banned') bannedUsers++
    })
    
    withdrawals.data?.forEach(w => {
      if (w.status === 'مكتمل') {
        totalWithdrawals += w.amount
      }
      if (w.status === 'معلق') {
        pendingWithdrawals++
      }
    })
    
    const totalCompletions = tasks.data?.reduce((sum, task) => sum + (task.completions || 0), 0) || 0
    
    return {
      totalUsers: users.data?.length || 0,
      activeUsers: activeUsers,
      suspendedUsers: suspendedUsers,
      bannedUsers: bannedUsers,
      totalDeposits: totalDeposits,
      totalWithdrawals: totalWithdrawals,
      totalProfits: totalProfits,
      activeSubscriptions: activeSubscriptions,
      pendingPackages: pendingPackages.data?.length || 0,
      pendingWithdrawals: pendingWithdrawals,
      totalTasks: tasks.data?.length || 0,
      totalCompletions: totalCompletions,
      totalReferralEarnings: totalReferralEarnings,
      totalReferrals: totalReferrals,
      todayDeposits: todayDeposits,
      packagesCount: packages.data?.length || 0
    }
  }

  // ----- سجل النظام -----
  async addSystemLog(logData) {
    const newLog = {
      id: Date.now(),
      ...logData,
      created_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('system_logs')
      .insert([newLog])
    
    if (error) throw error
    return true
  }

  async getSystemLogs(limit = 100) {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // ----- دوال مساعدة -----
  calculateDaysLeft(purchaseDate, duration = 30) {
    if (!purchaseDate) return 0
    const purchase = new Date(purchaseDate)
    const endDate = new Date(purchase)
    endDate.setDate(endDate.getDate() + duration)
    const today = new Date()
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  async login(username, password) {
    const user = await this.getUserByEmail(username) || await this.getUserByUsername(username)
    
    if (!user || user.password !== password) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
    }
    
    if (user.status === 'banned') {
      throw new Error('حسابك محظور. يرجى التواصل مع الدعم الفني')
    }
    
    // تحديث آخر تسجيل دخول
    await this.updateUser(user.id, {
      last_login: new Date().toISOString()
    })
    
    return user
  }
}

// إنشاء كائن API عام
window.supabaseAPI = new SupabaseAPI()

// تصدير للاستخدام
export { supabase, SupabaseAPI }