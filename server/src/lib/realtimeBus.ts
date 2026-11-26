import { EventEmitter } from 'events';
import { Response } from 'express';
import { DEFAULT_TENANT_ID } from './tenant';

export interface RealtimeTargetOptions {
  io?: any;
  tenantId?: string | null;
  userIds?: string[];
  rooms?: string[];
  includeAdminRoom?: boolean;
  includeSalesRoom?: boolean;
  instanceId?: string;
}

export interface SalesSseClient {
  id: string;
  res: Response;
  userId: string;
  employeeCode?: string;
  role: string;
  tenantId: string | null;
}

const INSTANCE_ID = `node-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const REDIS_CHANNEL = 'kc:sales:realtime:v2';

class RealtimeBus extends EventEmitter {
  private ioInstance: any = null;
  private sseClients: Map<string, SalesSseClient> = new Map();
  private redisPub: any = null;
  private redisSub: any = null;
  private redisMode: 'REDIS_PUBSUB' | 'IN_MEMORY_SINGLE_NODE' = 'IN_MEMORY_SINGLE_NODE';
  private onlineUsers: Map<string, { userId: string; employeeCode?: string; name?: string; role: string; tenantId: string | null; socketCount: number; lastSeenAt: string }> = new Map();

  public setIo(io: any) {
    this.ioInstance = io;
  }

  public getIo(override?: any): any {
    return override || this.ioInstance;
  }

  public getInstanceId(): string {
    return INSTANCE_ID;
  }

  public async initRedisPubSub(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.redisMode = 'IN_MEMORY_SINGLE_NODE';
      return false;
    }

    try {
      // Optional Redis Pub/Sub adapter if redis / ioredis packages are provisioned
      let redisClientModule: any = null;
      try {
        redisClientModule = require('redis');
      } catch {
        try {
          redisClientModule = require('ioredis');
        } catch {
          redisClientModule = null;
        }
      }

      if (!redisClientModule) {
        console.warn('[RealtimeBus] REDIS_URL is set but neither "redis" nor "ioredis" is installed; falling back to single-node bus.');
        this.redisMode = 'IN_MEMORY_SINGLE_NODE';
        return false;
      }

      if (typeof redisClientModule.createClient === 'function') {
        this.redisPub = redisClientModule.createClient({ url: redisUrl });
        this.redisSub = this.redisPub.duplicate();
        await Promise.all([this.redisPub.connect(), this.redisSub.connect()]);

        try {
          const adapterMod = require('@socket.io/redis-adapter');
          if (this.ioInstance && typeof adapterMod?.createAdapter === 'function') {
            this.ioInstance.adapter(adapterMod.createAdapter(this.redisPub, this.redisSub));
          }
        } catch {
          // Use application-level pub/sub bridge below when @socket.io/redis-adapter is absent
        }

        await this.redisSub.subscribe(REDIS_CHANNEL, (raw: string) => {
          this.handleRemotePubSubMessage(raw);
        });
      } else {
        const RedisCtor = redisClientModule.default || redisClientModule;
        this.redisPub = new RedisCtor(redisUrl);
        this.redisSub = new RedisCtor(redisUrl);
        await this.redisSub.subscribe(REDIS_CHANNEL);
        this.redisSub.on('message', (_channel: string, raw: string) => {
          this.handleRemotePubSubMessage(raw);
        });
      }

      this.redisMode = 'REDIS_PUBSUB';
      console.log(`[RealtimeBus] Cross-instance Redis Pub/Sub active (${INSTANCE_ID}).`);
      return true;
    } catch (err: any) {
      console.warn('[RealtimeBus] Redis Pub/Sub initialization failed, using single-node fallback:', err.message);
      this.redisMode = 'IN_MEMORY_SINGLE_NODE';
      return false;
    }
  }

  private handleRemotePubSubMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (!msg || msg.originInstance === INSTANCE_ID) return;
      this.dispatchLocal(msg.event, msg.payload, {
        tenantId: msg.tenantId,
        userIds: msg.userIds,
        rooms: msg.rooms,
        includeAdminRoom: msg.includeAdminRoom,
        includeSalesRoom: msg.includeSalesRoom,
      });
    } catch {
      // Ignore malformed message
    }
  }

  public addSseClient(client: SalesSseClient) {
    this.sseClients.set(client.id, client);
  }

  public removeSseClient(id: string) {
    this.sseClients.delete(id);
  }

  public getSseClientCount(): number {
    return this.sseClients.size;
  }

  public trackSocketConnect(user: { id: string; employeeCode?: string; code?: string; name?: string; role: string; organizationId?: string | null }) {
    const key = String(user.id || user.employeeCode || user.code || '');
    if (!key) return;
    const prev = this.onlineUsers.get(key);
    this.onlineUsers.set(key, {
      userId: String(user.id || key),
      employeeCode: user.employeeCode || user.code,
      name: user.name,
      role: user.role,
      tenantId: user.organizationId || null,
      socketCount: (prev?.socketCount || 0) + 1,
      lastSeenAt: new Date().toISOString(),
    });
  }

  public trackSocketDisconnect(user: { id?: string; employeeCode?: string; code?: string }) {
    const key = String(user?.id || user?.employeeCode || user?.code || '');
    if (!key) return;
    const prev = this.onlineUsers.get(key);
    if (!prev) return;
    if (prev.socketCount <= 1) {
      this.onlineUsers.delete(key);
    } else {
      this.onlineUsers.set(key, {
        ...prev,
        socketCount: prev.socketCount - 1,
        lastSeenAt: new Date().toISOString(),
      });
    }
  }

  public getOnlinePresence(tenantId?: string | null) {
    const list = Array.from(this.onlineUsers.values());
    if (!tenantId) return list;
    return list.filter(
      (item) => !item.tenantId || item.tenantId === tenantId || (tenantId === DEFAULT_TENANT_ID && !item.tenantId)
    );
  }

  public getHealth() {
    return {
      instanceId: INSTANCE_ID,
      pubsubMode: this.redisMode,
      sseClients: this.sseClients.size,
      connectedStaffUsers: this.onlineUsers.size,
    };
  }

  private canSseClientReceive(client: SalesSseClient, targetTenantId?: string | null, targetUserIds?: string[]): boolean {
    const roleLower = String(client.role || '').toLowerCase();
    if (roleLower === 'agent') {
      if (Array.isArray(targetUserIds) && targetUserIds.includes(client.userId)) {
        return true;
      }
      return Boolean(
        client.tenantId &&
        client.tenantId !== DEFAULT_TENANT_ID &&
        targetTenantId === client.tenantId
      );
    }
    if ((roleLower === 'admin' || roleLower === 'operations') && !client.tenantId) {
      return true;
    }
    if (!targetTenantId || targetTenantId === DEFAULT_TENANT_ID) {
      return !client.tenantId || client.tenantId === DEFAULT_TENANT_ID;
    }
    return client.tenantId === targetTenantId;
  }

  /**
   * Dispatches an event locally to scoped Socket.IO rooms and authenticated SSE clients.
   * NEVER uses global io.emit for privileged/CRM data and NEVER leaks non-default tenant events to shared rooms.
   */
  public dispatchLocal(event: string, payload: any, options: RealtimeTargetOptions = {}) {
    const io = this.getIo(options.io);
    const tenantId = options.tenantId !== undefined ? options.tenantId : payload?.organizationId ?? null;
    const isIsolatedTenant = Boolean(tenantId && tenantId !== DEFAULT_TENANT_ID);

    if (io && typeof io.to === 'function') {
      const targetRooms = new Set<string>(options.rooms || []);

      if (options.includeAdminRoom !== false) {
        targetRooms.add('platform-admin-room');
        if (!isIsolatedTenant) {
          targetRooms.add('admin-room');
        }
      }
      if (options.includeSalesRoom !== false && !isIsolatedTenant) {
        targetRooms.add('sales-room');
      }

      const resolvedRoomTenant = tenantId || DEFAULT_TENANT_ID;
      targetRooms.add(`tenant-${resolvedRoomTenant}`);
      if (options.includeSalesRoom !== false) {
        targetRooms.add(`sales-${resolvedRoomTenant}`);
      }

      if (Array.isArray(options.userIds)) {
        for (const uid of options.userIds) {
          if (uid) {
            targetRooms.add(`user-${uid}`);
            targetRooms.add(`agent-${uid}`);
          }
        }
      }

      const roomsList = Array.from(targetRooms);
      if (typeof io.fetchSockets === 'function' && roomsList.length > 0) {
        try {
          io.to(roomsList).emit(event, payload);
        } catch {
          for (const room of roomsList) {
            try {
              io.to(room).emit(event, payload);
            } catch {
              // Ignore individual room dispatch error
            }
          }
        }
      } else {
        for (const room of roomsList) {
          try {
            io.to(room).emit(event, payload);
          } catch {
            // Ignore individual room dispatch error
          }
        }
      }
    }

    // Also deliver to authenticated SSE clients scoped to tenant or direct target users
    const sseFrame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const [clientId, client] of this.sseClients.entries()) {
      if (!this.canSseClientReceive(client, tenantId, options.userIds)) continue;
      try {
        client.res.write(sseFrame);
      } catch {
        this.sseClients.delete(clientId);
      }
    }

    this.emit(event, { payload, tenantId });
  }

  /**
   * Publishes an event locally and across Redis Pub/Sub instances when enabled.
   */
  public publish(event: string, payload: any, options: RealtimeTargetOptions = {}) {
    this.dispatchLocal(event, payload, options);

    if (this.redisPub && this.redisMode === 'REDIS_PUBSUB') {
      const envelope = JSON.stringify({
        originInstance: INSTANCE_ID,
        event,
        payload,
        tenantId: options.tenantId ?? payload?.organizationId ?? null,
        userIds: options.userIds,
        rooms: options.rooms,
        includeAdminRoom: options.includeAdminRoom,
        includeSalesRoom: options.includeSalesRoom,
      });
      Promise.resolve(this.redisPub.publish(REDIS_CHANNEL, envelope)).catch((err: any) => {
        console.warn('[RealtimeBus] Redis publish error:', err?.message);
      });
    }
  }
}

export const realtimeBus = new RealtimeBus();
export default realtimeBus;
