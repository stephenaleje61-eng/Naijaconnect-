import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';
import { NigerianFlag } from '../common/NigerianFlag.tsx';
import { NIGERIAN_STATES } from '../../data/nigeriaStates.ts';
import {
  Heart,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  MapPin,
  ArrowRight,
  Lock,
  UserCheck
} from 'lucide-react';

export const WelcomeView: React.FC = () => {
  const { openRegister, openLogin } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111111]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008751] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
                <span className="text-base leading-none">🇳🇬</span>
                <span className="tracking-wide uppercase text-[11px] font-bold">Nigeria's Premier Matchmaking Network</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111111] leading-[1.12]">
                  Find Love.<br />
                  <span className="text-[#008751]">Find Your Person.</span>
                </h1>
                <p className="text-lg sm:text-xl font-medium text-slate-700">
                  One Nigeria. Real Connections. Meaningful Relationships.
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                Welcome to <strong>NAIJAMATCH</strong> — the trusted, verified matchmaking platform designed for single Nigerians ready for real love, companionship, and marriage across all 36 states and the FCT.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={openRegister}
                  className="px-7 py-3.5 rounded-xl bg-[#008751] text-white font-bold text-sm hover:bg-[#007043] transition shadow-md shadow-emerald-950/15 flex items-center gap-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={openLogin}
                  className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Log In
                </button>
                <PWAInstallButton className="hidden sm:inline-flex py-3.5 px-4 text-sm" />
              </div>

              {/* Trust Bar */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#008751]"></span>
                  <span className="font-semibold text-slate-800">36 States & FCT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#008751]" />
                  <span>18+ Verified Singles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#008751]" />
                  <span>Private & Secure Messaging</span>
                </div>
              </div>
            </div>

            {/* Right Column: Large, Beautiful Nigerian National Flag */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200/90 bg-white p-3 sm:p-4">
                {/* Large Nigerian Flag */}
                <NigerianFlag aspectRatio="3:2" className="h-64 sm:h-80 w-full" shadow={false} />

                {/* Caption Bar under Flag */}
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#008751]">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>One Nigeria · One Love</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Connecting authentic hearts with dignity, cultural respect, and safety.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flag Banner Showcase */}
      <section className="py-12 bg-[#008751]/5 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5">
              <NigerianFlag aspectRatio="2:1" className="w-full h-40 sm:h-48" />
            </div>
            <div className="md:col-span-7 space-y-3">
              <span className="text-xs font-bold text-[#008751] uppercase tracking-wider">
                Authentic Nigerian Matchmaking
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111]">
                Find True Love at Home and Across the Nation
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Whether you live in Lagos, Abuja, Port Harcourt, Kano, Enugu, Ibadan, or anywhere across the 36 states and the FCT, NAIJAMATCH connects you with compatible Nigerian singles who share your values, aspirations, and vision for the future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
            How NaijaMatch Connects You
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Engineered exclusively for modern Nigerians seeking genuine, lasting love.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008751]/50 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">36 States Match Discovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Find compatible singles filtered by Nigerian State, city, age range, relationship goals, and common passions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008751]/50 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#008751]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Private & Safe Chats</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get to know each other through private one-to-one messaging with read receipts, mutual consent, and zero spam.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#008751]/50 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#008751]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Strictly 18+ & Verified</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every profile is verified via email and subject to platform safety policies. Zero tolerance for harassment or fake profiles.
            </p>
          </div>
        </div>
      </section>

      {/* Nigerian States Showcase Grid */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs font-bold text-[#008751] uppercase tracking-wider">
                Geopolitical Coverage
              </div>
              <h2 className="text-2xl font-bold text-[#111111] mt-1">
                Singles Across All 36 States & the FCT
              </h2>
            </div>
            <button
              onClick={openRegister}
              className="text-xs font-semibold text-[#008751] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore All Nigerian Locations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {NIGERIAN_STATES.slice(0, 18).map((st) => (
              <div
                key={st.name}
                className="p-3 rounded-xl bg-[#F8FAF9] border border-slate-200 hover:border-[#008751] transition cursor-pointer"
                onClick={openRegister}
              >
                <div className="text-xs font-bold text-slate-900 truncate">{st.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{st.capital}</div>
                <div className="text-[10px] text-[#008751] font-medium mt-1 truncate">{st.zone}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">
              Plus Abia, Adamawa, Bauchi, Borno, Gombe, Jigawa, Katsina, Kebbi, Kogi, Kwara, Nasarawa, Niger, Ondo, Osun, Sokoto, Taraba, Yobe, Zamfara!
            </span>
          </div>
        </div>
      </section>

      {/* Prominent Invitation Banner with Central Flag */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#008751] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <div className="w-24 mx-auto">
              <NigerianFlag aspectRatio="2:1" className="h-12 w-full" shadow={false} />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Find Your Person?
            </h2>
            
            <p className="text-sm sm:text-base text-emerald-100 max-w-lg mx-auto">
              Join thousands of genuine Nigerian singles today. Create your profile in 2 minutes and start discovering meaningful connections.
            </p>
            
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={openRegister}
                className="px-7 py-3 rounded-xl bg-white text-[#008751] font-bold text-sm hover:bg-emerald-50 transition shadow-md"
              >
                Create Free Account
              </button>
              <button
                onClick={openLogin}
                className="px-6 py-3 rounded-xl bg-emerald-900 text-white font-semibold text-sm hover:bg-emerald-950 transition border border-emerald-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">NAIJAMATCH 🇳🇬</span>
            <span>·</span>
            <span>Find Love. Find Your Person.</span>
          </div>
          <div>
            Built with pride for all 36 States & FCT. © {new Date().getFullYear()} NAIJAMATCH. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
