'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
   getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { db, emailAuth } from '@/lib/firebase';
import { Debt, Receivable, Payment, PortfolioItem, UserProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface FinanceContextType {
  currentUser: UserProfile | null;
  authLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  sendRecoveryVerificationEmail: (
    email: string
  ) => Promise<{ ok: boolean; email?: string; error?: string }>;
  verifyRecoveryEmailLink: (
    linkOrUrl: string,
    fallbackEmail?: string
  ) => Promise<{ ok: boolean; userId?: string; username?: string; fullName?: string; email?: string; error?: string }>;
  resetPasswordByEmail: (
    userId: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  debts: Debt[];
  receivables: Receivable[];
  portfolio: PortfolioItem[];
  totalDebt: number;
  totalReceivables: number;
  totalPortfolio: number;
  netBalance: number;
  addDebt: (
    debt: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'remainingAmount' | 'isPaid' | 'orderIndex'>
  ) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  toggleDebtPaid: (id: string, paid: boolean) => void;
  payDebt: (id: string, amount: number) => void;
  deleteDebt: (id: string) => void;
  reorderDebts: (sourceIndex: number, destinationIndex: number, list: Debt[]) => void;
  addReceivable: (receivable: Omit<Receivable, 'id' | 'createdAt' | 'isPaid' | 'orderIndex'>) => void;
  updateReceivable: (id: string, updates: Partial<Receivable>) => void;
  markReceivableAsPaid: (id: string, paid: boolean) => void;
  deleteReceivable: (id: string) => void;
  reorderReceivables: (sourceIndex: number, destinationIndex: number, list: Receivable[]) => void;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'orderIndex'>) => void;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => void;
  deletePortfolioItem: (id: string) => void;
  reorderPortfolio: (sourceIndex: number, destinationIndex: number, list: PortfolioItem[]) => void;
}

const STORAGE_USER_KEY = 'micartera_auth_user';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [allDebts, setAllDebts] = useState<Debt[]>([]);
  const [allReceivables, setAllReceivables] = useState<Receivable[]>([]);
  const [allPortfolio, setAllPortfolio] = useState<PortfolioItem[]>([]);

  // Ensure default user 'mauri' exists and restore saved session
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(STORAGE_USER_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as UserProfile;
            if (parsed && parsed.username) {
              setCurrentUser(parsed);
            }
          }
        }

        // Ensure default account 'mauri' exists in Firestore
        const mauriRef = doc(db, 'users', 'mauri');
        const mauriSnap = await getDoc(mauriRef);
        if (!mauriSnap.exists()) {
          await setDoc(mauriRef, {
            id: 'mauri',
            fullName: 'Mauricio Guirotane',
            username: 'mauri',
            email: 'mguirotane@gmail.com',
            password: 'aaa111',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error inicializando usuario:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkMonthlyReset = (currentDebts: Debt[], activeUsername: string) => {
    if (typeof window === 'undefined' || !activeUsername) return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const storageKey = `last_reset_month_${activeUsername}`;
    const lastReset = localStorage.getItem(storageKey);

    if (lastReset !== currentMonthKey && currentDebts.length > 0) {
      let changed = false;
      const batch = writeBatch(db);

      currentDebts.forEach((debt) => {
        if (debt.isFixed && debt.isPaid) {
          batch.update(doc(db, 'debts', debt.id), {
            isPaid: false,
            remainingAmount: debt.originalAmount,
          });
          changed = true;
        }
      });

      if (changed) {
        batch.commit().then(() => {
          localStorage.setItem(storageKey, currentMonthKey);
        });
      } else {
        localStorage.setItem(storageKey, currentMonthKey);
      }
    }
  };

  useEffect(() => {
    const unsubDebts = onSnapshot(
      collection(db, 'debts'),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const raw = { id: docSnap.id, ...docSnap.data() } as Debt;
          const payments = Array.isArray(raw.payments) ? raw.payments : [];
          const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

          const originalAmount = Number(raw.originalAmount) || 0;
          let remainingAmount =
            raw.remainingAmount !== undefined ? Number(raw.remainingAmount) : originalAmount;
          let isPaid = raw.isPaid ?? false;

          if (raw.isFixed) {
            remainingAmount = isPaid ? 0 : originalAmount;
          } else {
            if (payments.length === 0 && !isPaid) {
              remainingAmount = originalAmount;
            } else {
              remainingAmount = Math.max(0, originalAmount - totalPaid);
            }
            isPaid = remainingAmount === 0;
          }

          return {
            ...raw,
            originalAmount,
            remainingAmount,
            payments,
            isPaid,
          };
        });

        data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setAllDebts(data);
      },
      (error) => {
        console.error('Error cargando deudas de Firestore:', error);
      }
    );

    const unsubReceivables = onSnapshot(
      collection(db, 'receivables'),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const raw = { id: docSnap.id, ...docSnap.data() } as Receivable;
          return {
            ...raw,
            amount: Number(raw.amount) || 0,
            isPaid: raw.isPaid ?? false,
          };
        });
        data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setAllReceivables(data);
      },
      (error) => {
        console.error('Error cargando cobros de Firestore:', error);
      }
    );

    const unsubPortfolio = onSnapshot(
      collection(db, 'portfolio'),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const raw = { id: docSnap.id, ...docSnap.data() } as PortfolioItem;
          return {
            ...raw,
            amount: Number(raw.amount) || 0,
            notes: raw.notes || '',
            category: raw.category || 'efectivo',
          };
        });
        data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setAllPortfolio(data);
      },
      (error) => {
        console.error('Error cargando cartera de Firestore:', error);
      }
    );

    return () => {
      unsubDebts();
      unsubReceivables();
      unsubPortfolio();
    };
  }, []);

  // Filter records belonging to currentUser ('mauri' also owns legacy records without userId)
  const belongsToCurrentUser = (recordUserId?: string) => {
    if (!currentUser) return false;
    const uname = currentUser.username.toLowerCase();
    if (uname === 'mauri') {
      return !recordUserId || recordUserId.toLowerCase() === 'mauri';
    }
    return recordUserId?.toLowerCase() === uname;
  };

  const debts = allDebts.filter((d) => belongsToCurrentUser(d.userId));
  const receivables = allReceivables.filter((r) => belongsToCurrentUser(r.userId));
  const portfolio = allPortfolio.filter((p) => belongsToCurrentUser(p.userId));

  useEffect(() => {
    if (currentUser && debts.length > 0) {
      checkMonthlyReset(debts, currentUser.username);
    }
  }, [currentUser, debts.length]);

  const totalDebt = debts
    .filter((d) => !d.isPaid)
    .reduce((sum, d) => {
      if (d.isFixed) {
        return sum + (d.originalAmount || 0);
      }
      return sum + (d.remainingAmount !== undefined ? d.remainingAmount : d.originalAmount || 0);
    }, 0);

  const totalReceivables = receivables
    .filter((r) => !r.isPaid)
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPortfolio = portfolio.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netBalance = totalReceivables - totalDebt;

  // Auth Methods
  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cleanInput = usernameOrEmail.trim().toLowerCase().replace(',', '.');
      const snap = await getDocs(collection(db, 'users'));
      let matchedUser: UserProfile | null = null;

      snap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        const uname = (u.username || docSnap.id).toLowerCase();
        const uemail = (u.email || '').toLowerCase().replace(',', '.');
        if (uname === cleanInput || uemail === cleanInput) {
          matchedUser = { ...u, id: docSnap.id, username: uname };
        }
      });

      if (!matchedUser) {
        return { ok: false, error: 'El usuario o correo ingresado no existe.' };
      }

      if ((matchedUser as UserProfile).password !== password) {
        return { ok: false, error: 'Contraseña incorrecta.' };
      }

      const safeUser: UserProfile = {
        id: (matchedUser as UserProfile).id,
        fullName: (matchedUser as UserProfile).fullName,
        username: (matchedUser as UserProfile).username,
        email: (matchedUser as UserProfile).email,
        createdAt: (matchedUser as UserProfile).createdAt,
      };

      setCurrentUser(safeUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));
      }
      return { ok: true };
    } catch (err) {
      console.error('Error en login:', err);
      return { ok: false, error: 'Error al conectar con la base de datos.' };
    }
  };

  const register = async (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cleanUsername = data.username.trim().toLowerCase();
      const cleanEmail = data.email.trim().toLowerCase().replace(',', '.');
      const cleanName = data.fullName.trim();

      if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
        return {
          ok: false,
          error: 'El nombre de usuario solo puede contener letras, números, puntos o guiones sin espacios.',
        };
      }

      if (data.password.length <= 5) {
        return {
          ok: false,
          error: 'La contraseña debe tener más de 5 caracteres (mínimo 6).',
        };
      }

      if (!/^[a-zA-Z0-9]+$/.test(data.password)) {
        return {
          ok: false,
          error: 'La contraseña debe contener solo letras y números.',
        };
      }

      const snap = await getDocs(collection(db, 'users'));
      let usernameTaken = false;
      let emailTaken = false;

      snap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        if ((u.username || docSnap.id).toLowerCase() === cleanUsername) {
          usernameTaken = true;
        }
        if ((u.email || '').toLowerCase().replace(',', '.') === cleanEmail) {
          emailTaken = true;
        }
      });

      if (usernameTaken) {
        return {
          ok: false,
          error: 'Ese nombre de usuario ya está en uso. Elegí otro único.',
        };
      }

      if (emailTaken) {
        return {
          ok: false,
          error: 'Ese correo electrónico ya está registrado en otra cuenta.',
        };
      }

      const newUser: UserProfile = {
        id: cleanUsername,
        fullName: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: data.password,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cleanUsername), newUser);

      const safeUser: UserProfile = {
        id: newUser.id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };

      setCurrentUser(safeUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));
      }
      return { ok: true };
    } catch (err) {
      console.error('Error en registro:', err);
      return { ok: false, error: 'No se pudo completar el registro.' };
    }
  };

  const PENDING_RECOVER_EMAIL_KEY = 'micartera_pending_recover_email';

  const sendRecoveryVerificationEmail = async (
    email: string
  ): Promise<{ ok: boolean; email?: string; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase().replace(',', '.');
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false, error: 'Ingresá un correo electrónico válido.' };
      }

      const snap = await getDocs(collection(db, 'users'));
      let foundUser: UserProfile | undefined;

      snap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        const uname = (u.username || docSnap.id).toLowerCase();
        const uemail = (u.email || '').toLowerCase().replace(',', '.');
        if (uemail === cleanEmail) {
          foundUser = { ...u, id: docSnap.id, username: uname };
        }
      });

      if (!foundUser) {
        return {
          ok: false,
          error: 'No existe ninguna cuenta registrada con ese correo electrónico.',
        };
      }

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://mi-cartera-eight.vercel.app';

      const continueUrl = `${origin}/?recover_email=${encodeURIComponent(cleanEmail)}`;

      await sendSignInLinkToEmail(emailAuth, cleanEmail, {
        url: continueUrl,
        handleCodeInApp: true,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(PENDING_RECOVER_EMAIL_KEY, cleanEmail);
      }

      return {
        ok: true,
        email: cleanEmail,
      };
    } catch (err: any) {
      console.error('Error enviando correo de verificación:', err);
      if (err?.code === 'auth/too-many-requests') {
        return {
          ok: false,
          error: 'Se enviaron demasiados correos seguidos. Esperá unos minutos e intentá de nuevo.',
        };
      }
      return {
        ok: false,
        error: 'No se pudo enviar el correo de verificación. Verificá tu conexión.',
      };
    }
  };

  const verifyRecoveryEmailLink = async (
    linkOrUrl: string,
    fallbackEmail?: string
  ): Promise<{
    ok: boolean;
    userId?: string;
    username?: string;
    fullName?: string;
    email?: string;
    error?: string;
  }> => {
    try {
      const trimmedLink = linkOrUrl.trim();
      if (!trimmedLink) {
        return { ok: false, error: 'Enlace de verificación vacío.' };
      }

      // Extract recover_email from the link or URL if present
      let emailFromUrl = '';
      try {
        const parsedUrl = new URL(trimmedLink);
        emailFromUrl = parsedUrl.searchParams.get('recover_email') || '';
        if (!emailFromUrl) {
          const cont = parsedUrl.searchParams.get('continueUrl');
          if (cont) {
            const contUrl = new URL(cont);
            emailFromUrl = contUrl.searchParams.get('recover_email') || '';
          }
        }
      } catch {
        // Ignore URL parse error
      }

      const storedEmail =
        typeof window !== 'undefined'
          ? localStorage.getItem(PENDING_RECOVER_EMAIL_KEY) || ''
          : '';

      const targetEmail = (emailFromUrl || fallbackEmail || storedEmail)
        .trim()
        .toLowerCase()
        .replace(',', '.');

      if (!targetEmail) {
        return {
          ok: false,
          error: 'Ingresá tu correo electrónico para completar la verificación del enlace.',
        };
      }

      if (!isSignInWithEmailLink(emailAuth, trimmedLink)) {
        return {
          ok: false,
          error: 'El enlace ingresado no es un enlace de verificación válido.',
        };
      }

      // Cryptographically verify the one-time email link with Firebase Auth
      const cred = await signInWithEmailLink(emailAuth, targetEmail, trimmedLink);
      const verifiedEmail = (cred.user.email || targetEmail).toLowerCase().replace(',', '.');

      // Clean up temporary Firebase Auth session
      await signOut(emailAuth).catch(() => {});
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PENDING_RECOVER_EMAIL_KEY);
      }

      // Look up user in Firestore by verified email
      const snap = await getDocs(collection(db, 'users'));
      let foundUser: UserProfile | undefined;

      snap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        const uname = (u.username || docSnap.id).toLowerCase();
        const uemail = (u.email || '').toLowerCase().replace(',', '.');
        if (uemail === verifiedEmail) {
          foundUser = { ...u, id: docSnap.id, username: uname };
        }
      });

      if (!foundUser) {
        return {
          ok: false,
          error: 'No se encontró una cuenta asociada a este correo verificado.',
        };
      }

      return {
        ok: true,
        userId: foundUser.id,
        username: foundUser.username,
        fullName: foundUser.fullName,
        email: foundUser.email,
      };
    } catch (err: any) {
      console.error('Error verificando enlace de correo:', err);
      if (
        err?.code === 'auth/invalid-action-code' ||
        err?.code === 'auth/expired-action-code'
      ) {
        return {
          ok: false,
          error:
            'El enlace de verificación ya fue usado o venció. Solicitá un nuevo correo de verificación.',
        };
      }
      return {
        ok: false,
        error: 'No se pudo verificar el enlace del correo. Pedí un enlace nuevo.',
      };
    }
  };

  const resetPasswordByEmail = async (
    userId: string,
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (newPassword.length <= 5) {
        return {
          ok: false,
          error: 'La contraseña debe tener más de 5 caracteres (mínimo 6).',
        };
      }
      if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
        return {
          ok: false,
          error: 'La contraseña solo puede contener letras y números.',
        };
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { password: newPassword });

      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        const safeUser: UserProfile = {
          id: userSnap.id,
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          createdAt: u.createdAt,
        };
        setCurrentUser(safeUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));
        }
      }
      return { ok: true };
    } catch (err) {
      console.error('Error actualizando contraseña:', err);
      return { ok: false, error: 'No se pudo actualizar la contraseña.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  };

  // Debts Methods
  const addDebt = (
    debtData: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'remainingAmount' | 'isPaid' | 'orderIndex'>
  ) => {
    if (!currentUser) return;
    const newDebt: Debt = {
      ...debtData,
      id: uuidv4(),
      userId: currentUser.username,
      payments: [],
      createdAt: new Date().toISOString(),
      remainingAmount: debtData.originalAmount,
      isPaid: false,
      orderIndex: debts.length,
    };
    setDoc(doc(db, 'debts', newDebt.id), newDebt);
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    const debt = debts.find((d) => d.id === id);
    if (debt) {
      const newOriginalAmount =
        updates.originalAmount !== undefined ? Number(updates.originalAmount) : debt.originalAmount;
      const isFixed = updates.isFixed !== undefined ? updates.isFixed : debt.isFixed;
      const payments = Array.isArray(updates.payments) ? updates.payments : debt.payments || [];
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      let newRemainingAmount: number;
      let isPaid = updates.isPaid !== undefined ? updates.isPaid : debt.isPaid;

      if (isFixed) {
        newRemainingAmount = isPaid ? 0 : newOriginalAmount;
      } else {
        newRemainingAmount = Math.max(0, newOriginalAmount - totalPaid);
        isPaid = newRemainingAmount === 0;
      }

      const finalUpdates: Partial<Debt> = {
        ...updates,
        originalAmount: newOriginalAmount,
        remainingAmount:
          updates.remainingAmount !== undefined ? updates.remainingAmount : newRemainingAmount,
        isPaid,
        isFixed,
      };

      updateDoc(doc(db, 'debts', id), finalUpdates);
    } else {
      updateDoc(doc(db, 'debts', id), updates);
    }
  };

  const toggleDebtPaid = (id: string, paid: boolean) => {
    const debt = debts.find((d) => d.id === id);
    if (debt) {
      updateDoc(doc(db, 'debts', id), {
        isPaid: paid,
        remainingAmount: paid ? 0 : debt.originalAmount,
      });
    }
  };

  const payDebt = (id: string, amount: number) => {
    const debt = debts.find((d) => d.id === id);
    if (debt) {
      const newPayment: Payment = { id: uuidv4(), amount, date: new Date().toISOString() };
      const newRemaining = Math.max(0, debt.remainingAmount - amount);
      updateDoc(doc(db, 'debts', id), {
        payments: [...debt.payments, newPayment],
        remainingAmount: newRemaining,
        isPaid: newRemaining === 0,
      });
    }
  };

  const deleteDebt = (id: string) => deleteDoc(doc(db, 'debts', id));

  const reorderDebts = async (sourceIndex: number, destinationIndex: number, list: Debt[]) => {
    const newList = Array.from(list);
    const [removed] = newList.splice(sourceIndex, 1);
    newList.splice(destinationIndex, 0, removed);

    const batch = writeBatch(db);
    newList.forEach((item, index) => {
      batch.update(doc(db, 'debts', item.id), { orderIndex: index });
    });
    await batch.commit();
  };

  // Receivables Methods
  const addReceivable = (data: Omit<Receivable, 'id' | 'createdAt' | 'isPaid' | 'orderIndex'>) => {
    if (!currentUser) return;
    const newRec: Receivable = {
      ...data,
      id: uuidv4(),
      userId: currentUser.username,
      createdAt: new Date().toISOString(),
      isPaid: false,
      orderIndex: receivables.length,
    };
    setDoc(doc(db, 'receivables', newRec.id), newRec);
  };

  const updateReceivable = (id: string, updates: Partial<Receivable>) =>
    updateDoc(doc(db, 'receivables', id), updates);

  const markReceivableAsPaid = (id: string, paid: boolean) =>
    updateDoc(doc(db, 'receivables', id), { isPaid: paid });

  const deleteReceivable = (id: string) => deleteDoc(doc(db, 'receivables', id));

  const reorderReceivables = async (
    sourceIndex: number,
    destinationIndex: number,
    list: Receivable[]
  ) => {
    const newList = Array.from(list);
    const [removed] = newList.splice(sourceIndex, 1);
    newList.splice(destinationIndex, 0, removed);

    const batch = writeBatch(db);
    newList.forEach((item, index) => {
      batch.update(doc(db, 'receivables', item.id), { orderIndex: index });
    });
    await batch.commit();
  };

  // Portfolio (En Cartera / Disponibilidad) Methods
  const addPortfolioItem = (data: Omit<PortfolioItem, 'id' | 'createdAt' | 'orderIndex'>) => {
    if (!currentUser) return;
    const newItem: PortfolioItem = {
      ...data,
      id: uuidv4(),
      userId: currentUser.username,
      createdAt: new Date().toISOString(),
      orderIndex: portfolio.length,
    };
    setDoc(doc(db, 'portfolio', newItem.id), newItem);
  };

  const updatePortfolioItem = (id: string, updates: Partial<PortfolioItem>) => {
    updateDoc(doc(db, 'portfolio', id), updates);
  };

  const deletePortfolioItem = (id: string) => deleteDoc(doc(db, 'portfolio', id));

  const reorderPortfolio = async (
    sourceIndex: number,
    destinationIndex: number,
    list: PortfolioItem[]
  ) => {
    const newList = Array.from(list);
    const [removed] = newList.splice(sourceIndex, 1);
    newList.splice(destinationIndex, 0, removed);

    const batch = writeBatch(db);
    newList.forEach((item, index) => {
      batch.update(doc(db, 'portfolio', item.id), { orderIndex: index });
    });
    await batch.commit();
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        authLoading,
        login,
        register,
        sendRecoveryVerificationEmail,
        verifyRecoveryEmailLink,
        resetPasswordByEmail,
        logout,
        debts,
        receivables,
        portfolio,
        totalDebt,
        totalReceivables,
        totalPortfolio,
        netBalance,
        addDebt,
        updateDebt,
        toggleDebtPaid,
        payDebt,
        deleteDebt,
        reorderDebts,
        addReceivable,
        updateReceivable,
        markReceivableAsPaid,
        deleteReceivable,
        reorderReceivables,
        addPortfolioItem,
        updatePortfolioItem,
        deletePortfolioItem,
        reorderPortfolio,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
