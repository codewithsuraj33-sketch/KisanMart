'use server'

import { createClient } from '@/lib/supabase/server'

export type QuoteState = { error?: string; success?: string }

export async function submitQuote(_previous: QuoteState, formData: FormData): Promise<QuoteState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const values = {
    user_id: user?.id ?? null,
    name: String(formData.get('name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    email: String(formData.get('email') || '').trim() || null,
    organisation: String(formData.get('organisation') || '').trim() || null,
    products_needed: String(formData.get('products_needed') || '').trim(),
    quantity_note: String(formData.get('quantity_note') || '').trim(),
    delivery_place: String(formData.get('delivery_place') || '').trim(),
    message: String(formData.get('message') || '').trim() || null,
  }
  if (!values.name || !/^[0-9+()\-\s]{7,20}$/.test(values.phone) || !values.products_needed || !values.quantity_note || !values.delivery_place) {
    return { error: 'Naam, valid phone, product, quantity aur delivery place zaroori hain.' }
  }
  const { error } = await supabase.from('bulk_quote_requests').insert(values)
  if (error) return { error: 'Quote request submit nahi hui. Database migration check karein.' }
  return { success: 'Request mil gayi! Hamari B2B team 1 working day mein call karegi.' }
}
