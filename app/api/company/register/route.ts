import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  trySecVerification,
  isValidSecNumber,
  isValidDtiNumber,
} from '@/lib/companyAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const { email, password, companyName, industry, website, description, secNumber, dtiNumber } = await req.json()

  if (!email || !password || !companyName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: companyName, account_type: 'company' },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create account' }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Determine verification status (auto — no manual)
  let verificationStatus = 'unverified'
  let verifiedAt: string | null = null

  if (secNumber && isValidSecNumber(secNumber)) {
    const result = await trySecVerification(companyName, secNumber)
    if (result === 'verified') {
      verificationStatus = 'sec_verified'
      verifiedAt = new Date().toISOString()
    } else {
      verificationStatus = 'sec_submitted' // valid format, lookup inconclusive — re-checked later
    }
  } else if (dtiNumber && isValidDtiNumber(dtiNumber)) {
    verificationStatus = 'dti_submitted'
  }

  // 3. Generate slug
  const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 50)
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // 4. Insert company profile
  const { data: company, error: companyError } = await supabase
    .from('company_profiles')
    .insert({
      user_id: userId,
      company_name: companyName,
      slug,
      industry: industry || null,
      website: website || null,
      description: description || null,
      contact_email: email,
      sec_number: secNumber || null,
      dti_number: dtiNumber || null,
      verification_status: verificationStatus,
      verified_at: verifiedAt,
    })
    .select('id, slug, verification_status')
    .single()

  if (companyError || !company) {
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create company profile' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    companyId: company.id,
    slug: company.slug,
    verificationStatus: company.verification_status,
  })
}
