// ============================================================================
// THE DRK WEDDINGS — WEDDING BOOKING & MULTI-EVENT MANAGEMENT
// Supports Multiple Ceremonies per Wedding + Crew Double-Booking Conflict Detection
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Camera,
  Film,
  AlertTriangle,
  FileText,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  IndianRupee,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import type {
  BookingRecord,
  BookingStatus,
  EventCompletionStatus,
  EventRecord,
  WeddingSubEventType,
} from '../../types/crm';
import {
  detectEventConflicts,
  formatDateDDMMYYYY,
  formatINR,
  getTodayKolkataISO,
} from '../../lib/formatting';

const BOOKING_STATUSES: BookingStatus[] = [
  'Confirmed',
  'Upcoming',
  'In Progress',
  'Post-Production',
  'Delivered',
  'Completed',
  'Cancelled',
];

const SUB_EVENT_TYPES: WeddingSubEventType[] = [
  'Engagement',
  'Haldi',
  'Mehndi',
  'Sangeet',
  'Wedding',
  'Reception',
  'Pre-wedding shoot',
  'Post-wedding shoot',
];

const ALL_SERVICES = [
  'Traditional Photography',
  'Candid Photography',
  'Cinematography',
  'Traditional Videography',
  'Drone Photography',
  'Pre-Wedding Shoot',
  'Wedding Highlight Film',
  'Full Wedding Film',
  'Wedding Albums',
  'Live Streaming',
];

