import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  DollarSign,
  Plus,
  Minus,
  History,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Download,
  BookUser,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  Calendar,
  Save,
  CreditCard,
  Share2,
} from 'lucide-react';
import { CustomerCredit, CreditTransaction, ShopSettings } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  formatBengaliTime,
  getTodayDateString,
  exportToCSV,
} from '../utils/format';
import { ReceiptModal } from './ReceiptModal';

interface CreditManagerProps {
  customers: CustomerCredit[];
  creditTransactions: CreditTransaction[];
  settings: ShopSettings;
  onSaveCustomer: (customer: CustomerCredit) => Promise<void>;
  onDeleteCustomer: (customerId: string) => void;
  onAddCreditTransaction: (
    customerId: string,
    type: 'credit_taken' | 'payment_received',
    amount: number,
    notes?: string,
    paymentMethod?: 'cash' | 'bkash'
  ) => Promise<CreditTransaction | void>;
  onUpdateCreditTransaction: (trans: CreditTransaction) => Promise<void>;
  onDeleteCreditTransaction: (transId: string) => void;
}

export const CreditManager: React.FC<CreditManagerProps> = ({
  customers,
  creditTransactions,
  settings,
  onSaveCustomer,
  onDeleteCustomer,
  onAddCreditTransaction,
  onUpdateCreditTransaction,
  onDeleteCreditTransaction,
}) => {
  // Active View: 'customers' (List of customer accounts) or 'history' (All payments & credits log)
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'history'>('customers');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'payment_received' | 'credit_taken'>('all');

  // Add/Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerCredit | null>(null);
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custInitialDue, setCustInitialDue] = useState<number | ''>('');
  const [custNotes, setCustNotes] = useState<string>('');

  // Transaction Modal (Add Due or Collect Payment)
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(null);
  const [txType, setTxType] = useState<'credit_taken' | 'payment_received'>('payment_received');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txMethod, setTxMethod] = useState<'cash' | 'bkash'>('cash');
  const [txNotes, setTxNotes] = useState<string>('');

  // Edit Existing Transaction Modal
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<CreditTransaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState<number | ''>('');
  const [editTxDate, setEditTxDate] = useState<string>('');
  const [editTxNotes, setEditTxNotes] = useState<string>('');
  const [editTxMethod, setEditTxMethod] = useState<'cash' | 'bkash'>('cash');

  // Customer Ledger History Modal
  const [ledgerCustomer, setLedgerCustomer] = useState<CustomerCredit | null>(null);

  // Active Receipt Modal
  const [receiptTx, setReceiptTx] = useState<CreditTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Total Market Due
  const totalMarketDue = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const customersWithDueCount = customers.filter((c) => c.currentBalance > 0).length;

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterDueOnly && c.currentBalance <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.customerName.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [customers, filterDueOnly, searchQuery]);

  // Filtered Transactions History
  const filteredTransactions = useMemo(() => {
    return creditTransactions.filter((tx) => {
      if (historyTypeFilter !== 'all' && tx.type !== historyTypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tx.customerName.toLowerCase().includes(q);
        const matchNotes = tx.notes?.toLowerCase().includes(q);
        const matchReceipt = tx.receiptNo?.toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchReceipt) return false;
      }
      return true;
    });
  }, [creditTransactions, historyTypeFilter, searchQuery]);

  // Open Add Customer
  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustInitialDue('');
    setCustNotes('');
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer
  const openEditCustomer = (c: CustomerCredit) => {
    setEditingCustomer(c);
    setCustName(c.customerName);
    setCustPhone(c.phone || '');
    setCustInitialDue('');
    setCustNotes(c.notes || '');
    setIsCustomerModalOpen(true);
  };

  // Save Customer Submit
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    setIsSubmitting(true);
    try {
      const today = getTodayDateString();
      if (editingCustomer) {
        await onSaveCustomer({
          ...editingCustomer,
          customerName: custName.trim(),
          phone: custPhone.trim(),
          notes: custNotes.trim(),
          lastUpdated: today,
        });
      } else {
        const initialDueNum = Number(custInitialDue) || 0;
        const newId = `cust_${Date.now()}`;
        const newCustomer: CustomerCredit = {
          id: newId,
          userId: '',
          customerName: custName.trim(),
          phone: custPhone.trim(),
          totalDue: initialDueNum,
          totalPaid: 0,
          currentBalance: initialDueNum,
          lastUpdated: today,
          notes: custNotes.trim(),
        };
        await onSaveCustomer(newCustomer);

        if (initialDueNum > 0) {
          await onAddCreditTransaction(newId, 'credit_taken', initialDueNum, 'প্রারম্ভিক বাকি');
        }
      }
      setIsCustomerModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Transaction Modal
  const openTxModal = (customer: CustomerCredit, type: 'credit_taken' | 'payment_received') => {
    setSelectedCustomer(customer);
    setTxType(type);
    setTxAmount(
      type === 'payment_received' && customer.currentBalance > 0 ? customer.currentBalance : ''
    );
    setTxMethod('cash');
    setTxNotes('');
    setIsTxModalOpen(true);
  };

  // Submit Transaction & Show Receipt
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !txAmount || Number(txAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      const createdTx = await onAddCreditTransaction(
        selectedCustomer.id,
        txType,
        Number(txAmount),
        txNotes.trim(),
        txMethod
      );

      setIsTxModalOpen(false);

      // If it was a payment receipt, immediately show the receipt modal!
      if (txType === 'payment_received' && createdTx) {
        setReceiptTx(createdTx);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Transaction Modal
  const openEditTxModal = (tx: CreditTransaction) => {
    setEditingTx(tx);
    setEditTxAmount(tx.amount);
    setEditTxDate(tx.date);
    setEditTxNotes(tx.notes || '');
    setEditTxMethod(tx.paymentMethod || 'cash');
    setIsEditTxModalOpen(true);
  };

  // Submit Edited Transaction
  const handleEditTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editTxAmount || Number(editTxAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onUpdateCreditTransaction({
        ...editingTx,
        amount: Number(editTxAmount),
        date: editTxDate,
        notes: editTxNotes.trim(),
        paymentMethod: editTxMethod,
      });
      setIsEditTxModalOpen(false);
      setEditingTx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Receipt Modal for any transaction
  const handleViewReceipt = (tx: CreditTransaction) => {
    setReceiptTx(tx);
    setIsReceiptModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeSubTab === 'customers') {
      const headers = [
        'গ্রাহকের নাম',
        'মোবাইল নম্বর',
        'মোট বাকি (৳)',
        'পরিশোধিত (৳)',
        'বর্তমান বাকি পাওনা (৳)',
        'সর্বশেষ তারিখ',
      ];
      const rows = filteredCustomers.map((c) => [
        c.customerName,
        c.phone || '',
        c.totalDue,
        c.totalPaid,
        c.currentBalance,
        c.lastUpdated,
      ]);
      exportToCSV('customer_credit_list', headers, rows);
    } else {
      const headers = ['রশিদ নং', 'তারিখ', 'গ্রাহকের নাম', 'ধরন', 'পরিমাণ (৳)', 'মাধ্যম', 'বিবরণ'];
      const rows = filteredTransactions.map((t) => [
        t.receiptNo || t.id,
        t.date,
        t.customerName,
        t.type === 'payment_received' ? 'টাকা পরিশোধ' : 'বাকি গ্রহণ',
        t.amount,
        t.paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ',
        t.notes || '',
      ]);
      exportToCSV('payment_receipts_history', headers, rows);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">বাকি খাতা ও পেমেন্ট হিস্ট্রি</h2>
          <p className="text-xs text-stone-500">
            গ্রাহক তালিকা, টাকা আদায়, রশিদ তৈরি, পরিবর্তন ও লেনদেন খতিয়ান
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
            title="CSV ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV রপ্তানি</span>
          </button>
          <button
            onClick={openAddCustomer}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/20 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন গ্রাহক যোগ</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-4 rounded-2xl shadow-md border border-rose-800">
          <span className="text-xs font-medium text-rose-200">মার্কেটে মোট বাকি পাওনা</span>
          <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-white">
            {formatTaka(totalMarketDue)}
          </p>
          <p className="text-xs text-rose-300 mt-1">
            মোট {customersWithDueCount} জন গ্রাহকের কাছে বাকি পাওনা আছে
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-stone-500">মোট লেনদেন রেকর্ড</span>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {creditTransactions.length}টি রশিদ / এন্ট্রি
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-stone-500">
              নিবন্ধিত গ্রাহক: <span className="font-bold text-stone-800">{customers.length} জন</span>
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher: Customers vs Payment Receipts History */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'customers'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BookUser className="w-4 h-4" />
          <span>বাকি গ্রাহক তালিকা ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'history'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>সকল পেমেন্ট ও রশিদ হিস্ট্রি ({creditTransactions.length})</span>
        </button>
      </div>

      {/* Search & Sub-Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'customers'
                ? 'গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন...'
                : 'রশিদ নং, গ্রাহকের নাম বা নোট দিয়ে খুঁজুন...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {activeSubTab === 'customers' ? (
          <button
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              filterDueOnly
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {filterDueOnly ? '✓ শুধু যাদের বাকি আছে' : 'সব গ্রাহক'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {(['all', 'payment_received', 'credit_taken'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHistoryTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  historyTypeFilter === t
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {t === 'all' ? 'সব' : t === 'payment_received' ? 'আদায়কৃত' : 'বাকি দেওয়া'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: CUSTOMERS LIST */}
      {activeSubTab === 'customers' && (
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              <BookUser className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">কোনো বাকি গ্রাহকের তথ্য পাওয়া যায়নি।</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                {/* Header: Name, phone, and balance */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {customer.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-base">
                        {customer.customerName}
                      </h3>
                      {customer.phone && (
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-stone-500 block">
                      বর্তমান বাকি
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-black ${
                        customer.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatTaka(customer.currentBalance)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Ledger Stats */}
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <span>মোট বাকি নিয়েছে: {formatTaka(customer.totalDue)}</span>
                  <span>মোট পরিশোধ: {formatTaka(customer.totalPaid)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                  {/* Collect Payment */}
                  <button
                    type="button"
                    onClick={() => openTxModal(customer, 'payment_received')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>টাকা আদায়</span>
                  </button>

                  {/* Add Due */}
                  <button
                    type="button"
                    onClick={() => openTxModal(customer, 'credit_taken')}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>বাকি দিন (+)</span>
                  </button>

                  {/* View Ledger */}
                  <button
                    type="button"
                    onClick={() => setLedgerCustomer(customer)}
                    title="খতিয়ান ও রশিদ দেখুন"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-95 transition-all"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditCustomer(customer)}
                    title="গ্রাহকের তথ্য পরিবর্তন"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-95 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDeleteCustomer(customer.id)}
                    title="গ্রাহক মুছে ফেলুন"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: ALL PAYMENT RECEIPTS & TRANSACTIONS HISTORY (WITH EDIT/DELETE/RECEIPT) */}
      {activeSubTab === 'history' && (
        <div className="space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">কোনো লেনদেন রশিদ পাওয়া যায়নি।</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 ${
                      tx.type === 'payment_received'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tx.type === 'payment_received' ? 'আদায়' : 'বাকি'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {tx.customerName}
                      </h4>
                      <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">
                        {tx.receiptNo || tx.id.slice(-6).toUpperCase()}
                      </span>
                      {tx.paymentMethod && (
                        <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          {tx.paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      তারিখ: {formatBengaliDate(tx.date)}{' '}
                      {tx.timestamp && `• ${formatBengaliTime(tx.timestamp)}`}
                    </p>
                    {tx.notes && (
                      <p className="text-[11px] text-stone-600 mt-0.5 italic">
                        নোট: {tx.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      tx.type === 'payment_received' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'payment_received' ? '-' : '+'}
                    {formatTaka(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View / Print Receipt */}
                    <button
                      type="button"
                      onClick={() => handleViewReceipt(tx)}
                      title="রশিদ দেখুন ও প্রিন্ট করুন"
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>রশিদ</span>
                    </button>

                    {/* Edit Transaction */}
                    <button
                      type="button"
                      onClick={() => openEditTxModal(tx)}
                      title="লেনদেন সংশোধন করুন"
                      className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Transaction */}
                    <button
                      type="button"
                      onClick={() => onDeleteCreditTransaction(tx.id)}
                      title="লেনদেন মুছে ফেলুন"
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingCustomer ? 'গ্রাহকের তথ্য সম্পাদনা' : 'নতুন বাকি গ্রাহক যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  গ্রাহকের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোশাররফ হোসেন"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মোবাইল নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="tel"
                  placeholder="০১XXXXXXXXX"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পূর্বের প্রারম্ভিক বাকি থাকলে (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={custInitialDue}
                    onChange={(e) =>
                      setCustInitialDue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  নোট / ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পাশের মুদি দোকানের কর্মচারী"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 shadow-md shadow-amber-900/20"
                >
                  {isSubmitting
                    ? 'সংরক্ষণ হচ্ছে...'
                    : editingCustomer
                    ? 'আপডেট করুন'
                    : 'গ্রাহক সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Payment or Due) */}
      {isTxModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {txType === 'payment_received' ? 'টাকা আদায় / জমা নিন' : 'নতুন বাকি লিখুন'}
                </h3>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">
                  গ্রাহক: {selectedCustomer.customerName} (বর্তমান বাকি:{' '}
                  {formatTaka(selectedCustomer.currentBalance)})
                </p>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: ১০০"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-lg font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Payment Method Selector */}
              {txType === 'payment_received' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    টাকা আদায়ের মাধ্যম
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxMethod('cash')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        txMethod === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      💵 নগদ ক্যাশ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxMethod('bkash')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                        txMethod === 'bkash'
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      📱 বিকাশ / অনলাইন
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিবরণ / নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: চা ও বিস্কুট বাবদ বা নগদ পরিশোধ"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {txType === 'payment_received' && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800">
                  ✓ জমা সম্পন্ন হলে সরাসরি প্রিন্ট ও শেয়ারযোগ্য অফিসিয়াল পেমেন্ট রশিদ তৈরি হবে।
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                    txType === 'payment_received'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                  }`}
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL (For modifying existing payments / credit entries) */}
      {isEditTxModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">লেনদেন তথ্য সংশোধন করুন</h3>
                <p className="text-xs text-stone-500">গ্রাহক: {editingTx.customerName}</p>
              </div>
              <button
                onClick={() => setIsEditTxModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  সংশোধিত টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editTxAmount}
                  onChange={(e) =>
                    setEditTxAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  তারিখ পরিবর্তন
                </label>
                <input
                  type="date"
                  required
                  value={editTxDate}
                  onChange={(e) => setEditTxDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পরিশোধের মাধ্যম
                </label>
                <select
                  value={editTxMethod}
                  onChange={(e) => setEditTxMethod(e.target.value as 'cash' | 'bkash')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="cash">নগদ ক্যাশ</option>
                  <option value="bkash">বিকাশ / অনলাইন</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">বিবরণ / নোট</label>
                <input
                  type="text"
                  value={editTxNotes}
                  onChange={(e) => setEditTxNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditTxModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 shadow-md shadow-amber-900/20"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger History Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {ledgerCustomer.customerName} - লেনদেন খতিয়ান
                </h3>
                <p className="text-xs text-stone-500">
                  বর্তমান বাকি পাওনা:{' '}
                  <span className="font-bold text-rose-600">
                    {formatTaka(ledgerCustomer.currentBalance)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ledger Transactions List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {creditTransactions.filter((tx) => tx.customerId === ledgerCustomer.id).length ===
              0 ? (
                <p className="text-center py-6 text-xs text-stone-400">
                  এই গ্রাহকের কোনো পৃথক লেনদেন লগ পাওয়া যায়নি।
                </p>
              ) : (
                creditTransactions
                  .filter((tx) => tx.customerId === ledgerCustomer.id)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl border border-stone-100 bg-stone-50 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            tx.type === 'payment_received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type === 'payment_received' ? 'জমা' : 'বাকি'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            {tx.type === 'payment_received' ? 'টাকা পরিশোধ' : 'নতুন বাকি গ্রহণ'}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            তারিখ: {formatBengaliDate(tx.date)} {tx.notes && `• ${tx.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black ${
                            tx.type === 'payment_received' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'payment_received' ? '-' : '+'}
                          {formatTaka(tx.amount)}
                        </span>

                        {/* View Receipt */}
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(tx)}
                          title="রশিদ দেখুন"
                          className="p-1 rounded-md bg-stone-200 text-stone-700 hover:bg-stone-300"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Tx */}
                        <button
                          type="button"
                          onClick={() => openEditTxModal(tx)}
                          title="সংশোধন করুন"
                          className="p-1 rounded-md bg-stone-200 text-stone-700 hover:bg-stone-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Tx */}
                        <button
                          type="button"
                          onClick={() => onDeleteCreditTransaction(tx.id)}
                          title="মুছে ফেলুন"
                          className="p-1 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs text-stone-500">
                মোট পরিশোধিত: {formatTaka(ledgerCustomer.totalPaid)}
              </span>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-white text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER RECEIPT MODAL */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptTx(null);
        }}
        transaction={receiptTx}
        customer={customers.find((c) => c.id === receiptTx?.customerId)}
        settings={settings}
      />
    </div>
  );
};
