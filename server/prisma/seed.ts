import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Packages
  const packages = [
    {
      id: "pkg-1",
      name: "Kashmir Paradise Explorer",
      destination: "Srinagar",
      duration: "5 Days / 4 Nights",
      price: 24999,
      originalPrice: 32999,
      rating: 4.8,
      reviewCount: 324,
      image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800",
      highlights: JSON.stringify(["Dal Lake Shikara Ride", "Mughal Gardens", "Houseboat Stay", "Local Cuisine Experience"]),
      inclusions: JSON.stringify(["Accommodation", "Breakfast & Dinner", "All Transfers", "Sightseeing", "Tour Guide"]),
      exclusions: JSON.stringify(["Flights", "Personal Expenses", "Travel Insurance", "Entry Fees"]),
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Srinagar", description: "Welcome to Paradise! Transfer to houseboat.", activities: ["Airport Pickup", "Houseboat Check-in", "Shikara Ride at Sunset"] },
        { day: 2, title: "Mughal Gardens Tour", description: "Explore the magnificent Mughal heritage.", activities: ["Nishat Bagh", "Shalimar Bagh", "Chashme Shahi", "Local Market Visit"] },
        { day: 3, title: "Gulmarg Day Trip", description: "Experience the meadow of flowers.", activities: ["Gondola Ride", "Snow Activities", "Golf Course Visit"] },
        { day: 4, title: "Pahalgam Excursion", description: "Valley of Shepherds awaits.", activities: ["Betaab Valley", "Aru Valley", "Lidder River Walk"] },
        { day: 5, title: "Departure", description: "Bid farewell to Kashmir.", activities: ["Breakfast", "Local Shopping", "Airport Transfer"] },
      ]),
      bestSeason: "March - October",
      difficulty: "Easy",
    },
    {
      id: "pkg-2",
      name: "Gulmarg Winter Wonderland",
      destination: "Gulmarg",
      duration: "4 Days / 3 Nights",
      price: 19999,
      originalPrice: 26999,
      rating: 4.9,
      reviewCount: 456,
      image: "https://images.unsplash.com/photo-1582654454409-778ab9fb1be8?w=800",
      highlights: JSON.stringify(["Gondola Ride", "Skiing Experience", "Snow Activities", "Mountain Views"]),
      inclusions: JSON.stringify(["Hotel Stay", "All Meals", "Transfers", "Gondola Tickets", "Ski Equipment"]),
      exclusions: JSON.stringify(["Flights", "Personal Expenses", "Insurance"]),
      itinerary: JSON.stringify([
        { day: 1, title: "Arrival in Gulmarg", description: "Welcome to snow paradise.", activities: ["Hotel Check-in", "Evening Snow Walk"] },
        { day: 2, title: "Gondola Adventure", description: "World's highest cable car ride.", activities: ["Phase 1 Gondola", "Phase 2 to Apharwat Peak", "Snow Activities"] },
        { day: 3, title: "Skiing Day", description: "Learn or enjoy skiing.", activities: ["Ski Training", "Free Skiing", "Snowboarding Option"] },
        { day: 4, title: "Departure", description: "Return with memories.", activities: ["Breakfast", "Departure Transfer"] },
      ]),
      bestSeason: "December - March",
      difficulty: "Moderate",
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
      id: "hotel-1",
      name: "The Lalit Grand Palace",
      location: "Srinagar",
      starRating: 5,
      rating: 4.9,
      reviewCount: 1245,
      pricePerNight: 12999,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      description: "A historic palace hotel overlooking the Dal Lake.",
      amenities: JSON.stringify(["WiFi", "Pool", "Spa", "Restaurant", "Room Service", "Gym", "Lake View"]),
      roomTypes: JSON.stringify([
        { id: "r1", name: "Deluxe Room", price: 12999, capacity: 2, amenities: ["King Bed", "Lake View", "Balcony"] },
        { id: "r2", name: "Premium Suite", price: 18999, capacity: 3, amenities: ["Living Room", "Lake View", "Butler Service"] },
        { id: "r3", name: "Royal Suite", price: 29999, capacity: 4, amenities: ["2 Bedrooms", "Private Pool", "Personal Chef"] },
      ]),
    },
    {
      id: "hotel-3",
      name: "Khyber Himalayan Resort",
      location: "Gulmarg",
      starRating: 5,
      rating: 4.9,
      reviewCount: 756,
      pricePerNight: 19999,
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      description: "A luxury resort in the heart of the Himalayas.",
      amenities: JSON.stringify(["WiFi", "Heated Pool", "Spa", "Ski Access", "Restaurant", "Fireplace"]),
      roomTypes: JSON.stringify([
        { id: "r1", name: "Mountain View Room", price: 19999, capacity: 2, amenities: ["King Bed", "Fireplace", "Balcony"] },
        { id: "r2", name: "Cottage", price: 29999, capacity: 4, amenities: ["2 Rooms", "Private Garden", "Jacuzzi"] },
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
      id: "cab-1",
      type: "sedan",
      name: "Swift Dzire",
      capacity: 4,
      pricePerKm: 14,
      basePrice: 1500,
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
      features: JSON.stringify(["AC", "Music System", "Comfortable Seats"]),
    },
    {
      id: "cab-3",
      type: "premium",
      name: "Innova Crysta",
      capacity: 6,
      pricePerKm: 22,
      basePrice: 2500,
      image: "https://images.unsplash.com/photo-1606611013016-969c19ba27ae?w=400",
      features: JSON.stringify(["AC", "Premium Interior", "WiFi", "Charging Points", "Extra Legroom"]),
    }
  ];

  for (const cab of cabs) {
    await prisma.cab.upsert({
      where: { id: cab.id },
      update: {},
      create: cab,
    });
  }

  // 4. FAQs
  const faqs = [
    {
      question: "What is the best time to visit Kashmir?",
      answer: "Kashmir is beautiful year-round! Spring (March-May) offers blooming tulips and pleasant weather.",
      category: "general"
    },
    {
      question: "Is Kashmir safe for tourists?",
      answer: "Yes, Kashmir is very safe for tourists.",
      category: "safety"
    }
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: faq
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
