export type ProfileTabId = 
  | 'overview' 
  | 'trips' 
  | 'proposals' 
  | 'ai-companion' 
  | 'payments' 
  | 'documents' 
  | 'loyalty' 
  | 'clearance' 
  | 'settings';

export interface CustomerBooking {
  id: string;
  type: 'package' | 'hotel' | 'cab';
  itemName: string;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  details: Record<string, any>;
  createdAt: string;
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  destination: string;
  duration: string;
  travelers: string;
  budget: string;
  accommodation: string;
  status: string;
  assignedTo?: string;
  priority?: string;
  sentiment?: string;
  quoteData?: string;
  proposalUrl?: string;
  flightDetails?: string;
  feedback?: string;
  netPrice?: number;
  agentMarkup?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedDoc {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface KashmirLocationAdvisory {
  id: string;
  name: string;
  temp: number;
  condition: string;
  status: 'Open' | 'Caution' | 'Closed';
  message: string;
  subText: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  loyaltyPoints: number;
  tier: 'Explorer' | 'Silver' | 'Gold' | 'Platinum Elite';
  recentTransactions?: Array<{
    id: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    description: string;
    createdAt: string;
  }>;
}
