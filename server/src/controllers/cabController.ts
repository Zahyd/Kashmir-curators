import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { whatsappService } from '../services/whatsappService';
import { withTenantScope, withStrictTenantScope, resolveWriteTenantId } from '../lib/tenant';
import { parseCabFeaturesArray } from '../lib/cabBackfill';
import { broadcastDriverEvent } from '../lib/driverRealtime';

const p = prisma as any;

const safeParse = (str: any, fallback: any = []) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const safeParseObject = (str: any): Record<string, any> | null => {
  if (!str) return null;
  if (typeof str === 'object' && !Array.isArray(str)) return str;
  if (typeof str !== 'string') return null;
  try {
    const parsed = JSON.parse(str);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

function serializeCab(cab: any) {
  return {
    ...cab,
    features: parseCabFeaturesArray(cab.features, cab.type),
    rateCard: safeParseObject(cab.rateCard),
    complianceDocs: safeParseObject(cab.complianceDocs),
  };
}

export const getCabs = async (req: any, res: Response) => {
  try {
    const { all } = req.query;
    const baseWhere =
      all === 'true'
        ? {}
        : {
            isActive: true,
            verificationStatus: 'APPROVED',
          };
    const cabs = await prisma.cab.findMany({
      where: withTenantScope(baseWhere, req.tenantId),
      orderBy: { id: 'desc' },
    });

    const parsedCabs = cabs.map(serializeCab);
    res.json(parsedCabs);
  } catch (error) {
    console.error('Cabs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cabs' });
  }
};

export const createCab = async (req: any, res: Response) => {
  try {
    const {
      name,
      type,
      capacity,
      pricePerKm,
      basePrice,
      image,
      features,
      isActive,
      plateNumber,
      luggageCapacity,
      snowChains,
      fourWheelDrive,
      skiRack,
      multiDayAvailable,
      ownership,
      vendorName,
      vendorPhone,
      verificationStatus,
      unionName,
      unionBadgeNumber,
      unionVerified,
      touristPermitNo,
      permitExpiry,
      commercialRcNumber,
      psvBadgeNo,
      fitnessExpiry,
      rcVerified,
      permitVerified,
      insuranceValid,
      rateCard,
      driverProfileId,
    } = req.body;

    const cleanFeatures = Array.isArray(features)
      ? features.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim())
      : parseCabFeaturesArray(features, type);

    const resolvedStatus = verificationStatus ? String(verificationStatus).toUpperCase() : 'APPROVED';

    const data: Record<string, any> = {
      name: String(name),
      type: String(type),
      capacity: Number(capacity),
      pricePerKm: Number(pricePerKm),
      basePrice: Number(basePrice),
      image: image || '',
      features: JSON.stringify(cleanFeatures),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      plateNumber: plateNumber ? String(plateNumber).trim().toUpperCase() : null,
      luggageCapacity: luggageCapacity !== undefined ? Number(luggageCapacity) : 4,
      snowChains: snowChains !== undefined ? Boolean(snowChains) : true,
      fourWheelDrive: fourWheelDrive !== undefined ? Boolean(fourWheelDrive) : false,
      skiRack: skiRack !== undefined ? Boolean(skiRack) : false,
      multiDayAvailable: multiDayAvailable !== undefined ? Boolean(multiDayAvailable) : true,
      ownership: ownership ? String(ownership).toUpperCase() : 'COMPANY',
      vendorName: vendorName || null,
      vendorPhone: vendorPhone || null,
      verificationStatus: resolvedStatus,
      unionName: unionName || null,
      unionBadgeNumber: unionBadgeNumber || null,
      unionVerified: unionVerified !== undefined ? Boolean(unionVerified) : resolvedStatus === 'APPROVED',
      touristPermitNo: touristPermitNo || null,
      permitExpiry: permitExpiry || null,
      commercialRcNumber: commercialRcNumber || null,
      psvBadgeNo: psvBadgeNo || null,
      fitnessExpiry: fitnessExpiry || null,
      rcVerified: rcVerified !== undefined ? Boolean(rcVerified) : false,
      permitVerified: permitVerified !== undefined ? Boolean(permitVerified) : false,
      insuranceValid: insuranceValid !== undefined ? Boolean(insuranceValid) : true,
      rateCard: rateCard ? (typeof rateCard === 'string' ? rateCard : JSON.stringify(rateCard)) : null,
      driverProfileId: driverProfileId || null,
      approvedAt: resolvedStatus === 'APPROVED' ? new Date() : null,
      organizationId: resolveWriteTenantId(req),
    };

    const cab = await p.cab.create({ data });
    const formatted = serializeCab(cab);

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New vehicle node deployed: ${cab.name}`,
        booking: { ...formatted, entityType: 'cab' },
      });
      req.io.emit('cabs-updated', { type: 'CREATE', cab: formatted });
      req.io.emit('fleet-updated', { type: 'CREATE', cab: formatted });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'CAB_CREATE', cabId: cab.id });
      req.io.emit('site-content-updated', { sectionKey: 'cabs', data: formatted });
    }

    res.status(201).json(formatted);
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
      updateData.features = JSON.stringify(
        Array.isArray(req.body.features) ? req.body.features : parseCabFeaturesArray(req.body.features)
      );
    }
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.plateNumber !== undefined) {
      updateData.plateNumber = req.body.plateNumber ? String(req.body.plateNumber).trim().toUpperCase() : null;
    }
    if (req.body.luggageCapacity !== undefined) updateData.luggageCapacity = Number(req.body.luggageCapacity);
    if (req.body.snowChains !== undefined) updateData.snowChains = Boolean(req.body.snowChains);
    if (req.body.fourWheelDrive !== undefined) updateData.fourWheelDrive = Boolean(req.body.fourWheelDrive);
    if (req.body.skiRack !== undefined) updateData.skiRack = Boolean(req.body.skiRack);
    if (req.body.multiDayAvailable !== undefined) updateData.multiDayAvailable = Boolean(req.body.multiDayAvailable);
    if (req.body.ownership !== undefined) updateData.ownership = String(req.body.ownership).toUpperCase();
    if (req.body.vendorName !== undefined) updateData.vendorName = req.body.vendorName;
    if (req.body.vendorPhone !== undefined) updateData.vendorPhone = req.body.vendorPhone;
    if (req.body.verificationStatus !== undefined) {
      updateData.verificationStatus = String(req.body.verificationStatus).toUpperCase();
      if (updateData.verificationStatus === 'APPROVED') updateData.approvedAt = new Date();
    }
    if (req.body.unionName !== undefined) updateData.unionName = req.body.unionName;
    if (req.body.unionBadgeNumber !== undefined) updateData.unionBadgeNumber = req.body.unionBadgeNumber;
    if (req.body.unionVerified !== undefined) updateData.unionVerified = Boolean(req.body.unionVerified);
    if (req.body.touristPermitNo !== undefined) updateData.touristPermitNo = req.body.touristPermitNo;
    if (req.body.permitExpiry !== undefined) updateData.permitExpiry = req.body.permitExpiry;
    if (req.body.commercialRcNumber !== undefined) updateData.commercialRcNumber = req.body.commercialRcNumber;
    if (req.body.psvBadgeNo !== undefined) updateData.psvBadgeNo = req.body.psvBadgeNo;
    if (req.body.fitnessExpiry !== undefined) updateData.fitnessExpiry = req.body.fitnessExpiry;
    if (req.body.rcVerified !== undefined) updateData.rcVerified = Boolean(req.body.rcVerified);
    if (req.body.permitVerified !== undefined) updateData.permitVerified = Boolean(req.body.permitVerified);
    if (req.body.insuranceValid !== undefined) updateData.insuranceValid = Boolean(req.body.insuranceValid);
    if (req.body.rateCard !== undefined) {
      updateData.rateCard =
        req.body.rateCard === null
          ? null
          : typeof req.body.rateCard === 'string'
            ? req.body.rateCard
            : JSON.stringify(req.body.rateCard);
    }
    if (req.body.driverProfileId !== undefined) updateData.driverProfileId = req.body.driverProfileId;

    const cab = await p.cab.update({
      where: { id },
      data: updateData,
    });
    const formatted = serializeCab(cab);

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Logistics node ${cab.name} reconfigured`,
        booking: { ...formatted, entityType: 'cab' },
      });
      req.io.emit('cabs-updated', { type: 'UPDATE', cab: formatted });
      req.io.emit('fleet-updated', { type: 'UPDATE', cab: formatted });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'CAB_UPDATE', cabId: cab.id });
      req.io.emit('site-content-updated', { sectionKey: 'cabs', data: formatted });
    }

    res.json(formatted);
  } catch (error) {
    console.error('Cab update error:', error);
    res.status(500).json({ error: (error as any).message || 'Node reconfiguration failed' });
  }
};

