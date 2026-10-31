import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import SeoMeta from '@/components/SeoMeta';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      <SeoMeta 
        title="Privacy Policy - The Kashmir Curators"
        description="Official privacy policy and guest data protection framework of The Kashmir Curators."
      />
      <Navbar />

      <main className="flex-1 pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 mb-6">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white/80">
              Data Governance & Guest Confidentiality
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#111439] dark:text-white uppercase tracking-tight mb-4">
            PRIVACY <span className="text-amber-600 dark:text-amber-400">POLICY</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-white/40 mb-10 font-mono">
            Effective Date: January 1, 2026 • Last Reviewed: October 2026
          </p>

          <div className="space-y-8 bg-white dark:bg-[#0a0f12] p-6 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-lg text-slate-700 dark:text-white/80 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">1. Commitment to Privacy</h2>
              <p>
                The Kashmir Curators ("we", "our", or "us") respects your confidentiality and personal privacy. This Privacy Policy details how we collect, utilize, and protect your information when booking custom holiday itineraries, heritage houseboats, and private chauffeur transfers across Jammu & Kashmir.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">2. Information We Collect</h2>
              <p>We only collect information strictly required to coordinate your on-ground travel services:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-white/70">
                <li>Primary traveler contact details: Full Name, WhatsApp/Phone Number, Email Address.</li>
                <li>Travel parameters: Arrival date, duration, preferred accommodation standard, party size.</li>
                <li>Regulatory identity documentation: Government ID proof (Aadhaar, Passport) strictly required for inner-line border permits (Gurez, Bangus), Gulmarg Gondola security clearances, and mandatory hotel police registers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">3. Zero Spam & WhatsApp Protocol</h2>
              <p>
                We do not sell, rent, or lease your personal data to marketing telemarketers or third-party aggregators. Your phone number is utilized solely by your assigned senior trip curator and designated mountain chauffeur for duty updates, airport arrival greetings, and urgent weather advisories.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">4. Payment Security & Banking Compliance</h2>
              <p>
                All digital transactions are processed through RBI-authorized payment gateways utilizing 256-bit bank-grade SSL encryption. The Kashmir Curators never stores or has access to your credit card CVV, net-banking passwords, or UPI PINs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">5. Contact Our Data Protection Officer</h2>
              <p>
                For any data inquiries, rectification, or removal requests, please reach out directly:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 font-mono text-xs">
                Email: Zahidreyaz44123@gmail.com | Phone: +91 91037 98448<br />
                Address: Kashmir Curators HQ, Watergam, Rafiabad, Sopore, 193303
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
