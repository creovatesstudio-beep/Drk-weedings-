// ============================================================================
// THE DRK WEDDINGS — BRANDED PDF & CSV GENERATOR ENGINE
// Generates luxury editorial Quotations, Invoices, Payment Receipts & Reports
// ============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  BookingRecord,
  InvoiceRecord,
  PaymentRecord,
  QuotationRecord,
} from '../../types/crm';
import { formatDateDDMMYYYY } from '../formatting';

function formatPdfINR(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function drawStudioHeader(doc: jsPDF, documentTitle: string, documentRef: string, dateStr: string) {
  // Deep Espresso Header Bar (#0A0807)
  doc.setFillColor(10, 8, 7);
  doc.rect(0, 0, 210, 38, 'F');

  // Burnished Gold Accent Line (#C89B3C)
  doc.setFillColor(200, 155, 60);
  doc.rect(0, 38, 210, 1.5, 'F');

  // Studio Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('THE DRK WEDDINGS', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 207, 160);
  doc.text('DRK PRODUCTION  |  PHOTOGRAPHY & CINEMA STUDIO  |  EST. 2017', 14, 22);

  doc.setTextColor(200, 195, 188);
  doc.setFontSize(7.5);
  doc.text('Dipugarha, Hazaribagh, Jharkhand & Worldwide  •  +91 99345 04101  •  thedrkweddings@gmail.com', 14, 29);

  // Right Document Type & Ref
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(230, 207, 160);
  doc.text(documentTitle.toUpperCase(), 196, 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref: ${documentRef}`, 196, 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(210, 205, 198);
  doc.text(`Date: ${formatDateDDMMYYYY(dateStr)}`, 196, 29, { align: 'right' });
}

export function generateQuotationPDF(quotation: QuotationRecord): void {
  const doc = new jsPDF();
  drawStudioHeader(doc, 'Bespoke Quotation', quotation.quotation_number, quotation.created_at);

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PREPARED FOR COUPLE / CLIENT:', 14, 50);

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(quotation.customer_name, 14, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 70, 63);
  doc.text(`Phone / WhatsApp: ${quotation.customer_phone}`, 14, 63);
  if (quotation.customer_email) {
    doc.text(`Email: ${quotation.customer_email}`, 14, 68);
  }

  // Right column details
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CELEBRATION DETAILS:', 120, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 70, 63);
  doc.text(`Collection: ${quotation.package_name}`, 120, 56);
  doc.text(`Wedding Date: ${formatDateDDMMYYYY(quotation.wedding_date)} (${quotation.event_days} Days)`, 120, 61);
  doc.text(`Venue: ${quotation.event_location}`, 120, 66);
  doc.text(`Valid Until: ${formatDateDDMMYYYY(quotation.valid_until)}`, 120, 71);

  const tableRows = quotation.items.map((item, idx) => [
    String(idx + 1).padStart(2, '0'),
    item.service_name,
    item.description || '—',
    `${item.event_days}d / ${item.team_count} crew`,
    String(item.quantity),
    formatPdfINR(item.unit_price),
    formatPdfINR(item.line_total),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['#', 'Service / Deliverable', 'Scope & Details', 'Days / Crew', 'Qty', 'Rate', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: [230, 207, 160],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [28, 25, 23],
    },
    alternateRowStyles: {
      fillColor: [250, 248, 245],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = ((doc as any).lastAutoTable?.finalY || 130) + 10;

  // Totals Box
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(224, 219, 209);
  doc.rect(120, finalY, 76, 36, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 70, 63);
  doc.text('Subtotal:', 125, finalY + 8);
  doc.text(formatPdfINR(quotation.subtotal), 191, finalY + 8, { align: 'right' });

  doc.text('Discount:', 125, finalY + 15);
  doc.text(`- ${formatPdfINR(quotation.discount_amount)}`, 191, finalY + 15, { align: 'right' });

  doc.text(`Tax (${quotation.tax_rate}%):`, 125, finalY + 22);
  doc.text(formatPdfINR(quotation.tax_amount), 191, finalY + 22, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Net Investment:', 125, finalY + 31);
  doc.text(formatPdfINR(quotation.total_amount), 191, finalY + 31, { align: 'right' });

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('STUDIO TERMS & BOOKING POLICY:', 14, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 85, 78);
  const splitTerms = doc.splitTextToSize(quotation.terms_and_conditions || '', 100);
  doc.text(splitTerms, 14, finalY + 12);

  doc.save(`${quotation.quotation_number}_${quotation.customer_name.replace(/\s+/g, '_')}.pdf`);
}

export function generateInvoicePDF(
  invoice: InvoiceRecord,
  booking?: BookingRecord,
  payments: PaymentRecord[] = []
): void {
  const doc = new jsPDF();
  drawStudioHeader(doc, 'Tax / Studio Invoice', invoice.invoice_number, invoice.issue_date);

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILLED TO CLIENT:', 14, 50);

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(invoice.client_name, 14, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(74, 70, 63);
  doc.text(`Phone: ${invoice.client_phone}`, 14, 63);
  doc.text(`Booking Reference: ${invoice.booking_code}`, 14, 68);

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE SUMMARY:', 120, 50);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(74, 70, 63);
  doc.text(`Issue Date: ${formatDateDDMMYYYY(invoice.issue_date)}`, 120, 56);
  doc.text(`Due Date: ${formatDateDDMMYYYY(invoice.due_date)}`, 120, 61);
  doc.text(`Payment Status: ${invoice.status.toUpperCase()}`, 120, 66);
  if (booking) {
    doc.text(`Wedding Date: ${formatDateDDMMYYYY(booking.wedding_date)}`, 120, 71);
  }

  autoTable(doc, {
    startY: 78,
    head: [['Description', 'Booking Code', 'Package Total', 'Paid Amount', 'Balance Due']],
    body: [
      [
        booking?.package_name || 'Wedding Photography & Cinematography Collection',
        invoice.booking_code,
        formatPdfINR(invoice.total_amount),
        formatPdfINR(invoice.paid_amount),
        formatPdfINR(invoice.balance_amount),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: [230, 207, 160],
      fontStyle: 'bold',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nextY = ((doc as any).lastAutoTable?.finalY || 110) + 12;

  const activePayments = payments.filter((p) => !p.is_voided);
  if (activePayments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text('PAYMENT LEDGER & TRANSACTION HISTORY', 14, nextY);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Receipt #', 'Date', 'Stage', 'Method', 'Reference', 'Amount Paid', 'Balance After']],
      body: activePayments.map((p) => [
        p.payment_code,
        formatDateDDMMYYYY(p.payment_date),
        p.payment_type,
        p.payment_method,
        p.transaction_reference || '—',
        formatPdfINR(p.amount),
        formatPdfINR(p.remaining_balance_after),
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [74, 70, 63],
        textColor: [255, 255, 255],
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextY = ((doc as any).lastAutoTable?.finalY || nextY + 30) + 10;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 85, 78);
  doc.text(
    'Thank you for choosing THE DRK WEDDINGS. Every frame is crafted to be felt fifty years from now.',
    14,
    nextY + 8
  );

  doc.save(`${invoice.invoice_number}_${invoice.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function generatePaymentReceiptPDF(payment: PaymentRecord): void {
  const doc = new jsPDF();
  drawStudioHeader(doc, 'Official Payment Receipt', payment.payment_code, payment.payment_date);

  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(200, 155, 60);
  doc.rect(14, 48, 182, 72, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  doc.text('PAYMENT ACKNOWLEDGEMENT RECEIPT', 22, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 56, 50);
  doc.text(`Received With Thanks From: ${payment.client_name}`, 22, 72);
  doc.text(`Booking Reference: ${payment.booking_code}`, 22, 80);
  doc.text(`Payment Stage: ${payment.payment_type} Payment`, 22, 88);
  doc.text(`Payment Mode: ${payment.payment_method} (Ref: ${payment.transaction_reference || 'N/A'})`, 22, 96);
  doc.text(`Received By: ${payment.received_by}`, 22, 104);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 118, 110);
  doc.text(`Amount Received: ${formatPdfINR(payment.amount)}`, 125, 76);

  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(`Remaining Booking Balance: ${formatPdfINR(payment.remaining_balance_after)}`, 125, 88);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  doc.text('Authorized Signatory — THE DRK WEDDINGS (Dipugarha, Hazaribagh)', 22, 114);

  doc.save(`Receipt_${payment.payment_code}.pdf`);
}

export function exportRowsToCSV(filename: string, headers: string[], rows: Array<Array<string | number>>): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAnalyticsReportPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>
): void {
  const doc = new jsPDF();
  drawStudioHeader(doc, 'Business Analytics Report', `RPT-${Date.now().toString().slice(-5)}`, new Date().toISOString());

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(title, 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 95, 88);
  doc.text(subtitle, 14, 56);

  autoTable(doc, {
    startY: 62,
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c))),
    theme: 'grid',
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: [230, 207, 160],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_DRK_Weddings.pdf`);
}
