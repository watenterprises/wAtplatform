import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { Skeleton } from "../components/ui/skeleton"
import { getExplorePosts, toggleLike, checkUserLiked } from "../lib/api"
import CommentModal from "../components/CommentModal"

interface Post {
    id: string;
    content: string;
    media_type: string;
    image_url?: string;
    video_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_liked?: boolean;
    user_id: string;
    profiles: {
        full_name: string;
        company_name: string;
        role: string;
        avatar_url: string;
    }
}

export default function ExplorePage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
    const [commentModalOpen, setCommentModalOpen] = useState(false)
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

    useEffect(() => {
        fetchPosts()
    }, [filter])

    const fetchPosts = async () => {
        setIsLoading(true)
        try {
            const data = await getExplorePosts(50, 0)

            // Filter by media type
            let filteredData = data;
            if (filter === 'image') {
                filteredData = data.filter(p => p.image_url)
            } else if (filter === 'video') {
                filteredData = data.filter(p => p.video_url)
            }

            // Check which posts the user has liked
            if (user && filteredData) {
                const postsWithLikes = await Promise.all(
                    filteredData.map(async (post) => ({
                        ...post,
                        user_liked: await checkUserLiked(post.id, user.id)
                    }))
                );
                setPosts(postsWithLikes);
            } else {
                setPosts(filteredData || [])
            }
        } catch (error: any) {
            console.error("Error fetching explore posts:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLike = async (postId: string) => {
        if (!user) return;

        const { liked, error } = await toggleLike(postId, user.id);
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

    return (
        <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Explore</h1>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('image')}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Photos
                    </Button>
                    <Button
                        variant={filter === 'video' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('video')}
                    >
                        <VideoIcon className="h-4 w-4 mr-2" />
                        Videos
                    </Button>
                </div>
            </div>

            {/* Posts Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-2">
                                <Skeleton className="h-48 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                    No posts found. Try changing the filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map(post => {
                        const authorName = post.profiles?.full_name || post.profiles?.company_name || "Unknown User"
                        const authorInitials = getInitials(authorName)

                        return (
                            <Card key={post.id} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => navigate(`/profile/${post.user_id}`)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">{authorName}</span>
                                            <span className="text-xs text-muted-foreground">{getTimeAgo(post.created_at)}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Display Image */}
                                    {post.image_url && (
                                        <img
                                            src={post.image_url}
                                            alt="Post media"
                                            className="w-full h-64 object-cover"
                                        />
                                    )}

                                    {/* Display Video */}
                                    {post.video_url && (
                                        <video
                                            src={post.video_url}
                                            controls
                                            className="w-full h-64 object-cover"
                                        />
                                    )}

                                    <div className="p-4 space-y-2">
                                        {post.content && (
                                            <p className="text-sm line-clamp-2">{post.content}</p>
                                        )}

                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`gap-1 h-8 px-2 ${post.user_liked ? 'text-red-500' : ''}`}
                                                onClick={() => handleLike(post.id)}
                                            >
                                                <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                                                {post.likes_count || 0}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 h-8 px-2"
                                                onClick={() => {
                                                    setSelectedPostId(post.id)
                                                    setCommentModalOpen(true)
                                                }}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                {post.comments_count || 0}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto h-8 px-2"
                                                onClick={() => handleShare(post.id)}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Comment Modal */}
            {selectedPostId && (
                <CommentModal
                    postId={selectedPostId}
                    isOpen={commentModalOpen}
                    onClose={() => {
                        setCommentModalOpen(false)
                        setSelectedPostId(null)
                    }}
                    onCommentAdded={() => {
                        fetchPosts()
                    }}
                />
            )}
        </div>
    )
}
