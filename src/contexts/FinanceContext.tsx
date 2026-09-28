'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Debt, Receivable, Payment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface FinanceContextType {
  debts: Debt[];
  receivables: Receivable[];
  totalDebt: number;
  totalReceivables: number;
  netBalance: number;
  addDebt: (debt: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'remainingAmount' | 'isPaid' | 'orderIndex'>) => void;
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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);

  const checkMonthlyReset = (currentDebts: Debt[]) => {
    if (typeof window === 'undefined') return;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const lastReset = localStorage.getItem('last_reset_month');

    if (lastReset !== currentMonthKey && currentDebts.length > 0) {
      let changed = false;
      const batch = writeBatch(db);
      
      currentDebts.forEach(debt => {
        if (debt.isFixed && debt.isPaid) {
          batch.update(doc(db, 'debts', debt.id), { 
            isPaid: false, 
            remainingAmount: debt.originalAmount 
          });
          changed = true;
        }
      });

      if (changed) {
        batch.commit().then(() => {
          localStorage.setItem('last_reset_month', currentMonthKey);
        });
      } else {
        localStorage.setItem('last_reset_month', currentMonthKey);
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
          let remainingAmount = raw.remainingAmount !== undefined ? Number(raw.remainingAmount) : originalAmount;
          let isPaid = raw.isPaid ?? false;

          if (raw.isFixed) {
            remainingAmount = isPaid ? 0 : originalAmount;
          } else {
            // Recalculate remaining amount safely
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
        setDebts(data);
        checkMonthlyReset(data);
      },
      (error) => {
        console.error("Error cargando deudas de Firestore:", error);
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
        setReceivables(data);
      },
      (error) => {
        console.error("Error cargando cobros de Firestore:", error);
      }
    );

    return () => {
      unsubDebts();
      unsubReceivables();
    };
  }, []);

  const totalDebt = debts.filter(d => !d.isPaid).reduce((sum, d) => {
    if (d.isFixed) {
      return sum + (d.originalAmount || 0);
    }
    return sum + (d.remainingAmount !== undefined ? d.remainingAmount : (d.originalAmount || 0));
  }, 0);

  const totalReceivables = receivables.filter(r => !r.isPaid).reduce((sum, r) => sum + (r.amount || 0), 0);
  const netBalance = totalReceivables - totalDebt;

  // Debts Methods
  const addDebt = (debtData: Omit<Debt, 'id' | 'payments' | 'createdAt' | 'remainingAmount' | 'isPaid' | 'orderIndex'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: uuidv4(),
      payments: [],
      createdAt: new Date().toISOString(),
      remainingAmount: debtData.originalAmount,
      isPaid: false,
      orderIndex: debts.length,
    };
    setDoc(doc(db, 'debts', newDebt.id), newDebt);
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      const newOriginalAmount = updates.originalAmount !== undefined ? Number(updates.originalAmount) : debt.originalAmount;
      const isFixed = updates.isFixed !== undefined ? updates.isFixed : debt.isFixed;
      const payments = Array.isArray(updates.payments) ? updates.payments : (debt.payments || []);
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
        remainingAmount: updates.remainingAmount !== undefined ? updates.remainingAmount : newRemainingAmount,
        isPaid,
        isFixed,
      };

      updateDoc(doc(db, 'debts', id), finalUpdates);
    } else {
      updateDoc(doc(db, 'debts', id), updates);
    }
  };

  const toggleDebtPaid = (id: string, paid: boolean) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      updateDoc(doc(db, 'debts', id), {
        isPaid: paid,
        remainingAmount: paid ? 0 : debt.originalAmount
      });
    }
  };

  const payDebt = (id: string, amount: number) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      const newPayment: Payment = { id: uuidv4(), amount, date: new Date().toISOString() };
      const newRemaining = Math.max(0, debt.remainingAmount - amount);
      updateDoc(doc(db, 'debts', id), {
        payments: [...debt.payments, newPayment],
        remainingAmount: newRemaining,
        isPaid: newRemaining === 0
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
    const newRec: Receivable = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      isPaid: false,
      orderIndex: receivables.length,
    };
    setDoc(doc(db, 'receivables', newRec.id), newRec);
  };

  const updateReceivable = (id: string, updates: Partial<Receivable>) => updateDoc(doc(db, 'receivables', id), updates);

  const markReceivableAsPaid = (id: string, paid: boolean) => updateDoc(doc(db, 'receivables', id), { isPaid: paid });

  const deleteReceivable = (id: string) => deleteDoc(doc(db, 'receivables', id));

  const reorderReceivables = async (sourceIndex: number, destinationIndex: number, list: Receivable[]) => {
    const newList = Array.from(list);
    const [removed] = newList.splice(sourceIndex, 1);
    newList.splice(destinationIndex, 0, removed);

    const batch = writeBatch(db);
    newList.forEach((item, index) => {
      batch.update(doc(db, 'receivables', item.id), { orderIndex: index });
    });
    await batch.commit();
  };

  return (
    <FinanceContext.Provider value={{
      debts, receivables, totalDebt, totalReceivables, netBalance,
      addDebt, updateDebt, toggleDebtPaid, payDebt, deleteDebt, reorderDebts,
      addReceivable, updateReceivable, markReceivableAsPaid, deleteReceivable, reorderReceivables
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
