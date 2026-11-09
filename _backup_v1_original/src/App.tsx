import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/providers/AuthContext';
import { DataProvider } from './app/providers/DataContext';
import { AppLayout } from './app/layouts/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LeadsPage } from './features/leads/LeadsPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { BookingsPage } from './features/bookings/BookingsPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { QuotationsPage } from './features/quotations/QuotationsPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { ExpensesPage } from './features/expenses/ExpensesPage';
import { TeamPage } from './features/team/TeamPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { DeliverablesPage } from './features/deliverables/DeliverablesPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { CommunicationPage } from './features/communication/CommunicationPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import type { CRMModule } from './types/crm';

const ModuleGuard: React.FC<{ module: CRMModule; children: React.ReactNode }> = ({
  module,
  children,
}) => {
  const { hasModuleAccess, currentUser } = useAuth();
  if (!hasModuleAccess(module)) {
    return (
      <div className="argon-card mx-auto mt-12 max-w-lg p-8 text-center">
        <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-700">
          Role Permission Restricted
        </span>
        <h2 className="mt-3 font-serif text-xl font-bold text-obsidian-900">
          Module Restricted for {currentUser?.role_name}
        </h2>
        <p className="mt-2 text-xs text-obsidian-500">
          Your internal staff role ({currentUser?.role_name}) does not have view permissions for the{' '}
          <strong className="capitalize">{module}</strong> module. Switch to <strong>Owner</strong>{' '}
          or <strong>Administrator</strong> in the top header to access all financial and
          administrative modules.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

const CRMRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route
          index
          element={
            <ModuleGuard module="dashboard">
              <DashboardPage />
            </ModuleGuard>
          }
        />
        <Route
          path="leads"
          element={
            <ModuleGuard module="leads">
              <LeadsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="clients"
          element={
            <ModuleGuard module="clients">
              <ClientsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="bookings"
          element={
            <ModuleGuard module="bookings">
              <BookingsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="calendar"
          element={
            <ModuleGuard module="calendar">
              <CalendarPage />
            </ModuleGuard>
          }
        />
        <Route
          path="quotations"
          element={
            <ModuleGuard module="quotations">
              <QuotationsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="invoices"
          element={
            <ModuleGuard module="invoices">
              <InvoicesPage />
            </ModuleGuard>
          }
        />
        <Route
          path="expenses"
          element={
            <ModuleGuard module="expenses">
              <ExpensesPage />
            </ModuleGuard>
          }
        />
        <Route
          path="team"
          element={
            <ModuleGuard module="team">
              <TeamPage />
            </ModuleGuard>
          }
        />
        <Route
          path="projects"
          element={
            <ModuleGuard module="projects">
              <ProjectsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="deliverables"
          element={
            <ModuleGuard module="deliverables">
              <DeliverablesPage />
            </ModuleGuard>
          }
        />
        <Route
          path="documents"
          element={
            <ModuleGuard module="documents">
              <DocumentsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="communication"
          element={
            <ModuleGuard module="communication">
              <CommunicationPage />
            </ModuleGuard>
          }
        />
        <Route
          path="reports"
          element={
            <ModuleGuard module="reports">
              <ReportsPage />
            </ModuleGuard>
          }
        />
        <Route
          path="settings"
          element={
            <ModuleGuard module="settings">
              <SettingsPage />
            </ModuleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <CRMRouter />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
