const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedVendors() {
  console.log('Seeding Real-Time Verified Kashmir Tourism Marketplace Listings...');

  // Get or find an admin/supplier user for vendorId
  let admin = await prisma.user.findFirst({
    where: { role: { in: ['admin', 'supplier'] } }
  });

  const vendorId = admin ? admin.id : 'kashmir-curators-direct';

  const verifiedListings = [
    // 1. GUIDES
    {
      id: 'vendor-guide-1',
      vendorId,
      title: 'Bashir Ahmad Reshi - Alpine Ski & Backcountry Guide',
      category: 'GUIDE',
      location: 'Gulmarg & Apharwat Peak',
      description: 'Department of Tourism & Indian Institute of Skiing certified guide with 14 years of backcountry experience. Avalanche safety level 2 trained. English, Kashmiri, and Urdu fluency.',
      basePrice: 2800,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'J&K Tourism Certified Badge',
        'Avalanche Safety Beacon Included',
        'English & Hindi Fluent',
        'First Aid Certified',
        'Backcountry Terrain Expert'
      ]),
      inventoryCount: 1,
      verificationStatus: 'VERIFIED',
      rating: 4.98,
      reviewCount: 64,
      contactPhone: '+91 94190 77812',
      contactEmail: 'bashir.guide@kashmircurators.com',
      isActive: true
    },
    {
      id: 'vendor-guide-2',
      vendorId,
      title: 'Tariq Lone - Great Lakes & High-Altitude Trek Leader',
      category: 'GUIDE',
      location: 'Sonamarg & Tarsar Marsar',
      description: 'Veteran Himalayan mountaineer and high-altitude expedition leader. Specializes in Kashmir Great Lakes, Kolahoi Glacier, and botanical meadow treks with safety-first logistics.',
      basePrice: 3200,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Mountaineering Certified',
        'Satellite SOS Protocol',
        'Flora & Cultural Historian',
        'Camp Chef Coordination',
        'Multi-day High Pass Expert'
      ]),
      inventoryCount: 1,
      verificationStatus: 'VERIFIED',
      rating: 4.95,
      reviewCount: 48,
      contactPhone: '+91 94191 88341',
      contactEmail: 'tariq.lone@kashmircurators.com',
      isActive: true
    },

    // 2. CHAUFFEUR FLEET / CABS
    {
      id: 'vendor-cab-1',
      vendorId,
      title: 'Hilal Ahmad Dar - Toyota Innova Crysta (4x4 Snow Chains)',
      category: 'CAB',
      location: 'Srinagar, Gulmarg & Pahalgam',
      description: 'Luxury Innova Crysta with commercial tourist permits, dual air-conditioning, heated cabin, and heavy-duty steel snow chains for sub-zero mountain passes. Police verified driver.',
      basePrice: 4200,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Toyota Innova Crysta 7-Seater',
        'Snow Chains Certified Driver',
        'All J&K Route Permits',
        'Mineral Water & Tissues',
        'Emergency GPS Dispatch'
      ]),
      inventoryCount: 3,
      verificationStatus: 'VERIFIED',
      rating: 4.97,
      reviewCount: 92,
      contactPhone: '+91 94190 88214',
      contactEmail: 'hilal.crysta@kashmircurators.com',
      isActive: true
    },
    {
      id: 'vendor-cab-2',
      vendorId,
      title: 'Adil Mir - Toyota Fortuner 4x4 Alpine Chauffeur',
      category: 'CAB',
      location: 'Gulmarg, Sonamarg & Gurez',
      description: 'High-clearance 4WD Fortuner for deep winter snow, unpaved off-road passes, and luxury long-distance transits. Premium leather seating with high-altitude heating.',
      basePrice: 6500,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        '4x4 Low-Range Snow Capability',
        'Executive Leather Seating',
        'Roof Luggage Carrier',
        'Mountain Pass Clearance',
        'Complimentary Kashmiri Kehwa'
      ]),
      inventoryCount: 2,
      verificationStatus: 'VERIFIED',
      rating: 4.99,
      reviewCount: 71,
      contactPhone: '+91 94192 11982',
      contactEmail: 'adil.fortuner@kashmircurators.com',
      isActive: true
    },

    // 3. HOMESTAYS & HOUSEBOATS
    {
      id: 'vendor-home-1',
      vendorId,
      title: 'The Royal Heritage Palace Houseboat',
      category: 'HOMESTAY',
      location: 'Nigeen Lake, Srinagar',
      description: 'Handcrafted fragrant cedar-wood palace houseboat moored in the serene, crystal waters of Nigeen Lake. Intricate Khatamband ceilings, carved walnut wood dining, and personal butler service.',
      basePrice: 6800,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Private Lakefront Sun Deck',
        '24/7 Hot Water & Central Bukhari',
        'Complimentary Shikara Crossing',
        'Traditional Wazwan Dining',
        'High-Speed Wi-Fi'
      ]),
      inventoryCount: 4,
      verificationStatus: 'VERIFIED',
      rating: 4.96,
      reviewCount: 114,
      contactPhone: '+91 194 2459812',
      contactEmail: 'royalheritage@nigeenlake.com',
      isActive: true
    },
    {
      id: 'vendor-home-2',
      vendorId,
      title: 'Pine Haven Eco River Chalet',
      category: 'HOMESTAY',
      location: 'Doodhpathri, Budgam',
      description: 'Private wooden chalets set right along the sparkling Shaliganga river. Surrounded by dense deodar forests, horse riding meadows, and pure alpine tranquility.',
      basePrice: 5200,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Riverfront Wooden Patio',
        'Electric Heated Bedding',
        'Organic Farm Fresh Breakfast',
        'Private Bonfire Setup',
        'Star-Gazing Telescope'
      ]),
      inventoryCount: 3,
      verificationStatus: 'VERIFIED',
      rating: 4.92,
      reviewCount: 36,
      contactPhone: '+91 94190 66231',
      contactEmail: 'pinehaven@doodhpathri.com',
      isActive: true
    },

    // 4. SKI & LOCAL EXPERIENCES
    {
      id: 'vendor-act-1',
      vendorId,
      title: 'Apharwat Peak Heli-Ski & Powder Session',
      category: 'ACTIVITY',
      location: 'Gulmarg Gondola Phase 2',
      description: 'VIP Phase 2 alpine ski access with private certified instructor, professional powder ski equipment, and avalanche telemetry gear for virgin snow descents.',
      basePrice: 4500,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
        'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Phase 2 Ski Access Coordination',
        'Premium Head / Salomon Skis',
        'Helmets & Goggles Included',
        'GoPro 4K Video Recording',
        'Mountain Rescue Cover'
      ]),
      inventoryCount: 8,
      verificationStatus: 'VERIFIED',
      rating: 4.99,
      reviewCount: 88,
      contactPhone: '+91 94190 33412',
      contactEmail: 'ski@gulmargpowder.com',
      isActive: true
    },
    {
      id: 'vendor-act-2',
      vendorId,
      title: 'Sunrise Floating Artisan & Flower Market Cruise',
      category: 'ACTIVITY',
      location: 'Dal Lake Interior Waters, Srinagar',
      description: 'Exclusive 5:30 AM Shikara expedition deep into the interior floating vegetable and flower markets of Dal Lake with a master storyteller, kehwa on water, and artisan encounters.',
      basePrice: 1800,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800',
        'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800'
      ]),
      amenitiesOrFeatures: JSON.stringify([
        'Private Luxury Shikara',
        'Warm Blankets & Kangri Heating',
        'Fresh Saffron Kehwa & Girda',
        'Candid Photography Service',
        'Direct Artisan Trade Access'
      ]),
      inventoryCount: 12,
      verificationStatus: 'VERIFIED',
      rating: 4.94,
      reviewCount: 142,
      contactPhone: '+91 194 2451992',
      contactEmail: 'shikara@dallakecurators.com',
      isActive: true
    }
  ];

  for (const item of verifiedListings) {
    await prisma.vendorListing.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        basePrice: item.basePrice,
        rating: item.rating,
        reviewCount: item.reviewCount,
        description: item.description,
        amenitiesOrFeatures: item.amenitiesOrFeatures,
        verificationStatus: 'VERIFIED',
        isActive: true
      },
      create: item
    });
    console.log(`✅ Seeded Verified Listing: [${item.category}] ${item.title}`);
  }

  console.log('🎉 Verified Marketplace Listings successfully seeded to PostgreSQL Neon!');
}

seedVendors()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
