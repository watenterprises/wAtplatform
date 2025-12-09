import { type LucideIcon, Construction } from "lucide-react"

interface PlaceholderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

export default function PlaceholderPage({ title, description = "This feature is under development.", icon: Icon = Construction }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center p-8 text-muted-foreground">
            <div className="bg-secondary/50 p-6 rounded-full mb-6">
                <Icon className="h-12 w-12 opacity-50" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="max-w-md">{description}</p>
        </div>
    )
}
