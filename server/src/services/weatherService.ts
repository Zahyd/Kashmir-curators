/**
 * Kashmir Connect CRM - Weather & Snowfall Promotion Service
 * Provides dynamic local weather conditions and triggers high-converting marketing hooks
 */

export interface WeatherAlert {
  destination: string;
  temperature: number;
  condition: string;
  isSnowing: boolean;
  marketingHook: string;
}

export class WeatherService {
  
  /**
   * Evaluates Kashmir local weather and generates conversion-oriented marketing hooks
   */
  public static getPromoAlerts(): WeatherAlert[] {
    const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
    
    // Kashmir seasons: 
    // Winter (Dec - Feb): Prime snowfall season
    // Spring (March - May): Tulip/Bloom season
    // Summer (June - August): Meadow exploration
    // Autumn (Sept - Nov): Golden Chinar season
    const isWinterMonth = currentMonth === 11 || currentMonth === 0 || currentMonth === 1; // Dec, Jan, Feb
    const isSpringMonth = currentMonth >= 2 && currentMonth <= 4; // Mar, Apr, May

    return [
      {
        destination: "Gulmarg",
        temperature: isWinterMonth ? -4 : 12,
        condition: isWinterMonth ? "Snowing" : "Clear Sunny",
        isSnowing: isWinterMonth,
        marketingHook: isWinterMonth
          ? "❄️ Fresh snowfall of 15cm is falling in Gulmarg! The legendary Phase-2 Gondola is open. Secure your winter ski chalet packages today!"
          : "🌸 Spring is in the air! Alpine wildflowers are blooming across Gulmarg's meadows. Plan your bespoke holiday today."
      },
      {
        destination: "Srinagar",
        temperature: isWinterMonth ? 3 : 22,
        condition: isWinterMonth ? "Cold Mist" : "Warm Breeze",
        isSnowing: false,
        marketingHook: isSpringMonth
          ? "🌷 Asia's largest Indira Gandhi Tulip Garden is blooming in Srinagar! Experience the magical carpet of colors this month."
          : "🛶 Enjoy a luxury heritage houseboat stay with a serene sunset Shikara ride across Dal Lake's misty waters."
      },
      {
        destination: "Pahalgam",
        temperature: isWinterMonth ? -1 : 18,
        condition: isWinterMonth ? "Light Snow" : "Partly Cloudy",
        isSnowing: isWinterMonth,
        marketingHook: isWinterMonth
          ? "🌨️ Light snow has turned Pahalgam into a fairy-tale wonderland! Ride ponies through the snow-capped pine valleys of Baisaran."
          : "🌊 The Lidder River is in full flow! Savor pristine mountain walks, white-water rafting, and riverside luxury camping in Pahalgam."
      }
    ];
  }
}
