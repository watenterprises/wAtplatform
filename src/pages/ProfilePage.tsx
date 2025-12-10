import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { MapPin, Calendar, MessageSquare, UserPlus, UserMinus, Heart, Share2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { followUser, unfollowUser, checkIsFollowing, getUserPosts, getOrCreateConversation } from "../lib/messaging"
import { toggleLike, checkUserLiked } from "../lib/api"
import { Skeleton } from "../components/ui/skeleton"

export default function ProfilePage() {
    const { userId } = useParams<{ userId?: string }>()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts')

    useEffect(() => {
        loadProfile()
    }, [userId, currentUser])

    const loadProfile = async () => {
        setIsLoading(true)
        try {
            const targetUserId = userId || currentUser?.id

            if (!targetUserId) {
                setIsLoading(false)
                return
            }

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)

            // Fetch user's posts
            const postsData = await getUserPosts(targetUserId)

            // Check which posts current user has liked
            if (currentUser && postsData) {
                const postsWithLikes = await Promise.all(
                    postsData.map(async (post) => ({
                        ...post,
                        user_liked: await checkUserLiked(post.id, currentUser.id)
                    }))
                );
                setPosts(postsWithLikes);
            } else {
                setPosts(postsData || [])
            }

            // Check if current user is following this profile
            if (currentUser && targetUserId !== currentUser.id) {
                const following = await checkIsFollowing(currentUser.id, targetUserId)
                setIsFollowing(following)
            }
        } catch (error) {
            console.error("Error loading profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFollow = async () => {
        if (!currentUser || !profile) return

        try {
            if (isFollowing) {
                await unfollowUser(currentUser.id, profile.id)
                setIsFollowing(false)
                setProfile({ ...profile, followers_count: (profile.followers_count || 0) - 1 })
            } else {
                await followUser(currentUser.id, profile.id)
                setIsFollowing(true)
                setProfile({ ...profile, followers_count: (profile.followers_count || 0) + 1 })
            }
        } catch (error) {
            console.error("Follow error:", error)
            alert("Failed to update follow status")
        }
    }

    const handleMessage = async () => {
        if (!currentUser || !profile) return

        try {
            await getOrCreateConversation(currentUser.id, profile.id)
            navigate('/messages')
        } catch (error) {
            console.error("Message error:", error)
            alert("Failed to start conversation")
        }
    }

    const handleLike = async (postId: string) => {
        if (!currentUser) return;

        const { liked, error } = await toggleLike(postId, currentUser.id);
        if (error) {
            console.error("Like error:", error);
            return;
        }

        setPosts(posts.map(post =>
            post.id === postId
                ? {
                    ...post,
                    user_liked: liked,
                    likes_count: liked ? post.likes_count + 1 : post.likes_count - 1
                }
                : post
        ));
    }

    const handleShare = async (postId: string) => {
        const url = `${window.location.origin}/post/${postId}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }

    const isOwnProfile = !userId || userId === currentUser?.id
    const displayName = profile?.full_name || profile?.company_name || "User"
    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "??"
    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < 60) return "Just now"
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    if (isLoading) return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4">
            <Skeleton className="h-48 w-full rounded-xl mb-4" />
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
        </div>
    )

    if (!profile) return <div className="p-8 text-center">Profile not found.</div>

    const mediaPosts = posts.filter(p => p.image_url || p.video_url)

    return (
        <div className="w-full max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4 space-y-6">
            {/* Header / Cover */}
            <div className="relative mb-12 md:mb-16">
                <div className="h-32 md:h-48 w-full bg-gradient-to-r from-primary/20 to-secondary rounded-xl"></div>
                <div className="absolute -bottom-8 md:-bottom-12 left-4 md:left-8 flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-6">
                    <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-background shadow-lg">
                        <AvatarFallback className="text-2xl md:text-4xl bg-primary text-primary-foreground">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                        <p className="text-muted-foreground capitalize font-medium text-sm md:text-base">{profile.role}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span><strong>{profile.followers_count || 0}</strong> Followers</span>
                            <span><strong>{profile.following_count || 0}</strong> Following</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-8 md:-bottom-12 right-4 md:right-8 mb-2 flex gap-2 md:gap-3">
                    {isOwnProfile ? (
                        <Button size="sm" className="md:text-base">Edit Profile</Button>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant={isFollowing ? "outline" : "default"}
                                onClick={handleFollow}
                                className="gap-2"
                            >
                                {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                {isFollowing ? "Unfollow" : "Follow"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleMessage}
                                className="gap-2"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden md:inline">Message</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-8">
                {/* Sidebar Info */}
                <div className="space-y-4 md:space-y-6">
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold text-base md:text-lg">About</h3>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4 text-sm">
                            <p className="text-muted-foreground">
                                {profile.role} on the wAt platform.
                            </p>
                            {profile.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                            )}
                            {profile.industry_category && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-medium">Industry:</span>
                                    <span className="truncate">{profile.industry_category}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Posts/Media */}
                <div className="md:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center gap-4 md:gap-6 border-b pb-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`font-semibold pb-2 -mb-2.5 whitespace-nowrap ${activeTab === 'posts' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
                        >
                            Posts ({posts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`pb-2 whitespace-nowrap ${activeTab === 'media' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
                        >
                            Media ({mediaPosts.length})
                        </button>
                    </div>

                    {activeTab === 'posts' ? (
                        posts.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 md:p-8 text-center text-muted-foreground">
                                    <p>No posts yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {posts.map(post => (
                                    <Card key={post.id}>
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-sm">{displayName}</p>
                                                    <p className="text-xs text-muted-foreground">{getTimeAgo(post.created_at)}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2 space-y-3">
                                            {post.content && <p className="text-sm">{post.content}</p>}
                                            {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg max-h-96 object-cover" />}
                                            {post.video_url && <video src={post.video_url} controls className="w-full rounded-lg max-h-96" />}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`gap-2 ${post.user_liked ? 'text-red-500' : ''}`}
                                                    onClick={() => handleLike(post.id)}
                                                >
                                                    <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                                                    {post.likes_count || 0}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    {post.comments_count || 0}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-auto"
                                                    onClick={() => handleShare(post.id)}
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    ) : (
                        mediaPosts.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 md:p-8 text-center text-muted-foreground">
                                    <p>No media posts yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                                {mediaPosts.map(post => (
                                    <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-secondary cursor-pointer hover:opacity-80 transition-opacity">
                                        {post.image_url ? (
                                            <img src={post.image_url} alt="Media" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={post.video_url} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}
