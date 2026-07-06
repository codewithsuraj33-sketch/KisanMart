'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AddressState = { error?: string; success?: string }

export async function saveAddress(_previous: AddressState, formData: FormData): Promise<AddressState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login required.' }
  const values = {
    user_id: user.id,
    label: String(formData.get('label') || 'Home').trim().slice(0, 30),
    full_name: String(formData.get('full_name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    address_line: String(formData.get('address_line') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    state: String(formData.get('state') || '').trim(),
    pincode: String(formData.get('pincode') || '').trim(),
    is_default: formData.get('is_default') === 'on',
  }
  if (!values.full_name || !values.phone || !values.address_line || !values.city || !values.state || !/^\d{6}$/.test(values.pincode)) {
    return { error: 'Saari details aur valid 6-digit pincode bharein.' }
  }
  const { error } = await supabase.from('addresses').insert(values)
  if (error) return { error: 'Address save nahi hua. Database migration check karein.' }
  revalidatePath('/addresses')
  return { success: 'Address save ho gaya.' }
}

export async function deleteAddress(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  if (id) await supabase.from('addresses').delete().eq('id', id)
  revalidatePath('/addresses')
}

export async function makeDefaultAddress(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  if (id) await supabase.from('addresses').update({ is_default: true }).eq('id', id)
  revalidatePath('/addresses')
}
