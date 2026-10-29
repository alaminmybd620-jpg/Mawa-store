import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Filter,
  Download,
  Trash2,
  Edit2,
  Coffee,
  Check,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import { Sale, CustomerCredit, CustomProduct, ShopSettings } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  formatBengaliTime,
  getTodayDateString,
  exportToCSV,
} from '../utils/format';
import { SaleMemoModal } from './SaleMemoModal';
import { Receipt } from 'lucide-react';

interface SalesManagerProps {
  sales: Sale[];
  customers: CustomerCredit[];
  milkTeaPrice: number;
  blackTeaPrice: number;
  customProducts: CustomProduct[];
  settings: ShopSettings;
  onAddSale: (sale: Omit<Sale, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  onUpdateSale: (sale: Sale) => Promise<void>;
  onDeleteSale: (saleId: string) => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({
  sales,
  customers,
  milkTeaPrice,
  blackTeaPrice,
  customProducts,
  settings,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
}) => {
  // Memo Modal State
  const [memoSale, setMemoSale] = useState<Sale | null>(null);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);
  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'credit' | 'bkash'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form State
  const [formItemType, setFormItemType] = useState<'milk_tea' | 'black_tea' | 'custom'>('milk_tea');
  const [formItemName, setFormItemName] = useState<string>('দুধ চা');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(milkTeaPrice);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cash' | 'credit' | 'bkash'>('cash');
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(getTodayDateString());
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Preset Selection in Form
  const handleItemSelect = (type: 'milk_tea' | 'black_tea' | 'custom', name: string, price: number) => {
    setFormItemType(type);
    setFormItemName(name);
    setFormUnitPrice(price);
  };

  const openAddModal = () => {
    setEditingSale(null);
    setFormItemType('milk_tea');
    setFormItemName('দুধ চা');
    setFormQuantity(1);
    setFormUnitPrice(milkTeaPrice);
    setFormPaymentMethod('cash');
    setFormCustomerId('');
    setFormDate(getTodayDateString());
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setFormItemType(sale.itemType);
    setFormItemName(sale.itemName);
    setFormQuantity(sale.quantity);
    setFormUnitPrice(sale.unitPrice);
    setFormPaymentMethod(sale.paymentMethod);
    setFormCustomerId(sale.customerId || '');
    setFormDate(sale.date);
    setFormNotes(sale.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formQuantity <= 0 || formUnitPrice < 0) return;

    if (formPaymentMethod === 'credit' && !formCustomerId) {
      alert('বাকি বিক্রির জন্য গ্রাহক নির্বাচন করা আবশ্যক।');
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === formCustomerId);
      const totalAmount = formQuantity * formUnitPrice;

      if (editingSale) {
        await onUpdateSale({
          ...editingSale,
          itemName: formItemName,
          itemType: formItemType,
          quantity: formQuantity,
          unitPrice: formUnitPrice,
          totalAmount,
          paymentMethod: formPaymentMethod,
          customerId: customer?.id,
          customerName: customer?.customerName,
          date: formDate,
          notes: formNotes,
        });
      } else {
        await onAddSale({
          date: formDate,
          itemName: formItemName,
          itemType: formItemType,
          quantity: formQuantity,
          unitPrice: formUnitPrice,
          totalAmount,
          paymentMethod: formPaymentMethod,
          customerId: customer?.id,
          customerName: customer?.customerName,
          notes: formNotes,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Sales Logic
  const filteredSales = useMemo(() => {
    const today = getTodayDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    return sales.filter((s) => {
      // Date filter
      if (dateFilter === 'today' && s.date !== today) return false;
      if (dateFilter === 'yesterday' && s.date !== yesterday) return false;
      if (dateFilter === 'custom' && s.date !== customDate) return false;

      // Payment filter
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchItem = s.itemName.toLowerCase().includes(query);
        const matchCustomer = s.customerName?.toLowerCase().includes(query);
        const matchNotes = s.notes?.toLowerCase().includes(query);
        if (!matchItem && !matchCustomer && !matchNotes) return false;
      }

      return true;
    });
  }, [sales, dateFilter, customDate, paymentFilter, searchQuery]);

  const totalFilteredAmount = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalFilteredCups = filteredSales
    .filter((s) => s.itemType === 'milk_tea' || s.itemType === 'black_tea')
    .reduce((acc, s) => acc + s.quantity, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['তারিখ', 'সময়', 'আইটেমের নাম', 'পরিমাণ', 'একক দর (৳)', 'মোট টাকা (৳)', 'পরিশোধ মাধ্যম', 'গ্রাহকের নাম', 'নোট'];
    const rows = filteredSales.map((s) => [
      s.date,
      formatBengaliTime(s.timestamp),
      s.itemName,
      s.quantity,
      s.unitPrice,
      s.totalAmount,
      s.paymentMethod === 'cash' ? 'নগদ' : s.paymentMethod === 'credit' ? 'বাকি' : 'বিকাশ',
      s.customerName || '',
      s.notes || '',
    ]);
    exportToCSV(`tea_shop_sales_${dateFilter}`, headers, rows);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">বিক্রির খাতা</h2>
          <p className="text-xs text-stone-500">চা, সিগারেট ও নাস্তা বিক্রির পূর্ণাঙ্গ তালিকা</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
            title="এক্সেল বা সিএসভি ডাউনলোড"
          >
            <Download className="w-4 h-4" />
            <span>CSV রপ্তানি</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিক্রি যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Summary Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        {/* Date Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'today'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            আজ
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'yesterday'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            গতকাল
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'all'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            সব তারিখ
          </button>
          <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
              className="text-xs bg-transparent text-stone-800 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        {/* Search & Payment Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্য বা কাস্টমারের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-[11px] text-stone-500 shrink-0">পরিশোধ:</span>
            {(['all', 'cash', 'credit', 'bkash'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentFilter(method)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  paymentFilter === method
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {method === 'all' ? 'সব' : method === 'cash' ? 'নগদ' : method === 'credit' ? 'বাকি' : 'বিকাশ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Statistics Pill */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-amber-800 font-medium">নির্বাচিত বিক্রির মোট:</span>
          <p className="text-base sm:text-lg font-extrabold text-amber-950">
            {formatTaka(totalFilteredAmount)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-amber-800 font-medium">মোট এন্ট্রি:</span>
          <p className="text-sm font-bold text-amber-950">
            {filteredSales.length}টি {totalFilteredCups > 0 && `(${totalFilteredCups} কাপ চা)`}
          </p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">এই ফিল্টারে কোনো বিক্রির তথ্য পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex flex-col items-center justify-center shrink-0 border border-amber-100">
                    <span className="text-xs font-black leading-none">{sale.quantity}x</span>
                    <span className="text-[9px] text-amber-700">কাপ/পিস</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {sale.itemName}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sale.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentMethod === 'credit'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {sale.paymentMethod === 'cash'
                          ? 'নগদ'
                          : sale.paymentMethod === 'credit'
                          ? `বাকি: ${sale.customerName || 'নামবিহীন'}`
                          : 'বিকাশ'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      দর: ৳{sale.unitPrice} • তারিখ: {formatBengaliDate(sale.date)} • {formatBengaliTime(sale.timestamp)}
                    </p>
                    {sale.notes && (
                      <p className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                        নোট: {sale.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-extrabold text-stone-900">
                    {formatTaka(sale.totalAmount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setMemoSale(sale);
                        setIsMemoOpen(true);
                      }}
                      title="ক্যাশ মেমো / রশিদ দেখুন"
                      className="p-1.5 text-stone-500 hover:text-amber-900 rounded-lg hover:bg-amber-50 transition-all flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">মেমো</span>
                    </button>
                    <button
                      onClick={() => openEditModal(sale)}
                      title="সম্পাদনা করুন"
                      className="p-1.5 text-stone-400 hover:text-amber-800 rounded-lg hover:bg-stone-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSale(sale.id)}
                      title="মুছে ফেলুন"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingSale ? 'বিক্রি সম্পাদনা করুন' : 'নতুন বিক্রি যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  দ্রুত নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleItemSelect('milk_tea', 'দুধ চা', milkTeaPrice)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      formItemName === 'দুধ চা'
                        ? 'bg-amber-100 border-amber-500 text-amber-900'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>☕ দুধ চা</span>
                    <span>৳{milkTeaPrice}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleItemSelect('black_tea', 'লাল চা / রং চা', blackTeaPrice)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      formItemName.includes('লাল চা')
                        ? 'bg-amber-100 border-amber-500 text-amber-900'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🍵 লাল চা / রং চা</span>
                    <span>৳{blackTeaPrice}</span>
                  </button>
                </div>

                {/* Custom products chips */}
                {customProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {customProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleItemSelect('custom', p.name, p.price)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          formItemName === p.name
                            ? 'bg-amber-800 text-white border-amber-800'
                            : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {p.name} (৳{p.price})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  আইটেম / পণ্যের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  placeholder="যেমন: দুধ চা, বিস্কুট, বেনসন সিগারেট"
                />
              </div>

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পরিমাণ (কাপ / পিস) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    একক দর (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Computed Total Banner */}
              <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">মোট মূল্য:</span>
                <span className="text-base font-black text-amber-950">
                  ৳ {formQuantity * formUnitPrice}
                </span>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  পরিশোধের মাধ্যম *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formPaymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    💵 নগদ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('credit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formPaymentMethod === 'credit'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    📒 বাকি
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPaymentMethod('bkash')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      formPaymentMethod === 'bkash'
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    📱 বিকাশ
                  </button>
                </div>
              </div>

              {/* Customer Selector if Credit */}
              {formPaymentMethod === 'credit' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বাকি গ্রাহক নির্বাচন করুন *
                  </label>
                  <select
                    required
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- গ্রাহক নির্বাচন করুন --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName} (বর্তমান বাকি: ৳{c.currentBalance})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="বিবরণ..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 shadow-md shadow-amber-900/20"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingSale ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Memo Modal */}
      <SaleMemoModal
        isOpen={isMemoOpen}
        onClose={() => {
          setIsMemoOpen(false);
          setMemoSale(null);
        }}
        sale={memoSale}
        settings={settings}
      />
    </div>
  );
};
