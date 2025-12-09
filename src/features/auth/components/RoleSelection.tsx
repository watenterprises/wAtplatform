import { Card, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Building2, ShoppingBag, User, Rocket, Compass, Check } from "lucide-react"
import { cn } from "../../../lib/utils"

export type UserRole = 'manufacturer' | 'seller' | 'buyer' | 'startup' | 'explorer'

interface RoleSelectionProps {
    selectedRole: UserRole | null
    onSelect: (role: UserRole) => void
}

const roles = [
    {
        id: 'manufacturer',
        title: 'Manufacturer',
        description: 'Producers of goods looking for sellers and buyers.',
        icon: Building2
    },
    {
        id: 'seller',
        title: 'Seller',
        description: 'Retailers and distributors selling products.',
        icon: ShoppingBag
    },
    {
        id: 'buyer',
        title: 'Buyer',
        description: 'Individuals or businesses looking to purchase goods.',
        icon: User
    },
    {
        id: 'startup',
        title: 'Startup',
        description: 'New businesses seeking visibility and connections.',
        icon: Rocket
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Discovering new products, trends, and industries.',
        icon: Compass
    }
] as const

export function RoleSelection({ selectedRole, onSelect }: RoleSelectionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                return (
                    <Card
                        key={role.id}
                        className={cn(
                            "cursor-pointer transition-all hover:border-primary",
                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:shadow-md"
                        )}
                        onClick={() => onSelect(role.id as UserRole)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Icon className={cn("h-8 w-8 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                                {isSelected && <Check className="h-5 w-5 text-primary" />}
                            </div>
                            <CardTitle>{role.title}</CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                        </CardHeader>
                    </Card>
                )
            })}
        </div>
    )
}
