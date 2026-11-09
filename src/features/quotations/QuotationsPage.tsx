// ============================================================================
// THE DRK WEDDINGS — PACKAGES & QUOTATIONS MANAGEMENT MODULE
// Unlimited Packages, Multi-Service Custom Quotation Builder, Auto-Totals,
// Discounts, Taxes, PDF Generation, WhatsApp/Email Share & Booking Conversion
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  Printer,
  MessageCircle,
  Mail,
  HeartHandshake,
  Camera,
  Film,
  BookOpen,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import type {
  PackageRecord,
  QuotationItemRecord,
  QuotationRecord,
  QuotationStatus,
} from '../../types/crm';
import {
  buildWhatsAppLink,
  formatDateDDMMYYYY,
  formatINR,
  getTodayKolkataISO,
} from '../../lib/formatting';
import { generateQuotationPDF } from '../../lib/export/pdfAndCsvExporter';

const QUOTATION_STATUSES: QuotationStatus[] = [
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
];

const SERVICE_CATALOG = [
  { name: 'Traditional Photography', defaultRate: 15000, desc: 'Full ritual & family coverage' },
  { name: 'Candid Photography', defaultRate: 25000, desc: 'Senior fine-art candid specialist' },
  { name: 'Cinematography', defaultRate: 30000, desc: '4K Sony FX3 gimbal & slider storytelling' },
  { name: 'Traditional Videography', defaultRate: 15000, desc: 'Full-length ceremony documentation' },
  { name: 'Drone Photography', defaultRate: 12000, desc: '4K Mavic 3 Pro Cine aerial sequences' },
  { name: 'Pre-Wedding Shoot', defaultRate: 45000, desc: '1-Day outdoor couple story & teaser' },
  { name: 'Wedding Highlight Film', defaultRate: 25000, desc: '5-Min master graded cinematic highlight' },
  { name: 'Full Wedding Film', defaultRate: 30000, desc: '35-45 Min documentary feature film' },
  { name: 'Wedding Albums', defaultRate: 18000, desc: '40-Sheet Canvera Luxury Heirloom Album' },
  { name: 'Live Streaming', defaultRate: 15000, desc: 'Multi-cam YouTube HD ceremony broadcast' },
  { name: 'Additional Services', defaultRate: 10000, desc: 'LED Wall / Crane / Same-Day Edit' },
];

