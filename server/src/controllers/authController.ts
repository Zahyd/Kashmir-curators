import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';

// SECURITY: JWT_SECRET is mandatory — server crashes at startup if missing (enforced by env.ts)
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, organizationId: (user as any).organizationId || undefined }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
    
    // Asynchronously synchronize user account into Neon Hosted Better Auth
    const neonAuthUrl = process.env.NEON_AUTH_BASE_URL || 'https://ep-purple-shadow-ao7lc51d.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth';
    if (neonAuthUrl) {
      fetch(`${neonAuthUrl}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://kashmir-curators.vercel.app'
        },
        body: JSON.stringify({ email, password, name })
      }).catch(neonErr => console.warn('Neon Better Auth background sync notice:', neonErr));
    }
    
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, organizationId: (user as any).organizationId || undefined }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
    
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

    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      phone: user.phone,
      uploadedDocuments: user.uploadedDocuments
    });
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

    // 2. Generate a cryptographically secure 6-digit OTP code
    const generatedOtp = crypto.randomInt(100000, 999999).toString();
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

    // SECURITY: Only log OTP in non-production environments for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n======================================================');
      console.log(`🏔️ KASHMIR CONNECT - SECURITY ACCESS OTP DISPATCHED (EMAIL):`);
      console.log(`  - Employee: ${user.name} (${code.toUpperCase()})`);
      console.log(`  - Target Email Destination: ${targetEmail}`);
      console.log(`  - Generated Access Code (stored in DB): ${generatedOtp}`);
      console.log(`  - Mail Sent Status: ${emailSent ? 'SUCCESS' : 'FAILED / SIMULATION'}`);
      console.log('======================================================\n');
    } else {
      console.log(`[OTP] Dispatched to ${code.toUpperCase()} via email. Sent: ${emailSent}`);
    }

    // Return the response with masked email address
    const emailParts = targetEmail.split('@');
    const prefix = emailParts[0];
    const maskedPrefix = prefix.length > 3 ? prefix.slice(0, 3) + '*******' : prefix.slice(0, 1) + '*******';
    const maskedEmail = maskedPrefix + '@' + emailParts[1];
    
    // SECURITY: Never return the OTP in the response — even if email fails
    return res.json({
      success: true,
      email: maskedEmail,
      phone: maskedEmail, // Maintain compatibility if frontend utilizes 'phone' variable
      simulated: !emailSent,
      message: emailSent
        ? `OTP successfully sent to your registered email ${maskedEmail}`
        : `OTP delivery failed. Please check your email configuration or contact admin.`
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

    // 3. Enforce code equivalence (real live database check) — NO master OTP bypass
    if (otp !== record.value) {
      return res.status(400).json({ error: 'Invalid verification OTP code' });
    }

    // 4. Verification successful: Clean up the database record
    await prisma.verification.delete({ where: { id: record.id } });

    // 5. Retrieve the full verified user details from database
    let user = await prisma.user.findUnique({
      where: { employeeCode: code.toUpperCase() }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { employeeCode: { equals: code, mode: 'insensitive' } },
            { email: { startsWith: code.toLowerCase() } }
          ]
        }
      });
    }

    if (!user) {
      return res.status(400).json({ error: 'Verified system user record not found' });
    }

    // 6. Generate the authenticated JWT session with full identity
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, code: user.employeeCode, organizationId: (user as any).organizationId || undefined },
      JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    res.json({
      user: {
        id: user.id,
        code: user.employeeCode,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        image: user.image
      },
      token
    });

  } catch (error: any) {
    console.error('Error verifying team OTP:', error.message || error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
};

/**
 * SECURITY: teamLogin is a legacy passwordless endpoint.
 * Strictly disabled in production (must use OTP verification via /team-send-otp & /team-verify-otp).
 * Allowed only in development/test environments for local/automated test harnesses.
 */
export const teamLogin = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Passwordless team login is disabled in production. Please authenticate using OTP verification.'
    });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    return res.status(400).json({ error: 'Valid employee code is required' });
  }

  const detectRole = (c: string) => {
    const upper = c.toUpperCase();
    if (upper.startsWith('ADMIN')) return 'admin';
    if (upper.startsWith('OPS')) return 'operations';
    if (upper.startsWith('SALES') || upper.startsWith('KC')) return 'sales';
    if (upper.startsWith('MKT')) return 'marketing';
    if (upper.startsWith('FIN')) return 'finance';
    return null;
  };

  const role = detectRole(code);
  if (!role) {
    return res.status(400).json({ error: 'Invalid employee code' });
  }

  let dbUser = await prisma.user.findFirst({
    where: { employeeCode: code.toUpperCase() }
  });

  if (!dbUser) {
    const defaultEmail = `${code.toLowerCase()}@thekashmircurators.com`;
    dbUser = await prisma.user.upsert({
      where: { email: defaultEmail },
      update: { employeeCode: code.toUpperCase(), role },
      create: {
        email: defaultEmail,
        employeeCode: code.toUpperCase(),
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} ${code.slice(-3)}`,
        role
      }
    });
  }

  const token = jwt.sign(
    { id: dbUser.id, email: dbUser.email, role: dbUser.role, code: dbUser.employeeCode },
    JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );

  res.json({
    user: {
      id: dbUser.id,
      code: dbUser.employeeCode,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      image: dbUser.image,
      role: dbUser.role
    },
    token
  });
};

