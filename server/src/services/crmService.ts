import prisma from '../lib/prisma';
import { io } from '../index';

export class CRMService {
  /**
   * Automatically routes an inquiry to a sales agent based on active workload capacity
   * and live availability status (Round-Robin).
   */
  public static async assignLeadRoundRobin(inquiryId: string): Promise<any | null> {
    try {
      console.log(`Starting automated Round-Robin lead routing for inquiry ${inquiryId}...`);

      // 1. Find all active sales agents who are currently online
      let availableAgents = await prisma.user.findMany({
        where: {
          role: 'sales',
          isOnline: true
        } as any
      });

      // Fallback: If no sales agents are marked online, fallback to all registered sales agents
      if (availableAgents.length === 0) {
        console.log('No online sales agents found. Falling back to all sales agents...');
        availableAgents = await prisma.user.findMany({
          where: { role: 'sales' }
        });
      }

      if (availableAgents.length === 0) {
        console.log('No sales agents registered in the system. Leaving lead unassigned.');
        return null;
      }

      // 2. Fetch workload stats for each agent (count of active inquiries: status not "Booked" or "Lost")
      const agentWorkloads = await Promise.all(
        availableAgents.map(async (agent) => {
          const activeCount = await prisma.inquiry.count({
            where: {
              assignedTo: agent.email,
              status: {
                notIn: ['Booked', 'Lost']
              }
            }
          });
          return {
            agent,
            activeCount
          };
        })
      );

      // 3. Sort agents by active count (ascending) to pick the one with lightest active workload
      agentWorkloads.sort((a, b) => {
        if (a.activeCount !== b.activeCount) {
          return a.activeCount - b.activeCount;
        }
        // Tie-breaker: choose agent with higher capacity limit
        return (b.agent as any).leadCapacity - (a.agent as any).leadCapacity;
      });

      const chosen = agentWorkloads[0];
      const assignedAgent = chosen.agent;

      console.log(`Routing lead to agent ${assignedAgent.name} (${assignedAgent.email}) with ${chosen.activeCount} active inquiries.`);

      // 4. Update inquiry in the database
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: {
          assignedTo: assignedAgent.email,
          status: 'Pending Curation'
        }
      });

      // 5. Trigger real-time notifications via WebSockets
      if (io) {
        // Notify the specific agent's room if connected
        io.to(`user-${assignedAgent.id}`).emit('lead-assigned', {
          inquiry: updatedInquiry,
          message: `🏔️ New Lead: You have been assigned to ${updatedInquiry.customerName} for ${updatedInquiry.destination}!`
        });

        // Notify Admin workspace system log room
        io.to('admin-room').emit('new-system-event', {
          type: 'LEAD_ASSIGNED',
          inquiry: updatedInquiry,
          message: `Lead auto-routed: ${updatedInquiry.customerName} assigned to Agent ${assignedAgent.name}`
        });
      }

      return assignedAgent;

    } catch (error) {
      console.error('CRM Round-Robin Lead Assignment Error:', error);
      return null;
    }
  }
}
export default CRMService;
