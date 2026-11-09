-- ============================================================================
-- THE DRK WEDDINGS — PRIVATE PHOTOGRAPHY & CINEMATOGRAPHY BUSINESS CRM
-- Complete PostgreSQL / Supabase Database Schema (23 Tables + Indexes + RLS)
-- Strictly for Business Owner & Authorized Internal Staff (Zero Client Portal)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (name IN (
    'Owner', 'Administrator', 'Photographer', 'Cinematographer',
    'Video Editor', 'Photo Editor', 'Album Designer', 'Other Staff'
  )),
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERMISSIONS
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_financials BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role_id, module)
);

-- 3. USERS (Internal Staff & Owner Accounts)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  role_name TEXT NOT NULL DEFAULT 'Owner',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TEAM MEMBERS (Internal Staff & Freelancers)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  member_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'Owner', 'Administrator', 'Photographer', 'Cinematographer',
    'Video Editor', 'Photo Editor', 'Album Designer', 'Other Staff'
  )),
  employment_type TEXT NOT NULL DEFAULT 'In-House' CHECK (employment_type IN ('In-House', 'Freelancer')),
  payment_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_basis TEXT NOT NULL DEFAULT 'Per Day' CHECK (rate_basis IN ('Per Day', 'Per Event', 'Per Project', 'Monthly Salary')),
  specialization TEXT,
  equipment_owned TEXT,
  availability_status TEXT NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available', 'On Shoot', 'Leave', 'Busy')),
  unavailable_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_pending NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PACKAGES
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Classic Royal',
  description TEXT,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  photographers_count INT NOT NULL DEFAULT 2,
  cinematographers_count INT NOT NULL DEFAULT 2,
  event_days INT NOT NULL DEFAULT 3,
  albums_description TEXT,
  edited_photos_count INT NOT NULL DEFAULT 400,
  video_deliverables TEXT,
  additional_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  popular_rank INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PACKAGE SERVICES
