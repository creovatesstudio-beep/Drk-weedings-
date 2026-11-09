// ============================================================================
// THE DRK WEDDINGS — INTERACTIVE MASTER CALENDAR & SCHEDULING
// Monthly, Weekly & Daily Views • 8 Color-Coded Event Types • Direct Reschedule
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  Edit3,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type { EventRecord, WeddingSubEventType } from '../../types/crm';
import { formatDateDDMMYYYY, formatINR, getTodayKolkataISO } from '../../lib/formatting';

type CalendarViewMode = 'month' | 'week' | 'day';

type UnifiedCalendarCategory =
  | 'Upcoming weddings'
  | 'Photography shoots'
  | 'Client meetings'
  | 'Payment deadlines'
  | 'Editing deadlines'
  | 'Album printing deadlines'
  | 'Delivery deadlines'
  | 'Follow-up reminders';

interface UnifiedCalendarItem {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  subtitle: string;
  category: UnifiedCalendarCategory;
  badgeClass: string;
  rawEvent?: EventRecord;
}

const CATEGORY_STYLES: Record<UnifiedCalendarCategory, { badge: string; dot: string }> = {
  'Upcoming weddings': {
    badge: 'bg-[#141414] text-[#E6CFA0] border-[#C89B3C]',
    dot: 'bg-[#C89B3C]',
  },
  'Photography shoots': {
    badge: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-600',
  },
  'Client meetings': {
    badge: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    dot: 'bg-indigo-600',
  },
  'Payment deadlines': {
    badge: 'bg-red-50 text-red-900 border-red-300',
    dot: 'bg-red-600',
  },
  'Editing deadlines': {
    badge: 'bg-purple-50 text-purple-900 border-purple-300',
    dot: 'bg-purple-600',
  },
  'Album printing deadlines': {
    badge: 'bg-pink-50 text-pink-900 border-pink-300',
    dot: 'bg-pink-600',
  },
  'Delivery deadlines': {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dot: 'bg-emerald-600',
  },
  'Follow-up reminders': {
    badge: 'bg-blue-50 text-blue-900 border-blue-300',
    dot: 'bg-blue-600',
  },
};

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    events,
    bookings,
    invoices,
    tasks,
    deliverables,
    leads,
    clients,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useData();

  const today = getTodayKolkataISO();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [cursorDate, setCursorDate] = useState<string>('2026-11-03');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [formData, setFormData] = useState({
    booking_id: bookings[0]?.id || '',
    client_name: clients[0]?.full_name || 'Mudit Singhania & Muskan Agarwal',
    event_name: '',
    event_type: 'Pre-wedding shoot' as WeddingSubEventType,
    event_date: today,
    start_time: '10:00',
    end_time: '18:00',
    venue: '',
    location: 'Hazaribagh, Jharkhand',
    equipment_requirements: 'Sony A1, 50mm GM, FX3 Gimbal',
    special_instructions: '',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal(cursorDate);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, cursorDate]);

  const openCreateModal = (dateStr: string) => {
    setEditingEvent(null);
    setFormData({
      booking_id: bookings[0]?.id || '',
      client_name: bookings[0]?.client_name || 'Studio Schedule',
      event_name: '',
      event_type: 'Pre-wedding shoot',
      event_date: dateStr,
      start_time: '10:00',
      end_time: '17:00',
      venue: 'The DRK Weddings Studio / Outdoor',
      location: 'Hazaribagh',
      equipment_requirements: 'Full Photo & Cinema Kit',
      special_instructions: '',
    });
    setModalOpen(true);
  };

  const openEditEvent = (ev: EventRecord) => {
    setEditingEvent(ev);
    setFormData({
      booking_id: ev.booking_id || '',
      client_name: ev.client_name,
      event_name: ev.event_name,
      event_type: ev.event_type,
      event_date: ev.event_date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      venue: ev.venue,
      location: ev.location,
      equipment_requirements: ev.equipment_requirements,
      special_instructions: ev.special_instructions,
    });
    setModalOpen(true);
  };

  const handleSaveCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_name.trim()) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        ...formData,
      });
      setModalOpen(false);
      return;
    }

    addEvent({
      ...formData,
      assigned_photographers: ['tm-1'],
      assigned_cinematographers: ['tm-3'],
      completion_status: 'Scheduled',
    });
    setModalOpen(false);
  };

  // Aggregate all 8 calendar categories from real database records
  const allItems = useMemo<UnifiedCalendarItem[]>(() => {
    const list: UnifiedCalendarItem[] = [];

    // 1, 2, 3: Events table -> Weddings, Shoots, Client Meetings
    for (const ev of events) {
      if (ev.completion_status === 'Cancelled') continue;
      let cat: UnifiedCalendarCategory = 'Photography shoots';
      if (ev.event_type === 'Wedding' || ev.event_type === 'Reception' || ev.event_type === 'Sangeet') {
        cat = 'Upcoming weddings';
      } else if (ev.event_type === 'Client Meeting') {
        cat = 'Client meetings';
      }
      list.push({
        id: `ev-${ev.id}`,
        date: ev.event_date,
        time: `${ev.start_time}–${ev.end_time}`,
        title: ev.event_name,
        subtitle: `${ev.client_name} • ${ev.venue}`,
        category: cat,
        badgeClass: CATEGORY_STYLES[cat].badge,
        rawEvent: ev,
      });
    }

    // 4: Payment deadlines
    for (const inv of invoices) {
      if (inv.balance_amount > 0) {
        list.push({
          id: `inv-${inv.id}`,
          date: inv.due_date,
          title: `Payment Due: ${formatINR(inv.balance_amount)}`,
          subtitle: `${inv.client_name} (${inv.invoice_number})`,
          category: 'Payment deadlines',
          badgeClass: CATEGORY_STYLES['Payment deadlines'].badge,
        });
      }
    }

    // 5 & 6: Editing deadlines & Album printing deadlines
    for (const tsk of tasks) {
      if (tsk.status === 'Completed') continue;
      const isAlbum =
        tsk.workflow_track === 'Album designing' || tsk.workflow_track === 'Album printing';
      const cat: UnifiedCalendarCategory = isAlbum
        ? 'Album printing deadlines'
        : 'Editing deadlines';
      list.push({
        id: `tsk-${tsk.id}`,
        date: tsk.deadline,
        title: tsk.task_name,
        subtitle: `${tsk.client_name} • ${tsk.assigned_staff_name} (${tsk.progress_percentage}%)`,
        category: cat,
        badgeClass: CATEGORY_STYLES[cat].badge,
      });
    }

    // 7: Delivery deadlines
    for (const dlv of deliverables) {
      if (dlv.status === 'Delivered') continue;
      list.push({
        id: `dlv-${dlv.id}`,
        date: dlv.expected_delivery_date,
        title: `Deliverable Due: ${dlv.deliverable_name}`,
        subtitle: `${dlv.client_name} (${dlv.deliverable_type})`,
        category: 'Delivery deadlines',
        badgeClass: CATEGORY_STYLES['Delivery deadlines'].badge,
      });
    }

    // 8: Follow-up reminders
    for (const ld of leads) {
      if (ld.status === 'Confirmed' || ld.status === 'Lost' || ld.status === 'Not Interested') continue;
      if (!ld.follow_up_date) continue;
      list.push({
        id: `ld-${ld.id}`,
        date: ld.follow_up_date,
        title: `Lead Follow-up: ${ld.customer_name}`,
        subtitle: `${ld.enquiry_source} • ${ld.phone}`,
        category: 'Follow-up reminders',
        badgeClass: CATEGORY_STYLES['Follow-up reminders'].badge,
      });
    }

    return list.filter((item) => categoryFilter === 'ALL' || item.category === categoryFilter);
  }, [events, invoices, tasks, deliverables, leads, categoryFilter]);

  // Date navigation helpers
  const parsedCursor = new Date(`${cursorDate}T00:00:00`);
  const year = parsedCursor.getFullYear();
  const month = parsedCursor.getMonth();

  const shiftCursor = (delta: number) => {
    const next = new Date(parsedCursor);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + delta);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + delta * 7);
    } else {
      next.setDate(next.getDate() + delta);
    }
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');
    setCursorDate(`${yyyy}-${mm}-${dd}`);
  };

  // Build Month Grid
  const monthDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < startWeekday; i++) {
      const prevDate = new Date(year, month, -startWeekday + i + 1);
      const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      cells.push({ dateStr: iso, dayNum: prevDate.getDate(), isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr: iso, dayNum: d, isCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const nextIdx = cells.length - (startWeekday + daysInMonth) + 1;
      const nxt = new Date(year, month + 1, nextIdx);
      const iso = `${nxt.getFullYear()}-${String(nxt.getMonth() + 1).padStart(2, '0')}-${String(nxt.getDate()).padStart(2, '0')}`;
      cells.push({ dateStr: iso, dayNum: nxt.getDate(), isCurrentMonth: false });
    }

    return cells;
  }, [year, month]);

  // Build Week Days
  const weekDays = useMemo(() => {
    const dayOfWeek = parsedCursor.getDay();
    const start = new Date(parsedCursor);
    start.setDate(parsedCursor.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dateStr: iso,
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }),
      };
    });
  }, [parsedCursor]);

  const monthTitle = parsedCursor.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Interactive Master Schedule
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Weddings, Shoots, Meetings & Deadlines Calendar
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-[#E0DBD1] bg-white p-1">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                  viewMode === m
                    ? 'bg-[#141414] text-white'
                    : 'text-[#77726A] hover:text-[#141414]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button onClick={() => openCreateModal(cursorDate)} className="drk-btn-primary">
            <Plus className="w-4 h-4 text-[#E6CFA0]" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Navigation & Legend Bar */}
      <div className="argon-card p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftCursor(-1)}
            className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif text-xl font-semibold text-[#141414] min-w-[180px] text-center">
            {viewMode === 'day' ? formatDateDDMMYYYY(cursorDate) : monthTitle}
          </span>
          <button
            onClick={() => shiftCursor(1)}
            className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursorDate('2026-11-03')}
            className="px-3 py-1.5 rounded-lg border border-[#E0DBD1] text-xs font-bold hover:bg-[#FAF8F5]"
          >
            Today (03/11/2026)
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              categoryFilter === 'ALL'
                ? 'bg-[#141414] text-white border-[#141414]'
                : 'bg-white text-[#77726A] border-[#E0DBD1]'
            }`}
          >
            All ({allItems.length})
          </button>
          {(Object.keys(CATEGORY_STYLES) as UnifiedCalendarCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                categoryFilter === cat
                  ? 'ring-2 ring-[#141414] ' + CATEGORY_STYLES[cat].badge
                  : 'bg-white text-[#4A463F] border-[#E0DBD1] hover:bg-[#FAF8F5]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${CATEGORY_STYLES[cat].dot}`} />
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MONTHLY VIEW */}
      {viewMode === 'month' && (
        <div className="argon-card overflow-hidden">
          <div className="grid grid-cols-7 bg-[#141414] text-[#E6CFA0] text-[10px] font-extrabold uppercase tracking-widest text-center py-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E3DA]">
            {monthDays.map((cell) => {
              const dayItems = allItems.filter((i) => i.date === cell.dateStr);
              const isToday = cell.dateStr === '2026-11-03';

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setCursorDate(cell.dateStr);
                  }}
                  className={`min-h-[125px] p-2 transition-colors ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-[#FAF9F5]' : 'bg-stone-100/60 text-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-[#C89B3C] text-[#0A0807]' : ''
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModal(cell.dateStr);
                      }}
                      className="text-[10px] text-[#77726A] hover:text-[#141414] font-bold"
                      title="Schedule event on this date"
                    >
                      +
                    </button>
                  </div>

                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.rawEvent) {
                            openEditEvent(item.rawEvent);
                          } else {
                            setCursorDate(cell.dateStr);
                            setViewMode('day');
                          }
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold border truncate cursor-pointer ${item.badgeClass}`}
                        title={`${item.category}: ${item.title} (${item.subtitle})`}
                      >
                        {item.time ? `${item.time.split('–')[0]} ` : ''}
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorDate(cell.dateStr);
                          setViewMode('day');
                        }}
                        className="text-[10px] font-extrabold text-[#C89B3C] cursor-pointer pl-1"
                      >
                        + {dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((wd) => {
            const dayItems = allItems.filter((i) => i.date === wd.dateStr);
            return (
              <div key={wd.dateStr} className="argon-card p-3 flex flex-col min-h-[340px]">
                <div className="pb-2 mb-3 border-b border-[#E8E3DA] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#141414]">{wd.label}</div>
                    <div className="text-[10px] text-[#77726A]">{formatDateDDMMYYYY(wd.dateStr)}</div>
                  </div>
                  <button
                    onClick={() => openCreateModal(wd.dateStr)}
                    className="p-1 rounded bg-[#FAF8F5] hover:bg-[#141414] hover:text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  {dayItems.length === 0 ? (
                    <div className="text-[11px] text-stone-400 text-center py-8">No items</div>
                  ) : (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.rawEvent && openEditEvent(item.rawEvent)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer ${item.badgeClass}`}
                      >
                        <div className="text-[9px] font-extrabold uppercase opacity-80">
                          {item.category}
                        </div>
                        <div className="font-bold mt-0.5">{item.title}</div>
                        {item.time && <div className="text-[10px] mt-0.5">{item.time}</div>}
                        <div className="text-[10px] opacity-85 truncate mt-0.5">{item.subtitle}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAILY VIEW */}
      {viewMode === 'day' && (
        <div className="argon-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E3DA] pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C89B3C]">
                Detailed Daily Run-Sheet
              </span>
              <h3 className="font-serif text-2xl text-[#141414]">
                Schedule for {formatDateDDMMYYYY(cursorDate)}
              </h3>
            </div>
            <button onClick={() => openCreateModal(cursorDate)} className="drk-btn-gold">
              <Plus className="w-4 h-4" /> Add Event on {formatDateDDMMYYYY(cursorDate)}
            </button>
          </div>

          <div className="space-y-3">
            {allItems.filter((i) => i.date === cursorDate).length === 0 ? (
              <div className="py-12 text-center text-xs text-[#77726A]">
                No studio events, shoots, or deadlines scheduled on {formatDateDDMMYYYY(cursorDate)}.
              </div>
            ) : (
              allItems
                .filter((i) => i.date === cursorDate)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${item.badgeClass}`}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        {item.category} {item.time ? `• ${item.time}` : ''}
                      </span>
                      <h4 className="font-serif text-lg font-bold mt-0.5">{item.title}</h4>
                      <p className="text-xs opacity-90 mt-0.5">{item.subtitle}</p>
                    </div>
                    {item.rawEvent && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditEvent(item.rawEvent!)}
                          className="px-3 py-1.5 rounded-lg bg-white text-[#141414] text-xs font-bold border border-[#E0DBD1]"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit / Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT / RESCHEDULE CALENDAR EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  STUDIO CALENDAR SCHEDULER
                </span>
                <h3 className="font-serif text-xl text-white">
                  {editingEvent ? 'Edit / Reschedule Event' : 'Schedule New Studio Event'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Event Category *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_type: e.target.value as WeddingSubEventType,
                      })
                    }
                    className="drk-select"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Pre-wedding shoot">Pre-wedding shoot</option>
                    <option value="Post-wedding shoot">Post-wedding shoot</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Haldi">Haldi</option>
                    <option value="Mehndi">Mehndi</option>
                    <option value="Sangeet">Sangeet</option>
                    <option value="Reception">Reception</option>
                    <option value="Client Meeting">Client Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="drk-label">Client / Couple Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="e.g. Sunset Pre-Wedding Shoot at Patratu Valley"
                  className="drk-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Date (Reschedule) *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Venue *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">City / Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-between">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteEvent(editingEvent.id);
                      setModalOpen(false);
                    }}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Cancel / Delete Event
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="drk-btn-secondary"
                  >
                    Close
                  </button>
                  <button type="submit" className="drk-btn-primary">
                    {editingEvent ? 'Save Schedule' : 'Create Calendar Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
