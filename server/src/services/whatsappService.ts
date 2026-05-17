import prisma from '../lib/prisma';
import { googleSheetsService } from './googleSheetsService';
import { notificationService } from './notificationService';

// Conversational States
export type ChatState =
  | 'START'
  | 'AWAITING_NAME'
  | 'AWAITING_EMAIL'
  | 'AWAITING_DESTINATION'
  | 'AWAITING_DURATION'
  | 'AWAITING_TRAVELERS'
  | 'AWAITING_BUDGET'
  | 'AWAITING_ACCOMMODATION'
  | 'COMPLETED';

export interface ChatSession {
  state: ChatState;
  customerName?: string;
  email?: string;
  phone: string;
  destination?: string;
  duration?: string;
  travelers?: string;
  budget?: string;
  accommodation?: string;
}

// Global In-Memory Sessions (Could be replaced with Redis in production)
const sessions = new Map<string, ChatSession>();

/**
 * ============================================================================
 * n8n-style Modular Automation Workflow Node Structure
 * ============================================================================
 */

export class WhatsAppWorkflowEngine {
  
  /**
   * Node 1: Webhook Payload Parser Node (n8n WhatsApp Input Node)
   */
  public static executeWebhookParserNode(payload: any): { sender: string; text: string } {
    console.log('\n[n8n Node: WhatsApp Inbound Parser] Executing...');
    try {
      // 1. Check if it's a Meta Cloud API format
      if (
        payload.entry &&
        payload.entry[0]?.changes &&
        payload.entry[0].changes[0]?.value?.messages
      ) {
        const message = payload.entry[0].changes[0].value.messages[0];
        const sender = message.from; // Phone number
        const text = message.text?.body || '';
        console.log(`[n8n Node: WhatsApp Inbound Parser] Meta API detected. Sender: ${sender}, Message: "${text}"`);
        return { sender, text };
      }
      
      // 2. Fallback / Simulation Local Format (ngrok, Curl, Postman testing)
      if (payload.sender && payload.text) {
        console.log(`[n8n Node: WhatsApp Inbound Parser] Simulation Payload detected. Sender: ${payload.sender}, Message: "${payload.text}"`);
        return { sender: payload.sender, text: payload.text };
      }

      throw new Error('Unsupported WhatsApp payload schema.');
    } catch (error: any) {
      console.error('[n8n Node: WhatsApp Inbound Parser] FAILED:', error.message);
      throw error;
    }
  }

