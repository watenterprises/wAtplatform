import { Outlet, NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
    Home,
    Search,
    Compass,
    Bell,
    MessageSquare,
    PlusSquare,
    User,
    Settings,
    HelpCircle,
    Share2
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { cn } from "../lib/utils"

export default function DashboardLayout() {
    const { user } = useAuth()
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">

            {/* LEFT SIDEBAR - Navigation */}
            <aside className="hidden md:flex flex-col w-64 border-r h-screen sticky top-0 p-4 space-y-6">
                <div className="px-4">
                    <h1 className="text-3xl font-bold tracking-tighter">wAt</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem to="/feed" icon={Home} label="Home" />
                    <NavItem to="/search" icon={Search} label="Search" />
                    <NavItem to="/explore" icon={Compass} label="Explore" />
                    <NavItem to="/notifications" icon={Bell} label="Notifications" />
                    <NavItem to="/messages" icon={MessageSquare} label="Messages" />
                    <NavItem to="/create" icon={PlusSquare} label="Create" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </nav>

                <div className="space-y-4 px-4">
                    <div className="p-4 rounded-xl bg-secondary/30 border space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                {user?.avatar || "ME"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium truncate text-sm">{user?.name || "Guest User"}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role || "Visitor"}</p>
                            </div>
                        </div>
                        <Button className="w-full font-bold bg-primary hover:bg-primary/90 shadow-lg text-xs h-9">
                            Show Your Work
                        </Button>
                    </div>
                </div>

                <nav className="space-y-1 pt-4 border-t">
                    <NavItem to="/invite" icon={Share2} label="Invite" />
                    <NavItem to="/settings" icon={Settings} label="Settings" />
                    <NavItem to="/help" icon={HelpCircle} label="Help" />
                </nav>
            </aside>

            {/* CENTER - Feed / Main Content */}
            <main className="flex-1 min-w-0 border-r">
                {/* Mobile Header could go here */}
                <Outlet />
            </main>

            {/* RIGHT SIDEBAR - Widgets */}
            <aside className="hidden lg:block w-80 p-6 space-y-8 sticky top-0 h-screen overflow-y-auto">

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search posts, businesses..." className="pl-9 rounded-full bg-secondary/50 border-none" />
                </div>

                {/* Showing Recent Searches (Mock) */}
                <div>
                    <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Recent Searches</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center justify-between cursor-pointer hover:text-primary">
                            <span>Textile Manufacturers</span>
                        </li>
                        <li className="flex items-center justify-between cursor-pointer hover:text-primary">
                            <span>Sustainable Packaging</span>
                        </li>
                    </ul>
                </div>

                {/* Popular Categories */}
                <div className="bg-card rounded-xl border p-4 shadow-sm">
                    <h3 className="font-semibold mb-3">Popular Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {["Electronics", "Startups", "Green Energy", "Fashion", "SaaS"].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full cursor-pointer hover:opacity-80">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Trending / Suggested */}
                <div>
                    <h3 className="font-semibold mb-3">Suggested for you</h3>
                    <div className="space-y-4">
                        {/* Mock suggested items */}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            <div className="text-sm">
                                <p className="font-medium">TechStart Solutions</p>
                                <p className="text-muted-foreground text-xs">Software Development</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto h-8">Follow</Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                            <div className="text-sm">
                                <p className="font-medium">Global Fabrics</p>
                                <p className="text-muted-foreground text-xs">Textile Manufacturer</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto h-8">Follow</Button>
                        </div>
                    </div>
                </div>

            </aside>

        </div>
    )
}

function NavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                isActive ? "bg-secondary text-primary font-semibold" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </NavLink>
    )
}
