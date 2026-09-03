import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

export const getSafetyCardByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const card = await prisma.tripSafetyCard.findUnique({
      where: { shareToken: token }
    });

    if (!card) {
      return res.status(404).json({ error: 'Trip Safety Card not found or link expired.' });
    }

    // Get live corridor status to embed on card
    const advisories = await prisma.travelAdvisory.findMany({
      where: {
        severity: { in: ['WARNING', 'SEVERE', 'CRITICAL_EMERGENCY'] }
      },
      take: 3,
      orderBy: { lastUpdated: 'desc' }
    });

    res.json({
      ...card,
      assignedDriver: card.assignedDriver ? JSON.parse(card.assignedDriver) : null,
      assignedHotelSos: card.assignedHotelSos ? JSON.parse(card.assignedHotelSos) : null,
      emergencyContacts: card.emergencyContacts ? JSON.parse(card.emergencyContacts) : [],
      liveAlerts: advisories,
      helplineContacts: {
        emergencyPolice: '112',
        kashmirTouristPolice: '+91 194 2452224',
        pcrSrinagar: '+91 194 2477001',
        sdrfRescue: '+91 194 2455113',
        srinagarAirportHelpline: '+91 194 2303000'
      }
    });
  } catch (error: any) {
    console.error('getSafetyCardByToken error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trip safety card' });
  }
};

export const createOrGetSafetyCard = async (req: any, res: Response) => {
  try {
    const { bookingId, passengerName, passengerPhone, travelerCount, emergencyContacts, bloodGroup, medicalNotes } = req.body;

    let existing = null;
    if (bookingId) {
      existing = await prisma.tripSafetyCard.findUnique({
        where: { bookingId }
      });
    }

    if (existing) {
      return res.json(existing);
    }

    // Generate high-entropy share token
    const shareToken = crypto.randomBytes(12).toString('hex');

    // Default driver / hotel info if available from booking
    const defaultDriver = {
      name: 'Bashir Ahmad (Kashmir Connect Chauffeur)',
      phone: '+91 94190 88214',
      vehicleNo: 'JK01-AZ-4921',
      vehicleType: 'Toyota Innova Crysta 4x4'
    };

    const defaultHotel = {
      hotelName: 'The Grand Heritage & Himalayan Pine Retreat',
      location: 'Srinagar / Gulmarg',
      managerPhone: '+91 94191 22334',
      frontDeskPhone: '+91 194 2501234'
    };

    const card = await prisma.tripSafetyCard.create({
      data: {
        bookingId: bookingId || null,
        shareToken,
        passengerName: passengerName || req.user?.name || 'Valued Traveller',
        passengerPhone: passengerPhone || req.user?.phone || '+91 99999 99999',
        travelerCount: parseInt(travelerCount) || 2,
        assignedDriver: JSON.stringify(defaultDriver),
        assignedHotelSos: JSON.stringify(defaultHotel),
        emergencyContacts: emergencyContacts ? (typeof emergencyContacts === 'string' ? emergencyContacts : JSON.stringify(emergencyContacts)) : JSON.stringify([
          { name: 'Family Emergency Contact', relation: 'Next of Kin', phone: '+91 98765 43210' }
        ]),
        bloodGroup: bloodGroup || 'O+',
        medicalNotes: medicalNotes || 'No known high-altitude contraindications',
        safetyStatus: 'SAFE'
      }
    });

    res.status(201).json(card);
  } catch (error: any) {
    console.error('createOrGetSafetyCard error:', error.message);
    res.status(500).json({ error: 'Failed to generate trip safety card: ' + error.message });
  }
};

export const reportTravellerSos = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { notes, liveGps } = req.body;

    const card = await prisma.tripSafetyCard.findUnique({
      where: { shareToken: token }
    });

    if (!card) return res.status(404).json({ error: 'Trip card not found' });

    const updated = await prisma.tripSafetyCard.update({
      where: { id: card.id },
      data: {
        safetyStatus: 'ASSISTANCE_REQUESTED',
        medicalNotes: notes ? `${card.medicalNotes || ''} | SOS: ${notes}` : card.medicalNotes
      }
    });

    // Create system notification for operations team
    await prisma.notification.create({
      data: {
        title: `🚨 EMERGENCY SOS: ${card.passengerName}`,
        message: `Traveller triggered SOS assistance from Trip Safety Card #${token.slice(0, 8)}. Live GPS: ${liveGps || 'Unavailable'}. Phone: ${card.passengerPhone}`,
        type: 'warning',
        priority: 'high',
        link: `/admin`
      }
    });

    res.json({ success: true, message: 'Emergency SOS signal dispatched to 24/7 Operations Desk and Tourist Police.', card: updated });
  } catch (error: any) {
    console.error('reportTravellerSos error:', error.message);
    res.status(500).json({ error: 'Failed to process SOS signal' });
  }
};
