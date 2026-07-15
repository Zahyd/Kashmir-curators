import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { whatsappService } from '../services/whatsappService';

const safeParse = (str: any) => {
  if (!str || typeof str !== 'string') return str || [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
};

export const getCabs = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const cabs = await prisma.cab.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { id: 'desc' }
    });
    
    const parsedCabs = cabs.map(cab => ({
      ...cab,
      features: safeParse(cab.features)
    }));

    res.json(parsedCabs);
  } catch (error) {
    console.error('Cabs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cabs' });
  }
};

export const createCab = async (req: any, res: Response) => {
  try {
    const { name, type, capacity, pricePerKm, basePrice, image, features, isActive } = req.body;
    
    const data = {
      name: String(name),
      type: String(type),
      capacity: Number(capacity),
      pricePerKm: Number(pricePerKm),
      basePrice: Number(basePrice),
      image: image || '',
      features: JSON.stringify(Array.isArray(features) ? features : []),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };
    
    const cab = await prisma.cab.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New vehicle node deployed: ${cab.name}`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.status(201).json(cab);
  } catch (error) {
    console.error('Cab creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Fleet deployment failed' });
  }
};

export const updateCab = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.type !== undefined) updateData.type = String(req.body.type);
    if (req.body.capacity !== undefined) updateData.capacity = Number(req.body.capacity);
    if (req.body.pricePerKm !== undefined) updateData.pricePerKm = Number(req.body.pricePerKm);
    if (req.body.basePrice !== undefined) updateData.basePrice = Number(req.body.basePrice);
    if (req.body.image !== undefined) updateData.image = req.body.image || '';
    if (req.body.features !== undefined) {
      updateData.features = JSON.stringify(Array.isArray(req.body.features) ? req.body.features : []);
    }
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    
    const cab = await prisma.cab.update({
      where: { id },
      data: updateData
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Logistics node ${cab.name} reconfigured`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.json(cab);
  } catch (error) {
    console.error('Cab update error:', error);
    res.status(500).json({ error: (error as any).message || 'Node reconfiguration failed' });
  }
};

