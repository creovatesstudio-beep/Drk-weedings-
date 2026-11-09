import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useData } from '../../app/providers/DataContext';
import { formatDateDDMMYYYY, formatINR } from '../../lib/formatting';
import {
  exportAnalyticsReportPDF,
  exportRowsToCSV,
} from '../../lib/export/pdfAndCsvExporter';

type ReportCategoryKey =
  | 'financial_monthly_annual'
  | 'bookings_and_weddings'
  | 'leads_and_conversion'
  | 'pending_payments'
  | 'projects_and_delays'
  | 'team_performance'
  | 'package_performance';

export const ReportsPage: React.FC = () => {
  const {
    leads,
    bookings,
    payments,
    expenses,
    projects,
    tasks,
    team_members,
    packages,
  } = useData();

  const [activeReport, setActiveReport] = useState<ReportCategoryKey>(
    'financial_monthly_annual'
  );
  const [dateFrom, setDateFrom] = useState<string>('2025-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-12-31');

  const validPayments = useMemo(
    () =>
      payments.filter(
        (p) =>
          !p.is_voided &&
          (!dateFrom || p.payment_date >= dateFrom) &&
          (!dateTo || p.payment_date <= dateTo)
      ),
    [payments, dateFrom, dateTo]
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!dateFrom || e.expense_date >= dateFrom) &&
          (!dateTo || e.expense_date <= dateTo)
      ),
    [expenses, dateFrom, dateTo]
  );

  // 1. Monthly & Annual Revenue, Expense & Profit Aggregation
  const monthlyFinancials = useMemo(() => {
    const map: Record<
      string,
      { month: string; collectedRevenue: number; invoicedRevenue: number; expenses: number; netProfit: number }
    > = {};

    const ensureMonth = (ym: string) => {
      if (!map[ym]) {
        map[ym] = {
          month: ym,
          collectedRevenue: 0,
          invoicedRevenue: 0,
          expenses: 0,
          netProfit: 0,
        };
      }
    };

    bookings.forEach((b) => {
      if (b.status === 'Cancelled') return;
      const ym = (b.booking_date || b.wedding_date).slice(0, 7);
      ensureMonth(ym);
      map[ym].invoicedRevenue += b.total_amount;
    });

    validPayments.forEach((p) => {
      const ym = p.payment_date.slice(0, 7);
      ensureMonth(ym);
      map[ym].collectedRevenue += p.amount;
    });

    filteredExpenses.forEach((ex) => {
      const ym = ex.expense_date.slice(0, 7);
      ensureMonth(ym);
      map[ym].expenses += ex.amount;
    });

    return Object.values(map)
      .map((row) => ({
        ...row,
        netProfit: row.collectedRevenue - row.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [bookings, validPayments, filteredExpenses]);

  const annualTotals = useMemo(() => {
    const collected = validPayments.reduce((s, p) => s + p.amount, 0);
    const invoiced = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((s, b) => s + b.total_amount, 0);
    const totalExp = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const pendingReceivables = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((s, b) => s + b.balance_amount, 0);

    return {
      collected,
      invoiced,
      totalExp,
      netCashProfit: collected - totalExp,
      pendingReceivables,
    };
  }, [validPayments, bookings, filteredExpenses]);

  // 2. Lead Source & Conversion Analysis
  const leadSourceStats = useMemo(() => {
    const map: Record<string, { source: string; total: number; confirmed: number; conversionRate: number }> = {};
    leads.forEach((l) => {
      if (!map[l.enquiry_source]) {
        map[l.enquiry_source] = { source: l.enquiry_source, total: 0, confirmed: 0, conversionRate: 0 };
      }
      map[l.enquiry_source].total += 1;
      if (l.status === 'Confirmed') {
        map[l.enquiry_source].confirmed += 1;
      }
    });

    return Object.values(map).map((item) => ({
      ...item,
      conversionRate: item.total > 0 ? Math.round((item.confirmed / item.total) * 100) : 0,
    }));
  }, [leads]);

  // 3. Package Performance
  const packageStats = useMemo(() => {
    return packages.map((pkg) => {
      const pkgBookings = bookings.filter(
        (b) => b.package_id === pkg.id || b.package_name === pkg.name
      );
      const totalBookedValue = pkgBookings.reduce((s, b) => s + b.total_amount, 0);
      const totalCollected = pkgBookings.reduce((s, b) => s + b.paid_amount, 0);
      return {
        package_code: pkg.package_code,
        name: pkg.name,
        base_price: pkg.base_price,
        bookings_count: pkgBookings.length,
        totalBookedValue,
        totalCollected,
      };
    });
  }, [packages, bookings]);

  // 4. Team Performance
  const teamStats = useMemo(() => {
    return team_members.map((m) => {
      const memberTasks = tasks.filter((t) => t.assigned_staff_id === m.id);
      const completed = memberTasks.filter((t) => t.status === 'Completed').length;
      const assignedWeddings = bookings.filter((b) => b.assigned_team_ids.includes(m.id)).length;
      return {
        member_code: m.member_code,
        full_name: m.full_name,
        role: m.role,
        employment_type: m.employment_type,
        assignedWeddings,
        totalTasks: memberTasks.length,
        completedTasks: completed,
        total_paid: m.total_paid,
        total_pending: m.total_pending,
      };
    });
  }, [team_members, tasks, bookings]);

  // Dynamic Table Headers & Rows for Export + Display
  const currentReportTable = useMemo(() => {
    switch (activeReport) {
      case 'financial_monthly_annual':
        return {
          title: 'Monthly & Annual Revenue, Expense & Net Profit Report',
          subtitle: `Period: ${formatDateDDMMYYYY(dateFrom)} to ${formatDateDDMMYYYY(dateTo)} (All figures in INR ₹)`,
          headers: [
            'Month (YYYY-MM)',
            'Invoiced Booking Value',
            'Actual Collected Cash',
            'Operating Expenses',
            'Net Cash Profit',
          ],
          rows: monthlyFinancials.map((m) => [
            m.month,
            formatINR(m.invoicedRevenue),
            formatINR(m.collectedRevenue),
            formatINR(m.expenses),
            formatINR(m.netProfit),
          ]),
        };

      case 'bookings_and_weddings':
        return {
          title: 'Wedding Bookings & Upcoming Celebrations Report',
          subtitle: 'Complete wedding booking status, package value, and location register',
          headers: [
            'Booking ID',
            'Couple / Client',
            'Wedding Date',
            'Location',
            'Package',
            'Status',
            'Package Value',
            'Paid',
            'Balance',
          ],
          rows: bookings.map((b) => [
            b.booking_code,
            b.client_name,
            formatDateDDMMYYYY(b.wedding_date),
            b.event_location,
            b.package_name,
            b.status,
            formatINR(b.total_amount),
            formatINR(b.paid_amount),
            formatINR(b.balance_amount),
          ]),
        };

      case 'leads_and_conversion':
        return {
          title: 'Enquiry Conversion Rate & Lead Source Performance',
          subtitle: `Overall Studio Conversion Rate: ${
            leads.length > 0
              ? Math.round(
                  (leads.filter((l) => l.status === 'Confirmed').length / leads.length) * 100
                )
              : 0
          }%`,
          headers: [
            'Enquiry Source',
            'Total Enquiries',
            'Confirmed Bookings',
            'Conversion Rate (%)',
          ],
          rows: leadSourceStats.map((s) => [
            s.source,
            s.total,
            s.confirmed,
            `${s.conversionRate}%`,
          ]),
        };

      case 'pending_payments':
        return {
          title: 'Pending Payments & Outstanding Receivables Report',
          subtitle: 'Bookings with outstanding balances awaiting collection',
          headers: [
            'Booking ID',
            'Client Name',
            'Phone',
            'Wedding Date',
            'Payment Status',
            'Total Package',
            'Collected',
            'Outstanding Balance',
          ],
          rows: bookings
            .filter((b) => b.balance_amount > 0 && b.status !== 'Cancelled')
            .map((b) => [
              b.booking_code,
              b.client_name,
              b.client_phone,
              formatDateDDMMYYYY(b.wedding_date),
              b.payment_status,
              formatINR(b.total_amount),
              formatINR(b.paid_amount),
              formatINR(b.balance_amount),
            ]),
        };

      case 'projects_and_delays':
        return {
          title: 'Completed vs. Delayed Post-Production Projects Report',
          subtitle: '12-stage workflow progress and delivery deadline compliance',
          headers: [
            'Project Code',
            'Booking ID',
            'Couple',
            'Current Stage',
            'Progress (%)',
            'Target Delivery',
            'Project Status',
          ],
          rows: projects.map((p) => [
            p.project_code,
            p.booking_code,
            p.client_name,
            p.current_stage,
            `${p.overall_progress}%`,
            formatDateDDMMYYYY(p.expected_delivery_date),
            p.status,
          ]),
        };

      case 'team_performance':
        return {
          title: 'Team & Freelancer Performance & Remuneration Report',
          subtitle: 'Assigned weddings, completed tasks, and payout ledger',
          headers: [
            'Member Code',
            'Name',
            'Role',
            'Type',
            'Weddings Assigned',
            'Tasks Completed',
            'Total Paid',
            'Pending Dues',
          ],
          rows: teamStats.map((t) => [
            t.member_code,
            t.full_name,
            t.role,
            t.employment_type,
            t.assignedWeddings,
            `${t.completedTasks} / ${t.totalTasks}`,
            formatINR(t.total_paid),
            formatINR(t.total_pending),
          ]),
        };

      case 'package_performance':
        return {
          title: 'Photography Package Popularity & Revenue Performance',
          subtitle: 'Comparison of wedding collections by booking volume and revenue',
          headers: [
            'Package Code',
            'Collection Name',
            'Base Price',
            'Total Bookings',
            'Total Contracted Value',
            'Collected Revenue',
          ],
          rows: packageStats.map((p) => [
            p.package_code,
            p.name,
            formatINR(p.base_price),
            p.bookings_count,
            formatINR(p.totalBookedValue),
            formatINR(p.totalCollected),
          ]),
        };
    }
  }, [
    activeReport,
    dateFrom,
    dateTo,
    monthlyFinancials,
    bookings,
    leads,
    leadSourceStats,
    projects,
    teamStats,
    packageStats,
  ]);

  const CHART_COLORS = ['#C89B3C', '#141414', '#0F766E', '#B45309', '#7C3AED', '#BE123C'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <BarChart3 className="h-3.5 w-3.5 text-gold-400" />
              Executive Business Intelligence
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Business Reports & Financial Analytics
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Generate, filter, and export studio reports in branded PDF and CSV/Excel formats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              exportRowsToCSV(
                currentReportTable.title.replace(/\s+/g, '_'),
                currentReportTable.headers,
                currentReportTable.rows
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-obsidian-200 bg-white px-4 py-2.5 text-xs font-semibold text-obsidian-800 shadow-sm hover:bg-obsidian-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            Export CSV / Excel
          </button>

          <button
            onClick={() =>
              exportAnalyticsReportPDF(
                currentReportTable.title,
                currentReportTable.subtitle,
                currentReportTable.headers,
                currentReportTable.rows
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-xs font-semibold text-gold-300 shadow-sm hover:bg-obsidian-800"
          >
            <FileText className="h-4 w-4" />
            Download Branded PDF Report
          </button>
        </div>
      </div>

      {/* Annual Executive Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="argon-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
            Invoiced Revenue
          </p>
          <p className="mt-2 font-serif text-xl font-bold text-obsidian-900">
            {formatINR(annualTotals.invoiced)}
          </p>
          <p className="mt-1 text-[11px] text-obsidian-500">Total contracted bookings</p>
        </div>

        <div className="argon-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
            Collected Cash Income
          </p>
          <p className="mt-2 font-serif text-xl font-bold text-emerald-700">
            {formatINR(annualTotals.collected)}
          </p>
          <p className="mt-1 text-[11px] text-obsidian-500">Actual received money</p>
        </div>

        <div className="argon-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
            Total Expenses
          </p>
          <p className="mt-2 font-serif text-xl font-bold text-rose-700">
            {formatINR(annualTotals.totalExp)}
          </p>
          <p className="mt-1 text-[11px] text-obsidian-500">Crew, travel, albums & gear</p>
        </div>

        <div className="argon-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
            Net Cash Profit
          </p>
          <p className="mt-2 font-serif text-xl font-bold text-gold-700">
            {formatINR(annualTotals.netCashProfit)}
          </p>
          <p className="mt-1 text-[11px] text-obsidian-500">Collected minus expenses</p>
        </div>

        <div className="argon-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-obsidian-400">
            Pending Receivables
          </p>
          <p className="mt-2 font-serif text-xl font-bold text-amber-700">
            {formatINR(annualTotals.pendingReceivables)}
          </p>
          <p className="mt-1 text-[11px] text-obsidian-500">Outstanding client balances</p>
        </div>
      </div>

      {/* Report Category Selector & Date Filter Bar */}
      <div className="argon-card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'financial_monthly_annual', label: '1. Monthly & Annual P&L' },
              { id: 'bookings_and_weddings', label: '2. Bookings & Weddings' },
              { id: 'leads_and_conversion', label: '3. Lead Source & Conversion' },
              { id: 'pending_payments', label: '4. Pending Payments' },
              { id: 'projects_and_delays', label: '5. Projects & Delays' },
              { id: 'team_performance', label: '6. Team Performance' },
              { id: 'package_performance', label: '7. Package Performance' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeReport === tab.id
                  ? 'bg-obsidian-900 text-gold-300 shadow-sm'
                  : 'bg-obsidian-50 text-obsidian-700 hover:bg-obsidian-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-obsidian-400" />
          <span className="font-semibold text-obsidian-600">Date Range:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-obsidian-200 px-2.5 py-1.5 text-xs"
          />
          <span className="text-obsidian-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-obsidian-200 px-2.5 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="argon-card p-6 lg:col-span-8">
          <h3 className="font-serif text-base font-bold text-obsidian-900">
            Monthly Collected Revenue vs. Operating Expenses & Profit (₹)
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancials}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => formatINR(val)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E0D8',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collectedRevenue" name="Collected Cash (₹)" fill="#0F766E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses (₹)" fill="#BE123C" radius={[6, 6, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Profit (₹)" fill="#C89B3C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="argon-card p-6 lg:col-span-4">
          <h3 className="font-serif text-base font-bold text-obsidian-900">
            Enquiry Source Distribution
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceStats}
                  dataKey="total"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) =>
                    `${name} (${Math.round((percent || 0) * 100)}%)`
                  }
                >
                  {leadSourceStats.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Report Data Table */}
      <div className="argon-card overflow-hidden">
        <div className="border-b border-obsidian-100 px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-obsidian-900">
            {currentReportTable.title}
          </h2>
          <p className="text-xs text-obsidian-500">{currentReportTable.subtitle}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
              <tr>
                {currentReportTable.headers.map((h) => (
                  <th key={h} className="px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-100">
              {currentReportTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-obsidian-50/60">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-5 py-3.5 text-xs ${
                        cIdx === 0
                          ? 'font-semibold text-obsidian-900'
                          : 'text-obsidian-700'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
