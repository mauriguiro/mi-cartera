export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
}

export interface Debt {
  id: string;
  userId?: string;
  concept: string;
  creditor: string;
  originalAmount: number;
  remainingAmount: number;
  isFixed: boolean;
  dueDate: string;
  createdAt: string;
  payments: Payment[];
  isPaid: boolean;
  orderIndex: number;
}

export interface Receivable {
  id: string;
  userId?: string;
  debtor: string;
  amount: number;
  concept: string;
  dueDate: string;
  createdAt: string;
  isPaid: boolean;
  orderIndex: number;
}

export type PortfolioCategory = 'efectivo' | 'cheque' | 'cuenta' | 'dolares';

export interface PortfolioItem {
  id: string;
  userId?: string;
  category: PortfolioCategory;
  title: string;
  amount: number;
  notes: string;
  createdAt: string;
  orderIndex: number;
}
