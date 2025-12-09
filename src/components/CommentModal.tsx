import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { X, Send } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { addComment, getComments } from "../lib/api"

interface Comment {
    id: string;
    content: string;
    created_at: string;
    profiles: {
        full_name: string;
        company_name: string;
        avatar_url: string;
        role: string;
    }
}

interface CommentModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    onCommentAdded: () => void;
}

export default function CommentModal({ postId, isOpen, onClose, onCommentAdded }: CommentModalProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadComments()
        }
    }, [isOpen, postId])

    const loadComments = async () => {
        setIsLoading(true)
        try {
            const data = await getComments(postId)
            setComments(data)
        } catch (error) {
            console.error("Error loading comments:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !user) return

        setIsSubmitting(true)
        try {
            await addComment(postId, user.id, newComment)
            setNewComment("")
            await loadComments()
            onCommentAdded()
        } catch (error: any) {
            console.error("Error adding comment:", error)
            alert("Failed to add comment: " + error.message)
        } finally {
            setIsSubmitting(false)
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">Comments</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="text-center p-8 text-muted-foreground">Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No comments yet. Be the first to comment!
                        </div>
                    ) : (
                        comments.map(comment => {
                            const authorName = comment.profiles?.full_name || comment.profiles?.company_name || "Unknown User"
                            const authorInitials = getInitials(authorName)

                            return (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{authorName}</span>
                                            <span className="text-xs text-muted-foreground">{getTimeAgo(comment.created_at)}</span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.content}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>

                <div className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{user?.avatar || "ME"}</AvatarFallback>
                        </Avatar>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isSubmitting}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            className="rounded-full"
                            disabled={!newComment.trim() || isSubmitting}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
