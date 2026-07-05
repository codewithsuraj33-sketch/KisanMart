'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SettingsState = {
  error?: string
  success?: string
}

export async function updateProfile(
  _previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const fullName = String(formData.get('full_name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()

  if (fullName.length < 2 || fullName.length > 80) {
    return { error: 'Naam 2 se 80 characters ke beech hona chahiye.' }
  }

  if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) {
    return { error: 'Phone number sahi format mein daalo.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null })
    .eq('id', user.id)

  if (error) return { error: 'Profile save nahi hua. Dobara try karo.' }

  // Signup metadata ko bhi sync rakho.
  await supabase.auth.updateUser({ data: { full_name: fullName, phone } })

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: 'Profile details update ho gayi hain.' }
}

export async function changePassword(
  _previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirm_password') || '')

  if (password.length < 8) {
    return { error: 'Password kam se kam 8 characters ka hona chahiye.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Dono passwords match nahi kar rahe.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: 'Password successfully change ho gaya.' }
}
