export const CATEGORY_OPTIONS = {
    manufacturer: {
        industries: ["Electronics", "Textiles", "Machinery", "Food Production", "Chemicals", "Other"],
        subcategories: {
            "Textiles": ["Clothing", "Industrial Fabrics", "Home Textiles"],
            "Electronics": ["Consumer Electronics", "Components", "Telecommunications"],
            // Add more defaults...
        } as Record<string, string[]>
    },
    seller: {
        industries: ["Retail", "Food & Beverage", "Services", "Wholesale", "Other"],
        subcategories: {
            "Retail": ["Online Retail", "Physical Store", "Pop-up"],
            // ...
        } as Record<string, string[]>
    },
    startup: {
        industries: ["Tech", "Manufacturing", "Retail", "Healthcare", "Fintech", "Other"],
        subcategories: {
            "Tech": ["Software Development", "Hardware", "AI/ML"],
            // ...
        } as Record<string, string[]>
    },
    buyer: {
        interests: ["Industrial Goods", "Consumer Goods", "Services", "Raw Materials", "Other"]
    }
}
