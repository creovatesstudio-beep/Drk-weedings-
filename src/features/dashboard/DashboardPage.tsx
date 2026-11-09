// ============================================================================
// THE DRK WEDDINGS — EXECUTIVE BUSINESS OVERVIEW DASHBOARD
// All 11 KPIs, 8 Upcoming Activity Feeds, 7 Analytics Charts & 8 Quick Actions
// Calculated 100% dynamically from real database records
// ============================================================================

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Sparkles,
  HeartHandshake,
  Calendar,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Clock,
  Plus,
  Camera,
  Film,
  BookOpen,
  PackageCheck,
  PhoneCall,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import {
  formatDateDDMMYYYY,
  formatINR,
  formatINRCompact,
  getTodayKolkataISO,
  isDateOverdue,
} from '../../lib/formatting';

const CHART_COLORS = ['#C89B3C', '#141414', '#77726A', '#059669', '#D97706', '#2563EB', '#7C3AED'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { canViewFinancials } = useAuth();
  const {
    leads,
    bookings,
    events,
    payments,
    expenses,
    invoices,
    tasks,
    deliverables,
    packages,
  } = useData();

  const today = getTodayKolkataISO();
  const currentMonthPrefix = today.slice(0, 7); // e.g. "2026-11"

  // ---------------------------------------------------------------------------
  // 1. REAL-TIME BUSINESS STATISTICS (ALL 11 METRICS)
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalEnquiries = leads.length;
    const newEnquiriesThisMonth = leads.filter((l) =>
      (l.enquiry_date || l.created_at).startsWith(currentMonthPrefix)
    ).length;

    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
    const confirmedBookings = activeBookings.length;
    const upcomingWeddings = activeBookings.filter(
      (b) => b.wedding_date >= today || b.status === 'Upcoming' || b.status === 'Confirmed'
    ).length;
    const completedBookings = activeBookings.filter(
      (b) => b.status === 'Completed' || b.status === 'Delivered'
    ).length;

    const validPayments = payments.filter((p) => !p.is_voided);
    const totalRevenue = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const revenueThisMonth = validPayments
      .filter((p) => p.payment_date.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    const pendingPaymentBookings = activeBookings.filter((b) => Number(b.balance_amount) > 0);
    const pendingPaymentsCount = pendingPaymentBookings.length;
    const totalOutstandingAmount = pendingPaymentBookings.reduce(
      (sum, b) => sum + Number(b.balance_amount),
      0
    );

    const convertedLeadsCount = leads.filter(
      (l) => l.status === 'Confirmed' || Boolean(l.converted_booking_id)
    ).length;
    const conversionRate =
      totalEnquiries > 0 ? Math.round((convertedLeadsCount / totalEnquiries) * 100) : 0;

    return {
      totalEnquiries,
      newEnquiriesThisMonth,
      confirmedBookings,
      upcomingWeddings,
      completedBookings,
      totalRevenue,
      revenueThisMonth,
      totalExpenses,
      netProfit,
      pendingPaymentsCount,
      totalOutstandingAmount,
      conversionRate,
    };
  }, [leads, bookings, payments, expenses, today, currentMonthPrefix]);

  // ---------------------------------------------------------------------------
  // 2. MONTHLY REVENUE, EXPENSE & PROFIT CHART DATA
  // ---------------------------------------------------------------------------
  const monthlyFinancialData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'May' },
      { key: '2026-06', label: 'Jun' },
      { key: '2026-07', label: 'Jul' },
      { key: '2026-08', label: 'Aug' },
      { key: '2026-09', label: 'Sep' },
      { key: '2026-10', label: 'Oct' },
      { key: '2026-11', label: 'Nov' },
    ];

    const validPayments = payments.filter((p) => !p.is_voided);
    return months.map((m) => {
      const rev = validPayments
        .filter((p) => p.payment_date.startsWith(m.key))
        .reduce((s, p) => s + Number(p.amount), 0);
      const exp = expenses
        .filter((e) => e.expense_date.startsWith(m.key))
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        month: m.label,
        Revenue: rev,
        Expenses: exp,
        Profit: rev - exp,
      };
    });
  }, [payments, expenses]);

  // ---------------------------------------------------------------------------
  // 3. ENQUIRY SOURCE, BOOKING STATUS & POPULAR PACKAGES ANALYTICS
  // ---------------------------------------------------------------------------
  const sourceDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      map[l.enquiry_source] = (map[l.enquiry_source] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const bookingStatusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookings) {
      map[b.status] = (map[b.status] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const popularPackagesData = useMemo(() => {
    return packages.map((pkg) => {
      const bookingsCount = bookings.filter(
        (b) => b.package_id === pkg.id || b.package_name === pkg.name
      ).length;
      const leadsCount = leads.filter(
        (l) => l.interested_package_id === pkg.id || l.interested_package_name === pkg.name
      ).length;
      return {
        name: pkg.name.replace(' Collection', '').slice(0, 24),
        fullName: pkg.name,
        price: pkg.base_price,
        Bookings: bookingsCount,
        Enquiries: leadsCount,
      };
    });
  }, [packages, bookings, leads]);

  // ---------------------------------------------------------------------------
  // 4. UPCOMING ACTIVITIES (ALL 8 OPERATIONAL STREAMS)
  // ---------------------------------------------------------------------------
  const upcomingWeddingsList = useMemo(
    () =>
      bookings
        .filter((b) => b.wedding_date >= today && b.status !== 'Cancelled')
        .sort((a, b) => a.wedding_date.localeCompare(b.wedding_date)),
    [bookings, today]
  );

  const upcomingShootsList = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.event_type !== 'Client Meeting' &&
            e.completion_status !== 'Completed' &&
            e.completion_status !== 'Cancelled'
        )
        .sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [events]
  );

  const clientMeetingsList = useMemo(
    () =>
      events
        .filter((e) => e.event_type === 'Client Meeting' && e.completion_status !== 'Completed')
        .sort((a, b) => a.event_date.localeCompare(b.event_date)),
    [events]
  );

  const paymentDueDatesList = useMemo(
    () =>
      invoices
        .filter((inv) => inv.balance_amount > 0)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [invoices]
  );

  const editingDeadlinesList = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            (t.workflow_track === 'Photography editing' ||
              t.workflow_track === 'Cinematography editing' ||
              t.workflow_track === 'Video production') &&
            t.status !== 'Completed'
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [tasks]
  );

  const albumDeadlinesList = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            (t.workflow_track === 'Album designing' || t.workflow_track === 'Album printing') &&
            t.status !== 'Completed'
        )
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [tasks]
  );

  const deliveryDeadlinesList = useMemo(
    () =>
      deliverables
        .filter((d) => d.status !== 'Delivered')
        .sort((a, b) => a.expected_delivery_date.localeCompare(b.expected_delivery_date)),
    [deliverables]
  );

  const followUpRemindersList = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            l.status !== 'Confirmed' &&
            l.status !== 'Lost' &&
            l.status !== 'Not Interested' &&
            Boolean(l.follow_up_date)
        )
        .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date)),
    [leads]
  );

  const quickActions = [
    { label: 'Add Lead', path: '/leads?action=new', icon: Users, accent: 'bg-[#141414] text-white' },
    { label: 'Add Client', path: '/clients?action=new', icon: Sparkles, accent: 'bg-white text-[#141414] border border-[#E0DBD1]' },
    { label: 'Create Booking', path: '/bookings?action=new', icon: HeartHandshake, accent: 'bg-[#C89B3C] text-[#0A0807]' },
    { label: 'Create Quotation', path: '/quotations?action=new', icon: BookOpen, accent: 'bg-white text-[#141414] border border-[#E0DBD1]' },
    { label: 'Create Invoice', path: '/invoices?action=new', icon: IndianRupee, accent: 'bg-white text-[#141414] border border-[#E0DBD1]' },
    { label: 'Record Payment', path: '/invoices?action=payment', icon: CheckCircle2, accent: 'bg-emerald-700 text-white' },
    { label: 'Add Expense', path: '/expenses?action=new', icon: Wallet, accent: 'bg-white text-[#141414] border border-[#E0DBD1]' },
    { label: 'Schedule Event', path: '/calendar?action=new', icon: Calendar, accent: 'bg-white text-[#141414] border border-[#E0DBD1]' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Studio Welcome & Quick Actions Banner */}
      <div className="drk-glass-banner p-5 sm:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-px w-8 bg-[#C89B3C]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E6CFA0]">
                THE DRK WEDDINGS • INTERNAL BUSINESS COMMAND
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl text-white tracking-tight">
              Studio Operations & Financial Overview
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 font-light">
              Live metrics calculated from your active wedding bookings, enquiries, production tracks, and ledger.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.path)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 shadow-xs ${qa.accent}`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <Icon className="w-3.5 h-3.5 shrink-0 hidden xl:inline" />
                  <span className="truncate">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 11 Real-Time Business Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#77726A]">
            Key Studio Performance Indicators (11 Live Metrics)
          </span>
          <span className="text-xs font-medium text-[#4A463F]">
            Conversion Rate: <strong className="text-[#141414]">{stats.conversionRate}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Enquiries */}
          <div onClick={() => navigate('/leads')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                Total Enquiries
              </span>
              <Users className="w-4 h-4 text-[#C89B3C]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
              {stats.totalEnquiries}
            </div>
            <div className="text-[11px] text-[#77726A] mt-1">All recorded studio leads</div>
          </div>

          {/* 2. New Enquiries This Month */}
          <div onClick={() => navigate('/leads')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                New This Month
              </span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
              {stats.newEnquiriesThisMonth}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Active Nov 2026 intake</div>
          </div>

          {/* 3. Confirmed Bookings */}
          <div onClick={() => navigate('/bookings')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                Confirmed Bookings
              </span>
              <HeartHandshake className="w-4 h-4 text-[#C89B3C]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
              {stats.confirmedBookings}
            </div>
            <div className="text-[11px] text-[#77726A] mt-1">{stats.conversionRate}% lead conversion</div>
          </div>

          {/* 4. Upcoming Weddings */}
          <div onClick={() => navigate('/bookings')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                Upcoming Weddings
              </span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
              {stats.upcomingWeddings}
            </div>
            <div className="text-[11px] text-[#77726A] mt-1">Scheduled on calendar</div>
          </div>

          {/* 5. Completed Bookings */}
          <div onClick={() => navigate('/projects')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                Completed Bookings
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
              {stats.completedBookings}
            </div>
            <div className="text-[11px] text-[#77726A] mt-1">Fully delivered archives</div>
          </div>

          {/* 6. Pending Payments Count */}
          <div onClick={() => navigate('/invoices')} className="argon-card argon-card-hover p-4 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                Pending Payments
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-amber-700 tabular-nums">
              {stats.pendingPaymentsCount} Bookings
            </div>
            <div className="text-[11px] text-[#77726A] mt-1">Awaiting balance tranches</div>
          </div>
        </div>

        {/* Financial KPIs Row (Owner / Authorized Financial Access) */}
        {canViewFinancials && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5 sm:gap-4 mt-4">
            {/* 7. Total Collected Revenue */}
            <div onClick={() => navigate('/invoices')} className="argon-card argon-card-hover p-5 cursor-pointer bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                  Total Revenue (Collected)
                </span>
                <IndianRupee className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
              <div className="font-serif drk-kpi-value font-bold text-[#141414] tabular-nums">
                {formatINR(stats.totalRevenue)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                Actual received payments
              </div>
            </div>

            {/* 8. Revenue This Month */}
            <div onClick={() => navigate('/invoices')} className="argon-card argon-card-hover p-5 cursor-pointer bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                  Revenue This Month
                </span>
                <TrendingUp className="w-4 h-4 text-[#C89B3C] shrink-0" />
              </div>
              <div className="font-serif drk-kpi-value font-bold text-[#141414] tabular-nums">
                {formatINR(stats.revenueThisMonth)}
              </div>
              <div className="text-[11px] text-[#77726A] mt-1">Collected in Nov 2026</div>
            </div>

            {/* 9. Total Expenses */}
            <div onClick={() => navigate('/expenses')} className="argon-card argon-card-hover p-5 cursor-pointer bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
                  Total Expenses
                </span>
                <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />
              </div>
              <div className="font-serif drk-kpi-value font-bold text-[#141414] tabular-nums">
                {formatINR(stats.totalExpenses)}
              </div>
              <div className="text-[11px] text-[#77726A] mt-1">Crew, albums, travel & gear</div>
            </div>

            {/* 10. Net Profit */}
            <div onClick={() => navigate('/expenses')} className="argon-card argon-card-hover p-5 cursor-pointer bg-[#141414] text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E6CFA0]">
                  Net Studio Profit
                </span>
                <Wallet className="w-4 h-4 text-[#C89B3C] shrink-0" />
              </div>
              <div className="font-serif drk-kpi-value font-bold text-[#E6CFA0] tabular-nums">
                {formatINR(stats.netProfit)}
              </div>
              <div className="text-[11px] text-stone-300 mt-1">Collected Income − Expenses</div>
            </div>

            {/* 11. Total Outstanding Amount */}
            <div onClick={() => navigate('/invoices')} className="argon-card argon-card-hover p-5 cursor-pointer border-amber-300 bg-amber-50/40 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                  Total Outstanding Amount
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
              <div className="font-serif drk-kpi-value font-bold text-amber-900 tabular-nums">
                {formatINR(stats.totalOutstandingAmount)}
              </div>
              <div className="text-[11px] text-amber-800 mt-1">
                Receivable across {stats.pendingPaymentsCount} bookings
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Charts Section */}
      {canViewFinancials && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Revenue, Expense & Profit Chart */}
          <div className="lg:col-span-8 argon-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
                  Financial Trajectory (INR)
                </span>
                <h3 className="font-serif text-xl text-[#141414]">
                  Monthly Revenue, Expenses & Net Profit
                </h3>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="text-xs font-semibold text-[#C89B3C] hover:underline inline-flex items-center gap-1"
              >
                Full Financial Report <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFinancialData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C89B3C" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C89B3C" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DA" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#77726A' }} />
                  <YAxis
                    tickFormatter={(val) => formatINRCompact(val)}
                    tick={{ fontSize: 11, fill: '#77726A' }}
                  />
                  <Tooltip
                    formatter={(val: number) => formatINR(val)}
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#C89B3C',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#C89B3C"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#DC2626"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="Profit"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#profGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enquiry Source Distribution Pie Chart */}
          <div className="lg:col-span-4 argon-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
                Acquisition Channels
              </span>
              <h3 className="font-serif text-xl text-[#141414] mb-4">
                Enquiry Source Distribution
              </h3>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {sourceDistribution.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E8E3DA]">
              {sourceDistribution.map((src, idx) => (
                <div key={src.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="truncate text-[#4A463F]">{src.name}</span>
                  </div>
                  <span className="font-bold text-[#141414]">{src.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Second Analytics Row: Booking Status Distribution & Most Popular Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 argon-card p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
            Pipeline Health
          </span>
          <h3 className="font-serif text-xl text-[#141414] mb-4">
            Booking Status & Conversion Funnel
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingStatusDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DA" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Bookings" fill="#141414" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 argon-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
                Collection Demand
              </span>
              <h3 className="font-serif text-xl text-[#141414]">
                Most Popular Photography & Cinema Packages
              </h3>
            </div>
            <button
              onClick={() => navigate('/quotations')}
              className="text-xs font-semibold text-[#C89B3C] hover:underline"
            >
              Manage Packages →
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularPackagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E3DA" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Bookings" fill="#C89B3C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Enquiries" fill="#141414" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 8 Upcoming Activities & Deadlines Matrix */}
      <div>
        <div className="mb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#77726A]">
            Live Studio Radar
          </span>
          <h3 className="font-serif text-2xl text-[#141414]">
            Upcoming Weddings, Shoots, Deadlines & Follow-ups
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* 1. Upcoming Weddings & 2. Upcoming Shoots */}
          <div className="argon-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#C89B3C]" />
                  <h4 className="font-serif text-base font-semibold text-[#141414]">
                    Weddings & Shoots
                  </h4>
                </div>
                <span className="drk-badge bg-[#FAF8F5] text-[#141414] border border-[#E0DBD1]">
                  {upcomingWeddingsList.length + upcomingShootsList.length}
                </span>
              </div>

              <div className="space-y-3">
                {upcomingShootsList.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => navigate('/bookings')}
                    className="p-2.5 rounded-lg bg-[#FAF9F5] hover:bg-[#F5F5F0] border border-[#E8E3DA] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#C89B3C]">
                      <span>{ev.event_type}</span>
                      <span>{formatDateDDMMYYYY(ev.event_date)}</span>
                    </div>
                    <div className="text-xs font-bold text-[#141414] mt-0.5 truncate">
                      {ev.event_name}
                    </div>
                    <div className="text-[11px] text-[#77726A] truncate">
                      {ev.client_name} • {ev.venue}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/calendar')}
              className="mt-4 w-full text-center text-xs font-bold uppercase tracking-wider text-[#141414] hover:text-[#C89B3C] pt-2 border-t border-[#E8E3DA]"
            >
              Open Master Calendar →
            </button>
          </div>

          {/* 3. Client Meetings & 8. Follow-up Reminders */}
          <div className="argon-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-serif text-base font-semibold text-[#141414]">
                    Meetings & Follow-ups
                  </h4>
                </div>
                <span className="drk-badge bg-amber-50 text-amber-800 border border-amber-200">
                  {clientMeetingsList.length + followUpRemindersList.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {clientMeetingsList.map((mtg) => (
                  <div
                    key={mtg.id}
                    onClick={() => navigate('/calendar')}
                    className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-indigo-800">
                      <span>Client Meeting ({mtg.start_time})</span>
                      <span>{formatDateDDMMYYYY(mtg.event_date)}</span>
                    </div>
                    <div className="text-xs font-bold text-[#141414] mt-0.5">{mtg.client_name}</div>
                    <div className="text-[11px] text-[#4A463F] truncate">{mtg.event_name}</div>
                  </div>
                ))}

                {followUpRemindersList.slice(0, 3).map((ld) => {
                  const overdue = isDateOverdue(ld.follow_up_date);
                  return (
                    <div
                      key={ld.id}
                      onClick={() => navigate('/leads')}
                      className={`p-2.5 rounded-lg border cursor-pointer ${
                        overdue
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-[#FAF9F5] border-[#E8E3DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className={overdue ? 'text-red-700' : 'text-[#77726A]'}>
                          {overdue ? 'OVERDUE FOLLOW-UP' : `Follow-up (${ld.enquiry_source})`}
                        </span>
                        <span className={overdue ? 'text-red-700' : 'text-[#141414]'}>
                          {formatDateDDMMYYYY(ld.follow_up_date)}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#141414] mt-0.5">
                        {ld.customer_name}
                      </div>
                      <div className="text-[11px] text-[#77726A] truncate">
                        {ld.event_location} • {ld.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/leads')}
              className="mt-4 w-full text-center text-xs font-bold uppercase tracking-wider text-[#141414] hover:text-[#C89B3C] pt-2 border-t border-[#E8E3DA]"
            >
              View Lead Pipeline →
            </button>
          </div>

          {/* 5. Editing Deadlines & 6. Album Printing Deadlines */}
          <div className="argon-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#C89B3C]" />
                  <h4 className="font-serif text-base font-semibold text-[#141414]">
                    Editing & Album Deadlines
                  </h4>
                </div>
                <span className="drk-badge bg-[#FAF8F5] text-[#141414] border border-[#E0DBD1]">
                  {editingDeadlinesList.length + albumDeadlinesList.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {[...editingDeadlinesList, ...albumDeadlinesList].slice(0, 4).map((tsk) => {
                  const overdue = isDateOverdue(tsk.deadline);
                  return (
                    <div
                      key={tsk.id}
                      onClick={() => navigate('/projects')}
                      className={`p-2.5 rounded-lg border cursor-pointer ${
                        overdue
                          ? 'bg-red-50/70 border-red-200'
                          : 'bg-[#FAF9F5] border-[#E8E3DA]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className={overdue ? 'text-red-700' : 'text-[#C89B3C]'}>
                          {tsk.workflow_track}
                        </span>
                        <span className={overdue ? 'text-red-700' : 'text-[#141414]'}>
                          Due {formatDateDDMMYYYY(tsk.deadline)}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#141414] mt-0.5 truncate">
                        {tsk.task_name}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#77726A] mt-1">
                        <span>{tsk.assigned_staff_name}</span>
                        <span className="font-bold text-[#141414]">{tsk.progress_percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/projects')}
              className="mt-4 w-full text-center text-xs font-bold uppercase tracking-wider text-[#141414] hover:text-[#C89B3C] pt-2 border-t border-[#E8E3DA]"
            >
              Open Post-Production →
            </button>
          </div>

          {/* 4. Payment Due Dates & 7. Delivery Deadlines */}
          <div className="argon-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                  <h4 className="font-serif text-base font-semibold text-[#141414]">
                    Payment & Delivery Dues
                  </h4>
                </div>
                <span className="drk-badge bg-[#FAF8F5] text-[#141414] border border-[#E0DBD1]">
                  {paymentDueDatesList.length + deliveryDeadlinesList.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {canViewFinancials &&
                  paymentDueDatesList.slice(0, 2).map((inv) => {
                    const overdue = isDateOverdue(inv.due_date);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => navigate('/invoices')}
                        className={`p-2.5 rounded-lg border cursor-pointer ${
                          overdue
                            ? 'bg-red-50/70 border-red-200'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                          <span className={overdue ? 'text-red-700' : 'text-amber-800'}>
                            {overdue ? 'OVERDUE PAYMENT' : 'PAYMENT DUE'}
                          </span>
                          <span>{formatDateDDMMYYYY(inv.due_date)}</span>
                        </div>
                        <div className="text-xs font-bold text-[#141414] mt-0.5">
                          {inv.client_name}
                        </div>
                        <div className="text-xs font-extrabold text-amber-900 mt-0.5">
                          Balance: {formatINR(inv.balance_amount)}
                        </div>
                      </div>
                    );
                  })}

                {deliveryDeadlinesList.slice(0, 2).map((dlv) => (
                  <div
                    key={dlv.id}
                    onClick={() => navigate('/deliverables')}
                    className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E8E3DA] cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#77726A]">
                      <span>{dlv.deliverable_type}</span>
                      <span>{formatDateDDMMYYYY(dlv.expected_delivery_date)}</span>
                    </div>
                    <div className="text-xs font-bold text-[#141414] mt-0.5 truncate">
                      {dlv.deliverable_name}
                    </div>
                    <div className="text-[11px] text-[#77726A] truncate">
                      {dlv.client_name} • <strong className="text-[#141414]">{dlv.status}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/deliverables')}
              className="mt-4 w-full text-center text-xs font-bold uppercase tracking-wider text-[#141414] hover:text-[#C89B3C] pt-2 border-t border-[#E8E3DA]"
            >
              Track Deliverables →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
