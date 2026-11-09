// ============================================================================
// THE DRK WEDDINGS — CENTRALIZED INTERNAL CLIENT DATABASE
// 360-Degree Customer Profile with 9 Integrated Tabs (Internal Only — No Portal)
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  X,
  Heart,
  FileText,
  IndianRupee,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type { ClientRecord } from '../../types/crm';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatDateTimeIST,
  formatINR,
  getTodayKolkataISO,
} from '../../lib/formatting';
import {
  generateInvoicePDF,
  generatePaymentReceiptPDF,
  generateQuotationPDF,
} from '../../lib/export/pdfAndCsvExporter';

type ProfileTab =
  | 'Overview'
  | 'Booking history'
  | 'Event details'
  | 'Quotations'
  | 'Invoices'
  | 'Payment history'
  | 'Pending payments'
  | 'Documents'
  | 'Communication history';

const PROFILE_TABS: ProfileTab[] = [
  'Overview',
  'Booking history',
  'Event details',
  'Quotations',
  'Invoices',
  'Payment history',
  'Pending payments',
  'Documents',
  'Communication history',
];

export const ClientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    clients,
    bookings,
    events,
    quotations,
    invoices,
    payments,
    documents,
    lead_activities,
    addClient,
    updateClient,
    deleteClient,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('Overview');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  const today = getTodayKolkataISO();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: 'Hazaribagh',
    groom_name: '',
    bride_name: '',
    family_contact_name: '',
    family_contact_phone: '',
    wedding_date: today,
    event_location: '',
    special_requirements: '',
    notes: '',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      full_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      city: 'Hazaribagh',
      groom_name: '',
      bride_name: '',
      family_contact_name: '',
      family_contact_phone: '',
      wedding_date: today,
      event_location: '',
      special_requirements: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      phone: client.phone,
      whatsapp: client.whatsapp,
      email: client.email,
      address: client.address,
      city: client.city,
      groom_name: client.groom_name,
      bride_name: client.bride_name,
      family_contact_name: client.family_contact_name,
      family_contact_phone: client.family_contact_phone,
      wedding_date: client.wedding_date,
      event_location: client.event_location,
      special_requirements: client.special_requirements,
      notes: client.notes,
    });
    setModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        ...formData,
        whatsapp: formData.whatsapp || formData.phone,
      });
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient({ ...editingClient, ...formData });
      }
      setModalOpen(false);
      return;
    }

    const created = addClient({
      ...formData,
      whatsapp: formData.whatsapp || formData.phone,
    });
    setSelectedClient(created);
    setModalOpen(false);
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.client_code.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.groom_name.toLowerCase().includes(q) ||
        c.bride_name.toLowerCase().includes(q) ||
        c.event_location.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  // Linked records for the currently opened 360° Client Profile
  const clientBookings = useMemo(
    () =>
      selectedClient
        ? bookings.filter((b) => b.client_id === selectedClient.id)
        : [],
    [selectedClient, bookings]
  );

  const clientEvents = useMemo(
    () =>
      selectedClient
        ? events.filter(
            (ev) =>
              ev.client_id === selectedClient.id ||
              clientBookings.some((b) => b.id === ev.booking_id)
          )
        : [],
    [selectedClient, events, clientBookings]
  );

  const clientQuotations = useMemo(
    () =>
      selectedClient
        ? quotations.filter(
            (q) =>
              q.client_id === selectedClient.id ||
              q.customer_name.toLowerCase() === selectedClient.full_name.toLowerCase()
          )
        : [],
    [selectedClient, quotations]
  );

  const clientInvoices = useMemo(
    () =>
      selectedClient
        ? invoices.filter((i) => i.client_id === selectedClient.id)
        : [],
    [selectedClient, invoices]
  );

  const clientPayments = useMemo(
    () =>
      selectedClient
        ? payments.filter((p) => p.client_id === selectedClient.id && !p.is_voided)
        : [],
    [selectedClient, payments]
  );

  const clientDocuments = useMemo(
    () =>
      selectedClient
        ? documents.filter((d) => d.client_id === selectedClient.id)
        : [],
    [selectedClient, documents]
  );

  const clientCommunications = useMemo(
    () =>
      selectedClient
        ? lead_activities.filter(
            (a) =>
              a.client_id === selectedClient.id ||
              (selectedClient.source_lead_id && a.lead_id === selectedClient.source_lead_id)
          )
        : [],
    [selectedClient, lead_activities]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Internal Customer Records (No Client Portal)
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Centralized Clients & Couple Profiles
          </h2>
        </div>

        <button onClick={openAddModal} className="drk-btn-primary">
          <Plus className="w-4 h-4 text-[#E6CFA0]" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="argon-card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#77726A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Client ID, couple names, groom, bride, phone, or wedding venue..."
            className="drk-input pl-10"
          />
        </div>
        <span className="text-xs font-bold text-[#77726A] px-2">
          {filteredClients.length} Clients
        </span>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const cBookings = bookings.filter((b) => b.client_id === client.id);
          const totalBilled = cBookings.reduce((s, b) => s + Number(b.total_amount), 0);
          const totalBalance = cBookings.reduce((s, b) => s + Number(b.balance_amount), 0);

          return (
            <div
              key={client.id}
              className="argon-card argon-card-hover p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[#C89B3C]">
                    {client.client_code}
                  </span>
                  <span className="text-[11px] font-semibold text-[#77726A]">
                    Wedding: {formatDateDDMMYYYY(client.wedding_date)}
                  </span>
                </div>

                <h3
                  onClick={() => {
                    setSelectedClient(client);
                    setActiveTab('Overview');
                  }}
                  className="font-serif text-xl font-semibold text-[#141414] hover:text-[#C89B3C] cursor-pointer"
                >
                  {client.full_name}
                </h3>

                <div className="mt-2 flex items-center gap-3 text-xs text-[#4A463F]">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#C89B3C]" />
                    Groom: <strong>{client.groom_name || '—'}</strong> • Bride:{' '}
                    <strong>{client.bride_name || '—'}</strong>
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-[#4A463F]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#77726A]" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#77726A]" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                    <span className="truncate">{client.event_location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E8E3DA]">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">
                      Total Package Value
                    </span>
                    <span className="font-bold text-[#141414] tabular-nums">
                      {formatINR(totalBilled)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[#77726A] block">
                      Pending Balance
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        totalBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {totalBalance > 0 ? formatINR(totalBalance) : 'Settled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setActiveTab('Overview');
                    }}
                    className="flex-1 drk-btn-primary py-2 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Open 360° Profile
                  </button>

                  <a
                    href={buildWhatsAppLink(
                      client.whatsapp || client.phone,
                      `Hello ${client.full_name}! Greetings from THE DRK WEDDINGS.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#25D366] text-white hover:bg-[#1fb858]"
                    title="WhatsApp Client"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => openEditModal(client)}
                    className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                    title="Edit Client"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete client ${client.full_name}?`)) {
                        deleteClient(client.id);
                      }
                    }}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete Client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 360° CLIENT PROFILE MODAL WITH ALL 9 SECTIONS */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-[#FAF8F5] border border-[#E0DBD1] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-[#141414] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#E6CFA0]">
                    {selectedClient.client_code}
                  </span>
                  <span className="text-stone-500">•</span>
                  <span className="text-xs text-stone-300">
                    Wedding Date: {formatDateDDMMYYYY(selectedClient.wedding_date)}
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-white mt-1">
                  {selectedClient.full_name}
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href={buildWhatsAppLink(
                    selectedClient.whatsapp || selectedClient.phone,
                    `Hello ${selectedClient.full_name}! Greetings from THE DRK WEDDINGS.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drk-btn-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <button
                  onClick={() => openEditModal(selectedClient)}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 9 Tabs Navigation */}
            <div className="bg-white border-b border-[#E0DBD1] px-6 flex items-center gap-1 overflow-x-auto">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#C89B3C] text-[#141414]'
                      : 'border-transparent text-[#77726A] hover:text-[#141414]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-[#E0DBD1] space-y-3 text-xs">
                    <h4 className="font-serif text-lg text-[#141414] border-b border-[#E8E3DA] pb-2">
                      Couple & Family Contact Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#77726A] block">Groom's Name</span>
                        <span className="font-bold text-[#141414]">{selectedClient.groom_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Bride's Name</span>
                        <span className="font-bold text-[#141414]">{selectedClient.bride_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Phone Number</span>
                        <span className="font-bold text-[#141414]">{selectedClient.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">WhatsApp Number</span>
                        <span className="font-bold text-[#141414]">{selectedClient.whatsapp}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Email</span>
                        <span className="font-bold text-[#141414]">{selectedClient.email || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Address</span>
                        <span className="font-bold text-[#141414]">{selectedClient.address || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Family Contact Name</span>
                        <span className="font-bold text-[#141414]">
                          {selectedClient.family_contact_name || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#77726A] block">Family Contact Phone</span>
                        <span className="font-bold text-[#141414]">
                          {selectedClient.family_contact_phone || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E0DBD1] space-y-3 text-xs">
                    <h4 className="font-serif text-lg text-[#141414] border-b border-[#E8E3DA] pb-2">
                      Celebration & Editorial Requirements
                    </h4>
                    <div>
                      <span className="text-[#77726A] block">Primary Wedding Date</span>
                      <span className="font-bold text-[#141414]">
                        {formatDateDDMMYYYY(selectedClient.wedding_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#77726A] block">Event Location / Palace Venue</span>
                      <span className="font-bold text-[#141414]">{selectedClient.event_location}</span>
                    </div>
                    <div>
                      <span className="text-[#77726A] block">Special Requirements</span>
                      <p className="text-[#141414] mt-1 leading-relaxed">
                        {selectedClient.special_requirements || 'None specified.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#77726A] block">Internal Studio Notes</span>
                      <p className="text-[#4A463F] mt-1 leading-relaxed">
                        {selectedClient.notes || 'No notes.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Booking history' && (
                <div className="space-y-3">
                  {clientBookings.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No bookings created for this client yet.
                    </div>
                  ) : (
                    clientBookings.map((bk) => (
                      <div
                        key={bk.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#C89B3C]">{bk.booking_code}</div>
                          <div className="font-serif text-lg font-semibold text-[#141414]">
                            {bk.package_name}
                          </div>
                          <div className="text-[#77726A]">
                            Wedding Date: {formatDateDDMMYYYY(bk.wedding_date)} • {bk.event_location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-[#141414]">
                            Total: {formatINR(bk.total_amount)}
                          </div>
                          <div className="text-emerald-700 font-semibold">
                            Paid: {formatINR(bk.paid_amount)}
                          </div>
                          <div className="text-amber-700 font-semibold">
                            Balance: {formatINR(bk.balance_amount)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Event details' && (
                <div className="space-y-3">
                  {clientEvents.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No events scheduled under this client yet.
                    </div>
                  ) : (
                    clientEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-[#C89B3C]">
                            {ev.event_type} • {formatDateDDMMYYYY(ev.event_date)} ({ev.start_time} – {ev.end_time})
                          </span>
                          <div className="font-serif text-base font-semibold text-[#141414]">
                            {ev.event_name}
                          </div>
                          <div className="text-[#77726A]">
                            Venue: {ev.venue}, {ev.location}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E0DBD1] font-bold">
                          {ev.completion_status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Quotations' && (
                <div className="space-y-3">
                  {clientQuotations.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No quotations recorded for this client.
                    </div>
                  ) : (
                    clientQuotations.map((qt) => (
                      <div
                        key={qt.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#C89B3C]">{qt.quotation_number}</div>
                          <div className="font-semibold text-[#141414]">{qt.package_name}</div>
                          <div className="text-[#77726A]">
                            Total: {formatINR(qt.total_amount)} • Status: <strong>{qt.status}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => generateQuotationPDF(qt)}
                          className="drk-btn-secondary py-2 px-3"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Invoices' && (
                <div className="space-y-3">
                  {clientInvoices.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No invoices issued for this client.
                    </div>
                  ) : (
                    clientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#141414]">{inv.invoice_number}</div>
                          <div className="text-[#77726A]">
                            Issued: {formatDateDDMMYYYY(inv.issue_date)} • Due:{' '}
                            {formatDateDDMMYYYY(inv.due_date)}
                          </div>
                          <div className="font-bold text-[#141414] mt-1">
                            Total: {formatINR(inv.total_amount)} | Paid: {formatINR(inv.paid_amount)} |
                            Balance: {formatINR(inv.balance_amount)}
                          </div>
                        </div>
                        <button
                          onClick={() => generateInvoicePDF(inv, clientBookings[0], clientPayments)}
                          className="drk-btn-secondary py-2 px-3"
                        >
                          <Download className="w-3.5 h-3.5" /> Invoice PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Payment history' && (
                <div className="space-y-3">
                  {clientPayments.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No payments recorded yet.
                    </div>
                  ) : (
                    clientPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-emerald-700">
                            {pay.payment_code} ({pay.payment_type})
                          </div>
                          <div className="font-bold text-sm text-[#141414]">
                            {formatINR(pay.amount)} via {pay.payment_method}
                          </div>
                          <div className="text-[#77726A]">
                            Date: {formatDateDDMMYYYY(pay.payment_date)} • Ref:{' '}
                            {pay.transaction_reference} • Remaining Balance:{' '}
                            {formatINR(pay.remaining_balance_after)}
                          </div>
                        </div>
                        <button
                          onClick={() => generatePaymentReceiptPDF(pay)}
                          className="drk-btn-secondary py-2 px-3"
                        >
                          <Download className="w-3.5 h-3.5" /> Receipt PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Pending payments' && (
                <div className="space-y-3">
                  {clientBookings.filter((b) => b.balance_amount > 0).length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                      All bookings for this client are 100% settled!
                    </div>
                  ) : (
                    clientBookings
                      .filter((b) => b.balance_amount > 0)
                      .map((bk) => (
                        <div
                          key={bk.id}
                          className="p-5 bg-amber-50/70 rounded-xl border border-amber-300 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-amber-900 text-sm">
                              Booking {bk.booking_code} — Outstanding Balance:{' '}
                              {formatINR(bk.balance_amount)}
                            </div>
                            <div className="text-amber-800 mt-1">
                              Package Total: {formatINR(bk.total_amount)} • Paid So Far:{' '}
                              {formatINR(bk.paid_amount)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={buildWhatsAppLink(
                                selectedClient.whatsapp || selectedClient.phone,
                                `Hello ${selectedClient.full_name}, this is a gentle reminder from THE DRK WEDDINGS regarding the remaining balance of ${formatINR(bk.balance_amount)} for Booking ${bk.booking_code}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="drk-btn-whatsapp"
                            >
                              Send Reminder
                            </a>
                            <button
                              onClick={() => {
                                setSelectedClient(null);
                                navigate('/invoices?action=payment');
                              }}
                              className="drk-btn-primary py-2 px-3"
                            >
                              Record Payment
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeTab === 'Documents' && (
                <div className="space-y-3">
                  {clientDocuments.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No documents linked to this client yet.
                    </div>
                  ) : (
                    clientDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#C89B3C]" />
                          <div>
                            <div className="font-bold text-[#141414]">{doc.title}</div>
                            <div className="text-[#77726A]">
                              {doc.category} • {doc.file_name} ({doc.file_size})
                            </div>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="drk-btn-secondary py-1.5 px-3"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'Communication history' && (
                <div className="space-y-3">
                  {clientCommunications.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E0DBD1] text-xs text-[#77726A]">
                      No communication entries logged yet.
                    </div>
                  ) : (
                    clientCommunications.map((act) => (
                      <div
                        key={act.id}
                        className="p-4 bg-white rounded-xl border border-[#E0DBD1] text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#C89B3C]">
                          <span>
                            {act.activity_type} • {act.performed_by}
                          </span>
                          <span className="text-[#77726A]">{formatDateTimeIST(act.created_at)}</span>
                        </div>
                        <div className="font-bold text-[#141414] mt-1">{act.summary}</div>
                        <div className="text-[#4A463F] mt-0.5">{act.details}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CLIENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  INTERNAL CLIENT DIRECTORY
                </span>
                <h3 className="font-serif text-xl text-white">
                  {editingClient ? `Edit Client ${editingClient.client_code}` : 'Add New Client Record'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="drk-label">Couple / Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Mudit Singhania & Muskan Agarwal"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Groom's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.groom_name}
                    onChange={(e) => setFormData({ ...formData, groom_name: e.target.value })}
                    placeholder="Mudit Singhania"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Bride's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.bride_name}
                    onChange={(e) => setFormData({ ...formData, bride_name: e.target.value })}
                    placeholder="Muskan Agarwal"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Wedding Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.wedding_date}
                    onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                        whatsapp: formData.whatsapp || e.target.value,
                      })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Family Contact Name</label>
                  <input
                    type="text"
                    value={formData.family_contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, family_contact_name: e.target.value })
                    }
                    placeholder="Father / Brother Name"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Family Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.family_contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, family_contact_phone: e.target.value })
                    }
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Wedding Venue / Event Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.event_location}
                    onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                    placeholder="Royal Heritage Palace, Jaipur / Hazaribagh"
                    className="drk-input"
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Special Photography & Cinema Requirements</label>
                <textarea
                  rows={2}
                  value={formData.special_requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, special_requirements: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div>
                <label className="drk-label">Internal Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="drk-input"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  {editingClient ? 'Save Client Changes' : 'Create Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
