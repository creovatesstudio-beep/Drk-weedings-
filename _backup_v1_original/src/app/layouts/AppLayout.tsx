// ============================================================================
// THE DRK WEDDINGS — CUSTOMIZED ARGON EXECUTIVE LAYOUT
// Collapsible Obsidian Sidebar, Top Navigation, Global Search & Notifications
// ============================================================================

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  HeartHandshake,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  ReceiptIndianRupee,
  Wallet,
  Clapperboard,
  PackageCheck,
  UsersRound,
  MessageCircle,
  FolderArchive,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Plus,
  LogOut,
  Shield,
  ExternalLink,
  X,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../providers/AuthContext';
import { useData } from '../providers/DataContext';
import type { CRMModule, StaffRole } from '../../types/crm';
import { formatDateDDMMYYYY, formatINR } from '../../lib/formatting';

interface NavItem {
  label: string;
  path: string;
  module: CRMModule;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const AppLayout: React.FC = () => {
  const { currentUser, logout, switchInternalRole, hasModuleAccess, canViewFinancials } = useAuth();
  const { leads, bookings, deliverables, notifications, markNotificationRead, markAllNotificationsRead, clients, quotations, invoices } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const newLeadsCount = leads.filter((l) => l.status === 'New' || l.status === 'Follow-up Required').length;
  const activeBookingsCount = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Upcoming' || b.status === 'Post-Production').length;
  const pendingDeliverablesCount = deliverables.filter((d) => d.status !== 'Delivered').length;
  const unreadNotifs = notifications.filter((n) => !n.is_read);

  const navGroups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Studio Command',
      items: [
        { label: 'Executive Dashboard', path: '/', module: 'dashboard', icon: LayoutDashboard },
        { label: 'Master Calendar', path: '/calendar', module: 'calendar', icon: CalendarIcon },
      ],
    },
    {
      title: 'CRM & Weddings',
      items: [
        { label: 'Leads & Enquiries', path: '/leads', module: 'leads', icon: Users, badge: newLeadsCount },
        { label: 'Clients Database', path: '/clients', module: 'clients', icon: UserCheck },
        { label: 'Wedding Bookings', path: '/bookings', module: 'bookings', icon: HeartHandshake, badge: activeBookingsCount },
      ],
    },
    {
      title: 'Financial Suite',
      items: [
        { label: 'Packages & Quotations', path: '/quotations', module: 'quotations', icon: FileSpreadsheet },
        { label: 'Invoices & Payments', path: '/invoices', module: 'invoices', icon: ReceiptIndianRupee },
        { label: 'Expenses & Profit', path: '/expenses', module: 'expenses', icon: Wallet },
      ],
    },
    {
      title: 'Production & Crew',
      items: [
        { label: 'Projects & Editing', path: '/projects', module: 'projects', icon: Clapperboard },
        { label: 'Deliverables Tracker', path: '/deliverables', module: 'deliverables', icon: PackageCheck, badge: pendingDeliverablesCount },
        { label: 'Team & Freelancers', path: '/team', module: 'team', icon: UsersRound },
      ],
    },
    {
      title: 'Communication & Vault',
      items: [
        { label: 'WhatsApp & Website', path: '/communication', module: 'communication', icon: MessageCircle },
        { label: 'Documents Vault', path: '/documents', module: 'documents', icon: FolderArchive },
        { label: 'Reports & Analytics', path: '/reports', module: 'reports', icon: BarChart3 },
        { label: 'Settings & Audit', path: '/settings', module: 'settings', icon: Settings },
      ],
    },
  ];

  // Global search results
  const q = searchQuery.trim().toLowerCase();
  const matchedLeads = q
    ? leads.filter(
        (l) =>
          l.customer_name.toLowerCase().includes(q) ||
          l.lead_code.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.event_location.toLowerCase().includes(q)
      )
    : [];
  const matchedClients = q
    ? clients.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.client_code.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
    : [];
  const matchedBookings = q
    ? bookings.filter(
        (b) =>
          b.client_name.toLowerCase().includes(q) ||
          b.booking_code.toLowerCase().includes(q) ||
          b.event_location.toLowerCase().includes(q)
      )
    : [];
  const matchedQuotations = q
    ? quotations.filter(
        (qt) =>
          qt.customer_name.toLowerCase().includes(q) ||
          qt.quotation_number.toLowerCase().includes(q)
      )
    : [];
  const matchedInvoices = q
    ? invoices.filter(
        (inv) =>
          inv.client_name.toLowerCase().includes(q) ||
          inv.invoice_number.toLowerCase().includes(q)
      )
    : [];

  const getCurrentPageTitle = () => {
    for (const grp of navGroups) {
      for (const item of grp.items) {
        if (item.path === location.pathname) return item.label;
      }
    }
    return 'Studio Command';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Argon Obsidian Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0A0807] text-white border-r border-white/10 flex flex-col transition-all duration-300 select-none ${
          collapsed ? 'lg:w-20' : 'lg:w-68 w-72'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-18 px-4 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <img
              src="/assets/logos/drk-logo-clean-white.png"
              alt="The DRK Weddings"
              className="h-8 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-serif text-sm font-semibold tracking-wide text-white truncate">
                  THE DRK WEDDINGS
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-[#E6CFA0] truncate">
                  Private Studio CRM
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => hasModuleAccess(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-stone-500">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileMenuOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-[#C89B3C] text-[#0A0807] font-bold shadow-xs'
                              : 'text-stone-300 hover:text-white hover:bg-white/8'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!collapsed && item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-white/15 text-current">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Public Website Link & Active Internal Staff Footer */}
        <div className="p-3 border-t border-white/10 space-y-2 shrink-0 bg-[#141414]">
          {!collapsed && (
            <a
              href="https://thedrkweddings.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#E6CFA0] transition-colors"
            >
              <span>Public Website (Live)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div className="flex items-center justify-between px-2 py-1.5">
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser?.full_name.split('(')[0]?.trim()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#C89B3C] font-bold">
                  {currentUser?.role_name} • Internal
                </div>
              </div>
            )}
            <button
              onClick={logout}
              title="Sign Out of CRM"
              className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Argon Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E0DBD1] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E0DBD1] text-[#141414] hover:bg-[#FAF8F5]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#77726A] hidden sm:inline">
                  THE DRK WEDDINGS
                </span>
                <span className="text-stone-300 hidden sm:inline">/</span>
                <h1 className="font-serif text-lg sm:text-xl font-medium text-[#141414]">
                  {getCurrentPageTitle()}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Global Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#FAF9F5] hover:bg-[#F5F5F0] border border-[#E0DBD1] text-xs text-[#77726A] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#141414]" />
              <span className="hidden md:inline">Search leads, bookings, invoices...</span>
              <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 bg-white border border-[#E0DBD1] rounded font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* Quick Action Launcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setQuickAddOpen(!quickAddOpen);
                  setNotifOpen(false);
                }}
                className="drk-btn-gold py-2 px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Action</span>
              </button>

              {quickAddOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E0DBD1] rounded-xl shadow-argon-lg py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#77726A] border-b border-[#E8E3DA]">
                    Studio Quick Actions
                  </div>
                  {[
                    { label: '+ Add New Lead / Enquiry', path: '/leads?action=new' },
                    { label: '+ Add Client Profile', path: '/clients?action=new' },
                    { label: '+ Create Wedding Booking', path: '/bookings?action=new' },
                    { label: '+ Create Custom Quotation', path: '/quotations?action=new' },
                    { label: '+ Generate Invoice / Receipt', path: '/invoices?action=new' },
                    { label: '+ Record Client Payment', path: '/invoices?action=payment' },
                    { label: '+ Record Studio Expense', path: '/expenses?action=new' },
                    { label: '+ Schedule Event / Shoot', path: '/calendar?action=new' },
                  ].map((act) => (
                    <button
                      key={act.label}
                      onClick={() => {
                        setQuickAddOpen(false);
                        navigate(act.path);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-[#141414] hover:bg-[#FAF8F5] hover:text-[#C89B3C] transition-colors"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Role Preview Switcher */}
            <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF9F5] border border-[#E0DBD1] rounded-lg px-2.5 py-1.5">
              <Shield className="w-3.5 h-3.5 text-[#C89B3C]" />
              <select
                value={currentUser?.role_name ?? 'Owner'}
                onChange={(e) => switchInternalRole(e.target.value as StaffRole)}
                className="bg-transparent text-xs font-semibold text-[#141414] focus:outline-none cursor-pointer"
                title="Switch internal staff role to preview Role-Based Access Control (RBAC)"
              >
                <option value="Owner">Role: Owner</option>
                <option value="Administrator">Role: Administrator</option>
                <option value="Photographer">Role: Photographer</option>
                <option value="Cinematographer">Role: Cinematographer</option>
                <option value="Video Editor">Role: Video Editor</option>
                <option value="Photo Editor">Role: Photo Editor</option>
                <option value="Album Designer">Role: Album Designer</option>
              </select>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setQuickAddOpen(false);
                }}
                className="relative p-2 rounded-lg border border-[#E0DBD1] bg-[#FAF9F5] hover:bg-white text-[#141414] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E0DBD1] rounded-xl shadow-argon-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#141414] text-white flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E6CFA0]">
                      Studio Alerts ({unreadNotifs.length} Unread)
                    </span>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-stone-300 hover:text-white inline-flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E3DA]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#77726A]">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                            navigate(n.target_path);
                          }}
                          className={`p-3.5 cursor-pointer hover:bg-[#FAF8F5] transition-colors ${
                            !n.is_read ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C89B3C]">
                              {n.type}
                            </span>
                            <span className="text-[10px] text-[#77726A]">
                              {formatDateDDMMYYYY(n.created_at)}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#141414]">{n.title}</div>
                          <div className="text-xs text-[#4A463F] mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main View Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
          <div className="w-full max-w-2xl bg-white border border-[#E0DBD1] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#E8E3DA] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#C89B3C]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by couple name, phone, booking ID (DRK-BK...), lead code, city..."
                className="flex-1 text-sm text-[#141414] focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg text-[#77726A] hover:text-[#141414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {!q ? (
                <div className="text-center py-8 text-xs text-[#77726A]">
                  <Sparkles className="w-6 h-6 text-[#C89B3C] mx-auto mb-2" />
                  Type any couple name, phone number, city, or reference code to search across all studio records.
                </div>
              ) : (
                <>
                  {matchedLeads.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#77726A] mb-2">
                        Leads & Enquiries ({matchedLeads.length})
                      </div>
                      <div className="space-y-1">
                        {matchedLeads.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/leads');
                            }}
                            className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#141414]">{l.customer_name}</span>{' '}
                              <span className="text-[#77726A]">({l.lead_code})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#C89B3C]">{l.status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedClients.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#77726A] mb-2">
                        Clients ({matchedClients.length})
                      </div>
                      <div className="space-y-1">
                        {matchedClients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/clients');
                            }}
                            className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#141414]">{c.full_name}</span>{' '}
                              <span className="text-[#77726A]">({c.client_code})</span>
                            </div>
                            <span className="text-[11px] text-[#77726A]">{c.event_location}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedBookings.length > 0 && (
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#77726A] mb-2">
                        Wedding Bookings ({matchedBookings.length})
                      </div>
                      <div className="space-y-1">
                        {matchedBookings.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate('/bookings');
                            }}
                            className="w-full text-left p-2.5 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#141414]">{b.client_name}</span>{' '}
                              <span className="text-[#77726A]">({b.booking_code})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#141414]">
                              {canViewFinancials ? formatINR(b.total_amount) : b.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchedQuotations.length === 0 &&
                    matchedLeads.length === 0 &&
                    matchedClients.length === 0 &&
                    matchedBookings.length === 0 &&
                    matchedInvoices.length === 0 && (
                      <div className="text-center py-8 text-xs text-[#77726A]">
                        No matching studio records found for "{searchQuery}".
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
