"use client"

import { useRouter } from "next/navigation"

export default function SignInButton() {
  const router = useRouter()

  return (
    <button
      className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-semibold rounded-lg px-6 py-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      onClick={() => router.push("/signin")}
    >
      Sign In to Start Drawing
    </button>
  )
}
