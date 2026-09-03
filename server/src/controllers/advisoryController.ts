import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { disruptionService } from '../services/disruptionService';

export const getAdvisories = async (req: Request, res: Response) => {
  try {
    const { severity, location } = req.query;

    const advisories = await prisma.travelAdvisory.findMany({
      where: {
        ...(severity ? { severity: String(severity) } : {}),
        ...(location ? { location: { contains: String(location), mode: 'insensitive' } } : {})
      },
      include: {
        disruptionImpacts: {
          select: { id: true, status: true, impactLevel: true }
        }
      },
      orderBy: [
        { emergencyModeActive: 'desc' },
        { lastUpdated: 'desc' }
      ]
    });

    res.json(advisories);
  } catch (error: any) {
    console.error('Advisories fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch travel advisories' });
  }
};

export const createAdvisory = async (req: any, res: Response) => {
  try {
    const {
      location,
      status,
      message,
      severity = 'NORMAL',
      category = 'GENERAL',
      corridors,
      source = 'J&K Tourism & Administration',
      sourceUrl,
      validFrom,
      validUntil,
      recommendedAction,
      isVerified = true,
      emergencyModeActive = false
    } = req.body;

    if (!location || !status || !message) {
      return res.status(400).json({ error: 'location, status, and message are required' });
    }

    const corridorsStr = corridors ? (typeof corridors === 'string' ? corridors : JSON.stringify(corridors)) : null;

    const advisory = await prisma.travelAdvisory.create({
      data: {
        location,
        status,
        message,
        severity,
        category,
        corridors: corridorsStr,
        source,
        sourceUrl,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        recommendedAction,
        isVerified,
        emergencyModeActive,
        lastUpdated: new Date()
      }
    });

    // Evaluate disruption impact on active bookings
    try {
      await disruptionService.evaluateAdvisoryDisruption(advisory.id);
    } catch (evalErr: any) {
      console.error('Auto disruption eval failed:', evalErr.message);
    }

    if (req.io) {
      req.io.emit('advisory-created', advisory);
      if (emergencyModeActive || severity === 'CRITICAL_EMERGENCY') {
        req.io.emit('emergency-mode-alert', advisory);
      }
    }

    res.status(201).json(advisory);
  } catch (error: any) {
    console.error('Advisory create error:', error.message);
    res.status(500).json({ error: 'Failed to create travel advisory: ' + error.message });
  }
};

export const updateAdvisory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const {
      location,
      status,
      message,
      severity,
      category,
      corridors,
      source,
      sourceUrl,
      validFrom,
      validUntil,
      recommendedAction,
      isVerified,
      emergencyModeActive
    } = req.body;

    const corridorsStr = corridors !== undefined
      ? (typeof corridors === 'string' ? corridors : JSON.stringify(corridors))
      : undefined;

    const advisory = await prisma.travelAdvisory.update({
      where: { id: String(id) },
      data: {
        ...(location !== undefined ? { location: String(location) } : {}),
        ...(status !== undefined ? { status: String(status) } : {}),
        ...(message !== undefined ? { message: String(message) } : {}),
        ...(severity !== undefined ? { severity: String(severity) } : {}),
        ...(category !== undefined ? { category: String(category) } : {}),
        ...(corridorsStr !== undefined ? { corridors: corridorsStr } : {}),
        ...(source !== undefined ? { source: String(source) } : {}),
        ...(sourceUrl !== undefined ? { sourceUrl: String(sourceUrl) } : {}),
        ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
        ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
        ...(recommendedAction !== undefined ? { recommendedAction: String(recommendedAction) } : {}),
        ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
        ...(emergencyModeActive !== undefined ? { emergencyModeActive: Boolean(emergencyModeActive) } : {}),
        lastUpdated: new Date()
      }
    });

    // Evaluate disruption impacts
    try {
      await disruptionService.evaluateAdvisoryDisruption(advisory.id);
    } catch (evalErr: any) {
      console.error('Auto disruption eval failed:', evalErr.message);
    }

    if (req.io) {
      req.io.emit('advisory-updated', advisory);
      if (advisory.emergencyModeActive || advisory.severity === 'CRITICAL_EMERGENCY') {
        req.io.emit('emergency-mode-alert', advisory);
      }
    }

    res.json(advisory);
  } catch (error: any) {
    console.error('Advisory update error:', error.message);
    res.status(500).json({ error: 'Failed to update travel advisory' });
  }
};

export const deleteAdvisory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.travelAdvisory.delete({
      where: { id: String(id) }
    });

    if (req.io) {
      req.io.emit('advisory-deleted', { id });
    }

    res.json({ success: true, message: 'Advisory removed' });
  } catch (error: any) {
    console.error('Advisory delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete travel advisory' });
  }
};

export const toggleEmergencyMode = async (req: any, res: Response) => {
  try {
    const { active, alertMessage, affectedLocation = 'Kashmir Valley Corridor' } = req.body;

    let targetAdvisory = await prisma.travelAdvisory.findFirst({
      where: { location: affectedLocation }
    });

    if (!targetAdvisory) {
      targetAdvisory = await prisma.travelAdvisory.create({
        data: {
          location: affectedLocation,
          status: active ? 'Restricted' : 'Open',
          message: alertMessage || (active ? 'EMERGENCY PROTOCOL ACTIVE: Transit corridors monitored by administration.' : 'All corridors operating under normal conditions.'),
          severity: active ? 'CRITICAL_EMERGENCY' : 'NORMAL',
          category: 'GOVERNMENT',
          emergencyModeActive: Boolean(active),
          isVerified: true
        }
      });
    } else {
      targetAdvisory = await prisma.travelAdvisory.update({
        where: { id: targetAdvisory.id },
        data: {
          emergencyModeActive: Boolean(active),
          severity: active ? 'CRITICAL_EMERGENCY' : 'NORMAL',
          message: alertMessage || targetAdvisory.message,
          lastUpdated: new Date()
        }
      });
    }

    if (req.io) {
      req.io.emit('emergency-mode-toggled', {
        active: Boolean(active),
        advisory: targetAdvisory
      });
    }

    res.json({ success: true, emergencyModeActive: active, advisory: targetAdvisory });
  } catch (error: any) {
    console.error('toggleEmergencyMode error:', error.message);
    res.status(500).json({ error: 'Failed to toggle emergency mode' });
  }
};
