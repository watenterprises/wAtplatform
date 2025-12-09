import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react"

export default function ProfilePage() {
    const { user } = useAuth()

    if (!user) return <div className="p-8 text-center">Please log in to view profile.</div>

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-6">
            {/* Header / Cover */}
            <div className="relative mb-16">
                <div className="h-48 w-full bg-gradient-to-r from-primary/20 to-secondary rounded-xl"></div>
                <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{user.avatar || "ME"}</AvatarFallback>
                    </Avatar>
                    <div className="mb-2">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-muted-foreground capitalize font-medium">{user.role}</p>
                    </div>
                </div>
                <div className="absolute -bottom-12 right-8 mb-2 flex gap-3">
                    <Button>Edit Profile</Button>
                    <Button variant="outline">Share</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">About</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <p className="text-muted-foreground">
                                Innovative {user.role} focused on sustainable growth and connecting with like-minded businesses.
                            </p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>San Francisco, CA</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LinkIcon className="h-4 w-4" />
                                <span className="text-primary hover:underline cursor-pointer">website.com</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Joined December 2024</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-6 border-b pb-2">
                        <button className="font-semibold border-b-2 border-primary pb-2 -mb-2.5">Posts</button>
                        <button className="text-muted-foreground hover:text-foreground pb-2">Media</button>
                        <button className="text-muted-foreground hover:text-foreground pb-2">Network</button>
                    </div>

                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>No recent activity to show.</p>
                            <Button variant="link" className="mt-2">Create your first post</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
