export interface Payment {
  id: string;
  amount: number;
  date: string;
}

export interface Debt {
  id: string;
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
  debtor: string;
  amount: number;
  concept: string;
  dueDate: string;
  createdAt: string;
  isPaid: boolean;
  orderIndex: number;
}
