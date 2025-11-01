"use client";

import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2B7D] via-[#1D4ED8] to-[#0EA5E9]" />

      <div
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "#FFD200" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-6rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{
          background: "linear-gradient(135deg,#FFD200 0%, #F59E0B 100%)",
        }}
      />


      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Private donations.
          <br className="hidden md:block" />
          <span className="inline-block mt-2">
            Public impact{" "}
            <span
              className="rounded-lg px-2 pb-1"
              style={{ background: "#FFD200", color: "#0B2B7D" }}
            >
              when it’s right
            </span>
            .
          </span>
        </h1>

        <p className="mt-6 text-white/80 max-w-2xl mx-auto">
          Encrypt amounts client-side with FHEVM. Keep donor privacy and reveal
          totals only after your policy triggers. Fund good—without compromising
          anyone.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/zite"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-[#0B2B7D] hover:bg-white/15"
            style={{ background: "#FFD200" }}
          >
            Enter App
          </Link>
          <a
            href="#how"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-white/90 border border-white/25 hover:bg-white/10"
          >
            Learn more
          </a>
        </div>
      </section>
    </main>
  );
}
