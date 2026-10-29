/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testConnection, loginWithGoogle, logoutUser } from './firebase';
import { api, DEFAULT_INVENTORY, DEFAULT_SETTINGS } from './services/db';
import {
  Sale,
  Expense,
  CustomerCredit,
  CreditTransaction,
  InventoryItem,
  CashEntry,
  ShopSettings,
  CustomProduct,
  CustomCategory,
} from './types';
import { getTodayDateString } from './utils/format';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { SalesManager } from './components/SalesManager';
import { ExpenseManager } from './components/ExpenseManager';
import { CreditManager } from './components/CreditManager';
import { InventoryManager } from './components/InventoryManager';
import { CashRegister } from './components/CashRegister';
import { Reports } from './components/Reports';
import { SettingsModal } from './components/SettingsModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { ConfirmModal } from './components/ConfirmModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

// Local storage keys for offline caching
const STORAGE_PREFIX = 'tea_shop_';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Core Data States
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    // Initial demo sales for realistic feel
    const today = getTodayDateString();
    return [
      {
        id: 'sale_1',
        userId: 'demo',
        date: today,
        timestamp: Date.now() - 3600000 * 2,
        itemName: 'দুধ চা',
        itemType: 'milk_tea',
        quantity: 2,
        unitPrice: 20,
        totalAmount: 40,
        paymentMethod: 'cash',
      },
      {
        id: 'sale_2',
        userId: 'demo',
        date: today,
        timestamp: Date.now() - 3600000,
        itemName: 'লাল চা / রং চা',
        itemType: 'black_tea',
        quantity: 3,
        unitPrice: 5,
        totalAmount: 15,
        paymentMethod: 'cash',
      },
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}expenses`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    const today = getTodayDateString();
    return [
      {
        id: 'exp_1',
        userId: 'demo',
        date: today,
        timestamp: Date.now() - 3600000 * 4,
        category: 'milk',
        categoryLabel: 'তরল / গুঁড়া দুধ',
        amount: 180,
        isInventoryPurchase: true,
        notes: 'সকালের গরুর দুধ ২ লিটার',
      },
      {
        id: 'exp_2',
        userId: 'demo',
        date: today,
        timestamp: Date.now() - 3600000 * 3,
        category: 'sugar',
        categoryLabel: 'চিনি',
        amount: 140,
        isInventoryPurchase: true,
        notes: '১ কেজি চিনি',
      },
    ];
  });

  const [customers, setCustomers] = useState<CustomerCredit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return [
      {
        id: 'cust_1',
        userId: 'demo',
        customerName: 'মোশাররফ হোসেন (দোকানি)',
        phone: '০১৭xxxxxxxx',
        totalDue: 350,
        totalPaid: 150,
        currentBalance: 200,
        lastUpdated: getTodayDateString(),
        notes: 'নিয়মিত কাস্টমার',
      },
      {
        id: 'cust_2',
        userId: 'demo',
        customerName: 'রফিক ভাই (ড্রাইভার)',
        phone: '০১৮xxxxxxxx',
        totalDue: 85,
        totalPaid: 0,
        currentBalance: 85,
        lastUpdated: getTodayDateString(),
      },
    ];
  });

  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}credit_tx`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return DEFAULT_INVENTORY.map((item, idx) => ({
      ...item,
      id: `inv_${idx + 1}`,
      userId: 'demo',
    }));
  });

  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}cash_entries`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return [
      {
        id: 'cash_init',
        userId: 'demo',
        date: getTodayDateString(),
        type: 'opening_balance',
        amount: 500,
        description: 'সকালের ভাঙতি ক্যাশ',
      },
    ];
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore */
      }
    }
    return {
      id: 'settings_demo',
      userId: 'demo',
      ...DEFAULT_SETTINGS,
    };
  });

  // Sync to local storage for instant offline persistence
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}sales`, JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}credit_tx`, JSON.stringify(creditTransactions));
  }, [creditTransactions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(inventory));
  }, [inventory]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}cash_entries`, JSON.stringify(cashEntries));
  }, [cashEntries]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  // Test Firebase Firestore Connection on startup per skill requirements
  useEffect(() => {
    testConnection().then((connected) => {
      setIsOnline(connected);
    });
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        // When logged in, set up real-time listeners from Firestore
        const unsubs: (() => void)[] = [];

        // 1. Sales
        unsubs.push(
          api.subscribeSales(currentUser.uid, (data) => {
            if (data.length > 0) setSales(data);
          })
        );

        // 2. Expenses
        unsubs.push(
          api.subscribeExpenses(currentUser.uid, (data) => {
            if (data.length > 0) setExpenses(data);
          })
        );

        // 3. Customers
        unsubs.push(
          api.subscribeCustomers(currentUser.uid, (data) => {
            if (data.length > 0) setCustomers(data);
          })
        );

        // 4. Credit Transactions
        unsubs.push(
          api.subscribeCreditTransactions(currentUser.uid, (data) => {
            if (data.length > 0) setCreditTransactions(data);
          })
        );

        // 5. Inventory
        unsubs.push(
          api.subscribeInventory(currentUser.uid, (data) => {
            if (data.length > 0) setInventory(data);
          })
        );

        // 6. Cash Entries
        unsubs.push(
          api.subscribeCashEntries(currentUser.uid, (data) => {
            if (data.length > 0) setCashEntries(data);
          })
        );

        // 7. Settings
        unsubs.push(
          api.subscribeShopSettings(currentUser.uid, (data) => {
            if (data) {
              setSettings(data);
            } else {
              // First time user init
              api.initUserDefaults(currentUser.uid).catch(console.error);
            }
          })
        );

        return () => {
          unsubs.forEach((u) => u());
        };
      }
    });

    return () => unsubscribe();
  }, []);

  // Parse custom items from settings
  const customProducts: CustomProduct[] = useMemo(() => {
    if (!settings.customItems) return [];
    try {
      return JSON.parse(settings.customItems);
    } catch {
      return [];
    }
  }, [settings.customItems]);

  const customCategories: CustomCategory[] = useMemo(() => {
    if (!settings.customCategories) return [];
    try {
      return JSON.parse(settings.customCategories);
    } catch {
      return [];
    }
  }, [settings.customCategories]);

  // Compute Today's Data
  const today = getTodayDateString();
  const todaySales = useMemo(() => sales.filter((s) => s.date === today), [sales, today]);
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today), [expenses, today]);
  const todayCreditTransactions = useMemo(
    () => creditTransactions.filter((t) => t.date === today),
    [creditTransactions, today]
  );

  // Compute Current Cash in Drawer
  const cashBalance = useMemo(() => {
    const openingEntry = cashEntries.find(
      (e) => e.date === today && e.type === 'opening_balance'
    );
    const opening = openingEntry ? openingEntry.amount : 0;

    const cashSales = todaySales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.totalAmount, 0);

    const creditCollected = todayCreditTransactions
      .filter((t) => t.type === 'payment_received')
      .reduce((acc, t) => acc + t.amount, 0);

    const otherIn = cashEntries
      .filter((e) => e.date === today && e.type === 'cash_in')
      .reduce((acc, e) => acc + e.amount, 0);

    const expensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

    const otherOut = cashEntries
      .filter((e) => e.date === today && e.type === 'cash_out')
      .reduce((acc, e) => acc + e.amount, 0);

    return opening + cashSales + creditCollected + otherIn - expensesTotal - otherOut;
  }, [cashEntries, todaySales, todayCreditTransactions, todayExpenses, today]);

  // --- ACTIONS ---

  // 1. Add Sale
  const handleAddSale = async (newSaleData: Omit<Sale, 'id' | 'userId' | 'timestamp'>) => {
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullSale: Sale = {
      ...newSaleData,
      id: saleId,
      userId: user ? user.uid : 'demo',
      timestamp: Date.now(),
    };

    // Update local state immediately
    setSales((prev) => [fullSale, ...prev]);

    // If paymentMethod is credit and customer selected, update customer balance!
    if (fullSale.paymentMethod === 'credit' && fullSale.customerId) {
      const cust = customers.find((c) => c.id === fullSale.customerId);
      if (cust) {
        const updatedCust: CustomerCredit = {
          ...cust,
          totalDue: cust.totalDue + fullSale.totalAmount,
          currentBalance: cust.currentBalance + fullSale.totalAmount,
          lastUpdated: today,
        };
        setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updatedCust : c)));

        // Log transaction
        const txId = `tx_${Date.now()}`;
        const newTx: CreditTransaction = {
          id: txId,
          userId: user ? user.uid : 'demo',
          customerId: cust.id,
          customerName: cust.customerName,
          date: today,
          type: 'credit_taken',
          amount: fullSale.totalAmount,
          notes: `${fullSale.itemName} (${fullSale.quantity} কাপ/পিস)`,
        };
        setCreditTransactions((prev) => [newTx, ...prev]);

        if (user) {
          api.saveCustomer(updatedCust).catch(console.error);
          api.addCreditTransaction(newTx).catch(console.error);
        }
      }
    }

    // Persist to Firebase if authenticated
    if (user) {
      await api.addSale(fullSale);
    }
  };

  // 2. Update Sale
  const handleUpdateSale = async (updatedSale: Sale) => {
    setSales((prev) => prev.map((s) => (s.id === updatedSale.id ? updatedSale : s)));
    if (user) {
      await api.updateSale(updatedSale);
    }
  };

  // 3. Delete Sale with Confirmation
  const handleDeleteSale = (saleId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'বিক্রি এন্ট্রি মুছে ফেলুন',
      message: 'আপনি কি নিশ্চিত যে এই বিক্রির হিসাবটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।',
      onConfirm: async () => {
        setSales((prev) => prev.filter((s) => s.id !== saleId));
        if (user) {
          await api.deleteSale(saleId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 4. Add Expense
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'userId' | 'timestamp'>) => {
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullExpense: Expense = {
      ...newExpenseData,
      id: expenseId,
      userId: user ? user.uid : 'demo',
      timestamp: Date.now(),
    };

    setExpenses((prev) => [fullExpense, ...prev]);
    if (user) {
      await api.addExpense(fullExpense);
    }
  };

  // 5. Update Expense
  const handleUpdateExpense = async (updatedExpense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
    if (user) {
      await api.updateExpense(updatedExpense);
    }
  };

  // 6. Delete Expense with Confirmation
  const handleDeleteExpense = (expenseId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'খরচ মুছে ফেলুন',
      message: 'আপনি কি নিশ্চিত যে এই খরচের হিসাবটি মুছে ফেলতে চান?',
      onConfirm: async () => {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        if (user) {
          await api.deleteExpense(expenseId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 7. Save Customer
  const handleSaveCustomer = async (cust: CustomerCredit) => {
    const toSave = { ...cust, userId: user ? user.uid : 'demo' };
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === cust.id);
      return exists ? prev.map((c) => (c.id === cust.id ? toSave : c)) : [toSave, ...prev];
    });
    if (user) {
      await api.saveCustomer(toSave);
    }
  };

  // 8. Delete Customer
  const handleDeleteCustomer = (customerId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'গ্রাহক মুছে ফেলুন',
      message: 'আপনি কি এই গ্রাহক ও তার বাকি রেকর্ড মুছে ফেলতে নিশ্চিত?',
      onConfirm: async () => {
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        if (user) {
          await api.deleteCustomer(customerId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Helper: Recalculate customer totalDue, totalPaid, and currentBalance from their transactions
  const recalculateCustomer = (
    customerId: string,
    allTx: CreditTransaction[],
    customerList: CustomerCredit[]
  ): CustomerCredit | null => {
    const cust = customerList.find((c) => c.id === customerId);
    if (!cust) return null;

    const custTx = allTx.filter((t) => t.customerId === customerId);
    const totalDue = custTx
      .filter((t) => t.type === 'credit_taken')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = custTx
      .filter((t) => t.type === 'payment_received')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = Math.max(0, totalDue - totalPaid);

    return {
      ...cust,
      totalDue,
      totalPaid,
      currentBalance,
      lastUpdated: getTodayDateString(),
    };
  };

  // 9. Add Credit Transaction (Payment or Due) - Returns created transaction for ReceiptModal
  const handleAddCreditTransaction = async (
    customerId: string,
    type: 'credit_taken' | 'payment_received',
    amount: number,
    notes?: string,
    paymentMethod: 'cash' | 'bkash' = 'cash'
  ): Promise<CreditTransaction | void> => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const txId = `tx_${Date.now()}`;
    const dateStr = getTodayDateString();
    const receiptNo = `MR-${dateStr.replace(/-/g, '')}-${txId.slice(-4).toUpperCase()}`;

    const prevBalance = cust.currentBalance;
    const remainingBalance =
      type === 'payment_received'
        ? Math.max(0, cust.currentBalance - amount)
        : cust.currentBalance + amount;

    const newTx: CreditTransaction = {
      id: txId,
      userId: user ? user.uid : 'demo',
      customerId,
      customerName: cust.customerName,
      date: dateStr,
      type,
      amount,
      notes,
      timestamp: Date.now(),
      receiptNo,
      paymentMethod,
      previousBalance: prevBalance,
      remainingBalance,
    };

    // Update customer's due/paid/balance
    const updatedCust: CustomerCredit = {
      ...cust,
      totalDue: type === 'credit_taken' ? cust.totalDue + amount : cust.totalDue,
      totalPaid: type === 'payment_received' ? cust.totalPaid + amount : cust.totalPaid,
      currentBalance: remainingBalance,
      lastUpdated: dateStr,
    };

    setCreditTransactions((prev) => [newTx, ...prev]);
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updatedCust : c)));

    if (user) {
      await api.addCreditTransaction(newTx);
      await api.saveCustomer(updatedCust);
    }

    return newTx;
  };

  // 9b. Update Credit Transaction (Change amount, date, notes, payment method)
  const handleUpdateCreditTransaction = async (updatedTx: CreditTransaction) => {
    const newTxList = creditTransactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setCreditTransactions(newTxList);

    // Recalculate customer balance
    const updatedCust = recalculateCustomer(updatedTx.customerId, newTxList, customers);
    if (updatedCust) {
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      if (user) {
        await api.saveCustomer(updatedCust);
      }
    }

    if (user) {
      await api.updateCreditTransaction(updatedTx);
    }
  };

  // 9c. Delete Credit Transaction with Confirmation
  const handleDeleteCreditTransaction = (transId: string) => {
    const tx = creditTransactions.find((t) => t.id === transId);
    if (!tx) return;

    setConfirmModal({
      isOpen: true,
      title: 'লেনদেন মুছে ফেলুন',
      message: `আপনি কি "${tx.customerName}" এর ${tx.type === 'payment_received' ? 'আদায়' : 'বাকি'} বাবদ ৳${tx.amount} এর লেনদেনটি মুছে ফেলতে নিশ্চিত? গ্রাহকের বকেয়া ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় করা হবে।`,
      onConfirm: async () => {
        const newTxList = creditTransactions.filter((t) => t.id !== transId);
        setCreditTransactions(newTxList);

        const updatedCust = recalculateCustomer(tx.customerId, newTxList, customers);
        if (updatedCust) {
          setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
          if (user) {
            await api.saveCustomer(updatedCust);
          }
        }

        if (user) {
          await api.deleteCreditTransaction(transId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 10. Save Inventory Item
  const handleSaveInventoryItem = async (item: InventoryItem) => {
    const toSave = { ...item, userId: user ? user.uid : 'demo' };
    setInventory((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? toSave : i)) : [...prev, toSave];
    });
    if (user) {
      await api.saveInventoryItem(toSave);
    }
  };

  // 11. Delete Inventory Item
  const handleDeleteInventoryItem = (itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'মজুদ আইটেম মুছে ফেলুন',
      message: 'আপনি কি নিশ্চিত যে এই স্টক আইটেমটি তালিকা থেকে মুছে ফেলতে চান?',
      onConfirm: async () => {
        setInventory((prev) => prev.filter((i) => i.id !== itemId));
        if (user) {
          await api.deleteInventoryItem(itemId);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // 12. Add Cash Entry
  const handleAddCashEntry = async (entry: Omit<CashEntry, 'id' | 'userId'>) => {
    const id = `cash_${Date.now()}`;
    const fullEntry: CashEntry = {
      ...entry,
      id,
      userId: user ? user.uid : 'demo',
    };
    setCashEntries((prev) => [fullEntry, ...prev]);
    if (user) {
      await api.addCashEntry(fullEntry);
    }
  };

  // 13. Delete Cash Entry
  const handleDeleteCashEntry = (entryId: string) => {
    setCashEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (user) {
      api.deleteCashEntry(entryId).catch(console.error);
    }
  };

  // 14. Save Settings
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    const toSave = { ...newSettings, userId: user ? user.uid : 'demo' };
    setSettings(toSave);
    if (user) {
      await api.saveShopSettings(toSave);
    }
  };

  // 15. Reset Demo Data to Clean Fresh Book
  const handleResetDemoData = async () => {
    setSales([]);
    setExpenses([]);
    setCreditTransactions([]);
    setCustomers([]);
    setCashEntries([
      {
        id: `cash_${Date.now()}`,
        userId: user ? user.uid : 'demo',
        date: getTodayDateString(),
        type: 'opening_balance',
        amount: 0,
        description: 'নতুন খাতার প্রারম্ভিক ক্যাশ',
      },
    ]);

    localStorage.removeItem(`${STORAGE_PREFIX}sales`);
    localStorage.removeItem(`${STORAGE_PREFIX}expenses`);
    localStorage.removeItem(`${STORAGE_PREFIX}credit_tx`);
    localStorage.removeItem(`${STORAGE_PREFIX}customers`);
    localStorage.removeItem(`${STORAGE_PREFIX}cash_entries`);

    // Clean cloud records if user is logged in
    if (user) {
      for (const s of sales) await api.deleteSale(s.id).catch(console.error);
      for (const e of expenses) await api.deleteExpense(e.id).catch(console.error);
      for (const t of creditTransactions) await api.deleteCreditTransaction(t.id).catch(console.error);
      for (const c of customers) await api.deleteCustomer(c.id).catch(console.error);
    }
  };

  // 16. Restore Backup
  const handleRestoreData = async (data: any) => {
    if (data.sales) setSales(data.sales);
    if (data.expenses) setExpenses(data.expenses);
    if (data.customers) setCustomers(data.customers);
    if (data.creditTransactions) setCreditTransactions(data.creditTransactions);
    if (data.inventory) setInventory(data.inventory);
    if (data.cashEntries) setCashEntries(data.cashEntries);
    if (data.settings) setSettings(data.settings);

    // If logged in, push to Firestore
    if (user) {
      for (const s of data.sales || []) await api.addSale(s).catch(console.error);
      for (const e of data.expenses || []) await api.addExpense(e).catch(console.error);
      for (const c of data.customers || []) await api.saveCustomer(c).catch(console.error);
      for (const i of data.inventory || []) await api.saveInventoryItem(i).catch(console.error);
      for (const t of data.creditTransactions || []) await api.addCreditTransaction(t).catch(console.error);
      for (const ce of data.cashEntries || []) await api.addCashEntry(ce).catch(console.error);
      if (data.settings) await api.saveShopSettings(data.settings).catch(console.error);
    }
  };

  // Low stock and credit counts for badges
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minAlertStock).length;
  const unpaidCreditsCount = customers.filter((c) => c.currentBalance > 0).length;

  // Desktop Chrome Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is inside input, textarea, or select (except for Escape)
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isBackupOpen) setIsBackupOpen(false);
        if (isCashRegisterOpen) setIsCashRegisterOpen(false);
        if (confirmModal.isOpen) setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      if (isInput) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      const key = e.key.toLowerCase();
      if (key === '1') {
        e.preventDefault();
        setActiveTab('dashboard');
        handleAddSale({
          date: today,
          itemName: 'দুধ চা',
          itemType: 'milk_tea',
          quantity: 1,
          unitPrice: settings.milkTeaPrice,
          totalAmount: settings.milkTeaPrice,
          paymentMethod: 'cash',
        });
      } else if (key === '2') {
        e.preventDefault();
        setActiveTab('dashboard');
        handleAddSale({
          date: today,
          itemName: 'লাল চা / রং চা',
          itemType: 'black_tea',
          quantity: 1,
          unitPrice: settings.blackTeaPrice,
          totalAmount: settings.blackTeaPrice,
          paymentMethod: 'cash',
        });
      } else if (key === 'd') {
        setActiveTab('dashboard');
      } else if (key === 'n') {
        setActiveTab('sales');
      } else if (key === 'e') {
        setActiveTab('expenses');
      } else if (key === 'b') {
        setActiveTab('credit');
      } else if (key === 'i') {
        setActiveTab('inventory');
      } else if (key === 'r') {
        setActiveTab('reports');
      } else if (key === 'c') {
        setIsCashRegisterOpen(true);
      } else if (key === 's') {
        setIsSettingsOpen(true);
      } else if (key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShortcutsOpen,
    isSettingsOpen,
    isBackupOpen,
    isCashRegisterOpen,
    confirmModal.isOpen,
    today,
    settings.milkTeaPrice,
    settings.blackTeaPrice,
  ]);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-16 md:pb-6">
      {/* Top Navigation Bar with Desktop Tabs & Mobile Actions */}
      <Navbar
        shopName={settings.shopName}
        user={user}
        isOnline={isOnline}
        onLogin={loginWithGoogle}
        onLogout={logoutUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenCashRegister={() => setIsCashRegisterOpen(true)}
        cashBalance={cashBalance}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unpaidCreditsCount={unpaidCreditsCount}
        lowStockCount={lowStockCount}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            todaySales={todaySales}
            todayExpenses={todayExpenses}
            allCustomers={customers}
            inventoryItems={inventory}
            cashBalance={cashBalance}
            milkTeaPrice={settings.milkTeaPrice}
            blackTeaPrice={settings.blackTeaPrice}
            onQuickSale={handleAddSale}
            onNavigateTab={setActiveTab}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === 'sales' && (
          <SalesManager
            sales={sales}
            customers={customers}
            milkTeaPrice={settings.milkTeaPrice}
            blackTeaPrice={settings.blackTeaPrice}
            customProducts={customProducts}
            settings={settings}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseManager
            expenses={expenses}
            customCategories={customCategories}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'credit' && (
          <CreditManager
            customers={customers}
            creditTransactions={creditTransactions}
            settings={settings}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddCreditTransaction={handleAddCreditTransaction}
            onUpdateCreditTransaction={handleUpdateCreditTransaction}
            onDeleteCreditTransaction={handleDeleteCreditTransaction}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventoryItems={inventory}
            onSaveItem={handleSaveInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            onAutoAddExpense={async (cat, label, amount, notes) => {
              await handleAddExpense({
                date: today,
                category: cat,
                categoryLabel: label,
                amount,
                isInventoryPurchase: true,
                notes,
              });
            }}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            sales={sales}
            expenses={expenses}
            creditTransactions={creditTransactions}
            settings={settings}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unpaidCreditsCount={unpaidCreditsCount}
        lowStockCount={lowStockCount}
      />

      {/* Cash Register Modal */}
      <CashRegister
        isOpen={isCashRegisterOpen}
        onClose={() => setIsCashRegisterOpen(false)}
        cashEntries={cashEntries}
        todaySales={todaySales}
        todayExpenses={todayExpenses}
        todayCreditTransactions={todayCreditTransactions}
        onAddCashEntry={handleAddCashEntry}
        onDeleteCashEntry={handleDeleteCashEntry}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onResetDemoData={handleResetDemoData}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        fullData={{
          sales,
          expenses,
          customers,
          creditTransactions,
          inventory,
          cashEntries,
          settings,
        }}
        onRestoreData={handleRestoreData}
      />

      {/* Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
