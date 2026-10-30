import React, { createContext, useContext, useState } from 'react';

export interface LeadModalOptions {
  intent?: string;
  destination?: string;
  sourceCta?: string;
  packageTitle?: string;
  initialTravelers?: string;
}

export interface CallbackModalOptions {
  intent?: string;
  sourceCta?: string;
  destination?: string;
}

interface LeadCaptureContextType {
  isLeadModalOpen: boolean;
  leadModalOptions: LeadModalOptions;
  openLeadModal: (options?: LeadModalOptions) => void;
  closeLeadModal: () => void;

  isCallbackModalOpen: boolean;
  callbackModalOptions: CallbackModalOptions;
  openCallbackModal: (options?: CallbackModalOptions) => void;
  closeCallbackModal: () => void;

  openWhatsAppLead: (options?: { intent?: string; destination?: string; packageTitle?: string }) => void;
}

const LeadCaptureContext = createContext<LeadCaptureContextType | undefined>(undefined);

export function LeadCaptureProvider({ children }: { children: React.ReactNode }) {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadModalOptions, setLeadModalOptions] = useState<LeadModalOptions>({});

  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [callbackModalOptions, setCallbackModalOptions] = useState<CallbackModalOptions>({});

  const openLeadModal = (options?: LeadModalOptions) => {
    setLeadModalOptions(options || {});
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
  };

  const openCallbackModal = (options?: CallbackModalOptions) => {
    setCallbackModalOptions(options || {});
    setIsCallbackModalOpen(true);
  };

  const closeCallbackModal = () => {
    setIsCallbackModalOpen(false);
  };

  const openWhatsAppLead = (options?: { intent?: string; destination?: string; packageTitle?: string }) => {
    const defaultNumber = '919103798448';
    let message = 'Hello Kashmir Curators! ';
    if (options?.packageTitle) {
      message += `I am interested in customizing the "${options.packageTitle}" package. Please connect me with a local travel curator.`;
    } else if (options?.destination) {
      message += `I am planning a trip to ${options.destination} and would like custom itineraries and pricing.`;
    } else if (options?.intent) {
      message += `I would like to consult with a local expert regarding "${options.intent}".`;
    } else {
      message += `I would like to plan a bespoke Kashmir trip with a local travel specialist.`;
    }

    const url = `https://wa.me/${defaultNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <LeadCaptureContext.Provider
      value={{
        isLeadModalOpen,
        leadModalOptions,
        openLeadModal,
        closeLeadModal,
        isCallbackModalOpen,
        callbackModalOptions,
        openCallbackModal,
        closeCallbackModal,
        openWhatsAppLead
      }}
    >
      {children}
    </LeadCaptureContext.Provider>
  );
}

export function useLeadCapture() {
  const context = useContext(LeadCaptureContext);
  if (!context) {
    throw new Error('useLeadCapture must be used within a LeadCaptureProvider');
  }
  return context;
}

export default LeadCaptureContext;
