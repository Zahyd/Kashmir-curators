import { Response } from 'express';

export interface DriverSseClient {
  id: string;
  res: Response;
  userId: string;
  role: string;
  driverProfileId?: string | null;
  tenantId?: string | null;
}

const sseClients = new Set<DriverSseClient>();

export function addDriverSseClient(client: DriverSseClient): () => void {
  sseClients.add(client);
  return () => {
    sseClients.delete(client);
  };
}

export function getDriverSseClientCount(): number {
  return sseClients.size;
}

export interface DriverEventTarget {
  targetUserIds?: string[];
  targetDriverProfileIds?: string[];
  includeStaff?: boolean;
  tenantId?: string | null;
}

/**
 * Broadcasts an SSE message using unnamed default `data:` JSON frames carrying `{ type, ...payload }`
 * so browser `EventSource.onmessage` reliably receives every event, while filtering strictly by recipient.
 */
export function broadcastDriverEvent(
  eventType: string,
  payload: Record<string, unknown>,
  target?: DriverEventTarget
) {
  const envelope = JSON.stringify({
    type: eventType,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  const targetUserSet = target?.targetUserIds ? new Set(target.targetUserIds.filter(Boolean)) : null;
  const targetProfileSet = target?.targetDriverProfileIds
    ? new Set(target.targetDriverProfileIds.filter(Boolean))
    : null;
  const includeStaff = target?.includeStaff ?? true;

  for (const client of sseClients) {
    try {
      const role = String(client.role || '').toLowerCase();
      const isStaff = role === 'admin' || role === 'operations';

      if (targetUserSet || targetProfileSet) {
        const matchesUser = targetUserSet ? targetUserSet.has(client.userId) : false;
        const matchesProfile =
          targetProfileSet && client.driverProfileId
            ? targetProfileSet.has(client.driverProfileId)
            : false;
        const matchesStaff = includeStaff && isStaff;

        if (!matchesUser && !matchesProfile && !matchesStaff) {
          continue;
        }
      }

      if (
        target?.tenantId &&
        client.tenantId &&
        client.tenantId !== target.tenantId &&
        role !== 'admin'
      ) {
        continue;
      }

      client.res.write(`data: ${envelope}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}
