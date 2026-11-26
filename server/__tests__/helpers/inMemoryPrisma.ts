import { randomUUID } from 'crypto';

type Row = Record<string, any>;

const DEFAULT_TIMESTAMPS = new Set([
  'organization',
  'user',
  'package',
  'hotel',
  'cab',
  'booking',
  'inquiry',
  'leadNote',
  'followUpReminder',
  'cabReservation',
  'blogPost',
  'seasonalCampaign',
  'session',
  'account',
  'verification',
  'siteContent',
  'curator',
  'travelAdvisory',
  'packageReview',
  'hotelReservation',
  'emailDispatchRecord',
  'agencyApplication',
  'driverProfile',
  'notification',
  'roomCategory',
  'hotelRoom',
  'seasonalRate',
  'maintenanceRequest',
  'vendorSettlement',
  'housekeepingTask',
  'winterOpsLog',
  'hotelReview',
  'disruptionImpact',
  'bookingProtectionPolicy',
  'vendorListing',
  'wallet',
  'tripSafetyCard',
  'portalAccessKey',
  'employeeAttendance',
  'employeeSession',
  'customerSearchIntent',
  'inquiryDocument',
]);

const CREATED_AT_ONLY = new Set([
  'testimonial',
  'fAQ',
  'leadActivity',
  'whatsAppMessage',
  'media',
  'transactionLedger',
  'inboundEmailLog',
  'aiAgentActionLog',
  'auditLog',
  'walletTransaction',
]);

const MODEL_NAMES = [
  'organization',
  'user',
  'package',
  'hotel',
  'cab',
  'testimonial',
  'fAQ',
  'booking',
  'inquiry',
  'leadActivity',
  'leadNote',
  'followUpReminder',
  'whatsAppMessage',
  'cabReservation',
  'media',
  'transactionLedger',
  'blogPost',
  'seasonalCampaign',
  'session',
  'account',
  'verification',
  'siteContent',
  'curator',
  'travelAdvisory',
  'packageReview',
  'hotelReservation',
  'emailDispatchRecord',
  'inboundEmailLog',
  'aiAgentActionLog',
  'agentProfile',
  'agencyApplication',
  'driverProfile',
  'supplier',
  'auditLog',
  'notification',
  'roomCategory',
  'hotelRoom',
  'seasonalRate',
  'maintenanceRequest',
  'vendorSettlement',
  'housekeepingTask',
  'winterOpsLog',
  'hotelReview',
  'disruptionImpact',
  'bookingProtectionPolicy',
  'vendorListing',
  'wallet',
  'walletTransaction',
  'tripSafetyCard',
  'portalAccessKey',
  'employeeAttendance',
  'employeeSession',
  'customerSearchIntent',
  'inquiryDocument',
] as const;

type ModelName = (typeof MODEL_NAMES)[number];

function clone<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (val instanceof Date) return new Date(val.getTime()) as unknown as T;
  if (Array.isArray(val)) return val.map(clone) as unknown as T;
  if (typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val as Record<string, any>)) {
      out[k] = clone(v);
    }
    return out as T;
  }
  return val;
}

function toComparable(v: any): any {
  if (v instanceof Date) return v.getTime();
  return v;
}

