/**
 * Kashmir Connect CRM - Travel Pricing & Itinerary Engine
 * Computes itemized travel quotes and builds dynamic itineraries based on traveler selections
 */

export interface DynamicQuoteRequest {
  destination: string;
  durationDays: number;
  travelers: number;
  hotelTier: 'STANDARD' | 'PREMIUM' | 'ELITE';
  hasCab: boolean;
  cabType?: 'SEDAN' | 'SUV_COMFORT' | 'SUV_PREMIUM';
}

export interface QuoteBreakdown {
  nights: number;
  roomsCount: number;
  hotelRatePerNight: number;
  totalHotelCost: number;
  cabRatePerDay: number;
  totalCabCost: number;
  activitiesCost: number;
  baseCost: number;
  gst: number;
  total: number;
  currency: string;
  dynamicItinerary: Array<{ day: number; title: string; desc: string }>;
}

export class PricingService {
  
  // Rate limits and tiers in INR (Indian Rupee)
  private static HOTEL_PRICING = {
    STANDARD: 3500, // 3-Star Hotels & Quality Stays
    PREMIUM: 7500,  // 4-Star Premium & Boutique Properties
    ELITE: 18000    // 5-Star Luxury Resorts (e.g. Khyber Gulmarg, Taj Srinagar)
  };

  private static CAB_PRICING = {
    SEDAN: 3000,       // Etios, Swift Dzire
    SUV_COMFORT: 4500, // Toyota Innova, Mahindra Xylo
    SUV_PREMIUM: 7500  // Toyota Innova Crysta / Luxury Coach
  };

  private static BASE_ACTIVITY_RATE = 1500; // Average Gondola tickets, entry permits per traveler

  /**
   * Main calculation engine to compute customized, itemized travel quotes
   */
  public static calculateQuote(req: DynamicQuoteRequest): QuoteBreakdown {
    const nights = Math.max(1, req.durationDays - 1);
    const roomsCount = Math.ceil(req.travelers / 2); // Double sharing assumption
    
    // 1. Hotel Calculations
    const hotelRatePerNight = this.HOTEL_PRICING[req.hotelTier] || this.HOTEL_PRICING.STANDARD;
    const totalHotelCost = hotelRatePerNight * nights * roomsCount;

    // 2. Cab Calculations
    let cabRatePerDay = 0;
    let totalCabCost = 0;
    if (req.hasCab) {
      const type = req.cabType || 'SUV_COMFORT';
      cabRatePerDay = this.CAB_PRICING[type] || this.CAB_PRICING.SUV_COMFORT;
      totalCabCost = cabRatePerDay * req.durationDays;
    }

    // 3. Activities & Entry permits
    const activitiesCost = this.BASE_ACTIVITY_RATE * req.travelers;

    // 4. Totals
    const baseCost = totalHotelCost + totalCabCost + activitiesCost;
    const gst = Math.round(baseCost * 0.05); // 5% GST on travel service
    const total = baseCost + gst;

    // 5. Dynamic Itinerary Generation
    const dynamicItinerary = this.generateDynamicItinerary(req.destination, req.durationDays);

    return {
      nights,
      roomsCount,
      hotelRatePerNight,
      totalHotelCost,
      cabRatePerDay,
      totalCabCost,
      activitiesCost,
      baseCost,
      gst,
      total,
      currency: 'INR',
      dynamicItinerary
    };
  }

