export interface AiItineraryRequest {
  duration: string; // e.g. "5 Days / 4 Nights"
  travelers: string; // e.g. "2 Adults (Honeymoon)"
  theme: 'HONEYMOON' | 'FAMILY' | 'ADVENTURE_SKI' | 'OFFBEAT_GUREZ' | 'HERITAGE_CRAFT';
  season?: string; // "Winter", "Spring", "Summer", "Autumn"
  budgetTier?: 'STANDARD' | 'PREMIUM' | 'LUXURY';
  customNotes?: string;
}

export interface AiItineraryDay {
  day: number;
  title: string;
  location: string;
  activities: string[];
  stayRecommendation: string;
  mealPlan: string;
  transportAdvice: string;
  localProTip: string;
}

export interface AiItineraryResponse {
  packageName: string;
  theme: string;
  estimatedPrice: number;
  recommendedVehicle: string;
  days: AiItineraryDay[];
  winterSafetyAdvisory?: string;
  generatedVia: 'NEON_AI_GATEWAY' | 'KASHMIR_CURATOR_EXPERT_CORE';
}

export const aiGatewayService = {
  async generateItinerary(req: AiItineraryRequest): Promise<AiItineraryResponse> {
    const neonGatewayUrl = process.env.NEON_AI_GATEWAY_URL || process.env.AI_GATEWAY_ENDPOINT;
    const apiKey = process.env.NEON_AI_KEY || process.env.OPENAI_API_KEY;

    if (neonGatewayUrl && apiKey) {
      try {
        const prompt = `You are the lead travel curator at Kashmir Connect. Generate a highly detailed, authentic luxury itinerary for Kashmir based on:
Duration: ${req.duration}
Travelers: ${req.travelers}
Theme: ${req.theme}
Season: ${req.season || 'Current Season'}
Budget Tier: ${req.budgetTier || 'PREMIUM'}
Notes: ${req.customNotes || 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "packageName": string,
  "theme": string,
  "estimatedPrice": number,
  "recommendedVehicle": string,
  "winterSafetyAdvisory": string,
  "days": [
    {
      "day": number,
      "title": string,
      "location": string,
      "activities": [string],
      "stayRecommendation": string,
      "mealPlan": string,
      "transportAdvice": string,
      "localProTip": string
    }
  ]
}`;

        const res = await fetch(`${neonGatewayUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Neon-Cache': 'true' // Neon AI Gateway caching
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });

        if (res.ok) {
          const data: any = await res.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          return {
            ...parsed,
            generatedVia: 'NEON_AI_GATEWAY'
          };
        }
      } catch (err) {
        console.warn('Neon AI Gateway call failed, falling back to Expert Curator Core:', err);
      }
    }

    // High-Fidelity Kashmir Expert Fallback Engine
    return this.generateExpertCuratedItinerary(req);
  },

  generateExpertCuratedItinerary(req: AiItineraryRequest): AiItineraryResponse {
    const isWinter = (req.season || '').toLowerCase().includes('winter') || req.theme === 'ADVENTURE_SKI';
    const isHoneymoon = req.theme === 'HONEYMOON';

    const baseDays: AiItineraryDay[] = [
      {
        day: 1,
        title: 'Arrival in Paradise & Sunset on Nigeen Lake',
        location: 'Srinagar & Nigeen Lake',
        activities: [
          'Chauffeur pickup from Srinagar Airport with traditional Saffron Kahwa greeting',
          'Private Shikara crossing to Handcrafted Cedar Wood Houseboat',
          'Evening heritage walk around the Lotus Garden corridor of Nigeen Lake',
          'Candle-light 4-course authentic Kashmiri Wazwan dinner'
        ],
        stayRecommendation: 'Nigeen Lake Royal Cedar Houseboat (Heated Suites)',
        mealPlan: 'MAP (Breakfast & Dinner)',
        transportAdvice: 'Private Toyota Innova Crysta dedicated chauffeur',
        localProTip: 'Arrive at the airport before 1:00 PM to catch the magical golden hour mist across the Pir Panjal mountains.'
      },
      {
        day: 2,
        title: 'The Meadow of Gold & Snow Peaks',
        location: 'Gulmarg (8,690 ft)',
        activities: [
          'Scenic drive through apple orchards and Tangmarg alpine pine forests',
          'Priority Gondola Cable Car ascent to Phase 1 (Kongdoori) & Phase 2 (Apharwat Peak at 13,780 ft)',
          isWinter ? 'Guided backcountry skiing & snowmobiling on powder slopes' : 'Golf course walk & horse ride to Strawberry Valley',
          'Warm Kahwa & steaming Kashmiri Harissa at the highest cafe'
        ],
        stayRecommendation: 'The Highland Alpine Chalet & Spa (Heated Floor Suites)',
        mealPlan: 'CP (Breakfast Included)',
        transportAdvice: '4x4 Snow Chain clearance above Tangmarg Checkpost',
        localProTip: 'Gondola tickets should be validated 48 hours prior through the Kashmir Connect DMC desk to bypass the queue.'
      },
      {
        day: 3,
        title: 'The Valley of Shepherds & Lidder Waters',
        location: 'Pahalgam (7,200 ft)',
        activities: [
          'Drive past saffron fields of Pampore and willow bat factories in Sangam',
          'Check-in at pine-fringed riverside luxury cottage',
          'Pony trek through untouched pine forests to Baisaran Valley (Mini Switzerland)',
          'Evening bonfire with roasted Kashmiri trout by the Lidder River'
        ],
        stayRecommendation: 'Pahalgam Pine Valley Eco Chalet',
        mealPlan: 'MAP (Breakfast & Dinner)',
        transportAdvice: 'Chauffeur standby for Aru & Chandanwari local pass transit',
        localProTip: 'Try freshly baked Lavasa bread from the local Kandur bakery near Pahalgam main market at 4 PM.'
      },
      {
        day: 4,
        title: 'Untouched Aru Valley & Old Srinagar Craft Trails',
        location: 'Aru Valley & Old Srinagar (Downtown)',
        activities: [
          'Morning expedition into pristine Aru Valley alpine pastures',
          'Return transit to Srinagar for the Old Downtown Artisan Heritage Trail',
          'Live demonstration of GI-tagged Pashmina weaving and Papier-mâché craft studios',
          'Sunset photography at Pari Mahal overlooking Dal Lake'
        ],
        stayRecommendation: 'The Chinar Grand Heritage Hotel, Boulevard Road',
        mealPlan: 'CP (Breakfast Included)',
        transportAdvice: 'Private Chauffeur with downtown historical guide clearance',
        localProTip: 'Purchase saffron and walnuts only from verified grower cooperatives with government GI certification tags.'
      },
      {
        day: 5,
        title: 'Morning Floating Market & Departure with Memories',
        location: 'Dal Lake & Srinagar Airport',
        activities: [
          'Dawn Shikara expedition to the 150-year-old Floating Vegetable & Flower Market',
          'Traditional Kashmiri breakfast on the lake with fresh Nadru pakoras',
          'Last-minute souvenir curation at Government Arts Emporium',
          'Assisted departure transfer to Srinagar Airport with security clearance buffer'
        ],
        stayRecommendation: 'Departure',
        mealPlan: 'EP (Breakfast before departure)',
        transportAdvice: 'Airport drop 2.5 hours prior to flight departure',
        localProTip: 'Keep your camera handy on the left side of the aircraft during takeoff for an aerial panorama of the snow-clad Pir Panjal range.'
      }
    ];

    const pricePerHead = req.budgetTier === 'LUXURY' ? 48500 : req.budgetTier === 'PREMIUM' ? 34500 : 23500;

    return {
      packageName: `${isWinter ? 'Winter Wonderland' : 'Grand Alpine'} Kashmir Experience (${req.duration || '5D/4N'})`,
      theme: req.theme,
      estimatedPrice: pricePerHead * 2,
      recommendedVehicle: isWinter ? 'Toyota Innova Crysta (4x4 Snow Chains)' : 'Private Innova Crysta Chauffeur',
      winterSafetyAdvisory: isWinter ? 'Snow chains mandatory on Gulmarg & Sonamarg passes. Heated rooms and 24/7 power backup verified.' : undefined,
      days: baseDays,
      generatedVia: 'KASHMIR_CURATOR_EXPERT_CORE'
    };
  }
};
