import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Cloud,
  Edit3,
  ExternalLink,
  Film,
  HardDrive,
  MessageSquare,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  getTodayKolkataISO,
  isDateOverdue,
} from '../../lib/formatting';
import type { DeliverableCategory, DeliverableRecord } from '../../types/crm';

const DELIVERABLE_CATEGORIES: DeliverableCategory[] = [
  'Edited photographs',
  'Raw photographs',
  'Wedding teaser',
  'Highlight video',
  'Full wedding film',
  'Instagram reels',
  'Wedding albums',
  'Additional albums',
  'Other deliverables',
];

const DELIVERABLE_STATUSES: DeliverableRecord['status'][] = [
  'Pending',
  'In Production',
  'Ready',
  'Delivered',
];

export const DeliverablesPage: React.FC = () => {
  const {
    deliverables,
    bookings,
    clients,
    team_members,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
  } = useData();
  const { canAccess } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookingFilter, setBookingFilter] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<DeliverableRecord | null>(null);
  const [formState, setFormState] = useState({
    booking_id: bookings[0]?.id || '',
    deliverable_type: 'Edited photographs' as DeliverableCategory,
    deliverable_name: '',
    assigned_editor_id: team_members[0]?.id || '',
    expected_delivery_date: getTodayKolkataISO(),
    actual_delivery_date: '',
    status: 'In Production' as DeliverableRecord['status'],
    internal_delivery_link: '',
    storage_platform: 'Google Drive' as DeliverableRecord['storage_platform'],
    notes: '',
  });

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      const matchesSearch =
        d.deliverable_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.deliverable_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.assigned_editor_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || d.deliverable_type === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchesBooking = bookingFilter === 'ALL' || d.booking_id === bookingFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesBooking;
    });
  }, [deliverables, searchQuery, categoryFilter, statusFilter, bookingFilter]);

  const kpis = useMemo(() => {
    const total = deliverables.length;
    const delivered = deliverables.filter((d) => d.status === 'Delivered').length;
    const readyForHandover = deliverables.filter((d) => d.status === 'Ready').length;
    const overdue = deliverables.filter(
      (d) => d.status !== 'Delivered' && isDateOverdue(d.expected_delivery_date)
    ).length;

    return { total, delivered, readyForHandover, overdue };
  }, [deliverables]);

  const handleOpenAddModal = () => {
    setEditingDeliverable(null);
    setFormState({
      booking_id: bookings[0]?.id || '',
      deliverable_type: 'Edited photographs',
      deliverable_name: '',
      assigned_editor_id: team_members[0]?.id || '',
      expected_delivery_date: getTodayKolkataISO(),
      actual_delivery_date: '',
      status: 'In Production',
      internal_delivery_link: 'https://drive.google.com/drive/folders/drk-weddings-',
      storage_platform: 'Google Drive',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (del: DeliverableRecord) => {
    setEditingDeliverable(del);
    setFormState({
      booking_id: del.booking_id,
      deliverable_type: del.deliverable_type,
      deliverable_name: del.deliverable_name,
      assigned_editor_id: del.assigned_editor_id || '',
      expected_delivery_date: del.expected_delivery_date,
      actual_delivery_date: del.actual_delivery_date || '',
      status: del.status,
      internal_delivery_link: del.internal_delivery_link,
      storage_platform: del.storage_platform,
      notes: del.notes,
    });
    setShowModal(true);
  };

  const handleSaveDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    const booking = bookings.find((b) => b.id === formState.booking_id);
    const editor = team_members.find((m) => m.id === formState.assigned_editor_id);

    const actualDate =
      formState.status === 'Delivered' && !formState.actual_delivery_date
        ? getTodayKolkataISO()
        : formState.actual_delivery_date || undefined;

    if (editingDeliverable) {
      updateDeliverable(editingDeliverable.id, {
        booking_id: booking?.id || editingDeliverable.booking_id,
        booking_code: booking?.booking_code || editingDeliverable.booking_code,
        client_name: booking?.client_name || editingDeliverable.client_name,
        deliverable_type: formState.deliverable_type,
        deliverable_name: formState.deliverable_name,
        assigned_editor_id: editor?.id,
        assigned_editor_name: editor?.full_name || 'Unassigned',
        expected_delivery_date: formState.expected_delivery_date,
        actual_delivery_date: actualDate,
        status: formState.status,
        internal_delivery_link: formState.internal_delivery_link,
        storage_platform: formState.storage_platform,
        notes: formState.notes,
      });
    } else {
      addDeliverable({
        booking_id: booking?.id || '',
        booking_code: booking?.booking_code || 'BK-000',
        client_name: booking?.client_name || 'Studio Client',
        deliverable_type: formState.deliverable_type,
        deliverable_name: formState.deliverable_name,
        assigned_editor_id: editor?.id,
        assigned_editor_name: editor?.full_name || 'Unassigned',
        expected_delivery_date: formState.expected_delivery_date,
        actual_delivery_date: actualDate,
        status: formState.status,
        internal_delivery_link: formState.internal_delivery_link,
        storage_platform: formState.storage_platform,
        notes: formState.notes,
      });
    }
    setShowModal(false);
  };

  const getClientPhoneForBooking = (bookingId: string) => {
    const bk = bookings.find((b) => b.id === bookingId);
    if (!bk) return '919934504101';
    const cl = clients.find((c) => c.id === bk.client_id);
    return cl?.whatsapp || bk.client_phone || '919934504101';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <PackageCheck className="h-3.5 w-3.5 text-gold-400" />
              Final Handover & Cloud Storage Ledger
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Deliverable Tracking & Cloud Links
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Internal studio tracking for Edited Photos, RAW Sets, Wedding Teasers, Highlight Films, Full Films, Reels & Luxury Albums.
          </p>
        </div>

        {canAccess('deliverables', 'create') && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-sm font-semibold text-gold-300 shadow-sm hover:bg-obsidian-800"
          >
            <Plus className="h-4 w-4" />
            Add Deliverable Record
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Total Tracked Deliverables
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-obsidian-900 text-gold-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-obsidian-900">{kpis.total}</p>
          <p className="mt-1 text-xs text-obsidian-500">Across 9 deliverable categories</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Ready for Handover
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Cloud className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-amber-700">
            {kpis.readyForHandover}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Uploaded to Drive/Dropbox or printed</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Overdue Deliverables
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-rose-700">{kpis.overdue}</p>
          <p className="mt-1 text-xs text-obsidian-500">Past expected delivery date</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Delivered & Closed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-700">{kpis.delivered}</p>
          <p className="mt-1 text-xs text-obsidian-500">Handed over to couples</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="argon-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverable title, couple, booking ID, editor..."
            className="w-full rounded-xl border border-obsidian-200 py-2 pl-9 pr-3 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value)}
            className="rounded-xl border border-obsidian-200 px-3 py-2 text-xs font-medium text-obsidian-700"
          >
            <option value="ALL">All Wedding Bookings</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.booking_code} — {b.client_name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-obsidian-200 px-3 py-2 text-xs font-medium text-obsidian-700"
          >
            <option value="ALL">All 9 Deliverable Types</option>
            {DELIVERABLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-obsidian-200 px-3 py-2 text-xs font-medium text-obsidian-700"
          >
            <option value="ALL">All Statuses</option>
            {DELIVERABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swipe-Style Mobile Deliverable Cards (< 768px) */}
      <div className="space-y-3 md:hidden">
        {filteredDeliverables.map((del) => {
          const overdue =
            del.status !== 'Delivered' && isDateOverdue(del.expected_delivery_date);
          const statusColors: Record<DeliverableRecord['status'], string> = {
            Pending: 'bg-obsidian-100 text-obsidian-700',
            'In Production': 'bg-amber-50 text-amber-800',
            Ready: 'bg-purple-50 text-purple-800',
            Delivered: 'bg-emerald-50 text-emerald-700',
          };
          const clientPhone = getClientPhoneForBooking(del.booking_id);
          const whatsappMsg = `Namaste ${del.client_name}, your ${del.deliverable_type} (${del.deliverable_name}) from THE DRK WEDDINGS is ready! ${
            del.internal_delivery_link
              ? `Access link: ${del.internal_delivery_link}`
              : 'Please contact our studio for physical collection.'
          }`;

          return (
            <div
              key={del.id}
              className={`swipe-record-card space-y-3 ${
                overdue ? 'border-rose-300 bg-rose-50/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-obsidian-400">
                      {del.deliverable_code}
                    </span>
                    <span className="rounded-md bg-obsidian-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                      {del.deliverable_type}
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-obsidian-900 mt-1">
                    {del.deliverable_name}
                  </h4>
                  <p className="text-xs text-obsidian-500">
                    {del.client_name} ({del.booking_code})
                  </p>
                </div>

                <select
                  value={del.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as DeliverableRecord['status'];
                    updateDeliverable(del.id, {
                      status: nextStatus,
                      actual_delivery_date:
                        nextStatus === 'Delivered'
                          ? del.actual_delivery_date || getTodayKolkataISO()
                          : del.actual_delivery_date,
                    });
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${
                    statusColors[del.status]
                  }`}
                >
                  {DELIVERABLE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-obsidian-100">
                <div>
                  <span className={overdue ? 'font-bold text-rose-700' : 'text-obsidian-700'}>
                    Due: {formatDateDDMMYYYY(del.expected_delivery_date)}
                  </span>
                  <span className="text-obsidian-400 block text-[11px]">
                    Editor: {del.assigned_editor_name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {del.internal_delivery_link && (
                    <a
                      href={del.internal_delivery_link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-obsidian-100 px-2.5 py-1.5 text-xs font-semibold text-gold-700"
                    >
                      Drive Link
                    </a>
                  )}
                  <a
                    href={buildWhatsAppLink(clientPhone, whatsappMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Notify
                  </a>
                  <button
                    onClick={() => handleOpenEditModal(del)}
                    className="rounded-lg p-1.5 text-obsidian-500 border border-obsidian-200"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deliverables Table (Laptop & Desktop >= 768px) */}
      <div className="hidden md:block argon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
              <tr>
                <th className="px-5 py-3.5">Deliverable & Type</th>
                <th className="px-4 py-3.5">Booking & Couple</th>
                <th className="px-4 py-3.5">Assigned Editor</th>
                <th className="px-4 py-3.5">Expected / Actual Date</th>
                <th className="px-4 py-3.5">Storage / Cloud Link</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-100">
              {filteredDeliverables.map((del) => {
                const overdue =
                  del.status !== 'Delivered' && isDateOverdue(del.expected_delivery_date);
                const statusColors: Record<DeliverableRecord['status'], string> = {
                  Pending: 'bg-obsidian-100 text-obsidian-700',
                  'In Production': 'bg-amber-50 text-amber-800',
                  Ready: 'bg-purple-50 text-purple-800',
                  Delivered: 'bg-emerald-50 text-emerald-700',
                };

                const clientPhone = getClientPhoneForBooking(del.booking_id);
                const whatsappMsg = `Namaste ${del.client_name}, your ${del.deliverable_type} (${del.deliverable_name}) from THE DRK WEDDINGS is ready! ${
                  del.internal_delivery_link
                    ? `Access link: ${del.internal_delivery_link}`
                    : 'Please contact our studio for physical collection.'
                }`;

                return (
                  <tr
                    key={del.id}
                    className={overdue ? 'bg-rose-50/40' : 'hover:bg-obsidian-50/50'}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-obsidian-400">
                          {del.deliverable_code}
                        </span>
                        <span className="rounded-md bg-obsidian-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                          {del.deliverable_type}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-obsidian-900">
                        {del.deliverable_name}
                      </p>
                      {del.notes && (
                        <p className="mt-0.5 text-xs text-obsidian-500">{del.notes}</p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-obsidian-900">{del.client_name}</div>
                      <div className="font-mono text-xs text-obsidian-500">
                        {del.booking_code}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-obsidian-800">
                      {del.assigned_editor_name}
                    </td>

                    <td className="px-4 py-4 text-xs">
                      <div className={overdue ? 'font-bold text-rose-700' : 'text-obsidian-800'}>
                        Expected: {formatDateDDMMYYYY(del.expected_delivery_date)}
                        {overdue && ' (OVERDUE)'}
                      </div>
                      <div className="mt-0.5 text-obsidian-500">
                        Actual:{' '}
                        {del.actual_delivery_date
                          ? formatDateDDMMYYYY(del.actual_delivery_date)
                          : 'Pending'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-obsidian-700">
                        {del.storage_platform}
                      </div>
                      {del.internal_delivery_link ? (
                        <a
                          href={del.internal_delivery_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Storage Link
                        </a>
                      ) : (
                        <span className="text-[11px] text-obsidian-400">Physical / Local</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={del.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as DeliverableRecord['status'];
                          updateDeliverable(del.id, {
                            status: nextStatus,
                            actual_delivery_date:
                              nextStatus === 'Delivered'
                                ? del.actual_delivery_date || getTodayKolkataISO()
                                : del.actual_delivery_date,
                          });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusColors[del.status]
                        }`}
                      >
                        {DELIVERABLE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={buildWhatsAppLink(clientPhone, whatsappMsg)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          title="Send WhatsApp Delivery Notification"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Notify
                        </a>
                        <button
                          onClick={() => handleOpenEditModal(del)}
                          className="rounded-lg p-1.5 text-obsidian-500 hover:bg-obsidian-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {canAccess('deliverables', 'delete') && (
                          <button
                            onClick={() => deleteDeliverable(del.id)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT DELIVERABLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {editingDeliverable ? 'Edit Deliverable Record' : 'Add Studio Deliverable'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverable} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Related Wedding Booking *
                  </label>
                  <select
                    value={formState.booking_id}
                    onChange={(e) => setFormState({ ...formState, booking_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} — {b.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Deliverable Category *
                  </label>
                  <select
                    value={formState.deliverable_type}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        deliverable_type: e.target.value as DeliverableCategory,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {DELIVERABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Deliverable Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 4K Cinematic Wedding Highlight Film (5 Mins)"
                  value={formState.deliverable_name}
                  onChange={(e) =>
                    setFormState({ ...formState, deliverable_name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Assigned Editor
                  </label>
                  <select
                    value={formState.assigned_editor_id}
                    onChange={(e) =>
                      setFormState({ ...formState, assigned_editor_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {team_members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Delivery Status
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        status: e.target.value as DeliverableRecord['status'],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {DELIVERABLE_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.expected_delivery_date}
                    onChange={(e) =>
                      setFormState({ ...formState, expected_delivery_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Actual Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formState.actual_delivery_date}
                    onChange={(e) =>
                      setFormState({ ...formState, actual_delivery_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Storage Platform
                  </label>
                  <select
                    value={formState.storage_platform}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        storage_platform: e.target.value as DeliverableRecord['storage_platform'],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="Google Drive">Google Drive</option>
                    <option value="Dropbox">Dropbox</option>
                    <option value="Physical Handover">Physical Handover</option>
                    <option value="Hard Drive">Hard Drive</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Internal Cloud Link (Google Drive / Dropbox URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formState.internal_delivery_link}
                    onChange={(e) =>
                      setFormState({ ...formState, internal_delivery_link: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">Notes</label>
                <textarea
                  rows={2}
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-obsidian-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  {editingDeliverable ? 'Save Changes' : 'Create Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
