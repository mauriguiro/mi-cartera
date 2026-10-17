'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFinance } from '@/contexts/FinanceContext';
import { Eye, EyeOff, User, Lock, Mail, UserCheck, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

type AuthMode = 'login' | 'register' | 'recover';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading, login, register, verifyEmailForReset, resetPasswordByEmail } =
    useFinance();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Recover / Verify by Email fields
  const [recoverEmail, setRecoverEmail] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [recoveredUsername, setRecoveredUsername] = useState('');
  const [recoveredFullName, setRecoveredFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  if (authLoading) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-900 border border-gray-700 shadow-lg mb-3 animate-pulse">
          <Image src="/icon.png" alt="MiCartera Icon" width={56} height={56} className="object-cover" priority />
        </div>
        <p className="text-gray-400 text-sm font-semibold">Cargando MiCartera...</p>
      </div>
    );
  }

  if (currentUser) {
    return <>{children}</>;
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setVerifiedUserId(null);
    setRecoveredUsername('');
    setRecoveredFullName('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(loginUser, loginPassword);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo iniciar sesión.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Completá todos los campos.');
      return;
    }

    if (password.length <= 5) {
      setError('La contraseña debe tener más de 5 caracteres (mínimo 6).');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      setError('La contraseña solo puede contener letras y números.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const res = await register({
      fullName,
      username,
      email,
      password,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Error al registrar usuario.');
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    const res = await verifyEmailForReset(recoverEmail);
    setSubmitting(false);

    if (!res.ok || !res.userId) {
      setError(res.error || 'No se pudo verificar el correo.');
      return;
    }

    setVerifiedUserId(res.userId);
    setRecoveredUsername(res.username || res.userId);
    setRecoveredFullName(res.fullName || '');
    setSuccessMsg('Cuenta encontrada y verificada por correo.');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!verifiedUserId) return;

    if (newPassword.length <= 5) {
      setError('La contraseña debe tener más de 5 caracteres (mínimo 6).');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
      setError('La contraseña solo puede contener letras y números.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const res = await resetPasswordByEmail(verifiedUserId, newPassword);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo cambiar la contraseña.');
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-gray-950 min-h-screen flex flex-col justify-center p-5">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800/80 px-6 py-6 border-b border-gray-800 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-950 border border-gray-700 shadow-md mb-3">
            <Image src="/icon.png" alt="MiCartera Icon" width={56} height={56} className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">MiCartera</h1>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login' && 'Ingresá con tu usuario y contraseña'}
            {mode === 'register' && 'Creá tu cuenta personal única'}
            {mode === 'recover' && 'Recuperar usuario o contraseña por correo'}
          </p>
        </div>

        {/* Mode Tabs (Login / Register) */}
        {mode !== 'recover' && (
          <div className="grid grid-cols-2 bg-gray-950/60 p-1.5 m-4 mb-0 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={clsx(
                'py-2 text-xs font-bold rounded-lg transition-all',
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={clsx(
                'py-2 text-xs font-bold rounded-lg transition-all',
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/70 flex items-start gap-2 text-red-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/70 flex items-start gap-2 text-emerald-300 text-xs">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Nombre de usuario o correo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Usuario"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresá tu contraseña"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 p-0.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50 text-sm mt-2"
              >
                {submitting ? 'Ingresando...' : 'Ingresar a MiCartera'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('recover')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  ¿Olvidaste tu usuario o contraseña? Recuperar por correo
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Nombre y Apellido
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Nombre de usuario (único e irrepetible)
                </label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Usuario"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Contraseña <span className="text-gray-500 font-normal">(más de 5 caracteres, letras y números)</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 p-0.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Repetir contraseña
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repetí tu contraseña"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50 text-sm mt-2"
              >
                {submitting ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          {/* RECOVER USERNAME & PASSWORD BY EMAIL FORM */}
          {mode === 'recover' && (
            <div>
              {!verifiedUserId ? (
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ingresá el correo electrónico con el que te registraste para recuperar tu <strong>nombre de usuario</strong> y/o cambiar tu <strong>contraseña</strong>.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Correo electrónico registrado
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="email"
                        placeholder="tu@correo.com"
                        autoCapitalize="none"
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Buscando cuenta...' : 'Recuperar por Correo'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Recovered Username Box */}
                  <div className="p-4 rounded-xl bg-gray-800 border border-emerald-700/60 text-center">
                    {recoveredFullName && (
                      <p className="text-xs text-gray-400 mb-1">Titular: <strong className="text-gray-200">{recoveredFullName}</strong></p>
                    )}
                    <p className="text-xs text-gray-400">Tu nombre de usuario es:</p>
                    <p className="text-xl font-black text-emerald-400 mt-1 tracking-wide">{recoveredUsername}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginUser(recoveredUsername);
                        switchMode('login');
                      }}
                      className="mt-3 w-full py-2 px-3 rounded-lg bg-emerald-950/80 border border-emerald-700/70 text-emerald-300 text-xs font-bold hover:bg-emerald-900/60 transition-colors"
                    >
                      Usar usuario &ldquo;{recoveredUsername}&rdquo; para iniciar sesión
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-800"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase font-bold">
                      O cambiá tu contraseña
                    </span>
                    <div className="flex-grow border-t border-gray-800"></div>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Nueva contraseña <span className="text-gray-500 font-normal">(más de 5 caracteres, letras y números)</span>
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 p-0.5"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Repetir nueva contraseña
                      </label>
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-3 top-3 text-gray-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Repetí la nueva contraseña"
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 p-0.5"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-md disabled:opacity-50 text-sm"
                    >
                      {submitting ? 'Guardando...' : 'Guardar Nueva Contraseña y Entrar'}
                    </button>
                  </form>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-gray-400 hover:text-white font-medium"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
