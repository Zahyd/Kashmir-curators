import { Duffel } from '@duffel/api';

export class FlightService {
  private static getDuffelClient() {
    return new Duffel({
      // Fallback to test token if not provided in env
      token: process.env.DUFFEL_ACCESS_TOKEN || 'duffel_test_mock_token_abc123'
    });
  }

  /**
   * Search for flights to Srinagar (SXR)
   */
  public static async searchFlights(originIata: string, departureDate: string, adults: number = 1) {
    try {
      const duffel = this.getDuffelClient();

      if (!process.env.DUFFEL_ACCESS_TOKEN) {
        console.warn('DUFFEL_ACCESS_TOKEN missing. Returning mock flight data for simulation.');
        return this.getMockFlightData(originIata, departureDate);
      }

      // Create an Offer Request via Duffel API
      const offerRequestResponse = await duffel.offerRequests.create({
        return_offers: true,
        slices: [
          {
            origin: originIata,
            destination: 'SXR', // Srinagar International Airport
            departure_date: departureDate,
          },
        ] as any,
        passengers: Array.from({ length: adults }).map(() => ({ type: 'adult' })),
        cabin_class: 'economy',
      });

      // Transform raw offers into a simplified payload for the client
      const offers = offerRequestResponse.data.offers.slice(0, 5).map(offer => {
        const slice = offer.slices[0];
        const segment = slice.segments[0];
        return {
          offerId: offer.id,
          totalAmount: offer.total_amount,
          totalCurrency: offer.total_currency,
          airlineName: offer.owner.name,
          airlineLogo: offer.owner.logo_symbol_url,
          departureTime: segment.departing_at,
          arrivalTime: segment.arriving_at,
          duration: slice.duration
        };
      });

      return {
        success: true,
        offers
      };
    } catch (error) {
      console.error('Error fetching flights from Duffel:', (error as any).message);
      return {
        success: false,
        message: 'Flight pricing currently unavailable.',
        offers: []
      };
    }
  }

  private static getMockFlightData(origin: string, date: string) {
    // Generate realistic mock flight prices for the trip planner UI
    return {
      success: true,
      isSimulation: true,
      offers: [
        {
          offerId: 'mock_indigo_1',
          totalAmount: (Math.floor(Math.random() * 4000) + 6000).toString(),
          totalCurrency: 'INR',
          airlineName: 'IndiGo',
          airlineLogo: 'https://assets.duffel.com/img/airlines/sm/6E.png',
          departureTime: `${date}T08:00:00`,
          arrivalTime: `${date}T09:40:00`,
          duration: 'PT1H40M'
        },
        {
          offerId: 'mock_airindia_1',
          totalAmount: (Math.floor(Math.random() * 5000) + 7000).toString(),
          totalCurrency: 'INR',
          airlineName: 'Air India',
          airlineLogo: 'https://assets.duffel.com/img/airlines/sm/AI.png',
          departureTime: `${date}T10:30:00`,
          arrivalTime: `${date}T12:15:00`,
          duration: 'PT1H45M'
        }
      ]
    };
  }
}
