import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Globe,
  History,
  Lock,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import { formatDateDDMMYYYY } from '../../lib/formatting';

export const SettingsPage: React.FC = () => {
  const {
    audit_logs,
    leads,
    clients,
    bookings,
    payments,
    expenses,
    projects,
    tasks,
    exportDatabaseBackupJSON,
    importDatabaseBackupJSON,
    resetToInitialStudioData,
  } = useData();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'studio' | 'backup' | 'audit'>('studio');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [backupStatusMessage, setBackupStatusMessage] = useState<string | null>(null);

  const filteredAuditLogs = useMemo(() => {
    return audit_logs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchQueryLower(auditSearch)) ||
        log.actor_name.toLowerCase().includes(searchQueryLower(auditSearch)) ||
        log.module.toLowerCase().includes(searchQueryLower(auditSearch)) ||
        log.entity_id.toLowerCase().includes(searchQueryLower(auditSearch));
      const matchesAction =
        auditActionFilter === 'ALL' || log.action === auditActionFilter;
      return matchesSearch && matchesAction;
    });
  }, [audit_logs, auditSearch, auditActionFilter]);

  function searchQueryLower(str: string) {
    return (str || '').toLowerCase();
  }

  const handleDownloadBackup = () => {
    const json = exportDatabaseBackupJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THE_DRK_WEDDINGS_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatusMessage('Full 23-table CRM JSON backup downloaded successfully.');
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = importDatabaseBackupJSON(reader.result);
        if (res.ok) {
          setBackupStatusMessage('Database backup restored successfully!');
        } else {
          setBackupStatusMessage(`Restore failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <Settings className="h-3.5 w-3.5 text-gold-400" />
              System Administration & Audit Vault
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Studio Settings, Database Backup & Audit Trail
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Configure studio identity, export/restore encrypted JSON database backups, and inspect immutable system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'studio'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            Studio Identity & Regional
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'backup'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            Database Backup & Restore
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-obsidian-900 text-gold-300'
                : 'bg-white text-obsidian-600 hover:bg-obsidian-100'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Immutable Audit Logs ({audit_logs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: STUDIO PROFILE & REGIONAL STANDARDS */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="argon-card space-y-5 p-6 lg:col-span-7">
            <h2 className="font-serif text-lg font-bold text-obsidian-900">
              Official Brand & Studio Identity (Synced with Public Website)
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-obsidian-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-obsidian-400">
                  Business Name
                </p>
                <p className="mt-1 font-serif text-base font-bold text-obsidian-900">
                  THE DRK WEDDINGS
                </p>
                <p className="text-xs text-obsidian-500">
                  DRK Production | Photography & Cinema Studio (Est. 2017)
                </p>
              </div>

              <div className="rounded-xl bg-obsidian-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-obsidian-400">
                  Connected Public Website
                </p>
                <a
                  href="https://thedrkweddings.pages.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 font-semibold text-gold-700 underline"
                >
                  <Globe className="h-4 w-4" />
                  https://thedrkweddings.pages.dev/
                </a>
                <p className="text-xs text-obsidian-500">Read-only visual reference & lead webhook</p>
              </div>

              <div className="rounded-xl bg-obsidian-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-obsidian-400">
                  Studio Headquarters
                </p>
                <p className="mt-1 font-semibold text-obsidian-900">
                  Dipugarha, Hazaribagh, Jharkhand
                </p>
                <p className="text-xs text-obsidian-500">Available for Destination Weddings Worldwide</p>
              </div>

              <div className="rounded-xl bg-obsidian-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-obsidian-400">
                  Official Contact & WhatsApp
                </p>
                <p className="mt-1 font-semibold text-obsidian-900">+91 99345 04101</p>
                <p className="text-xs text-obsidian-500">thedrkweddings@gmail.com</p>
              </div>
            </div>

            <div className="rounded-2xl border border-obsidian-200 bg-white p-4">
              <h3 className="font-serif text-sm font-bold text-obsidian-900">
                Enforced Regional & Security Standards
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl bg-obsidian-50 p-3">
                  <span className="text-obsidian-400">Currency Standard:</span>
                  <p className="mt-0.5 font-bold text-obsidian-900">Indian Rupees (₹ / INR)</p>
                </div>
                <div className="rounded-xl bg-obsidian-50 p-3">
                  <span className="text-obsidian-400">Date Display Standard:</span>
                  <p className="mt-0.5 font-bold text-obsidian-900">DD/MM/YYYY</p>
                </div>
                <div className="rounded-xl bg-obsidian-50 p-3">
                  <span className="text-obsidian-400">Timezone:</span>
                  <p className="mt-0.5 font-bold text-obsidian-900">Asia/Kolkata (IST)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="argon-card space-y-4 p-6 lg:col-span-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <h2 className="font-serif text-lg font-bold text-obsidian-900">
                Strict Internal Access Architecture
              </h2>
            </div>

            <div className="space-y-2.5 text-xs text-obsidian-600">
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50/70 p-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  <strong>Zero Customer Login / Portal:</strong> This application is strictly
                  restricted to the business owner ({currentUser?.full_name}) and authorized
                  internal staff.
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50/70 p-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  <strong>Immutable Financial Ledger:</strong> Payments are never silently
                  deleted. Voided payments preserve their full audit trail and reason.
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50/70 p-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  <strong>23 Relational Tables Active:</strong>{' '}
                  {leads.length} Leads, {clients.length} Clients, {bookings.length} Bookings,{' '}
                  {payments.length} Payments, {expenses.length} Expenses, {projects.length}{' '}
                  Projects, {tasks.length} Tasks.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATABASE BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="argon-card flex flex-col justify-between p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-obsidian-900 text-gold-400">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-obsidian-900">
                Export Full Database Backup (JSON)
              </h3>
              <p className="mt-1 text-xs text-obsidian-500">
                Download a complete snapshot of all 23 relational tables including leads, clients,
                bookings, invoices, payments, expenses, projects, and audit logs.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-xs font-semibold text-gold-300 hover:bg-obsidian-800"
            >
              <Download className="h-4 w-4" />
              Download JSON Backup
            </button>
          </div>

          <div className="argon-card flex flex-col justify-between p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-obsidian-900">
                Restore Database From Backup
              </h3>
              <p className="mt-1 text-xs text-obsidian-500">
                Upload a previously exported THE DRK WEDDINGS JSON backup file to restore all
                records immediately.
              </p>
            </div>
            <label className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-obsidian-200 bg-white px-4 py-2.5 text-xs font-semibold text-obsidian-800 hover:bg-obsidian-50">
              <Upload className="h-4 w-4" />
              Select Backup File (.json)
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackupFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="argon-card flex flex-col justify-between p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-obsidian-900">
                Reset to Reference Studio Dataset
              </h3>
              <p className="mt-1 text-xs text-obsidian-500">
                Re-initialize the local database to the default Hazaribagh/Ranchi wedding
                production dataset.
              </p>
            </div>
            <button
              onClick={() => {
                resetToInitialStudioData();
                setBackupStatusMessage('Studio database reset to initial reference dataset.');
              }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Studio Dataset
            </button>
          </div>

          {backupStatusMessage && (
            <div className="md:col-span-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
              {backupStatusMessage}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="argon-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-obsidian-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-obsidian-900">
                Immutable Financial & Operational Audit Log
              </h2>
              <p className="text-xs text-obsidian-500">
                Every creation, status change, conversion, voided transaction, and webhook event is permanently recorded.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit trail..."
                  className="w-56 rounded-xl border border-obsidian-200 py-1.5 pl-9 pr-3 text-xs"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="rounded-xl border border-obsidian-200 px-3 py-1.5 text-xs"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="CONVERT">CONVERT</option>
                <option value="VOID">VOID</option>
                <option value="DELETE">DELETE</option>
                <option value="WEBHOOK">WEBHOOK</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
                <tr>
                  <th className="px-5 py-3.5">Date (DD/MM/YYYY)</th>
                  <th className="px-4 py-3.5">Actor & Role</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Module</th>
                  <th className="px-4 py-3.5">Entity ID</th>
                  <th className="px-5 py-3.5">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-obsidian-50/50">
                    <td className="px-5 py-3 text-xs text-obsidian-600">
                      {formatDateDDMMYYYY(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold text-obsidian-900">{log.actor_name}</span>
                      <span className="ml-1.5 text-obsidian-400">({log.actor_role})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                          log.action === 'VOID' || log.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800'
                            : log.action === 'CONVERT' || log.action === 'WEBHOOK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-obsidian-100 text-obsidian-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium capitalize text-obsidian-700">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-obsidian-500">
                      {log.entity_id}
                    </td>
                    <td className="px-5 py-3 text-xs text-obsidian-800">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
