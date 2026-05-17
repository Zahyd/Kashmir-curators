import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';

/**
 * GET /api/whatsapp
 * Meta Hub Challenge verification webhook endpoint
 */
export const verifyWebhook = async (req: Request, res: Response): Promise<any> => {
  console.log('[WhatsApp Controller: Webhook Verification] Received Meta handshake challenge.');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const configVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'kashmir_connect_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === configVerifyToken) {
      console.log('[WhatsApp Controller: Webhook Verification] SUCCESS: Handshake verified successfully.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WhatsApp Controller: Webhook Verification] WARNING: Handshake tokens mismatched.');
      return res.sendStatus(403);
    }
  }
  
  return res.sendStatus(400);
};

/**
 * POST /api/whatsapp
 * Handle inbound WhatsApp messages from customers
 */
export const receiveMessage = async (req: Request, res: Response): Promise<any> => {
  // Acknowledge receipt to Meta instantly so Meta does not keep retrying
  res.status(200).json({ success: true });

  // Run the n8n pipeline asynchronously in the background
  try {
    const io = (req as any).io;
    await whatsappService.runPipeline(io, req.body);
  } catch (error: any) {
    console.error('[WhatsApp Controller: Inbound Lead] FAILED to process pipeline asynchronously:', error.message);
  }
};