CREATE TABLE IF NOT EXISTS public.package_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_included BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. CLIENTS (Internal Customer Database — No Client Login/Portal)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  groom_name TEXT,
  bride_name TEXT,
  family_contact_name TEXT,
  family_contact_phone TEXT,
  wedding_date DATE,
  event_location TEXT,
  special_requirements TEXT,
  notes TEXT,
  source_lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. LEADS & ENQUIRIES
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  groom_name TEXT,
  bride_name TEXT,
  event_type TEXT NOT NULL DEFAULT 'Wedding',
  event_date DATE,
  event_end_date DATE,
  event_location TEXT,
  estimated_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  interested_package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  interested_package_name TEXT,
  event_days INT NOT NULL DEFAULT 1,
  enquiry_source TEXT NOT NULL CHECK (enquiry_source IN (
    'Website', 'WhatsApp', 'Instagram', 'Facebook',
    'Phone calls', 'Referrals', 'Walk-in customers', 'Other sources'
  )),
  enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date DATE,
  assigned_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_staff_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN (
    'New', 'Contacted', 'Follow-up Required', 'Quotation Sent',
    'Negotiation', 'Confirmed', 'Lost', 'Not Interested'
  )),
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_booking_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LEAD ACTIVITIES (Internal Communication History)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'Note', 'Call', 'WhatsApp', 'Email', 'Status Change', 'Meeting', 'Quotation Sent', 'Website Submission'
  )),
  summary TEXT NOT NULL,
  details TEXT,
  performed_by TEXT NOT NULL DEFAULT 'Owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT,
  customer_email TEXT,
  wedding_date DATE,
  event_location TEXT,
  event_days INT NOT NULL DEFAULT 3,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired')),
  terms_and_conditions TEXT,
  notes TEXT,
  converted_booking_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. QUOTATION ITEMS
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  event_days INT NOT NULL DEFAULT 1,
  team_count INT NOT NULL DEFAULT 1,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 12. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  wedding_date DATE NOT NULL,
  wedding_end_date DATE,
  event_location TEXT NOT NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_team_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN (
    'Confirmed', 'Upcoming', 'In Progress', 'Post-Production', 'Delivered', 'Completed', 'Cancelled'
  )),
  payment_status TEXT NOT NULL DEFAULT 'Advance Paid' CHECK (payment_status IN (
    'Pending Advance', 'Advance Paid', 'Partially Paid', 'Fully Paid', 'Overdue'
  )),
  contract_url TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. EVENTS (Multiple Wedding Sub-Events under One Booking + Standalone Shoots/Meetings)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Wedding' CHECK (event_type IN (
    'Engagement', 'Haldi', 'Mehndi', 'Sangeet', 'Wedding',
    'Reception', 'Pre-wedding shoot', 'Post-wedding shoot', 'Client Meeting', 'Other'
  )),
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '10:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  assigned_photographers JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_cinematographers JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipment_requirements TEXT,
  special_instructions TEXT,
  completion_status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (completion_status IN (
    'Scheduled', 'In Progress', 'Completed', 'Rescheduled', 'Cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue')),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAYMENTS (Immutable Financial Ledger with Audit Protection)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_code TEXT NOT NULL UNIQUE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  booking_code TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type TEXT NOT NULL DEFAULT 'Partial' CHECK (payment_type IN ('Advance', 'Partial', 'Final')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank transfer', 'Other payment methods')),
  transaction_reference TEXT,
  remaining_balance_after NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_by TEXT NOT NULL DEFAULT 'Owner',
  notes TEXT,
  is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_code TEXT NOT NULL UNIQUE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN (
    'Photographer payments', 'Cinematographer payments', 'Editor payments',
    'Travel', 'Accommodation', 'Food', 'Equipment rental', 'Camera maintenance',
    'Album printing', 'Hard drives and storage', 'Office expenses', 'Marketing', 'Miscellaneous'
  )),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  booking_code TEXT,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  vendor_or_recipient TEXT NOT NULL,
  description TEXT NOT NULL,
  receipt_attachment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PROJECTS (Post-Production Workflow Tracker per Booking)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_code TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_code TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'Booking Confirmed' CHECK (current_stage IN (
    'Booking Confirmed', 'Event Scheduled', 'Shoot Completed', 'Data Backup Completed',
    'Photo Culling', 'Photo Editing', 'Album Designing', 'Album Printing',
    'Video Editing', 'Video Review', 'Final Delivery', 'Project Completed'
  )),
  completed_stages JSONB NOT NULL DEFAULT '["Booking Confirmed"]'::jsonb,
  raw_backup_drive TEXT,
  backup_verified BOOLEAN NOT NULL DEFAULT FALSE,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  overall_progress INT NOT NULL DEFAULT 10 CHECK (overall_progress BETWEEN 0 AND 100),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Hold', 'Delayed', 'Completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. TASKS (Parallel Post-Production Tracks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  task_name TEXT NOT NULL,
  workflow_track TEXT NOT NULL CHECK (workflow_track IN (
    'Photography editing', 'Cinematography editing', 'Album designing',
    'Album printing', 'Video production', 'Other custom tasks'
  )),
  assigned_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_staff_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  deadline DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN (
    'Not Started', 'In Progress', 'On Hold', 'Review', 'Completed'
  )),
  internal_notes TEXT,
  file_attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. DELIVERABLES (Internal Tracking Only — No Client Photo Selection)
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_code TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN (
    'Edited photographs', 'Raw photographs', 'Wedding teaser', 'Highlight video',
    'Full wedding film', 'Instagram reels', 'Wedding albums', 'Additional albums', 'Other deliverables'
  )),
  deliverable_name TEXT NOT NULL,
  assigned_editor_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_editor_name TEXT NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Production', 'Ready', 'Delivered')),
  internal_delivery_link TEXT,
  storage_platform TEXT DEFAULT 'Google Drive',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Client agreements', 'Booking contracts', 'Quotations', 'Invoices',
    'Receipts', 'Event documents', 'Vendor bills', 'Business documents', 'Other attachments'
  )),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  booking_code TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size TEXT NOT NULL DEFAULT '240 KB',
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'Owner',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. MESSAGE TEMPLATES (WhatsApp & Communication)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'Contact enquiry', 'Send quotation', 'Booking confirmation',
    'Payment reminder', 'Event schedule', 'Delivery notification', 'Send thank-you message'
  )),
  template_text TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN (
    'Website Enquiry', 'Follow-up Reminder', 'Payment Due',
    'Task Deadline', 'Scheduling Conflict', 'Deliverable Update', 'System'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_path TEXT NOT NULL DEFAULT '/leads',
  entity_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. AUDIT LOGS (Immutable Financial & Operational Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(enquiry_source);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON public.leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_bookings_wedding_date ON public.bookings(wedding_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_deliverables_booking ON public.deliverables(booking_id);

-- ROW LEVEL SECURITY (Internal Authenticated Staff Only)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy helper: Only authenticated internal staff can access CRM tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roles', 'permissions', 'users', 'team_members', 'packages', 'package_services',
    'clients', 'leads', 'lead_activities', 'quotations', 'quotation_items',
    'bookings', 'events', 'invoices', 'payments', 'expenses', 'projects',
    'tasks', 'deliverables', 'documents', 'message_templates', 'notifications', 'audit_logs'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Internal staff access on %I" ON public.%I;
       CREATE POLICY "Internal staff access on %I" ON public.%I
       FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;