export const QuotationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    packages,
    quotations,
    leads,
    addPackage,
    updatePackage,
    deletePackage,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    convertQuotationToBooking,
  } = useData();

  const [activeTab, setActiveTab] = useState<'quotations' | 'packages'>('quotations');
  const [qtModalOpen, setQtModalOpen] = useState(false);
  const [pkgModalOpen, setPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const today = getTodayKolkataISO();
  const validDateDefault = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  // Quotation Builder State
  const [qtForm, setQtForm] = useState({
    lead_id: '',
    customer_name: '',
    customer_phone: '',
    customer_whatsapp: '',
    customer_email: '',
    wedding_date: today,
    event_location: 'Hazaribagh, Jharkhand',
    event_days: 3,
    package_id: packages[2]?.id || '',
    package_name: packages[2]?.name || 'Classic Royal Collection (3-Day Signature)',
    discount_amount: 0,
    tax_rate: 0,
    valid_until: validDateDefault,
    status: 'Sent' as QuotationStatus,
    terms_and_conditions:
      '1. 25% Booking Advance required to reserve studio dates.\n2. 50% payable on Day 1 of the Wedding.\n3. Remaining 25% payable prior to final master delivery.\n4. Outstation travel & hospitality borne by client.',
    notes: '',
  });

  const [qtItems, setQtItems] = useState<QuotationItemRecord[]>([
    {
      id: 'item-1',
      quotation_id: '',
      service_name: 'Candid Photography',
      description: 'Senior fine-art candid specialist',
      event_days: 3,
      team_count: 2,
      quantity: 1,
      unit_price: 65000,
      line_total: 65000,
    },
    {
      id: 'item-2',
      quotation_id: '',
      service_name: 'Cinematography',
      description: '4K Cinema Line FX3 + Highlight + Full Documentary Film',
      event_days: 3,
      team_count: 2,
      quantity: 1,
      unit_price: 85000,
      line_total: 85000,
    },
    {
      id: 'item-3',
      quotation_id: '',
      service_name: 'Wedding Albums',
      description: '2x 40-Sheet Canvera Luxury Heirloom Albums',
      event_days: 1,
      team_count: 1,
      quantity: 2,
      unit_price: 18000,
      line_total: 36000,
    },
  ]);

  // Package Builder State
  const [pkgForm, setPkgForm] = useState({
    name: '',
    tier: 'Classic Royal',
    description: '',
    base_price: 185000,
    photographers_count: 2,
    cinematographers_count: 2,
    event_days: 3,
    albums_description: '2 Bespoke 40-Sheet Canvera Heirloom Albums',
    edited_photos_count: 500,
    video_deliverables: '3-Min Teaser + 5-Min Highlight + 40-Min Full Film + 4 Reels',
    additional_services: ['Traditional Photography', 'Candid Photography', 'Cinematography', 'Wedding Albums'],
    is_active: true,
    popular_rank: 1,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setQtModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Automatic Quotation Totals Calculation
  const subtotal = qtItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const afterDiscount = Math.max(0, subtotal - Number(qtForm.discount_amount || 0));
  const taxAmount = Math.round((afterDiscount * Number(qtForm.tax_rate || 0)) / 100);
  const grandTotal = afterDiscount + taxAmount;

  const addServiceRow = (serviceName = 'Drone Photography') => {
    const template = SERVICE_CATALOG.find((s) => s.name === serviceName) || SERVICE_CATALOG[0];
    setQtItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        quotation_id: '',
        service_name: template.name,
        description: template.desc,
        event_days: qtForm.event_days,
        team_count: 1,
        quantity: 1,
        unit_price: template.defaultRate,
        line_total: template.defaultRate,
      },
    ]);
  };

  const updateServiceRow = (id: string, patch: Partial<QuotationItemRecord>) => {
    setQtItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        next.line_total = Number(next.quantity || 1) * Number(next.unit_price || 0);
        return next;
      })
    );
  };

  const removeServiceRow = (id: string) => {
    if (qtItems.length <= 1) return;
    setQtItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtForm.customer_name.trim() || !qtForm.customer_phone.trim()) return;

    const created = addQuotation({
      ...qtForm,
      customer_whatsapp: qtForm.customer_whatsapp || qtForm.customer_phone,
      items: qtItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: grandTotal,
    });

    setQtModalOpen(false);
    showToast(`Created Quotation ${created.quotation_number} (${formatINR(created.total_amount)}).`);
  };

  const handleConvertAcceptedQuotation = (qt: QuotationRecord) => {
    const booking = convertQuotationToBooking(qt.id, Math.round(qt.total_amount * 0.25));
    if (booking) {
      showToast(`Converted Quotation ${qt.quotation_number} into Booking ${booking.booking_code}!`);
      navigate('/bookings');
    }
  };

  const openNewPackageModal = () => {
    setEditingPkg(null);
    setPkgForm({
      name: '',
      tier: 'Custom Collection',
      description: '',
      base_price: 185000,
      photographers_count: 2,
      cinematographers_count: 2,
      event_days: 3,
      albums_description: '2 Bespoke 40-Sheet Canvera Heirloom Albums',
      edited_photos_count: 550,
      video_deliverables: '3-Min Teaser + 5-Min Highlight + 40-Min Full Film',
      additional_services: ['Traditional Photography', 'Candid Photography', 'Cinematography', 'Wedding Albums'],
      is_active: true,
      popular_rank: packages.length + 1,
    });
    setPkgModalOpen(true);
  };

  const openEditPackageModal = (pkg: PackageRecord) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name,
      tier: pkg.tier,
      description: pkg.description,
      base_price: pkg.base_price,
      photographers_count: pkg.photographers_count,
      cinematographers_count: pkg.cinematographers_count,
      event_days: pkg.event_days,
      albums_description: pkg.albums_description,
      edited_photos_count: pkg.edited_photos_count,
      video_deliverables: pkg.video_deliverables,
      additional_services: pkg.additional_services,
      is_active: pkg.is_active,
      popular_rank: pkg.popular_rank,
    });
    setPkgModalOpen(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgForm.name.trim()) return;
    if (editingPkg) {
      updatePackage(editingPkg.id, pkgForm);
      showToast(`Updated package "${pkgForm.name}".`);
    } else {
      addPackage(pkgForm);
      showToast(`Created new package "${pkgForm.name}".`);
    }
    setPkgModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white border border-[#C89B3C] px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C89B3C]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
            Studio Collections & Proposals
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#141414]">
            Photography Packages & Custom Quotations
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#E0DBD1] bg-white p-1">
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                activeTab === 'quotations'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#77726A] hover:text-[#141414]'
              }`}
            >
              Quotations ({quotations.length})
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                activeTab === 'packages'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#77726A] hover:text-[#141414]'
              }`}
            >
              Packages ({packages.length})
            </button>
          </div>

          {activeTab === 'quotations' ? (
            <button onClick={() => setQtModalOpen(true)} className="drk-btn-primary">
              <Plus className="w-4 h-4 text-[#E6CFA0]" />
              <span>Create Quotation</span>
            </button>
          ) : (
            <button onClick={openNewPackageModal} className="drk-btn-primary">
              <Plus className="w-4 h-4 text-[#E6CFA0]" />
              <span>Create Package</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: QUOTATIONS LIST */}
      {activeTab === 'quotations' ? (
        <div className="space-y-4">
          {quotations.map((qt) => (
            <div key={qt.id} className="argon-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-[#141414] text-[#E6CFA0]">
                    {qt.quotation_number}
                  </span>
                  <select
                    value={qt.status}
                    onChange={(e) =>
                      updateQuotation(qt.id, { status: e.target.value as QuotationStatus })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                      qt.status === 'Accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : qt.status === 'Sent'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : qt.status === 'Rejected' || qt.status === 'Expired'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-stone-100 text-stone-800 border-stone-300'
                    }`}
                  >
                    {QUOTATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        Status: {st}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-[#77726A]">
                    Valid Until: <strong>{formatDateDDMMYYYY(qt.valid_until)}</strong>
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-semibold text-[#141414]">
                  {qt.customer_name}
                </h3>

                <div className="text-xs text-[#4A463F]">
                  <strong>{qt.package_name}</strong> • Wedding Date:{' '}
                  {formatDateDDMMYYYY(qt.wedding_date)} ({qt.event_days} Days) • {qt.event_location}
                </div>

                {/* Line Items Preview */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {qt.items.map((item) => (
                    <span
                      key={item.id}
                      className="px-2.5 py-1 rounded bg-[#FAF9F5] border border-[#E0DBD1] text-[11px] text-[#141414]"
                    >
                      {item.service_name}: <strong>{formatINR(item.line_total)}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Totals & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E8E3DA]">
                <div className="text-left lg:text-right">
                  <div className="text-[11px] text-[#77726A]">
                    Subtotal: {formatINR(qt.subtotal)}
                    {qt.discount_amount > 0 ? ` • Discount: -${formatINR(qt.discount_amount)}` : ''}
                    {qt.tax_amount > 0 ? ` • Tax: +${formatINR(qt.tax_amount)}` : ''}
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
                    {formatINR(qt.total_amount)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => generateQuotationPDF(qt)}
                    className="drk-btn-secondary py-2 px-3"
                    title="Download Branded PDF Quotation"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>

                  <button
                    onClick={() => {
                      generateQuotationPDF(qt);
                      window.print();
                    }}
                    className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                    title="Print Quotation"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <a
                    href={buildWhatsAppLink(
                      qt.customer_whatsapp || qt.customer_phone,
                      `Hello ${qt.customer_name}! Here is your custom wedding photography & cinema quotation (${qt.quotation_number}) from THE DRK WEDDINGS for ${formatDateDDMMYYYY(qt.wedding_date)} at ${qt.event_location}.\n\nPackage: ${qt.package_name}\nTotal Investment: ${formatINR(qt.total_amount)}\n\nLooking forward to documenting your celebration!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="drk-btn-whatsapp"
                    title="Share Quotation on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>

                  {qt.customer_email && (
                    <a
                      href={`mailto:${qt.customer_email}?subject=${encodeURIComponent(
                        `Quotation ${qt.quotation_number} — THE DRK WEDDINGS`
                      )}&body=${encodeURIComponent(
                        `Dear ${qt.customer_name},\n\nPlease find your custom quotation (${qt.quotation_number}) for ${qt.package_name} on ${formatDateDDMMYYYY(qt.wedding_date)} at ${qt.event_location}.\nTotal Investment: ${formatINR(qt.total_amount)}.\n\nWarm regards,\nTHE DRK WEDDINGS\n+91 99345 04101`
                      )}`}
                      className="p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414]"
                      title="Email Quotation"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}

                  {!qt.converted_booking_id && (
                    <button
                      onClick={() => handleConvertAcceptedQuotation(qt)}
                      className="drk-btn-gold py-2 px-3"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" /> Convert to Booking
                    </button>
                  )}

                  <button
                    onClick={() => deleteQuotation(qt.id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete Quotation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAB 2: UNLIMITED PACKAGES MANAGEMENT */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="argon-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[#C89B3C]">
                    {pkg.package_code} • {pkg.tier}
                  </span>
                  <span className="font-serif text-2xl font-bold text-[#141414] tabular-nums">
                    {formatINR(pkg.base_price)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-semibold text-[#141414] mb-2">
                  {pkg.name}
                </h3>

                <p className="text-xs text-[#4A463F] leading-relaxed mb-4">{pkg.description}</p>

                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E0DBD1] text-xs mb-4">
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">Photographers</span>
                    <span className="font-bold text-[#141414]">{pkg.photographers_count} Crew</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">Cinematographers</span>
                    <span className="font-bold text-[#141414]">{pkg.cinematographers_count} Crew</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#77726A] block">Event Days</span>
                    <span className="font-bold text-[#141414]">{pkg.event_days} Days</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#4A463F] mb-4">
                  <div>
                    <strong>Albums:</strong> {pkg.albums_description}
                  </div>
                  <div>
                    <strong>Edited Photographs:</strong> {pkg.edited_photos_count}+ High-Res Stills
                  </div>
                  <div>
                    <strong>Video Deliverables:</strong> {pkg.video_deliverables}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {pkg.additional_services.map((srv) => (
                    <span
                      key={srv}
                      className="px-2 py-0.5 rounded bg-white border border-[#E0DBD1] text-[10px] font-semibold text-[#141414]"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditPackageModal(pkg)}
                  className="drk-btn-secondary py-2 px-3"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Customize Package
                </button>
                <button
                  onClick={() => deletePackage(pkg.id)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOM QUOTATION BUILDER MODAL */}
      {qtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#E6CFA0]">
                  BESPOKE QUOTATION BUILDER
                </span>
                <h3 className="font-serif text-xl text-white">
                  Create Custom Photography & Cinema Quotation
                </h3>
              </div>
              <button
                onClick={() => setQtModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 overflow-y-auto space-y-5">
              {/* Prefill from Existing Lead */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E0DBD1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#141414]">
                  Optional: Auto-Fill from Active Lead / Enquiry
                </span>
                <select
                  value={qtForm.lead_id}
                  onChange={(e) => {
                    const ld = leads.find((l) => l.id === e.target.value);
                    if (ld) {
                      setQtForm({
                        ...qtForm,
                        lead_id: ld.id,
                        customer_name: ld.customer_name,
                        customer_phone: ld.phone,
                        customer_whatsapp: ld.whatsapp,
                        customer_email: ld.email,
                        wedding_date: ld.event_date,
                        event_location: ld.event_location,
                        event_days: ld.event_days,
                        package_name: ld.interested_package_name,
                      });
                    }
                  }}
                  className="drk-select sm:w-80 text-xs"
                >
                  <option value="">-- Select Lead to Auto-Fill --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customer_name} ({l.lead_code} • {l.event_location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="drk-label">Couple / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={qtForm.customer_name}
                    onChange={(e) => setQtForm({ ...qtForm, customer_name: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={qtForm.customer_phone}
                    onChange={(e) =>
                      setQtForm({
                        ...qtForm,
                        customer_phone: e.target.value,
                        customer_whatsapp: e.target.value,
                      })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Email Address</label>
                  <input
                    type="email"
                    value={qtForm.customer_email}
                    onChange={(e) => setQtForm({ ...qtForm, customer_email: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="drk-label">Base Collection / Package Name *</label>
                  <input
                    type="text"
                    required
                    value={qtForm.package_name}
                    onChange={(e) => setQtForm({ ...qtForm, package_name: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Wedding Date *</label>
                  <input
                    type="date"
                    required
                    value={qtForm.wedding_date}
                    onChange={(e) => setQtForm({ ...qtForm, wedding_date: e.target.value })}
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={qtForm.valid_until}
                    onChange={(e) => setQtForm({ ...qtForm, valid_until: e.target.value })}
                    className="drk-input"
                  />
                </div>
              </div>

              {/* Multi-Service Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="drk-label mb-0">
                    Customized Photography & Cinema Services ({qtItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => addServiceRow()}
                    className="text-xs font-bold text-[#C89B3C] hover:underline"
                  >
                    + Add Service Line
                  </button>
                </div>

                <div className="space-y-2">
                  {qtItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg bg-[#FAF9F5] border border-[#E0DBD1] items-center"
                    >
                      <div className="sm:col-span-3">
                        <select
                          value={item.service_name}
                          onChange={(e) => {
                            const cat = SERVICE_CATALOG.find((s) => s.name === e.target.value);
                            updateServiceRow(item.id, {
                              service_name: e.target.value,
                              description: cat?.desc || item.description,
                              unit_price: cat?.defaultRate || item.unit_price,
                            });
                          }}
                          className="drk-select text-xs py-1.5"
                        >
                          {SERVICE_CATALOG.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateServiceRow(item.id, { description: e.target.value })
                          }
                          placeholder="Deliverable scope"
                          className="drk-input text-xs py-1.5"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateServiceRow(item.id, { quantity: Number(e.target.value || 1) })
                          }
                          className="drk-input text-xs py-1.5"
                          title="Quantity"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) =>
                            updateServiceRow(item.id, { unit_price: Number(e.target.value || 0) })
                          }
                          className="drk-input text-xs py-1.5"
                          title="Rate (₹)"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#141414] tabular-nums">
                          {formatINR(item.line_total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeServiceRow(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts, Taxes & Auto-Calculated Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="drk-label">Terms & Conditions</label>
                    <textarea
                      rows={4}
                      value={qtForm.terms_and_conditions}
                      onChange={(e) =>
                        setQtForm({ ...qtForm, terms_and_conditions: e.target.value })
                      }
                      className="drk-input text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E0DBD1] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#77726A]">Services Subtotal:</span>
                    <span className="font-bold text-[#141414]">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-[#77726A]">Special Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={qtForm.discount_amount}
                      onChange={(e) =>
                        setQtForm({ ...qtForm, discount_amount: Number(e.target.value || 0) })
                      }
                      className="drk-input w-32 py-1 text-right text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-[#77726A]">Applicable GST / Tax (%):</span>
                    <select
                      value={qtForm.tax_rate}
                      onChange={(e) =>
                        setQtForm({ ...qtForm, tax_rate: Number(e.target.value || 0) })
                      }
                      className="drk-select w-32 py-1 text-xs"
                    >
                      <option value={0}>0% (Standard)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                    </select>
                  </div>
                  <div className="pt-3 border-t border-[#E0DBD1] flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-[#141414]">
                      Total Quotation Value:
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#C89B3C] tabular-nums">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQtModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  Save & Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      {pkgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#141414] text-white flex items-center justify-between">
              <h3 className="font-serif text-xl text-white">
                {editingPkg ? 'Customize Photography Package' : 'Create New Photography Package'}
              </h3>
              <button
                onClick={() => setPkgModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="drk-label">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={pkgForm.name}
                    onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                    placeholder="e.g. Royal Jubilee 4-Day Collection"
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Package Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={pkgForm.base_price}
                    onChange={(e) =>
                      setPkgForm({ ...pkgForm, base_price: Number(e.target.value || 0) })
                    }
                    className="drk-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="drk-label">Photographers</label>
                  <input
                    type="number"
                    min={1}
                    value={pkgForm.photographers_count}
                    onChange={(e) =>
                      setPkgForm({
                        ...pkgForm,
                        photographers_count: Number(e.target.value || 1),
                      })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Cinematographers</label>
                  <input
                    type="number"
                    min={0}
                    value={pkgForm.cinematographers_count}
                    onChange={(e) =>
                      setPkgForm({
                        ...pkgForm,
                        cinematographers_count: Number(e.target.value || 0),
                      })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Event Days</label>
                  <input
                    type="number"
                    min={1}
                    value={pkgForm.event_days}
                    onChange={(e) =>
                      setPkgForm({ ...pkgForm, event_days: Number(e.target.value || 1) })
                    }
                    className="drk-input"
                  />
                </div>
                <div>
                  <label className="drk-label">Edited Photos</label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={pkgForm.edited_photos_count}
                    onChange={(e) =>
                      setPkgForm({
                        ...pkgForm,
                        edited_photos_count: Number(e.target.value || 300),
                      })
                    }
                    className="drk-input"
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Wedding Albums Included</label>
                <input
                  type="text"
                  value={pkgForm.albums_description}
                  onChange={(e) =>
                    setPkgForm({ ...pkgForm, albums_description: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div>
                <label className="drk-label">Video Deliverables</label>
                <input
                  type="text"
                  value={pkgForm.video_deliverables}
                  onChange={(e) =>
                    setPkgForm({ ...pkgForm, video_deliverables: e.target.value })
                  }
                  className="drk-input"
                />
              </div>

              <div>
                <label className="drk-label">Description</label>
                <textarea
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  className="drk-input"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E3DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPkgModalOpen(false)}
                  className="drk-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="drk-btn-primary">
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
