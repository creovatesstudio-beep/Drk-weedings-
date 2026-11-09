import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Code2,
  Copy,
  Edit3,
  ExternalLink,
  Globe,
  Info,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatINR,
  getTodayKolkataISO,
  interpolateTemplate,
} from '../../lib/formatting';
import type {
  MessageTemplateRecord,
  WhatsAppActionType,
} from '../../types/crm';

const WHATSAPP_ACTIONS: WhatsAppActionType[] = [
  'Contact enquiry',
  'Send quotation',
  'Booking confirmation',
  'Payment reminder',
  'Event schedule',
  'Delivery notification',
  'Send thank-you message',
];

export const CommunicationPage: React.FC = () => {
  const {
    leads,
    clients,
    bookings,
    quotations,
    deliverables,
    message_templates,
    lead_activities,
    addLeadActivity,
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    ingestWebsiteEnquiry,
  } = useData();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'composer' | 'templates' | 'website_webhook'>(
    'composer'
  );

  // Quick WhatsApp Composer State
  const [selectedAction, setSelectedAction] = useState<WhatsAppActionType>('Contact enquiry');
  const [recipientType, setRecipientType] = useState<'lead' | 'client' | 'booking'>('lead');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(leads[0]?.id || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [lastDispatchedStatus, setLastDispatchedStatus] = useState<string | null>(null);

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplateRecord | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    action_type: 'Contact enquiry' as WhatsAppActionType,
    template_text: '',
    variables_str: 'customer_name, event_date, package_name',
  });

  // Website Enquiry Simulator State
  const [webhookForm, setWebhookForm] = useState({
    customer_name: 'Rohan & Meera Singhania',
    phone: '+91 98352 44190',
    email: 'rohan.singhania@gmail.com',
    event_type: 'Royal 3-Day Wedding & Sangeet',
    event_date: '2026-02-14',
    event_location: 'Mayfair Lagoon, Ranchi / Hazaribagh',
    estimated_budget: 245000,
    interested_package_name: 'The Royal Heritage Cinema & Candid Collection',
    event_days: 3,
    notes: 'Submitted via https://thedrkweddings.pages.dev/#contact form. Looking for drone + 2 candid photographers.',
  });
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Resolve active template for selected action
  const activeTemplate = useMemo(
    () =>
      message_templates.find((t) => t.action_type === selectedAction) ||
      message_templates[0] ||
      null,
    [message_templates, selectedAction]
  );

  // Resolve recipient variables
  const recipientDetails = useMemo(() => {
    if (recipientType === 'lead') {
      const lead = leads.find((l) => l.id === selectedRecipientId) || leads[0];
      return {
        id: lead?.id || '',
        lead_id: lead?.id,
        client_id: lead?.converted_client_id,
        name: lead?.customer_name || 'Valued Guest',
        phone: lead?.whatsapp || lead?.phone || '+91 99345 04101',
        event_date: lead ? formatDateDDMMYYYY(lead.event_date) : 'TBD',
        event_location: lead?.event_location || 'Hazaribagh',
        package_name: lead?.interested_package_name || 'Signature Wedding Collection',
        total_amount: formatINR(lead?.estimated_budget || 150000),
        balance_amount: formatINR(lead?.estimated_budget || 150000),
        booking_code: lead?.lead_code || 'ENQ-DRK',
        delivery_link: 'https://drive.google.com/drive/folders/drk-weddings',
      };
    }

    if (recipientType === 'booking') {
      const bk = bookings.find((b) => b.id === selectedRecipientId) || bookings[0];
      const del = deliverables.find((d) => d.booking_id === bk?.id);
      return {
        id: bk?.id || '',
        lead_id: bk?.lead_id,
        client_id: bk?.client_id,
        name: bk?.client_name || 'Valued Client',
        phone: bk?.client_phone || '+91 99345 04101',
        event_date: bk ? formatDateDDMMYYYY(bk.wedding_date) : 'TBD',
        event_location: bk?.event_location || 'Hazaribagh',
        package_name: bk?.package_name || 'Royal Wedding Package',
        total_amount: formatINR(bk?.total_amount || 185000),
        advance_amount: formatINR(bk?.advance_amount || 50000),
        balance_amount: formatINR(bk?.balance_amount || 0),
        booking_code: bk?.booking_code || 'BK-DRK',
        delivery_link:
          del?.internal_delivery_link || 'https://drive.google.com/drive/folders/drk-weddings',
      };
    }

    const cl = clients.find((c) => c.id === selectedRecipientId) || clients[0];
    const clBooking = bookings.find((b) => b.client_id === cl?.id);
    return {
      id: cl?.id || '',
      lead_id: cl?.source_lead_id,
      client_id: cl?.id,
      name: cl?.full_name || 'Valued Client',
      phone: cl?.whatsapp || cl?.phone || '+91 99345 04101',
      event_date: cl ? formatDateDDMMYYYY(cl.wedding_date) : 'TBD',
      event_location: cl?.event_location || 'Hazaribagh',
      package_name: clBooking?.package_name || 'Signature Wedding Package',
      total_amount: formatINR(clBooking?.total_amount || 180000),
      balance_amount: formatINR(clBooking?.balance_amount || 0),
      booking_code: clBooking?.booking_code || cl?.client_code || 'CL-DRK',
      delivery_link: 'https://drive.google.com/drive/folders/drk-weddings',
    };
  }, [recipientType, selectedRecipientId, leads, bookings, clients, deliverables]);

  // Compute interpolated message preview
  const interpolatedPreview = useMemo(() => {
    if (customMessage.trim()) return customMessage;
    if (!activeTemplate) return '';
    return interpolateTemplate(activeTemplate.template_text, {
      customer_name: recipientDetails.name,
      client_name: recipientDetails.name,
      event_date: recipientDetails.event_date,
      wedding_date: recipientDetails.event_date,
      event_location: recipientDetails.event_location,
      package_name: recipientDetails.package_name,
      total_amount: recipientDetails.total_amount,
      amount: recipientDetails.total_amount,
      balance_amount: recipientDetails.balance_amount,
      balance: recipientDetails.balance_amount,
      booking_code: recipientDetails.booking_code,
      delivery_link: recipientDetails.delivery_link,
    });
  }, [customMessage, activeTemplate, recipientDetails]);

  const handleDispatchWhatsApp = () => {
    const waUrl = buildWhatsAppLink(recipientDetails.phone, interpolatedPreview);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    addLeadActivity({
      lead_id: recipientDetails.lead_id || leads[0]?.id || 'lead-1',
      client_id: recipientDetails.client_id,
      activity_type: 'WhatsApp',
      summary: `WhatsApp ${selectedAction} opened for ${recipientDetails.name}`,
      details: `${interpolatedPreview}\n\n[Dispatch Status: Opened in WhatsApp Click-to-Chat — Not verified as delivered until confirmed by recipient or WhatsApp Business API]`,
      performed_by: currentUser?.full_name || 'Dheeraj Raj',
    });

    setLastDispatchedStatus(
      `Opened in WhatsApp for ${recipientDetails.name} (${recipientDetails.phone}). Logged as "Click-to-Chat Dispatched" (awaiting manual/provider confirmation).`
    );
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      action_type: selectedAction,
      template_text:
        'Namaste {{customer_name}}, greetings from THE DRK WEDDINGS (Dipugarha, Hazaribagh)! Regarding your celebration on {{event_date}} at {{event_location}}...',
      variables_str: 'customer_name, event_date, event_location, package_name, balance_amount',
    });
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (tpl: MessageTemplateRecord) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      action_type: tpl.action_type,
      template_text: tpl.template_text,
      variables_str: tpl.variables.join(', '),
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const vars = templateForm.variables_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingTemplate) {
      updateMessageTemplate(editingTemplate.id, {
        name: templateForm.name,
        action_type: templateForm.action_type,
        template_text: templateForm.template_text,
        variables: vars,
      });
    } else {
      addMessageTemplate({
        name: templateForm.name,
        action_type: templateForm.action_type,
        template_text: templateForm.template_text,
        variables: vars,
        is_active: true,
      });
    }
    setShowTemplateModal(false);
  };

  const handleSimulateWebsiteWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Also post to the Vite local API endpoint if running in dev server
      await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookForm),
      }).catch(() => null);
    } catch {
      // Continue with direct CRM ingestion
    }

    const res = ingestWebsiteEnquiry(webhookForm);
    setWebhookResult(
      res.duplicateMerged
        ? `Duplicate Phone Detected! Existing Lead (${res.lead.lead_code} — ${res.lead.customer_name}) was updated and owner notified.`
        : `New Website Lead Created! Code: ${res.lead.lead_code} (${res.lead.customer_name}) with Source="Website", Status="New", and Owner Notification triggered.`
    );
  };

  const integrationCodeSnippet = `// Non-destructive Website Contact Form Bridge for https://thedrkweddings.pages.dev/
// Add inside the contact form submit handler alongside existing WhatsApp behavior:
fetch('https://your-crm-domain-or-supabase.functions.supabase.co/website-enquiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_name: formData.name,
    phone: formData.phone,
    email: formData.email,
    event_date: formData.date,
    event_location: formData.venue,
    event_type: 'Wedding Photography & Cinematography',
    notes: formData.message
  })
}).catch(console.error);`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <MessageSquare className="h-3.5 w-3.5 text-gold-400" />
              Studio WhatsApp & Website Webhook Hub
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            WhatsApp Communication & Website Integration
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Dispatch templated WhatsApp messages across 7 workflow actions and manage automatic lead capture from thedrkweddings.pages.dev.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('composer')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'composer'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            WhatsApp Quick Dispatch
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'templates'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            Message Templates ({message_templates.length})
          </button>
          <button
            onClick={() => setActiveTab('website_webhook')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'website_webhook'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Website Enquiry Webhook
          </button>
        </div>
      </div>

      {/* Honest Delivery Status Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div>
          <span className="font-bold">Transparent WhatsApp Dispatch Policy: </span>
          Messages opened via WhatsApp Web / Desktop are logged as{' '}
          <span className="underline font-semibold">Click-to-Chat Dispatched</span> and are never
          falsely marked as &ldquo;Delivered&rdquo; unless confirmed by a live WhatsApp Cloud API
          webhook receipt.
        </div>
      </div>

      {/* TAB 1: WHATSAPP QUICK COMPOSER & LOG */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Composer */}
          <div className="argon-card space-y-5 p-6 lg:col-span-7">
            <h2 className="font-serif text-lg font-bold text-obsidian-900">
              7-Action Quick WhatsApp Dispatcher
            </h2>

            {/* 7 Quick Action Pills */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-obsidian-500">
                1. Choose Communication Action
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {WHATSAPP_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setSelectedAction(action);
                      setCustomMessage('');
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      selectedAction === action
                        ? 'bg-obsidian-900 text-gold-300 shadow-sm'
                        : 'border border-obsidian-200 bg-white text-obsidian-700 hover:bg-obsidian-50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Selector */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  2. Record Type
                </label>
                <select
                  value={recipientType}
                  onChange={(e) => {
                    const nextType = e.target.value as 'lead' | 'client' | 'booking';
                    setRecipientType(nextType);
                    if (nextType === 'lead') setSelectedRecipientId(leads[0]?.id || '');
                    if (nextType === 'client') setSelectedRecipientId(clients[0]?.id || '');
                    if (nextType === 'booking') setSelectedRecipientId(bookings[0]?.id || '');
                  }}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                >
                  <option value="lead">Lead / Enquiry</option>
                  <option value="booking">Wedding Booking</option>
                  <option value="client">Client Profile</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-obsidian-700">
                  3. Select Recipient
                </label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                >
                  {recipientType === 'lead' &&
                    leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lead_code} — {l.customer_name} ({l.phone})
                      </option>
                    ))}
                  {recipientType === 'booking' &&
                    bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} — {b.client_name} (Bal: {formatINR(b.balance_amount)})
                      </option>
                    ))}
                  {recipientType === 'client' &&
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.client_code} — {c.full_name} ({c.phone})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Interpolated Message Preview & Override */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-obsidian-700">
                  4. Message Preview (Auto-filled from template — editable)
                </label>
                {customMessage && (
                  <button
                    type="button"
                    onClick={() => setCustomMessage('')}
                    className="text-[11px] font-semibold text-gold-700 hover:underline"
                  >
                    Reset to Default Template
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={interpolatedPreview}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-obsidian-200 bg-obsidian-50/50 p-4 text-sm text-obsidian-900 focus:border-gold-500 focus:bg-white focus:outline-none"
              />
            </div>

            {lastDispatchedStatus && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                {lastDispatchedStatus}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-obsidian-100 pt-4">
              <div className="text-xs text-obsidian-500">
                Target WhatsApp: <strong className="text-obsidian-900">{recipientDetails.phone}</strong>
              </div>
              <button
                type="button"
                onClick={handleDispatchWhatsApp}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
                Open in WhatsApp & Log Activity
              </button>
            </div>
          </div>

          {/* Right Communication History Feed */}
          <div className="argon-card flex flex-col justify-between p-6 lg:col-span-5">
            <div>
              <h2 className="font-serif text-lg font-bold text-obsidian-900">
                Recent Communication & Dispatch Log
              </h2>
              <p className="text-xs text-obsidian-500">
                Chronological history of WhatsApp dispatches, calls, and website submissions.
              </p>

              <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {lead_activities
                  .filter(
                    (a) =>
                      a.activity_type === 'WhatsApp' ||
                      a.activity_type === 'Call' ||
                      a.activity_type === 'Website Submission'
                  )
                  .slice(0, 15)
                  .map((act) => (
                    <div
                      key={act.id}
                      className="rounded-xl border border-obsidian-100 bg-obsidian-50/50 p-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-obsidian-900 px-2.5 py-0.5 text-[10px] font-semibold text-gold-300">
                          {act.activity_type}
                        </span>
                        <span className="text-[11px] text-obsidian-400">
                          {formatDateDDMMYYYY(act.created_at)} • {act.performed_by}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold text-obsidian-900">{act.summary}</p>
                      <p className="mt-1 whitespace-pre-line text-obsidian-600 line-clamp-3">
                        {act.details}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REUSABLE MESSAGE TEMPLATES MANAGER */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-obsidian-500">
              Manage reusable WhatsApp templates with dynamic placeholders like{' '}
              <code className="rounded bg-obsidian-100 px-1.5 py-0.5 font-mono text-obsidian-800">
                {'{{customer_name}}'}
              </code>
              ,{' '}
              <code className="rounded bg-obsidian-100 px-1.5 py-0.5 font-mono text-obsidian-800">
                {'{{event_date}}'}
              </code>
              ,{' '}
              <code className="rounded bg-obsidian-100 px-1.5 py-0.5 font-mono text-obsidian-800">
                {'{{balance_amount}}'}
              </code>
              .
            </p>
            <button
              onClick={handleOpenAddTemplate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian-900 px-4 py-2 text-xs font-semibold text-gold-300"
            >
              <Plus className="h-4 w-4" />
              Create New Template
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {message_templates.map((tpl) => (
              <div
                key={tpl.id}
                className="argon-card flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      {tpl.action_type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="rounded p-1.5 text-obsidian-500 hover:bg-obsidian-100"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMessageTemplate(tpl.id)}
                        className="rounded p-1.5 text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-2 font-serif text-base font-bold text-obsidian-900">
                    {tpl.name}
                  </h3>
                  <p className="mt-2 whitespace-pre-line rounded-xl bg-obsidian-50 p-3 text-xs text-obsidian-700">
                    {tpl.template_text}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 pt-2">
                  {tpl.variables.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-obsidian-100 px-2 py-0.5 font-mono text-[10px] text-obsidian-600"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE WEBSITE ENQUIRY INTEGRATION (thedrkweddings.pages.dev) */}
      {activeTab === 'website_webhook' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Live Webhook Simulator */}
          <div className="argon-card space-y-4 p-6 lg:col-span-6">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-gold-600" />
              <h2 className="font-serif text-lg font-bold text-obsidian-900">
                Simulate Live Website Enquiry Submission
              </h2>
            </div>
            <p className="text-xs text-obsidian-500">
              Test automatic lead capture from{' '}
              <a
                href="https://thedrkweddings.pages.dev/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-700 underline"
              >
                https://thedrkweddings.pages.dev/
              </a>
              . Submitting below triggers{' '}
              <code className="font-mono text-obsidian-800">POST /api/public/enquiries</code>,
              sets Source to <strong>Website</strong>, Status to <strong>New</strong>, checks for
              duplicate phone numbers, and alerts the owner in the top notification bar.
            </p>

            <form onSubmit={handleSimulateWebsiteWebhook} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Couple / Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={webhookForm.customer_name}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, customer_name: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={webhookForm.phone}
                    onChange={(e) => setWebhookForm({ ...webhookForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={webhookForm.event_date}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, event_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Estimated Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={webhookForm.estimated_budget}
                    onChange={(e) =>
                      setWebhookForm({
                        ...webhookForm,
                        estimated_budget: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={webhookForm.event_location}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, event_location: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Customer Message
                </label>
                <textarea
                  rows={2}
                  value={webhookForm.notes}
                  onChange={(e) => setWebhookForm({ ...webhookForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              {webhookResult && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                  {webhookResult}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-obsidian-900 py-2.5 text-xs font-semibold text-gold-300 shadow-sm hover:bg-obsidian-800"
              >
                Trigger Website Enquiry Webhook Into CRM
              </button>
            </form>
          </div>

          {/* Copy-Ready Website Snippet & Edge Function Info */}
          <div className="argon-card space-y-4 p-6 lg:col-span-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-gold-600" />
                <h2 className="font-serif text-lg font-bold text-obsidian-900">
                  Public Website Webhook Connector
                </h2>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(integrationCodeSnippet);
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-obsidian-100 px-3 py-1.5 text-xs font-semibold text-obsidian-800 hover:bg-obsidian-200"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedSnippet ? 'Copied!' : 'Copy Snippet'}
              </button>
            </div>

            <p className="text-xs text-obsidian-500">
              Non-destructive webhook snippet for{' '}
              <code className="font-mono text-obsidian-800">
                https://thedrkweddings.pages.dev/
              </code>
              . Preserves your existing public website design and WhatsApp redirection while
              silently pushing every form submission into the CRM.
            </p>

            <pre className="overflow-x-auto rounded-2xl bg-obsidian-950 p-4 font-mono text-[11px] leading-relaxed text-gold-200">
              {integrationCodeSnippet}
            </pre>

            <div className="rounded-xl border border-obsidian-100 bg-obsidian-50 p-4 text-xs text-obsidian-600">
              <p className="font-semibold text-obsidian-900">Included Backend Endpoints:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                <li>
                  Local Dev Server Endpoint: <code>POST /api/public/enquiries</code> (configured in{' '}
                  <code>vite.config.ts</code>)
                </li>
                <li>
                  Production Supabase Edge Function:{' '}
                  <code>supabase/functions/website-enquiry/index.ts</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {editingTemplate ? 'Edit WhatsApp Template' : 'New WhatsApp Message Template'}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Action Category *
                </label>
                <select
                  value={templateForm.action_type}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      action_type: e.target.value as WhatsAppActionType,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                >
                  {WHATSAPP_ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Template Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={templateForm.template_text}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, template_text: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Placeholders (comma-separated)
                </label>
                <input
                  type="text"
                  value={templateForm.variables_str}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, variables_str: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
