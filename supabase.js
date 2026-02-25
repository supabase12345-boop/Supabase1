// ===================================
// supabase.js - Elite Capital (نسخة كاملة مع دعم الصور وحذف الدردشة)
// ===================================

const SUPABASE_URL = 'https://xrjwjzwqptshnbzjbzoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyandqendxcHRzaG5iempiem9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjA4MzksImV4cCI6MjA4NzU5NjgzOX0._0lYgQHfljPrBqOMLsRwgILEVs62sib1KqCNIOiSQ9I';

let supabaseClient = null;

// ========== حل مشكلة LockManager نهائياً ==========
(function fixLockManager() {
    if (navigator && navigator.locks) {
        try {
            const originalLocks = navigator.locks;
            Object.defineProperty(navigator, 'locks', {
                get: () => undefined,
                configurable: true
            });
            console.log('🔓 تم تعطيل LockManager');
            setTimeout(() => {
                Object.defineProperty(navigator, 'locks', {
                    get: () => originalLocks,
                    configurable: true
                });
            }, 5000);
        } catch (e) {
            console.log('لا يمكن تعديل locks');
        }
    }
})();

// ========== تهيئة الاتصال ==========
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ مكتبة Supabase غير محملة');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.sessionStorage,
                storageKey: 'elite_capital_auth_' + Date.now()
            }
        });
        console.log('✅ تم الاتصال بـ Supabase');
        return supabaseClient;
    } catch (error) {
        console.error('❌ فشل الاتصال:', error);
        return null;
    }
}

