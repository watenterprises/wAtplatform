import { useState } from "react"
import { Button } from "../../components/ui/button"
import { RoleSelection, type UserRole } from "../../features/auth/components/RoleSelection"
import { RegistrationForm } from "../../features/auth/components/RegistrationForm"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function RegisterPage() {
    const [step, setStep] = useState<1 | 2>(1)
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
    const navigate = useNavigate()

    const handleContinue = () => {
        if (selectedRole) {
            setStep(2)
        }
    }

    const handleBack = () => {
        if (step === 2) {
            setStep(1)
        } else {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <div className="border-b p-4">
                <div className="container mx-auto flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="ml-4 font-semibold text-lg">
                        Create your wAt account
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl p-6 py-10">
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {step === 1 ? "Choose your role" : `Join as a ${selectedRole?.charAt(0).toUpperCase() + selectedRole!.slice(1)}`}
                        </h1>
                        <p className="text-muted-foreground">
                            {step === 1
                                ? "Select the account type that best describes you to get started."
                                : "Fill in the details to complete your profile."}
                        </p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-8">
                            <RoleSelection selectedRole={selectedRole} onSelect={setSelectedRole} />
                            <div className="flex justify-end">
                                <Button size="lg" disabled={!selectedRole} onClick={handleContinue}>
                                    Continue
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-2xl mx-auto">
                            <div className="p-8 border rounded-lg bg-card">
                                <RegistrationForm role={selectedRole!} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
