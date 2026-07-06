'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SettingsState = {
  error?: string
  success?: string
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1'
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

export async function updatePreferences(
  _previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const locale = String(formData.get('locale') || 'en')
  const textSize = String(formData.get('text_size') || 'normal')

  if (!['en', 'hi', 'pa', 'mr', 'gu', 'te', 'ta', 'kn'].includes(locale)) {
    return { error: 'Selected language supported nahi hai.' }
  }
  if (!['normal', 'large'].includes(textSize)) {
    return { error: 'Text size invalid hai.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase.from('user_preferences').upsert({
    user_id: user.id,
    locale,
    order_email: parseBoolean(formData.get('order_email')),
    order_sms: parseBoolean(formData.get('order_sms')),
    order_whatsapp: parseBoolean(formData.get('order_whatsapp')),
    push_notifications: parseBoolean(formData.get('push_notifications')),
    stock_alerts: parseBoolean(formData.get('stock_alerts')),
    price_alerts: parseBoolean(formData.get('price_alerts')),
    marketing_messages: parseBoolean(formData.get('marketing_messages')),
    personalized_recommendations: parseBoolean(formData.get('personalized_recommendations')),
    text_size: textSize,
    high_contrast: parseBoolean(formData.get('high_contrast')),
  })

  if (error) return { error: 'Preferences save nahi hue.' }

  revalidatePath('/settings')
  return { success: 'Language aur preferences update ho gayi hain.' }
}

export async function updateFarmProfile(
  _previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const acreageRaw = String(formData.get('acreage') || '').trim()
  const cropList = String(formData.get('crops') || '')
    .split(',')
    .map((crop) => crop.trim())
    .filter(Boolean)

  const acreage = acreageRaw ? Number(acreageRaw) : null
  if (acreage !== null && (!Number.isFinite(acreage) || acreage < 0)) {
    return { error: 'Acreage valid number hona chahiye.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase.from('farm_profiles').upsert({
    user_id: user.id,
    farm_name: String(formData.get('farm_name') || '').trim() || null,
    acreage,
    crops: cropList,
    soil_type: String(formData.get('soil_type') || '').trim() || null,
    irrigation: String(formData.get('irrigation') || '').trim() || null,
    district: String(formData.get('district') || '').trim() || null,
    state: String(formData.get('state') || '').trim() || null,
    organisation: String(formData.get('organisation') || '').trim() || null,
    gstin: String(formData.get('gstin') || '').trim() || null,
  })

  if (error) return { error: 'Farm profile save nahi hua.' }

  revalidatePath('/settings')
  return { success: 'Farm profile update ho gaya.' }
}

export async function requestDeletion(
  _previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const reason = String(formData.get('reason') || '').trim()
  const scheduledFor = String(formData.get('scheduled_for') || '').trim()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase.from('account_deletion_requests').upsert({
    user_id: user.id,
    reason: reason || null,
    status: 'requested',
    scheduled_for: scheduledFor || null,
  })

  if (error) return { error: 'Deletion request save nahi hui.' }

  revalidatePath('/settings')
  return { success: 'Account deletion request raise ho gayi hai.' }
}

export async function cancelDeletionRequest(
  previousState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  void previousState
  void formData
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expire ho gayi. Dobara login karo.' }

  const { error } = await supabase
    .from('account_deletion_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)

  if (error) return { error: 'Deletion request cancel nahi hui.' }

  revalidatePath('/settings')
  return { success: 'Account deletion request cancel ho gayi.' }
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
