import { supabase } from './supabase';

// Upload media file to Supabase Storage
export async function uploadMedia(file: File, bucket: string = 'post-media'): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
}

// Toggle like on a post
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; error?: string }> {
    // Check if already liked
    const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) return { liked: false, error: error.message };
        return { liked: false };
    } else {
        // Like
        const { error } = await supabase
            .from('likes')
            .insert([{ post_id: postId, user_id: userId }]);

        if (error) return { liked: false, error: error.message };
        return { liked: true };
    }
}

// Add a comment to a post
export async function addComment(postId: string, userId: string, content: string) {
    const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: userId, content }])
        .select();

    if (error) throw error;
    return data;
}

// Get comments for a post
export async function getComments(postId: string) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles (full_name, company_name, avatar_url, role)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

// Check if user has liked a post
export async function checkUserLiked(postId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    return !!data;
}

// Get explore posts (all posts, paginated)
export async function getExplorePosts(limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles (full_name, company_name, role, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
}
