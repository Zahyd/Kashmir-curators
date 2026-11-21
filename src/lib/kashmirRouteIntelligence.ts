export interface RouteIntelligence {
  route: string;
  distanceKm: number;
  driveTime: string;
  elevation: string;
  scenicHighlight: string;
  mountainAdvisory?: string;
  recommendedDeparture?: string;
  vehicleRecommendation?: string;
}

export function getRouteIntelligence(
  title: string = '',
  activities: string = '',
  dayNumber: number = 1
): RouteIntelligence {
  const text = `${title} ${activities}`.toLowerCase();

  // Gurez & Razdan Pass
  if (text.includes('gurez') || text.includes('razdan') || text.includes('dawar')) {
    return {
      route: 'Srinagar ⇄ Gurez Valley (via Razdan Pass)',
      distanceKm: 123,
      driveTime: '~4h 30m',
      elevation: 'Razdan Pass • 11,672 ft',
      scenicHighlight: 'Wular Lake vistas, Kishanganga River & Habba Khatoon Pyramid Peak',
      mountainAdvisory: 'Inner-Line checkpoint clearance at Tragbal. 4x4 or high-clearance SUV advised.',
      recommendedDeparture: '07:30 AM',
      vehicleRecommendation: '4x4 Mountain SUV / Innova Crysta'
    };
  }

  // Inter-resort direct: Pahalgam to Gulmarg or vice versa
  if (
    (text.includes('gulmarg') && text.includes('pahalgam')) ||
    (text.includes('pahalgam') && text.includes('gulmarg'))
  ) {
    return {
      route: 'Pahalgam ⇄ Gulmarg Highland Crossing',
      distanceKm: 140,
      driveTime: '~3h 45m',
      elevation: 'Foothill Highway & Pine Ascent • 8,690 ft',
      scenicHighlight: 'Apple belt of Shopian/Baramulla and panoramic Pir Panjal foothills',
      mountainAdvisory: 'Depart before 08:30 AM to bypass Srinagar outskirts traffic bottle-necks.',
      recommendedDeparture: '08:00 AM',
      vehicleRecommendation: 'Toyota Innova Crysta VIP'
    };
  }

  // Gulmarg / Tangmarg / Apharwat
  if (text.includes('gulmarg') || text.includes('apharwat') || text.includes('tangmarg')) {
    if (text.includes('apharwat') || text.includes('gondola') || text.includes('phase 2') || text.includes('phase 1')) {
      return {
        route: 'Gulmarg Resort ⇄ Apharwat Peak Ridge',
        distanceKm: 12,
        driveTime: 'Gondola Cable Car (18 mins)',
        elevation: 'Apharwat Alpine Ridge • 14,000 ft',
        scenicHighlight: 'Pir Panjal range, Alpather glacial lake & Nanga Parbat views',
        mountainAdvisory: 'Board Phase 2 before 11:30 AM before afternoon alpine fog and high wind holds.',
        recommendedDeparture: '09:00 AM (VIP Boarding)',
        vehicleRecommendation: 'Cable Car / Local Ski Chauffeur'
      };
    }
    return {
      route: 'Srinagar ⇄ Gulmarg Pine Corridor',
      distanceKm: 51,
      driveTime: '~1h 45m',
      elevation: 'Mountain Ascent • 8,690 ft',
      scenicHighlight: 'Tangmarg ancient pine winding climb and snowline transition',
      mountainAdvisory: 'Anti-skid chains installed at Tangmarg police post in winter/snow conditions.',
      recommendedDeparture: '09:00 AM',
      vehicleRecommendation: 'Dedicated Luxury Cab (Innova / Sedan)'
    };
  }

  // Pahalgam / Betaab / Aru / Chandanwari / Lidder
  if (
    text.includes('pahalgam') ||
    text.includes('betaab') ||
    text.includes('aru') ||
    text.includes('chandanwari') ||
    text.includes('baisaran') ||
    text.includes('lidder')
  ) {
    if (text.includes('aru') || text.includes('betaab') || text.includes('chandanwari') || text.includes('baisaran')) {
      return {
        route: 'Pahalgam Valley Circuit (Betaab • Aru • Chandanwari)',
        distanceKm: 38,
        driveTime: '~1h 20m total transit',
        elevation: 'Sub-Alpine Conifer Valleys • 7,900 ft',
        scenicHighlight: 'Crystal turquoise Lidder rapids, alpine meadows & virgin birch stands',
        mountainAdvisory: 'Regulated tourist taxi union zone for interior valleys. Pre-arranged voucher ready.',
        recommendedDeparture: '09:30 AM',
        vehicleRecommendation: 'Local Union Authorized 4x4 / MUV'
      };
    }
    return {
      route: 'Srinagar ⇄ Pahalgam Valley of Shepherds',
      distanceKm: 90,
      driveTime: '~2h 15m',
      elevation: 'NH44 & River Valley • 7,200 ft',
      scenicHighlight: 'Purple Pampore Saffron Fields, 10th-century Avantipura Ruins & Sangam willow bat crafts',
      mountainAdvisory: 'Smooth expressway drive. Scenic riverside chai break recommended at Charsoo.',
      recommendedDeparture: '08:30 AM',
      vehicleRecommendation: 'Toyota Innova Crysta / Executive Sedan'
    };
  }

  // Sonamarg / Thajiwas / Zojila / Zero Point
  if (
    text.includes('sonamarg') ||
    text.includes('thajiwas') ||
    text.includes('zojila') ||
    text.includes('baltal') ||
    text.includes('zero point')
  ) {
    return {
      route: 'Srinagar ⇄ Sonamarg Meadow of Gold (via Sindh Gorge)',
      distanceKm: 80,
      driveTime: '~2h 15m',
      elevation: 'Alpine Gorge • 8,960 ft',
      scenicHighlight: 'Raging Sindh river gorge, Thajiwas Glacial moraines & high peaks',
      mountainAdvisory: 'Z-Morh Tunnel active. In winter, verify Gagangir transit gate timing before departing.',
      recommendedDeparture: '08:00 AM',
      vehicleRecommendation: 'Luxury SUV / High-Ground Clearance'
    };
  }

  // Doodhpathri
  if (text.includes('doodhpathri') || text.includes('doodh') || text.includes('shaliganga')) {
    return {
      route: 'Srinagar ⇄ Doodhpathri Valley of Milk',
      distanceKm: 42,
      driveTime: '~1h 30m',
      elevation: 'Pine Pasture Plateau • 8,957 ft',
      scenicHighlight: 'Pristine Shaliganga riverbed boulders & vast uncrowded deodar meadows',
      mountainAdvisory: 'Gentle hill drive with quiet rural vistas. Ideal serene picnic day.',
      recommendedDeparture: '09:30 AM',
      vehicleRecommendation: 'Private Luxury Sedan / SUV'
    };
  }

  // Yusmarg
  if (text.includes('yusmarg') || text.includes('doodh ganga')) {
    return {
      route: 'Srinagar ⇄ Yusmarg Meadows of Jesus',
      distanceKm: 47,
      driveTime: '~1h 35m',
      elevation: 'Pine Plateau • 7,860 ft',
      scenicHighlight: 'Dense conifer forests, Doodh Ganga natural cascade & Sunset Peak view',
      mountainAdvisory: 'Low traffic density; great for horseback riding excursions without commercial bustle.',
      recommendedDeparture: '09:00 AM',
      vehicleRecommendation: 'Private Luxury Sedan / SUV'
    };
  }

  // Airport Transfer
  if (
    text.includes('airport') ||
    text.includes('arrival') ||
    text.includes('departure') ||
    text.includes('flight') ||
    text.includes('sxr')
  ) {
    return {
      route: 'Sheikh ul-Alam Airport (SXR) ⇄ Srinagar Center / Dal Lake',
      distanceKm: 18,
      driveTime: '~35-45m',
      elevation: 'Valley Urban Transit • 5,200 ft',
      scenicHighlight: 'Chinar-lined civil lines avenue & Dal Lake Boulevard gateway',
      mountainAdvisory: 'High-security multi-tier perimeter check. Arrive 2.5 hours prior to flight.',
      recommendedDeparture: 'Scheduled per flight',
      vehicleRecommendation: 'VIP Chauffeur Pickup / Innova Crysta'
    };
  }

  // Srinagar Heritage & Dal Lake
  if (
    text.includes('dal') ||
    text.includes('shikara') ||
    text.includes('mughal') ||
    text.includes('nishat') ||
    text.includes('shalimar') ||
    text.includes('heritage') ||
    text.includes('nigeen') ||
    text.includes('wazwan') ||
    text.includes('pashmina')
  ) {
    return {
      route: 'Srinagar Heritage, Mughal Gardens & Boulevard Circuit',
      distanceKm: 24,
      driveTime: '~45m leisure transit',
      elevation: 'Lake Basin Promenade • 5,200 ft',
      scenicHighlight: 'Zabarwan mountain backdrop, terraced Royal water canals & floating gardens',
      mountainAdvisory: 'Optimal private Shikara cruise hour is 05:00 PM (Sunset Golden Hour).',
      recommendedDeparture: '10:00 AM / 04:30 PM Shikara',
      vehicleRecommendation: 'Private Dedicated City Chauffeur'
    };
  }

  // Default fallback
  return {
    route: `Day ${dayNumber} Curated Scenic Circuit`,
    distanceKm: 30,
    driveTime: '~1h 00m',
    elevation: 'Kashmir Valley Plateau • 5,200 ft',
    scenicHighlight: 'Scenic mountain highways, village walnut orchards & local bazaar stops',
    mountainAdvisory: 'Dedicated chauffeur stays with guests on 100% on-demand standby.',
    recommendedDeparture: '09:30 AM',
    vehicleRecommendation: 'Private Luxury Sedan / SUV'
  };
}

export function calculateTripLogistics(days: Array<{ title?: string; activities?: string }>) {
  let totalKm = 0;
  const routes: string[] = [];

  days.forEach((day, index) => {
    const intel = getRouteIntelligence(day.title || '', day.activities || '', index + 1);
    totalKm += intel.distanceKm;
    if (intel.route && !routes.includes(intel.route)) {
      routes.push(intel.route);
    }
  });

  return {
    totalDistanceKm: totalKm,
    uniqueRoutesCount: routes.length,
    routes
  };
}
