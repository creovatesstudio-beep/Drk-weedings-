// ============================================================================
// THE DRK WEDDINGS — LEAD & ENQUIRY MANAGEMENT MODULE
// Drag-and-Drop Kanban Pipeline, Table View, Duplicate Prevention, Overdue
// Follow-up Highlights, Communication History & 1-Click Client/Booking Conversion
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  AlertCircle,
  UserPlus,
  HeartHandshake,
  Edit3,
  Trash2,
  X,
  Clock,
  Send,
  Globe,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type { LeadRecord, LeadSource, LeadStatus } from '../../types/crm';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatDateTimeIST,
  formatINR,
  getTodayKolkataISO,
  isDateOverdue,
} from '../../lib/formatting';

const LEAD_SOURCES: LeadSource[] = [
  'Website',
  'WhatsApp',
  'Instagram',
  'Facebook',
  'Phone calls',
  'Referrals',
  'Walk-in customers',
  'Other sources',
];

const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up Required',
  'Quotation Sent',
  'Negotiation',
  'Confirmed',
  'Lost',
  'Not Interested',
];

const STATUS_BADGE_MAP: Record<LeadStatus, string> = {
  New: 'bg-blue-50 text-blue-800 border-blue-200',
  Contacted: 'bg-stone-100 text-stone-800 border-stone-300',
  'Follow-up Required': 'bg-amber-50 text-amber-800 border-amber-300',
  'Quotation Sent': 'bg-purple-50 text-purple-800 border-purple-200',
  Negotiation: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Lost: 'bg-red-50 text-red-800 border-red-200',
  'Not Interested': 'bg-stone-100 text-stone-500 border-stone-200',
};

