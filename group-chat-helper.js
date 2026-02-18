// ===================================
// group-chat-helper.js - دوال الدردشة الجماعية فقط
// ===================================

// ========== دوال الدردشة الجماعية ==========
async function createGroupChat(userId, message, imageFile = null) {
    try {
        // التحقق من وجود اشتراك نشط
        const { data: subscription, error: subError } = await supabaseClient
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        if (subError) throw subError;
        if (!subscription) {
            throw new Error('يجب أن يكون لديك اشتراك نشط للمشاركة في الدردشة');
        }

        let imageUrl = null;
        
        // رفع الصورة إذا وجدت
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `chat_images/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('chat-images')
                .upload(filePath, imageFile);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabaseClient.storage
                .from('chat-images')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
        }

        const { data, error } = await supabaseClient
            .from('group_chat_messages')
            .insert([{
                user_id: userId,
                message: message || null,
                image_url: imageUrl,
                created_at: new Date().toISOString()
            }])
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    is_admin,
                    has_active_subscription
                )
            `)
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في إرسال رسالة المجموعة:', error);
        return { success: false, error: error.message };
    }
}

async function getGroupChatMessages(limit = 50) {
    try {
        const { data, error } = await supabaseClient
            .from('group_chat_messages')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    is_admin,
                    has_active_subscription
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('خطأ في جلب رسائل المجموعة:', error);
        return { success: false, error: error.message };
    }
}

async function subscribeToGroupChat(callback) {
    return supabaseClient
        .channel('group_chat_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'group_chat_messages'
            },
            async (payload) => {
                // جلب بيانات المستخدم مع الرسالة
                const { data: user } = await supabaseClient
                    .from('users')
                    .select('id, name, is_admin, has_active_subscription')
                    .eq('id', payload.new.user_id)
                    .single();
                
                const messageWithUser = {
                    ...payload.new,
                    users: user
                };
                
                callback(messageWithUser);
            }
        )
        .subscribe();
}

async function uploadChatImage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `temp_chat_images/${fileName}`;
        
        const { error: uploadError } = await supabaseClient.storage
            .from('chat-images')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabaseClient.storage
            .from('chat-images')
            .getPublicUrl(filePath);
        
        return { success: true, url: publicUrl, path: filePath };
    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        return { success: false, error: error.message };
    }
}

async function deleteTempImage(filePath) {
    try {
        const { error } = await supabaseClient.storage
            .from('chat-images')
            .remove([filePath]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('خطأ في حذف الصورة:', error);
        return { success: false, error: error.message };
    }
}

// تصدير الدوال
window.groupChatHelpers = {
    createGroupChat,
    getGroupChatMessages,
    subscribeToGroupChat,
    uploadChatImage,
    deleteTempImage
};

console.log('✅ تم تحميل دوال الدردشة الجماعية');