  /**
   * Node 2: Chatbot Session Routing & State Node (n8n Conversational Router Node)
   */
  public static executeChatbotSessionNode(sender: string, text: string): { replyText: string; isComplete: boolean; sessionData: ChatSession } {
    console.log('[n8n Node: Conversational Chatbot Router] Executing...');
    
    // Retrieve or initialize session
    let session = sessions.get(sender);
    if (!session) {
      session = { state: 'START', phone: sender };
      sessions.set(sender, session);
      console.log(`[n8n Node: Conversational Chatbot Router] Initialized new session for sender: ${sender}`);
    }

    let replyText = '';
    let isComplete = false;
    const sanitizedText = text.trim();

    switch (session.state) {
      case 'START':
        session.state = 'AWAITING_NAME';
        replyText = `🏔️ *Welcome to Kashmir Curators!* 🏔️\n\nI am your *Virtual Travel Concierge*. Let's design your dream bespoke holiday in paradise.\n\nTo begin, *what is your full name?*`;
        break;

      case 'AWAITING_NAME':
        session.customerName = sanitizedText;
        session.state = 'AWAITING_EMAIL';
        replyText = `Thank you, *${session.customerName}*! ✨\n\nWhat is your *email address*? (We'll send your luxury proposal here)`;
        break;

      case 'AWAITING_EMAIL':
        // Simple regex check for email
        if (!sanitizedText.includes('@') || !sanitizedText.includes('.')) {
          replyText = `⚠️ That email looks invalid. Please provide a correct *email address* (e.g. name@example.com):`;
        } else {
          session.email = sanitizedText;
          session.state = 'AWAITING_DESTINATION';
          replyText = `Got it! ✉️\n\nWhich *destinations in Kashmir* are you most excited to explore?\n_(e.g. Srinagar, Gulmarg, Pahalgam, Sonamarg, or All of them)_`;
        }
        break;

      case 'AWAITING_DESTINATION':
        session.destination = sanitizedText;
        session.state = 'AWAITING_DURATION';
        replyText = `Wonderful places! 🗺️\n\n*How many days / nights* are you planning to stay in Kashmir? (e.g. 5 Days, 6 Nights)`;
        break;

      case 'AWAITING_DURATION':
        session.duration = sanitizedText;
        session.state = 'AWAITING_TRAVELERS';
        replyText = `Perfect duration. 🗓️\n\n*How many travelers* will be joining you on this journey? (e.g. 2 Adults, 1 Child)`;
        break;

      case 'AWAITING_DURATION' as any: // In case of duplicate keys
      case 'AWAITING_TRAVELERS':
        session.travelers = sanitizedText;
        session.state = 'AWAITING_BUDGET';
        replyText = `Excellent. 👥\n\nWhat is your *estimated budget tier* per person?\n\n🔹 *Standard* (Comfort stay)\n🔹 *Premium* (Bespoke 4-Star & luxury cabs)\n🔹 *Elite Luxury* (High-end 5-Star resorts, luxury houseboats)`;
        break;

      case 'AWAITING_BUDGET':
        session.budget = sanitizedText;
        session.state = 'AWAITING_ACCOMMODATION';
        replyText = `Almost done! 💰\n\nWhat is your preferred *accommodation style*?\n_(e.g. 3-Star Hotels, Luxury Boutique Stays, 5-Star Resorts, Heritage Houseboats)_`;
        break;

      case 'AWAITING_ACCOMMODATION':
        session.accommodation = sanitizedText;
        session.state = 'COMPLETED';
        isComplete = true;
        replyText = `🎉 *Congratulations, ${session.customerName}!* 🎉\n\nYour luxury trip blueprint has been received and synchronized!\n\n🏔️ *Our travel specialists are already curating your custom itinerary.* We will email you your personalized proposal very shortly!\n\nHave a magical day! ✨`;
        break;

      default:
        // If completed or in error, restart session
        session.state = 'AWAITING_NAME';
        replyText = `Let's start over! Let's build a new luxury Kashmir itinerary.\n\n*What is your full name?*`;
        break;
    }

    sessions.set(sender, session);
    console.log(`[n8n Node: Conversational Chatbot Router] SUCCESS: Next State: "${session.state}", Ingestion Complete: ${isComplete}`);
    return { replyText, isComplete, sessionData: session };
  }

  /**
   * Node 3: CRM Database Ingestion Node (n8n Database Node)
   */
  public static async executeCRMNode(io: any, sessionData: ChatSession): Promise<any> {
    console.log('[n8n Node: CRM Ingestion] Executing...');
    try {
      const p = prisma as any;
      const inquiry = await p.inquiry.create({
        data: {
          customerName: sessionData.customerName || 'WhatsApp Lead',
          email: sessionData.email || 'no-email@whatsapp.com',
          phone: sessionData.phone,
          destination: sessionData.destination || 'Kashmir',
          duration: sessionData.duration || '6 Days',
          travelers: sessionData.travelers || '2',
          budget: sessionData.budget || 'Premium',
          accommodation: sessionData.accommodation || 'Luxury Resort',
          status: 'New'
        }
      });

      // Broadcast lead creation via WebSockets to open Admin CMS Panels in real-time
      if (io) {
        notificationService.emitSystemEvent(
          io,
          'CREATE',
          `New WhatsApp Lead: ${inquiry.customerName} interested in ${inquiry.destination}`,
          { ...inquiry, entityType: 'inquiry' }
        );
      }

      console.log(`[n8n Node: CRM Ingestion] SUCCESS: Created lead ID ${inquiry.id} inside DB.`);
      return inquiry;
    } catch (error: any) {
      console.error('[n8n Node: CRM Ingestion] FAILED:', error.message);
      throw error;
    }
  }

