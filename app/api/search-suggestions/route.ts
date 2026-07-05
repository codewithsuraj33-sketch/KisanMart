import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const POPULAR = ['Wheat Seeds', 'Urea Fertilizer', 'Neem Oil', 'Drip Irrigation', 'Garden Tools']

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) return NextResponse.json({ suggestions: [], popular: POPULAR })

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .eq('is_active', true)
    .ilike('name', `%${query.replace(/[%_]/g, '')}%`)
    .limit(6)

  return NextResponse.json({ suggestions: data ?? [], popular: POPULAR })
}
