import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Sale,
  Expense,
  CustomerCredit,
  CreditTransaction,
  InventoryItem,
  CashEntry,
  ShopSettings,
} from '../types';
import { getTodayDateString } from '../utils/format';

// Initial realistic default items for a Bangladeshi tea stall
export const DEFAULT_INVENTORY: Omit<InventoryItem, 'id' | 'userId'>[] = [
  { itemName: 'তরল দুধ (খাঁটি গরুর দুধ)', key: 'milk', unit: 'লিটার', currentStock: 8, minAlertStock: 2, unitCost: 90, lastRestocked: getTodayDateString() },
  { itemName: 'চা পাতা (ইস্পাহানি / তাজা)', key: 'tea_leaves', unit: 'কেজি', currentStock: 3.5, minAlertStock: 1, unitCost: 480, lastRestocked: getTodayDateString() },
  { itemName: 'সাদা চিনি', key: 'sugar', unit: 'কেজি', currentStock: 6, minAlertStock: 2, unitCost: 140, lastRestocked: getTodayDateString() },
  { itemName: 'ওয়ান-টাইম পেপার কাপ', key: 'cups', unit: 'পিস', currentStock: 350, minAlertStock: 100, unitCost: 0.8, lastRestocked: getTodayDateString() },
  { itemName: 'সিগারেট (গোল্ডলিফ/বেনসন)', key: 'cigarettes', unit: 'শলাকা', currentStock: 120, minAlertStock: 40, unitCost: 13, lastRestocked: getTodayDateString() },
];

export const DEFAULT_SETTINGS: Omit<ShopSettings, 'id' | 'userId'> = {
  shopName: 'ভাই ভাই চা স্টল',
  ownerName: 'মোহাম্মদ আলমগীর',
  milkTeaPrice: 20,
  blackTeaPrice: 5,
  customItems: JSON.stringify([
    { id: 'custom_1', name: 'টোস্ট বিস্কুট', price: 10 },
    { id: 'custom_2', name: 'স্পেশাল কেক', price: 15 },
    { id: 'custom_3', name: 'সিদ্ধ ডিম', price: 15 },
    { id: 'custom_4', name: 'বেনসন সিগারেট', price: 18 },
    { id: 'custom_5', name: 'গোল্ডলিফ সিগারেট', price: 13 },
  ]),
};

