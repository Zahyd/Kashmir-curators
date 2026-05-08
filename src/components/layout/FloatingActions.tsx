import { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'WhatsApp',
      href: 'https://wa.me/911234567890?text=Hi! I am interested in Kashmir packages.',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: 'Call Now',
      href: 'tel:+911234567890',
      color: 'bg-kashmir-lake hover:bg-kashmir-lake/90',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Action Buttons */}
      {isOpen && (
        <div className="flex flex-col gap-3 animate-fade-up">
          {actions.map((action, index) => (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full text-primary-foreground shadow-lg transition-all hover:scale-105",
                action.color
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Main Toggle Button */}
      <Button
        variant="floating"
        size="iconLg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "shadow-gold transition-transform",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
