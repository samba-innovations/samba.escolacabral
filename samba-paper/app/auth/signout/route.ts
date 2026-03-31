import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function signout() {
  const cookieStore = await cookies()
  cookieStore.delete('samba_token')
  const accessUrl = process.env.NEXT_PUBLIC_URL_ACCESS ?? 'http://localhost:3002'
  return NextResponse.redirect(accessUrl)
}

export { signout as GET, signout as POST }
