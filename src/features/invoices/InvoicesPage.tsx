// ============================================================================
// THE DRK WEDDINGS — INVOICES, MILESTONE PAYMENTS & IMMUTABLE AUDIT LEDGER
// Advance / Partial / Final Payments • Cash / UPI / Bank Transfer • PDF Receipts
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  MessageCircle,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  History,
  X,
  Receipt,
  Ban,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type { PaymentMethod, PaymentRecord, PaymentStageType } from '../../types/crm';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatDateTimeIST,
  formatINR,
  getTodayKolkataISO,
  isDateOverdue,
} from '../../lib/formatting';
import {
  generateInvoicePDF,
  generatePaymentReceiptPDF,
} from '../../lib/export/pdfAndCsvExporter';

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Bank transfer',
  'Other payment methods',
];

export const InvoicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    invoices,
    payments,
    bookings,
    audit_logs,
    recordPayment,
    voidPayment,
    addInvoice,
  } = useData();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'audit'>('invoices');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [voidModalPayment, setVoidModalPayment] = useState<PaymentRecord | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const today = getTodayKolkataISO();

  const [payForm, setPayForm] = useState({
    booking_id: bookings[1]?.id || bookings[0]?.id || '',
    amount: 70000,
    payment_type: 'Final' as PaymentStageType,
    payment_date: today,
    payment_method: 'UPI' as PaymentMethod,
    transaction_reference: '',
    notes: '',
  });

  const [invForm, setInvForm] = useState({
    booking_id: bookings[0]?.id || '',
    issue_date: today,
    due_date: today,
    discount_amount: 0,
    tax_rate: 0,
    notes: '',
  });

  useEffect(() => {
    const act = searchParams.get('action');
    if (act === 'payment') {
      openRecordPaymentModal();
      setSearchParams({});
    } else if (act === 'new') {
      setInvModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const openRecordPaymentModal = (bookingId?: string) => {
    const targetBk =
      bookings.find((b) => b.id === bookingId) ||
      bookings.find((b) => b.balance_amount > 0) ||
      bookings[0];

    setPayForm({
      booking_id: targetBk?.id || '',
      amount: targetBk?.balance_amount || 50000,
      payment_type:
        targetBk && targetBk.paid_amount === 0
          ? 'Advance'
          : targetBk && targetBk.balance_amount <= 70000
          ? 'Final'
          : 'Partial',
      payment_date: today,
      payment_method: 'UPI',
      transaction_reference: '',
      notes: '',
    });
    setPayModalOpen(true);
  };

  const selectedBookingForPayment = useMemo(
    () => bookings.find((b) => b.id === payForm.booking_id),
    [bookings, payForm.booking_id]
  );

  const projectedRemainingBalance = useMemo(() => {
    if (!selectedBookingForPayment) return 0;
    return Math.max(
      0,
      Number(selectedBookingForPayment.balance_amount) - Number(payForm.amount || 0)
    );
  }, [selectedBookingForPayment, payForm.amount]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.booking_id || payForm.amount <= 0) return;

    const created = recordPayment(payForm);
    if (created) {
      setPayModalOpen(false);
      showToast(
        `Recorded ${created.payment_type} payment ${created.payment_code} (${formatINR(
          created.amount
        )}). Remaining balance: ${formatINR(created.remaining_balance_after)}.`
      );
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const bk = bookings.find((b) => b.id === invForm.booking_id);
    if (!bk) return;

    const sub = bk.total_amount;
    const disc = Number(invForm.discount_amount || 0);
    const taxable = Math.max(0, sub - disc);
    const tax = Math.round((taxable * Number(invForm.tax_rate || 0)) / 100);
    const tot = taxable + tax;
    const bal = Math.max(0, tot - bk.paid_amount);

    const created = addInvoice({
      booking_id: bk.id,
      booking_code: bk.booking_code,
      client_id: bk.client_id,
      client_name: bk.client_name,
      client_phone: bk.client_phone,
      issue_date: invForm.issue_date,
      due_date: invForm.due_date,
      subtotal: sub,
      discount_amount: disc,
      tax_rate: invForm.tax_rate,
      tax_amount: tax,
      total_amount: tot,
      paid_amount: bk.paid_amount,
      balance_amount: bal,
      status: bal === 0 ? 'Paid' : bk.paid_amount > 0 ? 'Partially Paid' : 'Issued',
      milestones: [
        {
          label: 'Booking Advance',
          amount: bk.advance_amount,
          due_date: bk.booking_date,
          status: bk.paid_amount >= bk.advance_amount ? 'Paid' : 'Pending',
        },
        {
          label: 'Final Balance Settlement',
          amount: bal,
          due_date: invForm.due_date,
          status: bal === 0 ? 'Paid' : 'Pending',
        },
      ],
      notes: invForm.notes,
      terms: 'All payments via UPI, Bank Transfer or Cash.',
    });

    setInvModalOpen(false);
    showToast(`Issued Invoice ${created.invoice_number} for ${bk.client_name}.`);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidModalPayment || !voidReason.trim()) return;
    voidPayment(voidModalPayment.id, voidReason.trim());
    showToast(
      `Payment ${voidModalPayment.payment_code} marked as Voided in audit log and booking balance recalculated.`
    );
    setVoidModalPayment(null);
    setVoidReason('');
  };

  // Financial Summary Metrics
  const summary = useMemo(() => {
    const totalContracted = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((s, b) => s + Number(b.total_amount), 0);
    const totalCollected = payments
      .filter((p) => !p.is_voided)
      .reduce((s, p) => s + Number(p.amount), 0);
    const totalOutstanding = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((s, b) => s + Number(b.balance_amount), 0);
    const overdueCount = invoices.filter(
      (i) => i.balance_amount > 0 && isDateOverdue(i.due_date)
    ).length;

    return { totalContracted, totalCollected, totalOutstanding, overdueCount };
  }, [bookings, payments, invoices]);

  const financialAuditLogs = useMemo(
    () =>
      audit_logs.filter(
        (a) => a.module === 'payments' || a.module === 'invoices' || a.module === 'bookings'
      ),
    [audit_logs]
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white border border-[#C89B3C] px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Financial Transaction & Milestone Ledger
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Invoices, Payments, Balances & Financial Audit Trail
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openRecordPaymentModal()}
            className="drk-btn-gold"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Record Client Payment</span>
          </button>
          <button
            onClick={() => setInvModalOpen(true)}
            className="drk-btn-primary"
          >
            <Plus className="w-4 h-4 text-[#E6CFA0]" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="argon-card p-5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77726A]">
            Total Invoiced / Contracted
          </span>
          <div className="font-serif text-2xl font-bold text-[#141414] mt-1 tabular-nums">
            {formatINR(summary.totalContracted)}
          </div>
          <div className="text-[11px] text-[#77726A] mt-1">Across confirmed wedding bookings</div>
        </div>

        <div className="argon-card p-5 bg-emerald-50/40 border-emerald-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
            Total Collected Payments
          </span>
          <div className="font-serif text-2xl font-bold text-emerald-800 mt-1 tabular-nums">
            {formatINR(summary.totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Actual received money</div>
        </div>

        <div className="argon-card p-5 bg-amber-50/50 border-amber-200">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
            Remaining Balance Receivable
          </span>
          <div className="font-serif text-2xl font-bold text-amber-900 mt-1 tabular-nums">
            {formatINR(summary.totalOutstanding)}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">Auto-calculated after each tranche</div>
        </div>

        <div className="argon-card p-5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700">
            Overdue Invoices
          </span>
          <div className="font-serif text-2xl font-bold text-red-700 mt-1 tabular-nums">
            {summary.overdueCount} Overdue
          </div>
          <div className="text-[11px] text-[#77726A] mt-1">Send 1-click WhatsApp reminders</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Swipe-Scrollable on Mobile, Clean Segmented Control on Laptop) */}
      <div className="drk-tabs-scroll no-scrollbar w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'invoices'
              ? 'bg-[#141414] text-[#E6CFA0] shadow-xs'
              : 'text-[#77726A] hover:text-[#141414]'
          }`}
        >
          Booking Invoices & Milestones ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'payments'
              ? 'bg-[#141414] text-[#E6CFA0] shadow-xs'
              : 'text-[#77726A] hover:text-[#141414]'
          }`}
        >
          Payment Transactions & Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'audit'
              ? 'bg-[#141414] text-[#E6CFA0] shadow-xs'
              : 'text-[#77726A] hover:text-[#141414]'
          }`}
        >
          Immutable Financial Audit Log ({financialAuditLogs.length})
        </button>
      </div>

      {/* TAB 1: BOOKING INVOICES & MILESTONE TRACKER */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const bk = bookings.find((b) => b.id === inv.booking_id);
            const invPayments = payments.filter(
              (p) => p.booking_id === inv.booking_id && !p.is_voided
            );
            const overdue = inv.balance_amount > 0 && isDateOverdue(inv.due_date);

            return (
              <div
                key={inv.id}
                className={`argon-card drk-invoice-card p-5 sm:p-6 ${
                  overdue ? 'border-red-300 bg-red-50/20' : ''
                }`}
              >
                {/* Row 1: Invoice Identity + Couple Name on Left, Action Buttons on Right */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#141414] text-[#E6CFA0] whitespace-nowrap">
                        {inv.invoice_number}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#77726A] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E0DBD1] whitespace-nowrap">
                        Booking: {inv.booking_code}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          inv.balance_amount === 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : overdue
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {inv.balance_amount === 0
                          ? 'Paid in Full'
                          : overdue
                          ? 'Overdue Balance'
                          : inv.status}
                      </span>
                      <span className="text-xs text-[#77726A] whitespace-nowrap">
                        Due Date: <strong className="text-[#141414]">{formatDateDDMMYYYY(inv.due_date)}</strong>
                      </span>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#141414] leading-snug">
                      {inv.client_name}
                    </h3>
                  </div>

                  {/* Invoice Actions — Never squeezes the financial grid below */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {inv.balance_amount > 0 && (
                      <>
                        <button
                          onClick={() => openRecordPaymentModal(inv.booking_id)}
                          className="drk-btn-gold py-2 px-3.5"
                        >
                          <IndianRupee className="w-3.5 h-3.5" /> Record Tranche
                        </button>

                        <a
                          href={buildWhatsAppLink(
                            inv.client_phone,
                            `Hello ${inv.client_name}, greetings from THE DRK WEDDINGS! This is a gentle reminder for Invoice ${inv.invoice_number} (Booking ${inv.booking_code}).\n\nTotal Package: ${formatINR(inv.total_amount)}\nReceived So Far: ${formatINR(inv.paid_amount)}\nRemaining Balance: ${formatINR(inv.balance_amount)}\nDue Date: ${formatDateDDMMYYYY(inv.due_date)}\n\nThank you!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="drk-btn-whatsapp py-2 px-3.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Remind on WhatsApp
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => generateInvoicePDF(inv, bk, invPayments)}
                      className="drk-btn-secondary py-2 px-3.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF Invoice
                    </button>
                  </div>
                </div>

                {/* Row 2: Full-Width Progressive Payment Breakdown (Zero Text Overlap on Laptop & Mobile) */}
                <div className="drk-invoice-breakdown-grid text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#77726A] block">
                      Wedding Package
                    </span>
                    <span className="font-serif text-lg font-bold text-[#141414] tabular-nums block">
                      {formatINR(inv.total_amount)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#77726A] block">
                      Transactions Recorded ({invPayments.length})
                    </span>
                    {invPayments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {invPayments.map((p) => (
                          <span key={p.id} className="drk-tranche-pill">
                            <span className="text-[#77726A]">{p.payment_type}:</span>
                            <span className="text-emerald-800 tabular-nums">{formatINR(p.amount)}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-semibold text-[#77726A]">No payments recorded yet</span>
                    )}
                  </div>

                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#77726A] block">
                      Total Received
                    </span>
                    <span className="font-serif text-lg font-bold text-emerald-700 tabular-nums block">
                      {formatINR(inv.paid_amount)}
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#77726A] block">
                      Remaining Balance
                    </span>
                    <span
                      className={`font-serif text-lg font-bold tabular-nums block ${
                        inv.balance_amount > 0 ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      {formatINR(inv.balance_amount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: COMPLETE PAYMENT HISTORY & RECEIPTS */}
      {activeTab === 'payments' && (
        <>
          {/* Swipe-Style Mobile & Tablet Payment Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className={`swipe-record-card space-y-3 ${
                  pay.is_voided ? 'opacity-60 bg-red-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#141414]">
                        {pay.payment_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E0DBD1] text-[10px] font-bold">
                        {pay.payment_type}
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#141414] mt-1">
                      {pay.client_name}
                    </h4>
                    <p className="text-[11px] font-mono text-[#77726A]">
                      {pay.booking_code} • {formatDateDDMMYYYY(pay.payment_date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-serif text-lg font-bold text-emerald-700 tabular-nums">
                      {formatINR(pay.amount)}
                    </div>
                    <div className="text-[10px] text-[#77726A] tabular-nums">
                      Bal After: <strong className="text-[#141414]">{formatINR(pay.remaining_balance_after)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E8E3DA]">
                  <div className="text-[11px] text-[#4A463F] truncate pr-2">
                    <strong>{pay.payment_method}</strong>
                    {pay.transaction_reference ? ` • ${pay.transaction_reference}` : ''}
                  </div>

                  {!pay.is_voided ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => generatePaymentReceiptPDF(pay)}
                        className="drk-btn-secondary py-1.5 px-2.5 text-[11px]"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Receipt PDF
                      </button>
                      <button
                        onClick={() => setVoidModalPayment(pay)}
                        className="p-2 rounded-lg border border-red-200 text-red-600"
                        title="Void Transaction"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase text-red-700">
                      Voided
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Laptop & Desktop Full Ledger Table (>= 768px) */}
          <div className="hidden md:block argon-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E6CFA0] text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4">Payment ID</th>
                    <th className="py-3.5 px-4">Client & Booking</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance After</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Method & Reference</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-right">Receipt / Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E3DA] text-xs">
                  {payments.map((pay) => (
                    <tr
                      key={pay.id}
                      className={`hover:bg-[#FAF8F5] ${
                        pay.is_voided ? 'opacity-55 bg-red-50/30 line-through' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#141414] whitespace-nowrap">
                        {pay.payment_code}
                      </td>
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="font-semibold text-[#141414]">{pay.client_name}</div>
                        <div className="text-[11px] font-mono text-[#77726A]">{pay.booking_code}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E0DBD1] text-[11px] font-bold">
                          {pay.payment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-serif text-sm font-bold text-emerald-700 tabular-nums text-right whitespace-nowrap">
                        {formatINR(pay.amount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#141414] tabular-nums text-right whitespace-nowrap">
                        {formatINR(pay.remaining_balance_after)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {formatDateDDMMYYYY(pay.payment_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#141414]">{pay.payment_method}</div>
                        <div className="text-[11px] font-mono text-[#77726A]">
                          {pay.transaction_reference || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#4A463F] max-w-[220px] truncate">
                        {pay.is_voided ? `VOIDED: ${pay.void_reason}` : pay.notes}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!pay.is_voided ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => generatePaymentReceiptPDF(pay)}
                              className="drk-btn-secondary py-1.5 px-2.5 text-[11px]"
                            >
                              <Receipt className="w-3.5 h-3.5" /> Receipt PDF
                            </button>
                            <button
                              onClick={() => setVoidModalPayment(pay)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              title="Void Transaction with Audit Trail (Never silently deleted)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase text-red-700">
                            Voided in Audit Log
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: IMMUTABLE FINANCIAL AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="argon-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E3DA]">
            <ShieldAlert className="w-5 h-5 text-[#C89B3C]" />
            <div>
              <h3 className="font-serif text-lg text-[#141414]">
                Immutable Financial Audit History
              </h3>
              <p className="text-xs text-[#77726A]">
                Every financial transaction, balance adjustment, and void operation is permanently recorded here and can never be silently deleted.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {financialAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E0DBD1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#141414] text-[#E6CFA0] text-[10px] font-bold uppercase mr-2">
                    {log.action}
                  </span>
                  <span className="font-semibold text-[#141414]">{log.description}</span>
                </div>
                <div className="text-[11px] text-[#77726A] shrink-0">
                  {log.actor_name} • {formatDateTimeIST(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  STUDIO ACCOUNTS RECEIVABLE
                </span>
                <h3 className="font-serif text-xl text-white">
                  Record Client Payment & Issue Receipt
                </h3>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="drk-label">Select Wedding Booking *</label>
                <select
                  required
                  value={payForm.booking_id}
                  onChange={(e) => {
                    const bk = bookings.find((b) => b.id === e.target.value);
                    setPayForm({
                      ...payForm,
                      booking_id: e.target.value,
                      amount: bk?.balance_amount || 0,
                    });
                  }}
                  className="drk-select"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_code} — {b.client_name} (Balance: {formatINR(b.balance_amount)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBookingForPayment && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E0DBD1] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">Package Total</span>
                    <span className="font-bold text-[#141414]">
                      {formatINR(selectedBookingForPayment.total_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">Paid So Far</span>
                    <span className="font-bold text-emerald-700">
                      {formatINR(selectedBookingForPayment.paid_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">
                      Balance After This
                    </span>
                    <span className="font-bold text-[#C89B3C]">
                      {formatINR(projectedRemainingBalance)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm({ ...payForm, amount: Number(e.target.value || 0) })
                    }
                    className="drk-input font-bold"
                  />
                </div>
                <div>
                  <label className="drk-label">Payment Stage *</label>
                  <select
                    value={payForm.payment_type}
                    onChange={(e) =>
                      setPayForm({
                        ...payForm,
                        payment_type: e.target.value as PaymentStageType,
                      })
                    }
                    className="drk-select"
                  >
                    <option value="Advance">Advance Payment</option>
                    <option value="Partial">Partial / Second Milestone</option>
                    <option value="Final">Final Settlement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Payment Method *</label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) =>
                      setPayForm({
                        ...payForm,
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
                  <label className="drk-label">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Transaction Reference / UTR / Receipt #</label>
                <input
                  type="text"
                  value={payForm.transaction_reference}
                  onChange={(e) =>
                    setPayForm({ ...payForm, transaction_reference: e.target.value })
                  }
                  placeholder="e.g. UPI-41982019283 / NEFT-HDFC-9912"
                  className="drk-input"
                />
              </div>

              <div>
                <label className="drk-label">Notes</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="e.g. Second payment received before wedding date"
                  className="drk-input"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  Save Payment & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE INVOICE MODAL */}
      {invModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl text-white">Generate Studio Invoice</h3>
              <button
                onClick={() => setInvModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="drk-label">Select Booking *</label>
                <select
                  value={invForm.booking_id}
                  onChange={(e) => setInvForm({ ...invForm, booking_id: e.target.value })}
                  className="drk-select"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_code} — {b.client_name} ({formatINR(b.total_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="drk-label">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={invForm.issue_date}
                    onChange={(e) => setInvForm({ ...invForm, issue_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invForm.due_date}
                    onChange={(e) => setInvForm({ ...invForm, due_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInvModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID TRANSACTION AUDIT MODAL */}
      {voidModalPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-red-900 text-white flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">
                Void Payment {voidModalPayment.payment_code}
              </h3>
              <button
                onClick={() => setVoidModalPayment(null)}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              <p className="text-xs text-[#4A463F]">
                Financial transactions are never silently deleted. Voiding this entry will preserve it in the audit trail and automatically recalculate the booking balance.
              </p>
              <div>
                <label className="drk-label">Mandatory Audit Reason for Voiding *</label>
                <input
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Duplicate entry / Cheque dishonored"
                  className="drk-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidModalPayment(null)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase"
                >
                  Confirm Void & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
