import React, { useMemo, useState } from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import { formatDateDDMMYYYY } from '../../lib/formatting';
import type { DocumentCategory, DocumentRecord } from '../../types/crm';

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Client agreements',
  'Booking contracts',
  'Quotations',
  'Invoices',
  'Receipts',
  'Event documents',
  'Vendor bills',
  'Business documents',
  'Other attachments',
];

export const DocumentsPage: React.FC = () => {
  const {
    documents,
    clients,
    bookings,
    projects,
    addDocument,
    deleteDocument,
  } = useData();
  const { currentUser, canAccess } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    category: 'Booking contracts' as DocumentCategory,
    client_id: '',
    booking_id: '',
    project_id: '',
    file_name: '',
    file_size: '1.4 MB',
    file_type: 'application/pdf',
    file_url: '',
    notes: '',
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.document_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.booking_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || d.category === categoryFilter;
      const matchesClient = clientFilter === 'ALL' || d.client_id === clientFilter;
      return matchesSearch && matchesCat && matchesClient;
    });
  }, [documents, searchQuery, categoryFilter, clientFilter]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr =
      sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_size: sizeStr,
        file_type: file.type || 'application/octet-stream',
        file_url: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === formState.client_id);
    const booking = bookings.find((b) => b.id === formState.booking_id);

    addDocument({
      title: formState.title,
      category: formState.category,
      client_id: client?.id || booking?.client_id,
      client_name: client?.full_name || booking?.client_name,
      booking_id: booking?.id,
      booking_code: booking?.booking_code,
      project_id: formState.project_id || undefined,
      file_name:
        formState.file_name ||
        `${formState.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      file_size: formState.file_size || '850 KB',
      file_type: formState.file_type || 'application/pdf',
      file_url: formState.file_url || '#internal-studio-vault',
      uploaded_by: currentUser?.full_name || 'Dheeraj Raj',
      notes: formState.notes,
    });

    setShowUploadModal(false);
    setFormState({
      title: '',
      category: 'Booking contracts',
      client_id: '',
      booking_id: '',
      project_id: '',
      file_name: '',
      file_size: '1.4 MB',
      file_type: 'application/pdf',
      file_url: '',
      notes: '',
    });
  };

  const handleDownloadDocument = (doc: DocumentRecord) => {
    if (doc.file_url && doc.file_url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.file_url;
      a.download = doc.file_name;
      a.click();
      return;
    }
    // Generate a structured summary text download if it is a seed reference document
    const content = [
      '====================================================================',
      'THE DRK WEDDINGS — OFFICIAL STUDIO DOCUMENT RECORD',
      'Dipugarha, Hazaribagh, Jharkhand | +91 99345 04101',
      '====================================================================',
      `Document Code : ${doc.document_code}`,
      `Title         : ${doc.title}`,
      `Category      : ${doc.category}`,
      `Client        : ${doc.client_name || 'Internal Studio Record'}`,
      `Booking Ref   : ${doc.booking_code || 'N/A'}`,
      `File Name     : ${doc.file_name} (${doc.file_size})`,
      `Uploaded By   : ${doc.uploaded_by}`,
      `Date          : ${formatDateDDMMYYYY(doc.created_at)}`,
      '',
      'NOTES / SUMMARY:',
      doc.notes || 'Official archival document stored in THE DRK WEDDINGS CRM.',
      '====================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_code}_${doc.file_name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <FolderOpen className="h-3.5 w-3.5 text-gold-400" />
              Studio Legal & Business Vault
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Document & Contract Repository
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Centralized storage for client agreements, booking contracts, quotations, invoices, receipts, vendor bills, and business records.
          </p>
        </div>

        {canAccess('documents', 'create') && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-sm font-semibold text-gold-300 shadow-sm hover:bg-obsidian-800"
          >
            <Upload className="h-4 w-4" />
            Upload & Link Document
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
            categoryFilter === 'ALL'
              ? 'bg-obsidian-900 text-gold-300'
              : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
          }`}
        >
          All Documents ({documents.length})
        </button>
        {DOCUMENT_CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                categoryFilter === cat
                  ? 'bg-obsidian-900 text-gold-300'
                  : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Client Filter */}
      <div className="argon-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document title, code, filename, couple, or booking..."
            className="w-full rounded-xl border border-obsidian-200 py-2 pl-9 pr-3 text-xs"
          />
        </div>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-xl border border-obsidian-200 px-3 py-2 text-xs font-medium text-obsidian-700"
        >
          <option value="ALL">All Linked Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.client_code})
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="argon-card flex flex-col justify-between p-5 transition hover:border-gold-400"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-obsidian-900 text-gold-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-obsidian-400">
                        {doc.document_code}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        {doc.category}
                      </span>
                    </div>
                    <h3 className="mt-1 font-serif text-base font-bold text-obsidian-900">
                      {doc.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 rounded-xl bg-obsidian-50 p-3 text-xs text-obsidian-600">
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-400">File:</span>
                  <span className="font-mono font-semibold text-obsidian-800">
                    {doc.file_name} ({doc.file_size})
                  </span>
                </div>
                {doc.client_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-obsidian-400">Linked Client:</span>
                    <span className="font-semibold text-obsidian-900">{doc.client_name}</span>
                  </div>
                )}
                {doc.booking_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-obsidian-400">Booking Ref:</span>
                    <span className="font-mono font-semibold text-gold-700">
                      {doc.booking_code}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-400">Uploaded:</span>
                  <span>
                    {formatDateDDMMYYYY(doc.created_at)} by {doc.uploaded_by}
                  </span>
                </div>
              </div>

              {doc.notes && (
                <p className="mt-2.5 text-xs text-obsidian-500">{doc.notes}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-obsidian-100 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-obsidian-100 px-3 py-1.5 text-xs font-semibold text-obsidian-800 hover:bg-obsidian-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect
                </button>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-obsidian-900 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-obsidian-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>

              {canAccess('documents', 'delete') && (
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                  title="Delete Document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
                  {previewDoc.document_code} • {previewDoc.category}
                </span>
                <h3 className="font-serif text-lg font-bold">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm">
              <div className="rounded-xl border border-obsidian-200 bg-obsidian-50 p-4">
                <p className="font-mono text-xs font-bold text-obsidian-800">
                  {previewDoc.file_name} ({previewDoc.file_size})
                </p>
                <p className="mt-2 text-xs text-obsidian-600">
                  {previewDoc.notes ||
                    'Verified studio archival document linked to internal CRM records.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-obsidian-400">Linked Client:</span>
                  <p className="font-semibold text-obsidian-900">
                    {previewDoc.client_name || 'General Business'}
                  </p>
                </div>
                <div>
                  <span className="text-obsidian-400">Linked Booking:</span>
                  <p className="font-semibold text-obsidian-900">
                    {previewDoc.booking_code || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-obsidian-400">Uploaded By:</span>
                  <p className="font-semibold text-obsidian-900">{previewDoc.uploaded_by}</p>
                </div>
                <div>
                  <span className="text-obsidian-400">Upload Date:</span>
                  <p className="font-semibold text-obsidian-900">
                    {formatDateDDMMYYYY(previewDoc.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => handleDownloadDocument(previewDoc)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-obsidian-900 px-4 py-2 text-xs font-semibold text-gold-300"
                >
                  <Download className="h-4 w-4" />
                  Download Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">Upload & Link Studio Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Select File From Computer (PDF, Image, DOCX, XLSX)
                </label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className="mt-1 w-full rounded-xl border border-dashed border-obsidian-300 bg-obsidian-50 p-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Signed Wedding Cinematography Agreement"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Category *
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        category: e.target.value as DocumentCategory,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Link to Client (Optional)
                  </label>
                  <select
                    value={formState.client_id}
                    onChange={(e) => setFormState({ ...formState, client_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="">— None / General Business —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Link to Booking (Optional)
                  </label>
                  <select
                    value={formState.booking_id}
                    onChange={(e) => setFormState({ ...formState, booking_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="">— None —</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_code} — {b.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Link to Post-Production Project (Optional)
                  </label>
                  <select
                    value={formState.project_id}
                    onChange={(e) => setFormState({ ...formState, project_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="">— None —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code} — {p.client_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Notes / Contract Summary
                </label>
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
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  Save to Document Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
