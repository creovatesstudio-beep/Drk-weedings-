// ============================================================================
// THE DRK WEDDINGS — INTERNAL OWNER & STAFF LOGIN PAGE
// Strictly Private Business Management System (Zero Client Portal / Login)
// ============================================================================

import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Sparkles, Camera, Film, AlertCircle } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthContext';
import type { StaffRole } from '../../types/crm';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('thedrkweddings@gmail.com');
  const [password, setPassword] = useState('drk@owner2026');
  const [roleOverride, setRoleOverride] = useState<StaffRole>('Owner');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password, roleOverride);
    if (!res.ok) {
      setError(res.error || 'Authentication failed');
    }
  };

  const quickFill = (staffEmail: string, staffPass: string, role: StaffRole) => {
    setEmail(staffEmail);
    setPassword(staffPass);
    setRoleOverride(role);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0807] text-white flex flex-col lg:flex-row select-none">
      {/* Left Editorial Brand Showcase */}
      <div className="lg:w-7/12 relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(200, 155, 60, 0.28), transparent 65%), linear-gradient(135deg, #0A0807 0%, #1c1917 100%)`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/assets/logos/drk-logo-clean-white.png"
              alt="The DRK Weddings"
              className="h-9 sm:h-11 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#E6CFA0] block">
                Est. 2017 • Hazaribagh & Worldwide
              </span>
              <span className="font-serif text-lg tracking-tight text-white">
                THE DRK WEDDINGS
              </span>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C89B3C]/40 bg-[#C89B3C]/10 text-[#E6CFA0] text-[10px] font-bold uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3.5 h-3.5" /> Internal Studio Command
          </span>
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-[#C89B3C]" />
            <span className="text-[11px] font-light tracking-[0.28em] uppercase text-[#E6CFA0]">
              Private Business Management CRM
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl leading-[0.98] tracking-tight text-white mb-6">
            Where Editorial Craft Meets{' '}
            <span className="italic font-normal text-[#E6CFA0]">Studio Precision.</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed mb-8">
            Centralized command center for leads, wedding bookings, multi-ceremony shoot schedules,
            bespoke quotations, milestone payments, parallel post-production workflows, and studio profitability.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-[#E6CFA0] block">500+</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Love Stories
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-white block">45+</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Palaces & Cities
              </span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-white block">100%</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Owner Controlled
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-stone-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#C89B3C]" /> Fine-Art Photography
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#C89B3C]" /> Wedding Cinema
            </span>
          </div>
          <span className="uppercase tracking-[0.2em] text-[10px] text-stone-500">
            Strictly Internal • No Client Login Permitted
          </span>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="lg:w-5/12 bg-[#F5F5F0] text-[#141414] flex flex-col justify-center p-8 sm:p-12 lg:p-16">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#77726A] block mb-2">
              Authorized Personnel Only
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#141414] mb-2">
              Sign In to Studio OS
            </h2>
            <p className="text-xs sm:text-sm text-[#4A463F]">
              Enter your internal staff credentials to access THE DRK WEDDINGS business suite.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 sm:p-8 rounded-xl border border-[#E0DBD1] shadow-argon">
            <div>
              <label className="drk-label">Internal Staff Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="drk-input"
                placeholder="thedrkweddings@gmail.com"
              />
            </div>

            <div>
              <label className="drk-label">Security Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="drk-input"
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="drk-label">Internal Role Session</label>
              <select
                value={roleOverride}
                onChange={(e) => setRoleOverride(e.target.value as StaffRole)}
                className="drk-select"
              >
                <option value="Owner">Owner (Full Financial & Studio Command)</option>
                <option value="Administrator">Administrator (Operations & Bookings)</option>
                <option value="Photographer">Photographer (Assigned Shoots & Tasks)</option>
                <option value="Cinematographer">Cinematographer (Assigned Films & Shoots)</option>
                <option value="Video Editor">Video Editor (Post-Production & Deliverables)</option>
                <option value="Photo Editor">Photo Editor (Culling & Retouching)</option>
                <option value="Album Designer">Album Designer (Canvera Album Layouts)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full drk-btn-primary py-3.5 justify-center"
            >
              <Lock className="w-4 h-4 text-[#E6CFA0]" />
              <span>{isLoading ? 'Authenticating...' : 'Enter Private Studio CRM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Role Switcher Presets */}
          <div className="mt-6 p-4 rounded-xl bg-white/80 border border-[#E0DBD1]">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#77726A] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Quick Staff Account Autofill
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFill('thedrkweddings@gmail.com', 'drk@owner2026', 'Owner')}
                className="text-left p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414] bg-[#FAF9F5] transition-colors"
              >
                <div className="text-xs font-bold text-[#141414]">Deepak Raj</div>
                <div className="text-[10px] text-[#77726A]">Owner (Full Access)</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('studio@thedrkweddings.com', 'drk@admin2026', 'Administrator')}
                className="text-left p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414] bg-[#FAF9F5] transition-colors"
              >
                <div className="text-xs font-bold text-[#141414]">Ananya Verma</div>
                <div className="text-[10px] text-[#77726A]">Administrator</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('aarav.photo@thedrkweddings.com', 'drk@staff2026', 'Photographer')}
                className="text-left p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414] bg-[#FAF9F5] transition-colors"
              >
                <div className="text-xs font-bold text-[#141414]">Aarav Sinha</div>
                <div className="text-[10px] text-[#77726A]">Photographer</div>
              </button>
              <button
                type="button"
                onClick={() => quickFill('karan.edits@thedrkweddings.com', 'drk@staff2026', 'Video Editor')}
                className="text-left p-2 rounded-lg border border-[#E0DBD1] hover:border-[#141414] bg-[#FAF9F5] transition-colors"
              >
                <div className="text-xs font-bold text-[#141414]">Karanveer Mahto</div>
                <div className="text-[10px] text-[#77726A]">Video Editor</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