  /**
   * Generates dynamic day-by-day itineraries based on travel destination & duration
   */
  private static generateDynamicItinerary(destination: string, days: number): Array<{ day: number; title: string; desc: string }> {
    const destLower = destination.toLowerCase();
    const itinerary: Array<{ day: number; title: string; desc: string }> = [];

    // Base template generators
    const srinagarActivities = [
      { title: "Srinagar Arrival & Dal Lake Shikara", desc: "Welcome to Srinagar! Transfer to your heritage Houseboat, settle in, and enjoy a premium sunset Shikara ride around Dal Lake visiting the floating markets." },
      { title: "Mughal Gardens & Shalimar Heritage walk", desc: "Spend the day exploring the breathtaking gardens of Srinagar: Nishat Bagh (Garden of Pleasure), Shalimar Bagh (Abode of Love), and the historical Chashma Shahi springs." },
      { title: "Old City Heritage tour & Local Bazaar", desc: "Walk through the architectural masterpieces of the historical Jamia Masjid and Shah-e-Hamdan, followed by tasting traditional Kashmiri spices and dry fruits in Lal Chowk." }
    ];

    const gulmargActivities = [
      { title: "Transfer to Gulmarg & Alpine meadows", desc: "Drive up the pine-fringed roads to Gulmarg (Meadow of Flowers). Check into your cozy alpine resort and enjoy a pony ride across the snow-capped golf course." },
      { title: "Gondola Phase 1 & 2 Peak exploration", desc: "Ride the world's second-highest cable car (Gondola) up to the majestic Apharwat Peak (Phase 2 at 14,000 ft) for breathtaking panoramas of Nanga Parbat." },
      { title: "Winter skiing & Snow sledging trials", desc: "Experience the thrills of basic skiing or snow sledging under expert guidance on the gentle ski slopes of Gulmarg." }
    ];

    const pahalgamActivities = [
      { title: "Drive to Pahalgam & Betaab Valley", desc: "Travel to Pahalgam (Valley of Shepherds) alongside the Lidder River. Explore the famous Betaab Valley where cascading waterfalls cut through dense pine forests." },
      { title: "Aru Valley & Chandanwari meadows", desc: "Take a local 4x4 up to Aru Valley's serene meadows and visit Chandanwari, the starting point of the holy Amarnath Yatra pilgrimage." },
      { title: "Pony Trek to Baisaran (Mini Switzerland)", desc: "Embark on an scenic pony trail through pine forests up to Baisaran, a massive green hilltop meadow nicknamed 'Mini Switzerland'." }
    ];

    const sonamargActivities = [
      { title: "Day trip to Sonamarg & Thajiwas Glacier", desc: "Drive along the Indus River to Sonamarg (Meadow of Gold). Sledge or pony-ride across the majestic Thajiwas Glacier with pristine streams cascading around." }
    ];

    // Combine based on traveler destination preference
    let pool: typeof srinagarActivities = [];
    if (destLower.includes('gulmarg')) {
      pool = [...gulmargActivities, ...srinagarActivities, ...pahalgamActivities];
    } else if (destLower.includes('pahalgam')) {
      pool = [...pahalgamActivities, ...srinagarActivities, ...gulmargActivities];
    } else if (destLower.includes('sonamarg')) {
      pool = [...sonamargActivities, ...srinagarActivities, ...gulmargActivities, ...pahalgamActivities];
    } else {
      // General All-Kashmir Mix
      pool = [...srinagarActivities, ...gulmargActivities, ...pahalgamActivities, ...sonamargActivities];
    }

    // Allocate pool elements dynamically to match requested stay duration
    for (let d = 1; d <= days; d++) {
      if (d === 1) {
        itinerary.push({
          day: 1,
          title: pool[0]?.title || "Arrival & Warm Welcome",
          desc: pool[0]?.desc || "Arrive in paradise! Settle into your boutique accommodations and enjoy a traditional hot saffron Kahwa tea."
        });
      } else if (d === days) {
        itinerary.push({
          day: days,
          title: "Departure with Beautiful Memories",
          desc: "Transfer safely back to Srinagar Airport for your onward journey, taking with you the enchanting memories of Kashmir Curators."
        });
      } else {
        const itemIdx = (d - 1) % pool.length;
        const item = pool[itemIdx] || { title: `Exploring ${destination}`, desc: `Savor the majestic scenery, crisp air, and handcrafted local arts around the beautiful valley.` };
        itinerary.push({
          day: d,
          title: item.title,
          desc: item.desc
        });
      }
    }

    return itinerary;
  }
}
