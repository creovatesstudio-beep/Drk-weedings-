// ============================================================================
// THE DRK WEDDINGS — COMPLETE DOMAIN TYPES & 23-TABLE SCHEMA INTERFACES
// Strictly Internal Owner & Staff CRM (Zero Client Portal / Customer Login)
// ============================================================================

export type StaffRole =
  | 'Owner'
  | 'Administrator'
  | 'Photographer'
  | 'Cinematographer'
  | 'Video Editor'
  | 'Photo Editor'
  | 'Album Designer'
  | 'Other Staff';

export type CRMModule =
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'bookings'
  | 'calendar'
  | 'quotations'
  | 'invoices'
  | 'expenses'
  | 'team'
  | 'projects'
  | 'deliverables'
  | 'communication'
  | 'documents'
  | 'reports'
  | 'settings';

export interface RoleRecord {
  id: string;
  name: StaffRole;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface PermissionRecord {
  id: string;
  role_id: string;
  role_name: StaffRole;
  module: CRMModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view_financials: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role_id: string;
  role_name: StaffRole;
  avatar_url?: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

export type LeadSource =
  | 'Website'
  | 'WhatsApp'
  | 'Instagram'
  | 'Facebook'
  | 'Phone calls'
  | 'Referrals'
  | 'Walk-in customers'
  | 'Other sources';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up Required'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Confirmed'
  | 'Lost'
  | 'Not Interested';

export interface LeadRecord {
  id: string;
  lead_code: string;
  customer_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  groom_name?: string;
  bride_name?: string;
  event_type: string;
  event_date: string; // YYYY-MM-DD
  event_end_date?: string;
  event_location: string;
  estimated_budget: number;
  interested_package_id?: string;
  interested_package_name: string;
  event_days: number;
  enquiry_source: LeadSource;
  enquiry_date: string; // YYYY-MM-DD
  follow_up_date: string; // YYYY-MM-DD
  assigned_staff_id?: string;
  assigned_staff_name: string;
  notes: string;
  status: LeadStatus;
  converted_client_id?: string;
  converted_booking_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityRecord {
  id: string;
  lead_id: string;
  client_id?: string;
  activity_type:
    | 'Note'
    | 'Call'
    | 'WhatsApp'
    | 'Email'
    | 'Status Change'
    | 'Meeting'
    | 'Quotation Sent'
    | 'Website Submission';
  summary: string;
  details: string;
  performed_by: string;
  created_at: string;
}

export interface ClientRecord {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  groom_name: string;
  bride_name: string;
  family_contact_name: string;
  family_contact_phone: string;
  wedding_date: string; // YYYY-MM-DD
  event_location: string;
  special_requirements: string;
  notes: string;
  source_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export type WeddingSubEventType =
  | 'Engagement'
  | 'Haldi'
  | 'Mehndi'
  | 'Sangeet'
  | 'Wedding'
  | 'Reception'
  | 'Pre-wedding shoot'
  | 'Post-wedding shoot'
  | 'Client Meeting'
  | 'Other';

export type EventCompletionStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Rescheduled'
  | 'Cancelled';

export interface EventRecord {
  id: string;
  booking_id?: string;
  booking_code?: string;
  client_id?: string;
  client_name: string;
  event_name: string;
  event_type: WeddingSubEventType;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  venue: string;
  location: string;
  assigned_photographers: string[]; // TeamMember IDs
  assigned_cinematographers: string[]; // TeamMember IDs
  equipment_requirements: string;
  special_instructions: string;
  completion_status: EventCompletionStatus;
  created_at: string;
}

export type BookingStatus =
  | 'Confirmed'
  | 'Upcoming'
  | 'In Progress'
  | 'Post-Production'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export type BookingPaymentStatus =
  | 'Pending Advance'
  | 'Advance Paid'
  | 'Partially Paid'
  | 'Fully Paid'
  | 'Overdue';

export interface BookingRecord {
  id: string;
  booking_code: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  groom_name?: string;
  bride_name?: string;
  lead_id?: string;
  quotation_id?: string;
  booking_date: string; // YYYY-MM-DD
  wedding_date: string; // YYYY-MM-DD
  wedding_end_date?: string;
  event_location: string;
  package_id?: string;
  package_name: string;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  balance_amount: number;
  selected_services: string[];
  assigned_team_ids: string[];
  status: BookingStatus;
  payment_status: BookingPaymentStatus;
  contract_url?: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export type PhotographyServiceType =
  | 'Traditional Photography'
  | 'Candid Photography'
  | 'Cinematography'
  | 'Traditional Videography'
  | 'Drone Photography'
  | 'Pre-Wedding Shoot'
  | 'Wedding Highlight Film'
  | 'Full Wedding Film'
  | 'Wedding Albums'
  | 'Live Streaming'
  | 'Additional Services';

export interface PackageServiceRecord {
  id: string;
  package_id: string;
  service_name: PhotographyServiceType | string;
  description: string;
  quantity: number;
  unit_price: number;
  is_included: boolean;
}

export interface PackageRecord {
  id: string;
  package_code: string;
  name: string;
  tier: string;
  description: string;
  base_price: number;
  photographers_count: number;
  cinematographers_count: number;
  event_days: number;
  albums_description: string;
  edited_photos_count: number;
  video_deliverables: string;
  additional_services: string[];
  is_active: boolean;
  popular_rank: number;
  created_at: string;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface QuotationItemRecord {
  id: string;
  quotation_id: string;
  service_name: string;
  description: string;
  event_days: number;
  team_count: number;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuotationRecord {
  id: string;
  quotation_number: string;
  lead_id?: string;
  client_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string;
  wedding_date: string;
  event_location: string;
  event_days: number;
  package_id?: string;
  package_name: string;
  items: QuotationItemRecord[];
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string;
  status: QuotationStatus;
  terms_and_conditions: string;
  notes: string;
  converted_booking_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceMilestone {
  label: string; // e.g. "Booking Advance (20%)", "Wedding Week Milestone (40%)", "Pre-Delivery Final (40%)"
  amount: number;
  due_date: string;
  status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  booking_id: string;
  booking_code: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue';
  milestones: InvoiceMilestone[];
  notes: string;
  terms: string;
  created_at: string;
}

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Bank transfer'
  | 'Other payment methods';

export type PaymentStageType = 'Advance' | 'Partial' | 'Final';

export interface PaymentRecord {
  id: string;
  payment_code: string;
  invoice_id?: string;
  invoice_number?: string;
  booking_id: string;
  booking_code: string;
  client_id: string;
  client_name: string;
  amount: number;
  payment_type: PaymentStageType;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  transaction_reference: string;
  remaining_balance_after: number;
  received_by: string;
  notes: string;
  is_voided: boolean;
  void_reason?: string;
  voided_at?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'Photographer payments'
  | 'Cinematographer payments'
  | 'Editor payments'
  | 'Travel'
  | 'Accommodation'
  | 'Food'
  | 'Equipment rental'
  | 'Camera maintenance'
  | 'Album printing'
  | 'Hard drives and storage'
  | 'Office expenses'
  | 'Marketing'
  | 'Miscellaneous';

export interface ExpenseRecord {
  id: string;
  expense_code: string;
  expense_date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  booking_id?: string;
  booking_code?: string;
  team_member_id?: string;
  vendor_or_recipient: string;
  description: string;
  receipt_attachment?: string;
  created_at: string;
}

export interface TeamMemberRecord {
  id: string;
  user_id?: string;
  member_code: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  role: StaffRole;
  employment_type: 'In-House' | 'Freelancer';
  payment_rate: number;
  rate_basis: 'Per Day' | 'Per Event' | 'Per Project' | 'Monthly Salary';
  specialization: string;
  equipment_owned: string;
  availability_status: 'Available' | 'On Shoot' | 'Leave' | 'Busy';
  unavailable_dates: string[]; // YYYY-MM-DD
  total_paid: number;
  total_pending: number;
  notes: string;
  created_at: string;
}

export type ProjectWorkflowStage =
  | 'Booking Confirmed'
  | 'Event Scheduled'
  | 'Shoot Completed'
  | 'Data Backup Completed'
  | 'Photo Culling'
  | 'Photo Editing'
  | 'Album Designing'
  | 'Album Printing'
  | 'Video Editing'
  | 'Video Review'
  | 'Final Delivery'
  | 'Project Completed';

export const ALL_PROJECT_STAGES: ProjectWorkflowStage[] = [
  'Booking Confirmed',
  'Event Scheduled',
  'Shoot Completed',
  'Data Backup Completed',
  'Photo Culling',
  'Photo Editing',
  'Album Designing',
  'Album Printing',
  'Video Editing',
  'Video Review',
  'Final Delivery',
  'Project Completed',
];

export interface ProjectRecord {
  id: string;
  project_code: string;
  booking_id: string;
  booking_code: string;
  client_id: string;
  client_name: string;
  wedding_date: string;
  current_stage: ProjectWorkflowStage;
  completed_stages: ProjectWorkflowStage[];
  raw_backup_drive: string;
  backup_verified: boolean;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  overall_progress: number;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Active' | 'On Hold' | 'Delayed' | 'Completed';
  notes: string;
  created_at: string;
  updated_at: string;
}

export type WorkflowTrackCategory =
  | 'Photography editing'
  | 'Cinematography editing'
  | 'Album designing'
  | 'Album printing'
  | 'Video production'
  | 'Other custom tasks';

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'On Hold'
  | 'Review'
  | 'Completed';

export interface TaskRecord {
  id: string;
  project_id: string;
  booking_id: string;
  booking_code: string;
  client_name: string;
  task_name: string;
  workflow_track: WorkflowTrackCategory;
  assigned_staff_id: string;
  assigned_staff_name: string;
  start_date: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  progress_percentage: number;
  status: TaskStatus;
  internal_notes: string;
  file_attachments: string[];
  created_at: string;
  updated_at: string;
}

export type DeliverableCategory =
  | 'Edited photographs'
  | 'Raw photographs'
  | 'Wedding teaser'
  | 'Highlight video'
  | 'Full wedding film'
  | 'Instagram reels'
  | 'Wedding albums'
  | 'Additional albums'
  | 'Other deliverables';

export interface DeliverableRecord {
  id: string;
  deliverable_code: string;
  booking_id: string;
  booking_code: string;
  client_name: string;
  deliverable_type: DeliverableCategory;
  deliverable_name: string;
  assigned_editor_id?: string;
  assigned_editor_name: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  status: 'Pending' | 'In Production' | 'Ready' | 'Delivered';
  internal_delivery_link: string;
  storage_platform: 'Google Drive' | 'Dropbox' | 'Physical Handover' | 'Hard Drive' | 'Other';
  notes: string;
  created_at: string;
}

export type DocumentCategory =
  | 'Client agreements'
  | 'Booking contracts'
  | 'Quotations'
  | 'Invoices'
  | 'Receipts'
  | 'Event documents'
  | 'Vendor bills'
  | 'Business documents'
  | 'Other attachments';

export interface DocumentRecord {
  id: string;
  document_code: string;
  title: string;
  category: DocumentCategory;
  client_id?: string;
  client_name?: string;
  booking_id?: string;
  booking_code?: string;
  project_id?: string;
  file_name: string;
  file_size: string;
  file_type: string;
  file_url: string;
  uploaded_by: string;
  notes: string;
  created_at: string;
}

export type WhatsAppActionType =
  | 'Contact enquiry'
  | 'Send quotation'
  | 'Booking confirmation'
  | 'Payment reminder'
  | 'Event schedule'
  | 'Delivery notification'
  | 'Send thank-you message';

export interface MessageTemplateRecord {
  id: string;
  name: string;
  action_type: WhatsAppActionType;
  template_text: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  type:
    | 'Website Enquiry'
    | 'Follow-up Reminder'
    | 'Payment Due'
    | 'Task Deadline'
    | 'Scheduling Conflict'
    | 'Deliverable Update'
    | 'System';
  title: string;
  message: string;
  target_path: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_name: string;
  actor_role: StaffRole | 'System';
  action: 'CREATE' | 'UPDATE' | 'VOID' | 'CONVERT' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'WEBHOOK';
  module: string;
  entity_id: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SchedulingConflict {
  team_member_id: string;
  team_member_name: string;
  role: StaffRole;
  conflicting_event_id: string;
  conflicting_event_name: string;
  conflicting_client_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
}
