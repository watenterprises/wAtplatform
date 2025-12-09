import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type UserRole } from '../features/auth/components/RoleSelection';

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
    companyName?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (userData: any, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Session Check & Subscription
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Fallback if profile missing (shouldn't happen directly after signup if awaited)
                setUser({
                    id: userId,
                    email: email,
                    name: "User",
                    role: "explorer",
                    avatar: "ME"
                });
            } else if (data) {
                setUser({
                    id: data.id,
                    email: data.email,
                    name: data.full_name || data.company_name,
                    role: data.role as UserRole,
                    avatar: data.avatar_url || (data.full_name || data.company_name || "U").substring(0, 2).toUpperCase(),
                    companyName: data.company_name
                });
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
    };

    const signup = async (userData: any, password: string) => {
        // 1. Sign up auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: password,
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Insert into profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    email: userData.email,
                    role: userData.role,
                    full_name: userData.fullName || null,
                    company_name: userData.companyName || null,
                    industry_category: userData.industryCategory || null,
                }]);

            if (profileError) {
                console.error("Profile creation failed:", profileError);
                // Delete the auth user since profile creation failed
                await supabase.auth.admin.deleteUser(authData.user.id).catch(() => { });
                throw new Error("Failed to create user profile. Please try again.");
            }

            // 3. Fetch the profile to populate the user state
            await fetchProfile(authData.user.id, userData.email);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
