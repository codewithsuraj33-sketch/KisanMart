'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/slugify'
import type { SupabaseClient } from '@supabase/supabase-js'

export type FormState = { error?: string }

// Har admin action mein pehle confirm karo ki caller sach mein admin hai.
// (Middleware bhi rokta hai, but actions directly bhi call ho sakte hain —
//  isliye double-check = defense in depth.)
async function requireAdmin(): Promise<{ supabase: SupabaseClient; ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return { supabase, ok: !!profile?.is_admin }
}

type ProductData = {
  name: string
  description: string | null
  price: number
  mrp: number | null
  stock: number
  category_id: string | null
  image_url: string | null
  weight_grams: number
  is_active: boolean
}

// Form fields ko validate + parse karta hai
function parseProduct(formData: FormData): { data: ProductData } | { error: string } {
  const name = String(formData.get('name') || '').trim()
  if (!name) return { error: 'Product ka naam zaroori hai.' }

  const price = Number(formData.get('price'))
  if (!Number.isFinite(price) || price < 0) return { error: 'Price sahi daalo.' }

  const mrpRaw = String(formData.get('mrp') || '').trim()
  const mrp = mrpRaw ? Number(mrpRaw) : null
  if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
    return { error: 'MRP sahi daalo.' }
  }

  const stock = parseInt(String(formData.get('stock') || '0'), 10)
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock sahi daalo.' }

  const weight = parseInt(String(formData.get('weight_grams') || '500'), 10)

  return {
    data: {
      name,
      description: String(formData.get('description') || '').trim() || null,
      price,
      mrp,
      stock,
      category_id: String(formData.get('category_id') || '') || null,
      image_url: String(formData.get('image_url') || '').trim() || null,
      weight_grams: Number.isInteger(weight) && weight > 0 ? weight : 500,
      is_active: formData.get('is_active') === 'on',
    },
  }
}

// ---------------- CREATE ----------------
export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return { error: 'Authorized nahi ho.' }

  const parsed = parseProduct(formData)
  if ('error' in parsed) return parsed

  // Unique slug (naam + short timestamp)
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36).slice(-4)}`

  const { error } = await supabase.from('products').insert({ ...parsed.data, slug })
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  redirect('/admin/products')
}

// ---------------- UPDATE ----------------
export async function updateProduct(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return { error: 'Authorized nahi ho.' }

  const parsed = parseProduct(formData)
  if ('error' in parsed) return parsed

  const { error } = await supabase.from('products').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  redirect('/admin/products')
}

// ---------------- DELETE ----------------
export async function deleteProduct(formData: FormData) {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/products')
  revalidatePath('/products')
}

// ---------------- ORDER STATUS ----------------
export async function updateOrderStatus(formData: FormData) {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return

  const orderId = String(formData.get('order_id') || '')
  const status = String(formData.get('status') || '')
  const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!orderId || !allowed.includes(status)) return

  await supabase.from('orders').update({ status }).eq('id', orderId)
  revalidatePath('/admin/orders')
}

// ---------------- TOGGLE USER ADMIN ----------------
// Kisi user ko admin banana / admin hataana.
// NOTE: profiles pe RLS sirf "apni hi row update" allow karta hai, isliye
// dusre user ko update karne ke liye service-role (admin) client chahiye.
export async function toggleUserAdmin(formData: FormData) {
  const { supabase, ok } = await requireAdmin()
  if (!ok) return

  const userId = String(formData.get('user_id') || '')
  const makeAdmin = formData.get('make_admin') === 'true'
  if (!userId) return

  // Apne aap ko admin se hataane se roko (galti se lockout na ho)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.id === userId && !makeAdmin) return

  const admin = createAdminClient()
  await admin.from('profiles').update({ is_admin: makeAdmin }).eq('id', userId)
  revalidatePath('/admin/users')
}
