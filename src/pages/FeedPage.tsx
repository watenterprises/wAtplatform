import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Image, Video, FileText, Heart, MessageCircle, Share2, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import { Skeleton } from "../components/ui/skeleton"
import { uploadMedia, toggleLike, checkUserLiked } from "../lib/api"
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

export default function FeedPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [posts, setPosts] = useState<Post[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'feed' | 'requests'>('feed')
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [newRequest, setNewRequest] = useState({ title: "", description: "", budget: "" })

    const [newPostContent, setNewPostContent] = useState("")
    const [isPosting, setIsPosting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [feedError, setFeedError] = useState("")
    const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
    const [uploadingMedia, setUploadingMedia] = useState(false)

    const [commentModalOpen, setCommentModalOpen] = useState(false)
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

    useEffect(() => {
        if (activeTab === 'feed') fetchPosts()
        if (activeTab === 'requests') fetchRequests()
    }, [activeTab])

    const fetchPosts = async () => {
        setIsLoading(true)
        setFeedError("")
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
    *,
    profiles(full_name, company_name, role, avatar_url)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Check which posts the user has liked
            if (user && data) {
                const postsWithLikes = await Promise.all(
                    data.map(async (post) => ({
                        ...post,
                        user_liked: await checkUserLiked(post.id, user.id)
                    }))
                );
                setPosts(postsWithLikes);
            } else {
                setPosts(data || [])
            }
        } catch (error: any) {
            console.error("Error fetching posts:", error)
            setFeedError("Failed to load feed. " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchRequests = async () => {
        setIsLoading(true)
        setFeedError("")
        try {
            const { data, error } = await supabase
                .from('requests')
                .select(`
    *,
    profiles(full_name, company_name, role, avatar_url)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRequests(data || [])
        } catch (error: any) {
            console.error("Error fetching requests:", error)
            setFeedError("Failed to load requests. " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateRequest = async () => {
        if (!newRequest.title.trim() || !user) return;
        setIsPosting(true)
        try {
            const { error } = await supabase.from('requests').insert([{
                user_id: user.id,
                title: newRequest.title,
                description: newRequest.description,
                budget_range: newRequest.budget,
                status: 'open'
            }])
            if (error) throw error

            setNewRequest({ title: "", description: "", budget: "" })
            setShowRequestForm(false)
            fetchRequests()
        } catch (error: any) {
            alert("Error creating request: " + error.message)
        } finally {
            setIsPosting(false)
        }
    }

    const handlePost = async () => {
        if ((!newPostContent.trim() && !selectedMedia) || !user) return;
        setIsPosting(true)

        try {
            let imageUrl = null;
            let videoUrl = null;
            let mediaType = 'text';

            // Upload media if selected
            if (selectedMedia) {
                setUploadingMedia(true);
                const uploadedUrl = await uploadMedia(selectedMedia);

                if (!uploadedUrl) {
                    throw new Error("Failed to upload media");
                }

                if (selectedMedia.type.startsWith('image/')) {
                    imageUrl = uploadedUrl;
                    mediaType = 'image';
                } else if (selectedMedia.type.startsWith('video/')) {
                    videoUrl = uploadedUrl;
                    mediaType = 'video';
                }
                setUploadingMedia(false);
            }

            const { error } = await supabase
                .from('posts')
                .insert([
                    {
                        user_id: user.id,
                        content: newPostContent || null,
                        image_url: imageUrl,
                        video_url: videoUrl,
                        media_type: mediaType
                    }
                ])

            if (error) throw error

            setNewPostContent("")
            setSelectedMedia(null)
            fetchPosts() // Refresh feed
        } catch (error: any) {
            console.error("Error creating post:", error)
            alert("Failed to post: " + error.message)
        } finally {
            setIsPosting(false)
            setUploadingMedia(false)
        }
    }

    const handleLike = async (postId: string) => {
        if (!user) return;

        const { liked, error } = await toggleLike(postId, user.id);
        if (error) {
            console.error("Like error:", error);
            return;
        }

        // Update the post in local state
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
        <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">

            {/* Create Post Widget */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>{user?.avatar || "ME"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share your latest update, product, or need..."
                                className="w-full bg-transparent border-none focus:outline-none py-2 text-lg placeholder:text-muted-foreground/70"
                            />
                        </div>
                    </div>

                    {/* Media Preview */}
                    {selectedMedia && (
                        <div className="mt-4 relative">
                            {selectedMedia.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(selectedMedia)}
                                    alt="Preview"
                                    className="max-h-64 rounded-lg"
                                />
                            ) : (
                                <video
                                    src={URL.createObjectURL(selectedMedia)}
                                    controls
                                    className="max-h-64 rounded-lg"
                                />
                            )}
                            <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2"
                                onClick={() => setSelectedMedia(null)}
                            >
                                Remove
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files && setSelectedMedia(e.target.files[0])}
                            />
                            <input
                                type="file"
                                id="video-upload"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => e.target.files && setSelectedMedia(e.target.files[0])}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => document.getElementById('image-upload')?.click()}
                                type="button"
                            >
                                <Image className="h-4 w-4 mr-2" />
                                Photo
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => document.getElementById('video-upload')?.click()}
                                type="button"
                            >
                                <Video className="h-4 w-4 mr-2" />
                                Video
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <FileText className="h-4 w-4 mr-2" />
                                Article
                            </Button>
                        </div>
                        <Button size="sm" className="rounded-full px-6" onClick={handlePost} disabled={(!newPostContent.trim() && !selectedMedia) || isPosting || uploadingMedia}>
                            {isPosting || uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Feed Divider / Tabs */}
            <div className="flex items-center justify-center py-2">
                <div className="bg-secondary/50 p-1 rounded-lg flex items-center gap-1">
                    <Button
                        variant={activeTab === 'feed' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`text-sm rounded-md px-6 ${activeTab === 'feed' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('feed')}
                    >
                        Feed
                    </Button>
                    <Button
                        variant={activeTab === 'requests' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`text-sm rounded-md px-6 ${activeTab === 'requests' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Marketplace Requests
                    </Button>
                </div>
            </div>

            {/* ERROR DISPLAY */}
            {feedError && <div className="text-destructive text-center text-sm">{feedError}</div>}

            {/* REQUESTS VIEW */}
            {activeTab === 'requests' && (
                <div className="space-y-6">
                    <Card className="border-dashed border-2 bg-secondary/10">
                        <CardContent className="p-6 text-center space-y-4">
                            <h3 className="font-semibold text-lg">Looking for something specific?</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                Post a Data Request (RFQ) to let suppliers and partners know exactly what you need.
                                Match with verified businesses.
                            </p>
                            <Button onClick={() => setShowRequestForm(!showRequestForm)}>
                                {showRequestForm ? "Cancel Request" : "Create New Request"}
                            </Button>
                        </CardContent>
                    </Card>

                    {showRequestForm && (
                        <Card className="animate-in fade-in slide-in-from-top-4">
                            <CardHeader><h3 className="font-semibold">New Data Request</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title (What are you looking for?)</label>
                                    <input
                                        className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="e.g. Bulk Organic Cotton Supplier needed"
                                        value={newRequest.title}
                                        onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description (Details, Quantity, Specs)</label>
                                    <textarea
                                        className="w-full flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="Specific requirements..."
                                        value={newRequest.description}
                                        onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Budget Range</label>
                                    <input
                                        className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        placeholder="e.g. $5,000 - $10,000"
                                        value={newRequest.budget}
                                        onChange={e => setNewRequest({ ...newRequest, budget: e.target.value })}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleCreateRequest} disabled={isPosting || !newRequest.title}>
                                    {isPosting ? "Posting..." : "Publish Request"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Request Stream */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 w-full">
                                                <Skeleton className="h-6 w-3/4" />
                                                <Skeleton className="h-4 w-1/4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <div className="flex items-center gap-3 pt-4 border-t">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-8 w-20 ml-auto" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No active requests found.</div>
                    ) : (
                        requests.map(req => (
                            <Card key={req.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-primary">{req.title}</h4>
                                            <p className="text-sm text-muted-foreground">Budget: {req.budget_range || "Negotiable"}</p>
                                        </div>
                                        <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground capitalize">
                                            {req.status}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm">{req.description}</p>
                                    <div className="flex items-center gap-3 pt-4 border-t">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{getInitials(req.profiles?.full_name || req.profiles?.company_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-xs text-muted-foreground">
                                            Requested by <span className="font-medium text-foreground">{req.profiles?.full_name || req.profiles?.company_name}</span>
                                            <span className="mx-1">•</span>
                                            {getTimeAgo(req.created_at)}
                                        </div>
                                        <Button size="sm" variant="outline" className="ml-auto">Contact</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* FEED VIEW */}
            {activeTab === 'feed' && (
                <>

                    {/* Posts Stream */}
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex flex-col space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 space-y-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                        <div className="flex items-center gap-4 pt-2 border-t mt-2">
                                            <Skeleton className="h-8 w-16" />
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No posts yet. Be the first to verify the DB works!</div>
                    ) : (
                        posts.map(post => {
                            const authorName = post.profiles?.full_name || post.profiles?.company_name || "Unknown User"
                            const authorInitials = getInitials(authorName)

                            return (
                                <Card key={post.id}>
                                    <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                                        <div
                                            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                            onClick={() => navigate(`/profile/${post.user_id}`)}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>{authorInitials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{authorName}</span>
                                                <span className="text-xs text-muted-foreground capitalize">{post.profiles?.role}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{getTimeAgo(post.created_at)}</span>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 space-y-3">
                                        {post.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>}

                                        {/* Display Image */}
                                        {post.image_url && (
                                            <img
                                                src={post.image_url}
                                                alt="Post media"
                                                className="w-full rounded-lg max-h-96 object-cover"
                                            />
                                        )}

                                        {/* Display Video */}
                                        {post.video_url && (
                                            <video
                                                src={post.video_url}
                                                controls
                                                className="w-full rounded-lg max-h-96"
                                            />
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t mt-2">
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
                                                <MessageCircle className="h-4 w-4" />
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
                            )
                        })
                    )}
                </>
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
