'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Form ka result — page pe error ya success message dikhane ke liye
export type AuthState = { error?: string; message?: string }

// ---------------- Customer Signup ----------------
export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get('full_name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  // Basic validation (server-side — hamesha yahan check karo)
  if (!fullName || !email || !password) {
    return { error: 'Naam, email aur password zaroori hain.' }
  }
  if (password.length < 8) {
    return { error: 'Password kam se kam 8 characters ka hona chahiye.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Ye data trigger (handle_new_user) profiles table mein daal dega
    options: { data: { full_name: fullName, phone } },
  })

  if (error) return { error: error.message }

  // Agar Supabase mein "Confirm email" ON hai to abhi session nahi milega
  if (!data.session) {
    return {
      message:
        'Account ban gaya! Apni email kholo, confirmation link pe click karo, phir login karo.',
    }
  }

  // Confirmation OFF hai to seedha login ho gaya
  revalidatePath('/', 'layout')
  redirect('/')
}

// ---------------- Customer Login ----------------
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) return { error: 'Email aur password dono zaroori hain.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Galat email ya password.' }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ---------------- Admin Login ----------------
export async function adminLogin(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) return { error: 'Email aur password dono zaroori hain.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Galat email ya password.' }

  // Login to ho gaya, ab check karo ye admin hai ya nahi
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .single()

  if (!profile?.is_admin) {
    // Normal customer admin panel mein nahi ghus sakta — turant logout
    await supabase.auth.signOut()
    return { error: 'Ye admin account nahi hai. Access denied.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}

// ---------------- Logout ----------------
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
