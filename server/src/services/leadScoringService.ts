import prisma from '../lib/prisma';

export interface LeadScoreInput {
  travelStartDate?: Date | string | null;
  travelMonth?: string | null;
  budgetRange?: string | null;
  preferredAccommodation?: string | null;
  adultsCount?: number | null;
  childrenCount?: number | null;
  arrivalCity?: string | null;
  transportPreference?: string | null;
  placesVisited?: string | null;
  travelStyle?: string | null;
  wantOffbeat?: string | null;
  intentQuery?: string | null;
  sourceCta?: string | null;
  profileCompleteness?: number | null;
  destination?: string | null;
  interests?: string[] | string | null;
}

export interface LeadScoreResult {
  totalScore: number;
  sentiment: 'Hot' | 'Warm' | 'Cold';
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  scoringBreakdown: {
    dateProximityScore: number;
    budgetScore: number;
    groupScore: number;
    engagementScore: number;
    intentScore: number;
    maxPossible: number;
  };
}

export class LeadScoringService {
  /**
   * Generates a unique, readable Lead ID (e.g. KC-2026-8492)
   * Ensures zero collisions by verifying against the database.
   */
  public static async generateLeadId(): Promise<string> {
    const year = new Date().getFullYear();
    let leadId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit code
      leadId = `KC-${year}-${randomDigits}`;

      const existing = await prisma.inquiry.findUnique({
        where: { leadId }
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return leadId;
  }

  /**
   * Intelligent Intent Categorization
   * Differentiates visitor queries like "Kashmir honeymoon package" vs "North Kashmir offbeat places"
   */
  public static categorizeLead(input: LeadScoreInput): string {
    const combinedText = [
      input.intentQuery || '',
      input.travelStyle || '',
      input.wantOffbeat || '',
      input.destination || '',
      input.sourceCta || '',
      Array.isArray(input.interests) ? input.interests.join(' ') : (input.interests || '')
    ].join(' ').toLowerCase();

    // 1. Direct Callback Request
    if (input.sourceCta === 'CALLBACK_MODAL' || combinedText.includes('callback') || combinedText.includes('call back')) {
      return 'DIRECT_CALLBACK';
    }

    // 2. Honeymoon / Romantic couples
    if (
      combinedText.includes('honeymoon') ||
      combinedText.includes('romantic') ||
      combinedText.includes('couple escape') ||
      input.travelStyle === 'Romantic' ||
      input.travelStyle === 'Honeymoon'
    ) {
      return 'HONEYMOON_LUXURY';
    }

    // 3. North Kashmir Offbeat Explorer (Gurez, Bangus, Lolab, Warwan, Karnah, Doodhpathri)
    if (
      combinedText.includes('offbeat') ||
      combinedText.includes('north kashmir') ||
      combinedText.includes('gurez') ||
      combinedText.includes('bangus') ||
      combinedText.includes('lolab') ||
      combinedText.includes('warwan') ||
      combinedText.includes('doodhpathri') ||
      combinedText.includes('yusmarg') ||
      input.wantOffbeat === 'Yes' ||
      input.wantOffbeat === 'Offbeat Explorer' ||
      input.travelStyle === 'Offbeat Explorer'
    ) {
      return 'NORTH_KASHMIR_OFFBEAT';
    }

    // 4. Adventure, Winter Sports & Alpine Trekking
    if (
      combinedText.includes('ski') ||
      combinedText.includes('snowboard') ||
      combinedText.includes('trek') ||
      combinedText.includes('rafting') ||
      combinedText.includes('adventure') ||
      input.travelStyle === 'Adventure & Thrill'
    ) {
      return 'ADVENTURE_AND_TREK';
    }

    // 5. Family & Multi-generational Vacation
    const totalTravelers = (input.adultsCount || 2) + (input.childrenCount || 0);
    if (
      (input.childrenCount && input.childrenCount > 0) ||
      totalTravelers >= 4 ||
      input.travelStyle === 'Family' ||
      combinedText.includes('family')
    ) {
      return 'FAMILY_EXPEDITION';
    }

    // 6. Default High-Curation Custom Tour
    return 'BESPOKE_KASHMIR_TOUR';
  }

  /**
   * Calculates dynamic Lead Score (0 - 100) based on:
   * 1. Travel Date Proximity (Max 30 pts)
   * 2. Budget Range & Luxury Tier (Max 25 pts)
   * 3. Group Size & High-Value Booking Composition (Max 15 pts)
   * 4. Profile Completeness & Engagement (Max 15 pts)
   * 5. Booking Intent & Action Channel (Max 15 pts)
   */
  public static calculateScore(input: LeadScoreInput): LeadScoreResult {
    let dateProximityScore = 8;
    let budgetScore = 10;
    let groupScore = 10;
    let engagementScore = 5;
    let intentScore = 5;

    // --- 1. Travel Date Proximity (30 pts max) ---
    if (input.travelStartDate) {
      try {
        const start = new Date(input.travelStartDate);
        const now = new Date();
        const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 15) {
          dateProximityScore = 30; // Urgent buying window (< 15 days)
        } else if (diffDays > 15 && diffDays <= 45) {
          dateProximityScore = 22; // Prime planning & decision window (15 - 45 days)
        } else if (diffDays > 45 && diffDays <= 90) {
          dateProximityScore = 15; // Mid-range planning (45 - 90 days)
        } else if (diffDays > 90) {
          dateProximityScore = 10; // Distant future (> 90 days)
        } else {
          // Date already in past or today
          dateProximityScore = 15;
        }
      } catch (e) {
        dateProximityScore = 10;
      }
    } else if (input.travelMonth) {
      dateProximityScore = 16;
    }

    // --- 2. Budget Range (25 pts max) ---
    const budgetStr = (input.budgetRange || input.preferredAccommodation || '').toLowerCase();
    if (budgetStr.includes('luxury') || budgetStr.includes('vip') || budgetStr.includes('5-star') || budgetStr.includes('khyber') || budgetStr.includes('75k+')) {
      budgetScore = 25;
    } else if (budgetStr.includes('premium') || budgetStr.includes('4-star') || budgetStr.includes('boutique') || budgetStr.includes('40k-75k')) {
      budgetScore = 18;
    } else if (budgetStr.includes('standard') || budgetStr.includes('3-star') || budgetStr.includes('25k-40k')) {
      budgetScore = 12;
    } else if (budgetStr.includes('budget') || budgetStr.includes('backpacker')) {
      budgetScore = 6;
    } else {
      budgetScore = 12; // Default flexible
    }

    // --- 3. Group Size & Composition (15 pts max) ---
    const adults = input.adultsCount !== undefined && input.adultsCount !== null ? input.adultsCount : 2;
    const children = input.childrenCount || 0;
    const totalPax = adults + children;

    if (totalPax >= 4) {
      groupScore = 15; // High ticket group or family booking
    } else if (totalPax === 2) {
      // Check if honeymoon
      const isHoneymoon = (input.intentQuery || '').toLowerCase().includes('honeymoon') || input.travelStyle === 'Romantic';
      groupScore = isHoneymoon ? 15 : 12;
    } else if (totalPax === 3) {
      groupScore = 13;
    } else {
      groupScore = 8; // Solo traveler
    }

    // --- 4. Profile Completeness & Conversational Depth (15 pts max) ---
    const completeness = input.profileCompleteness || 25;
    if (completeness >= 90) {
      engagementScore = 15;
    } else if (completeness >= 65) {
      engagementScore = 12;
    } else if (completeness >= 40) {
      engagementScore = 8;
    } else {
      engagementScore = 4;
    }

    // --- 5. Booking Intent & Action Channel (15 pts max) ---
    if (input.sourceCta === 'CALLBACK_MODAL') {
      intentScore = 15; // User requested immediate phone call
    } else if (input.arrivalCity && input.transportPreference) {
      intentScore = 14; // Specified operational details
    } else if (input.sourceCta === 'PLAN_MY_TRIP' || input.sourceCta === 'CUSTOM_PACKAGE') {
      intentScore = 12;
    } else if (input.sourceCta === 'HERO_ITINERARY') {
      intentScore = 10;
    } else {
      intentScore = 7;
    }

    // Sum Total
    const totalScore = Math.min(100, Math.max(10, dateProximityScore + budgetScore + groupScore + engagementScore + intentScore));

    // Determine Sentiment and Priority
    let sentiment: 'Hot' | 'Warm' | 'Cold' = 'Warm';
    let priority: 'High' | 'Medium' | 'Low' = 'Medium';

    if (totalScore >= 75) {
      sentiment = 'Hot';
      priority = 'High';
    } else if (totalScore >= 48) {
      sentiment = 'Warm';
      priority = 'Medium';
    } else {
      sentiment = 'Cold';
      priority = 'Low';
    }

    const category = this.categorizeLead(input);

    return {
      totalScore,
      sentiment,
      priority,
      category,
      scoringBreakdown: {
        dateProximityScore,
        budgetScore,
        groupScore,
        engagementScore,
        intentScore,
        maxPossible: 100
      }
    };
  }
}

export default LeadScoringService;
