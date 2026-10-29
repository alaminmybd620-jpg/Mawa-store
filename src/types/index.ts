export type SaleType = 'milk_tea' | 'black_tea' | 'custom';
export type PaymentMethod = 'cash' | 'credit' | 'bkash';

export interface Sale {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  itemName: string;
  itemType: SaleType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerId?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'milk'
  | 'tea_leaves'
  | 'sugar'
  | 'cups'
  | 'cigarettes'
  | 'snacks'
  | 'electricity'
  | 'salary'
  | 'rent'
  | 'gas'
  | 'misc';

export interface Expense {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  category: ExpenseCategory | string;
  categoryLabel: string;
  amount: number;
  isInventoryPurchase?: boolean;
  notes?: string;
}

export interface CustomerCredit {
  id: string;
  userId: string;
  customerName: string;
  phone?: string;
  totalDue: number;
  totalPaid: number;
  currentBalance: number;
  lastUpdated: string;
  notes?: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  type: 'credit_taken' | 'payment_received';
  amount: number;
  notes?: string;
  timestamp?: number;
  receiptNo?: string;
  paymentMethod?: 'cash' | 'bkash';
  previousBalance?: number;
  remainingBalance?: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemName: string;
  key: string;
  unit: string; // লিটার, কেজি, পিস, প্যাকেট, ইত্যাদি
  currentStock: number;
  minAlertStock: number;
  unitCost: number;
  lastRestocked?: string;
}

export interface CashEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: 'opening_balance' | 'cash_in' | 'cash_out';
  amount: number;
  description: string;
}

export interface CustomProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface CustomCategory {
  id: string;
  key: string;
  label: string;
  isInventory: boolean;
}

export interface ShopSettings {
  id: string;
  userId: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  milkTeaPrice: number;
  blackTeaPrice: number;
  customItems?: string; // JSON serialized string of CustomProduct[]
  customCategories?: string; // JSON serialized string of CustomCategory[]
}

export interface ProfitLossReport {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  cashSales: number;
  creditSales: number;
  creditCollected: number;
  totalExpenses: number;
  inventoryPurchases: number;
  operatingExpenses: number;
  netProfit: number;
  milksTeaCupsSold: number;
  blackTeaCupsSold: number;
  topExpenses: { categoryLabel: string; amount: number }[];
}