// ========== دوال المساعدة ==========
function generateReferralCode(username) {
    if (!username) username = 'USER';
    const cleanUsername = username.toString().toUpperCase().replace(/\s/g, '').substring(0, 5);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanUsername}${random}${timestamp}`.substring(0, 12);
}

// ========== دوال رفع الصور ==========
async function uploadImage(file, folder = 'chat_images') {
    try {
        if (!file) throw new Error('الملف مطلوب');
        
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            throw new Error('الملف يجب أن يكون صورة');
        }
        
        // التحقق من حجم الملف (5 ميجابايت كحد أقصى)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        }
        
        // إنشاء اسم فريد للملف
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // رفع الملف إلى Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('uploads')
            .upload(fileName, file);
        
        if (error) throw error;
        
        // الحصول على الرابط العام
        const { data: urlData } = supabaseClient.storage
            .from('uploads')
            .getPublicUrl(fileName);
        
        return { 
            success: true, 
            data: {
                path: fileName,
                url: urlData.publicUrl,
                name: file.name,
                size: file.size,
                type: file.type
            }
        };
    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        return { success: false, error: error.message };
    }
}

async function deleteImage(imagePath) {
    try {
        if (!imagePath) throw new Error('مسار الصورة مطلوب');
        
        const { error } = await supabaseClient.storage
            .from('uploads')
            .remove([imagePath]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف الصورة:', error);
        return { success: false, error: error.message };
    }
}

// ========== نظام الدردشة المباشرة المتطور ==========

// بدء محادثة جديدة
async function startLiveChat(userId) {
    try {
        console.log('بدء محادثة جديدة للمستخدم:', userId);
        
        // التحقق من وجود محادثة نشطة
        const { data: existingChat, error: checkError } = await supabaseClient
            .from('live_chats')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingChat) {
            return { success: true, data: existingChat, isNew: false };
        }
        
        // إنشاء محادثة جديدة
        const { data: newChat, error: createError } = await supabaseClient
            .from('live_chats')
            .insert([{
                user_id: userId,
                status: 'active',
                started_at: new Date().toISOString(),
                last_message_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (createError) throw createError;
        
        console.log('✅ تم إنشاء محادثة جديدة:', newChat.id);
        
        return { success: true, data: newChat, isNew: true };
    } catch (error) {
        console.error('خطأ في بدء المحادثة:', error);
        return { success: false, error: error.message };
    }
}

// إرسال رسالة نصية
async function sendChatMessage(chatId, userId, message) {
    try {
        if (!message || !message.trim()) {
            throw new Error('الرسالة لا يمكن أن تكون فارغة');
        }
        
        console.log('إرسال رسالة نصية:', { chatId, userId, message });
        
        const { data: newMessage, error: msgError } = await supabaseClient
            .from('chat_messages')
            .insert([{
                chat_id: chatId,
                user_id: userId,
                message: message.trim(),
                message_type: 'text',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (msgError) throw msgError;
        
        // تحديث وقت آخر رسالة
        await supabaseClient
            .from('live_chats')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', chatId);
        
        return { success: true, data: newMessage };
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        return { success: false, error: error.message };
    }
}

// إرسال رسالة صورة
async function sendChatImage(chatId, userId, imageFile) {
    try {
        console.log('رفع صورة وإرسالها:', { chatId, userId });
        
        // رفع الصورة أولاً
        const uploadResult = await uploadImage(imageFile, 'chat_images');
        
        if (!uploadResult.success) {
            throw new Error(uploadResult.error);
        }
        
        const imageData = uploadResult.data;
        
        // إرسال الرسالة مع الصورة
        const { data: newMessage, error: msgError } = await supabaseClient
            .from('chat_messages')
            .insert([{
                chat_id: chatId,
                user_id: userId,
                message: '🖼️ صورة',
                message_type: 'image',
                image_url: imageData.url,
                image_path: imageData.path,
                image_name: imageData.name,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (msgError) {
            // إذا فشل إرسال الرسالة، احذف الصورة المرفوعة
            await deleteImage(imageData.path);
            throw msgError;
        }
        
        // تحديث وقت آخر رسالة
        await supabaseClient
            .from('live_chats')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', chatId);
        
        return { success: true, data: newMessage, imageUrl: imageData.url };
    } catch (error) {
        console.error('خطأ في إرسال الصورة:', error);
        return { success: false, error: error.message };
    }
}

// جلب رسائل المحادثة
async function getChatMessages(chatId) {
    try {
        const { data, error } = await supabaseClient
            .from('chat_messages')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    is_admin
                )
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب الرسائل:', error);
        return { success: false, error: error.message };
    }
}

// حذف رسالة معينة (للمسؤول فقط)
async function deleteChatMessage(messageId, adminId, isAdmin = true) {
    try {
        if (!isAdmin) {
            throw new Error('غير مصرح لك بحذف الرسائل');
        }
        
        // جلب الرسالة أولاً لمعرفة إذا كانت تحتوي على صورة
        const { data: message, error: fetchError } = await supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('id', messageId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // إذا كانت الرسالة تحتوي على صورة، احذفها من التخزين
        if (message.message_type === 'image' && message.image_path) {
            await deleteImage(message.image_path);
        }
        
        // حذف الرسالة من قاعدة البيانات
        const { error: deleteError } = await supabaseClient
            .from('chat_messages')
            .delete()
            .eq('id', messageId);
        
        if (deleteError) throw deleteError;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        return { success: false, error: error.message };
    }
}

// حذف محادثة كاملة (للمسؤول فقط)
async function deleteChat(chatId, adminId, isAdmin = true) {
    try {
        if (!isAdmin) {
            throw new Error('غير مصرح لك بحذف المحادثات');
        }
        
        // جلب جميع رسائل المحادثة
        const { data: messages, error: messagesError } = await supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('chat_id', chatId);
        
        if (messagesError) throw messagesError;
        
        // حذف جميع الصور المرتبطة
        for (const message of messages || []) {
            if (message.message_type === 'image' && message.image_path) {
                await deleteImage(message.image_path);
            }
        }
        
        // حذف الرسائل
        const { error: deleteMessagesError } = await supabaseClient
            .from('chat_messages')
            .delete()
            .eq('chat_id', chatId);
        
        if (deleteMessagesError) throw deleteMessagesError;
        
        // حذف المحادثة
        const { error: deleteChatError } = await supabaseClient
            .from('live_chats')
            .delete()
            .eq('id', chatId);
        
        if (deleteChatError) throw deleteChatError;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف المحادثة:', error);
        return { success: false, error: error.message };
    }
}

// حذف جميع المحادثات القديمة (للمسؤول فقط)
async function deleteOldChats(daysOld = 30, adminId, isAdmin = true) {
    try {
        if (!isAdmin) {
            throw new Error('غير مصرح لك بحذف المحادثات');
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        // جلب المحادثات القديمة
        const { data: oldChats, error: fetchError } = await supabaseClient
            .from('live_chats')
            .select('id')
            .lt('created_at', cutoffDate.toISOString())
            .eq('status', 'closed');
        
        if (fetchError) throw fetchError;
        
        let deletedCount = 0;
        
        // حذف كل محادثة قديمة
        for (const chat of oldChats || []) {
            const result = await deleteChat(chat.id, adminId, isAdmin);
            if (result.success) deletedCount++;
        }
        
        return { 
            success: true, 
            data: { 
                deletedCount,
                message: `تم حذف ${deletedCount} محادثة قديمة`
            }
        };
    } catch (error) {
        console.error('خطأ في حذف المحادثات القديمة:', error);
        return { success: false, error: error.message };
    }
}

// تعليم الرسائل كمقروءة
async function markMessagesAsRead(chatId, userId) {
    try {
        const { error } = await supabaseClient
            .from('chat_messages')
            .update({ 
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('chat_id', chatId)
            .neq('user_id', userId)
            .eq('is_read', false);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث حالة القراءة:', error);
        return { success: false, error: error.message };
    }
}

// جلب المحادثات النشطة مع تفاصيلها
async function getActiveChats() {
    try {
        const { data, error } = await supabaseClient
            .from('live_chats')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    email,
                    phone
                )
            `)
            .eq('status', 'active')
            .order('last_message_at', { ascending: false });
        
        if (error) throw error;
        
        // إضافة آخر رسالة وعدد غير المقروء لكل محادثة
        for (let chat of data || []) {
            // آخر رسالة
            const { data: lastMessage } = await supabaseClient
                .from('chat_messages')
                .select('*')
                .eq('chat_id', chat.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            chat.last_message = lastMessage;
            
            // عدد الرسائل غير المقروءة
            const { count } = await supabaseClient
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chat.id)
                .eq('is_read', false)
                .neq('user_id', chat.admin_id);
            
            chat.unread_count = count || 0;
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب المحادثات النشطة:', error);
        return { success: false, error: error.message };
    }
}

