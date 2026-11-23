import React, { useState } from 'react';
import { useApp, DEMO_USERS } from '../../context/AppContext';
import { UserRole, UserProfile } from '../../types';
import {
  Building2,
  Wrench,
  User,
  ArrowRight,
  ArrowLeft,
  Mail,
  KeyRound,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { AquaSentinelLogo } from '../common/AquaSentinelLogo';

interface RoleOption {
  role: UserRole;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultEmail: string;
}

export const LoginPage: React.FC = () => {
  const {
    login,
    supabaseConfigured,
    supabaseUrl,
    setSupabaseCredentials,
    signInWithSupabaseAuth,
    signUpWithSupabaseAuth,
    buildings,
  } = useApp();

  // Wizard state: Step 1 = Role selection, Step 2 = Authentication form
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  // Success transition animation state
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);
  const [successProfile, setSuccessProfile] = useState<UserProfile | null>(null);

  // Auth mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [assignedBuildingId, setAssignedBuildingId] = useState('BLD-102');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Supabase Settings Drawer
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(supabaseUrl || '');
  const [customKey, setCustomKey] = useState('');

  const roles: RoleOption[] = [
    {
      role: 'admin',
      title: 'Facility Admin',
      icon: Building2,
      defaultEmail: 'faizul@um.edu.my',
    },
    {
      role: 'technician',
      title: 'Repair Worker',
      icon: Wrench,
      defaultEmail: 'ahmad.faiz@um.edu.my',
    },
    {
      role: 'resident',
      title: 'Resident',
      icon: User,
      defaultEmail: 'aisyah@siswa.um.edu.my',
    },
  ];

  const currentRoleInfo = roles.find((r) => r.role === selectedRole) || roles[0];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const handleContinueToLogin = () => {
    const rInfo = roles.find((r) => r.role === selectedRole);
    if (rInfo && !email) {
      setEmail(rInfo.defaultEmail);
    }
    setStep(2);
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const handleBackToRoles = () => {
    setStep(1);
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const triggerSuccessLogin = (profile: UserProfile) => {
    setSuccessProfile(profile);
    setIsSuccessAnimating(true);
    setTimeout(() => {
      login(profile.role, profile);
    }, 1300);
  };

  const handleQuickDemoSignIn = () => {
    const base = DEMO_USERS[selectedRole];
    triggerSuccessLogin(base);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseCredentials(customUrl, customKey);
    setShowSupabaseSettings(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    // If Supabase is not configured yet, fallback gracefully to a simulated operational session with success animation
    if (!supabaseConfigured) {
      const fallbackUser: UserProfile = {
        ...DEMO_USERS[selectedRole],
        email,
        name: fullName || (authMode === 'signup' ? email.split('@')[0] : currentRoleInfo.title),
        role: selectedRole,
        assignedBuildingId: selectedRole === 'resident' ? assignedBuildingId : undefined,
      };
      triggerSuccessLogin(fallbackUser);
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        const result = await signInWithSupabaseAuth(email, password);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to sign in via Supabase.');
        } else {
          const profile: UserProfile = {
            ...DEMO_USERS[selectedRole],
            email,
            name: email.split('@')[0],
            role: selectedRole,
          };
          triggerSuccessLogin(profile);
        }
      } else {
        const result = await signUpWithSupabaseAuth(
          email,
          password,
          selectedRole,
          fullName,
          selectedRole === 'resident' ? assignedBuildingId : undefined
        );
        if (!result.success) {
          setErrorMessage(result.error || 'Registration failed.');
        } else if (result.confirmationRequired) {
          setSuccessNotice('Account registered! A verification link has been sent to your email.');
        } else {
          const profile: UserProfile = {
            ...DEMO_USERS[selectedRole],
            email,
            name: fullName,
            role: selectedRole,
            assignedBuildingId: selectedRole === 'resident' ? assignedBuildingId : undefined,
          };
          triggerSuccessLogin(profile);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <AquaSentinelLogo size="md" showText={false} />
            <div>
              <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">
                Aqua Sentinel
              </h1>
            </div>
          </div>

          {/* Supabase Connection Status Pill */}
          <button
            type="button"
            onClick={() => setShowSupabaseSettings(!showSupabaseSettings)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              supabaseConfigured
                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
            }`}
            title="Configure or inspect Supabase connection"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                supabaseConfigured ? 'bg-[#10B981]' : 'bg-[#D97706]'
              }`}
            />
            <Database className="w-3 h-3" />
            <span>{supabaseConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
          </button>
        </div>

        {/* Supabase Configuration Drawer */}
        {showSupabaseSettings && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-semibold text-[#0F172A]">
                  Supabase Project Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseSettings(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] text-[#64748B]">
              Connect your live Supabase project to enable persistent Auth, user session management, and role metadata.
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#475569] mb-0.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#475569] mb-0.5">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#64748B]">
                  Or in <code className="bg-[#F1F5F9] px-1 py-0.5 rounded">.env</code> as <code className="bg-[#F1F5F9] px-1 py-0.5 rounded">VITE_SUPABASE_URL</code>
                </span>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded text-xs font-medium cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUCCESS LOGIN SCREEN */}
        {isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 space-y-5 shadow-2xs text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#059669]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Authentication Successful
              </h3>
              <p className="text-xs text-[#64748B]">
                Welcome, <span className="font-semibold text-[#0F172A]">{successProfile?.name}</span>
              </p>
              <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium">
                {successProfile?.roleTitle}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#059669] animate-pulse rounded-full" style={{ width: '85%' }} />
              </div>
              <p className="text-[10px] text-[#64748B] font-mono">
                Launching telemetry workspace...
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE ROLE */}
        {step === 1 && !isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 space-y-4 shadow-2xs">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Select user role
              </h2>
            </div>

            {/* 3 Streamlined Role Cards */}
            <div className="space-y-2.5">
              {roles.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;

                return (
                  <div
                    key={item.role}
                    onClick={() => handleRoleSelect(item.role)}
                    className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#EFF6FF] shadow-2xs'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-semibold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                        {item.title}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#2563EB] bg-[#2563EB]'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleContinueToLogin}
                className="flex-1 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Continue as {currentRoleInfo.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="py-2 px-3.5 bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] rounded text-xs font-medium border border-[#CBD5E1] transition-colors cursor-pointer shadow-2xs"
                title="Instant preview"
              >
                Instant Preview
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOG IN / CREATE ACCOUNT WITH SUPABASE */}
        {step === 2 && !isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 space-y-4 shadow-2xs">
            {/* Top Navigation & Selected Role Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <button
                type="button"
                onClick={handleBackToRoles}
                className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <currentRoleInfo.icon className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#0F172A]">
                  {currentRoleInfo.title}
                </span>
              </div>
            </div>

            {/* Auth Mode Toggle (Sign In vs Register) */}
            <div className="flex rounded-md bg-[#F1F5F9] p-0.5 border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successNotice && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] rounded text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{successNotice}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Faizul Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    placeholder={currentRoleInfo.defaultEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                  />
                </div>
              )}

              {authMode === 'signup' && selectedRole === 'resident' && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">
                    Assigned Residence / Hostel
                  </label>
                  <select
                    value={assignedBuildingId}
                    onChange={(e) => setAssignedBuildingId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded focus:outline-none focus:border-[#2563EB] text-[#0F172A] cursor-pointer"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#93C5FD]" />
                      <span>
                        {authMode === 'signin'
                          ? `Sign In as ${currentRoleInfo.title}`
                          : `Register ${currentRoleInfo.title} Account`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
            {/* Instant Preview */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-center">
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer flex items-center gap-1.5"
              >
                <span>Instant Demo Access →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
