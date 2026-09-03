import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useFAQs } from '@/hooks/useCMSData';
import { HelpCircle, ShieldCheck } from 'lucide-react';

export default function FAQSection() {
  const { data: cmsFaqs = [], isLoading } = useFAQs();

  const staticFAQs = [
    {
      question: "Is travel to Kashmir safe for families and solo travelers?",
      answer: "Yes, absolutely. Tourism is the primary livelihood in the valley and the local community is exceptionally welcoming. Kashmir hosts millions of domestic and international travelers annually, and secure tourist corridors, dedicated tourist police, and high safety standards ensure a worry-free experience for families and solo travelers."
    },
    {
      question: "How do mobile networks (prepaid vs postpaid) work in the valley?",
      answer: "Due to regional security regulations, prepaid mobile SIM cards issued outside Jammu & Kashmir will not work in the valley (they lose signal immediately). You must carry a postpaid connection (Jio, Airtel, and BSNL offer the best coverage). If you only have a prepaid SIM, you can purchase a local tourist SIM upon arrival by providing your passport/Aadhaar card."
    },
    {
      question: "What is your refund and cancellation policy for peak-season bookings?",
      answer: "For peak periods (such as tulip season in April, summer vacations, or Gulmarg ski season), hotels and transport partners require advance commitments. Our policy offers a 100% refund for cancellations made 30 days or more prior to arrival. Cancellations between 15-30 days are eligible for a 50% refund, while cancellations under 15 days are non-refundable but can be rescheduled under specific curator guidelines."
    }
  ];

  const faqs = [...staticFAQs, ...(Array.isArray(cmsFaqs) ? cmsFaqs : [])];

  return (
    <section className="py-32 bg-[#F8F8F9] relative overflow-hidden border-t border-slate-200">
      {/* Decorative Orbs */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-400/10 blur-[140px] -mr-48 -translate-y-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header - Elite Style */}
          <div className="flex flex-col items-center text-center mb-20 animate-fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439]">Registry Queries</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-[#111439] tracking-tight mb-8 uppercase">
              KNOWLEDGE <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">BASE</span>
            </h2>
            <p className="text-[#4A5568] text-lg max-w-xl mx-auto font-medium leading-relaxed">
              Essential intelligence for navigating the sublime valleys of Kashmir.
            </p>
          </div>

          {/* FAQ Accordion Elite */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl px-8 py-6 shadow-sm">
                  <Skeleton className="h-8 w-3/4 bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-6">
              {faqs?.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white border border-slate-200/90 rounded-[2rem] px-8 transition-all duration-500 data-[state=open]:border-slate-300 data-[state=open]:shadow-lg group overflow-hidden shadow-sm shadow-slate-900/5"
                >
                  <AccordionTrigger className="text-left font-display text-xl md:text-2xl font-black text-[#111439] hover:no-underline py-8 group-data-[state=open]:text-amber-600 transition-colors">
                    <div className="flex items-center gap-6">
                      <span className="text-amber-600/50 font-black text-sm">0{index + 1}</span>
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#4A5568] text-base md:text-lg font-medium pb-8 leading-relaxed border-t border-slate-100 pt-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Support CTA */}
          <div className="mt-20 p-8 rounded-[2.5rem] bg-white border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-up shadow-md shadow-slate-900/5">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <ShieldCheck className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h4 className="text-xl font-black text-[#111439] tracking-tight">Need Private Liaison?</h4>
                <p className="text-sm font-medium text-[#4A5568]">Our chief curators are available for complex queries.</p>
              </div>
            </div>
            <button className="px-10 py-5 rounded-2xl bg-[#111439] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-[#1c225a] transition-all duration-500 hover:scale-105 active:scale-95 shadow-md">
              Secure Direct Line
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