export const updateProfile = async (req: any, res: Response) => {
  const { name, email, phone, image, password, uploadedDocuments } = req.body;
  const rawUserId = req.user?.id;
  const userCode = req.user?.code;
  const userEmail = req.user?.email;

  try {
    // 1. Resolve actual user in DB:
    let currentUser: any = null;
    if (rawUserId && !rawUserId.startsWith('system-')) {
      currentUser = await prisma.user.findUnique({ where: { id: rawUserId } });
    }
    if (!currentUser && userCode) {
      currentUser = await prisma.user.findUnique({ where: { employeeCode: userCode.toUpperCase() } });
    }
    if (!currentUser && userEmail) {
      currentUser = await prisma.user.findUnique({ where: { email: userEmail } });
    }
    if (!currentUser && rawUserId && rawUserId.startsWith('system-')) {
      const extractedCode = rawUserId.replace('system-', '').toUpperCase();
      currentUser = await prisma.user.findUnique({ where: { employeeCode: extractedCode } });
    }

    // SECURITY: If user cannot be resolved, reject — never auto-create with admin role
    if (!currentUser) {
      return res.status(404).json({ error: 'User account not found. Cannot update profile for unregistered user.' });
    }

    const userId = currentUser.id;

    // 2. Check if the new email belongs to a DIFFERENT user account
    if (email && email.trim()) {
      const trimmedEmail = email.trim();
      const existing = await prisma.user.findFirst({
        where: { 
          email: { equals: trimmedEmail, mode: 'insensitive' },
          NOT: { id: userId }
        }
      });

      // If an existing record is found, ensure it is truly a separate conflicting user
      if (existing && existing.id !== userId && existing.employeeCode !== currentUser.employeeCode) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email.trim();
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (image !== undefined) dataToUpdate.image = image;
    if (uploadedDocuments !== undefined) dataToUpdate.uploadedDocuments = uploadedDocuments ? String(uploadedDocuments) : null;
    if (req.body.isOnline !== undefined) {
      dataToUpdate.isOnline = req.body.isOnline;
      await prisma.driverProfile.updateMany({
        where: { userId },
        data: { status: req.body.isOnline ? 'AVAILABLE' : 'OFFLINE' }
      });
    }
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
        id: updatedUser.id,
        code: updatedUser.employeeCode,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        image: updatedUser.image,
        uploadedDocuments: updatedUser.uploadedDocuments
      }
    });
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

/**
 * SECURITY: googleLogin now requires a valid Google credential token.
 * It verifies the token server-side before minting a JWT.
 * Plain { email, name } payloads are NO LONGER accepted.
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { credentialToken, accessToken, email: rawEmail, name: rawName, image } = req.body;

  // Require at least one verifiable Google token
  if (!credentialToken && !accessToken) {
    return res.status(400).json({ error: 'A valid Google credential token or access token is required.' });
  }

  try {
    let email = '';
    let name = '';
    let picture = '';

    if (accessToken) {
      // Verify via Google UserInfo API
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        return res.status(401).json({ error: 'Invalid Google access token' });
      }
      const data = await response.json();
      email = data.email;
      name = data.name;
      picture = data.picture || '';
    } else {
      // Verify via google-auth-library (ID Token flow)
      const ticket = await googleClient.verifyIdToken({
        idToken: credentialToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'Invalid Google ID token' });
      }
      email = payload.email;
      name = payload.name || rawName || '';
      picture = payload.picture || '';
    }

    if (!email) {
      return res.status(400).json({ error: 'Failed to retrieve email from Google token' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || rawName || email.split('@')[0],
          image: picture || image || null,
          role: 'user'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: (user as any).organizationId || undefined },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone || undefined, image: user.image },
      token
    });
  } catch (error: any) {
    console.error('Google login error:', error.message || error);
    res.status(500).json({ error: 'Google login failed' });
  }
};

export const googleRealtimeLogin = async (req: Request, res: Response) => {
  const { credentialToken, accessToken } = req.body;

  if (!credentialToken && !accessToken) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    let email = '';
    let name = '';
    let picture = '';

    if (accessToken) {
      // 1. Verify via Google UserInfo API (standard token flow)
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        throw new Error('Failed to fetch userinfo from Google');
      }
      const data = await response.json();
      email = data.email;
      name = data.name;
      picture = data.picture || '';
    } else {
      // 2. Verify via google-auth-library (ID Token flow)
      const ticket = await googleClient.verifyIdToken({
        idToken: credentialToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Invalid ID token payload');
      email = payload.email || '';
      name = payload.name || '';
      picture = payload.picture || '';
    }

    if (!email || !name) {
      return res.status(400).json({ error: 'Failed to retrieve user details from Google' });
    }

    // 3. Fetch or create user in database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image: picture || null,
          role: 'user'
        }
      });
    }

    // 4. Issue local JWT session
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: (user as any).organizationId || undefined },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone || undefined, image: user.image },
      token
    });
  } catch (error: any) {
    console.error('Google auth verification failed:', error.message || error);
    res.status(401).json({ error: 'Google authentication verification failed' });
  }
};

