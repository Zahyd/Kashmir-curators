import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { ShieldCheck, FileCheck, AlertCircle, RefreshCw } from 'lucide-react';
import SeoMeta from '@/components/SeoMeta';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      <SeoMeta 
        title="Terms of Service & Booking Protocols - The Kashmir Curators"
        description="Official reservation terms, cancellation policies, weather rerouting guidelines, and ground execution standards of The Kashmir Curators."
      />
      <Navbar />

      <main className="flex-1 pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 mb-6">
            <FileCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white/80">
              Fair Booking & Valley Operations Protocols
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#111439] dark:text-white uppercase tracking-tight mb-4">
            TERMS OF <span className="text-amber-600 dark:text-amber-400">SERVICE</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-white/40 mb-10 font-mono">
            Effective Date: January 1, 2026 • Governed by J&K Tourism Regulations
          </p>

          <div className="space-y-8 bg-white dark:bg-[#0a0f12] p-6 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-lg text-slate-700 dark:text-white/80 text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">1. Reservation & Deposit Policy</h2>
              <p>
                To reserve verified accommodation (luxury houseboats, alpine ski chalets) and guarantee dedicated 4x4 mountain vehicles, a 30% advance deposit is required upon itinerary approval. The remaining balance is payable upon airport arrival or check-in, as indicated on your formal itinerary invoice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">2. Free Cancellation & Refund Window</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-white/70">
                <li><strong>7+ Days Prior to Arrival:</strong> 100% full refund with zero cancellation penalties.</li>
                <li><strong>3 to 6 Days Prior to Arrival:</strong> 50% refund or 100% full credit voucher redeemable within 12 calendar months.</li>
                <li><strong>Under 72 Hours:</strong> Advance deposit applied to non-refundable hotel room holding charges; reschedule options available subject to property availability.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">3. Mountain Weather & Force Majeure Flex-Shield</h2>
              <p>
                High-altitude alpine weather in Kashmir is dynamic. In the event of unexpected snow closures (e.g. Zojila Pass, Sinthan Top, or NH-44 highway blockades), our 24/7 ground desk immediately provides alternative scenic routes (such as Doodhpathri, Yusmarg, or Old Srinagar artisan quarters) at zero extra vehicle surcharge.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">4. Chauffeur Standards & Guest Safety Guarantee</h2>
              <p>
                Every driver in our fleet is verified, licensed by the J&K Transport Department, and trained in high-altitude snow chains and defensive mountain driving. Vehicles are equipped with GPS, snow chains during winter months, and first-aid kits.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#111439] dark:text-white">5. Governing Law & Dispute Resolution</h2>
              <p>
                All agreements, bookings, and operations are governed by the laws of Jammu & Kashmir and India. Any disputes are subject to the jurisdiction of courts in Srinagar, J&K.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
