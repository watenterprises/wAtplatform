import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"

export default function ProfilePage() {
    const { userId } = useParams<{ userId?: string }>()
    const { user: currentUser } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadProfile()
    }, [userId, currentUser])

    const loadProfile = async () => {
        setIsLoading(true)
        try {
            // If userId is provided in URL, fetch that user's profile
            // Otherwise, show current user's profile
            const targetUserId = userId || currentUser?.id

            if (!targetUserId) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error("Error loading profile:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const isOwnProfile = !userId || userId === currentUser?.id
    const displayName = profile?.full_name || profile?.company_name || "User"
    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "??"

    if (isLoading) return <div className="p-8 text-center">Loading profile...</div>
    if (!profile) return <div className="p-8 text-center">Profile not found.</div>

    return (
        <div className="w-full max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4 space-y-6">
            {/* Header / Cover */}
            <div className="relative mb-12 md:mb-16">
                <div className="h-32 md:h-48 w-full bg-gradient-to-r from-primary/20 to-secondary rounded-xl"></div>
                <div className="absolute -bottom-8 md:-bottom-12 left-4 md:left-8 flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-6">
                    <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-background shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-2xl md:text-4xl bg-primary text-primary-foreground">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                        <p className="text-muted-foreground capitalize font-medium text-sm md:text-base">{profile.role}</p>
                    </div>
                </div>
                {isOwnProfile && (
                    <div className="absolute -bottom-8 md:-bottom-12 right-4 md:right-8 mb-2 flex gap-2 md:gap-3">
                        <Button size="sm" className="md:text-base">Edit Profile</Button>
                        <Button variant="outline" size="sm" className="hidden md:inline-flex">Share</Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-8">
                {/* Sidebar Info */}
                <div className="space-y-4 md:space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">About</CardTitle>
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
                                    <LinkIcon className="h-4 w-4 flex-shrink-0" />
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

                {/* Main Content Tabs */}
                <div className="md:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center gap-4 md:gap-6 border-b pb-2 overflow-x-auto">
                        <button className="font-semibold border-b-2 border-primary pb-2 -mb-2.5 whitespace-nowrap">Posts</button>
                        <button className="text-muted-foreground hover:text-foreground pb-2 whitespace-nowrap">Media</button>
                        <button className="text-muted-foreground hover:text-foreground pb-2 whitespace-nowrap">Network</button>
                    </div>

                    <Card>
                        <CardContent className="p-6 md:p-8 text-center text-muted-foreground">
                            <p>No recent activity to show.</p>
                            {isOwnProfile && (
                                <Button variant="link" className="mt-2">Create your first post</Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
