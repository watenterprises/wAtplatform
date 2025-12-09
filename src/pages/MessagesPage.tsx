import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Avatar, AvatarFallback } from "../components/ui/avatar"
import { Send, ArrowLeft } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { getUserConversations, getMessages, sendMessage } from "../lib/messaging"

interface Conversation {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message_at: string;
    user1: any;
    user2: any;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender: any;
}

export default function MessagesPage() {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        if (user) {
            loadConversations()
        }
    }, [user])

    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id)
        }
    }, [selectedConversation])

    const loadConversations = async () => {
        if (!user) return
        setIsLoading(true)
        try {
            const data = await getUserConversations(user.id)
            setConversations(data)
        } catch (error) {
            console.error("Error loading conversations:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadMessages = async (conversationId: string) => {
        try {
            const data = await getMessages(conversationId)
            setMessages(data)
        } catch (error) {
            console.error("Error loading messages:", error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || !selectedConversation) return

        setIsSending(true)
        try {
            await sendMessage(selectedConversation.id, user.id, newMessage)
            setNewMessage("")
            await loadMessages(selectedConversation.id)
        } catch (error: any) {
            console.error("Error sending message:", error)
            alert("Failed to send message: " + error.message)
        } finally {
            setIsSending(false)
        }
    }

    const getOtherUser = (conversation: Conversation) => {
        if (!user) return null
        return conversation.user1_id === user.id ? conversation.user2 : conversation.user1
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
        <div className="w-full max-w-6xl mx-auto py-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
                {/* Conversations List */}
                <Card className="md:col-span-1 overflow-hidden flex flex-col">
                    <CardHeader className="p-4 border-b">
                        <h2 className="font-semibold text-lg">Messages</h2>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No conversations yet. Start chatting with someone!
                            </div>
                        ) : (
                            conversations.map(conversation => {
                                const otherUser = getOtherUser(conversation)
                                if (!otherUser) return null
                                const name = otherUser.full_name || otherUser.company_name

                                return (
                                    <div
                                        key={conversation.id}
                                        onClick={() => setSelectedConversation(conversation)}
                                        className={`p-4 border-b cursor-pointer hover:bg-secondary/50 ${selectedConversation?.id === conversation.id ? 'bg-secondary' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{name}</p>
                                                <p className="text-xs text-muted-foreground">{getTimeAgo(conversation.last_message_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Messages View */}
                <Card className="md:col-span-2 overflow-hidden flex flex-col">
                    {selectedConversation ? (
                        <>
                            <CardHeader className="p-4 border-b flex flex-row items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Avatar>
                                    <AvatarFallback>
                                        {getInitials(getOtherUser(selectedConversation)?.full_name || getOtherUser(selectedConversation)?.company_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">
                                        {getOtherUser(selectedConversation)?.full_name || getOtherUser(selectedConversation)?.company_name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {getOtherUser(selectedConversation)?.role}
                                    </p>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map(message => {
                                    const isOwn = message.sender_id === user?.id
                                    return (
                                        <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl px-4 py-2`}>
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                    {getTimeAgo(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>

                            <div className="p-4 border-t">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={isSending}
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="rounded-full"
                                        disabled={!newMessage.trim() || isSending}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Select a conversation to start messaging
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