export const deleteCab = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.cab.delete({
      where: { id }
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Cab ${id} deleted`
      });
      req.io.emit('cabs-updated', { type: 'DELETE', id });
      req.io.emit('fleet-updated', { type: 'DELETE', id });
      req.io.emit('site-content-updated', { sectionKey: 'cabs', data: { id, deleted: true } });
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

  const defaultData = {
    manualBlockings: [],
    cabsMetadata: {},
    logs: [],
    maintenanceRecords: [
      { id: 'm-1', vehicle: 'Innova Crysta Luxury', reg: 'JK-01-A-5678', task: 'Engine oil replacement', date: '2026-06-10', cost: 4200, odometer: 42500, workshop: 'Srinagar Toyota Center', status: 'Completed' },
      { id: 'm-2', vehicle: 'Force Urbania Luxury', reg: 'JK-03-B-4321', task: 'Rear tyres rotation & balance', date: '2026-07-02', cost: 1800, odometer: 15900, workshop: 'MRF Tyres City Center', status: 'Completed' },
      { id: 'm-3', vehicle: 'Toyota Fortuner SUV', reg: 'JK-01-E-7777', task: 'Brake pads check', date: '2026-07-18', cost: 3500, odometer: 31200, workshop: 'Valley Garages', status: 'Scheduled' }
    ]
  };

  if (!doc) {
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
      content = defaultData;
    }
  }

  const data = content as any;
  if (!data.manualBlockings) data.manualBlockings = [];
  if (!data.cabsMetadata) data.cabsMetadata = {};
  if (!data.logs) data.logs = [];
  if (!data.maintenanceRecords) data.maintenanceRecords = defaultData.maintenanceRecords;

  return { doc, data };
};

export const getOperationsData = async (req: any, res: Response) => {
  try {
    const { data } = await getOrCreateFleetOperationsDoc();
    
    const bookings = await prisma.booking.findMany({
      where: withStrictTenantScope({}, req.tenantId),
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
                status: d.status.toLowerCase() === 'online' ? 'AVAILABLE' : d.status.toLowerCase().includes('trip') ? 'ON_TRIP' : 'OFFLINE',
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

    const [reservations, sosAlerts, payouts] = await Promise.all([
      p.cabReservation
        .findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            cab: true,
            driverProfile: { include: { user: { select: { id: true, name: true, phone: true } } } },
            offers: true,
          },
        })
        .catch(() => []),
      p.driverSosAlert
        .findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        .catch(() => []),
      p.driverPayout
        .findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { driverProfile: { include: { user: { select: { id: true, name: true } } } } },
        })
        .catch(() => []),
    ]);

    const normalizedDrivers = drivers.map((d: any) => ({
      ...d,
      driverProfile: d.driverProfile
        ? {
            ...d.driverProfile,
            kycDocuments: safeParseObject(d.driverProfile.kycDocuments),
          }
        : null,
    }));

    const pendingDriversCount = normalizedDrivers.filter(
      (d: any) => d.driverProfile?.approvalStatus === 'PENDING_APPROVAL'
    ).length;

    res.json({
      operationsData: data,
      bookings: parsedBookings,
      drivers: normalizedDrivers,
      reservations,
      sosAlerts,
      payouts,
      pendingDriversCount,
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

    const cab = cabId ? await prisma.cab.findUnique({ where: { id: String(cabId) } }) : null;
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

    const cab = cabId ? await prisma.cab.findUnique({ where: { id: String(cabId) } }) : null;
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

    const cab = block.cabId ? await prisma.cab.findUnique({ where: { id: String(block.cabId) } }) : null;
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
  const {
    name,
    email,
    phone,
    password,
    licenseNumber,
    vehicleRegNo,
    status,
    approvalStatus,
    rating,
    tripsCompleted,
    earnings,
    availableBalance,
    attendance,
    licenseExpiry,
    policeVerification,
    aadhaar,
    experience,
    languages,
    emergencyContact,
    unionName,
    unionBadgeNumber,
    psvBadgeNumber,
    upiId,
    issuePortalKey,
  } = req.body;

  if (!name || !email || !licenseNumber || !vehicleRegNo) {
    return res
      .status(400)
      .json({ error: 'Name, email, license number, and vehicle registration number are required' });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'A driver with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(
      password && String(password).length >= 6
        ? String(password)
        : crypto.randomBytes(16).toString('hex'),
      10
    );

    const driver = await p.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        phone: phone || null,
        password: passwordHash,
        role: 'driver',
        employeeCode: `DRV-${Math.floor(1000 + Math.random() * 9000)}`,
        driverProfile: {
          create: {
            licenseNumber,
            vehicleRegNo: String(vehicleRegNo).trim().toUpperCase(),
            status: status || 'AVAILABLE',
            approvalStatus: approvalStatus || 'APPROVED',
            reviewedBy: req.user?.name || req.user?.email || 'Admin',
            reviewedAt: new Date(),
            rating: rating !== undefined ? Number(rating) : 4.8,
            tripsCompleted: tripsCompleted !== undefined ? Number(tripsCompleted) : 0,
            earnings: earnings !== undefined ? Number(earnings) : 0,
            availableBalance: availableBalance !== undefined ? Number(availableBalance) : 0,
            attendance: attendance || 'Present',
            licenseExpiry: licenseExpiry || '2027-12-31',
            policeVerification: policeVerification || 'Verified',
            aadhaar: aadhaar || '0000-0000-0000',
            experience: experience !== undefined ? Number(experience) : 3,
            languages: languages || 'English, Kashmiri, Urdu',
            emergencyContact: emergencyContact || '+919876543219',
            unionName: unionName || null,
            unionBadgeNumber: unionBadgeNumber || null,
            psvBadgeNumber: psvBadgeNumber || null,
            upiId: upiId || 'kashmir.driver@okaxis',
          },
        },
      },
      include: {
        driverProfile: true,
      },
    });

    let portalKey: string | null = null;
    if (issuePortalKey) {
      const code = `KC-DRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const keyRec = await p.portalAccessKey.create({
        data: {
          portalType: 'DRIVER',
          accessKey: code,
          assignedName: driver.name,
          assignedContact: driver.phone || driver.email,
          designation: 'Verified Fleet Chauffeur',
          propertyScope: 'ALL',
          userId: driver.id,
          status: 'ACTIVE',
          createdByName: req.user?.name || 'Admin',
        },
      });
      portalKey = keyRec.accessKey;
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `Driver profile registered: ${driver.name}`,
        driver,
      });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'DRIVER_CREATED', driverId: driver.id });
    }

    res.status(201).json(portalKey ? { ...driver, portalKey } : driver);
  } catch (error: any) {
    console.error('Failed to create driver:', error);
    res.status(500).json({ error: error.message || 'Failed to register driver' });
  }
};

