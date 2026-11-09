// ============================================================================
// THE DRK WEDDINGS — RELATIONAL DATABASE & STATE ENGINE (ALL 23 TABLES)
// Provides real persistent CRUD, financial balance recalculation, conflict
// detection, website enquiry ingestion, and audit logging.
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AuditLogRecord,
  BookingRecord,
  ClientRecord,
  DeliverableRecord,
  DocumentRecord,
  EventRecord,
  ExpenseRecord,
  InvoiceRecord,
  LeadActivityRecord,
  LeadRecord,
  LeadStatus,
  MessageTemplateRecord,
  NotificationRecord,
  PackageRecord,
  PackageServiceRecord,
  PaymentRecord,
  PermissionRecord,
  ProjectRecord,
  ProjectWorkflowStage,
  QuotationRecord,
  RoleRecord,
  TaskRecord,
  TeamMemberRecord,
  UserRecord,
} from '../../types/crm';
import {
  buildDefaultPermissions,
  INITIAL_AUDIT_LOGS,
  INITIAL_BOOKINGS,
  INITIAL_CLIENTS,
  INITIAL_DELIVERABLES,
  INITIAL_DOCUMENTS,
  INITIAL_EVENTS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_LEAD_ACTIVITIES,
  INITIAL_LEADS,
  INITIAL_MESSAGE_TEMPLATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PACKAGE_SERVICES,
  INITIAL_PACKAGES,
  INITIAL_PAYMENTS,
  INITIAL_PROJECTS,
  INITIAL_QUOTATIONS,
  INITIAL_ROLES,
  INITIAL_TASKS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_USERS,
} from '../../lib/db/seedData';
import { getTodayKolkataISO } from '../../lib/formatting';
import { useAuth } from './AuthContext';

export interface StudioDatabaseState {
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  users: UserRecord[];
  team_members: TeamMemberRecord[];
  packages: PackageRecord[];
  package_services: PackageServiceRecord[];
  clients: ClientRecord[];
  leads: LeadRecord[];
  lead_activities: LeadActivityRecord[];
  quotations: QuotationRecord[];
  bookings: BookingRecord[];
  events: EventRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  deliverables: DeliverableRecord[];
  documents: DocumentRecord[];
  message_templates: MessageTemplateRecord[];
  notifications: NotificationRecord[];
  audit_logs: AuditLogRecord[];
}

interface WebsiteEnquiryInput {
  customer_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  event_type?: string;
  event_date?: string;
  event_location?: string;
  estimated_budget?: number;
  interested_package_name?: string;
  event_days?: number;
  notes?: string;
}

interface DataContextValue extends StudioDatabaseState {
  // Lead & Enquiry Operations
  addLead: (input: Omit<LeadRecord, 'id' | 'lead_code' | 'created_at' | 'updated_at'>) => {
    ok: boolean;
    lead?: LeadRecord;
    duplicate?: LeadRecord;
  };
  updateLead: (id: string, patch: Partial<LeadRecord>) => void;
  updateLeadStatus: (id: string, status: LeadStatus, note?: string) => void;
  deleteLead: (id: string) => void;
  addLeadActivity: (input: Omit<LeadActivityRecord, 'id' | 'created_at'>) => void;
  convertLeadToClient: (leadId: string) => ClientRecord | null;
  convertLeadToBooking: (leadId: string, advanceAmount?: number) => BookingRecord | null;

  // Website Enquiry Ingestion
  ingestWebsiteEnquiry: (payload: WebsiteEnquiryInput) => {
    lead: LeadRecord;
    duplicateMerged: boolean;
  };

  // Client Operations
  addClient: (input: Omit<ClientRecord, 'id' | 'client_code' | 'created_at' | 'updated_at'>) => ClientRecord;
  updateClient: (id: string, patch: Partial<ClientRecord>) => void;
  deleteClient: (id: string) => void;

  // Booking & Multi-Event Operations
  addBooking: (input: Omit<BookingRecord, 'id' | 'booking_code' | 'created_at' | 'updated_at'>) => BookingRecord;
  updateBooking: (id: string, patch: Partial<BookingRecord>) => void;
  deleteBooking: (id: string) => void;
  addEvent: (input: Omit<EventRecord, 'id' | 'created_at'>) => EventRecord;
  updateEvent: (id: string, patch: Partial<EventRecord>) => void;
  deleteEvent: (id: string) => void;

  // Package & Quotation Operations
  addPackage: (input: Omit<PackageRecord, 'id' | 'package_code' | 'created_at'>) => PackageRecord;
  updatePackage: (id: string, patch: Partial<PackageRecord>) => void;
  deletePackage: (id: string) => void;
  addQuotation: (input: Omit<QuotationRecord, 'id' | 'quotation_number' | 'created_at' | 'updated_at'>) => QuotationRecord;
  updateQuotation: (id: string, patch: Partial<QuotationRecord>) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToBooking: (quotationId: string, advancePaid?: number) => BookingRecord | null;

  // Invoice & Immutable Payment Ledger Operations
  addInvoice: (input: Omit<InvoiceRecord, 'id' | 'invoice_number' | 'created_at'>) => InvoiceRecord;
  updateInvoice: (id: string, patch: Partial<InvoiceRecord>) => void;
  recordPayment: (input: {
    booking_id: string;
    invoice_id?: string;
    amount: number;
    payment_type: 'Advance' | 'Partial' | 'Final';
    payment_date: string;
    payment_method: PaymentRecord['payment_method'];
    transaction_reference: string;
    notes: string;
  }) => PaymentRecord | null;
  voidPayment: (paymentId: string, reason: string) => void;

