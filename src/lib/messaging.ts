import { supabase } from './supabase';

// Get or create conversation between two users
export async function getOrCreateConversation(user1Id: string, user2Id: string) {
    // Ensure consistent ordering (smaller ID first)
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Check if conversation exists
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', smallerId)
        .eq('user2_id', largerId)
        .single();

    if (existing) return existing;

    // Create new conversation
    const { data, error } = await supabase
        .from('conversations')
        .insert([{ user1_id: smallerId, user2_id: largerId }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get all conversations for a user
export async function getUserConversations(userId: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            user1:profiles!conversations_user1_id_fkey(id, full_name, company_name, avatar_url),
            user2:profiles!conversations_user2_id_fkey(id, full_name, company_name, avatar_url)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles(id, full_name, company_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

// Send a message
export async function sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
        .from('messages')
        .insert([{ conversation_id: conversationId, sender_id: senderId, content }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);

    if (error) throw error;
}

// Search posts
export async function searchPosts(query: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles(full_name, company_name, role, avatar_url)
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;
    return data;
}

// Search profiles
export async function searchProfiles(query: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,company_name.ilike.%${query}%`)
        .limit(20);

    if (error) throw error;
    return data;
}

// Follow a user
export async function followUser(followerId: string, followingId: string) {
    const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) throw error;
}

// Unfollow a user
export async function unfollowUser(followerId: string, followingId: string) {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) throw error;
}

// Check if user is following another user
export async function checkIsFollowing(followerId: string, followingId: string) {
    const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return !!data;
}

// Get user's posts
export async function getUserPosts(userId: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles(full_name, company_name, role, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