export const updateDriver = async (req: any, res: Response) => {
  const { id } = req.params;
  const {
    name,
    phone,
    licenseNumber,
    vehicleRegNo,
    status,
    approvalStatus,
    rejectionReason,
    rating,
    tripsCompleted,
    earnings,
    availableBalance,
    attendance,
    licenseExpiry,
    policeVerification,
    aadhaar,
    experience,
    languages,
    emergencyContact,
    unionName,
    unionBadgeNumber,
    psvBadgeNumber,
    upiId,
  } = req.body;

  try {
    const user = await p.user.findUnique({
      where: { id },
      include: { driverProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const updateUserData: any = {};
    if (name !== undefined) updateUserData.name = name;
    if (phone !== undefined) updateUserData.phone = phone;
    if (status !== undefined) {
      updateUserData.isOnline = String(status).toUpperCase() === 'AVAILABLE' || String(status).toUpperCase() === 'ON_TRIP';
    }

    const updateProfileData: any = {};
    if (licenseNumber !== undefined) updateProfileData.licenseNumber = licenseNumber;
    if (vehicleRegNo !== undefined) updateProfileData.vehicleRegNo = String(vehicleRegNo).toUpperCase();
    if (status !== undefined) updateProfileData.status = String(status).toUpperCase();
    if (approvalStatus !== undefined) updateProfileData.approvalStatus = String(approvalStatus).toUpperCase();
    if (rejectionReason !== undefined) updateProfileData.rejectionReason = rejectionReason;
    if (rating !== undefined) updateProfileData.rating = Number(rating);
    if (tripsCompleted !== undefined) updateProfileData.tripsCompleted = Number(tripsCompleted);
    if (earnings !== undefined) updateProfileData.earnings = Number(earnings);
    if (availableBalance !== undefined) updateProfileData.availableBalance = Number(availableBalance);
    if (attendance !== undefined) updateProfileData.attendance = attendance;
    if (licenseExpiry !== undefined) updateProfileData.licenseExpiry = licenseExpiry;
    if (policeVerification !== undefined) updateProfileData.policeVerification = policeVerification;
    if (aadhaar !== undefined) updateProfileData.aadhaar = aadhaar;
    if (experience !== undefined) updateProfileData.experience = Number(experience);
    if (languages !== undefined) updateProfileData.languages = languages;
    if (emergencyContact !== undefined) updateProfileData.emergencyContact = emergencyContact;
    if (unionName !== undefined) updateProfileData.unionName = unionName;
    if (unionBadgeNumber !== undefined) updateProfileData.unionBadgeNumber = unionBadgeNumber;
    if (psvBadgeNumber !== undefined) updateProfileData.psvBadgeNumber = psvBadgeNumber;
    if (upiId !== undefined) updateProfileData.upiId = upiId;

    if (Object.keys(updateUserData).length > 0) {
      await p.user.update({ where: { id }, data: updateUserData });
    }

    if (user.driverProfile && Object.keys(updateProfileData).length > 0) {
      await p.driverProfile.update({
        where: { id: user.driverProfile.id },
        data: updateProfileData,
      });
    } else if (!user.driverProfile && Object.keys(updateProfileData).length > 0) {
      await p.driverProfile.create({
        data: {
          userId: id,
          licenseNumber: updateProfileData.licenseNumber || 'PENDING',
          vehicleRegNo: updateProfileData.vehicleRegNo || 'PENDING',
          ...updateProfileData,
        },
      });
    }

    const updatedDriver = await p.user.findUnique({
      where: { id },
      include: { driverProfile: true },
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Driver profile updated: ${updatedDriver.name}`,
        driver: updatedDriver,
      });
      req.io.to(`driver-${id}`).emit('driver-profile-updated', { driver: updatedDriver });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'DRIVER_UPDATED', driverId: id });
    }

    res.json(updatedDriver);
  } catch (error: any) {
    console.error('Failed to update driver:', error);
    res.status(500).json({ error: error.message || 'Failed to update driver' });
  }
};

export const reviewDriverApplication = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    const { action, reason, approvePendingVehicles = true, issuePortalKey = false } = req.body || {};
    const normalizedAction = String(action || '').trim().toUpperCase();

    if (!['APPROVE', 'REJECT', 'SUSPEND'].includes(normalizedAction)) {
      return res.status(400).json({ error: 'action must be APPROVE, REJECT, or SUSPEND' });
    }

    let profile = await p.driverProfile
      .findUnique({ where: { id }, include: { user: true } })
      .catch(() => null);

    if (!profile) {
      profile = await p.driverProfile
        .findUnique({ where: { userId: id }, include: { user: true } })
        .catch(() => null);
    }

    if (!profile) {
      return res.status(404).json({ error: 'Driver KYC profile not found' });
    }

    const nextApprovalStatus =
      normalizedAction === 'APPROVE'
        ? 'APPROVED'
        : normalizedAction === 'REJECT'
          ? 'REJECTED'
          : 'SUSPENDED';

    const updateProfileData: Record<string, any> = {
      approvalStatus: nextApprovalStatus,
      reviewedAt: new Date(),
      reviewedBy: req.user?.name || req.user?.email || 'Admin',
      rejectionReason: normalizedAction === 'APPROVE' ? null : reason || `Application ${nextApprovalStatus.toLowerCase()}`,
    };

    if (normalizedAction === 'APPROVE') {
      updateProfileData.policeVerification = 'Verified';
    } else {
      updateProfileData.status = 'OFFLINE';
    }

    const updatedProfile = await p.driverProfile.update({
      where: { id: profile.id },
      data: updateProfileData,
    });

    if (normalizedAction !== 'APPROVE' && profile.userId) {
      await p.user.update({ where: { id: profile.userId }, data: { isOnline: false } }).catch(() => null);
    }

    let approvedVehiclesCount = 0;
    if (normalizedAction === 'APPROVE' && approvePendingVehicles) {
      const pendingCabs = await p.cab.findMany({
        where: { driverProfileId: profile.id, verificationStatus: 'PENDING_APPROVAL' },
      });
      for (const cab of pendingCabs) {
        await p.cab.update({
          where: { id: cab.id },
          data: {
            verificationStatus: 'APPROVED',
            isActive: true,
            unionVerified: true,
            approvedAt: new Date(),
          },
        });
        approvedVehiclesCount += 1;
      }
    }

    let issuedKey: string | null = null;
    if (normalizedAction === 'APPROVE' && issuePortalKey && profile.userId) {
      const existingKey = await p.portalAccessKey
        .findFirst({ where: { userId: profile.userId, portalType: 'DRIVER', status: 'ACTIVE' } })
        .catch(() => null);
      if (existingKey) {
        issuedKey = existingKey.accessKey;
      } else {
        const code = `KC-DRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        await p.portalAccessKey.create({
          data: {
            portalType: 'DRIVER',
            accessKey: code,
            assignedName: profile.user?.name || 'Verified Chauffeur',
            assignedContact: profile.user?.phone || profile.user?.email || null,
            designation: 'Approved Partner Chauffeur',
            propertyScope: 'ALL',
            userId: profile.userId,
            status: 'ACTIVE',
            createdByName: req.user?.name || 'Admin',
          },
        });
        issuedKey = code;
      }
    }

    if (req.io && profile.userId) {
      req.io.to(`user-${profile.userId}`).emit('driver-kyc-reviewed', {
        driverProfileId: profile.id,
        approvalStatus: nextApprovalStatus,
        rejectionReason: updatedProfile.rejectionReason,
        portalKey: issuedKey,
      });
      req.io.to(`driver-${profile.userId}`).emit('driver-kyc-reviewed', {
        driverProfileId: profile.id,
        approvalStatus: nextApprovalStatus,
        rejectionReason: updatedProfile.rejectionReason,
        portalKey: issuedKey,
      });
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Driver KYC ${nextApprovalStatus}: ${profile.user?.name || profile.id}`,
      });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'DRIVER_REVIEWED' });
    }

    if (profile.userId) {
      broadcastDriverEvent(
        'DRIVER_KYC_REVIEWED',
        {
          driverProfileId: profile.id,
          approvalStatus: nextApprovalStatus,
          rejectionReason: updatedProfile.rejectionReason,
        },
        { targetUserIds: [profile.userId], targetDriverProfileIds: [profile.id] }
      );
    }

    res.json({
      success: true,
      driverProfile: updatedProfile,
      approvedVehiclesCount,
      portalKey: issuedKey,
    });
  } catch (error: any) {
    console.error('Review driver application failed:', error);
    res.status(500).json({ error: error.message || 'Failed to review driver KYC application' });
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

export const updateMaintenanceRecords = async (req: any, res: Response) => {
  const { records } = req.body;

  try {
    const { doc, data } = await getOrCreateFleetOperationsDoc();
    
    data.maintenanceRecords = records;

    await prisma.siteContent.update({
      where: { id: doc.id },
      data: { content: data }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: 'Maintenance records updated successfully'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to update maintenance records:', error);
    res.status(500).json({ error: 'Failed to update maintenance records' });
  }
};

// --- Real-Time Tourist Cab Matching, Auto Pop-Up Cards & Ride Requests ---

function inferCorridorDistanceKm(pickup: string, drop: string, providedKm?: unknown): number {
  const num = Number(providedKm);
  if (Number.isFinite(num) && num > 0) return Math.round(num * 10) / 10;
  const combined = `${pickup} ${drop}`.toLowerCase();
  if (/gulmarg|apharwat|tangmarg/.test(combined)) return 52;
  if (/pahalgam|betaab|aru|chandanwari/.test(combined)) return 92;
  if (/sonamarg|thajiwas|zojila/.test(combined)) return 82;
  if (/doodhpathri/.test(combined)) return 46;
  if (/yusmarg/.test(combined)) return 49;
  if (/gurez|tulail/.test(combined)) return 126;
  if (/sxr|airport/.test(combined)) return 14;
  return 28;
}

function maskChauffeurPublicName(fullName?: string | null): string {
  if (!fullName) return 'Verified Pilot';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function computeCorridorFare(
  cab: any,
  pickup: string,
  drop: string,
  tripType: string,
  distanceKm: number
): { fare: number; breakdown: Record<string, number>; requiresSnowChains: boolean } {
  const rc = safeParseObject(cab?.rateCard) || {};
  const combined = `${pickup} ${drop}`.toLowerCase();
  const requiresSnowChains = /gulmarg|tangmarg|sonamarg|doodhpathri|sinthan|zojila|apharwat/.test(combined);
  const perKmRate = Number(rc.perKmRate) || Number(cab?.pricePerKm) || 20;
  const surge = Number(rc.surgeMultiplier) || 1.0;
  const snowActive = rc.snowChainActive !== undefined ? Boolean(rc.snowChainActive) : true;
  const snowSurcharge =
    requiresSnowChains && snowActive ? Number(rc.snowChainSurcharge ?? 650) : 0;
  const heaterSurcharge = rc.heaterActive ? Number(rc.heaterSurcharge ?? 300) : 0;

  const gulmargRate = Number(rc.gulmargTransfer ?? rc.gulmargChainedRate ?? 0);
  const pahalgamRate = Number(rc.pahalgamTransfer ?? rc.pahalgamRate ?? 0);
  const sonamargRate = Number(rc.sonamargTransfer ?? rc.sonamargRate ?? 0);
  const doodhpathriRate = Number(rc.doodhpathriTransfer ?? 0);
  const airportRate = Number(rc.airportTransfer ?? rc.sxrTransferRate ?? 0);
  const railwayRate = Number(rc.railwayTransfer ?? 0);
  const localRate = Number(rc.localSightseeing ?? 0);

  let baseCorridor = 0;
  if (/gulmarg|apharwat/.test(combined) && gulmargRate > 0) {
    baseCorridor = gulmargRate;
  } else if (/pahalgam/.test(combined) && pahalgamRate > 0) {
    baseCorridor = pahalgamRate;
  } else if (/sonamarg/.test(combined) && sonamargRate > 0) {
    baseCorridor = sonamargRate;
  } else if (/doodhpathri/.test(combined) && doodhpathriRate > 0) {
    baseCorridor = doodhpathriRate;
  } else if (/nowgam|railway|vande bharat/.test(combined) && railwayRate > 0) {
    baseCorridor = railwayRate;
  } else if (
    (tripType === 'airport' || /sxr|airport/.test(combined)) &&
    !/gulmarg|pahalgam|sonamarg/.test(combined) &&
    airportRate > 0
  ) {
    baseCorridor = airportRate;
  } else if (tripType === 'local' && localRate > 0) {
    baseCorridor = localRate;
  } else {
    const cabBase = Number(cab?.basePrice) || 1200;
    baseCorridor = Math.round(cabBase + distanceKm * perKmRate);
  }

  const total = Math.round((baseCorridor + snowSurcharge + heaterSurcharge) * surge);
  return {
    fare: Math.max(850, total),
    breakdown: {
      corridorBase: baseCorridor,
      snowChainSurcharge: snowSurcharge,
      heaterSurcharge,
      surgeMultiplier: surge,
    },
    requiresSnowChains,
  };
}

function sanitizeOfferForTourist(offer: any, reservationStatus?: string) {
  const isConfirmed =
    offer.status === 'ACCEPTED' ||
    ['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'COMPLETED'].includes(String(reservationStatus || '').toUpperCase());
  return {
    id: offer.id,
    reservationId: offer.reservationId,
    cabId: offer.cabId,
    driverProfileId: offer.driverProfileId,
    driverName: isConfirmed ? offer.driverName : maskChauffeurPublicName(offer.driverName),
    driverPhone: isConfirmed ? offer.driverPhone || null : null,
    driverRating: offer.driverRating,
    driverTrips: offer.driverTrips,
    vehicleName: offer.vehicleName,
    vehicleType: offer.vehicleType,
    vehicleImage: offer.vehicleImage,
    vehicleRegNo: offer.vehicleRegNo,
    capacity: offer.capacity,
    luggageCapacity: offer.luggageCapacity,
    snowChains: offer.snowChains,
    fourWheelDrive: offer.fourWheelDrive,
    unionVerified: offer.unionVerified,
    unionName: offer.unionName,
    initialFare: offer.initialFare,
    driverFare: offer.driverFare,
    touristCounter: offer.touristCounter,
    status: offer.status,
    driverMessage: offer.driverMessage,
    etaMinutes: offer.etaMinutes,
    expiresAt: offer.expiresAt,
    updatedAt: offer.updatedAt,
  };
}

export const getLiveCabMatches = async (req: any, res: Response) => {
  try {
    const pickup = String(req.query.pickup || 'Sheikh ul-Alam Airport (SXR)');
    const drop = String(req.query.drop || 'Dal Lake / Srinagar Boulevard');
    const tripType = String(req.query.tripType || 'airport');
    const pax = Math.max(1, Number(req.query.pax || 2));
    const cabTypeFilter = req.query.cabType ? String(req.query.cabType).toLowerCase() : '';
    const estimatedKm = inferCorridorDistanceKm(pickup, drop, req.query.estimatedKm);
    const estimatedDurationMin = Math.max(18, Math.round(estimatedKm * 1.9));

    const [cabs, onlineDrivers, advisories] = await Promise.all([
      p.cab.findMany({
        where: withTenantScope(
          {
            isActive: true,
            verificationStatus: 'APPROVED',
          },
          req.tenantId
        ),
        include: {
          driverProfile: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      p.driverProfile.findMany({
        where: {
          approvalStatus: 'APPROVED',
          status: 'AVAILABLE',
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      p.travelAdvisory
        .findMany({
          orderBy: [{ emergencyModeActive: 'desc' }, { lastUpdated: 'desc' }],
          take: 5,
        })
        .catch(() => []),
    ]);

    const onlineMap = new Map<string, any>();
    for (const dp of onlineDrivers) {
      onlineMap.set(dp.id, dp);
    }

    const matches = cabs
      .filter((cab: any) => {
        if (cab.capacity < pax) return false;
        if (cabTypeFilter && cabTypeFilter !== 'all') {
          const hay = `${cab.type} ${cab.name}`.toLowerCase();
          if (!hay.includes(cabTypeFilter)) return false;
        }
        return true;
      })
      .map((cab: any, index: number) => {
        const dp =
          (cab.driverProfileId ? onlineMap.get(cab.driverProfileId) : null) ||
          (cab.driverProfile && cab.driverProfile.approvalStatus === 'APPROVED' ? cab.driverProfile : null) ||
          onlineDrivers[index % Math.max(1, onlineDrivers.length)] ||
          null;

        const isDriverOnline = Boolean(dp && dp.approvalStatus === 'APPROVED' && dp.status === 'AVAILABLE');
        const fareData = computeCorridorFare(cab, pickup, drop, tripType, estimatedKm);
        const features = parseCabFeaturesArray(cab.features, cab.type);
        const etaMinutes = isDriverOnline ? Math.max(4, 7 + index * 3) : 18 + index * 4;

        return {
          cabId: cab.id,
          name: cab.name,
          type: cab.type,
          image: cab.image,
          capacity: cab.capacity,
          luggageCapacity: cab.luggageCapacity ?? 4,
          plateNumber: cab.plateNumber || dp?.vehicleRegNo || 'JK01-TOURIST',
          snowChains: Boolean(cab.snowChains),
          fourWheelDrive: Boolean(cab.fourWheelDrive),
          skiRack: Boolean(cab.skiRack),
          multiDayAvailable: cab.multiDayAvailable !== false,
          unionVerified: Boolean(cab.unionVerified || cab.verificationStatus === 'APPROVED'),
          unionName: cab.unionName || dp?.unionName || 'Kashmir Curators Verified Union',
          features,
          estimatedKm,
          estimatedDurationMin,
          estimatedFare: fareData.fare,
          fareBreakdown: fareData.breakdown,
          requiresSnowChains: fareData.requiresSnowChains,
          rateCard: safeParseObject(cab.rateCard),
          driverProfileId: dp?.id || null,
          isDriverOnline,
          driverStatus: dp?.status || 'STANDBY',
          driverDisplayName: maskChauffeurPublicName(dp?.user?.name),
          driverRating: dp?.rating ? Number(dp.rating) : 4.9,
          driverTripsCompleted: dp?.tripsCompleted ? Number(dp.tripsCompleted) : 42,
          currentSector: dp?.currentSector || 'Srinagar Central Hub',
          etaMinutes,
        };
      })
      .sort((a: any, b: any) => {
        if (a.isDriverOnline !== b.isDriverOnline) return a.isDriverOnline ? -1 : 1;
        if (a.requiresSnowChains) {
          if (a.snowChains !== b.snowChains) return a.snowChains ? -1 : 1;
        }
        return a.estimatedFare - b.estimatedFare;
      });

    const rawChainAdvisory =
      advisories.find((a: any) => /tangmarg|gulmarg|chain|snow/i.test(`${a.location || ''} ${a.status || ''} ${a.message || ''}`)) ||
      null;
    const chainAdvisory = rawChainAdvisory
      ? {
          ...rawChainAdvisory,
          title:
            rawChainAdvisory.title ||
            `${rawChainAdvisory.location || 'Kashmir Corridor'}${rawChainAdvisory.status ? ` — ${rawChainAdvisory.status}` : ''}`,
        }
      : null;

    res.json({
      matches,
      onlineDriversCount: onlineDrivers.length,
      totalFleetCount: cabs.length,
      estimatedKm,
      estimatedDurationMin,
      corridorAdvisory: chainAdvisory,
      advisories,
      computedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cabs] live-matches error:', error);
    res.status(500).json({ error: error.message || 'Failed to compute live cab matches' });
  }
};

export const getMyRideRequests = async (req: any, res: Response) => {
  try {
    const userRole = String(req.user?.role || '').toLowerCase();
    const isStaff = ['admin', 'operations', 'sales'].includes(userRole);
    const where = isStaff ? {} : { userId: req.user.id };

    const reservations = await p.cabReservation.findMany({
      where,
      include: {
        cab: true,
        driverProfile: { include: { user: { select: { id: true, name: true, phone: true } } } },
        offers: { orderBy: { driverFare: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const sanitized = reservations.map((r: any) => {
      const confirmed = ['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'COMPLETED'].includes(String(r.status).toUpperCase());
      return {
        ...r,
        driverName: confirmed ? r.driverName || r.driverProfile?.user?.name : maskChauffeurPublicName(r.driverName),
        driverPhone: confirmed ? r.driverPhone || r.driverProfile?.user?.phone || null : null,
        securityPin: confirmed ? r.securityPin : undefined,
        arrivalTelemetry: safeParseObject(r.arrivalTelemetry),
        offers: (r.offers || []).map((o: any) => sanitizeOfferForTourist(o, r.status)),
      };
    });

    res.json(sanitized);
  } catch (error: any) {
    console.error('[Cabs] getMyRideRequests error:', error);
    res.status(500).json({ error: 'Failed to fetch ride requests' });
  }
};

export const createRideRequest = async (req: any, res: Response) => {
  try {
    const {
      pickupLocation,
      dropLocation,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      startDate,
      endDate,
      tripType = 'airport',
      requestedCabType,
      preferredCabId,
      preferredDriverProfileId,
      travelersCount = 2,
      luggageCount = 2,
      offeredFare,
      estimatedDistanceKm,
      passengerName,
      passengerPhone,
      passengerEmail,
      specialNotes,
      arrivalTelemetry,
      instantConfirm = false,
    } = req.body || {};

    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'pickupLocation and dropLocation are required' });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedEnd = endDate ? new Date(endDate) : new Date(parsedStart.getTime() + 4 * 3600 * 1000);
    const distanceKm = inferCorridorDistanceKm(pickupLocation, dropLocation, estimatedDistanceKm);
    const durationMin = Math.max(18, Math.round(distanceKm * 1.9));
    const voucherReference = `KC-CAB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const securityPin = String(Math.floor(1000 + Math.random() * 9000));

    // Locate candidate active approved cabs & live online approved drivers
    const [activeCabs, onlineDrivers, requestor] = await Promise.all([
      p.cab.findMany({
        where: withTenantScope(
          {
            isActive: true,
            verificationStatus: 'APPROVED',
          },
          req.tenantId
        ),
      }),
      p.driverProfile.findMany({
        where: {
          approvalStatus: 'APPROVED',
          status: 'AVAILABLE',
        },
        include: { user: true },
      }),
      p.user.findUnique({ where: { id: req.user.id } }).catch(() => null),
    ]);

    const preferredCab =
      (preferredCabId ? activeCabs.find((c: any) => c.id === preferredCabId) : null) ||
      activeCabs.find((c: any) =>
        requestedCabType ? String(c.type).toLowerCase().includes(String(requestedCabType).toLowerCase()) : true
      ) ||
      activeCabs[0] ||
      null;

    const baselineFareData = computeCorridorFare(
      preferredCab || { basePrice: 1200, pricePerKm: 22 },
      pickupLocation,
      dropLocation,
      tripType,
      distanceKm
    );

    const parsedOfferedFare = Number(offeredFare) > 0 ? Number(offeredFare) : baselineFareData.fare;

    const reservation = await p.cabReservation.create({
      data: {
        userId: req.user.id,
        cabId: preferredCab?.id || null,
        passengerName: passengerName || requestor?.name || req.user.name || 'Valued Guest',
        passengerPhone: passengerPhone || requestor?.phone || null,
        passengerEmail: passengerEmail || requestor?.email || req.user.email || null,
        travelersCount: Math.max(1, Number(travelersCount) || 2),
        luggageCount: Math.max(0, Number(luggageCount) || 2),
        tripType: String(tripType || 'airport'),
        requestedCabType: requestedCabType || preferredCab?.type || 'SUV_SNOW_CHAINS',
        pickupLocation: String(pickupLocation),
        dropLocation: String(dropLocation),
        pickupLat: pickupLat !== undefined ? Number(pickupLat) : null,
        pickupLng: pickupLng !== undefined ? Number(pickupLng) : null,
        dropLat: dropLat !== undefined ? Number(dropLat) : null,
        dropLng: dropLng !== undefined ? Number(dropLng) : null,
        estimatedDistanceKm: distanceKm,
        estimatedDurationMin: durationMin,
        startDate: parsedStart,
        endDate: parsedEnd,
        status: 'SEARCHING',
        totalCost: parsedOfferedFare,
        contractRate: parsedOfferedFare,
        offeredFare: parsedOfferedFare,
        agreedFare: 0,
        securityPin,
        voucherReference,
        specialNotes: specialNotes || null,
        arrivalTelemetry: arrivalTelemetry
          ? typeof arrivalTelemetry === 'string'
            ? arrivalTelemetry
            : JSON.stringify(arrivalTelemetry)
          : null,
        organizationId: resolveWriteTenantId(req),
      },
    });

    // Order online drivers so preferred driver or cab owner goes first
    const orderedDrivers = [...onlineDrivers].sort((a: any, b: any) => {
      if (preferredDriverProfileId) {
        if (a.id === preferredDriverProfileId) return -1;
        if (b.id === preferredDriverProfileId) return 1;
      }
      if (preferredCab?.driverProfileId) {
        if (a.id === preferredCab.driverProfileId) return -1;
        if (b.id === preferredCab.driverProfileId) return 1;
      }
      return Number(b.rating || 4.8) - Number(a.rating || 4.8);
    });

    const createdOffers: any[] = [];
    const dispatchedDrivers: Array<{ userId: string; driverProfileId: string; offerId: string }> = [];

    for (let i = 0; i < Math.min(5, orderedDrivers.length); i++) {
      const dp = orderedDrivers[i];
      const driverCab =
        activeCabs.find((c: any) => c.driverProfileId === dp.id) ||
        (dp.activeVehicleId ? activeCabs.find((c: any) => c.id === dp.activeVehicleId) : null) ||
        preferredCab;

      if (!driverCab) continue;

      const driverFareCalc = computeCorridorFare(driverCab, pickupLocation, dropLocation, tripType, distanceKm);
      const publishedFare = Math.max(parsedOfferedFare, driverFareCalc.fare);

      const offer = await p.cabDispatchOffer.create({
        data: {
          reservationId: reservation.id,
          driverProfileId: dp.id,
          cabId: driverCab.id,
          driverName: dp.user?.name || 'Kashmir Chauffeur',
          driverPhone: dp.user?.phone || null,
          driverRating: Number(dp.rating || 4.9),
          driverTrips: Number(dp.tripsCompleted || 0),
          vehicleName: driverCab.name,
          vehicleType: driverCab.type,
          vehicleImage: driverCab.image || '',
          vehicleRegNo: driverCab.plateNumber || dp.vehicleRegNo || 'JK01-TOURIST',
          capacity: driverCab.capacity || 6,
          luggageCapacity: driverCab.luggageCapacity ?? 4,
          snowChains: Boolean(driverCab.snowChains),
          fourWheelDrive: Boolean(driverCab.fourWheelDrive),
          unionVerified: Boolean(driverCab.unionVerified || driverCab.verificationStatus === 'APPROVED'),
          unionName: driverCab.unionName || dp.unionName || 'Kashmir Curators Verified Union',
          initialFare: parsedOfferedFare,
          driverFare: publishedFare,
          status: 'OFFERED',
          etaMinutes: 6 + i * 3,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await p.driverProfile
        .update({
          where: { id: dp.id },
          data: { offersReceived: { increment: 1 } },
        })
        .catch(() => null);

      createdOffers.push(offer);
      if (dp.userId) {
        dispatchedDrivers.push({ userId: dp.userId, driverProfileId: dp.id, offerId: offer.id });
      }
    }

    // Broadcast to live online drivers & staff command desk
    const dispatchPayload = {
      reservationId: reservation.id,
      bookingId: reservation.id,
      voucherReference: reservation.voucherReference,
      pickupLocation: reservation.pickupLocation,
      dropLocation: reservation.dropLocation,
      tripType: reservation.tripType,
      travelersCount: reservation.travelersCount,
      luggageCount: reservation.luggageCount,
      offeredFare: reservation.offeredFare,
      estimatedDistanceKm: reservation.estimatedDistanceKm,
      estimatedDurationMin: reservation.estimatedDurationMin,
      passengerName: reservation.passengerName,
      securityPin: reservation.securityPin,
      arrivalTelemetry: safeParseObject(reservation.arrivalTelemetry),
    };

    if (req.io) {
      for (const target of dispatchedDrivers) {
        req.io.to(`driver-${target.userId}`).emit('driver-trip-dispatched', {
          ...dispatchPayload,
          offerId: target.offerId,
        });
        req.io.to(`user-${target.userId}`).emit('driver-trip-dispatched', {
          ...dispatchPayload,
          offerId: target.offerId,
        });
      }
      req.io.to('driver-room').emit('driver-trip-dispatched', dispatchPayload);
      req.io.to('admin-room').emit('cab-request-created', {
        reservation,
        offersCount: createdOffers.length,
      });
      req.io.to(`user-${req.user.id}`).emit('cab-request-created', {
        reservation,
        offers: createdOffers.map((o) => sanitizeOfferForTourist(o, reservation.status)),
      });
    }

    broadcastDriverEvent(
      'TRIP_DISPATCHED',
      dispatchPayload,
      dispatchedDrivers.length > 0
        ? {
            targetUserIds: dispatchedDrivers.map((d) => d.userId),
            targetDriverProfileIds: dispatchedDrivers.map((d) => d.driverProfileId),
            includeStaff: true,
          }
        : undefined
    );

    const sanitizedOffers = createdOffers.map((o) => sanitizeOfferForTourist(o, reservation.status));

    // Optional single-click instant confirm when requested at published fare & matching online offer exists
    if (instantConfirm && createdOffers.length > 0) {
      const topOffer = createdOffers[0];
      if (parsedOfferedFare >= topOffer.driverFare) {
        req.params.id = reservation.id;
        req.params.offerId = topOffer.id;
        return confirmRideOffer(req, res);
      }
    }

    res.status(201).json({
      success: true,
      rideRequest: {
        ...reservation,
        arrivalTelemetry: safeParseObject(reservation.arrivalTelemetry),
        securityPin: undefined, // Revealed to tourist only once driver offer is confirmed
      },
      offers: sanitizedOffers,
      onlineDriversNotified: dispatchedDrivers.length,
    });
  } catch (error: any) {
    console.error('[Cabs] createRideRequest error:', error);
    res.status(500).json({ error: error.message || 'Failed to create ride request' });
  }
};

export const getRideRequestById = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    const reservation = await p.cabReservation.findUnique({
      where: { id },
      include: {
        cab: true,
        driverProfile: { include: { user: { select: { id: true, name: true, phone: true } } } },
        offers: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    const role = String(req.user?.role || '').toLowerCase();
    const isStaff = ['admin', 'operations', 'sales'].includes(role);
    const isOwner = reservation.userId === req.user.id;
    const isParticipatingDriver =
      role === 'driver' &&
      ((reservation.driverProfile?.userId === req.user.id) ||
        (reservation.offers || []).some((o: any) => o.driverProfileId === req.user.driverProfileId));

    if (!isStaff && !isOwner && !isParticipatingDriver) {
      return res.status(403).json({ error: 'Forbidden: access denied to this ride request' });
    }

    const isConfirmed = ['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'COMPLETED'].includes(
      String(reservation.status || '').toUpperCase()
    );

    res.json({
      ...reservation,
      driverName: isConfirmed
        ? reservation.driverName || reservation.driverProfile?.user?.name
        : maskChauffeurPublicName(reservation.driverName),
      driverPhone: isConfirmed
        ? reservation.driverPhone || reservation.driverProfile?.user?.phone || null
        : null,
      securityPin: isConfirmed || isStaff || isParticipatingDriver ? reservation.securityPin : undefined,
      arrivalTelemetry: safeParseObject(reservation.arrivalTelemetry),
      offers: (reservation.offers || []).map((o: any) =>
        isStaff ? o : sanitizeOfferForTourist(o, reservation.status)
      ),
    });
  } catch (error: any) {
    console.error('[Cabs] getRideRequestById error:', error);
    res.status(500).json({ error: 'Failed to load ride request' });
  }
};

export const touristCounterOffer = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    const offerId = String(req.params.offerId);
    const counterFare = Number(req.body?.counterFare ?? req.body?.fare);

    if (!Number.isFinite(counterFare) || counterFare < 400) {
      return res.status(400).json({ error: 'Valid counterFare (>= ₹400) is required' });
    }

    const reservation = await p.cabReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Ride request not found' });

    const role = String(req.user?.role || '').toLowerCase();
    if (reservation.userId !== req.user.id && !['admin', 'operations'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden: only the booking guest can counter-offer' });
    }

    if (!['SEARCHING', 'OFFERED', 'ALLOCATED'].includes(String(reservation.status).toUpperCase())) {
      return res.status(400).json({ error: `Cannot counter-offer in status ${reservation.status}` });
    }

    const offer = await p.cabDispatchOffer.findUnique({
      where: { id: offerId },
      include: { driverProfile: true },
    });
    if (!offer || offer.reservationId !== id) {
      return res.status(404).json({ error: 'Driver offer not found for this ride request' });
    }
    if (['ACCEPTED', 'CLOSED', 'DECLINED', 'EXPIRED'].includes(offer.status)) {
      return res.status(400).json({ error: `Offer is already ${offer.status}` });
    }

    const updatedOffer = await p.cabDispatchOffer.update({
      where: { id: offerId },
      data: {
        touristCounter: counterFare,
        status: 'COUNTERED_BY_TOURIST',
      },
    });

    await p.cabReservation.update({
      where: { id },
      data: { offeredFare: counterFare },
    });

    const driverUserId = offer.driverProfile?.userId;
    if (req.io && driverUserId) {
      req.io.to(`driver-${driverUserId}`).emit('tourist-counter-offer', {
        reservationId: id,
        offerId,
        touristCounter: counterFare,
        pickupLocation: reservation.pickupLocation,
        dropLocation: reservation.dropLocation,
      });
      req.io.to(`user-${driverUserId}`).emit('tourist-counter-offer', {
        reservationId: id,
        offerId,
        touristCounter: counterFare,
      });
    }

    if (driverUserId) {
      broadcastDriverEvent(
        'TOURIST_COUNTER_OFFER',
        {
          reservationId: id,
          offerId,
          touristCounter: counterFare,
          pickupLocation: reservation.pickupLocation,
          dropLocation: reservation.dropLocation,
        },
        { targetUserIds: [driverUserId], targetDriverProfileIds: [offer.driverProfileId] }
      );
    }

    res.json({
      success: true,
      offer: sanitizeOfferForTourist(updatedOffer, reservation.status),
    });
  } catch (error: any) {
    console.error('[Cabs] touristCounterOffer error:', error);
    res.status(500).json({ error: 'Failed to submit counter offer' });
  }
};

export const confirmRideOffer = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    const offerId = String(req.params.offerId);

    const reservation = await p.cabReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Ride request not found' });

    const role = String(req.user?.role || '').toLowerCase();
    if (reservation.userId !== req.user.id && !['admin', 'operations'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden: only the booking guest can confirm' });
    }

    if (['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'COMPLETED', 'CANCELLED'].includes(String(reservation.status).toUpperCase())) {
      return res.status(400).json({ error: `Ride request already ${reservation.status}` });
    }

    const offer = await p.cabDispatchOffer.findUnique({
      where: { id: offerId },
      include: { driverProfile: { include: { user: true } } },
    });
    if (!offer || offer.reservationId !== id) {
      return res.status(404).json({ error: 'Dispatch offer not found' });
    }
    if (!['OFFERED', 'DRIVER_ACCEPTED', 'COUNTERED_BY_DRIVER'].includes(offer.status)) {
      return res.status(400).json({
        error:
          offer.status === 'COUNTERED_BY_TOURIST'
            ? 'Waiting for chauffeur to accept your counter-offer'
            : `Cannot confirm offer in status ${offer.status}`,
      });
    }

    const agreedFare = Number(offer.driverFare) || Number(reservation.offeredFare) || 1500;
    const securityPin = reservation.securityPin || String(Math.floor(1000 + Math.random() * 9000));
    const driverPhone = offer.driverPhone || offer.driverProfile?.user?.phone || '+919906778801';
    const driverName = offer.driverName || offer.driverProfile?.user?.name || 'Verified Chauffeur';

    const result = await p.$transaction(async (tx: any) => {
      const booking = await tx.booking.create({
        data: {
          userId: reservation.userId || req.user.id,
          type: 'cab',
          itemName: `${offer.vehicleName} — ${reservation.pickupLocation} to ${reservation.dropLocation}`,
          bookingDate: reservation.startDate || new Date(),
          status: 'confirmed',
          stage: 'CONFIRMED',
          totalAmount: agreedFare,
          organizationId: reservation.organizationId || resolveWriteTenantId(req),
          details: JSON.stringify({
            reservationId: reservation.id,
            voucherReference: reservation.voucherReference,
            pickupLocation: reservation.pickupLocation,
            dropLocation: reservation.dropLocation,
            tripType: reservation.tripType,
            driverName,
            driverPhone,
            vehicleName: offer.vehicleName,
            vehicleRegNo: offer.vehicleRegNo,
            securityPin,
            estimatedDistanceKm: reservation.estimatedDistanceKm,
            snowChains: offer.snowChains,
            fourWheelDrive: offer.fourWheelDrive,
          }),
        },
      });

      const updatedReservation = await tx.cabReservation.update({
        where: { id: reservation.id },
        data: {
          cabId: offer.cabId,
          driverProfileId: offer.driverProfileId,
          bookingId: booking.id,
          driverName,
          driverPhone,
          vehicleRegNo: offer.vehicleRegNo,
          status: 'DISPATCHED',
          totalCost: agreedFare,
          contractRate: agreedFare,
          agreedFare,
          securityPin,
        },
      });

      const confirmedOffer = await tx.cabDispatchOffer.update({
        where: { id: offer.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.cabDispatchOffer.updateMany({
        where: {
          reservationId: reservation.id,
          id: { not: offer.id },
          status: { in: ['OFFERED', 'DRIVER_ACCEPTED', 'COUNTERED_BY_DRIVER', 'COUNTERED_BY_TOURIST'] },
        },
        data: { status: 'CLOSED' },
      });

      await tx.driverProfile.update({
        where: { id: offer.driverProfileId },
        data: {
          status: 'ON_TRIP',
          offersAccepted: { increment: 1 },
        },
      });

      return { booking, updatedReservation, confirmedOffer };
    });

    const driverUserId = offer.driverProfile?.userId;
    if (req.io) {
      if (driverUserId) {
        req.io.to(`driver-${driverUserId}`).emit('trip-confirmed', {
          reservation: result.updatedReservation,
          booking: result.booking,
          offer: result.confirmedOffer,
        });
        req.io.to(`user-${driverUserId}`).emit('trip-confirmed', {
          reservation: result.updatedReservation,
          booking: result.booking,
        });
      }
      if (reservation.userId) {
        req.io.to(`user-${reservation.userId}`).emit('cab-reservation-updated', {
          reservation: result.updatedReservation,
          booking: result.booking,
          offer: sanitizeOfferForTourist(result.confirmedOffer, 'DISPATCHED'),
        });
      }
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Cab ${offer.vehicleName} (${offer.vehicleRegNo}) confirmed for ${reservation.passengerName}`,
        booking: result.booking,
      });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'DRIVER_DISPATCHED' });
    }

    if (driverUserId) {
      broadcastDriverEvent(
        'TRIP_CONFIRMED',
        {
          reservationId: result.updatedReservation.id,
          bookingId: result.booking.id,
          status: 'DISPATCHED',
          agreedFare,
          securityPin,
        },
        { targetUserIds: [driverUserId], targetDriverProfileIds: [offer.driverProfileId] }
      );
    }

    res.json({
      success: true,
      booking: result.booking,
      reservation: {
        ...result.updatedReservation,
        arrivalTelemetry: safeParseObject(result.updatedReservation.arrivalTelemetry),
      },
      confirmedOffer: sanitizeOfferForTourist(result.confirmedOffer, 'DISPATCHED'),
    });
  } catch (error: any) {
    console.error('[Cabs] confirmRideOffer error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm chauffeur offer' });
  }
};

export const cancelRideRequest = async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    const reservation = await p.cabReservation.findUnique({ where: { id } });
    if (!reservation) return res.status(404).json({ error: 'Ride request not found' });

    const role = String(req.user?.role || '').toLowerCase();
    if (reservation.userId !== req.user.id && !['admin', 'operations'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (['ON_TRIP', 'COMPLETED'].includes(String(reservation.status).toUpperCase())) {
      return res.status(400).json({ error: `Cannot cancel ride in ${reservation.status}` });
    }

    const updated = await p.cabReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await p.cabDispatchOffer.updateMany({
      where: { reservationId: id, status: { not: 'ACCEPTED' } },
      data: { status: 'EXPIRED' },
    });

    if (reservation.driverProfileId) {
      await p.driverProfile
        .update({
          where: { id: reservation.driverProfileId },
          data: { status: 'AVAILABLE' },
        })
        .catch(() => null);
    }

    if (req.io) {
      req.io.to('driver-room').emit('cab-reservation-cancelled', { reservationId: id });
      req.io.to(`user-${req.user.id}`).emit('cab-reservation-updated', { reservation: updated });
      req.io.to('cabs-public').emit('live-drivers-updated', { type: 'RIDE_CANCELLED' });
    }

    broadcastDriverEvent('RIDE_CANCELLED', { reservationId: id });
    res.json({ success: true, reservation: updated });
  } catch (error: any) {
    console.error('[Cabs] cancelRideRequest error:', error);
    res.status(500).json({ error: 'Failed to cancel ride request' });
  }
};