export const LeadsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    leads,
    lead_activities,
    packages,
    team_members,
    addLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    addLeadActivity,
    convertLeadToClient,
    convertLeadToBooking,
  } = useData();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Activity note state inside lead detail drawer
  const [activityType, setActivityType] = useState<'Note' | 'Call' | 'WhatsApp' | 'Meeting'>('Call');
  const [activitySummary, setActivitySummary] = useState('');
  const [activityDetails, setActivityDetails] = useState('');

  const today = getTodayKolkataISO();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    groom_name: '',
    bride_name: '',
    event_type: 'Wedding',
    event_date: tomorrow,
    event_location: 'Hazaribagh, Jharkhand',
    estimated_budget: 185000,
    interested_package_id: packages[0]?.id || '',
    interested_package_name: packages[0]?.name || 'Classic Royal Collection (3-Day Signature)',
    event_days: 3,
    enquiry_source: 'WhatsApp' as LeadSource,
    enquiry_date: today,
    follow_up_date: tomorrow,
    assigned_staff_id: team_members[0]?.id || 'tm-1',
    assigned_staff_name: team_members[0]?.full_name || 'Deepak Raj',
    notes: '',
    status: 'New' as LeadStatus,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddModal = () => {
    setEditingLead(null);
    setFormError(null);
    setFormData({
      customer_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      groom_name: '',
      bride_name: '',
      event_type: 'Wedding',
      event_date: tomorrow,
      event_location: 'Hazaribagh, Jharkhand',
      estimated_budget: 185000,
      interested_package_id: packages[2]?.id || packages[0]?.id || '',
      interested_package_name: packages[2]?.name || 'Classic Royal Collection (3-Day Signature)',
      event_days: 3,
      enquiry_source: 'WhatsApp',
      enquiry_date: today,
      follow_up_date: tomorrow,
      assigned_staff_id: team_members[0]?.id || 'tm-1',
      assigned_staff_name: team_members[0]?.full_name || 'Deepak Raj',
      notes: '',
      status: 'New',
    });
    setModalOpen(true);
  };

  const openEditModal = (lead: LeadRecord) => {
    setEditingLead(lead);
    setFormError(null);
    setFormData({
      customer_name: lead.customer_name,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      groom_name: lead.groom_name || '',
      bride_name: lead.bride_name || '',
      event_type: lead.event_type,
      event_date: lead.event_date,
      event_location: lead.event_location,
      estimated_budget: lead.estimated_budget,
      interested_package_id: lead.interested_package_id || '',
      interested_package_name: lead.interested_package_name,
      event_days: lead.event_days,
      enquiry_source: lead.enquiry_source,
      enquiry_date: lead.enquiry_date,
      follow_up_date: lead.follow_up_date,
      assigned_staff_id: lead.assigned_staff_id || 'tm-1',
      assigned_staff_name: lead.assigned_staff_name,
      notes: lead.notes,
      status: lead.status,
    });
    setModalOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.customer_name.trim() || !formData.phone.trim()) {
      setFormError('Customer name and phone number are required.');
      return;
    }

    if (editingLead) {
      updateLead(editingLead.id, {
        ...formData,
        whatsapp: formData.whatsapp || formData.phone,
      });
      showToast(`Updated lead ${editingLead.lead_code} (${formData.customer_name}).`);
      setModalOpen(false);
      return;
    }

    const result = addLead({
      ...formData,
      whatsapp: formData.whatsapp || formData.phone,
    });

    if (!result.ok && result.duplicate) {
      setFormError(
        `Duplicate Prevention Alert: Phone number ${formData.phone} already exists under Lead ${result.duplicate.lead_code} (${result.duplicate.customer_name}).`
      );
      return;
    }

    showToast(`Created Lead ${result.lead?.lead_code} (${formData.customer_name}).`);
    setModalOpen(false);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (sourceFilter !== 'ALL' && l.enquiry_source !== sourceFilter) return false;
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      if (dateFilter && l.event_date !== dateFilter && l.enquiry_date !== dateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.customer_name.toLowerCase().includes(q) ||
          l.lead_code.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.event_location.toLowerCase().includes(q) ||
          l.interested_package_name.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, sourceFilter, statusFilter, dateFilter, searchQuery]);

  const overdueFollowUpsCount = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.status !== 'Confirmed' &&
          l.status !== 'Lost' &&
          l.status !== 'Not Interested' &&
          isDateOverdue(l.follow_up_date)
      ).length,
    [leads]
  );

  const handleConvertClient = (lead: LeadRecord) => {
    const client = convertLeadToClient(lead.id);
    if (client) {
      showToast(`Converted ${lead.customer_name} into Client ${client.client_code}!`);
    }
  };

  const handleConvertBooking = (lead: LeadRecord) => {
    const booking = convertLeadToBooking(lead.id, Math.round(lead.estimated_budget * 0.2) || 30000);
    if (booking) {
      showToast(`Converted ${lead.customer_name} into Confirmed Booking ${booking.booking_code}!`);
      navigate('/bookings');
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activitySummary.trim()) return;
    addLeadActivity({
      lead_id: selectedLead.id,
      activity_type: activityType,
      summary: activitySummary.trim(),
      details: activityDetails.trim(),
      performed_by: 'Deepak Raj (Owner)',
    });
    setActivitySummary('');
    setActivityDetails('');
    showToast('Logged communication activity.');
  };

  const selectedLeadActivities = useMemo(
    () =>
      selectedLead
        ? lead_activities.filter((a) => a.lead_id === selectedLead.id)
        : [],
    [selectedLead, lead_activities]
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white border border-[#C89B3C] px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#C89B3C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
              Lead & Enquiry Pipeline
            </span>
            {overdueFollowUpsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="w-3 h-3" /> {overdueFollowUpsCount} Overdue Follow-ups
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Enquiries, Follow-ups & Kanban Conversion
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-[#E0DBD1] bg-white p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#77726A] hover:text-[#141414]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#77726A] hover:text-[#141414]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table View
            </button>
          </div>

          <button onClick={openAddModal} className="drk-btn-primary">
            <Plus className="w-4 h-4 text-[#E6CFA0]" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="argon-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-[#77726A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search couple name, phone, city, package, lead ID..."
            className="drk-input pl-10"
          />
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="drk-select"
          >
            <option value="ALL">All Enquiry Sources (8)</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src} value={src}>
                Source: {src}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="drk-select"
          >
            <option value="ALL">All Pipeline Statuses (8)</option>
            {LEAD_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="drk-input"
            title="Filter by Event Date or Enquiry Date"
          />
          {(sourceFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter || searchQuery) && (
            <button
              onClick={() => {
                setSourceFilter('ALL');
                setStatusFilter('ALL');
                setDateFilter('');
                setSearchQuery('');
              }}
              className="px-2.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KANBAN PIPELINE WITH DRAG-AND-DROP */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUSES.map((statusCol) => {
            const colLeads = filteredLeads.filter((l) => l.status === statusCol);
            const colTotalValue = colLeads.reduce((s, l) => s + Number(l.estimated_budget || 0), 0);

            return (
              <div
                key={statusCol}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedLeadId) {
                    updateLeadStatus(draggedLeadId, statusCol);
                    setDraggedLeadId(null);
                    showToast(`Moved lead to "${statusCol}" column.`);
                  }
                }}
                className="w-80 shrink-0 bg-[#FAF8F5] border border-[#E0DBD1] rounded-xl flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-[#E0DBD1] bg-white rounded-t-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGE_MAP[statusCol]}`}
                      >
                        {statusCol}
                      </span>
                      <span className="text-xs font-extrabold text-[#141414]">
                        ({colLeads.length})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#77726A] font-medium mt-1">
                      Est. Value: {formatINR(colTotalValue)}
                    </div>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colLeads.length === 0 ? (
                    <div className="py-10 text-center text-xs text-stone-400 border border-dashed border-[#E0DBD1] rounded-lg">
                      Drop lead here
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const overdue =
                        lead.status !== 'Confirmed' &&
                        lead.status !== 'Lost' &&
                        lead.status !== 'Not Interested' &&
                        isDateOverdue(lead.follow_up_date);

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => setDraggedLeadId(lead.id)}
                          className={`bg-white rounded-xl p-4 border shadow-xs cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                            overdue ? 'border-red-400 ring-1 ring-red-200' : 'border-[#E0DBD1]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono text-[10px] font-bold text-[#77726A]">
                              {lead.lead_code}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E0DBD1] text-[10px] font-bold text-[#141414]">
                              {lead.enquiry_source === 'Website' && (
                                <Globe className="w-2.5 h-2.5 text-[#C89B3C]" />
                              )}
                              {lead.enquiry_source}
                            </span>
                          </div>

                          <h4
                            onClick={() => setSelectedLead(lead)}
                            className="font-serif text-base font-semibold text-[#141414] hover:text-[#C89B3C] cursor-pointer"
                          >
                            {lead.customer_name}
                          </h4>

                          <div className="mt-2 space-y-1 text-xs text-[#4A463F]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#C89B3C] shrink-0" />
                              <span>
                                {lead.event_type}: <strong>{formatDateDDMMYYYY(lead.event_date)}</strong> ({lead.event_days}d)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#77726A] shrink-0" />
                              <span className="truncate">{lead.event_location}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#E8E3DA] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase text-[#77726A] block">
                                Est. Budget
                              </span>
                              <span className="text-xs font-extrabold text-[#141414] tabular-nums">
                                {formatINR(lead.estimated_budget)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase text-[#77726A] block">
                                Follow-up
                              </span>
                              <span
                                className={`text-[11px] font-bold ${
                                  overdue ? 'text-red-600' : 'text-[#141414]'
                                }`}
                              >
                                {overdue ? '⚠ ' : ''}
                                {formatDateDDMMYYYY(lead.follow_up_date)}
                              </span>
                            </div>
                          </div>

                          {/* Card Quick Actions */}
                          <div className="mt-3 pt-2.5 border-t border-[#E8E3DA] flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={buildWhatsAppLink(
                                  lead.whatsapp || lead.phone,
                                  `Namaste ${lead.customer_name}! Thank you for contacting THE DRK WEDDINGS regarding your ${lead.event_type} on ${formatDateDDMMYYYY(lead.event_date)} at ${lead.event_location}.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                                title="WhatsApp Enquiry"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="px-2 py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#141414] hover:text-white text-[11px] font-semibold text-[#141414] border border-[#E0DBD1] transition-colors"
                              >
                                History
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {!lead.converted_client_id && (
                                <button
                                  onClick={() => handleConvertClient(lead)}
                                  title="Convert Lead to Client"
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white transition-colors"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {!lead.converted_booking_id && (
                                <button
                                  onClick={() => handleConvertBooking(lead)}
                                  title="Convert Lead into Confirmed Wedding Booking"
                                  className="px-2 py-1 rounded-lg bg-[#C89B3C] text-[#0A0807] text-[10px] font-extrabold uppercase tracking-wider hover:bg-[#b5892f]"
                                >
                                  Book
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="argon-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E6CFA0] text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Lead ID</th>
                  <th className="py-3.5 px-4">Couple / Customer</th>
                  <th className="py-3.5 px-4">Event & Date</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Package & Budget</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Follow-up Date</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DA] text-xs">
                {filteredLeads.map((lead) => {
                  const overdue =
                    lead.status !== 'Confirmed' &&
                    lead.status !== 'Lost' &&
                    lead.status !== 'Not Interested' &&
                    isDateOverdue(lead.follow_up_date);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        overdue ? 'bg-red-50/35' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#77726A]">
                        {lead.lead_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="font-serif text-sm font-semibold text-[#141414] hover:text-[#C89B3C] text-left"
                        >
                          {lead.customer_name}
                        </button>
                        <div className="text-[11px] text-[#77726A]">{lead.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#141414]">{lead.event_type}</div>
                        <div className="text-[11px] text-[#77726A]">
                          {formatDateDDMMYYYY(lead.event_date)} ({lead.event_days} Days)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#4A463F]">{lead.event_location}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#141414] tabular-nums">
                          {formatINR(lead.estimated_budget)}
                        </div>
                        <div className="text-[11px] text-[#77726A] truncate max-w-[180px]">
                          {lead.interested_package_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E0DBD1] text-[11px] font-semibold">
                          {lead.enquiry_source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            overdue ? 'text-red-600' : 'text-[#141414]'
                          }`}
                        >
                          {overdue && 'OVERDUE: '}
                          {formatDateDDMMYYYY(lead.follow_up_date)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#4A463F]">{lead.assigned_staff_name}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLeadStatus(lead.id, e.target.value as LeadStatus)
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${
                            STATUS_BADGE_MAP[lead.status]
                          }`}
                        >
                          {LEAD_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={buildWhatsAppLink(
                              lead.whatsapp || lead.phone,
                              `Namaste ${lead.customer_name}! Reaching out from THE DRK WEDDINGS regarding your ${lead.event_type} on ${formatDateDDMMYYYY(lead.event_date)}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleConvertBooking(lead)}
                            className="px-2 py-1 rounded bg-[#C89B3C] text-[#0A0807] font-bold text-[10px] uppercase"
                            title="Convert to Booking"
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                            title="Edit Lead"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete lead ${lead.customer_name}?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD COMMUNICATION HISTORY & CONVERSION DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  {selectedLead.lead_code} • {selectedLead.enquiry_source} Enquiry
                </span>
                <h3 className="font-serif text-2xl text-white mt-0.5">
                  {selectedLead.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Conversion & Contact Bar */}
              <div className="flex flex-wrap items-center gap-2.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#E0DBD1]">
                <a
                  href={buildWhatsAppLink(
                    selectedLead.whatsapp || selectedLead.phone,
                    `Namaste ${selectedLead.customer_name}! Greetings from THE DRK WEDDINGS.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drk-btn-whatsapp"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Couple
                </a>
                <button
                  onClick={() => handleConvertClient(selectedLead)}
                  className="drk-btn-secondary py-2 px-3"
                >
                  <UserPlus className="w-4 h-4" /> Convert to Client
                </button>
                <button
                  onClick={() => handleConvertBooking(selectedLead)}
                  className="drk-btn-gold py-2 px-3"
                >
                  <HeartHandshake className="w-4 h-4" /> Convert to Booking
                </button>
              </div>

              {/* Enquiry Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-[#E0DBD1]">
                <div>
                  <span className="text-[#77726A] block">Phone / WhatsApp</span>
                  <span className="font-bold text-[#141414]">{selectedLead.phone}</span>
                </div>
                <div>
                  <span className="text-[#77726A] block">Email</span>
                  <span className="font-bold text-[#141414]">{selectedLead.email || '—'}</span>
                </div>
                <div>
                  <span className="text-[#77726A] block">Event Date & Days</span>
                  <span className="font-bold text-[#141414]">
                    {formatDateDDMMYYYY(selectedLead.event_date)} ({selectedLead.event_days} Days)
                  </span>
                </div>
                <div>
                  <span className="text-[#77726A] block">Event Location</span>
                  <span className="font-bold text-[#141414]">{selectedLead.event_location}</span>
                </div>
                <div>
                  <span className="text-[#77726A] block">Interested Package</span>
                  <span className="font-bold text-[#141414]">{selectedLead.interested_package_name}</span>
                </div>
                <div>
                  <span className="text-[#77726A] block">Estimated Budget</span>
                  <span className="font-bold text-[#C89B3C]">{formatINR(selectedLead.estimated_budget)}</span>
                </div>
              </div>

              {/* Log New Activity / Follow-Up Form */}
              <form
                onSubmit={handleAddActivity}
                className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E0DBD1] space-y-3"
              >
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#141414]">
                  Log Communication / Follow-up Note
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as typeof activityType)}
                    className="drk-select text-xs"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Chat</option>
                    <option value="Meeting">Studio Meeting</option>
                    <option value="Note">Internal Note</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={activitySummary}
                    onChange={(e) => setActivitySummary(e.target.value)}
                    placeholder="Summary (e.g. Discussed 3-day quote)"
                    className="col-span-2 drk-input text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  value={activityDetails}
                  onChange={(e) => setActivityDetails(e.target.value)}
                  placeholder="Detailed conversation notes or follow-up outcome..."
                  className="drk-input text-xs"
                />
                <button type="submit" className="drk-btn-primary py-2 px-4 text-xs">
                  <Send className="w-3.5 h-3.5" /> Save Activity Log
                </button>
              </form>

              {/* Communication Timeline */}
              <div>
                <h4 className="font-serif text-lg text-[#141414] mb-3">
                  Communication & Activity History ({selectedLeadActivities.length})
                </h4>
                <div className="space-y-3">
                  {selectedLeadActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E0DBD1] text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#C89B3C] mb-1">
                        <span>
                          {act.activity_type} • By {act.performed_by}
                        </span>
                        <span className="text-[#77726A]">{formatDateTimeIST(act.created_at)}</span>
                      </div>
                      <div className="font-bold text-[#141414]">{act.summary}</div>
                      {act.details && (
                        <div className="text-[#4A463F] mt-1 leading-relaxed">{act.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT LEAD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  THE DRK WEDDINGS • ENQUIRY DESK
                </span>
                <h3 className="font-serif text-xl text-white">
                  {editingLead ? `Edit Lead ${editingLead.lead_code}` : 'Capture New Wedding Enquiry'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="drk-label">Customer / Couple Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="e.g. Mudit Singhania & Muskan Agarwal"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Enquiry Source *</label>
                  <select
                    value={formData.enquiry_source}
                    onChange={(e) =>
                      setFormData({ ...formData, enquiry_source: e.target.value as LeadSource })
                    }
                    className="drk-select"
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
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
                    placeholder="+91 98290 44112"
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
                    placeholder="919829044112"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="couple@email.com"
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="drk-label">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="drk-select"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Destination Wedding">Destination Wedding</option>
                    <option value="Pre-Wedding">Pre-Wedding</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Reception">Reception</option>
                  </select>
                </div>
                <div>
                  <label className="drk-label">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Number of Days *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.event_days}
                    onChange={(e) =>
                      setFormData({ ...formData, event_days: Number(e.target.value || 1) })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={formData.estimated_budget}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_budget: Number(e.target.value || 0) })
                    }
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Event Location / Venue *</label>
                  <input
                    type="text"
                    required
                    value={formData.event_location}
                    onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                    placeholder="e.g. Heritage Haveli, Hazaribagh / Jaipur"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Interested Package</label>
                  <select
                    value={formData.interested_package_name}
                    onChange={(e) => {
                      const pkg = packages.find((p) => p.name === e.target.value);
                      setFormData({
                        ...formData,
                        interested_package_name: e.target.value,
                        interested_package_id: pkg?.id || '',
                        estimated_budget: pkg ? pkg.base_price : formData.estimated_budget,
                      });
                    }}
                    className="drk-select"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({formatINR(p.base_price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="drk-label">Enquiry Date</label>
                  <input
                    type="date"
                    value={formData.enquiry_date}
                    onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Follow-up Reminder Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Assigned Staff Member</label>
                  <select
                    value={formData.assigned_staff_id}
                    onChange={(e) => {
                      const tm = team_members.find((m) => m.id === e.target.value);
                      setFormData({
                        ...formData,
                        assigned_staff_id: e.target.value,
                        assigned_staff_name: tm?.full_name || 'Deepak Raj',
                      });
                    }}
                    className="drk-select"
                  >
                    {team_members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="drk-label">Lead Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as LeadStatus })
                    }
                    className="drk-select"
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="drk-label">Ceremony Details & Internal Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specific rituals, guest size, drone preferences, referral source..."
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
                  {editingLead ? 'Save Changes' : 'Create Lead Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
