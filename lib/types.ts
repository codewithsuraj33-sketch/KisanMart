// Database tables ke TypeScript types

export type Category = {
  id: string
  name: string
  slug: string
  image_url: string | null
  created_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  mrp: number | null
  stock: number
  category_id: string | null
  image_url: string | null
  weight_grams: number
  is_active: boolean
  created_at: string
  rating_avg?: number
  rating_count?: number
  is_flash_sale?: boolean
  sale_ends_at?: string | null
  seller_id?: string | null
  // Jab query mein categories join karte hain to ye aata hai
  categories?: { name: string } | null
}

export type ProductVariant = {
  id: string
  product_id: string
  label: string
  price: number
  mrp: number | null
  stock: number
  weight_grams: number
  is_default: boolean
  is_active: boolean
}

export type ProductReview = {
  id: string
  product_id: string
  user_id: string
  reviewer_name: string
  rating: number
  title: string | null
  comment: string
  is_verified: boolean
  created_at: string
}
