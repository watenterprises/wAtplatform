import { z } from "zod"

const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international phone validation

// Shared Base Schemas
const addressSchema = z.string().min(5, "Address is required");
const emailSchema = z.string().email("Invalid email address");
const phoneSchema = z.string().regex(phoneRegex, "Invalid phone number");

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

// Shared Base Schemas (extended)
const baseSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string()
});

// 1. Manufacturer Schema
export const manufacturerSchema = z.object({
    role: z.literal("manufacturer"),
    companyName: z.string().min(2, "Company name is required"),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    industryCategory: z.string().min(1, "Industry category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    specialization: z.string().min(1, "Specialization is required"),
}).merge(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// 2. Seller Schema
export const sellerSchema = z.object({
    role: z.literal("seller"),
    companyName: z.string().min(2, "Company name is required"),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    industryCategory: z.string().min(1, "Industry category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    specialization: z.string().min(1, "Specialization is required"),
}).merge(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// 3. Buyer Schema
export const buyerSchema = z.object({
    role: z.literal("buyer"),
    fullName: z.string().min(2, "Full name is required"),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    interestCategory: z.string().min(1, "Interest category is required"),
    specificInterests: z.string().min(1, "Specific interests are required"),
}).merge(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// 4. Startup Schema
export const startupSchema = z.object({
    role: z.literal("startup"),
    companyName: z.string().min(2, "Company name is required"),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    industryCategory: z.string().min(1, "Industry category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    specialization: z.string().min(1, "Specialization is required"),
}).merge(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// 5. Explorer Schema
export const explorerSchema = z.object({
    role: z.literal("explorer"),
    fullName: z.string().min(2, "Full name is required"),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    // Explorer has no mandatory category, but we might want to capture optional interests later
}).merge(baseSchema).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// Discriminated Union for Form Type
export const registrationSchema = z.discriminatedUnion("role", [
    manufacturerSchema,
    sellerSchema,
    buyerSchema,
    startupSchema,
    explorerSchema
])

export type RegistrationFormData = z.infer<typeof registrationSchema>