// Firestore CRUD Operations with error handling and fallback
export const api = {
  // --- SALES ---
  subscribeSales: (userId: string, onUpdate: (sales: Sale[]) => void) => {
    const q = query(collection(db, 'sales'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: Sale[] = [];
        snapshot.forEach((d) => data.push(d.data() as Sale));
        data.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sales');
      }
    );
  },

  addSale: async (sale: Sale): Promise<void> => {
    try {
      await setDoc(doc(db, 'sales', sale.id), sale);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `sales/${sale.id}`);
    }
  },

  updateSale: async (sale: Sale): Promise<void> => {
    try {
      await updateDoc(doc(db, 'sales', sale.id), { ...sale });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sales/${sale.id}`);
    }
  },

  deleteSale: async (saleId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'sales', saleId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sales/${saleId}`);
    }
  },

  // --- EXPENSES ---
  subscribeExpenses: (userId: string, onUpdate: (expenses: Expense[]) => void) => {
    const q = query(collection(db, 'expenses'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: Expense[] = [];
        snapshot.forEach((d) => data.push(d.data() as Expense));
        data.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    );
  },

  addExpense: async (expense: Expense): Promise<void> => {
    try {
      await setDoc(doc(db, 'expenses', expense.id), expense);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `expenses/${expense.id}`);
    }
  },

  updateExpense: async (expense: Expense): Promise<void> => {
    try {
      await updateDoc(doc(db, 'expenses', expense.id), { ...expense });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `expenses/${expense.id}`);
    }
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${expenseId}`);
    }
  },

  // --- CUSTOMERS & CREDIT ---
  subscribeCustomers: (userId: string, onUpdate: (customers: CustomerCredit[]) => void) => {
    const q = query(collection(db, 'customers'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: CustomerCredit[] = [];
        snapshot.forEach((d) => data.push(d.data() as CustomerCredit));
        data.sort((a, b) => b.currentBalance - a.currentBalance);
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );
  },

  saveCustomer: async (customer: CustomerCredit): Promise<void> => {
    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
    }
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${customerId}`);
    }
  },

  subscribeCreditTransactions: (userId: string, onUpdate: (trans: CreditTransaction[]) => void) => {
    const q = query(collection(db, 'credit_transactions'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: CreditTransaction[] = [];
        snapshot.forEach((d) => data.push(d.data() as CreditTransaction));
        data.sort((a, b) => b.date.localeCompare(a.date));
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'credit_transactions');
      }
    );
  },

  addCreditTransaction: async (trans: CreditTransaction): Promise<void> => {
    try {
      await setDoc(doc(db, 'credit_transactions', trans.id), trans);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `credit_transactions/${trans.id}`);
    }
  },

  updateCreditTransaction: async (trans: CreditTransaction): Promise<void> => {
    try {
      await updateDoc(doc(db, 'credit_transactions', trans.id), { ...trans });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `credit_transactions/${trans.id}`);
    }
  },

  deleteCreditTransaction: async (transId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'credit_transactions', transId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `credit_transactions/${transId}`);
    }
  },

  // --- INVENTORY ---
  subscribeInventory: (userId: string, onUpdate: (items: InventoryItem[]) => void) => {
    const q = query(collection(db, 'inventory'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: InventoryItem[] = [];
        snapshot.forEach((d) => data.push(d.data() as InventoryItem));
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inventory');
      }
    );
  },

  saveInventoryItem: async (item: InventoryItem): Promise<void> => {
    try {
      await setDoc(doc(db, 'inventory', item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/${item.id}`);
    }
  },

  deleteInventoryItem: async (itemId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${itemId}`);
    }
  },

  // --- CASH ENTRIES ---
  subscribeCashEntries: (userId: string, onUpdate: (entries: CashEntry[]) => void) => {
    const q = query(collection(db, 'cash_entries'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const data: CashEntry[] = [];
        snapshot.forEach((d) => data.push(d.data() as CashEntry));
        data.sort((a, b) => b.date.localeCompare(a.date));
        onUpdate(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'cash_entries');
      }
    );
  },

  addCashEntry: async (entry: CashEntry): Promise<void> => {
    try {
      await setDoc(doc(db, 'cash_entries', entry.id), entry);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `cash_entries/${entry.id}`);
    }
  },

  deleteCashEntry: async (entryId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'cash_entries', entryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cash_entries/${entryId}`);
    }
  },

  // --- SHOP SETTINGS ---
  subscribeShopSettings: (userId: string, onUpdate: (settings: ShopSettings | null) => void) => {
    const q = query(collection(db, 'shop_settings'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          onUpdate(docSnap.data() as ShopSettings);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'shop_settings');
      }
    );
  },

  saveShopSettings: async (settings: ShopSettings): Promise<void> => {
    try {
      await setDoc(doc(db, 'shop_settings', settings.id), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shop_settings/${settings.id}`);
    }
  },

  // Initialize fresh user defaults
  initUserDefaults: async (userId: string): Promise<void> => {
    // 1. Settings
    const settingId = `settings_${userId}`;
    const settings: ShopSettings = {
      id: settingId,
      userId,
      ...DEFAULT_SETTINGS,
    };
    await setDoc(doc(db, 'shop_settings', settingId), settings);

    // 2. Inventory Items
    for (const item of DEFAULT_INVENTORY) {
      const invId = `inv_${userId}_${item.key}`;
      const invDoc: InventoryItem = {
        id: invId,
        userId,
        ...item,
      };
      await setDoc(doc(db, 'inventory', invId), invDoc);
    }
  },
};
