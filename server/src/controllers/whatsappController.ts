import { Request, Response } from 'express';
import { whatsappService, WhatsAppWorkflowEngine } from '../services/whatsappService';
import env from '../config/env';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { realtimeBus } from '../lib/realtimeBus';

/**
 * GET /api/whatsapp
 * Meta Hub Challenge verification webhook endpoint
 */
export const verifyWebhook = async (req: Request, res: Response): Promise<any> => {
  console.log('[WhatsApp Controller: Webhook Verification] Received Meta handshake challenge.');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const configVerifyToken = env.WHATSAPP_VERIFY_TOKEN;

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

  // Run the pipeline asynchronously in the background
  try {
    const socketIo = realtimeBus.getIo((req as any).io);
    await whatsappService.runPipeline(socketIo, req.body);
  } catch (error: any) {
    console.error('[WhatsApp Controller: Inbound Lead] FAILED to process pipeline asynchronously:', error.message);
  }
};

/**
 * GET /api/whatsapp/conversations
 * Retrieve centralized team inbox conversations grouped by phone
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    // Fetch unique phones with recent messages
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        inquiry: {
          select: {
            id: true,
            customerName: true,
            destination: true,
            leadStage: true,
            priority: true
          }
        }
      }
    });

    // Group by customerPhone
    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      if (!conversationMap.has(msg.customerPhone)) {
        conversationMap.set(msg.customerPhone, {
          customerPhone: msg.customerPhone,
          customerName: msg.inquiry?.customerName || msg.senderName || msg.customerPhone,
          inquiryId: msg.inquiryId,
          inquiry: msg.inquiry,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          lastDirection: msg.direction,
          status: msg.status
        });
      }
    }

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve WhatsApp conversations' });
  }
};

/**
 * GET /api/whatsapp/messages/:phone
 * Retrieve full message thread for a customer phone
 */
export const getMessagesByPhone = async (req: AuthRequest, res: Response): Promise<any> => {
  const { phone } = req.params;

  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { customerPhone: phone as string },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    res.json(messages);
  } catch (error) {
    console.error('getMessagesByPhone error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

/**
 * POST /api/whatsapp/send
 * Agent dispatches human-approved message directly to customer
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  const { phone, content, inquiryId } = req.body;

  if (!phone || !content) {
    return res.status(400).json({ error: 'phone and content are required' });
  }

  try {
    const agentName = req.user?.name || req.user?.email || 'Travel Specialist';
    const agentId = req.user?.id || null;

    // 1. Deliver message via WhatsApp Engine
    const delivered = await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(phone, content);

    // 2. Persist to WhatsAppMessage table
    const [savedMessage] = await prisma.$transaction([
      prisma.whatsAppMessage.create({
        data: {
          customerPhone: phone,
          direction: 'OUTBOUND',
          content,
          inquiryId: inquiryId || null,
          senderId: agentId,
          senderName: agentName,
          status: delivered ? 'SENT' : 'FAILED'
        }
      }),
      ...(inquiryId ? [
        prisma.leadActivity.create({
          data: {
            inquiryId,
            type: 'WHATSAPP_SENT',
            title: `WhatsApp message sent by ${agentName}`,
            description: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
            performedBy: agentName
          }
        }),
        prisma.inquiry.update({
          where: { id: inquiryId },
          data: { lastContactedAt: new Date() }
        })
      ] : [])
    ]);

    // Broadcast message via tenant-scoped RealtimeBus
    let tenantId: string | null = (req as any).tenantId || null;
    if (!tenantId && inquiryId) {
      const inqOrg = await prisma.inquiry
        .findUnique({ where: { id: inquiryId }, select: { organizationId: true } })
        .catch(() => null);
      tenantId = (inqOrg as any)?.organizationId || null;
    }
    realtimeBus.publish('whatsapp-message-sent', savedMessage, {
      io: realtimeBus.getIo((req as any).io),
      tenantId,
    });

    res.status(201).json({ success: true, message: savedMessage });
  } catch (error: any) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
};

/**
 * POST /api/whatsapp/send-template
 * Send pre-approved Meta WhatsApp template (Itinerary Proposal, Payment Request, Voucher)
 */
export const sendTemplateMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  const { phone, templateType, inquiryId, customData } = req.body;

  if (!phone || !templateType) {
    return res.status(400).json({ error: 'phone and templateType are required' });
  }

  try {
    let inquiry: any = null;
    if (inquiryId) {
      inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    }

    const customerName = inquiry?.customerName || customData?.name || 'Valued Traveler';
    const destination = inquiry?.destination || customData?.destination || 'Kashmir';
    let bodyText = '';

    switch (templateType) {
      case 'PROPOSAL_DISPATCH':
        bodyText = `Hello *${customerName}*! 🏔️\n\nYour customized Kashmir itinerary proposal for *${destination}* is ready!\n\n✨ View interactive proposal:\nhttps://kashmir-curators.vercel.app/itinerary/${inquiryId || ''}\n\nOur concierge is standing by to answer your questions!`;
        break;

      case 'PAYMENT_REQUEST':
        bodyText = `Hello *${customerName}*! 💳\n\nTo lock in your VIP hotel allotments and private 4x4 cab for *${destination}*, please complete your advance deposit securely:\n\n🔗 https://kashmir-curators.vercel.app/payment-request/${customData?.paymentId || inquiryId}\n\nReceipt and booking confirmation are issued immediately upon payment.`;
        break;

      case 'BOOKING_CONFIRMATION':
        bodyText = `🎉 *Booking Confirmed!* 🎉\n\nDear *${customerName}*, your trip to *${destination}* is officially confirmed!\n\nYour confirmed hotel vouchers and cab details are accessible at:\nhttps://kashmir-curators.vercel.app/itinerary/${inquiryId}\n\nWelcome to Kashmir! ✨`;
        break;

      default:
        bodyText = `Hello *${customerName}*, greetings from Kashmir Curators regarding your trip to *${destination}*.`;
    }

    const agentName = req.user?.name || req.user?.email || 'Operations Desk';

    await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(phone, bodyText);

    const messageRecord = await prisma.whatsAppMessage.create({
      data: {
        customerPhone: phone,
        direction: 'OUTBOUND',
        messageType: 'template',
        templateName: templateType,
        content: bodyText,
        inquiryId: inquiryId || null,
        senderId: req.user?.id || null,
        senderName: agentName,
        status: 'SENT'
      }
    });

    if (inquiryId) {
      await prisma.leadActivity.create({
        data: {
          inquiryId,
          type: 'TEMPLATE_DISPATCHED',
          title: `Meta Template (${templateType}) sent to ${customerName}`,
          description: `Dispatched by ${agentName}`,
          performedBy: agentName
        }
      });
    }

    res.json({ success: true, message: messageRecord });
  } catch (error: any) {
    console.error('sendTemplateMessage error:', error);
    res.status(500).json({ error: 'Failed to dispatch template message' });
  }
};