// انضمام مسؤول للمحادثة
async function joinChat(chatId, adminId) {
    try {
        const { error } = await supabaseClient
            .from('live_chats')
            .update({ 
                admin_id: adminId,
                updated_at: new Date().toISOString()
            })
            .eq('id', chatId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في انضمام المسؤول:', error);
        return { success: false, error: error.message };
    }
}

// إغلاق محادثة
async function closeChat(chatId) {
    try {
        const { error } = await supabaseClient
            .from('live_chats')
            .update({ 
                status: 'closed',
                ended_at: new Date().toISOString()
            })
            .eq('id', chatId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في إنهاء المحادثة:', error);
        return { success: false, error: error.message };
    }
}

// جلب محادثة المستخدم النشطة
async function getUserActiveChat(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('live_chats')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب محادثة المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ========== نظام التحقق من الدفع والتمييز بين المشتركين ==========

// التحقق من حالة دفع المستخدم
async function checkPaymentStatus(userId, packageId) {
    try {
        const { data: pendingPackage, error: pendingError } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('user_id', userId)
            .eq('package_id', packageId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (pendingError) throw pendingError;

        const { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('package_id', packageId)
            .eq('status', 'active')
            .maybeSingle();

        if (subError) throw subError;

        let status = 'none';
        let paymentProof = null;
        let createdAt = null;

        if (subscription) {
            status = 'approved';
            paymentProof = 'مدفوع ✓';
            createdAt = subscription.created_at;
        } else if (pendingPackage) {
            status = pendingPackage.status;
            paymentProof = pendingPackage.payment_proof ? '📎 مع إثبات' : '⏳ بدون إثبات';
            createdAt = pendingPackage.created_at;
        }

        return {
            success: true,
            data: {
                status,
                hasPaymentProof: !!pendingPackage?.payment_proof,
                paymentProof,
                createdAt,
                pendingPackage,
                subscription
            }
        };
    } catch (error) {
        console.error('خطأ في التحقق من حالة الدفع:', error);
        return { success: false, error: error.message };
    }
}

// جلب جميع الطلبات مع تصنيفها
async function getAllPendingPackagesWithProof() {
    try {
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .select(`
                *,
                users:user_id (
                    name,
                    email,
                    phone,
                    balance
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const classified = {
            withProof: [],
            withoutProof: [],
            all: data || []
        };

        (data || []).forEach(pkg => {
            if (pkg.payment_proof) {
                classified.withProof.push(pkg);
            } else {
                classified.withoutProof.push(pkg);
            }
        });

        return { success: true, data: classified };
    } catch (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return { success: false, error: error.message };
    }
}

// تحديث حالة الدفع يدوياً
async function updatePaymentStatus(pendingId, hasProof, adminId) {
    try {
        const updates = {
            payment_proof: hasProof ? 'manual_' + Date.now() : null,
            processed_by: adminId,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseClient
            .from('pending_packages')
            .update(updates)
            .eq('id', pendingId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('خطأ في تحديث حالة الدفع:', error);
        return { success: false, error: error.message };
    }
}

// جلب إحصائيات الدفع
async function getPaymentStats() {
    try {
        const { data: allPackages, error } = await supabaseClient
            .from('pending_packages')
            .select('*');

        if (error) throw error;

        const stats = {
            total: allPackages?.length || 0,
            withProof: allPackages?.filter(p => p.payment_proof).length || 0,
            withoutProof: allPackages?.filter(p => !p.payment_proof).length || 0,
            pending: allPackages?.filter(p => p.status === 'pending').length || 0,
            approved: allPackages?.filter(p => p.status === 'approved').length || 0,
            rejected: allPackages?.filter(p => p.status === 'rejected').length || 0
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الدفع:', error);
        return { success: false, error: error.message };
    }
}

// جلب المستخدمين الذين دفعوا
async function getUsersWithPayment() {
    try {
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select(`
                *,
                subscriptions:subscriptions(
                    id,
                    package_name,
                    amount,
                    start_date,
                    end_date,
                    status
                )
            `)
            .eq('subscriptions.status', 'active');

        if (usersError) throw usersError;

        const paidUsers = users?.filter(u => u.subscriptions && u.subscriptions.length > 0) || [];

        return { success: true, data: paidUsers };
    } catch (error) {
        console.error('خطأ في جلب المستخدمين المدفوعين:', error);
        return { success: false, error: error.message };
    }
}

// ========== المستخدمين ==========
async function registerUser(userData) {
    try {
        console.log('بدء تسجيل مستخدم جديد:', userData.email);
        
        const { data: existing, error: checkError } = await supabaseClient
            .from('users')
            .select('id')
            .or(`email.eq.${userData.email},username.eq.${userData.username}`)
            .maybeSingle();
        
        if (checkError) {
            console.error('خطأ في التحقق من المستخدم:', checkError);
        }
        
        if (existing) {
            throw new Error('البريد الإلكتروني أو اسم المستخدم مستخدم مسبقاً');
        }
        
        const referralCode = generateReferralCode(userData.username);
        
        let referredBy = null;
        if (userData.referralCode) {
            const { data: referrer } = await supabaseClient
                .from('users')
                .select('referral_code')
                .eq('referral_code', userData.referralCode)
                .maybeSingle();
            
            if (referrer) {
                referredBy = userData.referralCode;
                console.log('✅ كود إحالة صحيح:', referredBy);
            }
        }
        
        const newUserData = {
            name: userData.name,
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            referral_code: referralCode,
            referred_by: referredBy,
            balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            status: 'active',
            is_admin: false,
            joined_date: new Date().toISOString(),
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            wallet_address: ''
        };
        
        console.log('بيانات المستخدم الجديد:', newUserData);
        
        const { data: newUser, error } = await supabaseClient
            .from('users')
            .insert([newUserData])
            .select()
            .single();
        
        if (error) {
            console.error('خطأ في إدراج المستخدم:', error);
            throw new Error(error.message || 'فشل إنشاء الحساب');
        }
        
        console.log('✅ تم إنشاء المستخدم بنجاح:', newUser.id);
        
        return { success: true, data: newUser };
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        return { success: false, error: error.message };
    }
}

async function loginUser(usernameOrEmail, password) {
    try {
        console.log('محاولة تسجيل دخول:', usernameOrEmail);
        
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
            .maybeSingle();
        
        if (error) {
            console.error('خطأ في البحث عن المستخدم:', error);
            throw error;
        }
        
        if (!user) {
            throw new Error('المستخدم غير موجود');
        }
        
        if (user.password !== password) {
            throw new Error('كلمة المرور غير صحيحة');
        }
        
        if (user.status === 'banned') {
            throw new Error('حسابك محظور');
        }
        
        await supabaseClient
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);
        
        await addLoginActivity(user.id);
        
        console.log('✅ تم تسجيل الدخول بنجاح:', user.email);
        return { success: true, data: user };
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return { success: false, error: error.message };
    }
}

async function getUserById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        return { success: false, error: error.message };
    }
}

async function updateUser(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        return { success: false, error: error.message };
    }
}

async function getAllUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        return { success: false, error: error.message };
    }
}

async function updateUserStatus(id, status) {
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث حالة المستخدم:', error);
        return { success: false, error: error.message };
    }
}

// ========== الباقات ==========
async function getAllPackages() {
    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('status', 'active')
            .order('price', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب الباقات:', error);
        return { success: false, error: error.message };
    }
}

async function getPackageById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب الباقة:', error);
        return { success: false, error: error.message };
    }
}

async function createPackage(packageData) {
    try {
        const profitPercentage = (packageData.dailyProfit / packageData.price) * 100;
        
        if (!packageData.name) throw new Error('اسم الباقة مطلوب');
        if (!packageData.price || packageData.price <= 0) throw new Error('السعر يجب أن يكون أكبر من 0');
        if (!packageData.dailyProfit || packageData.dailyProfit <= 0) throw new Error('الربح اليومي يجب أن يكون أكبر من 0');
        if (!packageData.duration || packageData.duration <= 0) throw new Error('المدة يجب أن تكون أكبر من 0');
        
        const { data, error } = await supabaseClient
            .from('packages')
            .insert([{
                name: packageData.name,
                price: packageData.price,
                daily_profit: packageData.dailyProfit,
                profit_percentage: profitPercentage,
                duration: packageData.duration || 30,
                duration_type: packageData.durationType || 'day',
                category: packageData.category || 'standard',
                description: packageData.description || '',
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ تم إنشاء الباقة بنجاح:', data);
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في إنشاء الباقة:', error);
        return { success: false, error: error.message };
    }
}

async function updatePackage(id, updates) {
    try {
        if (updates.price && updates.dailyProfit) {
            updates.profit_percentage = (updates.dailyProfit / updates.price) * 100;
        } else if (updates.price && !updates.dailyProfit) {
            const { data: pkg } = await supabaseClient
                .from('packages')
                .select('daily_profit')
                .eq('id', id)
                .single();
            
            if (pkg) {
                updates.profit_percentage = (pkg.daily_profit / updates.price) * 100;
            }
        } else if (!updates.price && updates.dailyProfit) {
            const { data: pkg } = await supabaseClient
                .from('packages')
                .select('price')
                .eq('id', id)
                .single();
            
            if (pkg) {
                updates.profit_percentage = (updates.dailyProfit / pkg.price) * 100;
            }
        }
        
        const { error } = await supabaseClient
            .from('packages')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('خطأ في تحديث الباقة:', error);
        return { success: false, error: error.message };
    }
}

async function deletePackage(id) {
    try {
        const { error } = await supabaseClient
            .from('packages')
            .update({ status: 'deleted' })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف الباقة:', error);
        return { success: false, error: error.message };
    }
}

// ========== طلبات الاشتراك ==========
async function createPendingPackage(pendingData) {
    try {
        console.log('📦 بدء إنشاء طلب اشتراك:', pendingData);
        
        if (!pendingData.userId) throw new Error('معرف المستخدم مطلوب');
        if (!pendingData.packageId) throw new Error('معرف الباقة مطلوب');
        if (!pendingData.amount) throw new Error('المبلغ مطلوب');
        
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('id, name, email, phone, referred_by')
            .eq('id', pendingData.userId)
            .single();
        
        if (userError || !user) throw new Error('المستخدم غير موجود');
        
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('packages')
            .select('id, name, category, duration, duration_type, daily_profit, price')
            .eq('id', pendingData.packageId)
            .single();
        
        if (pkgError || !pkg) throw new Error('الباقة غير موجودة');
        
        const amountNum = parseFloat(pendingData.amount);
        const priceNum = parseFloat(pkg.price);
        
        if (Math.abs(amountNum - priceNum) > 0.01) {
            throw new Error('المبلغ غير مطابق لسعر الباقة');
        }
        
        const insertData = {
            user_id: user.id,
            user_name: user.name || 'مستخدم',
            user_email: user.email || '',
            user_phone: user.phone || '',
            package_id: pkg.id,
            package_name: pkg.name || 'باقة',
            package_category: pkg.category || 'standard',
            package_duration: pkg.duration || 30,
            package_duration_type: pkg.duration_type || 'day',
            package_daily_profit: pkg.daily_profit || 0,
            amount: priceNum,
            payment_proof: pendingData.paymentProof || null,
            wallet_address: pendingData.walletAddress || 'TYmk60K9JvCqS7Fqy6BpWpZp8hLpVHw7D',
            network: 'TRC20',
            transaction_hash: pendingData.paymentProof ? 'PROOF_' + Date.now() : null,
            referred_by: user.referred_by || null,
            fast_approval: !!pendingData.paymentProof,
            estimated_activation: pendingData.paymentProof ? 'ساعة واحدة' : '3-6 ساعات',
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .insert([insertData])
            .select()
            .single();
        
        if (error) {
            console.error('❌ خطأ من قاعدة البيانات:', error);
            throw error;
        }
        
        console.log('✅ تم حفظ الطلب بنجاح:', data);
        
        await addSubscriptionActivity(user.id, priceNum, pkg.name, 'pending');
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ خطأ في إنشاء طلب الاشتراك:', error);
        return { 
            success: false, 
            error: error.message || 'فشل تقديم الطلب. يرجى المحاولة مرة أخرى.'
        };
    }
}

async function getPendingPackages() {
    try {
        const { data, error } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب الطلبات:', error);
        return { success: false, error: error.message };
    }
}

// ========== الموافقة على طلب اشتراك ==========
async function approvePendingPackage(id, adminId) {
    try {
        const { data: pending, error: fetchError } = await supabaseClient
            .from('pending_packages')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        if (!pending) throw new Error('الطلب غير موجود');
        
        const { data: pkg, error: pkgError } = await supabaseClient
            .from('packages')
            .select('duration, duration_type, daily_profit')
            .eq('id', pending.package_id)
            .single();
        
        if (pkgError) throw pkgError;
        
        const startDate = new Date();
        const endDate = new Date();
        
        if (pkg) {
            const duration = pkg.duration || 30;
            const durationType = pkg.duration_type || 'day';
            
            if (durationType === 'day') {
                endDate.setDate(endDate.getDate() + duration);
            } else if (durationType === 'month') {
                endDate.setDate(endDate.getDate() + (duration * 30));
            } else if (durationType === 'year') {
                endDate.setDate(endDate.getDate() + (duration * 365));
            }
        } else {
            endDate.setDate(endDate.getDate() + 30);
        }
        
        await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'approved',
                processed_by: adminId,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        const { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .insert([{
                user_id: pending.user_id,
                package_id: pending.package_id,
                package_name: pending.package_name,
                package_category: pending.package_category || 'standard',
                amount: pending.amount,
                daily_profit: pending.package_daily_profit || (pending.amount * 0.025),
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (subError) throw subError;
        
        await supabaseClient
            .from('users')
            .update({ 
                current_subscription_id: subscription.id,
                has_active_subscription: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', pending.user_id);
        
        await supabaseClient
            .from('transactions')
            .insert([{
                user_id: pending.user_id,
                type: 'اشتراك',
                amount: pending.amount,
                description: `اشتراك في باقة ${pending.package_name}`,
                status: 'completed',
                subscription_id: subscription.id,
                created_at: new Date().toISOString()
            }]);
        
        if (pending.referred_by) {
            await processReferralRewards(pending.user_id, pending.referred_by);
        }
        
        await addSubscriptionActivity(pending.user_id, pending.amount, pending.package_name, 'approved');
        
        return { success: true, data: subscription };
    } catch (error) {
        console.error('خطأ في قبول الطلب:', error);
        return { success: false, error: error.message };
    }
}

async function rejectPendingPackage(id, reason, adminId) {
    try {
        const { data: pending } = await supabaseClient
            .from('pending_packages')
            .select('user_id, package_name, amount')
            .eq('id', id)
            .single();
        
        const { error } = await supabaseClient
            .from('pending_packages')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                processed_by: adminId,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        if (pending) {
            await addSubscriptionActivity(pending.user_id, pending.amount, pending.package_name, 'rejected');
        }
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في رفض الطلب:', error);
        return { success: false, error: error.message };
    }
}

// ========== الإحالة ==========
async function processReferralRewards(newUserId, referralCode) {
    try {
        console.log('معالجة مكافآت الإحالة:', { newUserId, referralCode });
        
        const { data: referrer, error: referrerError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('referral_code', referralCode)
            .single();
        
        if (referrerError || !referrer) {
            console.log('لم يتم العثور على المحيل');
            return { success: false };
        }
        
        const REFERRER_REWARD = 50;
        const REFEREE_REWARD = 20;
        
        const { data: newUser, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', newUserId)
            .single();
        
        if (userError || !newUser) {
            console.log('لم يتم العثور على المستخدم الجديد');
            return { success: false };
        }
        
        await supabaseClient
            .from('users')
            .update({ 
                balance: (newUser.balance || 0) + REFEREE_REWARD,
                referral_reward_paid: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', newUserId);
        
        await supabaseClient
            .from('users')
            .update({ 
                balance: (referrer.balance || 0) + REFERRER_REWARD,
                referral_earnings: (referrer.referral_earnings || 0) + REFERRER_REWARD,
                referral_count: (referrer.referral_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', referrer.id);
        
        const transactions = [
            {
                user_id: newUserId,
                type: 'مكافأة إحالة',
                amount: REFEREE_REWARD,
                description: `🎁 مكافأة تسجيل عن طريق كود الإحالة من ${referrer.name}`,
                status: 'completed',
                referral_code: referralCode,
                referrer_name: referrer.name,
                created_at: new Date().toISOString()
            },
            {
                user_id: referrer.id,
                type: 'مكافأة إحالة',
                amount: REFERRER_REWARD,
                description: `💰 مكافأة إحالة: ${newUser.name}`,
                status: 'completed',
                referred_user_id: newUserId,
                referred_user_name: newUser.name,
                created_at: new Date().toISOString()
            }
        ];
        
        await supabaseClient.from('transactions').insert(transactions);
        
        console.log('✅ تم صرف مكافآت الإحالة بنجاح');
        return { success: true };
    } catch (error) {
        console.error('خطأ في معالجة الإحالة:', error);
        return { success: false };
    }
}

async function getReferralStats(userId) {
    try {
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError) throw userError;
        
        const { data: referredUsers, error: referredError } = await supabaseClient
            .from('users')
            .select('id, name, email, joined_date, has_active_subscription, referral_reward_paid')
            .eq('referred_by', user.referral_code);
        
        if (referredError) throw referredError;
        
        const totalEarned = user.referral_earnings || 0;
        
        const activeReferrals = referredUsers?.filter(u => u.has_active_subscription).length || 0;
        
        return {
            success: true,
            data: {
                referralCode: user.referral_code,
                totalReferrals: referredUsers?.length || 0,
                activeReferrals: activeReferrals,
                pendingReferrals: (referredUsers?.length || 0) - activeReferrals,
                totalEarned: totalEarned,
                referredUsers: referredUsers || []
            }
        };
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الإحالة:', error);
        return { success: false, error: error.message };
    }
}

// ========== الاشتراكات ==========
async function getUserSubscription(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب الاشتراك:', error);
        return { success: false, error: error.message };
    }
}

// ========== طلبات السحب ==========
async function createWithdrawal(withdrawalData) {
    try {
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', withdrawalData.userId)
            .single();
        
        if (userError) throw userError;
        
        const totalAmount = withdrawalData.amount + withdrawalData.fee;
        if (user.balance < totalAmount) {
            throw new Error('الرصيد غير كافي');
        }
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .insert([{
                user_id: withdrawalData.userId,
                amount: withdrawalData.amount,
                wallet: withdrawalData.wallet,
                network: withdrawalData.network,
                fee: withdrawalData.fee,
                total: totalAmount,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        await supabaseClient
            .from('users')
            .update({ 
                balance: user.balance - totalAmount,
                total_withdrawn: (user.total_withdrawn || 0) + withdrawalData.amount
            })
            .eq('id', withdrawalData.userId);
        
        await supabaseClient
            .from('transactions')
            .insert([{
                user_id: withdrawalData.userId,
                type: 'سحب',
                amount: -totalAmount,
                description: `طلب سحب ${withdrawalData.amount}$ (رسوم ${withdrawalData.fee}$)`,
                status: 'pending',
                withdrawal_id: data.id,
                created_at: new Date().toISOString()
            }]);
        
        await addWithdrawalActivity(withdrawalData.userId, withdrawalData.amount, 'pending');
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في إنشاء طلب سحب:', error);
        return { success: false, error: error.message };
    }
}

async function getUserWithdrawals(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب طلبات السحب:', error);
        return { success: false, error: error.message };
    }
}

async function getAllWithdrawals(status = null) {
    try {
        let query = supabaseClient
            .from('withdrawals')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب جميع طلبات السحب:', error);
        return { success: false, error: error.message };
    }
}

async function getPendingWithdrawals() {
    return getAllWithdrawals('pending');
}

async function updateWithdrawalStatus(id, status, adminId, txHash = null) {
    try {
        const updates = { 
            status: status,
            processed_by: adminId,
            processed_at: new Date().toISOString()
        };
        
        if (txHash) updates.transaction_hash = txHash;
        
        const { data, error } = await supabaseClient
            .from('withdrawals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (status === 'rejected') {
            const { data: user } = await supabaseClient
                .from('users')
                .select('balance')
                .eq('id', data.user_id)
                .single();
            
            await supabaseClient
                .from('users')
                .update({ balance: user.balance + data.total })
                .eq('id', data.user_id);
        }
        
        await addWithdrawalActivity(data.user_id, data.amount, status);
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في تحديث حالة السحب:', error);
        return { success: false, error: error.message };
    }
}

// ========== المعاملات ==========
async function getUserTransactions(userId, limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب المعاملات:', error);
        return { success: false, error: error.message };
    }
}

async function getAllTransactions() {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(500);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب جميع المعاملات:', error);
        return { success: false, error: error.message };
    }
}

// ========== إحصائيات لوحة التحكم ==========
async function getDashboardStats() {
    try {
        const [
            usersRes,
            packagesRes,
            pendingPackagesRes,
            subscriptionsRes,
            withdrawalsRes
        ] = await Promise.all([
            supabaseClient.from('users').select('*', { count: 'exact', head: false }),
            supabaseClient.from('packages').select('*').eq('status', 'active'),
            supabaseClient.from('pending_packages').select('*').eq('status', 'pending'),
            supabaseClient.from('subscriptions').select('*').eq('status', 'active'),
            supabaseClient.from('withdrawals').select('*')
        ]);
        
        const users = usersRes.data || [];
        const packages = packagesRes.data || [];
        const pendingPackages = pendingPackagesRes.data || [];
        const subscriptions = subscriptionsRes.data || [];
        const withdrawals = withdrawalsRes.data || [];
        
        const totalDeposits = users.reduce((sum, u) => sum + (u.total_earned || 0), 0);
        const totalWithdrawals = withdrawals
            .filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + w.amount, 0);
        
        const activeUsers = users.filter(u => u.status === 'active' || !u.status).length;
        const suspendedUsers = users.filter(u => u.status === 'suspended').length;
        const bannedUsers = users.filter(u => u.status === 'banned').length;
        
        return {
            success: true,
            data: {
                totalUsers: users.length,
                activeUsers,
                suspendedUsers,
                bannedUsers,
                totalDeposits,
                totalWithdrawals,
                activeSubscriptions: subscriptions.length,
                pendingPackages: pendingPackages.length,
                pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
                packagesCount: packages.length
            }
        };
    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return { success: false, error: error.message };
    }
}

// ========== الأرباح اليومية ==========
async function processDailyProfits() {
    try {
        const { data: subscriptions, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('status', 'active');
        
        if (error) throw error;
        
        const today = new Date().toISOString().split('T')[0];
        const profits = [];
        
        for (const sub of subscriptions || []) {
            const { data: existingProfit } = await supabaseClient
                .from('daily_profits')
                .select('id')
                .eq('user_id', sub.user_id)
                .eq('subscription_id', sub.id)
                .gte('created_at', today)
                .limit(1)
                .maybeSingle();
            
            if (existingProfit) continue;
            
            const profitAmount = sub.daily_profit;
            
            const { data: user } = await supabaseClient
                .from('users')
                .select('balance, total_earned')
                .eq('id', sub.user_id)
                .single();
            
            await supabaseClient
                .from('users')
                .update({ 
                    balance: (user.balance || 0) + profitAmount,
                    total_earned: (user.total_earned || 0) + profitAmount
                })
                .eq('id', sub.user_id);
            
            const { data: profit } = await supabaseClient
                .from('daily_profits')
                .insert([{
                    user_id: sub.user_id,
                    subscription_id: sub.id,
                    amount: profitAmount,
                    profit_date: today,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            await supabaseClient
                .from('transactions')
                .insert([{
                    user_id: sub.user_id,
                    type: 'ربح يومي',
                    amount: profitAmount,
                    description: `أرباح يومية من باقة ${sub.package_name}`,
                    status: 'completed',
                    subscription_id: sub.id,
                    created_at: new Date().toISOString()
                }]);
            
            await addProfitActivity(sub.user_id, profitAmount, sub.package_name);
            
            profits.push(profit);
        }
        
        return { success: true, data: profits };
    } catch (error) {
        console.error('خطأ في معالجة الأرباح اليومية:', error);
        return { success: false, error: error.message };
    }
}

// ========== نظام سجل النشاطات ==========
async function addActivity(activityData) {
    try {
        const { data, error } = await supabaseClient
            .from('activity_log')
            .insert([{
                user_id: activityData.userId,
                type: activityData.type,
                title: activityData.title,
                description: activityData.description,
                amount: activityData.amount || null,
                status: activityData.status || null,
                package_name: activityData.packageName || null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في إضافة النشاط:', error);
        return { success: false, error: error.message };
    }
}

async function addProfitActivity(userId, amount, packageName) {
    return addActivity({
        userId: userId,
        type: 'profit',
        title: '💰 ربح يومي',
        description: `تم إضافة ${amount}$ أرباح يومية من ${packageName}`,
        amount: amount,
        status: 'completed',
        packageName: packageName
    });
}

async function addWithdrawalActivity(userId, amount, status) {
    let title, description;
    
    if (status === 'pending') {
        title = '💰 طلب سحب';
        description = `طلب سحب بقيمة ${amount}$ قيد المراجعة`;
    } else if (status === 'completed') {
        title = '✅ تم اكتمال السحب';
        description = `تم اكتمال طلب السحب بقيمة ${amount}$ بنجاح`;
    } else if (status === 'approved') {
        title = '✅ تمت الموافقة على السحب';
        description = `تمت الموافقة على طلب السحب بقيمة ${amount}$`;
    } else if (status === 'rejected') {
        title = '❌ رفض طلب السحب';
        description = `تم رفض طلب السحب بقيمة ${amount}$`;
    }
    
    return addActivity({
        userId: userId,
        type: 'withdrawal',
        title: title,
        description: description,
        amount: amount,
        status: status
    });
}

async function addSubscriptionActivity(userId, amount, packageName, status) {
    let title, description;
    
    if (status === 'pending') {
        title = '📦 طلب اشتراك';
        description = `طلب اشتراك في باقة ${packageName} بقيمة ${amount}$ قيد المراجعة`;
    } else if (status === 'approved') {
        title = '✅ تمت الموافقة على الاشتراك';
        description = `تمت الموافقة على اشتراكك في باقة ${packageName}`;
    } else if (status === 'rejected') {
        title = '❌ رفض طلب الاشتراك';
        description = `تم رفض طلب اشتراكك في باقة ${packageName}`;
    }
    
    return addActivity({
        userId: userId,
        type: 'subscription',
        title: title,
        description: description,
        amount: amount,
        status: status,
        packageName: packageName
    });
}

async function addLoginActivity(userId) {
    return addActivity({
        userId: userId,
        type: 'login',
        title: '🔐 تسجيل دخول',
        description: 'تم تسجيل الدخول إلى حسابك'
    });
}

async function getUserActivities(userId, limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from('activity_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب النشاطات:', error);
        return { success: false, error: error.message };
    }
}

async function getUserActivitiesByType(userId, type, limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from('activity_log')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب النشاطات:', error);
        return { success: false, error: error.message };
    }
}

// ========== نظام التنبيهات العامة ==========
async function addGlobalAlert(alertData) {
    try {
        const { data, error } = await supabaseClient
            .from('global_alerts')
            .insert([{
                title: alertData.title,
                message: alertData.message,
                type: alertData.type || 'info',
                created_by: alertData.createdBy,
                expires_at: alertData.expiresAt || null,
                is_active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في إضافة التنبيه:', error);
        return { success: false, error: error.message };
    }
}

async function getActiveAlerts() {
    try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabaseClient
            .from('global_alerts')
            .select('*')
            .eq('is_active', true)
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب التنبيهات:', error);
        return { success: false, error: error.message };
    }
}

async function disableAlert(alertId) {
    try {
        const { error } = await supabaseClient
            .from('global_alerts')
            .update({ is_active: false })
            .eq('id', alertId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في تعطيل التنبيه:', error);
        return { success: false, error: error.message };
    }
}

async function deleteAlert(alertId) {
    try {
        const { error } = await supabaseClient
            .from('global_alerts')
            .delete()
            .eq('id', alertId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف التنبيه:', error);
        return { success: false, error: error.message };
    }
}

// ========== إضافة كود تنظيف عند تحميل الصفحة ==========
(function cleanupOnLoad() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes('supabase')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {}
})();

// ========== التهيئة ==========
initSupabase();

// ========== تصدير الدوال ==========
window.supabaseClient = supabaseClient;
window.supabaseHelpers = {
    // المستخدمين
    registerUser,
    loginUser,
    getUserById,
    updateUser,
    getAllUsers,
    updateUserStatus,
    
    // الباقات
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    
    // طلبات الاشتراك
    createPendingPackage,
    getPendingPackages,
    approvePendingPackage,
    rejectPendingPackage,
    
    // الإحالة
    generateReferralCode,
    getReferralStats,
    
    // الاشتراكات
    getUserSubscription,
    
    // السحب
    createWithdrawal,
    getUserWithdrawals,
    getAllWithdrawals,
    getPendingWithdrawals,
    updateWithdrawalStatus,
    
    // المعاملات
    getUserTransactions,
    getAllTransactions,
    
    // الإحصائيات
    getDashboardStats,
    
    // الأرباح اليومية
    processDailyProfits,
    
    // نظام الدردشة المتطور
    startLiveChat,
    sendChatMessage,
    sendChatImage,
    getChatMessages,
    deleteChatMessage,
    deleteChat,
    deleteOldChats,
    markMessagesAsRead,
    getActiveChats,
    joinChat,
    closeChat,
    getUserActiveChat,
    
    // نظام رفع الصور
    uploadImage,
    deleteImage,
    
    // نظام التحقق من الدفع
    checkPaymentStatus,
    getAllPendingPackagesWithProof,
    updatePaymentStatus,
    getPaymentStats,
    getUsersWithPayment,
    
    // نظام سجل النشاطات
    addActivity,
    addProfitActivity,
    addWithdrawalActivity,
    addSubscriptionActivity,
    addLoginActivity,
    getUserActivities,
    getUserActivitiesByType,
    
    // نظام التنبيهات العامة
    addGlobalAlert,
    getActiveAlerts,
    disableAlert,
    deleteAlert
};

console.log('✅ تم تحميل جميع دوال Supabase مع دعم الصور وحذف الدردشة');