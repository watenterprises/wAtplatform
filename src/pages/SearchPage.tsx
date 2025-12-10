import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Search as SearchIcon, X } from "lucide-react"
import { searchPosts, searchProfiles } from "../lib/messaging"
import { Heart, MessageCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { toggleLike, checkUserLiked } from "../lib/api"

export default function SearchPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [activeTab, setActiveTab] = useState<'posts' | 'profiles'>('posts')
    const [posts, setPosts] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleSearch = async () => {
        if (!query.trim()) return

        setIsLoading(true)
        try {
            if (activeTab === 'posts') {
                const data = await searchPosts(query)
                // Check which posts user has liked
                if (user && data) {
                    const postsWithLikes = await Promise.all(
                        data.map(async (post) => ({
                            ...post,
                            user_liked: await checkUserLiked(post.id, user.id)
                        }))
                    );
                    setPosts(postsWithLikes);
                } else {
                    setPosts(data)
                }
            } else {
                const data = await searchProfiles(query)
                setProfiles(data)
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (query.trim()) {
            const debounce = setTimeout(() => {
                handleSearch()
            }, 500)
            return () => clearTimeout(debounce)
        } else {
            setPosts([])
            setProfiles([])
        }
    }, [query, activeTab])

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

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "??"

    return (
        <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Search</h1>

                {/* Search Input */}
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for posts or people..."
                        className="w-full pl-10 pr-10 py-3 rounded-full border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                {/* Toggle Tabs */}
                <div className="flex items-center justify-center">
                    <div className="bg-secondary/50 p-1 rounded-lg flex items-center gap-1">
                        <Button
                            variant={activeTab === 'posts' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`text-sm rounded-md px-6 ${activeTab === 'posts' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            Posts
                        </Button>
                        <Button
                            variant={activeTab === 'profiles' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`text-sm rounded-md px-6 ${activeTab === 'profiles' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('profiles')}
                        >
                            Profiles
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="text-center p-12 text-muted-foreground">Searching...</div>
            ) : !query.trim() ? (
                <div className="text-center p-12 text-muted-foreground">
                    Start typing to search for {activeTab}
                </div>
            ) : activeTab === 'posts' ? (
                posts.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">No posts found</div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <Card key={post.id}>
                                <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(post.profiles?.full_name || post.profiles?.company_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{post.profiles?.full_name || post.profiles?.company_name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{post.profiles?.role}</span>
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
                                            <MessageCircle className="h-4 w-4" />
                                            {post.comments_count || 0}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                profiles.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">No profiles found</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profiles.map(profile => (
                            <Card key={profile.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarFallback className="text-lg">{getInitials(profile.full_name || profile.company_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{profile.full_name || profile.company_name}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
                                            {profile.industry_category && (
                                                <p className="text-xs text-muted-foreground mt-1">{profile.industry_category}</p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/profile/${profile.id}`)}
                                        >
                                            View Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}
