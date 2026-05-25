export class FlightService {
  /**
   * Helper to resolve standard IATA codes or city names to Skyscanner SkyIds and EntityIds
   */
  private static async resolveAirport(query: string) {
    const apiKey = process.env.RAPIDAPI_KEY || '831a1832afmshb67e276ba8718a8p15c5c3jsn711adf37bfe7';
    const apiHost = process.env.RAPIDAPI_HOST || 'sky-scrapper.p.rapidapi.com';
    
    if (!apiKey) {
      return { skyId: query.toUpperCase(), entityId: '' };
    }

    try {
      const url = `https://${apiHost}/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost
        }
      });

      if (!res.ok) throw new Error(`Search airport failed with status ${res.status}`);
      const payload: any = await res.json();
      
      const relevant = payload?.data?.[0]?.navigation?.relevantFlightParams;
      if (relevant && relevant.skyId && relevant.entityId) {
        return {
          skyId: relevant.skyId,
          entityId: relevant.entityId
        };
      }
      
      return {
        skyId: query.toUpperCase(),
        entityId: ''
      };
    } catch (e: any) {
      console.error('[FlightService] Failed to resolve airport:', e.message);
      return {
        skyId: query.toUpperCase(),
        entityId: ''
      };
    }
  }

  /**
   * Search for flights between any two airports using Skyscanner Flights API
   */
  public static async searchFlights(
    originIata: string,
    destinationIata: string = 'SXR',
    departureDate: string,
    adults: number = 1,
    cabinClass: string = 'economy'
  ) {
    const originUpper = (originIata || 'DEL').toUpperCase().trim();
    const destUpper = (destinationIata || 'SXR').toUpperCase().trim();
    const apiKey = process.env.RAPIDAPI_KEY || '831a1832afmshb67e276ba8718a8p15c5c3jsn711adf37bfe7';
    const apiHost = process.env.RAPIDAPI_HOST || 'sky-scrapper.p.rapidapi.com';

    // Failsafe fallback if no key is configured
    if (!apiKey) {
      console.warn('[FlightService] Skyscanner RapidAPI Key missing. Seamlessly serving high-fidelity simulated pricing.');
      return this.getMockFlightData(originUpper, destUpper, departureDate, cabinClass);
    }

    try {
      // 1. Resolve Skyscanner specific SkyId and EntityId for Origin and Destination
      const originRes = await this.resolveAirport(originUpper);
      const destRes = await this.resolveAirport(destUpper);

      // 2. Fetch live flight itineraries from Skyscanner Flights
      const searchUrl = new URL(`https://${apiHost}/api/v2/flights/searchFlights`);
      searchUrl.searchParams.append('originSkyId', originRes.skyId);
      searchUrl.searchParams.append('destinationSkyId', destRes.skyId);
      if (originRes.entityId) searchUrl.searchParams.append('originEntityId', originRes.entityId);
      if (destRes.entityId) searchUrl.searchParams.append('destinationEntityId', destRes.entityId);
      searchUrl.searchParams.append('date', departureDate);
      searchUrl.searchParams.append('adults', adults.toString());
      searchUrl.searchParams.append('cabinClass', cabinClass);
      searchUrl.searchParams.append('currency', 'INR');
      searchUrl.searchParams.append('market', 'en-US');
      searchUrl.searchParams.append('countryCode', 'IN');

      const res = await fetch(searchUrl.toString(), {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost
        }
      });

      if (!res.ok) {
        throw new Error(`Skyscanner searchFlights failed with status ${res.status}`);
      }

      const payload: any = await res.json();
      const itineraries = payload?.data?.itineraries || [];

      if (itineraries.length === 0) {
        console.warn(`[FlightService] No flights returned by Skyscanner for ${originUpper} -> ${destUpper}. Serving simulated quotes.`);
        return this.getMockFlightData(originUpper, destUpper, departureDate, cabinClass);
      }

      // 3. Transform Skyscanner itineraries into dynamic client payloads
      const offers = itineraries.slice(0, 6).map((itinerary: any) => {
        const leg = itinerary.legs?.[0];
        const carrier = leg?.carriers?.marketing?.[0] || {};
        const alternateId = carrier.alternateId || ''; // e.g. 6E, AI
        
        // Convert minutes to ISO duration string e.g., 100 -> PT1H40M
        const durationMinutes = leg?.durationInMinutes || 105;
        const hrs = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        const durationIso = `PT${hrs}H${mins}M`;

        const stops = leg?.stopCount || 0;

        return {
          offerId: itinerary.id || `skyscanner_${Math.random()}`,
          totalAmount: Math.round(itinerary.price?.raw || 5500).toString(),
          totalCurrency: itinerary.price?.currency || 'INR',
          airlineName: carrier.name || 'Partner Airline',
          airlineLogo: alternateId 
            ? `https://pics.avs.io/200/200/${alternateId.toUpperCase()}.png`
            : 'https://pics.avs.io/200/200/6E.png',
          departureTime: leg?.departure || `${departureDate}T09:00:00`,
          arrivalTime: leg?.arrival || `${departureDate}T10:45:00`,
          duration: durationIso,
          stops,
          originCode: originUpper,
          destinationCode: destUpper,
          cabinClass
        };
      });

      return {
        success: true,
        offers
      };

    } catch (error: any) {
      console.error('[FlightService] Failed to query Skyscanner API:', error.message);
      console.warn('[FlightService] Activating failsafe high-fidelity real-time mock quote generator.');
      return this.getMockFlightData(originUpper, destUpper, departureDate, cabinClass);
    }
  }

  /**
   * Compute realistic distance-based mock flight data between any two Indian airports
   */
  private static getMockFlightData(origin: string, destination: string, date: string, cabinClass: string = 'economy') {
    // Airport distance tier matrix (from origin perspective)
    const airportTiers: Record<string, { tier: number; city: string }> = {
      'DEL': { tier: 1, city: 'New Delhi' },
      'SXR': { tier: 1, city: 'Srinagar' },
      'BOM': { tier: 2, city: 'Mumbai' },
      'BLR': { tier: 3, city: 'Bengaluru' },
      'MAA': { tier: 3, city: 'Chennai' },
      'CCU': { tier: 2, city: 'Kolkata' },
      'HYD': { tier: 2, city: 'Hyderabad' },
      'AMD': { tier: 2, city: 'Ahmedabad' },
      'PNQ': { tier: 2, city: 'Pune' },
      'JAI': { tier: 1, city: 'Jaipur' },
      'LKO': { tier: 1, city: 'Lucknow' },
      'GOI': { tier: 3, city: 'Goa' },
      'COK': { tier: 3, city: 'Kochi' },
      'GAU': { tier: 2, city: 'Guwahati' },
      'PAT': { tier: 1, city: 'Patna' },
      'IXC': { tier: 1, city: 'Chandigarh' },
      'ATQ': { tier: 1, city: 'Amritsar' },
      'VNS': { tier: 1, city: 'Varanasi' },
    };

    const originInfo = airportTiers[origin] || { tier: 2, city: origin };
    const destInfo = airportTiers[destination] || { tier: 2, city: destination };
    
    // Compute price from tier difference
    const tierDiff = Math.abs(originInfo.tier - destInfo.tier) + 1;
    
    // Base price matrices by route distance
    const basePrices: Record<number, { min: number; max: number; durationMin: number }> = {
      1: { min: 4200, max: 7500, durationMin: 85 },   // Short: ~1.5hrs
      2: { min: 7500, max: 12500, durationMin: 150 },  // Medium: ~2.5hrs
      3: { min: 10500, max: 16800, durationMin: 195 }, // Long: ~3.25hrs
    };

    const priceData = basePrices[tierDiff] || basePrices[2];

    // Cabin class price multipliers
    const cabinMultipliers: Record<string, number> = {
      'economy': 1.0,
      'premium_economy': 1.65,
      'business': 3.2,
      'first': 5.5,
    };
    const multiplier = cabinMultipliers[cabinClass] || 1.0;

    // Seed randomness using date so prices remain stable for same date queries
    const seed = date.split('-').reduce((acc, char) => acc + parseInt(char || '0', 10), 0) || 12;

    // Generate 5 airline offers with varied pricing and schedules
    const airlines = [
      { name: 'IndiGo', code: '6E', baseOffset: 0 },
      { name: 'Air India', code: 'AI', baseOffset: 650 },
      { name: 'SpiceJet', code: 'SG', baseOffset: -300 },
      { name: 'Vistara', code: 'UK', baseOffset: 1200 },
      { name: 'AirAsia India', code: 'I5', baseOffset: -500 },
    ];

    const departureTimes = ['06:00', '08:15', '10:30', '13:45', '16:20'];
    
    const offers = airlines.map((airline, idx) => {
      const seedVariant = ((seed + idx * 7) % 10) / 10;
      const basePrice = Math.floor(priceData.min + (priceData.max - priceData.min) * seedVariant) + airline.baseOffset;
      const price = Math.max(2500, Math.round(basePrice * multiplier));
      
      // Compute departure and arrival times
      const depTime = departureTimes[idx];
      const durationMinutes = priceData.durationMin + (idx % 3) * 15; // Slight variation
      const depHour = parseInt(depTime.split(':')[0]);
      const depMin = parseInt(depTime.split(':')[1]);
      const arrTotalMin = depHour * 60 + depMin + durationMinutes;
      const arrHour = Math.floor(arrTotalMin / 60) % 24;
      const arrMin = arrTotalMin % 60;
      const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;

      const hrs = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;

      return {
        offerId: `mock_${airline.code.toLowerCase()}_${origin.toLowerCase()}_${destination.toLowerCase()}_${idx}`,
        totalAmount: price.toString(),
        totalCurrency: 'INR',
        airlineName: airline.name,
        airlineLogo: `https://pics.avs.io/200/200/${airline.code.toUpperCase()}.png`,
        departureTime: `${date}T${depTime}:00`,
        arrivalTime: `${date}T${arrTime}:00`,
        duration: `PT${hrs}H${mins}M`,
        stops: tierDiff > 2 ? 1 : 0,
        originCode: origin,
        destinationCode: destination,
        cabinClass
      };
    });

    // Sort by price ascending
    offers.sort((a, b) => parseInt(a.totalAmount) - parseInt(b.totalAmount));

    return {
      success: true,
      isSimulation: true,
      offers
    };
  }
}