export const deleteCab = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.cab.delete({
      where: { id }
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Cab ${id} deleted`
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cab' });
  }
};

// --- Fleet Operations Command Center ---

const getOrCreateFleetOperationsDoc = async () => {
  let doc = await prisma.siteContent.findUnique({
    where: { sectionKey: 'fleet_operations' }
  });

  if (!doc) {
    const defaultData = {
      manualBlockings: [],
      cabsMetadata: {},
      logs: []
    };
    doc = await prisma.siteContent.create({
      data: {
        sectionKey: 'fleet_operations',
        title: 'Fleet Operations Settings',
        subtitle: 'Dynamic metadata override for Kashmir Curators vehicles',
        content: defaultData
      }
    });
  }

  let content = doc.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      content = { manualBlockings: [], cabsMetadata: {}, logs: [] };
    }
  }

  const data = content as any;
  if (!data.manualBlockings) data.manualBlockings = [];
  if (!data.cabsMetadata) data.cabsMetadata = {};
  if (!data.logs) data.logs = [];

  return { doc, data };
};

export const getOperationsData = async (req: Request, res: Response) => {
  try {
    const { data } = await getOrCreateFleetOperationsDoc();
    
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedBookings = bookings.map(b => {
      let detailsObj = {};
      if (b.details) {
        try {
          detailsObj = JSON.parse(b.details);
        } catch (e) {
          detailsObj = {};
        }
      }
      return {
        ...b,
        details: detailsObj
      };
    });

    let drivers = await prisma.user.findMany({
      where: {
        role: { in: ['driver', 'DRIVER'] }
      },
      include: {
        driverProfile: true
      }
    });

    if (drivers.length === 0) {
      const defaultDriversData = [
        { name: 'Shabir Ahmad', email: 'shabir@kashmircurators.com', phone: '+919876543210', licenseNumber: 'JK01-2015000329', vehicleRegNo: 'JK-01-A-5678', status: 'Online', attendance: 'Present', earnings: 18450, tripsCompleted: 28, rating: 4.9 },
        { name: 'Fayaz Rather', email: 'fayaz@kashmircurators.com', phone: '+919876543212', licenseNumber: 'JK01-2017002492', vehicleRegNo: 'JK-03-B-4321', status: 'On Trip', attendance: 'Present', earnings: 24600, tripsCompleted: 34, rating: 4.8 },
        { name: 'Tariq Mir', email: 'tariq@kashmircurators.com', phone: '+919876543215', licenseNumber: 'JK03-2019001221', vehicleRegNo: 'JK-01-D-3344', status: 'Offline', attendance: 'Absent', earnings: 12100, tripsCompleted: 15, rating: 4.7 },
        { name: 'Hilal Dar', email: 'hilal@kashmircurators.com', phone: '+919876543218', licenseNumber: 'JK05-2014003284', vehicleRegNo: 'JK-01-E-7777', status: 'Online', attendance: 'Present', earnings: 21900, tripsCompleted: 31, rating: 4.9 }
      ];

      for (const d of defaultDriversData) {
        await prisma.user.create({
          data: {
            name: d.name,
            email: d.email,
            phone: d.phone,
            role: 'driver',
            employeeCode: `DRV-${Math.floor(1000 + Math.random() * 9000)}`,
            driverProfile: {
              create: {
                licenseNumber: d.licenseNumber,
                vehicleRegNo: d.vehicleRegNo,
                status: d.status.toUpperCase(),
                rating: d.rating,
                tripsCompleted: d.tripsCompleted,
                earnings: d.earnings,
                attendance: d.attendance,
                licenseExpiry: '2027-12-31',
                policeVerification: 'Verified',
                aadhaar: '5400-3200-9800',
                experience: 5,
                languages: 'English, Kashmiri, Urdu',
                emergencyContact: '+919876543219'
              }
            }
          }
        });
      }

      drivers = await prisma.user.findMany({
        where: {
          role: { in: ['driver', 'DRIVER'] }
        },
        include: {
          driverProfile: true
        }
      });
    }

    res.json({
      operationsData: data,
      bookings: parsedBookings,
      drivers
    });
  } catch (error) {
    console.error('Failed to fetch operations data:', error);
    res.status(500).json({ error: 'Failed to fetch operations data' });
  }
};

export const updateCabSettings = async (req: any, res: Response) => {
  const { cabId } = req.params;
  const { ownership, vendorName, vendorPhone, registrationNo, driverName, driverPhone, notes } = req.body;

  try {
    const { doc, data } = await getOrCreateFleetOperationsDoc();
    
    const originalMetadata = data.cabsMetadata[cabId] || {};
    data.cabsMetadata[cabId] = {
      ...originalMetadata,
      ownership: ownership !== undefined ? ownership : originalMetadata.ownership || 'company',
      vendorName: vendorName !== undefined ? vendorName : originalMetadata.vendorName || '',
      vendorPhone: vendorPhone !== undefined ? vendorPhone : originalMetadata.vendorPhone || '',
      registrationNo: registrationNo !== undefined ? registrationNo : originalMetadata.registrationNo || '',
      driverName: driverName !== undefined ? driverName : originalMetadata.driverName || '',
      driverPhone: driverPhone !== undefined ? driverPhone : originalMetadata.driverPhone || '',
      notes: notes !== undefined ? notes : originalMetadata.notes || ''
    };

    const cab = await prisma.cab.findUnique({ where: { id: cabId } });
    const cabName = cab ? cab.name : 'Unknown Cab';
    const logMsg = `Cab Settings Updated for ${cabName} (${registrationNo || 'No Reg'}).`;
    
    data.logs.unshift({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      message: logMsg,
      user: req.user?.name || 'Operator'
    });

    data.logs = data.logs.slice(0, 100);

    await prisma.siteContent.update({
      where: { id: doc.id },
      data: { content: data }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: logMsg
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to update cab settings:', error);
    res.status(500).json({ error: 'Failed to update cab settings' });
  }
};

export const blockCabDates = async (req: any, res: Response) => {
  const { cabId, startDate, endDate, reason, status } = req.body;

  try {
    const { doc, data } = await getOrCreateFleetOperationsDoc();
    
    const blockId = Math.random().toString(36).substring(2, 11);
    const newBlock = {
      id: blockId,
      cabId,
      startDate,
      endDate,
      reason: reason || 'Scheduled maintenance',
      status: status || 'Maintenance',
      createdAt: new Date().toISOString()
    };

    data.manualBlockings.push(newBlock);

    const cab = await prisma.cab.findUnique({ where: { id: cabId } });
    const cabName = cab ? cab.name : 'Unknown Cab';
    const logMsg = `${cabName} placed on ${status || 'Maintenance'} from ${startDate} to ${endDate}.`;

    data.logs.unshift({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      message: logMsg,
      user: req.user?.name || 'Operator'
    });

    data.logs = data.logs.slice(0, 100);

    await prisma.siteContent.update({
      where: { id: doc.id },
      data: { content: data }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: logMsg
      });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to block dates:', error);
    res.status(500).json({ error: 'Failed to block dates' });
  }
};

export const unblockCabDates = async (req: any, res: Response) => {
  const { blockId } = req.params;

  try {
    const { doc, data } = await getOrCreateFleetOperationsDoc();
    
    const blockIndex = data.manualBlockings.findIndex((b: any) => b.id === blockId);
    if (blockIndex === -1) {
      return res.status(404).json({ error: 'Block record not found' });
    }

    const block = data.manualBlockings[blockIndex];
    data.manualBlockings.splice(blockIndex, 1);

    const cab = await prisma.cab.findUnique({ where: { id: block.cabId } });
    const cabName = cab ? cab.name : 'Unknown Cab';
    const logMsg = `Released block (${block.status}) on ${cabName} for dates ${block.startDate} to ${block.endDate}.`;

    data.logs.unshift({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      message: logMsg,
      user: req.user?.name || 'Operator'
    });

    data.logs = data.logs.slice(0, 100);

    await prisma.siteContent.update({
      where: { id: doc.id },
      data: { content: data }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: logMsg
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to unblock dates:', error);
    res.status(500).json({ error: 'Failed to unblock dates' });
  }
};

export const notifyDriver = async (req: any, res: Response) => {
  const { driverPhone, messageText } = req.body;

  if (!driverPhone || !messageText) {
    return res.status(400).json({ error: 'Driver phone and message content are required' });
  }

  try {
    const success = await whatsappService.sendWhatsAppText(driverPhone, messageText);
    
    if (success) {
      const { doc, data } = await getOrCreateFleetOperationsDoc();
      const logMsg = `WhatsApp notification dispatched to driver (${driverPhone}).`;
      
      data.logs.unshift({
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        message: logMsg,
        user: req.user?.name || 'Operator'
      });

      await prisma.siteContent.update({
        where: { id: doc.id },
        data: { content: data }
      });

      if (req.io) {
        req.io.to('admin-room').emit('new-system-event', {
          type: 'UPDATE',
          message: logMsg
        });
      }

      res.json({ success: true, message: 'Driver notified successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
  } catch (error) {
    console.error('Failed to notify driver:', error);
    res.status(500).json({ error: 'Failed to notify driver' });
  }
};

export const addOperationsLog = async (req: any, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const { doc, data } = await getOrCreateFleetOperationsDoc();
    
    data.logs.unshift({
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      message,
      user: req.user?.name || 'Operator'
    });

    data.logs = data.logs.slice(0, 100);

    await prisma.siteContent.update({
      where: { id: doc.id },
      data: { content: data }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add log:', error);
    res.status(500).json({ error: 'Failed to add log' });
  }
};

export const createDriver = async (req: any, res: Response) => {
  const { name, email, phone, licenseNumber, vehicleRegNo, status, rating, tripsCompleted, earnings, attendance, licenseExpiry, policeVerification, aadhaar, experience, languages, emergencyContact } = req.body;

  if (!name || !email || !licenseNumber || !vehicleRegNo) {
    return res.status(400).json({ error: 'Name, email, license number, and vehicle registration number are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A driver with this email already exists' });
    }

    const driver = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: 'driver',
        employeeCode: `DRV-${Math.floor(1000 + Math.random() * 9000)}`,
        driverProfile: {
          create: {
            licenseNumber,
            vehicleRegNo,
            status: status || 'AVAILABLE',
            rating: rating !== undefined ? Number(rating) : 4.8,
            tripsCompleted: tripsCompleted !== undefined ? Number(tripsCompleted) : 0,
            earnings: earnings !== undefined ? Number(earnings) : 0,
            attendance: attendance || 'Present',
            licenseExpiry: licenseExpiry || '2027-12-31',
            policeVerification: policeVerification || 'Verified',
            aadhaar: aadhaar || '0000-0000-0000',
            experience: experience !== undefined ? Number(experience) : 3,
            languages: languages || 'English, Kashmiri, Urdu',
            emergencyContact: emergencyContact || '+919876543219'
          }
        }
      },
      include: {
        driverProfile: true
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `Driver profile registered: ${driver.name}`,
        driver
      });
    }

    res.status(201).json(driver);
  } catch (error: any) {
    console.error('Failed to create driver:', error);
    res.status(500).json({ error: error.message || 'Failed to register driver' });
  }
};

export const updateDriver = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, phone, licenseNumber, vehicleRegNo, status, rating, tripsCompleted, earnings, attendance, licenseExpiry, policeVerification, aadhaar, experience, languages, emergencyContact } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { driverProfile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const updateUserData: any = {};
    if (name !== undefined) updateUserData.name = name;
    if (phone !== undefined) updateUserData.phone = phone;

    const updateProfileData: any = {};
    if (licenseNumber !== undefined) updateProfileData.licenseNumber = licenseNumber;
    if (vehicleRegNo !== undefined) updateProfileData.vehicleRegNo = vehicleRegNo;
    if (status !== undefined) updateProfileData.status = status;
    if (rating !== undefined) updateProfileData.rating = Number(rating);
    if (tripsCompleted !== undefined) updateProfileData.tripsCompleted = Number(tripsCompleted);
    if (earnings !== undefined) updateProfileData.earnings = Number(earnings);
    if (attendance !== undefined) updateProfileData.attendance = attendance;
    if (licenseExpiry !== undefined) updateProfileData.licenseExpiry = licenseExpiry;
    if (policeVerification !== undefined) updateProfileData.policeVerification = policeVerification;
    if (aadhaar !== undefined) updateProfileData.aadhaar = aadhaar;
    if (experience !== undefined) updateProfileData.experience = Number(experience);
    if (languages !== undefined) updateProfileData.languages = languages;
    if (emergencyContact !== undefined) updateProfileData.emergencyContact = emergencyContact;

    const updatedDriver = await prisma.user.update({
      where: { id },
      data: {
        ...updateUserData,
        driverProfile: {
          update: updateProfileData
        }
      },
      include: {
        driverProfile: true
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Driver profile updated: ${updatedDriver.name}`,
        driver: updatedDriver
      });
    }

    res.json(updatedDriver);
  } catch (error: any) {
    console.error('Failed to update driver:', error);
    res.status(500).json({ error: error.message || 'Failed to update driver' });
  }
};

export const deleteDriver = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Driver profile removed: ${id}`
      });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete driver:', error);
    res.status(500).json({ error: error.message || 'Failed to delete driver' });
  }
};
