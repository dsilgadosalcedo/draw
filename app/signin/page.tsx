import type { Metadata } from "next"

import { SignIn } from "@/components/sign-in/components/sign-in"

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false
  }
}

export default function SignInPage() {
  return <SignIn />
}
