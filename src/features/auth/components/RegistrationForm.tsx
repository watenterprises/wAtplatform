import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/AuthContext"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { type UserRole } from "./RoleSelection"
import {
    type RegistrationFormData,
    manufacturerSchema,
    sellerSchema,
    buyerSchema,
    startupSchema,
    explorerSchema
} from "../schemas"
import { CATEGORY_OPTIONS } from "../constants"
import { Loader2 } from "lucide-react"

interface RegistrationFormProps {
    role: UserRole
}

export function RegistrationForm({ role }: RegistrationFormProps) {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Select the correct schema based on role
    const schema =
        role === 'manufacturer' ? manufacturerSchema :
            role === 'seller' ? sellerSchema :
                role === 'buyer' ? buyerSchema :
                    role === 'startup' ? startupSchema :
                        explorerSchema

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: role
        } as any // Forced cast because role is a literal
    })


    const { signup } = useAuth()

    const onSubmit = async (data: RegistrationFormData) => {
        setIsSubmitting(true)
        try {
            // Register user via context (Supabase)
            await signup(data, data.password)
            navigate('/feed') // Redirect to feed after signup
        } catch (error: any) {
            console.error("Registration failed:", error)
            alert("Registration failed: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper to render basic fields
    const renderField = (name: keyof RegistrationFormData, label: string, type: string = "text", placeholder: string = "") => (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                type={type}
                placeholder={placeholder}
                {...register(name as any)}
            />
            {errors[name] && (
                <p className="text-sm text-destructive">{errors[name]?.message}</p>
            )}
        </div>
    )

    // Helper for Select fields
    const renderSelect = (name: string, label: string, options: string[], placeholder: string) => (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register(name as any)}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="custom">Other (Add Custom)</option>
            </select>
            {errors[name as keyof RegistrationFormData] && (
                <p className="text-sm text-destructive">{(errors as any)[name]?.message}</p>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader className="px-0">
                <CardTitle>Complete your profile</CardTitle>
                <CardDescription>
                    Enter your details to join as a <span className="font-semibold text-primary capitalize">{role}</span>.
                </CardDescription>
            </CardHeader>

            <CardContent className="px-0 space-y-4">
                {/* Common Fields */}
                {role === 'buyer' || role === 'explorer' ? (
                    renderField("fullName" as any, "Full Name", "text", "John Doe")
                ) : (
                    renderField("companyName" as any, "Company Name", "text", "Acme Inc.")
                )}

                {renderField("email", "Email Address", "email", "john@example.com")}
                {renderField("phone", "Phone Number", "tel", "+1 234 567 890")}
                {renderField("address" as any, "Address", "text", "123 Business St, City")}

                {/* Role Specific Fields */}
                {role === 'manufacturer' && (
                    <>
                        {renderSelect("industryCategory", "Main Industry", CATEGORY_OPTIONS.manufacturer.industries, "Select Industry")}
                        {/* Logic for Subcategory depending on Industry selection could go here - simplified for now */}
                        <div className="space-y-2">
                            <Label>Subcategory</Label>
                            <Input placeholder="e.g. Clothing (or type custom)" {...register("subcategory" as any)} />
                            {(errors as any).subcategory && (
                                <p className="text-sm text-destructive">{(errors as any).subcategory?.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Specialization</Label>
                            <Input placeholder="e.g. Industrial Fabrics" {...register("specialization" as any)} />
                        </div>
                    </>
                )}

                {role === 'seller' && (
                    <>
                        {renderSelect("industryCategory", "Main Category", CATEGORY_OPTIONS.seller.industries, "Select Category")}
                        <div className="space-y-2">
                            <Label>Subcategory (e.g. Online Retail)</Label>
                            <Input {...register("subcategory" as any)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Specialization (e.g. Electronics)</Label>
                            <Input {...register("specialization" as any)} />
                        </div>
                    </>
                )}

                {role === 'startup' && (
                    <>
                        {renderSelect("industryCategory", "Industry", CATEGORY_OPTIONS.startup.industries, "Select Industry")}
                        <div className="space-y-2">
                            <Label>Subcategory (e.g. SaaS)</Label>
                            <Input {...register("subcategory" as any)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Specialization (e.g. AI Models)</Label>
                            <Input {...register("specialization" as any)} />
                        </div>
                    </>
                )}

                {role === 'buyer' && (
                    <>
                        {renderSelect("interestCategory", "Primary Interest", CATEGORY_OPTIONS.buyer.interests, "Select Interest")}
                        <div className="space-y-2">
                            <Label>Specific Interests</Label>
                            <Input placeholder="e.g. Bulk textiles" {...register("specificInterests" as any)} />
                        </div>
                    </>
                )}

                {/* Explorer only needs basic info which is already covered (Name, Email, Phone, Address) */}

                <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderField("password" as any, "Password", "password", "********")}
                        {renderField("confirmPassword" as any, "Confirm Password", "password", "********")}
                    </div>
                </div>

            </CardContent>

            <CardFooter className="px-0">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
            </CardFooter>
        </form>
    )
}
