// ============================================================================
// THE DRK WEDDINGS — EXPENSE & PROFIT MANAGEMENT MODULE
// 13 Expense Categories • Collected vs. Invoiced Revenue • Booking-Wise Profit
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileText,
  Trash2,
  Edit3,
  X,
  PieChart as PieIcon,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type { ExpenseCategory, ExpenseRecord, PaymentMethod } from '../../types/crm';
import {
  formatDateDDMMYYYY,
  formatINR,
  getTodayKolkataISO,
} from '../../lib/formatting';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Photographer payments',
  'Cinematographer payments',
  'Editor payments',
  'Travel',
  'Accommodation',
  'Food',
  'Equipment rental',
  'Camera maintenance',
  'Album printing',
  'Hard drives and storage',
  'Office expenses',
  'Marketing',
  'Miscellaneous',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Bank transfer',
  'Other payment methods',
];

export const ExpensesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    expenses,
    bookings,
    payments,
    team_members,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useData();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [bookingFilter, setBookingFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const today = getTodayKolkataISO();
  const currentMonthPrefix = today.slice(0, 7); // "2026-11"
  const currentYearPrefix = today.slice(0, 4); // "2026"

  const [formData, setFormData] = useState({
    expense_date: today,
    category: 'Photographer payments' as ExpenseCategory,
    amount: 12000,
    payment_method: 'UPI' as PaymentMethod,
    booking_id: '',
    team_member_id: '',
    vendor_or_recipient: '',
    description: '',
    receipt_attachment: '',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      expense_date: today,
      category: 'Photographer payments',
      amount: 12000,
      payment_method: 'UPI',
      booking_id: bookings[0]?.id || '',
      team_member_id: '',
      vendor_or_recipient: '',
      description: '',
      receipt_attachment: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setFormData({
      expense_date: exp.expense_date,
      category: exp.category,
      amount: exp.amount,
      payment_method: exp.payment_method,
      booking_id: exp.booking_id || '',
      team_member_id: exp.team_member_id || '',
      vendor_or_recipient: exp.vendor_or_recipient,
      description: exp.description,
      receipt_attachment: exp.receipt_attachment || '',
    });
    setModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_or_recipient.trim() || formData.amount < 0) return;

    const bk = bookings.find((b) => b.id === formData.booking_id);

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        ...formData,
        booking_id: formData.booking_id || undefined,
        booking_code: bk?.booking_code,
        team_member_id: formData.team_member_id || undefined,
      });
      setModalOpen(false);
      return;
    }

    addExpense({
      ...formData,
      booking_id: formData.booking_id || undefined,
      booking_code: bk?.booking_code,
      team_member_id: formData.team_member_id || undefined,
    });
    setModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // FINANCIAL & PROFITABILITY CALCULATIONS (ALL 8 REQUIRED METRICS)
  // Distinguishes Actual Collected Cash from Invoiced/Expected Revenue
  // ---------------------------------------------------------------------------
  const finMetrics = useMemo(() => {
    const validPayments = payments.filter((p) => !p.is_voided);
    const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');

    const totalCollectedIncome = validPayments.reduce((s, p) => s + Number(p.amount), 0);
    const totalInvoicedAmount = activeBookings.reduce((s, b) => s + Number(b.total_amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const outstandingReceivables = activeBookings.reduce((s, b) => s + Number(b.balance_amount), 0);

    // Monthly profit (Nov 2026)
    const monthlyCollected = validPayments
      .filter((p) => p.payment_date.startsWith(currentMonthPrefix))
      .reduce((s, p) => s + Number(p.amount), 0);
    const monthlyExpenses = expenses
      .filter((e) => e.expense_date.startsWith(currentMonthPrefix))
      .reduce((s, e) => s + Number(e.amount), 0);
    const monthlyProfit = monthlyCollected - monthlyExpenses;

    // Annual profit (2026)
    const annualCollected = validPayments
      .filter((p) => p.payment_date.startsWith(currentYearPrefix))
      .reduce((s, p) => s + Number(p.amount), 0);
    const annualExpenses = expenses
      .filter((e) => e.expense_date.startsWith(currentYearPrefix))
      .reduce((s, e) => s + Number(e.amount), 0);
    const annualProfit = annualCollected - annualExpenses;

    // Booking-wise profit
    const bookingWiseProfit = activeBookings.map((bk) => {
      const bkExpenses = expenses
        .filter((e) => e.booking_id === bk.id)
        .reduce((s, e) => s + Number(e.amount), 0);
      const collectedProfit = Number(bk.paid_amount) - bkExpenses;
      const projectedTotalProfit = Number(bk.total_amount) - bkExpenses;
      return {
        booking: bk,
        expenses: bkExpenses,
        collectedProfit,
        projectedTotalProfit,
      };
    });

    // Category-wise expenses
    const categoryWise: Array<{ category: ExpenseCategory; amount: number }> =
      EXPENSE_CATEGORIES.map((cat) => ({
        category: cat,
        amount: expenses
          .filter((e) => e.category === cat)
          .reduce((s, e) => s + Number(e.amount), 0),
      })).filter((c) => c.amount > 0);

    return {
      totalCollectedIncome,
      totalInvoicedAmount,
      totalExpenses,
      outstandingReceivables,
      monthlyProfit,
      annualProfit,
      bookingWiseProfit,
      categoryWise,
    };
  }, [payments, bookings, expenses, currentMonthPrefix, currentYearPrefix]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
      if (bookingFilter !== 'ALL' && e.booking_id !== bookingFilter) return false;
      return true;
    });
  }, [expenses, categoryFilter, bookingFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Studio Cost & Profitability Accounting
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Expenses, Crew Payouts & Net Profit Analytics
          </h2>
        </div>

        <button onClick={openAddModal} className="drk-btn-primary">
          <Plus className="w-4 h-4 text-[#E6CFA0]" />
          <span>Record Studio Expense</span>
        </button>
      </div>

      {/* 6 Core Financial & Profit Cards (Distinguishing Collected vs. Invoiced Revenue) */}
      <div className="drk-expense-kpi-grid">
        <div className="argon-card p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
            Collected Income (Cash-In)
          </span>
          <div className="font-serif text-xl font-bold text-emerald-800 mt-1 tabular-nums">
            {formatINR(finMetrics.totalCollectedIncome)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Actual received money</div>
        </div>

        <div className="argon-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
            Total Invoiced Amount
          </span>
          <div className="font-serif text-xl font-bold text-[#141414] mt-1 tabular-nums">
            {formatINR(finMetrics.totalInvoicedAmount)}
          </div>
          <div className="text-[10px] text-[#77726A] mt-1">Contracted booking value</div>
        </div>

        <div className="argon-card p-4 bg-red-50/30 border-red-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800">
            Total Studio Expenses
          </span>
          <div className="font-serif text-xl font-bold text-red-700 mt-1 tabular-nums">
            {formatINR(finMetrics.totalExpenses)}
          </div>
          <div className="text-[10px] text-red-700 mt-1">Across {expenses.length} vouchers</div>
        </div>

        <div className="argon-card p-4 bg-amber-50/40 border-amber-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
            Outstanding Receivables
          </span>
          <div className="font-serif text-xl font-bold text-amber-900 mt-1 tabular-nums">
            {formatINR(finMetrics.outstandingReceivables)}
          </div>
          <div className="text-[10px] text-amber-800 mt-1">Expected future collections</div>
        </div>

        <div className="argon-card p-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
            Monthly Profit (Nov)
          </span>
          <div className="font-serif text-xl font-bold text-[#141414] mt-1 tabular-nums">
            {formatINR(finMetrics.monthlyProfit)}
          </div>
          <div className="text-[10px] text-[#77726A] mt-1">This month net cashflow</div>
        </div>

        <div className="argon-card p-4 bg-[#141414] text-white">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E6CFA0]">
            Annual Profit (2026)
          </span>
          <div className="font-serif text-xl font-bold text-[#E6CFA0] mt-1 tabular-nums">
            {formatINR(finMetrics.annualProfit)}
          </div>
          <div className="text-[10px] text-stone-300 mt-1">Realized net studio profit</div>
        </div>
      </div>

      {/* Booking-Wise Profit & Category-Wise Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking-Wise Profitability Table */}
        <div className="lg:col-span-7 argon-card p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
            Wedding Project Margins
          </span>
          <h3 className="font-serif text-xl text-[#141414] mb-4">
            Booking-Wise Profitability Analysis
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E0DBD1] text-[10px] font-extrabold uppercase text-[#77726A] whitespace-nowrap">
                  <th className="py-2.5 pr-3">Booking & Couple</th>
                  <th className="py-2.5 px-3 text-right">Invoiced</th>
                  <th className="py-2.5 px-3 text-right">Collected</th>
                  <th className="py-2.5 px-3 text-right">Direct Expenses</th>
                  <th className="py-2.5 pl-3 text-right">Realized / Projected Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DA]">
                {finMetrics.bookingWiseProfit.map((row) => (
                  <tr key={row.booking.id}>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-[#141414]">{row.booking.client_name}</div>
                      <div className="font-mono text-[10px] text-[#77726A]">
                        {row.booking.booking_code}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold tabular-nums text-right whitespace-nowrap">
                      {formatINR(row.booking.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-emerald-700 font-semibold tabular-nums text-right whitespace-nowrap">
                      {formatINR(row.booking.paid_amount)}
                    </td>
                    <td className="py-3 px-3 text-red-600 font-semibold tabular-nums text-right whitespace-nowrap">
                      {formatINR(row.expenses)}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <div className="font-bold text-[#141414] tabular-nums">
                        {formatINR(row.collectedProfit)} realized
                      </div>
                      <div className="text-[10px] text-[#77726A] tabular-nums">
                        ({formatINR(row.projectedTotalProfit)} on full settlement)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category-Wise Expenses Breakdown */}
        <div className="lg:col-span-5 argon-card p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#77726A]">
            Cost Distribution
          </span>
          <h3 className="font-serif text-xl text-[#141414] mb-4">
            Category-Wise Expenses
          </h3>

          <div className="space-y-3">
            {finMetrics.categoryWise.map((c) => {
              const pct =
                finMetrics.totalExpenses > 0
                  ? Math.round((c.amount / finMetrics.totalExpenses) * 100)
                  : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#141414]">{c.category}</span>
                    <span className="font-bold text-[#141414] tabular-nums">
                      {formatINR(c.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E0DBD1]">
                    <div
                      className="h-full bg-[#C89B3C]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense Ledger Filters & Table */}
      <div className="argon-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="drk-select w-60 text-xs"
          >
            <option value="ALL">All 13 Expense Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value)}
            className="drk-select w-64 text-xs"
          >
            <option value="ALL">All Bookings & General Overhead</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.booking_code} — {b.client_name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-bold text-[#77726A]">
          Showing {filteredExpenses.length} Expense Vouchers
        </span>
      </div>

      {/* Swipe-Style Mobile Expense Cards (< 768px) */}
      <div className="space-y-3 md:hidden">
        {filteredExpenses.map((exp) => (
          <div key={exp.id} className="swipe-record-card space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#77726A]">
                    {exp.expense_code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E0DBD1] text-[10px] font-semibold">
                    {exp.category}
                  </span>
                </div>
                <h4 className="font-serif text-base font-bold text-[#141414] mt-1">
                  {exp.vendor_or_recipient}
                </h4>
                <p className="text-xs text-[#4A463F] mt-0.5">{exp.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-serif text-lg font-bold text-red-700 tabular-nums">
                  {formatINR(exp.amount)}
                </div>
                <div className="text-[10px] text-[#77726A]">
                  {formatDateDDMMYYYY(exp.expense_date)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E8E3DA] text-xs">
              <div className="text-[11px] text-[#77726A]">
                <span className="font-mono text-[#C89B3C] font-semibold">
                  {exp.booking_code || 'Studio Overhead'}
                </span>{' '}
                • {exp.payment_method}
              </div>
              <div className="inline-flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(exp)}
                  className="p-2 rounded-lg border border-[#E0DBD1] bg-white"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete expense voucher ${exp.expense_code}?`)) {
                      deleteExpense(exp.id);
                    }
                  }}
                  className="p-2 rounded-lg border border-red-200 text-red-600 bg-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Laptop & Desktop Expense Ledger Table (>= 768px) */}
      <div className="hidden md:block argon-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-[#E6CFA0] text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4">Expense ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Vendor / Recipient</th>
                <th className="py-3.5 px-4">Related Booking</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Method & Receipt</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3DA] text-xs">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#77726A] whitespace-nowrap">
                    {exp.expense_code}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{formatDateDDMMYYYY(exp.expense_date)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded bg-[#FAF9F5] border border-[#E0DBD1] font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#141414] min-w-[150px]">
                    {exp.vendor_or_recipient}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#C89B3C] whitespace-nowrap">
                    {exp.booking_code || 'Studio Overhead'}
                  </td>
                  <td className="py-3.5 px-4 text-[#4A463F] max-w-xs truncate">
                    {exp.description}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>{exp.payment_method}</div>
                    {exp.receipt_attachment && (
                      <div className="text-[10px] text-[#77726A] font-mono">
                        {exp.receipt_attachment}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-serif text-sm font-bold text-red-700 tabular-nums text-right whitespace-nowrap">
                    {formatINR(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl text-white">
                {editingExpense ? `Edit Expense ${editingExpense.expense_code}` : 'Record Studio Expense'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                    }
                    className="drk-select"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="drk-label">Amount (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: Number(e.target.value || 0) })
                    }
                    className="drk-input font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Vendor or Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.vendor_or_recipient}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor_or_recipient: e.target.value })
                    }
                    placeholder="e.g. Canvera Digital / Aarav Sinha / IndiGo Airlines"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Link to Staff Member (Optional)</label>
                  <select
                    value={formData.team_member_id}
                    onChange={(e) => {
                      const tm = team_members.find((m) => m.id === e.target.value);
                      setFormData({
                        ...formData,
                        team_member_id: e.target.value,
                        vendor_or_recipient: tm ? tm.full_name : formData.vendor_or_recipient,
                      });
                    }}
                    className="drk-select"
                  >
                    <option value="">-- Not a Crew Payout --</option>
                    {team_members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_method: e.target.value as PaymentMethod,
                      })
                    }
                    className="drk-select"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="drk-label">Related Wedding Booking (Optional)</label>
                  <select
                    value={formData.booking_id}
                    onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                    className="drk-select"
                  >
                    <option value="">-- General Studio Overhead --</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} ({b.client_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="drk-label">Receipt / Bill Reference</label>
                  <input
                    type="text"
                    value={formData.receipt_attachment}
                    onChange={(e) =>
                      setFormData({ ...formData, receipt_attachment: e.target.value })
                    }
                    placeholder="INV-88412.pdf"
                    className="drk-input"
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of expense..."
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
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
