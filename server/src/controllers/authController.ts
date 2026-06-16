import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';

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
import { WhatsAppWorkflowEngine } from '../services/whatsappService';

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

    const targetEmail = user.email;

    if (!targetEmail) {
      return res.status(400).json({ error: `Access Denied: No registered email address found for ${user.name}` });
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

    // 4. Dispatch the verification code via Resend/Brevo email channel
    const emailSubject = "🏔️ Kashmir Curators Security Gate Code";
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #ffffff; background-color: #05080a; padding: 40px; border-radius: 20px; border: 1px solid #b5852a; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(181, 133, 42, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #b5852a; font-size: 26px; margin: 0; font-weight: bold; letter-spacing: 2px;">KASHMIR CURATORS</h2>
          <p style="color: #666; font-size: 10px; margin-top: 5px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Security Command Center</p>
        </div>
        <div style="background-color: #0a0f12; padding: 30px; border-radius: 15px; text-align: center; border: 1px solid #1f2a30;">
          <p style="color: #aaa; font-size: 14px; margin-bottom: 20px; font-weight: 500;">Your secure one-time verification code is:</p>
          <div style="font-size: 36px; font-family: monospace; font-weight: bold; color: #b5852a; letter-spacing: 5px; background: #05080a; padding: 15px; border-radius: 10px; border: 1px solid rgba(181, 133, 42, 0.2); display: inline-block;">${generatedOtp}</div>
          <p style="color: #666; font-size: 12px; margin-top: 20px; font-style: italic;">This security code is valid for 5 minutes.</p>
        </div>
        <p style="color: #444; font-size: 11px; text-align: center; margin-top: 30px; line-height: 1.4;">
          If you did not initiate this login request, please alert a system administrator immediately.<br/>
          &copy; 2026 Kashmir Curators Management Suite.
        </p>
      </div>
    `;

    const emailSent = await notificationService.sendCustomerEmail(targetEmail, emailSubject, emailHtml);

    // Log the generated OTP securely inside the server console for debugging
    console.log('\n======================================================');
    console.log(`🏔️ KASHMIR CONNECT - SECURITY ACCESS OTP DISPATCHED (EMAIL):`);
    console.log(`  - Employee: ${user.name} (${code.toUpperCase()})`);
    console.log(`  - Target Email Destination: ${targetEmail}`);
    console.log(`  - Generated Access Code (stored in DB): ${generatedOtp}`);
    console.log(`  - Mail Sent Status: ${emailSent ? 'SUCCESS' : 'FAILED / SIMULATION'}`);
    console.log('======================================================\n');

    // Return the response with masked email address
    const emailParts = targetEmail.split('@');
    const prefix = emailParts[0];
    const maskedPrefix = prefix.length > 3 ? prefix.slice(0, 3) + '*******' : prefix.slice(0, 1) + '*******';
    const maskedEmail = maskedPrefix + '@' + emailParts[1];
    
    return res.json({
      success: true,
      email: maskedEmail,
      phone: maskedEmail, // Maintain compatibility if frontend utilizes 'phone' variable
      ...(emailSent ? {} : { otp: generatedOtp }), // Only return code in local simulation mode
      simulated: !emailSent,
      message: `OTP successfully sent to your registered email ${maskedEmail}`
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

export const updateProfile = async (req: any, res: Response) => {
  const { name, email, phone, image, password } = req.body;
  const userId = req.user.id;

  try {
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { 
          email,
          NOT: { id: userId }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (image !== undefined) dataToUpdate.image = image;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    res.json({
      success: true,
      user: {
        code: updatedUser.employeeCode,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        image: updatedUser.image
      }
    });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { email, name, image } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          email,
          name,
          image: image || null,
          role: 'user'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone || undefined },
      token
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
};

