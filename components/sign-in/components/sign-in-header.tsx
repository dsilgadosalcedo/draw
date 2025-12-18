"use client"

import { H1, Muted } from "@/components/ui/typography"

export function SignInHeader() {
  return (
    <div className="text-center flex flex-col items-center gap-2">
      <H1>Hi there!</H1>
      <Muted>Please sign in to continue.</Muted>
    </div>
  )
}
