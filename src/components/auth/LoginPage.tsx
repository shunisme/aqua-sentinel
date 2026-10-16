import React, { useState } from 'react';
import { useApp, DEMO_USERS } from '../../context/AppContext';
import { UserRole, UserProfile } from '../../types';
import {
  Droplet,
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
  Sparkles,
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
    <div className="min-h-screen bg-[#F9F9F8] text-[#1A2430] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E1]">
          <div className="flex items-center gap-3">
            <AquaSentinelLogo size="md" showText={false} />
            <div>
              <h1 className="text-xl font-editorial font-bold text-[#1A2430] tracking-tight">
                Aqua Sentinel
              </h1>
            </div>
          </div>

          {/* Supabase Connection Status Pill */}
          <button
            type="button"
            onClick={() => setShowSupabaseSettings(!showSupabaseSettings)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
              supabaseConfigured
                ? 'bg-[#EBF5EE] text-[#2E6F56] border-[#CCE6D5] hover:bg-[#DDF0E3]'
                : 'bg-[#F2ECE1] text-[#8C6B2D] border-[#E0D3BE] hover:bg-[#E9DFCE]'
            }`}
            title="Configure or inspect Supabase connection"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                supabaseConfigured ? 'bg-[#2E6F56] animate-pulse' : 'bg-[#B27B2A]'
              }`}
            />
            <Database className="w-3 h-3" />
            <span>{supabaseConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
          </button>
        </div>

        {/* Supabase Configuration Drawer */}
        {showSupabaseSettings && (
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-4 space-y-3 shadow-sm animate-pop-in">
            <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2C5B83]" />
                <h3 className="text-xs font-semibold text-[#1A2430]">
                  Supabase Project Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseSettings(false)}
                className="text-xs text-[#707972] hover:text-[#1A2430] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] text-[#707972]">
              Connect your live Supabase project to enable persistent Auth, user session management, and role metadata.
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#4A5568] mb-0.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded focus:outline-none focus:border-[#2C5B83]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4A5568] mb-0.5">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded focus:outline-none focus:border-[#2C5B83]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#707972]">
                  Or in <code className="bg-[#F0EFEA] px-1 py-0.5 rounded">.env</code> as <code className="bg-[#F0EFEA] px-1 py-0.5 rounded">VITE_SUPABASE_URL</code>
                </span>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1A2838] hover:bg-[#2A3C50] text-white rounded text-xs font-medium cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUCCESS LOGIN ANIMATION SCREEN */}
        {isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-8 space-y-6 shadow-sm animate-pop-in text-center">
            <div className="relative flex items-center justify-center py-2">
              <div className="w-20 h-20 rounded-full bg-[#EBF5EE] border-2 border-[#2E6F56] flex items-center justify-center animate-success-pop shadow-md z-10">
                <CheckCircle2 className="w-10 h-10 text-[#2E6F56]" />
              </div>
              <div className="absolute w-20 h-20 rounded-full border-2 border-[#2E6F56]/40 animate-ripple-ring pointer-events-none" />
              <div
                className="absolute w-20 h-20 rounded-full border-2 border-[#2E6F56]/20 animate-ripple-ring pointer-events-none"
                style={{ animationDelay: '0.45s' }}
              />
            </div>

            <div className="space-y-1.5 animate-fade-slide-up">
              <h3 className="text-xl font-editorial font-bold text-[#1A2430]">
                Logged In Successfully
              </h3>
              <p className="text-xs text-[#707972]">
                Welcome, <span className="font-semibold text-[#1A2430]">{successProfile?.name}</span>
              </p>
              <span className="inline-block mt-1 text-[11px] px-3 py-0.5 rounded-full bg-[#F4F8FA] text-[#2C5B83] border border-[#D2E0EC] font-medium">
                {successProfile?.roleTitle}
              </span>
            </div>

            <div className="space-y-1 pt-2">
              <div className="w-full bg-[#F0EFEA] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-[#2E6F56] animate-launch-progress rounded-full" />
              </div>
              <p className="text-[10px] text-[#707972] font-mono">
                Launching workspace environment...
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE ROLE */}
        {step === 1 && !isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-6 space-y-4 shadow-sm animate-pop-in">
            <div>
              <h2 className="text-base font-editorial font-bold text-[#1A2430]">
                Choose your role
              </h2>
            </div>

            {/* 3 Streamlined Role Cards without Details */}
            <div className="space-y-2.5">
              {roles.map((item, index) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;

                return (
                  <div
                    key={item.role}
                    onClick={() => handleRoleSelect(item.role)}
                    className={`animate-pop-child-${index + 1} p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#2C5B83] bg-[#F4F8FA] shadow-xs ring-1 ring-[#2C5B83]/20'
                        : 'border-[#E8E6E1] bg-white hover:bg-[#FAF9F7]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-[#1A2838] text-white border-[#1A2838]'
                            : 'bg-[#F2ECE1] text-[#707972] border-[#E8E6E1]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-[#1A2430]">
                        {item.title}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#2C5B83] bg-[#2C5B83]'
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
                className="flex-1 py-2.5 bg-[#1A2838] hover:bg-[#2A3C50] text-white rounded-md text-xs font-semibold border border-[#1A2838] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
              >
                <span>Continue as {currentRoleInfo.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="py-2.5 px-4 bg-[#FAF9F7] hover:bg-[#F2ECE1] text-[#4A5568] hover:text-[#1A2430] rounded-md text-xs font-medium border border-[#E2DFD8] transition-colors cursor-pointer"
                title="Instant preview"
              >
                Instant Preview
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOG IN / CREATE ACCOUNT WITH SUPABASE */}
        {step === 2 && !isSuccessAnimating && (
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-6 space-y-5 shadow-sm animate-pop-in">
            {/* Top Navigation & Selected Role Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
              <button
                type="button"
                onClick={handleBackToRoles}
                className="flex items-center gap-1.5 text-xs text-[#707972] hover:text-[#1A2430] font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FAF9F7] border border-[#E8E6E1]">
                <currentRoleInfo.icon className="w-3.5 h-3.5 text-[#2C5B83]" />
                <span className="text-xs font-semibold text-[#1A2430]">
                  {currentRoleInfo.title}
                </span>
              </div>
            </div>

            {/* Auth Mode Toggle (Sign In vs Register) */}
            <div className="flex rounded-md bg-[#F2ECE1] p-1 border border-[#E8E6E1]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-[#1A2430] shadow-xs'
                    : 'text-[#707972] hover:text-[#1A2430]'
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
                    ? 'bg-white text-[#1A2430] shadow-xs'
                    : 'text-[#707972] hover:text-[#1A2430]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] text-[#B2463F] rounded-md text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successNotice && (
              <div className="p-3 bg-[#EBF5EE] border border-[#CCE6D5] text-[#2E6F56] rounded-md text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{successNotice}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#4A5568] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Faizul Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded-md focus:outline-none focus:border-[#2C5B83] text-[#1A2430]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707972]" />
                  <input
                    type="email"
                    required
                    placeholder={currentRoleInfo.defaultEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded-md focus:outline-none focus:border-[#2C5B83] text-[#1A2430]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707972]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded-md focus:outline-none focus:border-[#2C5B83] text-[#1A2430]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707972] hover:text-[#1A2430] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#4A5568] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded-md focus:outline-none focus:border-[#2C5B83] text-[#1A2430]"
                  />
                </div>
              )}

              {authMode === 'signup' && selectedRole === 'resident' && (
                <div>
                  <label className="block text-xs font-medium text-[#4A5568] mb-1">
                    Assigned Residence / Hostel
                  </label>
                  <select
                    value={assignedBuildingId}
                    onChange={(e) => setAssignedBuildingId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F7] border border-[#E2DFD8] rounded-md focus:outline-none focus:border-[#2C5B83] text-[#1A2430]"
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
                  className="w-full py-2.5 bg-[#1A2838] hover:bg-[#2A3C50] text-white rounded-md text-xs font-semibold border border-[#1A2838] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#89B3D9]" />
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
            <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-center">
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                className="text-xs text-[#2C5B83] hover:underline font-medium cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B27B2A]" />
                <span>Instant Preview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
