import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useFAQs } from '@/hooks/useCMSData';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { HelpCircle, ShieldCheck } from 'lucide-react';

export default function FAQSection() {
  const { data: cmsFaqs = [], isLoading } = useFAQs();
  const { content, faqsSection } = useLandingPageContent();
  const { openCallbackModal } = useLeadCapture();

  const meta = (content as any)?.faqsSection || {};
  const badgeText = meta.badge || faqsSection?.badgeText || 'Registry Queries';
  const headingText = meta.heading || faqsSection?.title || 'KNOWLEDGE BASE';
  const descriptionText =
    meta.description ||
    faqsSection?.subtitle ||
    'Essential intelligence for navigating Kashmir valleys, B2B agency onboarding, live currencies, and weather protection.';

  const staticFAQs = [
    {
      question: 'Is travel to Kashmir safe for families and solo travelers?',
      answer:
        'Yes, absolutely. Kashmir hosts millions of domestic and international travelers every year. Our operations connect directly with tourist police corridors, J&K Police 112, and certified local drivers so every transfer across Srinagar, Gulmarg, Pahalgam, Sonamarg, and Doodhpathri is monitored 24/7.',
    },
    {
      question: 'How do mobile networks (prepaid vs postpaid) work in the valley?',
      answer:
        'Due to regional telecom regulations, prepaid SIM cards issued outside Jammu & Kashmir do not latch inside the valley. Carry a postpaid SIM (Jio, Airtel, or BSNL), or pick up a tourist SIM at Srinagar Airport (SXR) with your passport or Aadhaar.',
    },
    {
      question: 'How does the Kashmir Flex Disruption Shield protect bookings?',
      answer:
        'If heavy snowfall or highway advisories close a mountain pass (such as Zojila or Tangmarg-Gulmarg), our ground desk reroutes your stay to an equivalent luxury estate or credits 100% of the unused leg to your wallet without hidden penalties.',
    },
    {
      question: 'How can Travel Agencies, Hotels, and Cab Fleets join the B2B Travel OS?',
      answer:
        'Outstation travel agencies can access wholesale net rates and generate white-label PDF quotes via the Travel Agency Portal (/agent). Local hotels and houseboats can manage room inventory in the Hospitality CRS (/hospitality), while 4x4 fleet operators can register directly via Partner Onboarding (/vendor).',
    },
  ];

  const faqs = [...staticFAQs, ...(Array.isArray(cmsFaqs) ? cmsFaqs : [])];

  return (
    <section className="py-16 md:py-28 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors border-t border-slate-200/60 dark:border-white/5">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-400/10 blur-[140px] -mr-48 -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-14 md:mb-16 animate-fade-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
                {badgeText}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white tracking-tight mb-5 uppercase">
              {headingText.includes(' ') ? (
                <>
                  {headingText.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 dark:from-amber-400 dark:via-yellow-200 dark:to-emerald-400">
                    {headingText.split(' ').slice(-1).join(' ')}
                  </span>
                </>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600">
                  {headingText}
                </span>
              )}
            </h2>
            <p className="text-[#4A5568] dark:text-white/60 text-sm sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
              {descriptionText}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#0a0f14] border border-slate-200 dark:border-white/10 rounded-2xl px-8 py-6 shadow-sm"
                >
                  <Skeleton className="h-7 w-3/4 bg-slate-100 dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 rounded-[1.75rem] px-6 sm:px-8 transition-all duration-300 data-[state=open]:border-amber-400/50 data-[state=open]:shadow-lg group overflow-hidden shadow-sm shadow-slate-900/5"
                >
                  <AccordionTrigger className="text-left font-display text-base sm:text-xl font-black text-[#111439] dark:text-white hover:no-underline py-6 group-data-[state=open]:text-amber-600 dark:group-data-[state=open]:text-amber-400 transition-colors">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 group-data-[state=open]:text-amber-500 transition-colors shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#4A5568] dark:text-white/70 text-xs sm:text-base leading-relaxed pb-6 pl-8 sm:pl-10 font-medium">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* Support Liaison CTA */}
          <div className="mt-14 p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-up shadow-md shadow-slate-900/5">
            <div className="flex items-center gap-5 text-center md:text-left flex-col sm:flex-row">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                <ShieldCheck className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black text-[#111439] dark:text-white tracking-tight">
                  Need Private Liaison or B2B Onboarding?
                </h4>
                <p className="text-xs sm:text-sm font-medium text-[#4A5568] dark:text-white/60 mt-0.5">
                  Speak directly with our Srinagar Ground Operations Desk for custom permits, group charters, or agency rate cards.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openCallbackModal({ sourceCta: 'FAQ_LIAISON', intent: 'Private Liaison Desk' })}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shrink-0"
            >
              Secure Direct Line
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
