import prisma from '../lib/prisma';

async function seed() {
  console.log('Seeding initial property rooms and categories into Neon DB...');

  const lalit = await prisma.hotel.findFirst({ where: { id: 'hotel-1' } });
  if (lalit) {
    const existingCats = await prisma.roomCategory.count({ where: { hotelId: lalit.id } });
    if (existingCats === 0) {
      const cat1 = await prisma.roomCategory.create({
        data: {
          hotelId: lalit.id,
          name: 'Deluxe Palace Suite',
          basePrice: 14500,
          capacity: 2,
          maxOccupancy: 3,
          amenities: JSON.stringify(['King Bed', 'Lake View Balcony', 'Central Heating', 'Heated Bathroom Floor', 'Butler Service']),
          imageUrl: '/images/hotels/hotel_1.png'
        }
      });
      const cat2 = await prisma.roomCategory.create({
        data: {
          hotelId: lalit.id,
          name: 'Maharaja Heritage Suite',
          basePrice: 28000,
          capacity: 3,
          maxOccupancy: 4,
          amenities: JSON.stringify(['Cedar Wood Fireplace', 'Panoramic Dal View', 'Bukhari Heating', 'Jacuzzi', '24/7 Butler']),
          imageUrl: '/images/hotels/hotel_2.png'
        }
      });
      await prisma.hotelRoom.createMany({
        data: [
          { hotelId: lalit.id, categoryId: cat1.id, roomNumber: '101', floor: '1st Floor Heritage Wing', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: lalit.id, categoryId: cat1.id, roomNumber: '102', floor: '1st Floor Heritage Wing', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: lalit.id, categoryId: cat1.id, roomNumber: '103', floor: '1st Floor Heritage Wing', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: false },
          { hotelId: lalit.id, categoryId: cat1.id, roomNumber: '104', floor: '1st Floor Heritage Wing', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_DIRTY', housekeeping: 'DIRTY', bukhariActive: false },
          { hotelId: lalit.id, categoryId: cat2.id, roomNumber: '201', floor: '2nd Floor Royal Floor', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: lalit.id, categoryId: cat2.id, roomNumber: '202', floor: '2nd Floor Royal Floor', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: lalit.id, categoryId: cat2.id, roomNumber: '203', floor: '2nd Floor Royal Floor', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: false },
          { hotelId: lalit.id, categoryId: cat2.id, roomNumber: '204', floor: '2nd Floor Royal Floor', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: false }
        ]
      });
      console.log('Seeded rooms for Lalit');
    }
  }

  const sukoon = await prisma.hotel.findFirst({ where: { name: { contains: 'Sukoon', mode: 'insensitive' } } });
  if (sukoon) {
    const existingCats = await prisma.roomCategory.count({ where: { hotelId: sukoon.id } });
    if (existingCats === 0) {
      const cat = await prisma.roomCategory.create({
        data: {
          hotelId: sukoon.id,
          name: 'Royal Cedar Water Suite',
          basePrice: 18500,
          capacity: 2,
          maxOccupancy: 3,
          amenities: JSON.stringify(['Dal/Nigeen Frontage', 'Hand-Carved Walnut Furniture', 'Traditional Bukhari', 'Shikara Ghat Access']),
          imageUrl: '/images/hotels/hotel_2.png'
        }
      });
      await prisma.hotelRoom.createMany({
        data: [
          { hotelId: sukoon.id, categoryId: cat.id, roomNumber: 'HB-01', floor: 'Main Deck', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: sukoon.id, categoryId: cat.id, roomNumber: 'HB-02', floor: 'Main Deck', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: sukoon.id, categoryId: cat.id, roomNumber: 'HB-03', floor: 'Upper Suite Deck', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: sukoon.id, categoryId: cat.id, roomNumber: 'HB-04', floor: 'Upper Suite Deck', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_DIRTY', housekeeping: 'DIRTY', bukhariActive: false }
        ]
      });
      console.log('Seeded rooms for Sukoon');
    }
  }

  const khyber = await prisma.hotel.findFirst({ where: { id: 'hotel-khyber' } });
  if (khyber) {
    const existingCats = await prisma.roomCategory.count({ where: { hotelId: khyber.id } });
    if (existingCats === 0) {
      const cat = await prisma.roomCategory.create({
        data: {
          hotelId: khyber.id,
          name: 'Premier Mountain View Cottage',
          basePrice: 32000,
          capacity: 2,
          maxOccupancy: 3,
          amenities: JSON.stringify(['Gondola Slopeside View', 'Floor Heating', 'Double Glazed Glass', 'Private Balcony']),
          imageUrl: '/images/hotels/hotel_1.png'
        }
      });
      await prisma.hotelRoom.createMany({
        data: [
          { hotelId: khyber.id, categoryId: cat.id, roomNumber: 'KH-101', floor: 'Chalet Block A', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: khyber.id, categoryId: cat.id, roomNumber: 'KH-102', floor: 'Chalet Block A', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: khyber.id, categoryId: cat.id, roomNumber: 'KH-201', floor: 'Chalet Block B', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: true },
          { hotelId: khyber.id, categoryId: cat.id, roomNumber: 'KH-202', floor: 'Chalet Block B', status: 'AVAILABLE', operationalStatus: 'AVAILABLE_CLEAN', housekeeping: 'CLEAN', bukhariActive: false }
        ]
      });
      console.log('Seeded rooms for Khyber');
    }
  }

  // Create initial winter ops logs for each hotel in database if missing
  const hotels = await prisma.hotel.findMany();
  for (const h of hotels) {
    const existingLog = await prisma.winterOpsLog.findFirst({ where: { hotelId: h.id } });
    if (!existingLog) {
      await prisma.winterOpsLog.create({
        data: {
          hotelId: h.id,
          bukhariStatus: 'OPERATIONAL',
          firewoodStockDays: 14,
          generatorStatus: 'STANDBY',
          generatorFuelPct: 92,
          generatorRuntimeHrs: 18.5,
          gridPowerStatus: 'LIVE',
          boilerHotWater: 'ACTIVE',
          snowRoadClearance: 'CLEAR',
          shikaraGhatStatus: 'OPEN',
          notes: 'Kiln-dried pine firewood stocked in estate store. Power switchboard verified.',
          updatedBy: 'Srinagar Operations Desk'
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
