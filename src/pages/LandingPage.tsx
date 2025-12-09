import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

import { useState } from "react"

export default function LandingPage() {
    const navigate = useNavigate()
    const { login } = useAuth() // Added useAuth hook call


    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const formData = new FormData(e.target as HTMLFormElement)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            await login(email, password)
            navigate('/feed')
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Hero / Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="relative z-10 max-w-xl text-center">
                    <h1 className="text-6xl font-bold mb-6 tracking-tighter">wAt</h1>
                    <p className="text-2xl font-light leading-relaxed opacity-90">
                        Connecting Manufacturers, Sellers, Buyers, Startups, and Explorers in one unified ecosystem.
                    </p>
                </div>
            </div>

            {/* Right Side - Auth / Action */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
                    </div>

                    <Card className="border-none shadow-none lg:border lg:shadow-sm">
                        <CardHeader className="px-0 lg:px-6">
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Choose your preferred sign-in method</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-0 lg:px-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="w-full">
                                    Google
                                </Button>
                                <Button variant="outline" className="w-full">
                                    Apple
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>

                            <form className="space-y-4" onSubmit={handleLogin}>
                                {error && <div className="text-destructive text-sm font-medium">{error}</div>}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                    <Input id="email" name="email" placeholder="m@example.com" type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <Button className="w-full" type="submit">Login</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => navigate('/register')}>
                            Sign up
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