  // Expense Operations
  addExpense: (input: Omit<ExpenseRecord, 'id' | 'expense_code' | 'created_at'>) => ExpenseRecord;
  updateExpense: (id: string, patch: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;

  // Team & RBAC Operations
  addTeamMember: (input: Omit<TeamMemberRecord, 'id' | 'member_code' | 'created_at'>) => TeamMemberRecord;
  updateTeamMember: (id: string, patch: Partial<TeamMemberRecord>) => void;
  deleteTeamMember: (id: string) => void;
  updatePermission: (permissionId: string, patch: Partial<PermissionRecord>) => void;

  // Project & Parallel Task Operations
  updateProjectStage: (projectId: string, stage: ProjectWorkflowStage, notes?: string) => void;
  updateProject: (projectId: string, patch: Partial<ProjectRecord>) => void;
  addTask: (input: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>) => TaskRecord;
  updateTask: (id: string, patch: Partial<TaskRecord>) => void;
  deleteTask: (id: string) => void;

  // Deliverables & Documents Operations
  addDeliverable: (input: Omit<DeliverableRecord, 'id' | 'deliverable_code' | 'created_at'>) => DeliverableRecord;
  updateDeliverable: (id: string, patch: Partial<DeliverableRecord>) => void;
  deleteDeliverable: (id: string) => void;
  addDocument: (input: Omit<DocumentRecord, 'id' | 'document_code' | 'created_at'>) => DocumentRecord;
  deleteDocument: (id: string) => void;

  // WhatsApp Templates & Notifications
  addMessageTemplate: (input: Omit<MessageTemplateRecord, 'id' | 'created_at'>) => MessageTemplateRecord;
  updateMessageTemplate: (id: string, patch: Partial<MessageTemplateRecord>) => void;
  deleteMessageTemplate: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Database Backup, Reset & Restore
  exportDatabaseBackupJSON: () => string;
  importDatabaseBackupJSON: (jsonStr: string) => { ok: boolean; error?: string };
  resetToInitialStudioData: () => void;
}

const STORAGE_DB_KEY = 'the_drk_weddings_crm_db_v1';

function buildInitialDatabase(): StudioDatabaseState {
  return {
    roles: INITIAL_ROLES,
    permissions: buildDefaultPermissions(),
    users: INITIAL_USERS,
    team_members: INITIAL_TEAM_MEMBERS,
    packages: INITIAL_PACKAGES,
    package_services: INITIAL_PACKAGE_SERVICES,
    clients: INITIAL_CLIENTS,
    leads: INITIAL_LEADS,
    lead_activities: INITIAL_LEAD_ACTIVITIES,
    quotations: INITIAL_QUOTATIONS,
    bookings: INITIAL_BOOKINGS,
    events: INITIAL_EVENTS,
    invoices: INITIAL_INVOICES,
    payments: INITIAL_PAYMENTS,
    expenses: INITIAL_EXPENSES,
    projects: INITIAL_PROJECTS,
    tasks: INITIAL_TASKS,
    deliverables: INITIAL_DELIVERABLES,
    documents: INITIAL_DOCUMENTS,
    message_templates: INITIAL_MESSAGE_TEMPLATES,
    notifications: INITIAL_NOTIFICATIONS,
    audit_logs: INITIAL_AUDIT_LOGS,
  };
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [db, setDb] = useState<StudioDatabaseState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StudioDatabaseState>;
        const init = buildInitialDatabase();
        return {
          ...init,
          ...parsed,
        };
      }
    } catch {
      // Fallback to initial seed state
    }
    const fresh = buildInitialDatabase();
    try {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore quota errors
    }
    return fresh;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage errors
    }
  }, [db]);

  const appendAudit = useCallback(
    (
      action: AuditLogRecord['action'],
      module: string,
      entity_id: string,
      description: string,
      metadata?: Record<string, unknown>
    ): AuditLogRecord => ({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_name: currentUser?.full_name ?? 'Deepak Raj (Owner)',
      actor_role: currentUser?.role_name ?? 'Owner',
      action,
      module,
      entity_id,
      description,
      metadata,
      created_at: new Date().toISOString(),
    }),
    [currentUser]
  );

  // ---------------------------------------------------------------------------
  // LEADS & ENQUIRIES
  // ---------------------------------------------------------------------------
  const addLead = useCallback(
    (input: Omit<LeadRecord, 'id' | 'lead_code' | 'created_at' | 'updated_at'>) => {
      const cleanPhone = input.phone.replace(/\D/g, '').slice(-10);
      const duplicate = db.leads.find(
        (l) =>
          cleanPhone.length >= 10 &&
          l.phone.replace(/\D/g, '').slice(-10) === cleanPhone &&
          l.status !== 'Lost'
      );
      if (duplicate) {
        return { ok: false, duplicate };
      }

      const nextNum = 1001 + db.leads.length;
      const now = new Date().toISOString();
      const newLead: LeadRecord = {
        ...input,
        id: `lead-${Date.now()}`,
        lead_code: `DRK-LD-${nextNum}`,
        created_at: now,
        updated_at: now,
      };

      const act: LeadActivityRecord = {
        id: `la-${Date.now()}`,
        lead_id: newLead.id,
        activity_type: 'Note',
        summary: `Lead created via ${newLead.enquiry_source}`,
        details: newLead.notes || `Interested in ${newLead.interested_package_name}`,
        performed_by: currentUser?.full_name ?? 'Owner',
        created_at: now,
      };

      const audit = appendAudit(
        'CREATE',
        'leads',
        newLead.id,
        `Added new lead ${newLead.lead_code} (${newLead.customer_name}) from ${newLead.enquiry_source}.`
      );

      setDb((prev) => ({
        ...prev,
        leads: [newLead, ...prev.leads],
        lead_activities: [act, ...prev.lead_activities],
        audit_logs: [audit, ...prev.audit_logs],
      }));

      return { ok: true, lead: newLead };
    },
    [db.leads, currentUser, appendAudit]
  );

  const updateLead = useCallback(
    (id: string, patch: Partial<LeadRecord>) => {
      const now = new Date().toISOString();
      setDb((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch, updated_at: now } : l)),
      }));
    },
    []
  );

  const updateLeadStatus = useCallback(
    (id: string, status: LeadStatus, note?: string) => {
      const now = new Date().toISOString();
      setDb((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        if (!target) return prev;

        const act: LeadActivityRecord = {
          id: `la-${Date.now()}`,
          lead_id: id,
          activity_type: 'Status Change',
          summary: `Lead status moved from "${target.status}" to "${status}"`,
          details: note || `Updated by ${currentUser?.full_name ?? 'Owner'}`,
          performed_by: currentUser?.full_name ?? 'Owner',
          created_at: now,
        };

        return {
          ...prev,
          leads: prev.leads.map((l) => (l.id === id ? { ...l, status, updated_at: now } : l)),
          lead_activities: [act, ...prev.lead_activities],
          audit_logs: [
            appendAudit('UPDATE', 'leads', id, `Updated lead ${target.lead_code} status to ${status}.`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [currentUser, appendAudit]
  );

  const deleteLead = useCallback(
    (id: string) => {
      setDb((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        return {
          ...prev,
          leads: prev.leads.filter((l) => l.id !== id),
          lead_activities: prev.lead_activities.filter((a) => a.lead_id !== id),
          audit_logs: [
            appendAudit('DELETE', 'leads', id, `Deleted lead ${target?.lead_code ?? id} (${target?.customer_name ?? ''}).`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  const addLeadActivity = useCallback((input: Omit<LeadActivityRecord, 'id' | 'created_at'>) => {
    const newAct: LeadActivityRecord = {
      ...input,
      id: `la-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      lead_activities: [newAct, ...prev.lead_activities],
    }));
  }, []);

  const convertLeadToClient = useCallback(
    (leadId: string): ClientRecord | null => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (!lead) return null;

      if (lead.converted_client_id) {
        const existingClient = db.clients.find((c) => c.id === lead.converted_client_id);
        if (existingClient) return existingClient;
      }

      const now = new Date().toISOString();
      const parts = lead.customer_name.split('&').map((s) => s.trim());
      const newClient: ClientRecord = {
        id: `cli-${Date.now()}`,
        client_code: `DRK-CL-${2001 + db.clients.length}`,
        full_name: lead.customer_name,
        phone: lead.phone,
        whatsapp: lead.whatsapp || lead.phone,
        email: lead.email,
        address: lead.event_location,
        city: lead.event_location.split(',')[0]?.trim() || 'Hazaribagh',
        groom_name: lead.groom_name || parts[0] || lead.customer_name,
        bride_name: lead.bride_name || parts[1] || '',
        family_contact_name: '',
        family_contact_phone: lead.phone,
        wedding_date: lead.event_date,
        event_location: lead.event_location,
        special_requirements: `Converted from ${lead.enquiry_source} Lead (${lead.lead_code}). Interested in ${lead.interested_package_name}.`,
        notes: lead.notes,
        source_lead_id: lead.id,
        created_at: now,
        updated_at: now,
      };

      const act: LeadActivityRecord = {
        id: `la-${Date.now()}`,
        lead_id: lead.id,
        client_id: newClient.id,
        activity_type: 'Status Change',
        summary: `Converted Lead to Client Profile (${newClient.client_code})`,
        details: `Customer record created in Central Client Database.`,
        performed_by: currentUser?.full_name ?? 'Owner',
        created_at: now,
      };

      setDb((prev) => ({
        ...prev,
        clients: [newClient, ...prev.clients],
        leads: prev.leads.map((l) =>
          l.id === leadId ? { ...l, converted_client_id: newClient.id, updated_at: now } : l
        ),
        lead_activities: [act, ...prev.lead_activities],
        audit_logs: [
          appendAudit('CONVERT', 'clients', newClient.id, `Converted lead ${lead.lead_code} to client ${newClient.client_code}.`),
          ...prev.audit_logs,
        ],
      }));

      return newClient;
    },
    [db.leads, db.clients, currentUser, appendAudit]
  );

  // ---------------------------------------------------------------------------
  // WEBSITE ENQUIRY INGESTION (FROM PUBLIC WEBSITE OR WEBHOOK)
  // ---------------------------------------------------------------------------
  const ingestWebsiteEnquiry = useCallback(
    (payload: WebsiteEnquiryInput): { lead: LeadRecord; duplicateMerged: boolean } => {
      const now = new Date().toISOString();
      const today = getTodayKolkataISO();
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const cleanPhone = payload.phone.replace(/\D/g, '').slice(-10);

      const existing = db.leads.find(
        (l) => cleanPhone.length >= 10 && l.phone.replace(/\D/g, '').slice(-10) === cleanPhone
      );

      if (existing) {
        const act: LeadActivityRecord = {
          id: `la-${Date.now()}`,
          lead_id: existing.id,
          activity_type: 'Website Submission',
          summary: 'Follow-up Enquiry Submitted on thedrkweddings.pages.dev',
          details: `Venue: ${payload.event_location || existing.event_location} | Date: ${payload.event_date || existing.event_date} | Message: ${payload.notes || 'None'}`,
          performed_by: 'Website Webhook',
          created_at: now,
        };
        const notif: NotificationRecord = {
          id: `notif-${Date.now()}`,
          type: 'Website Enquiry',
          title: `Updated Website Enquiry: ${existing.customer_name}`,
          message: `${payload.customer_name} (${payload.phone}) sent an additional inquiry via the website.`,
          target_path: '/leads',
          entity_id: existing.id,
          is_read: false,
          created_at: now,
        };

        setDb((prev) => ({
          ...prev,
          lead_activities: [act, ...prev.lead_activities],
          notifications: [notif, ...prev.notifications],
        }));

        return { lead: existing, duplicateMerged: true };
      }

      const newLead: LeadRecord = {
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        lead_code: `DRK-LD-${1001 + db.leads.length}`,
        customer_name: payload.customer_name.trim(),
        phone: payload.phone.trim(),
        whatsapp: (payload.whatsapp || payload.phone).trim(),
        email: (payload.email || '').trim(),
        event_type: payload.event_type || 'Wedding',
        event_date: payload.event_date || tomorrow,
        event_location: payload.event_location || 'Hazaribagh, Jharkhand',
        estimated_budget: Number(payload.estimated_budget || 185000),
        interested_package_name: payload.interested_package_name || 'Classic Royal Collection (3-Day Signature)',
        event_days: Number(payload.event_days || 3),
        enquiry_source: 'Website',
        enquiry_date: today,
        follow_up_date: tomorrow,
        assigned_staff_id: 'tm-1',
        assigned_staff_name: 'Deepak Raj',
        notes: payload.notes || 'Submitted consultation form on https://thedrkweddings.pages.dev/',
        status: 'New',
        created_at: now,
        updated_at: now,
      };

      const act: LeadActivityRecord = {
        id: `la-${Date.now()}`,
        lead_id: newLead.id,
        activity_type: 'Website Submission',
        summary: 'Enquiry Captured from Public Website (thedrkweddings.pages.dev)',
        details: `Couple: ${newLead.customer_name} | Phone: ${newLead.phone} | Venue: ${newLead.event_location} | Notes: ${newLead.notes}`,
        performed_by: 'Website Webhook',
        created_at: now,
      };

      const notif: NotificationRecord = {
        id: `notif-${Date.now()}`,
        type: 'Website Enquiry',
        title: `New Website Enquiry: ${newLead.customer_name}`,
        message: `New inquiry from thedrkweddings.pages.dev for ${newLead.event_location} (${newLead.phone}).`,
        target_path: '/leads',
        entity_id: newLead.id,
        is_read: false,
        created_at: now,
      };

      const audit = appendAudit(
        'WEBHOOK',
        'leads',
        newLead.id,
        `Website enquiry ${newLead.lead_code} (${newLead.customer_name}) automatically captured from thedrkweddings.pages.dev.`
      );

      setDb((prev) => ({
        ...prev,
        leads: [newLead, ...prev.leads],
        lead_activities: [act, ...prev.lead_activities],
        notifications: [notif, ...prev.notifications],
        audit_logs: [audit, ...prev.audit_logs],
      }));

      return { lead: newLead, duplicateMerged: false };
    },
    [db.leads, appendAudit]
  );

  // Poll local Vite server webhook queue (/api/public/enquiries) for external POST submissions
  useEffect(() => {
    let active = true;
    const checkQueue = async () => {
      try {
        const res = await fetch('/api/public/enquiries');
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.ok && Array.isArray(data.enquiries) && data.enquiries.length > 0) {
          for (const item of data.enquiries) {
            ingestWebsiteEnquiry(item);
          }
          await fetch('/api/public/enquiries', { method: 'DELETE' });
        }
      } catch {
        // Ignore when offline or static preview
      }
    };
    checkQueue();
    const timer = window.setInterval(checkQueue, 6000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [ingestWebsiteEnquiry]);

  // ---------------------------------------------------------------------------
  // CLIENTS
  // ---------------------------------------------------------------------------
  const addClient = useCallback(
    (input: Omit<ClientRecord, 'id' | 'client_code' | 'created_at' | 'updated_at'>): ClientRecord => {
      const now = new Date().toISOString();
      const newClient: ClientRecord = {
        ...input,
        id: `cli-${Date.now()}`,
        client_code: `DRK-CL-${2001 + db.clients.length}`,
        created_at: now,
        updated_at: now,
      };
      setDb((prev) => ({
        ...prev,
        clients: [newClient, ...prev.clients],
        audit_logs: [
          appendAudit('CREATE', 'clients', newClient.id, `Created client profile ${newClient.client_code} (${newClient.full_name}).`),
          ...prev.audit_logs,
        ],
      }));
      return newClient;
    },
    [db.clients.length, appendAudit]
  );

  const updateClient = useCallback((id: string, patch: Partial<ClientRecord>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? { ...c, ...patch, updated_at: now } : c)),
    }));
  }, []);

  const deleteClient = useCallback(
    (id: string) => {
      setDb((prev) => {
        const target = prev.clients.find((c) => c.id === id);
        return {
          ...prev,
          clients: prev.clients.filter((c) => c.id !== id),
          audit_logs: [
            appendAudit('DELETE', 'clients', id, `Deleted client ${target?.client_code ?? id} (${target?.full_name ?? ''}).`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  // ---------------------------------------------------------------------------
  // BOOKINGS, AUTO-PROJECT CREATION & MULTI-EVENT SCHEDULING
  // ---------------------------------------------------------------------------
  const addBooking = useCallback(
    (input: Omit<BookingRecord, 'id' | 'booking_code' | 'created_at' | 'updated_at'>): BookingRecord => {
      const now = new Date().toISOString();
      const today = getTodayKolkataISO();
      const seq = String(db.bookings.length + 1).padStart(3, '0');
      const bookingCode = `DRK-BK-2026-${seq}`;
      const paidAmount = Number(input.paid_amount ?? input.advance_amount ?? 0);
      const balanceAmount = Math.max(0, Number(input.total_amount) - paidAmount);

      const newBooking: BookingRecord = {
        ...input,
        id: `bk-${Date.now()}`,
        booking_code: bookingCode,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        payment_status:
          balanceAmount === 0
            ? 'Fully Paid'
            : paidAmount > 0
            ? paidAmount === input.advance_amount
              ? 'Advance Paid'
              : 'Partially Paid'
            : 'Pending Advance',
        created_at: now,
        updated_at: now,
      };

      // Every confirmed booking automatically creates its corresponding Project & Invoice
      const expectedDeliveryDate = new Date(
        new Date(`${newBooking.wedding_date || today}T00:00:00`).getTime() + 60 * 86400000
      )
        .toISOString()
        .split('T')[0];

      const newProject: ProjectRecord = {
        id: `prj-${Date.now()}`,
        project_code: `DRK-PRJ-2026-${seq}`,
        booking_id: newBooking.id,
        booking_code: newBooking.booking_code,
        client_id: newBooking.client_id,
        client_name: newBooking.client_name,
        wedding_date: newBooking.wedding_date,
        current_stage: 'Booking Confirmed',
        completed_stages: ['Booking Confirmed'],
        raw_backup_drive: 'Pending Shoot Backup',
        backup_verified: false,
        expected_delivery_date: expectedDeliveryDate,
        overall_progress: 10,
        priority: 'Normal',
        status: 'Active',
        notes: `Auto-initialized production workflow for ${newBooking.package_name}.`,
        created_at: now,
        updated_at: now,
      };

      const newInvoice: InvoiceRecord = {
        id: `inv-${Date.now()}`,
        invoice_number: `DRK-INV-2026-${seq}`,
        booking_id: newBooking.id,
        booking_code: newBooking.booking_code,
        client_id: newBooking.client_id,
        client_name: newBooking.client_name,
        client_phone: newBooking.client_phone,
        issue_date: today,
        due_date: newBooking.wedding_date || today,
        subtotal: newBooking.total_amount,
        discount_amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: newBooking.total_amount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        status: balanceAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Issued',
        milestones: [
          {
            label: 'Booking Advance',
            amount: newBooking.advance_amount || Math.round(newBooking.total_amount * 0.2),
            due_date: today,
            status: paidAmount > 0 ? 'Paid' : 'Pending',
          },
          {
            label: 'Remaining Wedding Settlement',
            amount: balanceAmount,
            due_date: newBooking.wedding_date || today,
            status: balanceAmount === 0 ? 'Paid' : 'Pending',
          },
        ],
        notes: `Generated automatically for Booking ${newBooking.booking_code} (${newBooking.package_name}).`,
        terms: 'Payments accepted via UPI, Bank Transfer or Cash.',
        created_at: now,
      };

      const initialPayment: PaymentRecord | null =
        paidAmount > 0
          ? {
              id: `pay-${Date.now()}`,
              payment_code: `DRK-PAY-2026-${String(db.payments.length + 1).padStart(3, '0')}`,
              invoice_id: newInvoice.id,
              invoice_number: newInvoice.invoice_number,
              booking_id: newBooking.id,
              booking_code: newBooking.booking_code,
              client_id: newBooking.client_id,
              client_name: newBooking.client_name,
              amount: paidAmount,
              payment_type: 'Advance',
              payment_date: today,
              payment_method: 'UPI',
              transaction_reference: `ADV-${bookingCode}`,
              remaining_balance_after: balanceAmount,
              received_by: currentUser?.full_name ?? 'Owner',
              notes: 'Initial booking confirmation advance.',
              is_voided: false,
              created_at: now,
            }
          : null;

      setDb((prev) => ({
        ...prev,
        bookings: [newBooking, ...prev.bookings],
        projects: [newProject, ...prev.projects],
        invoices: [newInvoice, ...prev.invoices],
        payments: initialPayment ? [initialPayment, ...prev.payments] : prev.payments,
        audit_logs: [
          appendAudit(
            'CREATE',
            'bookings',
            newBooking.id,
            `Created booking ${newBooking.booking_code} for ${newBooking.client_name} (Total: ₹${newBooking.total_amount.toLocaleString('en-IN')}).`
          ),
          ...prev.audit_logs,
        ],
      }));

      return newBooking;
    },
    [db.bookings.length, db.payments.length, currentUser, appendAudit]
  );

  const convertLeadToBooking = useCallback(
    (leadId: string, advanceAmount = 30000): BookingRecord | null => {
      const lead = db.leads.find((l) => l.id === leadId);
      if (!lead) return null;

      let client = lead.converted_client_id
        ? db.clients.find((c) => c.id === lead.converted_client_id) ?? null
        : null;

      if (!client) {
        client = convertLeadToClient(leadId);
      }
      if (!client) return null;

      const totalAmount = lead.estimated_budget > 0 ? lead.estimated_budget : 150000;
      const adv = Math.min(advanceAmount, totalAmount);

      const booking = addBooking({
        client_id: client.id,
        client_name: client.full_name,
        client_phone: client.phone,
        groom_name: client.groom_name,
        bride_name: client.bride_name,
        lead_id: lead.id,
        booking_date: getTodayKolkataISO(),
        wedding_date: lead.event_date || getTodayKolkataISO(),
        wedding_end_date: lead.event_end_date,
        event_location: lead.event_location,
        package_id: lead.interested_package_id,
        package_name: lead.interested_package_name || 'Standard Heritage Collection (2-Day)',
        total_amount: totalAmount,
        advance_amount: adv,
        paid_amount: adv,
        balance_amount: totalAmount - adv,
        selected_services: ['Candid Photography', 'Cinematography', 'Traditional Photography', 'Wedding Albums'],
        assigned_team_ids: ['tm-1', 'tm-2', 'tm-3'],
        status: 'Confirmed',
        payment_status: adv > 0 ? 'Advance Paid' : 'Pending Advance',
        internal_notes: `Converted from Lead ${lead.lead_code}. ${lead.notes}`,
      });

      updateLead(lead.id, {
        status: 'Confirmed',
        converted_client_id: client.id,
        converted_booking_id: booking.id,
      });

      return booking;
    },
    [db.leads, db.clients, convertLeadToClient, addBooking, updateLead]
  );

  const updateBooking = useCallback((id: string, patch: Partial<BookingRecord>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, ...patch, updated_at: now } : b)),
    }));
  }, []);

  const deleteBooking = useCallback(
    (id: string) => {
      setDb((prev) => {
        const target = prev.bookings.find((b) => b.id === id);
        return {
          ...prev,
          bookings: prev.bookings.filter((b) => b.id !== id),
          events: prev.events.filter((e) => e.booking_id !== id),
          projects: prev.projects.filter((p) => p.booking_id !== id),
          audit_logs: [
            appendAudit('DELETE', 'bookings', id, `Deleted booking ${target?.booking_code ?? id}.`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  const addEvent = useCallback(
    (input: Omit<EventRecord, 'id' | 'created_at'>): EventRecord => {
      const newEv: EventRecord = {
        ...input,
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        events: [...prev.events, newEv],
        audit_logs: [
          appendAudit('CREATE', 'events', newEv.id, `Scheduled event "${newEv.event_name}" on ${newEv.event_date} for ${newEv.client_name}.`),
          ...prev.audit_logs,
        ],
      }));
      return newEv;
    },
    [appendAudit]
  );

  const updateEvent = useCallback((id: string, patch: Partial<EventRecord>) => {
    setDb((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteEvent = useCallback(
    (id: string) => {
      setDb((prev) => {
        const target = prev.events.find((e) => e.id === id);
        return {
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
          audit_logs: [
            appendAudit('DELETE', 'events', id, `Removed scheduled event "${target?.event_name ?? id}".`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  // ---------------------------------------------------------------------------
  // PACKAGES & QUOTATIONS
  // ---------------------------------------------------------------------------
  const addPackage = useCallback(
    (input: Omit<PackageRecord, 'id' | 'package_code' | 'created_at'>): PackageRecord => {
      const newPkg: PackageRecord = {
        ...input,
        id: `pkg-${Date.now()}`,
        package_code: `DRK-PKG-${String(db.packages.length + 1).padStart(2, '0')}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        packages: [...prev.packages, newPkg],
        audit_logs: [
          appendAudit('CREATE', 'packages', newPkg.id, `Created photography package "${newPkg.name}".`),
          ...prev.audit_logs,
        ],
      }));
      return newPkg;
    },
    [db.packages.length, appendAudit]
  );

  const updatePackage = useCallback((id: string, patch: Partial<PackageRecord>) => {
    setDb((prev) => ({
      ...prev,
      packages: prev.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deletePackage = useCallback(
    (id: string) => {
      setDb((prev) => ({
        ...prev,
        packages: prev.packages.filter((p) => p.id !== id),
      }));
    },
    []
  );

  const addQuotation = useCallback(
    (input: Omit<QuotationRecord, 'id' | 'quotation_number' | 'created_at' | 'updated_at'>): QuotationRecord => {
      const now = new Date().toISOString();
      const seq = String(db.quotations.length + 1).padStart(3, '0');
      const newQt: QuotationRecord = {
        ...input,
        id: `qt-${Date.now()}`,
        quotation_number: `DRK-QT-2026-${seq}`,
        created_at: now,
        updated_at: now,
      };
      setDb((prev) => ({
        ...prev,
        quotations: [newQt, ...prev.quotations],
        audit_logs: [
          appendAudit('CREATE', 'quotations', newQt.id, `Created quotation ${newQt.quotation_number} for ${newQt.customer_name} (₹${newQt.total_amount.toLocaleString('en-IN')}).`),
          ...prev.audit_logs,
        ],
      }));
      return newQt;
    },
    [db.quotations.length, appendAudit]
  );

  const updateQuotation = useCallback((id: string, patch: Partial<QuotationRecord>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      quotations: prev.quotations.map((q) => (q.id === id ? { ...q, ...patch, updated_at: now } : q)),
    }));
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      quotations: prev.quotations.filter((q) => q.id !== id),
    }));
  }, []);

  const convertQuotationToBooking = useCallback(
    (quotationId: string, advancePaid = 50000): BookingRecord | null => {
      const qt = db.quotations.find((q) => q.id === quotationId);
      if (!qt) return null;

      let clientId = qt.client_id;
      let clientObj = clientId ? db.clients.find((c) => c.id === clientId) : undefined;

      if (!clientObj) {
        const parts = qt.customer_name.split('&').map((s) => s.trim());
        clientObj = addClient({
          full_name: qt.customer_name,
          phone: qt.customer_phone,
          whatsapp: qt.customer_whatsapp || qt.customer_phone,
          email: qt.customer_email,
          address: qt.event_location,
          city: qt.event_location.split(',')[0]?.trim() || 'Hazaribagh',
          groom_name: parts[0] || qt.customer_name,
          bride_name: parts[1] || '',
          family_contact_name: '',
          family_contact_phone: qt.customer_phone,
          wedding_date: qt.wedding_date,
          event_location: qt.event_location,
          special_requirements: `Converted from Accepted Quotation ${qt.quotation_number}`,
          notes: qt.notes,
          source_lead_id: qt.lead_id,
        });
        clientId = clientObj.id;
      }

      const adv = Math.min(advancePaid, qt.total_amount);
      const booking = addBooking({
        client_id: clientId!,
        client_name: clientObj.full_name,
        client_phone: clientObj.phone,
        groom_name: clientObj.groom_name,
        bride_name: clientObj.bride_name,
        lead_id: qt.lead_id,
        quotation_id: qt.id,
        booking_date: getTodayKolkataISO(),
        wedding_date: qt.wedding_date || getTodayKolkataISO(),
        event_location: qt.event_location,
        package_id: qt.package_id,
        package_name: qt.package_name || 'Custom Collection',
        total_amount: qt.total_amount,
        advance_amount: adv,
        paid_amount: adv,
        balance_amount: qt.total_amount - adv,
        selected_services: qt.items.map((i) => i.service_name),
        assigned_team_ids: ['tm-1', 'tm-2', 'tm-3'],
        status: 'Confirmed',
        payment_status: adv > 0 ? 'Advance Paid' : 'Pending Advance',
        internal_notes: `Converted from Quotation ${qt.quotation_number}. ${qt.notes}`,
      });

      updateQuotation(qt.id, {
        status: 'Accepted',
        client_id: clientId,
        converted_booking_id: booking.id,
      });

      if (qt.lead_id) {
        updateLead(qt.lead_id, {
          status: 'Confirmed',
          converted_client_id: clientId,
          converted_booking_id: booking.id,
        });
      }

      return booking;
    },
    [db.quotations, db.clients, addClient, addBooking, updateQuotation, updateLead]
  );

  // ---------------------------------------------------------------------------
  // INVOICES & IMMUTABLE PAYMENTS LEDGER
  // ---------------------------------------------------------------------------
  const addInvoice = useCallback(
    (input: Omit<InvoiceRecord, 'id' | 'invoice_number' | 'created_at'>): InvoiceRecord => {
      const seq = String(db.invoices.length + 1).padStart(3, '0');
      const newInv: InvoiceRecord = {
        ...input,
        id: `inv-${Date.now()}`,
        invoice_number: `DRK-INV-2026-${seq}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        invoices: [newInv, ...prev.invoices],
        audit_logs: [
          appendAudit('CREATE', 'invoices', newInv.id, `Issued invoice ${newInv.invoice_number} for ${newInv.client_name}.`),
          ...prev.audit_logs,
        ],
      }));
      return newInv;
    },
    [db.invoices.length, appendAudit]
  );

  const updateInvoice = useCallback((id: string, patch: Partial<InvoiceRecord>) => {
    setDb((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)),
    }));
  }, []);

  const recordPayment = useCallback(
    (input: {
      booking_id: string;
      invoice_id?: string;
      amount: number;
      payment_type: 'Advance' | 'Partial' | 'Final';
      payment_date: string;
      payment_method: PaymentRecord['payment_method'];
      transaction_reference: string;
      notes: string;
    }): PaymentRecord | null => {
      const booking = db.bookings.find((b) => b.id === input.booking_id);
      if (!booking || input.amount <= 0) return null;

      const invoice =
        (input.invoice_id ? db.invoices.find((i) => i.id === input.invoice_id) : undefined) ||
        db.invoices.find((i) => i.booking_id === booking.id);

      const activeBookingPayments = db.payments.filter(
        (p) => p.booking_id === booking.id && !p.is_voided
      );
      const currentPaid = activeBookingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const newPaid = currentPaid + Number(input.amount);
      const remainingBalance = Math.max(0, Number(booking.total_amount) - newPaid);

      const seq = String(db.payments.length + 1).padStart(3, '0');
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        payment_code: `DRK-PAY-2026-${seq}`,
        invoice_id: invoice?.id,
        invoice_number: invoice?.invoice_number,
        booking_id: booking.id,
        booking_code: booking.booking_code,
        client_id: booking.client_id,
        client_name: booking.client_name,
        amount: Number(input.amount),
        payment_type: remainingBalance === 0 ? 'Final' : input.payment_type,
        payment_date: input.payment_date || getTodayKolkataISO(),
        payment_method: input.payment_method,
        transaction_reference: input.transaction_reference || `TXN-${Date.now().toString().slice(-6)}`,
        remaining_balance_after: remainingBalance,
        received_by: currentUser?.full_name ?? 'Owner',
        notes: input.notes,
        is_voided: false,
        created_at: new Date().toISOString(),
      };

      const newBookingPaymentStatus: BookingRecord['payment_status'] =
        remainingBalance === 0
          ? 'Fully Paid'
          : newPaid <= booking.advance_amount
          ? 'Advance Paid'
          : 'Partially Paid';

      const audit = appendAudit(
        'CREATE',
        'payments',
        newPayment.id,
        `Recorded ${newPayment.payment_type} payment ${newPayment.payment_code} of ₹${newPayment.amount.toLocaleString('en-IN')} (${newPayment.payment_method}) for ${booking.client_name} (${booking.booking_code}). Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}.`,
        {
          booking_code: booking.booking_code,
          amount: newPayment.amount,
          method: newPayment.payment_method,
          remaining_balance_after: remainingBalance,
        }
      );

      setDb((prev) => ({
        ...prev,
        payments: [newPayment, ...prev.payments],
        bookings: prev.bookings.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                paid_amount: newPaid,
                balance_amount: remainingBalance,
                payment_status: newBookingPaymentStatus,
                updated_at: new Date().toISOString(),
              }
            : b
        ),
        invoices: prev.invoices.map((inv) =>
          inv.booking_id === booking.id
            ? {
                ...inv,
                paid_amount: newPaid,
                balance_amount: remainingBalance,
                status: remainingBalance === 0 ? 'Paid' : 'Partially Paid',
              }
            : inv
        ),
        audit_logs: [audit, ...prev.audit_logs],
      }));

      return newPayment;
    },
    [db.bookings, db.invoices, db.payments, currentUser, appendAudit]
  );

  // Never silently delete financial transactions — void with reason & recalculate balance
  const voidPayment = useCallback(
    (paymentId: string, reason: string) => {
      setDb((prev) => {
        const target = prev.payments.find((p) => p.id === paymentId);
        if (!target || target.is_voided) return prev;

        const now = new Date().toISOString();
        const updatedPayments = prev.payments.map((p) =>
          p.id === paymentId
            ? { ...p, is_voided: true, void_reason: reason || 'Administrative correction', voided_at: now }
            : p
        );

        const booking = prev.bookings.find((b) => b.id === target.booking_id);
        const activePaid = updatedPayments
          .filter((p) => p.booking_id === target.booking_id && !p.is_voided)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const newBalance = booking ? Math.max(0, booking.total_amount - activePaid) : 0;

        return {
          ...prev,
          payments: updatedPayments,
          bookings: prev.bookings.map((b) =>
            b.id === target.booking_id
              ? {
                  ...b,
                  paid_amount: activePaid,
                  balance_amount: newBalance,
                  payment_status:
                    newBalance === 0 ? 'Fully Paid' : activePaid > 0 ? 'Partially Paid' : 'Pending Advance',
                  updated_at: now,
                }
              : b
          ),
          invoices: prev.invoices.map((inv) =>
            inv.booking_id === target.booking_id
              ? {
                  ...inv,
                  paid_amount: activePaid,
                  balance_amount: newBalance,
                  status: newBalance === 0 ? 'Paid' : activePaid > 0 ? 'Partially Paid' : 'Issued',
                }
              : inv
          ),
          audit_logs: [
            appendAudit(
              'VOID',
              'payments',
              paymentId,
              `Voided payment ${target.payment_code} (₹${target.amount.toLocaleString('en-IN')}) for ${target.client_name}. Reason: ${reason}. Recalculated booking balance to ₹${newBalance.toLocaleString('en-IN')}.`
            ),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  // ---------------------------------------------------------------------------
  // EXPENSES
  // ---------------------------------------------------------------------------
  const addExpense = useCallback(
    (input: Omit<ExpenseRecord, 'id' | 'expense_code' | 'created_at'>): ExpenseRecord => {
      const seq = String(db.expenses.length + 1).padStart(3, '0');
      const newExp: ExpenseRecord = {
        ...input,
        id: `exp-${Date.now()}`,
        expense_code: `DRK-EXP-2026-${seq}`,
        created_at: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        expenses: [newExp, ...prev.expenses],
        team_members: input.team_member_id
          ? prev.team_members.map((m) =>
              m.id === input.team_member_id
                ? {
                    ...m,
                    total_paid: Number(m.total_paid) + Number(input.amount),
                    total_pending: Math.max(0, Number(m.total_pending) - Number(input.amount)),
                  }
                : m
            )
          : prev.team_members,
        audit_logs: [
          appendAudit(
            'CREATE',
            'expenses',
            newExp.id,
            `Recorded expense ${newExp.expense_code} (${newExp.category}) of ₹${newExp.amount.toLocaleString('en-IN')} paid to ${newExp.vendor_or_recipient}.`
          ),
          ...prev.audit_logs,
        ],
      }));
      return newExp;
    },
    [db.expenses.length, appendAudit]
  );

  const updateExpense = useCallback((id: string, patch: Partial<ExpenseRecord>) => {
    setDb((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteExpense = useCallback(
    (id: string) => {
      setDb((prev) => {
        const target = prev.expenses.find((e) => e.id === id);
        return {
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
          audit_logs: [
            appendAudit('DELETE', 'expenses', id, `Deleted expense record ${target?.expense_code ?? id}.`),
            ...prev.audit_logs,
          ],
        };
      });
    },
    [appendAudit]
  );

  // ---------------------------------------------------------------------------
  // TEAM & RBAC
  // ---------------------------------------------------------------------------
  const addTeamMember = useCallback(
    (input: Omit<TeamMemberRecord, 'id' | 'member_code' | 'created_at'>): TeamMemberRecord => {
      const seq = String(db.team_members.length + 1).padStart(2, '0');
      const newMember: TeamMemberRecord = {
        ...input,
        id: `tm-${Date.now()}`,
        member_code: `DRK-TM-${seq}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        team_members: [...prev.team_members, newMember],
        audit_logs: [
          appendAudit('CREATE', 'team', newMember.id, `Added team member ${newMember.full_name} (${newMember.role}).`),
          ...prev.audit_logs,
        ],
      }));
      return newMember;
    },
    [db.team_members.length, appendAudit]
  );

  const updateTeamMember = useCallback((id: string, patch: Partial<TeamMemberRecord>) => {
    setDb((prev) => ({
      ...prev,
      team_members: prev.team_members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      team_members: prev.team_members.filter((m) => m.id !== id),
    }));
  }, []);

  const updatePermission = useCallback((permissionId: string, patch: Partial<PermissionRecord>) => {
    setDb((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => (p.id === permissionId ? { ...p, ...patch } : p)),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // PROJECTS & PARALLEL POST-PRODUCTION TASKS
  // ---------------------------------------------------------------------------
  const updateProjectStage = useCallback(
    (projectId: string, stage: ProjectWorkflowStage, notes?: string) => {
      const now = new Date().toISOString();
      setDb((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id !== projectId) return p;
          const completed = p.completed_stages.includes(stage)
            ? p.completed_stages
            : [...p.completed_stages, stage];
          const progress = Math.min(100, Math.round((completed.length / 12) * 100));
          return {
            ...p,
            current_stage: stage,
            completed_stages: completed,
            overall_progress: stage === 'Project Completed' ? 100 : progress,
            status: stage === 'Project Completed' ? 'Completed' : p.status,
            actual_delivery_date: stage === 'Project Completed' ? getTodayKolkataISO() : p.actual_delivery_date,
            notes: notes ?? p.notes,
            updated_at: now,
          };
        }),
        audit_logs: [
          appendAudit('UPDATE', 'projects', projectId, `Updated project workflow stage to "${stage}".`),
          ...prev.audit_logs,
        ],
      }));
    },
    [appendAudit]
  );

  const updateProject = useCallback((projectId: string, patch: Partial<ProjectRecord>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...patch, updated_at: now } : p)),
    }));
  }, []);

  const addTask = useCallback((input: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>): TaskRecord => {
    const now = new Date().toISOString();
    const newTask: TaskRecord = {
      ...input,
      id: `tsk-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    setDb((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<TaskRecord>) => {
    const now = new Date().toISOString();
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...patch, updated_at: now };
        if (patch.status === 'Completed') {
          updated.progress_percentage = 100;
        } else if (patch.progress_percentage === 100 && !patch.status) {
          updated.status = 'Completed';
        }
        return updated;
      }),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // DELIVERABLES & DOCUMENTS
  // ---------------------------------------------------------------------------
  const addDeliverable = useCallback(
    (input: Omit<DeliverableRecord, 'id' | 'deliverable_code' | 'created_at'>): DeliverableRecord => {
      const newDlv: DeliverableRecord = {
        ...input,
        id: `dlv-${Date.now()}`,
        deliverable_code: `DRK-DLV-${101 + db.deliverables.length}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        deliverables: [newDlv, ...prev.deliverables],
      }));
      return newDlv;
    },
    [db.deliverables.length]
  );

  const updateDeliverable = useCallback((id: string, patch: Partial<DeliverableRecord>) => {
    setDb((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        if (patch.status === 'Delivered' && !next.actual_delivery_date) {
          next.actual_delivery_date = getTodayKolkataISO();
        }
        return next;
      }),
    }));
  }, []);

  const deleteDeliverable = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((d) => d.id !== id),
    }));
  }, []);

  const addDocument = useCallback(
    (input: Omit<DocumentRecord, 'id' | 'document_code' | 'created_at'>): DocumentRecord => {
      const newDoc: DocumentRecord = {
        ...input,
        id: `doc-${Date.now()}`,
        document_code: `DRK-DOC-${String(db.documents.length + 1).padStart(3, '0')}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        documents: [newDoc, ...prev.documents],
      }));
      return newDoc;
    },
    [db.documents.length]
  );

  const deleteDocument = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // WHATSAPP MESSAGE TEMPLATES & NOTIFICATIONS
  // ---------------------------------------------------------------------------
  const addMessageTemplate = useCallback(
    (input: Omit<MessageTemplateRecord, 'id' | 'created_at'>): MessageTemplateRecord => {
      const newTpl: MessageTemplateRecord = {
        ...input,
        id: `tpl-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        message_templates: [...prev.message_templates, newTpl],
      }));
      return newTpl;
    },
    []
  );

  const updateMessageTemplate = useCallback((id: string, patch: Partial<MessageTemplateRecord>) => {
    setDb((prev) => ({
      ...prev,
      message_templates: prev.message_templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteMessageTemplate = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      message_templates: prev.message_templates.filter((t) => t.id !== id),
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // BACKUP, RESTORE & RESET
  // ---------------------------------------------------------------------------
  const exportDatabaseBackupJSON = useCallback(() => {
    return JSON.stringify(
      {
        studio: 'THE DRK WEDDINGS',
        exported_at: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        database: db,
      },
      null,
      2
    );
  }, [db]);

  const importDatabaseBackupJSON = useCallback((jsonStr: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      const target = parsed.database ?? parsed;
      if (!target || !Array.isArray(target.leads) || !Array.isArray(target.bookings)) {
        return { ok: false, error: 'Invalid backup file format.' };
      }
      setDb((prev) => ({
        ...prev,
        ...target,
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to parse JSON backup.' };
    }
  }, []);

  const resetToInitialStudioData = useCallback(() => {
    const fresh = buildInitialDatabase();
    setDb(fresh);
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(fresh));
  }, []);

  return (
    <DataContext.Provider
      value={{
        ...db,
        addLead,
        updateLead,
        updateLeadStatus,
        deleteLead,
        addLeadActivity,
        convertLeadToClient,
        convertLeadToBooking,
        ingestWebsiteEnquiry,
        addClient,
        updateClient,
        deleteClient,
        addBooking,
        updateBooking,
        deleteBooking,
        addEvent,
        updateEvent,
        deleteEvent,
        addPackage,
        updatePackage,
        deletePackage,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        convertQuotationToBooking,
        addInvoice,
        updateInvoice,
        recordPayment,
        voidPayment,
        addExpense,
        updateExpense,
        deleteExpense,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        updatePermission,
        updateProjectStage,
        updateProject,
        addTask,
        updateTask,
        deleteTask,
        addDeliverable,
        updateDeliverable,
        deleteDeliverable,
        addDocument,
        deleteDocument,
        addMessageTemplate,
        updateMessageTemplate,
        deleteMessageTemplate,
        markNotificationRead,
        markAllNotificationsRead,
        exportDatabaseBackupJSON,
        importDatabaseBackupJSON,
        resetToInitialStudioData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
}
