import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user'
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};


import { Twilio } from 'twilio';

// Twilio Client initialization
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const twilioClient = accountSid && authToken ? new Twilio(accountSid, authToken) : null;

// Store simulated OTPs in memory (expires in 5 minutes)
const teamOtps = new Map<string, { otp: string; expires: number; phone: string }>();

export const teamSendOtp = async (req: Request, res: Response) => {
  const { code, phone } = req.body;
  
  const detectRole = (c: string) => {
    const upper = c.toUpperCase();
    if (upper.startsWith('ADMIN')) return 'admin';
    if (upper.startsWith('OPS')) return 'operations';
    if (upper.startsWith('SALES') || upper.startsWith('KC')) return 'sales';
    if (upper.startsWith('MKT')) return 'marketing';
    return null;
  };

  const role = detectRole(code);
  if (!role) {
    return res.status(400).json({ error: 'Invalid employee code' });
  }

  // Find user by code / role in database or use fallback details
  let targetPhone = phone || '';
  if (!targetPhone) {
    const user = await prisma.user.findFirst({
      where: { role: role }
    });
    targetPhone = user?.phone || '';
  }

  // Fallback demo phone numbers if database phone is missing
  if (!targetPhone) {
    const demoPhones: Record<string, string> = {
      'ADMIN001': '+919999999999',
      'OPS001': '+918888888888',
      'SALES001': '+917777777777',
      'MKT001': '+916666666666',
    };
    targetPhone = demoPhones[code.toUpperCase()] || '+919999999999';
  }

  // Generate secure 6-digit OTP
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save OTP in-memory with a 5-minute TTL
  teamOtps.set(code.toUpperCase(), {
    otp: generatedOtp,
    expires: Date.now() + 5 * 60 * 1000,
    phone: targetPhone
  });

  try {
    if (twilioClient && serviceSid) {
      // Real-time dispatch via Twilio Verify
      await twilioClient.verify.v2
        .services(serviceSid)
        .verifications.create({ to: targetPhone, channel: 'sms' });
      
      console.log(`[Twilio OTP] Sent real OTP verification via Twilio to ${targetPhone}`);
      return res.json({
        success: true,
        phone: targetPhone,
        message: `OTP successfully dispatched to ${targetPhone.slice(0, 3)}*****${targetPhone.slice(-4)}`
      });
    } else {
      // Simulation / Console Mode fallback
      console.log('\n======================================================');
      console.log(`🏔️  KASHMIR CONNECT - EMPLOYEE LOGIN OTP SYSTEM (SIMULATED):`);
      console.log(`  - Employee: ${code.toUpperCase()} (${role})`);
      console.log(`  - Registered Mobile: ${targetPhone}`);
      console.log(`  - Generated OTP Code: ${generatedOtp}`);
      console.log('======================================================\n');
      
      return res.json({
        success: true,
        simulated: true,
        otp: generatedOtp,
        phone: targetPhone,
        message: `[Simulation Mode] OTP sent to ${targetPhone.slice(0, 3)}*****${targetPhone.slice(-4)}`
      });
    }
  } catch (error: any) {
    console.error('Error dispatching team OTP:', error.message || error);
    return res.json({
      success: true,
      simulated: true,
      otp: generatedOtp,
      phone: targetPhone,
      message: `[Simulation Mode Fallback] OTP sent to ${targetPhone.slice(0, 3)}*****${targetPhone.slice(-4)}`
    });
  }
};

export const teamVerifyOtp = async (req: Request, res: Response) => {
  const { code, otp } = req.body;
  
  const detectRole = (c: string) => {
    const upper = c.toUpperCase();
    if (upper.startsWith('ADMIN')) return 'admin';
    if (upper.startsWith('OPS')) return 'operations';
    if (upper.startsWith('SALES') || upper.startsWith('KC')) return 'sales';
    if (upper.startsWith('MKT')) return 'marketing';
    return null;
  };

  const role = detectRole(code);
  if (!role) {
    return res.status(400).json({ error: 'Invalid employee code' });
  }

  try {
    const record = teamOtps.get(code.toUpperCase());
    
    // If Twilio is active and verified
    if (twilioClient && serviceSid && record) {
      const verification = await twilioClient.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: record.phone, code: otp });

      if (verification.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
    } else {
      // In simulation mode, check in-memory cache or standard dev code '123456'
      if (!record || Date.now() > record.expires) {
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
      if (otp !== record.otp && otp !== '123456') {
        return res.status(400).json({ error: 'Invalid OTP code' });
      }
    }

    // Clear OTP record on success
    teamOtps.delete(code.toUpperCase());

    // Retrieve or create system-level token
    const token = jwt.sign(
      { id: `system-${code}`, email: `${code.toLowerCase()}@kashmirconnect.com`, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        code: code.toUpperCase(),
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} ${code.slice(-3)}`,
        role
      },
      token
    });
  } catch (error: any) {
    console.error('Error verifying team OTP:', error.message || error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const teamLogin = async (req: Request, res: Response) => {
  const { code } = req.body;
  
  // Detect role from code (matching frontend logic for consistency)
  const detectRole = (c: string) => {
    const upper = c.toUpperCase();
    if (upper.startsWith('ADMIN')) return 'admin';
    if (upper.startsWith('OPS')) return 'operations';
    if (upper.startsWith('SALES') || upper.startsWith('KC')) return 'sales';
    if (upper.startsWith('MKT')) return 'marketing';
    return null;
  };

  const role = detectRole(code);
  if (!role) {
    return res.status(400).json({ error: 'Invalid employee code' });
  }

  // Generate a system-level token for the team member
  const token = jwt.sign(
    { id: `system-${code}`, email: `${code.toLowerCase()}@kashmirconnect.com`, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    user: {
      code: code.toUpperCase(),
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} ${code.slice(-3)}`,
      role
    },
    token
  });
};

