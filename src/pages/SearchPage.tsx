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
        <div className="w-full max-w-4xl mx-auto py-4 md:py-6 px-3 md:px-4 space-y-4 md:space-y-6 animate-fadeIn">
            <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Search</h1>

                {/* Premium Search Input */}
                <div className="relative glass-card rounded-2xl p-1 shadow-premium transition-smooth hover:shadow-premium-lg">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for posts or people..."
                        className="w-full pl-12 pr-12 py-3 md:py-4 rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:text-base transition-smooth"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-smooth"
                        >
                            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>

                {/* Premium Toggle Tabs */}
                <div className="flex items-center justify-center">
                    <div className="glass p-1.5 rounded-xl flex items-center gap-1 shadow-premium">
                        <Button
                            variant={activeTab === 'posts' ? 'default' : 'ghost'}
                            size="sm"
                            className={`text-sm rounded-lg px-6 md:px-8 transition-smooth ${activeTab === 'posts' ? 'shadow-md' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            Posts
                        </Button>
                        <Button
                            variant={activeTab === 'profiles' ? 'default' : 'ghost'}
                            size="sm"
                            className={`text-sm rounded-lg px-6 md:px-8 transition-smooth ${activeTab === 'profiles' ? 'shadow-md' : ''}`}
                            onClick={() => setActiveTab('profiles')}
                        >
                            Profiles
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="text-center p-12 text-muted-foreground">
                    <div className="animate-pulse">Searching...</div>
                </div>
            ) : !query.trim() ? (
                <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground shadow-premium">
                    <SearchIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Start typing to search for {activeTab}</p>
                </div>
            ) : activeTab === 'posts' ? (
                posts.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground shadow-premium">
                        <p>No posts found</p>
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        {posts.map(post => (
                            <Card key={post.id} className="glass-card hover-lift animate-slideUp overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-3 md:gap-4 p-3 md:p-4 pb-2">
                                    <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-primary/20">
                                        <AvatarFallback className="bg-gradient-primary text-white">
                                            {getInitials(post.profiles?.full_name || post.profiles?.company_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-semibold text-sm md:text-base truncate">{post.profiles?.full_name || post.profiles?.company_name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{post.profiles?.role}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 md:p-4 pt-2 space-y-3">
                                    {post.content && <p className="text-sm md:text-base leading-relaxed">{post.content}</p>}
                                    {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-xl max-h-96 object-cover shadow-md" />}
                                    {post.video_url && <video src={post.video_url} controls className="w-full rounded-xl max-h-96 shadow-md" />}

                                    <div className="flex items-center gap-3 md:gap-4 text-sm text-muted-foreground pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`gap-2 transition-smooth hover-scale ${post.user_liked ? 'text-red-500' : ''}`}
                                            onClick={() => handleLike(post.id)}
                                        >
                                            <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
                                            <span className="hidden sm:inline">{post.likes_count || 0}</span>
                                        </Button>
                                        <Button variant="ghost" size="sm" className="gap-2 transition-smooth hover-scale">
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="hidden sm:inline">{post.comments_count || 0}</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                profiles.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground shadow-premium">
                        <p>No profiles found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {profiles.map(profile => (
                            <Card key={profile.id} className="glass-card hover-lift animate-slideUp">
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-primary/20">
                                            <AvatarFallback className="text-base md:text-lg bg-gradient-primary text-white">
                                                {getInitials(profile.full_name || profile.company_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base md:text-lg truncate">{profile.full_name || profile.company_name}</h3>
                                            <p className="text-sm text-muted-foreground capitalize truncate">{profile.role}</p>
                                            {profile.industry_category && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{profile.industry_category}</p>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate(`/profile/${profile.id}`)}
                                            className="shrink-0 transition-smooth hover-scale"
                                        >
                                            View
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