export function createInMemoryPrisma() {
  const db: Record<string, Row[]> = {};
  for (const m of MODEL_NAMES) {
    db[m] = [];
  }

  function resolveRelation(model: ModelName, row: Row, relName: string): any {
    switch (`${model}.${relName}`) {
      case 'user.driverProfile':
        return db.driverProfile.find((d) => d.userId === row.id) || null;
      case 'user.agentProfile':
        return db.agentProfile.find((a) => a.userId === row.id) || null;
      case 'user.supplierProfile':
        return db.supplier.find((s) => s.userId === row.id) || null;
      case 'user.organization':
        return db.organization.find((o) => o.id === row.organizationId) || null;
      case 'session.user':
        return db.user.find((u) => u.id === row.userId) || null;
      case 'driverProfile.user':
        return db.user.find((u) => u.id === row.userId) || null;
      case 'booking.user':
        return db.user.find((u) => u.id === row.userId) || null;
      case 'hotelRoom.category':
        return db.roomCategory.find((c) => c.id === row.categoryId) || null;
      case 'hotelRoom.hotel':
        return db.hotel.find((h) => h.id === row.hotelId) || null;
      case 'seasonalRate.category':
        return db.roomCategory.find((c) => c.id === row.categoryId) || null;
      case 'hotelReservation.hotel':
        return db.hotel.find((h) => h.id === row.hotelId) || null;
      case 'hotelReservation.inquiry':
        return row.inquiryId ? db.inquiry.find((i) => i.id === row.inquiryId) || null : null;
      case 'hotelReservation.emailDispatches':
        return db.emailDispatchRecord.filter((e) => e.reservationId === row.id);
      case 'cabReservation.inquiry':
        return row.inquiryId ? db.inquiry.find((i) => i.id === row.inquiryId) || null : null;
      case 'cabReservation.cab':
        return db.cab.find((c) => c.id === row.cabId) || null;
      case 'inquiry.user':
        return row.userId ? db.user.find((u) => u.id === row.userId) || null : null;
      case 'inquiry.activities':
        return db.leadActivity.filter((a) => a.inquiryId === row.id);
      case 'leadActivity.inquiry':
        return row.inquiryId ? db.inquiry.find((i) => i.id === row.inquiryId) || null : null;
      case 'inquiryDocument.inquiry':
        return row.inquiryId ? db.inquiry.find((i) => i.id === row.inquiryId) || null : null;
      case 'inquiry.documents':
        return db.inquiryDocument.filter((d) => d.inquiryId === row.id);
      case 'inquiry.internalNotes':
        return db.leadNote.filter((n) => n.inquiryId === row.id);
      case 'inquiry.reminders':
        return db.followUpReminder.filter((r) => r.inquiryId === row.id);
      case 'inquiry.whatsappMessages':
        return db.whatsAppMessage.filter((w) => w.inquiryId === row.id);
      case 'inquiry.hotelReservations':
        return db.hotelReservation.filter((hr) => hr.inquiryId === row.id);
      case 'inquiry.cabReservations':
        return db.cabReservation.filter((cr) => cr.inquiryId === row.id);
      case 'followUpReminder.inquiry':
        return db.inquiry.find((i) => i.id === row.inquiryId) || null;
      case 'customerSearchIntent.inquiry':
        return row.inquiryId ? db.inquiry.find((i) => i.id === row.inquiryId) || null : null;
      case 'organization.users':
        return db.user.filter((u) => u.organizationId === row.id);
      case 'organization.hotels':
        return db.hotel.filter((h) => h.organizationId === row.id);
      case 'organization.cabs':
        return db.cab.filter((c) => c.organizationId === row.id);
      case 'organization.inquiries':
        return db.inquiry.filter((i) => i.organizationId === row.id);
      case 'organization.bookings':
        return db.booking.filter((b) => b.organizationId === row.id);
      case 'organization.hotelReservations':
        return db.hotelReservation.filter((hr) => hr.organizationId === row.id);
      default:
        return null;
    }
  }

  function matchesWhere(model: ModelName, row: Row, where?: Row): boolean {
    if (!where) return true;
    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue;
      if (key === 'OR') {
        if (Array.isArray(cond) && cond.length > 0 && !cond.some((sub) => matchesWhere(model, row, sub))) {
          return false;
        }
        continue;
      }
      if (key === 'AND') {
        if (Array.isArray(cond) && !cond.every((sub) => matchesWhere(model, row, sub))) {
          return false;
        }
        continue;
      }
      if (key === 'NOT') {
        const list = Array.isArray(cond) ? cond : [cond];
        if (list.some((sub) => matchesWhere(model, row, sub))) {
          return false;
        }
        continue;
      }

      // Compound unique keys like employeeCode_date
      if (key === 'employeeCode_date' && cond && typeof cond === 'object') {
        if (row.employeeCode !== cond.employeeCode || row.date !== cond.date) return false;
        continue;
      }

      const val = row[key];

      // Relation filter (e.g. seasonalRate where { category: { hotelId } })
      if (val === undefined && cond && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond)) {
        const rel = resolveRelation(model, row, key);
        if (rel && !Array.isArray(rel)) {
          const relModel: ModelName =
            key === 'category' ? 'roomCategory' : key === 'hotel' ? 'hotel' : key === 'inquiry' ? 'inquiry' : (key as ModelName);
          if (!matchesWhere(relModel, rel, cond)) return false;
          continue;
        }
      }

      if (cond === null) {
        if (val !== null && val !== undefined) return false;
        continue;
      }

      if (typeof cond === 'object' && !(cond instanceof Date)) {
        const insensitive = cond.mode === 'insensitive';
        if ('equals' in cond) {
          if (insensitive && typeof val === 'string' && typeof cond.equals === 'string') {
            if (val.toLowerCase() !== cond.equals.toLowerCase()) return false;
          } else if (toComparable(val) !== toComparable(cond.equals)) {
            return false;
          }
        }
        if ('not' in cond) {
          if (cond.not === null) {
            if (val === null || val === undefined) return false;
          } else if (toComparable(val) === toComparable(cond.not)) {
            return false;
          }
        }
        if ('in' in cond) {
          if (!Array.isArray(cond.in) || !cond.in.includes(val)) return false;
        }
        if ('notIn' in cond) {
          if (Array.isArray(cond.notIn) && cond.notIn.includes(val)) return false;
        }
        if ('contains' in cond) {
          if (typeof val !== 'string') return false;
          const needle = String(cond.contains);
          if (insensitive) {
            if (!val.toLowerCase().includes(needle.toLowerCase())) return false;
          } else if (!val.includes(needle)) {
            return false;
          }
        }
        if ('startsWith' in cond) {
          if (typeof val !== 'string') return false;
          const needle = String(cond.startsWith);
          if (insensitive) {
            if (!val.toLowerCase().startsWith(needle.toLowerCase())) return false;
          } else if (!val.startsWith(needle)) {
            return false;
          }
        }
        if ('gt' in cond) {
          if (val === null || val === undefined || toComparable(val) <= toComparable(cond.gt)) return false;
        }
        if ('gte' in cond) {
          if (val === null || val === undefined || toComparable(val) < toComparable(cond.gte)) return false;
        }
        if ('lt' in cond) {
          if (val === null || val === undefined || toComparable(val) >= toComparable(cond.lt)) return false;
        }
        if ('lte' in cond) {
          if (val === null || val === undefined || toComparable(val) > toComparable(cond.lte)) return false;
        }
        continue;
      }

      if (toComparable(val) !== toComparable(cond)) return false;
    }
    return true;
  }

  function applyOrderBy(rows: Row[], orderBy?: Row | Row[]): Row[] {
    if (!orderBy) return rows;
    const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const spec of specs) {
        for (const [field, dir] of Object.entries(spec)) {
          const av = toComparable(a[field]);
          const bv = toComparable(b[field]);
          if (av === bv) continue;
          if (av === undefined || av === null) return dir === 'asc' ? -1 : 1;
          if (bv === undefined || bv === null) return dir === 'asc' ? 1 : -1;
          return dir === 'asc' ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
        }
      }
      return 0;
    });
  }

  function applyProjection(model: ModelName, row: Row, args?: { include?: Row; select?: Row }): Row {
    const base = clone(row);
    const include = args?.include;
    const select = args?.select;

    if (select) {
      const out: Row = {};
      for (const [field, spec] of Object.entries(select)) {
        if (!spec) continue;
        if (field === '_count' && typeof spec === 'object' && spec.select) {
          out._count = computeCount(model, row, spec.select);
        } else if (field in base) {
          out[field] = base[field];
        } else {
          const rel = resolveRelation(model, row, field);
          out[field] = projectRelation(rel, spec);
        }
      }
      return out;
    }

    if (include) {
      for (const [relName, spec] of Object.entries(include)) {
        if (!spec) continue;
        if (relName === '_count' && typeof spec === 'object' && spec.select) {
          base._count = computeCount(model, row, spec.select);
        } else {
          const rel = resolveRelation(model, row, relName);
          base[relName] = projectRelation(rel, spec);
        }
      }
    }

    return base;
  }

  function projectRelation(rel: any, spec: any): any {
    if (rel === null || rel === undefined) return rel;
    if (spec === true) return clone(rel);
    if (Array.isArray(rel)) {
      let list = [...rel];
      if (spec.where) {
        // Basic relation filter support
        list = list.filter((item) => matchesWhere('inquiry' as ModelName, item, spec.where));
      }
      if (spec.orderBy) list = applyOrderBy(list, spec.orderBy);
      if (spec.take !== undefined) list = list.slice(0, spec.take);
      return list.map((item) => (spec.select || spec.include ? applyProjection('inquiry', item, spec) : clone(item)));
    }
    if (spec.select || spec.include) {
      return applyProjection('user', rel, spec);
    }
    return clone(rel);
  }

  function computeCount(model: ModelName, row: Row, countSelect: Row): Row {
    const counts: Row = {};
    for (const [relName, spec] of Object.entries(countSelect)) {
      if (!spec) continue;
      const items = resolveRelation(model, row, relName);
      if (!Array.isArray(items)) {
        counts[relName] = 0;
      } else if (typeof spec === 'object' && spec.where) {
        counts[relName] = items.filter((item) => matchesWhere(model, item, spec.where)).length;
      } else {
        counts[relName] = items.length;
      }
    }
    return counts;
  }

  function applyDefaultsAndCreate(model: ModelName, data: Row): Row {
    const now = new Date();
    const record: Row = {
      id: data.id || randomUUID(),
    };

    // Handle nested creates (e.g. user with driverProfile: { create: {...} })
    const nestedAfter: Array<() => void> = [];

    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && 'create' in v) {
        if (model === 'user' && k === 'driverProfile') {
          nestedAfter.push(() => {
            applyDefaultsAndCreate('driverProfile', { ...v.create, userId: record.id });
          });
        }
        continue;
      }
      record[k] = v;
    }

    if (DEFAULT_TIMESTAMPS.has(model)) {
      record.createdAt = record.createdAt || now;
      record.updatedAt = record.updatedAt || now;
    } else if (CREATED_AT_ONLY.has(model)) {
      record.createdAt = record.createdAt || now;
    }

    // Model-specific defaults matching schema.prisma
    if (model === 'user') {
      record.role = record.role ?? 'user';
      record.isOnline = record.isOnline ?? false;
      record.leadCapacity = record.leadCapacity ?? 5;
      record.emailVerified = record.emailVerified ?? false;
    } else if (model === 'organization') {
      record.type = record.type ?? 'AGENCY';
      record.status = record.status ?? 'ACTIVE';
      record.tier = record.tier ?? 'STARTER';
    } else if (model === 'hotel') {
      record.isActive = record.isActive ?? true;
      record.rating = record.rating ?? 0;
      record.reviewCount = record.reviewCount ?? 0;
    } else if (model === 'cab') {
      record.isActive = record.isActive ?? true;
    } else if (model === 'booking') {
      record.status = record.status ?? 'pending';
      record.stage = record.stage ?? 'DRAFT';
    } else if (model === 'inquiry') {
      record.status = record.status ?? 'New';
      record.leadStage = record.leadStage ?? 'NEW_LEAD';
      record.netPrice = record.netPrice ?? 0;
      record.agentMarkup = record.agentMarkup ?? 0;
      record.leadScore = record.leadScore ?? 0;
      record.adultsCount = record.adultsCount ?? 2;
      record.childrenCount = record.childrenCount ?? 0;
      record.profileCompleteness = record.profileCompleteness ?? 25;
    } else if (model === 'hotelReservation') {
      record.roomsCount = record.roomsCount ?? 1;
      record.status = record.status ?? 'Pending';
      record.confirmationStage = record.confirmationStage ?? 'PENDING_RESPONSE';
      record.paymentStatus = record.paymentStatus ?? 'Unpaid';
      record.lifecycleStatus = record.lifecycleStatus ?? 'NEW';
      record.adults = record.adults ?? 2;
      record.children = record.children ?? 0;
      record.guestVoucherDispatched = record.guestVoucherDispatched ?? false;
      record.contractRate = record.contractRate ?? 0;
      record.commissionRate = record.commissionRate ?? 0;
      record.totalAmount = record.totalAmount ?? 0;
      record.profitMargin = record.profitMargin ?? 0;
      record.hotelDues = record.hotelDues ?? 0;
    } else if (model === 'portalAccessKey') {
      record.status = record.status ?? 'ACTIVE';
      record.usageCount = record.usageCount ?? 0;
    } else if (model === 'hotelRoom') {
      record.status = record.status ?? 'AVAILABLE';
      record.operationalStatus = record.operationalStatus ?? 'AVAILABLE_CLEAN';
      record.housekeeping = record.housekeeping ?? 'CLEAN';
      record.bukhariActive = record.bukhariActive ?? false;
      record.electricWarmerActive = record.electricWarmerActive ?? false;
    } else if (model === 'followUpReminder') {
      record.priority = record.priority ?? 'MEDIUM';
      record.status = record.status ?? 'PENDING';
    } else if (model === 'cabReservation') {
      record.status = record.status ?? 'ALLOCATED';
      record.totalCost = record.totalCost ?? 0;
      record.contractRate = record.contractRate ?? 0;
      record.profitMargin = record.profitMargin ?? 0;
    }

    db[model].push(record);
    for (const fn of nestedAfter) fn();
    return record;
  }

  function applyUpdateFields(model: ModelName, row: Row, data: Row): Row {
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)) {
        if ('increment' in v) {
          row[k] = (Number(row[k]) || 0) + Number(v.increment);
          continue;
        }
        if ('decrement' in v) {
          row[k] = (Number(row[k]) || 0) - Number(v.decrement);
          continue;
        }
      }
      row[k] = v;
    }
    if (DEFAULT_TIMESTAMPS.has(model)) {
      row.updatedAt = new Date();
    }
    return row;
  }

  function makeModelDelegate(model: ModelName) {
    return {
      async findUnique(args: { where: Row; include?: Row; select?: Row }) {
        const found = db[model].find((r) => matchesWhere(model, r, args.where));
        return found ? applyProjection(model, found, args) : null;
      },
      async findFirst(args: { where?: Row; orderBy?: Row | Row[]; include?: Row; select?: Row } = {}) {
        let rows = db[model].filter((r) => matchesWhere(model, r, args.where));
        rows = applyOrderBy(rows, args.orderBy);
        return rows[0] ? applyProjection(model, rows[0], args) : null;
      },
      async findMany(args: { where?: Row; orderBy?: Row | Row[]; take?: number; skip?: number; include?: Row; select?: Row } = {}) {
        let rows = db[model].filter((r) => matchesWhere(model, r, args.where));
        rows = applyOrderBy(rows, args.orderBy);
        if (args.skip) rows = rows.slice(args.skip);
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => applyProjection(model, r, args));
      },
      async create(args: { data: Row; include?: Row; select?: Row }) {
        // Check unique constraint for user.email, organization.slug, hotelReservation.idempotencyKey
        if (model === 'user' && args.data.email) {
          if (db.user.some((u) => u.email === args.data.email)) {
            const err: any = new Error('Unique constraint failed on email');
            err.code = 'P2002';
            throw err;
          }
        }
        if (model === 'organization' && args.data.slug) {
          if (db.organization.some((o) => o.slug === args.data.slug)) {
            const err: any = new Error('Unique constraint failed on slug');
            err.code = 'P2002';
            throw err;
          }
        }
        const created = applyDefaultsAndCreate(model, args.data);
        return applyProjection(model, created, args);
      },
      async update(args: { where: Row; data: Row; include?: Row; select?: Row }) {
        const idx = db[model].findIndex((r) => matchesWhere(model, r, args.where));
        if (idx === -1) {
          const err: any = new Error(`Record to update not found in ${model}`);
          err.code = 'P2025';
          throw err;
        }
        const updated = applyUpdateFields(model, db[model][idx], args.data);
        return applyProjection(model, updated, args);
      },
      async updateMany(args: { where?: Row; data: Row }) {
        let count = 0;
        for (const row of db[model]) {
          if (matchesWhere(model, row, args.where)) {
            applyUpdateFields(model, row, args.data);
            count++;
          }
        }
        return { count };
      },
      async upsert(args: { where: Row; update: Row; create: Row; include?: Row; select?: Row }) {
        const existing = db[model].find((r) => matchesWhere(model, r, args.where));
        if (existing) {
          applyUpdateFields(model, existing, args.update);
          return applyProjection(model, existing, args);
        }
        const created = applyDefaultsAndCreate(model, args.create);
        return applyProjection(model, created, args);
      },
      async delete(args: { where: Row }) {
        const idx = db[model].findIndex((r) => matchesWhere(model, r, args.where));
        if (idx === -1) {
          const err: any = new Error(`Record to delete not found in ${model}`);
          err.code = 'P2025';
          throw err;
        }
        const [removed] = db[model].splice(idx, 1);
        return clone(removed);
      },
      async deleteMany(args: { where?: Row } = {}) {
        const before = db[model].length;
        db[model] = db[model].filter((r) => !matchesWhere(model, r, args.where));
        return { count: before - db[model].length };
      },
      async count(args: { where?: Row } = {}) {
        return db[model].filter((r) => matchesWhere(model, r, args.where)).length;
      },
      async aggregate(args: { where?: Row; _sum?: Record<string, boolean> }) {
        const rows = db[model].filter((r) => matchesWhere(model, r, args.where));
        const _sum: Record<string, number | null> = {};
        if (args._sum) {
          for (const [field, enabled] of Object.entries(args._sum)) {
            if (!enabled) continue;
            if (rows.length === 0) {
              _sum[field] = null;
            } else {
              _sum[field] = rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
            }
          }
        }
        return { _sum };
      },
    };
  }

  const client: Record<string, any> = {
    _db: db,
    reset() {
      for (const m of MODEL_NAMES) {
        db[m] = [];
      }
    },
    async $queryRaw() {
      return [{ '?column?': 1 }];
    },
    async $disconnect() {},
    async $transaction(arg: any) {
      if (typeof arg === 'function') {
        // Snapshot for rollback on interactive transaction failure
        const snapshot = clone(db);
        try {
          return await arg(client);
        } catch (err) {
          for (const m of MODEL_NAMES) {
            db[m] = snapshot[m];
          }
          throw err;
        }
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return [];
    },
  };

  for (const m of MODEL_NAMES) {
    client[m] = makeModelDelegate(m);
  }

  return client;
}
