import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useFAQs } from '@/hooks/useCMSData';
import { HelpCircle, ShieldCheck } from 'lucide-react';

export default function FAQSection() {
  const { data: faqs, isLoading } = useFAQs();

  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-kashmir-gold/5 blur-[120px] -mr-48 -translate-y-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header - Elite Style */}
          <div className="flex flex-col items-center text-center mb-20 animate-fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-kashmir-gold" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Registry Queries</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 uppercase">
              KNOWLEDGE <span className="text-kashmir-gold italic">BASE</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto font-medium leading-relaxed">
              Essential intelligence for navigating the sublime valleys of Kashmir.
            </p>
          </div>

          {/* FAQ Accordion Elite */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl px-8 py-6">
                  <Skeleton className="h-8 w-3/4 bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-6">
              {faqs?.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white/[0.02] border border-white/5 rounded-[2rem] px-8 transition-all duration-500 data-[state=open]:bg-white/[0.04] data-[state=open]:border-kashmir-gold/30 group overflow-hidden"
                >
                  <AccordionTrigger className="text-left font-display text-xl md:text-2xl font-black text-white/70 hover:text-white hover:no-underline py-8 group-data-[state=open]:text-kashmir-gold transition-colors">
                    <div className="flex items-center gap-6">
                      <span className="text-kashmir-gold/20 font-black text-sm">0{index + 1}</span>
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/40 text-lg font-medium pb-8 leading-relaxed border-t border-white/5 pt-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Support CTA */}
          <div className="mt-20 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-up">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                <ShieldCheck className="w-8 h-8 text-kashmir-gold" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white tracking-tight">Need Private Liaison?</h4>
                <p className="text-sm font-medium text-white/30">Our chief curators are available for complex queries.</p>
              </div>
            </div>
            <button className="px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-kashmir-gold transition-all duration-500 hover:scale-105 active:scale-95">
              Secure Direct Line
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
