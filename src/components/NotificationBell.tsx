import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { useAuth } from "../context/AuthContext"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from "../lib/messaging"
import { useNavigate } from "react-router-dom"

interface Notification {
    id: string;
    type: string;
    content: string;
    related_id: string;
    read: boolean;
    created_at: string;
    actor: {
        full_name: string;
        company_name: string;
        avatar_url: string;
    };
}

export default function NotificationBell() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (user) {
            loadNotifications()
            loadUnreadCount()

            // Poll for new notifications every 30 seconds
            const interval = setInterval(() => {
                loadUnreadCount()
            }, 30000)

            return () => clearInterval(interval)
        }
    }, [user])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadNotifications = async () => {
        if (!user) return
        try {
            const data = await getNotifications(user.id)
            setNotifications(data || [])
        } catch (error) {
            console.error("Error loading notifications:", error)
        }
    }

    const loadUnreadCount = async () => {
        if (!user) return
        try {
            const count = await getUnreadNotificationCount(user.id)
            setUnreadCount(count)
        } catch (error) {
            console.error("Error loading unread count:", error)
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await markNotificationAsRead(notification.id)
            setNotifications(notifications.map(n =>
                n.id === notification.id ? { ...n, read: true } : n
            ))
            setUnreadCount(Math.max(0, unreadCount - 1))

            // Navigate based on notification type
            if (notification.type === 'follow') {
                navigate(`/profile/${notification.related_id}`)
            } else if (notification.type === 'like' || notification.type === 'comment') {
                navigate('/feed')
            } else if (notification.type === 'message') {
                navigate('/messages')
            }

            setIsOpen(false)
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!user) return
        try {
            await markAllNotificationsAsRead(user.id)
            setNotifications(notifications.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

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

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "??"

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <Card className="absolute right-0 top-12 w-80 md:w-96 max-h-[500px] overflow-hidden shadow-premium-lg z-50 animate-scaleIn">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 border-b cursor-pointer hover:bg-secondary/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>
                                                {getInitials(notification.actor?.full_name || notification.actor?.company_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                {notification.content}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {getTimeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
