import React, { useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Film,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatINR,
  getTodayKolkataISO,
} from '../../lib/formatting';
import type {
  ExpenseCategory,
  PaymentMethod,
  StaffRole,
  TeamMemberRecord,
} from '../../types/crm';

const ALL_ROLES: StaffRole[] = [
  'Owner',
  'Administrator',
  'Photographer',
  'Cinematographer',
  'Video Editor',
  'Photo Editor',
  'Album Designer',
  'Other Staff',
];

export const TeamPage: React.FC = () => {
  const {
    team_members,
    bookings,
    events,
    tasks,
    expenses,
    permissions,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addExpense,
    updatePermission,
  } = useData();
  const { canAccess } = useAuth();

  const [activeTab, setActiveTab] = useState<'roster' | 'workload' | 'permissions'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<StaffRole>('Photographer');

  // Detail & Payout Drawer State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberRecord | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Member Form State
  const [formState, setFormState] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    role: 'Photographer' as StaffRole,
    employment_type: 'In-House' as 'In-House' | 'Freelancer',
    payment_rate: 15000,
    rate_basis: 'Per Event' as TeamMemberRecord['rate_basis'],
    specialization: '',
    equipment_owned: '',
    availability_status: 'Available' as TeamMemberRecord['availability_status'],
    unavailable_dates_str: '',
    total_paid: 0,
    total_pending: 0,
    notes: '',
  });

  // Staff Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    amount: 15000,
    payment_method: 'UPI' as PaymentMethod,
    booking_id: '',
    expense_date: getTodayKolkataISO(),
    description: '',
  });

  const selectedMember = useMemo(
    () => team_members.find((m) => m.id === selectedMemberId) || null,
    [team_members, selectedMemberId]
  );

  // Enrich each team member with real relational workload, events, tasks, and payment history
  const memberMetrics = useMemo(() => {
    const map: Record<
      string,
      {
        assignedBookingsCount: number;
        assignedEventsCount: number;
        upcomingEventsCount: number;
        activeTasksCount: number;
        completedTasksCount: number;
        recordedExpensesTotal: number;
      }
    > = {};

    const today = getTodayKolkataISO();

    team_members.forEach((m) => {
      const assignedBookings = bookings.filter((b) => b.assigned_team_ids.includes(m.id));
      const assignedEvents = events.filter(
        (e) =>
          e.assigned_photographers.includes(m.id) || e.assigned_cinematographers.includes(m.id)
      );
      const upcomingEvents = assignedEvents.filter(
        (e) => e.event_date >= today && e.completion_status !== 'Cancelled'
      );
      const memberTasks = tasks.filter((t) => t.assigned_staff_id === m.id);
      const activeTasks = memberTasks.filter((t) => t.status !== 'Completed');
      const completedTasks = memberTasks.filter((t) => t.status === 'Completed');
      const memberExpenses = expenses.filter(
        (ex) => ex.team_member_id === m.id || ex.vendor_or_recipient === m.full_name
      );
      const recordedExpensesTotal = memberExpenses.reduce((sum, ex) => sum + ex.amount, 0);

      map[m.id] = {
        assignedBookingsCount: assignedBookings.length,
        assignedEventsCount: assignedEvents.length,
        upcomingEventsCount: upcomingEvents.length,
        activeTasksCount: activeTasks.length,
        completedTasksCount: completedTasks.length,
        recordedExpensesTotal,
      };
    });

    return map;
  }, [team_members, bookings, events, tasks, expenses]);

  const filteredMembers = useMemo(() => {
    return team_members.filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.member_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery);
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchesAvail =
        availabilityFilter === 'ALL' || m.availability_status === availabilityFilter;
      return matchesSearch && matchesRole && matchesAvail;
    });
  }, [team_members, searchQuery, roleFilter, availabilityFilter]);

  const kpis = useMemo(() => {
    const totalMembers = team_members.length;
    const inHouseCount = team_members.filter((m) => m.employment_type === 'In-House').length;
    const freelancerCount = team_members.filter((m) => m.employment_type === 'Freelancer').length;
    const totalPaidToStaff = team_members.reduce((acc, m) => acc + m.total_paid, 0);
    const totalPendingPayouts = team_members.reduce((acc, m) => acc + m.total_pending, 0);
    return {
      totalMembers,
      inHouseCount,
      freelancerCount,
      totalPaidToStaff,
      totalPendingPayouts,
    };
  }, [team_members]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormState({
      full_name: '',
      phone: '+91 ',
      whatsapp: '91',
      email: '',
      role: 'Photographer',
      employment_type: 'Freelancer',
      payment_rate: 15000,
      rate_basis: 'Per Event',
      specialization: 'Candid Photography & Portraits',
      equipment_owned: 'Sony A7IV, 35mm f/1.4 GM, 85mm f/1.4 GM',
      availability_status: 'Available',
      unavailable_dates_str: '',
      total_paid: 0,
      total_pending: 0,
      notes: '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (member: TeamMemberRecord) => {
    setEditingMember(member);
    setFormState({
      full_name: member.full_name,
      phone: member.phone,
      whatsapp: member.whatsapp,
      email: member.email,
      role: member.role,
      employment_type: member.employment_type,
      payment_rate: member.payment_rate,
      rate_basis: member.rate_basis,
      specialization: member.specialization,
      equipment_owned: member.equipment_owned,
      availability_status: member.availability_status,
      unavailable_dates_str: member.unavailable_dates.join(', '),
      total_paid: member.total_paid,
      total_pending: member.total_pending,
      notes: member.notes,
    });
    setShowAddEditModal(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const unavailableDates = formState.unavailable_dates_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingMember) {
      updateTeamMember(editingMember.id, {
        full_name: formState.full_name,
        phone: formState.phone,
        whatsapp: formState.whatsapp || formState.phone,
        email: formState.email,
        role: formState.role,
        employment_type: formState.employment_type,
        payment_rate: Number(formState.payment_rate),
        rate_basis: formState.rate_basis,
        specialization: formState.specialization,
        equipment_owned: formState.equipment_owned,
        availability_status: formState.availability_status,
        unavailable_dates: unavailableDates,
        total_paid: Number(formState.total_paid),
        total_pending: Number(formState.total_pending),
        notes: formState.notes,
      });
    } else {
      addTeamMember({
        full_name: formState.full_name,
        phone: formState.phone,
        whatsapp: formState.whatsapp || formState.phone,
        email: formState.email,
        role: formState.role,
        employment_type: formState.employment_type,
        payment_rate: Number(formState.payment_rate),
        rate_basis: formState.rate_basis,
        specialization: formState.specialization,
        equipment_owned: formState.equipment_owned,
        availability_status: formState.availability_status,
        unavailable_dates: unavailableDates,
        total_paid: Number(formState.total_paid),
        total_pending: Number(formState.total_pending),
        notes: formState.notes,
      });
    }
    setShowAddEditModal(false);
  };

  const handleOpenPayoutModal = (member: TeamMemberRecord) => {
    setSelectedMemberId(member.id);
    setPayoutForm({
      amount: member.total_pending > 0 ? member.total_pending : member.payment_rate,
      payment_method: 'UPI',
      booking_id: '',
      expense_date: getTodayKolkataISO(),
      description: `${member.role} remuneration (${member.rate_basis}) — ${member.full_name}`,
    });
    setShowPayoutModal(true);
  };

  const handleRecordStaffPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const categoryMap: Partial<Record<StaffRole, ExpenseCategory>> = {
      Photographer: 'Photographer payments',
      Cinematographer: 'Cinematographer payments',
      'Video Editor': 'Editor payments',
      'Photo Editor': 'Editor payments',
      'Album Designer': 'Album printing',
    };
    const expenseCat: ExpenseCategory = categoryMap[selectedMember.role] || 'Miscellaneous';
    const linkedBooking = bookings.find((b) => b.id === payoutForm.booking_id);

    addExpense({
      expense_date: payoutForm.expense_date,
      category: expenseCat,
      amount: Number(payoutForm.amount),
      payment_method: payoutForm.payment_method,
      booking_id: linkedBooking?.id,
      booking_code: linkedBooking?.booking_code,
      team_member_id: selectedMember.id,
      vendor_or_recipient: selectedMember.full_name,
      description:
        payoutForm.description ||
        `Staff Payout to ${selectedMember.full_name} (${selectedMember.role})`,
    });

    setShowPayoutModal(false);
  };

  const rolePermissions = useMemo(
    () => permissions.filter((p) => p.role_name === selectedRoleForMatrix),
    [permissions, selectedRoleForMatrix]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <Users className="h-3.5 w-3.5 text-gold-400" />
              Internal Studio Roster & RBAC
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Team, Freelancers & Role Permissions
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Manage in-house photographers, cinematographers, editors, availability schedules, payouts, and role-based access control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canAccess('team', 'create') && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-sm font-semibold text-gold-300 shadow-sm transition hover:bg-obsidian-800"
            >
              <Plus className="h-4 w-4" />
              Add Team Member
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Total Crew & Staff
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-obsidian-900 text-gold-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-obsidian-900">{kpis.totalMembers}</p>
          <p className="mt-1 text-xs text-obsidian-500">
            {kpis.inHouseCount} In-House • {kpis.freelancerCount} Freelancers
          </p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Photographers & Cinema
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-obsidian-900">
            {
              team_members.filter(
                (m) => m.role === 'Photographer' || m.role === 'Cinematographer' || m.role === 'Owner'
              ).length
            }
          </p>
          <p className="mt-1 text-xs text-obsidian-500">On-ground production crew</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Post-Production Editors
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Film className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-obsidian-900">
            {
              team_members.filter(
                (m) =>
                  m.role === 'Video Editor' ||
                  m.role === 'Photo Editor' ||
                  m.role === 'Album Designer'
              ).length
            }
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Editing & album design suite</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Total Paid to Crew
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-700">
            {formatINR(kpis.totalPaidToStaff)}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Disbursed salaries & shoot fees</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Pending Crew Dues
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-rose-700">
            {formatINR(kpis.totalPendingPayouts)}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Awaiting settlement</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-obsidian-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'roster'
                ? 'bg-obsidian-900 text-gold-300 shadow-sm'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            Team Roster & Availability ({team_members.length})
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'workload'
                ? 'bg-obsidian-900 text-gold-300 shadow-sm'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            Workload & Payout Ledger
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'permissions'
                ? 'bg-obsidian-900 text-gold-300 shadow-sm'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            <Shield className="h-4 w-4" />
            Role-Based Permissions (RBAC)
          </button>
        </div>

        {activeTab !== 'permissions' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crew name, role, gear..."
                className="w-60 rounded-xl border border-obsidian-200 bg-white py-2 pl-9 pr-3 text-xs text-obsidian-900 focus:border-gold-500 focus:outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2 text-xs font-medium text-obsidian-700 focus:border-gold-500 focus:outline-none"
            >
              <option value="ALL">All Roles (8)</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="rounded-xl border border-obsidian-200 bg-white px-3 py-2 text-xs font-medium text-obsidian-700 focus:border-gold-500 focus:outline-none"
            >
              <option value="ALL">All Availability</option>
              <option value="Available">Available</option>
              <option value="On Shoot">On Shoot</option>
              <option value="Busy">Busy</option>
              <option value="Leave">Leave</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: TEAM ROSTER CARDS */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => {
            const metrics = memberMetrics[member.id] || {
              assignedBookingsCount: 0,
              assignedEventsCount: 0,
              upcomingEventsCount: 0,
              activeTasksCount: 0,
              completedTasksCount: 0,
              recordedExpensesTotal: 0,
            };

            const statusColors: Record<TeamMemberRecord['availability_status'], string> = {
              Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'On Shoot': 'bg-amber-50 text-amber-800 border-amber-200',
              Busy: 'bg-purple-50 text-purple-700 border-purple-200',
              Leave: 'bg-rose-50 text-rose-700 border-rose-200',
            };

            return (
              <div
                key={member.id}
                className="argon-card flex flex-col justify-between p-5 transition hover:border-gold-400"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-obsidian-900 font-serif text-lg font-bold text-gold-300">
                        {member.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-obsidian-900">
                            {member.full_name}
                          </h3>
                          <span className="rounded-md bg-obsidian-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-obsidian-600">
                            {member.member_code}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold text-gold-700">{member.role}</span>
                          <span className="text-obsidian-300">•</span>
                          <span className="rounded-full bg-obsidian-100 px-2 py-0.5 text-[10px] font-semibold text-obsidian-700">
                            {member.employment_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        statusColors[member.availability_status]
                      }`}
                    >
                      {member.availability_status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-obsidian-600">{member.specialization}</p>

                  {member.equipment_owned && (
                    <div className="mt-2.5 rounded-xl bg-obsidian-50 p-2.5 text-[11px] text-obsidian-600">
                      <span className="font-semibold text-obsidian-800">Primary Gear: </span>
                      {member.equipment_owned}
                    </div>
                  )}

                  {/* Workload Mini Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-obsidian-100 bg-white p-3 text-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-obsidian-400">
                        Upcoming Shoots
                      </p>
                      <p className="mt-0.5 font-serif text-base font-bold text-obsidian-900">
                        {metrics.upcomingEventsCount}
                      </p>
                    </div>
                    <div className="border-x border-obsidian-100">
                      <p className="text-[10px] font-semibold uppercase text-obsidian-400">
                        Active Tasks
                      </p>
                      <p className="mt-0.5 font-serif text-base font-bold text-amber-700">
                        {metrics.activeTasksCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-obsidian-400">
                        Completed
                      </p>
                      <p className="mt-0.5 font-serif text-base font-bold text-emerald-700">
                        {metrics.completedTasksCount}
                      </p>
                    </div>
                  </div>

                  {/* Financial Rate & Balance */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-obsidian-900/5 px-3 py-2 text-xs">
                    <div>
                      <span className="text-obsidian-500">Rate: </span>
                      <span className="font-semibold text-obsidian-900">
                        {formatINR(member.payment_rate)} / {member.rate_basis.replace('Per ', '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-obsidian-500">Pending: </span>
                      <span
                        className={`font-bold ${
                          member.total_pending > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatINR(member.total_pending)}
                      </span>
                    </div>
                  </div>

                  {member.unavailable_dates.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1 text-[11px] text-rose-700">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-semibold">Blocked Dates:</span>
                      {member.unavailable_dates.map((d) => (
                        <span
                          key={d}
                          className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-800"
                        >
                          {formatDateDDMMYYYY(d)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-obsidian-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={buildWhatsAppLink(
                        member.whatsapp || member.phone,
                        `Hi ${member.full_name}, regarding upcoming shoot/production schedule at THE DRK WEDDINGS.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <button
                      onClick={() => handleOpenPayoutModal(member)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Pay
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedMemberId(member.id)}
                      className="rounded-lg bg-obsidian-100 px-2.5 py-1.5 text-xs font-semibold text-obsidian-800 hover:bg-obsidian-200"
                    >
                      Work History
                    </button>
                    {canAccess('team', 'edit') && (
                      <button
                        onClick={() => handleOpenEditModal(member)}
                        className="rounded-lg p-1.5 text-obsidian-500 hover:bg-obsidian-100 hover:text-obsidian-900"
                        title="Edit Team Member"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canAccess('team', 'delete') && member.role !== 'Owner' && (
                      <button
                        onClick={() => deleteTeamMember(member.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Remove Team Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: WORKLOAD & PAYOUT LEDGER TABLE */}
      {activeTab === 'workload' && (
        <div className="argon-card overflow-hidden">
          <div className="border-b border-obsidian-100 px-6 py-4">
            <h2 className="font-serif text-lg font-bold text-obsidian-900">
              Crew Workload Distribution & Freelancer Remuneration Ledger
            </h2>
            <p className="text-xs text-obsidian-500">
              Real-time overview of assigned bookings, shoot events, active post-production tasks, and cumulative payments.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
                <tr>
                  <th className="px-5 py-3.5">Team Member</th>
                  <th className="px-4 py-3.5">Role & Type</th>
                  <th className="px-4 py-3.5">Standard Rate</th>
                  <th className="px-4 py-3.5 text-center">Weddings</th>
                  <th className="px-4 py-3.5 text-center">Events</th>
                  <th className="px-4 py-3.5 text-center">Active Tasks</th>
                  <th className="px-4 py-3.5 text-right">Total Paid</th>
                  <th className="px-4 py-3.5 text-right">Pending Due</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-100">
                {filteredMembers.map((member) => {
                  const m = memberMetrics[member.id];
                  return (
                    <tr key={member.id} className="hover:bg-obsidian-50/60">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-obsidian-900">{member.full_name}</div>
                        <div className="text-xs text-obsidian-500">
                          {member.member_code} • {member.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-obsidian-800">{member.role}</div>
                        <span className="text-[11px] text-obsidian-500">
                          {member.employment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-obsidian-900">
                          {formatINR(member.payment_rate)}
                        </div>
                        <div className="text-[11px] text-obsidian-500">{member.rate_basis}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-obsidian-800">
                        {m?.assignedBookingsCount || 0}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {m?.assignedEventsCount || 0} shoots
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                          {m?.activeTasksCount || 0} active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                        {formatINR(member.total_paid)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-700">
                        {formatINR(member.total_pending)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPayoutModal(member)}
                            className="rounded-lg bg-obsidian-900 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-obsidian-800"
                          >
                            Record Payout
                          </button>
                          <button
                            onClick={() => setSelectedMemberId(member.id)}
                            className="rounded-lg border border-obsidian-200 px-2.5 py-1.5 text-xs font-semibold text-obsidian-700 hover:bg-obsidian-100"
                          >
                            Details
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

      {/* TAB 3: ROLE-BASED ACCESS CONTROL (RBAC) PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="argon-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-obsidian-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gold-600" />
                <h2 className="font-serif text-lg font-bold text-obsidian-900">
                  Internal Staff Role-Based Access Control (RBAC) Matrix
                </h2>
              </div>
              <p className="mt-1 text-xs text-obsidian-500">
                Strictly internal staff permissions. Customers never log in or access any module.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-obsidian-600">Configure Role:</span>
              <select
                value={selectedRoleForMatrix}
                onChange={(e) => setSelectedRoleForMatrix(e.target.value as StaffRole)}
                className="rounded-xl border border-obsidian-200 bg-obsidian-900 px-3.5 py-2 text-xs font-semibold text-gold-300 focus:outline-none"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
                <tr>
                  <th className="px-6 py-3.5">CRM Module</th>
                  <th className="px-4 py-3.5 text-center">View Access</th>
                  <th className="px-4 py-3.5 text-center">Create Records</th>
                  <th className="px-4 py-3.5 text-center">Edit Records</th>
                  <th className="px-4 py-3.5 text-center">Delete / Void</th>
                  <th className="px-6 py-3.5 text-center">View Financials (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-100">
                {rolePermissions.map((perm) => {
                  const isOwnerRole = perm.role_name === 'Owner';
                  return (
                    <tr key={perm.id} className="hover:bg-obsidian-50/50">
                      <td className="px-6 py-3.5 font-semibold capitalize text-obsidian-900">
                        {perm.module}
                      </td>
                      {(
                        [
                          'can_view',
                          'can_create',
                          'can_edit',
                          'can_delete',
                          'can_view_financials',
                        ] as const
                      ).map((field) => (
                        <td key={field} className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={perm[field]}
                            disabled={isOwnerRole}
                            onChange={(e) =>
                              updatePermission(perm.id, { [field]: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-obsidian-300 text-obsidian-900 focus:ring-gold-500 disabled:opacity-50"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WORK HISTORY & PAYMENT LEDGER DRAWER MODAL */}
      {selectedMember && !showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-obsidian-950/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-5 text-white">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
                  {selectedMember.member_code} • {selectedMember.role} ({selectedMember.employment_type})
                </span>
                <h2 className="mt-1 font-serif text-xl font-bold">{selectedMember.full_name}</h2>
              </div>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="rounded-lg p-2 text-obsidian-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Contact & Rate Summary */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-obsidian-50 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-obsidian-500">Standard Rate</p>
                  <p className="font-serif text-base font-bold text-obsidian-900">
                    {formatINR(selectedMember.payment_rate)}
                  </p>
                  <p className="text-[10px] text-obsidian-500">{selectedMember.rate_basis}</p>
                </div>
                <div>
                  <p className="text-[11px] text-obsidian-500">Total Paid</p>
                  <p className="font-serif text-base font-bold text-emerald-700">
                    {formatINR(selectedMember.total_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-obsidian-500">Pending Dues</p>
                  <p className="font-serif text-base font-bold text-rose-700">
                    {formatINR(selectedMember.total_pending)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-obsidian-500">Availability</p>
                  <p className="font-semibold text-obsidian-900">
                    {selectedMember.availability_status}
                  </p>
                </div>
              </div>

              {/* Assigned Wedding Events */}
              <div>
                <h3 className="font-serif text-base font-bold text-obsidian-900">
                  Assigned Shoot Events & Schedule
                </h3>
                <div className="mt-3 space-y-2.5">
                  {events
                    .filter(
                      (ev) =>
                        ev.assigned_photographers.includes(selectedMember.id) ||
                        ev.assigned_cinematographers.includes(selectedMember.id)
                    )
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between rounded-xl border border-obsidian-100 p-3.5"
                      >
                        <div>
                          <p className="font-semibold text-obsidian-900">
                            {ev.event_name} — {ev.client_name}
                          </p>
                          <p className="text-xs text-obsidian-500">
                            {formatDateDDMMYYYY(ev.event_date)} ({ev.start_time} - {ev.end_time}) •{' '}
                            {ev.venue}
                          </p>
                        </div>
                        <span className="rounded-full bg-obsidian-100 px-2.5 py-1 text-xs font-semibold text-obsidian-700">
                          {ev.completion_status}
                        </span>
                      </div>
                    ))}
                  {events.filter(
                    (ev) =>
                      ev.assigned_photographers.includes(selectedMember.id) ||
                      ev.assigned_cinematographers.includes(selectedMember.id)
                  ).length === 0 && (
                    <p className="text-xs text-obsidian-400">No shoot events assigned yet.</p>
                  )}
                </div>
              </div>

              {/* Assigned Post-Production Tasks */}
              <div>
                <h3 className="font-serif text-base font-bold text-obsidian-900">
                  Assigned Post-Production Tasks
                </h3>
                <div className="mt-3 space-y-2.5">
                  {tasks
                    .filter((t) => t.assigned_staff_id === selectedMember.id)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl border border-obsidian-100 p-3.5"
                      >
                        <div>
                          <p className="font-semibold text-obsidian-900">{t.task_name}</p>
                          <p className="text-xs text-obsidian-500">
                            {t.client_name} ({t.booking_code}) • Due: {formatDateDDMMYYYY(t.deadline)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {t.status} ({t.progress_percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  {tasks.filter((t) => t.assigned_staff_id === selectedMember.id).length === 0 && (
                    <p className="text-xs text-obsidian-400">No editing/production tasks assigned.</p>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-obsidian-900">
                    Disbursed Payout & Expense History
                  </h3>
                  <button
                    onClick={() => handleOpenPayoutModal(selectedMember)}
                    className="rounded-lg bg-obsidian-900 px-3 py-1.5 text-xs font-semibold text-gold-300"
                  >
                    + Record Payout
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {expenses
                    .filter(
                      (ex) =>
                        ex.team_member_id === selectedMember.id ||
                        ex.vendor_or_recipient === selectedMember.full_name
                    )
                    .map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between rounded-xl bg-obsidian-50 px-4 py-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-obsidian-900">{ex.description}</p>
                          <p className="text-obsidian-500">
                            {formatDateDDMMYYYY(ex.expense_date)} • {ex.payment_method}{' '}
                            {ex.booking_code ? `• Booking ${ex.booking_code}` : ''}
                          </p>
                        </div>
                        <span className="font-serif text-sm font-bold text-emerald-700">
                          {formatINR(ex.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT TEAM MEMBER MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <h2 className="font-serif text-lg font-bold">
                {editingMember ? `Edit ${editingMember.full_name}` : 'Add Studio Team Member / Freelancer'}
              </h2>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="rounded-lg p-1.5 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formState.full_name}
                    onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">Role *</label>
                  <select
                    value={formState.role}
                    onChange={(e) =>
                      setFormState({ ...formState, role: e.target.value as StaffRole })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Employment Type
                  </label>
                  <select
                    value={formState.employment_type}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        employment_type: e.target.value as 'In-House' | 'Freelancer',
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="In-House">In-House</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Availability Status
                  </label>
                  <select
                    value={formState.availability_status}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        availability_status: e.target
                          .value as TeamMemberRecord['availability_status'],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="Available">Available</option>
                    <option value="On Shoot">On Shoot</option>
                    <option value="Busy">Busy</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Payment Rate (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formState.payment_rate}
                    onChange={(e) =>
                      setFormState({ ...formState, payment_rate: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">Rate Basis</label>
                  <select
                    value={formState.rate_basis}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        rate_basis: e.target.value as TeamMemberRecord['rate_basis'],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="Per Day">Per Day</option>
                    <option value="Per Event">Per Event</option>
                    <option value="Per Project">Per Project</option>
                    <option value="Monthly Salary">Monthly Salary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Specialization & Style
                </label>
                <input
                  type="text"
                  value={formState.specialization}
                  onChange={(e) => setFormState({ ...formState, specialization: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Cameras, Lenses & Audio Gear
                </label>
                <input
                  type="text"
                  value={formState.equipment_owned}
                  onChange={(e) => setFormState({ ...formState, equipment_owned: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Unavailable / Blocked Dates (comma-separated YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  placeholder="2025-12-10, 2025-12-18"
                  value={formState.unavailable_dates_str}
                  onChange={(e) =>
                    setFormState({ ...formState, unavailable_dates_str: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-obsidian-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD STAFF PAYOUT MODAL */}
      {showPayoutModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
                  Staff Expense & Remuneration
                </span>
                <h3 className="font-serif text-lg font-bold">Pay {selectedMember.full_name}</h3>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordStaffPayout} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payoutForm.amount}
                  onChange={(e) =>
                    setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payoutForm.expense_date}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, expense_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Payment Mode
                  </label>
                  <select
                    value={payoutForm.payment_method}
                    onChange={(e) =>
                      setPayoutForm({
                        ...payoutForm,
                        payment_method: e.target.value as PaymentMethod,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Other payment methods">Other payment methods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Link to Wedding Booking (Optional)
                </label>
                <select
                  value={payoutForm.booking_id}
                  onChange={(e) => setPayoutForm({ ...payoutForm, booking_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                >
                  <option value="">General Studio Salary / Retainer</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_code} — {b.client_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">Description</label>
                <input
                  type="text"
                  required
                  value={payoutForm.description}
                  onChange={(e) => setPayoutForm({ ...payoutForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  Record Expense & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
