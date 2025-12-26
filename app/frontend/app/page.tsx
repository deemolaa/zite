"use client"

import Link from "next/link"
import { ArrowRight, Shield, Lock, Eye } from "lucide-react"

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden relative">

      <section className="max-w-6xl mx-auto px-6 py-2 md:py-2 text-center relative">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
          <Shield className="w-4 h-4 text-amber-400" />
          Powered by FHEVM Encryption
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Private donations.
          <br className="hidden md:block" />
          <span className="inline-block mt-3">
            Public impact{" "}
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-amber-400 blur-xl opacity-50" />
              <span className="relative rounded-xl px-3 py-1 bg-amber-400 text-blue-950 font-extrabold">
                when it's right
              </span>
            </span>
            .
          </span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
          Encrypt amounts client-side with FHEVM. Keep donor privacy and reveal totals only after your policy triggers.
          Fund good—without compromising anyone.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/zite"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-bold text-blue-950 bg-amber-400 hover:bg-amber-300 transition-all duration-300 shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 hover:scale-105"
          >
            Enter App
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/25 hover:bg-white/15 transition-all duration-300"
          >
            Learn more
          </a>
        </div>

      
      </section>
    </main>
  )
}