export const BookingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { canViewFinancials } = useAuth();
  const {
    bookings,
    events,
    clients,
    packages,
    team_members,
    addBooking,
    updateBooking,
    deleteBooking,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    bookings[0]?.id || null
  );

  // Booking Create/Edit Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);

  // Sub-Event Create/Edit Modal with Conflict Detection
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [targetBookingForEvent, setTargetBookingForEvent] = useState<BookingRecord | null>(null);

  const today = getTodayKolkataISO();

  const [bookingForm, setBookingForm] = useState({
    client_id: clients[0]?.id || '',
    booking_date: today,
    wedding_date: today,
    wedding_end_date: today,
    event_location: 'Hazaribagh, Jharkhand',
    package_id: packages[2]?.id || '',
    package_name: packages[2]?.name || 'Classic Royal Collection (3-Day Signature)',
    total_amount: 150000,
    advance_amount: 30000,
    paid_amount: 30000,
    selected_services: ['Traditional Photography', 'Candid Photography', 'Cinematography', 'Wedding Albums'],
    assigned_team_ids: ['tm-1', 'tm-2', 'tm-3'],
    status: 'Confirmed' as BookingStatus,
    contract_url: '',
    internal_notes: '',
  });

  const [eventForm, setEventForm] = useState({
    event_name: 'Royal Sangeet & Ring Ceremony',
    event_type: 'Sangeet' as WeddingSubEventType,
    event_date: today,
    start_time: '18:00',
    end_time: '23:30',
    venue: '',
    location: '',
    assigned_photographers: ['tm-1', 'tm-2'],
    assigned_cinematographers: ['tm-3'],
    equipment_requirements: 'Sony A1, A7IV, FX3 on RS4 Pro Gimbal, DJI Mavic 3 Pro Drone',
    special_instructions: '',
    completion_status: 'Scheduled' as EventCompletionStatus,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddBookingModal();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openAddBookingModal = () => {
    setEditingBooking(null);
    const defaultClient = clients[0];
    const defaultPkg = packages[1] || packages[0];
    setBookingForm({
      client_id: defaultClient?.id || '',
      booking_date: today,
      wedding_date: defaultClient?.wedding_date || today,
      wedding_end_date: defaultClient?.wedding_date || today,
      event_location: defaultClient?.event_location || 'Hazaribagh, Jharkhand',
      package_id: defaultPkg?.id || '',
      package_name: defaultPkg?.name || 'Standard Heritage Collection (2-Day)',
      total_amount: defaultPkg?.base_price || 150000,
      advance_amount: 30000,
      paid_amount: 30000,
      selected_services: defaultPkg?.additional_services || [
        'Traditional Photography',
        'Candid Photography',
        'Cinematography',
        'Wedding Albums',
      ],
      assigned_team_ids: ['tm-1', 'tm-2', 'tm-3'],
      status: 'Confirmed',
      contract_url: '',
      internal_notes: '',
    });
    setBookingModalOpen(true);
  };

  const openEditBookingModal = (bk: BookingRecord) => {
    setEditingBooking(bk);
    setBookingForm({
      client_id: bk.client_id,
      booking_date: bk.booking_date,
      wedding_date: bk.wedding_date,
      wedding_end_date: bk.wedding_end_date || bk.wedding_date,
      event_location: bk.event_location,
      package_id: bk.package_id || '',
      package_name: bk.package_name,
      total_amount: bk.total_amount,
      advance_amount: bk.advance_amount,
      paid_amount: bk.paid_amount,
      selected_services: bk.selected_services,
      assigned_team_ids: bk.assigned_team_ids,
      status: bk.status,
      contract_url: bk.contract_url || '',
      internal_notes: bk.internal_notes,
    });
    setBookingModalOpen(true);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const clientObj = clients.find((c) => c.id === bookingForm.client_id);
    if (!clientObj) return;

    const total = Number(bookingForm.total_amount || 0);
    const paid = Number(bookingForm.paid_amount || 0);
    const balance = Math.max(0, total - paid);

    if (editingBooking) {
      updateBooking(editingBooking.id, {
        ...bookingForm,
        client_name: clientObj.full_name,
        client_phone: clientObj.phone,
        groom_name: clientObj.groom_name,
        bride_name: clientObj.bride_name,
        balance_amount: balance,
        payment_status:
          balance === 0 ? 'Fully Paid' : paid > 0 ? 'Partially Paid' : 'Pending Advance',
      });
      setBookingModalOpen(false);
      return;
    }

    const created = addBooking({
      ...bookingForm,
      client_name: clientObj.full_name,
      client_phone: clientObj.phone,
      groom_name: clientObj.groom_name,
      bride_name: clientObj.bride_name,
      balance_amount: balance,
      payment_status:
        balance === 0 ? 'Fully Paid' : paid > 0 ? 'Advance Paid' : 'Pending Advance',
    });
    setExpandedBookingId(created.id);
    setBookingModalOpen(false);
  };

  // Sub-Event Modal Handlers
  const openAddEventModal = (booking: BookingRecord) => {
    setTargetBookingForEvent(booking);
    setEditingEvent(null);
    setEventForm({
      event_name: 'Wedding Ceremony & Varmala',
      event_type: 'Wedding',
      event_date: booking.wedding_date,
      start_time: '16:00',
      end_time: '23:30',
      venue: booking.event_location.split(',')[0] || booking.event_location,
      location: booking.event_location,
      assigned_photographers: ['tm-1', 'tm-2'],
      assigned_cinematographers: ['tm-3'],
      equipment_requirements: 'Full Studio Prime Lens Kit, FX3 Gimbal, Drone, Off-Camera Flash',
      special_instructions: '',
      completion_status: 'Scheduled',
    });
    setEventModalOpen(true);
  };

  const openEditEventModal = (booking: BookingRecord, ev: EventRecord) => {
    setTargetBookingForEvent(booking);
    setEditingEvent(ev);
    setEventForm({
      event_name: ev.event_name,
      event_type: ev.event_type,
      event_date: ev.event_date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      venue: ev.venue,
      location: ev.location,
      assigned_photographers: ev.assigned_photographers,
      assigned_cinematographers: ev.assigned_cinematographers,
      equipment_requirements: ev.equipment_requirements,
      special_instructions: ev.special_instructions,
      completion_status: ev.completion_status,
    });
    setEventModalOpen(true);
  };

  // Live Conflict Detection for Current Event Form
  const activeConflicts = useMemo(
    () =>
      detectEventConflicts(
        {
          id: editingEvent?.id,
          event_date: eventForm.event_date,
          start_time: eventForm.start_time,
          end_time: eventForm.end_time,
          assigned_photographers: eventForm.assigned_photographers,
          assigned_cinematographers: eventForm.assigned_cinematographers,
        },
        events,
        team_members
      ),
    [eventForm, editingEvent, events, team_members]
  );

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBookingForEvent) return;
    if (activeConflicts.length > 0) {
      return; // Prevent double booking
    }

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        ...eventForm,
      });
      setEventModalOpen(false);
      return;
    }

    addEvent({
      ...eventForm,
      booking_id: targetBookingForEvent.id,
      booking_code: targetBookingForEvent.booking_code,
      client_id: targetBookingForEvent.client_id,
      client_name: targetBookingForEvent.client_name,
    });
    setEventModalOpen(false);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.client_name.toLowerCase().includes(q) ||
          b.booking_code.toLowerCase().includes(q) ||
          b.event_location.toLowerCase().includes(q) ||
          b.package_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const photographersList = team_members.filter(
    (m) => m.role === 'Owner' || m.role === 'Photographer'
  );
  const cinematographersList = team_members.filter((m) => m.role === 'Cinematographer');

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Multi-Ceremony Wedding Production
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Wedding Bookings, Sub-Events & Crew Allocation
          </h2>
        </div>

        <button onClick={openAddBookingModal} className="drk-btn-primary">
          <Plus className="w-4 h-4 text-[#E6CFA0]" />
          <span>Create Wedding Booking</span>
        </button>
      </div>

      {/* Filters */}
      <div className="argon-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-3 relative">
          <Search className="w-4 h-4 text-[#77726A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking ID (DRK-BK...), couple name, palace/venue, or package..."
            className="drk-input pl-10"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="drk-select"
          >
            <option value="ALL">All Booking Statuses</option>
            {BOOKING_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings & Multi-Event Accordion Cards */}
      <div className="space-y-5">
        {filteredBookings.map((bk) => {
          const bkEvents = events
            .filter((e) => e.booking_id === bk.id)
            .sort((a, b) => a.event_date.localeCompare(b.event_date));
          const isExpanded = expandedBookingId === bk.id;

          return (
            <div key={bk.id} className="argon-card overflow-hidden">
              {/* Top Booking Summary Bar */}
              <div className="p-6 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-[#141414] text-[#E6CFA0]">
                      {bk.booking_code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {bk.status}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        bk.balance_amount === 0
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-800 border border-stone-300'
                      }`}
                    >
                      {bk.payment_status}
                    </span>
                    <span className="text-xs text-[#77726A]">
                      Confirmed on {formatDateDDMMYYYY(bk.booking_date)}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-semibold text-[#141414]">
                    {bk.client_name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#4A463F]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" />
                      Wedding: <strong>{formatDateDDMMYYYY(bk.wedding_date)}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                      {bk.event_location}
                    </span>
                    <span className="font-semibold text-[#141414]">{bk.package_name}</span>
                  </div>

                  {/* Selected Services Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bk.selected_services.map((srv) => (
                      <span
                        key={srv}
                        className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E0DBD1] text-[10px] font-semibold text-[#4A463F]"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Financials & Action Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E8E3DA]">
                  {canViewFinancials && (
                    <div className="flex items-center gap-5 text-right">
                      <div>
                        <span className="text-[10px] uppercase text-[#77726A] block">
                          Package Amount
                        </span>
                        <span className="font-serif text-lg font-bold text-[#141414] tabular-nums">
                          {formatINR(bk.total_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#77726A] block">
                          Advance / Paid
                        </span>
                        <span className="font-serif text-lg font-bold text-emerald-700 tabular-nums">
                          {formatINR(bk.paid_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#77726A] block">
                          Remaining Balance
                        </span>
                        <span
                          className={`font-serif text-lg font-bold tabular-nums ${
                            bk.balance_amount > 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {formatINR(bk.balance_amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedBookingId(isExpanded ? null : bk.id)
                      }
                      className="drk-btn-secondary py-2 px-3"
                    >
                      {isExpanded ? 'Hide Ceremonies' : `Ceremonies (${bkEvents.length})`}
                    </button>

                    <button
                      onClick={() => openAddEventModal(bk)}
                      className="drk-btn-gold py-2 px-3"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Event
                    </button>

                    {bk.contract_url && (
                      <a
                        href={bk.contract_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                        title="View Attached Contract"
                      >
                        <FileText className="w-4 h-4 text-[#C89B3C]" />
                      </a>
                    )}

                    <button
                      onClick={() => openEditBookingModal(bk)}
                      className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                      title="Edit Booking"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete booking ${bk.booking_code}?`)) {
                          deleteBooking(bk.id);
                        }
                      }}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Event Schedule Under This Wedding Booking */}
              {isExpanded && (
                <div className="bg-[#FAF8F5] border-t border-[#E0DBD1] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
                        Multi-Ceremony Shoot Schedule ({bkEvents.length} Events)
                      </span>
                      <h4 className="font-serif text-lg text-[#141414]">
                        Engagement, Haldi, Mehndi, Sangeet, Wedding, Reception & Pre-Wedding
                      </h4>
                    </div>
                  </div>

                  {bkEvents.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-dashed border-[#E0DBD1] text-center text-xs text-[#77726A]">
                      No ceremony events added yet. Click "+ Add Event" to schedule Engagement, Haldi, Mehndi, Sangeet, Wedding, or Pre-wedding shoot.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {bkEvents.map((ev) => {
                        const photoNames = ev.assigned_photographers
                          .map((id) => team_members.find((m) => m.id === id)?.full_name)
                          .filter(Boolean);
                        const cinemaNames = ev.assigned_cinematographers
                          .map((id) => team_members.find((m) => m.id === id)?.full_name)
                          .filter(Boolean);

                        return (
                          <div
                            key={ev.id}
                            className="bg-white rounded-xl p-4 border border-[#E0DBD1] shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded bg-[#141414] text-[#E6CFA0] text-[10px] font-extrabold uppercase tracking-wider">
                                  {ev.event_type}
                                </span>
                                <select
                                  value={ev.completion_status}
                                  onChange={(e) =>
                                    updateEvent(ev.id, {
                                      completion_status: e.target.value as EventCompletionStatus,
                                    })
                                  }
                                  className="text-[11px] font-bold px-2 py-0.5 rounded border border-[#E0DBD1] bg-[#FAF9F5]"
                                >
                                  <option value="Scheduled">Scheduled</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Rescheduled">Rescheduled</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>

                              <h5 className="font-serif text-base font-semibold text-[#141414]">
                                {ev.event_name}
                              </h5>

                              <div className="mt-2 space-y-1 text-xs text-[#4A463F]">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#C89B3C]" />
                                  <span>
                                    <strong>{formatDateDDMMYYYY(ev.event_date)}</strong> • {ev.start_time} to {ev.end_time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#77726A]" />
                                  <span>
                                    {ev.venue} ({ev.location})
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-[#E8E3DA] space-y-1.5 text-[11px]">
                                <div className="flex items-start gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Photographers:</strong>{' '}
                                    {photoNames.length > 0 ? photoNames.join(', ') : 'Unassigned'}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Film className="w-3.5 h-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Cinematographers:</strong>{' '}
                                    {cinemaNames.length > 0 ? cinemaNames.join(', ') : 'Unassigned'}
                                  </span>
                                </div>
                                {ev.equipment_requirements && (
                                  <div className="text-[#77726A]">
                                    <strong>Gear:</strong> {ev.equipment_requirements}
                                  </div>
                                )}
                                {ev.special_instructions && (
                                  <div className="text-[#4A463F] italic">
                                    "{ev.special_instructions}"
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-[#E8E3DA] flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditEventModal(bk, ev)}
                                className="text-xs font-semibold text-[#141414] hover:text-[#C89B3C]"
                              >
                                Edit Event
                              </button>
                              <button
                                onClick={() => deleteEvent(ev.id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT WEDDING BOOKING MODAL */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  WEDDING BOOKING RESERVATION
                </span>
                <h3 className="font-serif text-xl text-white">
                  {editingBooking ? `Edit Booking ${editingBooking.booking_code}` : 'Create New Wedding Booking'}
                </h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Select Client / Couple *</label>
                  <select
                    required
                    value={bookingForm.client_id}
                    onChange={(e) => {
                      const cl = clients.find((c) => c.id === e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        client_id: e.target.value,
                        wedding_date: cl?.wedding_date || bookingForm.wedding_date,
                        event_location: cl?.event_location || bookingForm.event_location,
                      });
                    }}
                    className="drk-select"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.client_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="drk-label">Photography & Cinema Package *</label>
                  <select
                    value={bookingForm.package_name}
                    onChange={(e) => {
                      const pkg = packages.find((p) => p.name === e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        package_id: pkg?.id || '',
                        package_name: e.target.value,
                        total_amount: pkg ? pkg.base_price : bookingForm.total_amount,
                        selected_services: pkg ? pkg.additional_services : bookingForm.selected_services,
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Booking Confirmation Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.booking_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Primary Wedding Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.wedding_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, wedding_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Booking Status</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, status: e.target.value as BookingStatus })
                    }
                    className="drk-select"
                  >
                    {BOOKING_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Total Package Amount (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={bookingForm.total_amount}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, total_amount: Number(e.target.value || 0) })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Advance Payment (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={bookingForm.advance_amount}
                    onChange={(e) => {
                      const val = Number(e.target.value || 0);
                      setBookingForm({
                        ...bookingForm,
                        advance_amount: val,
                        paid_amount: editingBooking ? bookingForm.paid_amount : val,
                      });
                    }}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Auto-Calculated Balance (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={formatINR(
                      Math.max(0, Number(bookingForm.total_amount) - Number(bookingForm.paid_amount))
                    )}
                    className="drk-input bg-stone-100 font-bold text-[#141414]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Event Location / Palace Venue *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.event_location}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, event_location: e.target.value })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Contract Document Link (Google Drive / PDF)</label>
                  <input
                    type="url"
                    value={bookingForm.contract_url}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, contract_url: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                    className="drk-input"
                  />
                </div>
              </div>

              {/* Selected Services Checkboxes */}
              <div>
                <label className="drk-label">Selected Services Included</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-[#FAF9F5] border border-[#E0DBD1]">
                  {ALL_SERVICES.map((srv) => (
                    <label key={srv} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingForm.selected_services.includes(srv)}
                        onChange={() =>
                          setBookingForm({
                            ...bookingForm,
                            selected_services: toggleArrayItem(
                              bookingForm.selected_services,
                              srv
                            ),
                          })
                        }
                        className="rounded border-stone-300"
                      />
                      <span>{srv}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="drk-label">Internal Studio Notes</label>
                <textarea
                  rows={2}
                  value={bookingForm.internal_notes}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, internal_notes: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  {editingBooking ? 'Update Booking' : 'Confirm Booking & Auto-Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT WEDDING SUB-EVENT MODAL WITH CONFLICT DETECTION */}
      {eventModalOpen && targetBookingForEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  {targetBookingForEvent.booking_code} • {targetBookingForEvent.client_name}
                </span>
                <h3 className="font-serif text-xl text-white">
                  {editingEvent ? 'Edit Ceremony / Shoot Schedule' : 'Add Wedding Sub-Event'}
                </h3>
              </div>
              <button
                onClick={() => setEventModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-4">
              {/* Real-time Double-Booking Conflict Alert */}
              {activeConflicts.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-extrabold uppercase tracking-wider text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Crew Double-Booking Conflict Detected!
                  </div>
                  {activeConflicts.map((c, idx) => (
                    <div key={idx}>
                      • <strong>{c.team_member_name}</strong> ({c.role}) is already assigned to{' '}
                      <strong>"{c.conflicting_event_name}"</strong> for {c.conflicting_client_name} on{' '}
                      {formatDateDDMMYYYY(c.event_date)} ({c.start_time} – {c.end_time}).
                    </div>
                  ))}
                  <div className="text-[11px] text-red-700 font-medium pt-1">
                    Please adjust the time/date or assign available crew members to proceed.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Ceremony Category *</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => {
                      const val = e.target.value as WeddingSubEventType;
                      setEventForm({
                        ...eventForm,
                        event_type: val,
                        event_name: `${val} Ceremony`,
                      });
                    }}
                    className="drk-select"
                  >
                    {SUB_EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="drk-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.event_name}
                    onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">End Time *</label>
                  <input
                    type="time"
                    required
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Venue / Lawn / Hall *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="Sheesh Mahal Mandap"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">City / Location *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Jaipur / Hazaribagh"
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Assign Photographers</label>
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF9F5] border border-[#E0DBD1]">
                    {photographersList.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventForm.assigned_photographers.includes(p.id)}
                          onChange={() =>
                            setEventForm({
                              ...eventForm,
                              assigned_photographers: toggleArrayItem(
                                eventForm.assigned_photographers,
                                p.id
                              ),
                            })
                          }
                        />
                        <span>
                          {p.full_name} ({p.role})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="drk-label">Assign Cinematographers</label>
                  <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF9F5] border border-[#E0DBD1]">
                    {cinematographersList.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventForm.assigned_cinematographers.includes(c.id)}
                          onChange={() =>
                            setEventForm({
                              ...eventForm,
                              assigned_cinematographers: toggleArrayItem(
                                eventForm.assigned_cinematographers,
                                c.id
                              ),
                            })
                          }
                        />
                        <span>{c.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="drk-label">Camera, Lighting & Drone Equipment Requirements</label>
                <input
                  type="text"
                  value={eventForm.equipment_requirements}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, equipment_requirements: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div>
                <label className="drk-label">Special Shot-List Instructions</label>
                <textarea
                  rows={2}
                  value={eventForm.special_instructions}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, special_instructions: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activeConflicts.length > 0}
                  className="drk-btn-primary disabled:opacity-40"
                >
                  {editingEvent ? 'Save Event Changes' : 'Schedule Ceremony'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
