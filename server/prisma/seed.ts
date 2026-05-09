import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Luxury Kashmir Data...');

  // 1. Packages
  const packages = [
    {
      id: "pkg-royal-kashmir",
      name: "The Royal Kashmir Odyssey",
      destination: "Srinagar - Gulmarg - Pahalgam",
      duration: "7 Days / 6 Nights",
      price: 89999,
      originalPrice: 120000,
      rating: 5.0,
      reviewCount: 128,
      image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1200",
      highlights: JSON.stringify(["Private Shikara Sunset Dinner", "Luxury Houseboat Stay", "Gondola Phase 2 VIP Pass", "Lidder River Private Camping"]),
      inclusions: JSON.stringify(["5-Star Accommodations", "Private Luxury SUV", "Personal Concierge", "All Gourmet Meals", "Entrance Fees"]),
      exclusions: JSON.stringify(["Airfare", "Personal Gratuities", "Alcoholic Beverages"]),
      itinerary: JSON.stringify([
        { day: 1, title: "Srinagar Arrival", description: "VIP pickup and transfer to a luxury houseboat on Nigeen Lake.", activities: ["Airport VIP Pickup", "Wazwan Welcome Lunch", "Sunset Shikara Ride"] },
        { day: 2, title: "Mughal Grandeur", description: "A private guided tour of the royal gardens.", activities: ["Nishat Bagh", "Shalimar Bagh", "Pari Mahal Private Tour"] },
        { day: 3, title: "Gulmarg Heights", description: "Drive to Gulmarg and check into The Khyber.", activities: ["Scenic Drive", "Luxury Resort Check-in", "Heated Pool Relaxation"] },
        { day: 4, title: "Peak Adventure", description: "Soar to Phase 2 of Apharwat Peak.", activities: ["VIP Gondola Entry", "Private Ski Session", "Peak-top Photography"] },
        { day: 5, title: "Pahalgam Retreat", description: "Transfer to the Valley of Shepherds.", activities: ["Betaab Valley Picnic", "River Lidder Walk", "Spa Session"] },
        { day: 6, title: "Aru Valley Exploration", description: "Discover hidden gems of Pahalgam.", activities: ["Horse Riding", "Baisaran Valley", "Village Interaction"] },
        { day: 7, title: "Departure", description: "Final shopping and airport drop.", activities: ["Luxury Souvenir Shopping", "Airport VIP Transfer"] },
      ]),
      bestSeason: "Year Round",
      difficulty: "Easy",
      isFeatured: true
    },
    {
      id: "pkg-winter-wonder",
      name: "Winter Wonderland Luxury",
      destination: "Gulmarg",
      duration: "4 Days / 3 Nights",
      price: 54999,
      originalPrice: 75000,
      rating: 4.9,
      reviewCount: 215,
      image: "https://images.unsplash.com/photo-1582654454409-778ab9fb1be8?w=1200",
      highlights: JSON.stringify(["Private Ski Instructor", "Igloo Cafe Visit", "Heated Suite with Mountain View", "Night Sledding"]),
      inclusions: JSON.stringify(["Khyber Resort Stay", "All Transfers in 4x4", "Gondola VIP Tickets", "Ski Gear"]),
      exclusions: JSON.stringify(["Flights", "Tips"]),
      itinerary: JSON.stringify([
        { day: 1, title: "Snow Welcome", description: "4x4 pickup from Srinagar and drive to Gulmarg.", activities: ["Snow SUV Transfer", "Hot Chocolate Welcome", "Fireplace Suite"] },
        { day: 2, title: "Gondola Experience", description: "Touch the sky at Apharwat.", activities: ["Phase 2 Gondola", "Snowboarding Session"] },
        { day: 3, title: "Ski & Relax", description: "Luxury on the slopes.", activities: ["Private Ski Lesson", "L'Occitane Spa treatment"] },
        { day: 4, title: "Farewell", description: "Return drive to airport.", activities: ["Breakfast", "Scenic Snow Return"] },
      ]),
      bestSeason: "December - March",
      difficulty: "Moderate",
      isFeatured: true
    }
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }

  // 2. Hotels
  const hotels = [
    {
      id: "hotel-khyber",
      name: "The Khyber Himalayan Resort",
      location: "Gulmarg",
      starRating: 5,
      rating: 4.9,
      reviewCount: 1850,
      pricePerNight: 28000,
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
      description: "A world-class luxury resort nestled in the Pir Panjal range.",
      amenities: JSON.stringify(["Heated Pool", "Full-Service Spa", "Ski-in/Ski-out", "Fine Dining", "Butler Service"]),
      roomTypes: JSON.stringify([
        { id: "r1", name: "Premier Mountain View", price: 28000, capacity: 2, amenities: ["Balcony", "Floor Heating", "Luxury Tub"] },
        { id: "r2", name: "Luxury Cottage", price: 45000, capacity: 4, amenities: ["2 Bedrooms", "Private Fireplace", "Kitchenette"] },
      ]),
    },
    {
      id: "hotel-taj",
      name: "Taj Dal View",
      location: "Srinagar",
      starRating: 5,
      rating: 4.8,
      reviewCount: 920,
      pricePerNight: 22000,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
      description: "Perched on a hill with a panoramic view of the iconic Dal Lake.",
      amenities: JSON.stringify(["Infinity Pool", "Award-winning Spa", "Orchard Garden", "Tea Lounge"]),
      roomTypes: JSON.stringify([
        { id: "r1", name: "Luxury Lake View", price: 22000, capacity: 2, amenities: ["Full Lake View", "Heritage Decor"] },
        { id: "r2", name: "Presidential Suite", price: 65000, capacity: 3, amenities: ["Private Terrace", "Dining Area"] },
      ]),
    }
  ];

  for (const hotel of hotels) {
    await prisma.hotel.upsert({
      where: { id: hotel.id },
      update: {},
      create: hotel,
    });
  }

  // 3. Cabs
  const cabs = [
    {
      id: "cab-innova-crysta",
      type: "Luxury SUV",
      name: "Innova Crysta Luxury",
      capacity: 6,
      pricePerKm: 25,
      basePrice: 3500,
      image: "https://images.unsplash.com/photo-1606611013016-969c19ba27ae?w=800",
      features: JSON.stringify(["Captain Seats", "Ambient Lighting", "WiFi", "Cold Refreshments", "Phone Chargers"]),
    },
    {
      id: "cab-fortuner",
      type: "4x4 SUV",
      name: "Fortuner 4x4 Elite",
      capacity: 5,
      pricePerKm: 35,
      basePrice: 5000,
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
      features: JSON.stringify(["All-Terrain", "Sunroof", "Premium Audio", "Heated Seats"]),
    }
  ];

  for (const cab of cabs) {
    await prisma.cab.upsert({
      where: { id: cab.id },
      update: {},
      create: cab,
    });
  }

  // 4. Testimonials
  const testimonials = [
    {
      id: "test-1",
      name: "Alexandra Wright",
      avatar: "https://i.pravatar.cc/150?u=alexandra",
      location: "London, UK",
      rating: 5,
      content: "The Royal Kashmir Odyssey was beyond anything I expected. The private shikara dinner was magical.",
      packageName: "The Royal Kashmir Odyssey"
    },
    {
      id: "test-2",
      name: "James Chen",
      avatar: "https://i.pravatar.cc/150?u=james",
      location: "Singapore",
      rating: 5,
      content: "Gulmarg in winter is a dream, and the Khyber resort is the crown jewel. Truly world-class service.",
      packageName: "Winter Wonderland Luxury"
    }
  ];

  for (const test of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: test.id },
      update: {},
      create: test,
    });
  }

  // 5. FAQs
  const faqs = [
    {
      id: "faq-1",
      question: "What is the best way to travel between Srinagar and Gulmarg?",
      answer: "We recommend our Luxury SUV service for the most comfortable and scenic experience. The drive takes about 1.5 to 2 hours.",
      category: "Transport"
    },
    {
      id: "faq-2",
      question: "Do you offer private tour guides?",
      answer: "Yes, all our luxury packages include a personal concierge and professional local guides fluent in multiple languages.",
      category: "Service"
    }
  ];

  for (const faq of faqs) {
    await prisma.fAQ.upsert({
      where: { id: faq.id },
      update: {},
      create: faq
    });
  }

  console.log('Luxury Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
