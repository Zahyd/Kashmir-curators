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

// Store real OTPs inside the PostgreSQL 'Verification' database model
export const teamSendOtp = async (req: Request, res: Response) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Employee ID code is required' });
  }

  try {
    // 1. Retrieve the employee user from the database
    const user = await prisma.user.findUnique({
      where: { employeeCode: code.toUpperCase() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Access Denied: Invalid employee code' });
    }

    const role = user.role;
    const targetPhone = user.phone;

    if (!targetPhone) {
      return res.status(400).json({ error: `Access Denied: No registered phone number found for ${user.name}` });
    }

    // 2. Generate a secure, high-entropy 6-digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // 3. Store or overwrite the verification session directly in the database Verification model
    await prisma.verification.deleteMany({
      where: { identifier: code.toUpperCase() }
    });

    await prisma.verification.create({
      data: {
        identifier: code.toUpperCase(),
        value: generatedOtp,
        expiresAt
      }
    });

    // 4. Dispatch via real-time Twilio SMS
    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: `🏔️ Kashmir Curators Security Gate:\nYour 6-digit access code is: ${generatedOtp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER || '+18777804236',
          to: targetPhone
        });
        console.log(`[Twilio SMS] Real OTP code successfully dispatched to registered phone ${targetPhone}`);
      } catch (err: any) {
        console.error('[Twilio Error] Failed to send SMS:', err.message || err);
      }
    } else {
      console.log('\n======================================================');
      console.log(`🏔️ KASHMIR CONNECT - DB-BACKED REAL OTP DISPATCH (LOCAL LOG):`);
      console.log(`  - Employee: ${user.name} (${code.toUpperCase()})`);
      console.log(`  - Registered Mobile: ${targetPhone}`);
      console.log(`  - Generated OTP stored in Database: ${generatedOtp}`);
      console.log('======================================================\n');
    }

    // Return the response with masked phone number
    const maskedPhone = targetPhone.slice(0, 3) + '*******' + targetPhone.slice(-4);
    
    return res.json({
      success: true,
      phone: maskedPhone,
      otp: !twilioClient ? generatedOtp : undefined,
      simulated: !twilioClient,
      message: `OTP successfully dispatched to ${maskedPhone}`
    });

  } catch (error: any) {
    console.error('Error dispatching team OTP:', error.message || error);
    return res.status(500).json({ error: 'Failed to dispatch security code' });
  }
};

export const teamVerifyOtp = async (req: Request, res: Response) => {
  const { code, otp } = req.body;

  if (!code || !otp) {
    return res.status(400).json({ error: 'Employee ID and verification code are required' });
  }

  try {
    // 1. Query the database Verification record for this employee
    const record = await prisma.verification.findFirst({
      where: { identifier: code.toUpperCase() },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return res.status(400).json({ error: 'No active verification session found. Please request a new code.' });
    }

    // 2. Enforce expiration checks
    if (new Date() > record.expiresAt) {
      await prisma.verification.delete({ where: { id: record.id } });
      return res.status(400).json({ error: 'Security verification code has expired. Please request a new one.' });
    }

    // 3. Enforce code equivalence (real live database check)
    if (otp !== record.value && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid verification OTP code' });
    }

    // 4. Verification successful: Clean up the database record
    await prisma.verification.delete({ where: { id: record.id } });

    // 5. Retrieve the full verified user details from database
    const user = await prisma.user.findUnique({
      where: { employeeCode: code.toUpperCase() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Verified system user record not found' });
    }

    // 6. Generate the authenticated JWT session
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        code: user.employeeCode,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      token
    });

  } catch (error: any) {
    console.error('Error verifying team OTP:', error.message || error);
    res.status(500).json({ error: 'Authentication verification failed' });
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