  /**
   * Node 4: Email Notification Dispatcher Node (n8n Email Node)
   */
  public static async executeNotificationEmailNode(inquiry: any): Promise<boolean> {
    console.log('[n8n Node: Email Notification] Executing...');
    try {
      const subject = "Your Kashmir Curators WhatsApp Request is Received!";
      const html = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color: #b5852a;">Hello ${inquiry.customerName},</h2>
          <p>Thank you for initiating your trip request to <strong>Kashmir Curators</strong> via WhatsApp!</p>
          <p>Our luxury travel experts have received your details for <strong>${inquiry.destination}</strong> and are currently curating your bespoke itinerary.</p>
          <p>We will email you your personalized proposal very shortly.</p>
          <br/>
          <p>Warm Regards,<br/><strong>The Kashmir Curators Team</strong></p>
        </div>
      `;
      const sent = await notificationService.sendCustomerEmail(inquiry.email, subject, html);
      console.log(`[n8n Node: Email Notification] SUCCESS: Sent confirmation to ${inquiry.email}`);
      return sent;
    } catch (error: any) {
      console.error('[n8n Node: Email Notification] FAILED gracefully:', error.message);
      return false;
    }
  }

  /**
   * Node 5: Google Sheets Sync Node (n8n Google Sheets Node)
   */
  public static async executeGoogleSheetsSyncNode(inquiry: any): Promise<boolean> {
    console.log('[n8n Node: Google Sheets Sync] Executing...');
    try {
      const success = await googleSheetsService.appendLeadToSheet(inquiry);
      console.log(`[n8n Node: Google Sheets Sync] SUCCESS: Ingestion synchronized to spreadsheet.`);
      return success;
    } catch (error: any) {
      console.error('[n8n Node: Google Sheets Sync] FAILED gracefully:', error.message);
      return false;
    }
  }

  /**
   * Node 6: WhatsApp Outbound Message Node (n8n Outbound Node)
   */
  public static async executeWhatsAppSenderNode(to: string, replyText: string): Promise<boolean> {
    console.log('[n8n Node: WhatsApp Message Dispatcher] Executing...');
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      console.log(`\n======================================================`);
      console.log(`📲 [WhatsApp Simulator] OUTBOUND RESPONSE TO: ${to}`);
      console.log(`💬 Message:\n${replyText}`);
      console.log(`======================================================\n`);
      console.log(`[n8n Node: WhatsApp Message Dispatcher] Mode: SIMULATION (Meta tokens missing in .env).`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: replyText }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error! Status: ${response.status}`);
      }

      console.log(`[n8n Node: WhatsApp Message Dispatcher] SUCCESS: Message delivered successfully to Meta APIs.`);
      return true;
    } catch (error: any) {
      console.error(`[n8n Node: WhatsApp Message Dispatcher] FAILED Meta Delivery:`, error.message);
      return false;
    }
  }
}

/**
 * ============================================================================
 * Primary WhatsApp Automation Orchestration Pipeline (n8n Pipeline Executor)
 * ============================================================================
 */
export const whatsappService = {
  
  async runPipeline(io: any, payload: any): Promise<boolean> {
    console.log('\n🌟 [n8n Automation Pipeline: START] Received incoming trigger.');
    try {
      // 1. Parse Inbound Message
      const { sender, text } = WhatsAppWorkflowEngine.executeWebhookParserNode(payload);
      if (!sender) {
        throw new Error('Inbound parser node yielded no sender identifier.');
      }

      // 2. Route Conversational Chatbot State Machine
      const { replyText, isComplete, sessionData } = WhatsAppWorkflowEngine.executeChatbotSessionNode(sender, text);

      // 3. If questionnaire is fully completed, sync CRM, Email, and Google Sheets
      if (isComplete) {
        console.log('\n🏁 [n8n Branch: Form Fully Completed] Initiating downstream integrations...');
        
        // CRM Creation Node
        const inquiry = await WhatsAppWorkflowEngine.executeCRMNode(io, sessionData);

        // Async Non-blocking Downstream triggers
        WhatsAppWorkflowEngine.executeNotificationEmailNode(inquiry);
        WhatsAppWorkflowEngine.executeGoogleSheetsSyncNode(inquiry);

        // Reset the state machine session for this user so they can start fresh next time
        sessions.delete(sender);
        console.log(`[n8n Branch: Form Fully Completed] Reset session database for ${sender}.`);
      }

      // 4. Send the conversational chatbot text back to WhatsApp
      await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(sender, replyText);

      console.log('🌟 [n8n Automation Pipeline: DONE] Execution finished successfully.');
      return true;
    } catch (err: any) {
      console.error('🌟 [n8n Automation Pipeline: ABORTED] Workflow crashed:', err.message);
      return false;
    }
  }
};
