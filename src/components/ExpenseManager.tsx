import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Download,
  Trash2,
  Edit2,
  TrendingDown,
  X,
  Boxes,
  Zap,
} from 'lucide-react';
import { Expense, ExpenseCategory, CustomCategory } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  formatBengaliTime,
  getTodayDateString,
  exportToCSV,
  CATEGORY_LABELS,
} from '../utils/format';

interface ExpenseManagerProps {
  expenses: Expense[];
  customCategories?: CustomCategory[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  onUpdateExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  customCategories = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  // Filters
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<string>('milk');
  const [formCategoryLabel, setFormCategoryLabel] = useState<string>('তরল / গুঁড়া দুধ');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDate, setFormDate] = useState<string>(getTodayDateString());
  const [formIsInventory, setFormIsInventory] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Merge built-in and custom categories
  const allCategories = useMemo(() => {
    const list: { key: string; label: string; isInv: boolean }[] = Object.entries(CATEGORY_LABELS).map(
      ([key, label]) => ({
        key,
        label,
        isInv: ['milk', 'tea_leaves', 'sugar', 'cups', 'cigarettes', 'snacks'].includes(key),
      })
    );
    for (const cat of customCategories) {
      if (!list.some((item) => item.key === cat.key)) {
        list.push({ key: cat.key, label: cat.label, isInv: cat.isInventory });
      }
    }
    return list;
  }, [customCategories]);

  const handleCategorySelect = (catKey: string, label: string, isInv: boolean) => {
    setFormCategory(catKey);
    setFormCategoryLabel(label);
    setFormIsInventory(isInv);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormCategory('milk');
    setFormCategoryLabel('তরল / গুঁড়া দুধ');
    setFormAmount('');
    setFormDate(getTodayDateString());
    setFormIsInventory(true);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormCategory(expense.category);
    setFormCategoryLabel(expense.categoryLabel || CATEGORY_LABELS[expense.category] || expense.category);
    setFormAmount(expense.amount);
    setFormDate(expense.date);
    setFormIsInventory(Boolean(expense.isInventoryPurchase));
    setFormNotes(expense.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      const categoryLabel =
        formCategoryLabel ||
        allCategories.find((c) => c.key === formCategory)?.label ||
        CATEGORY_LABELS[formCategory] ||
        'অন্যান্য';

      if (editingExpense) {
        await onUpdateExpense({
          ...editingExpense,
          category: formCategory,
          categoryLabel,
          amount: Number(formAmount),
          date: formDate,
          isInventoryPurchase: formIsInventory,
          notes: formNotes,
        });
      } else {
        await onAddExpense({
          category: formCategory,
          categoryLabel,
          amount: Number(formAmount),
          date: formDate,
          isInventoryPurchase: formIsInventory,
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

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    const today = getTodayDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    return expenses.filter((e) => {
      if (dateFilter === 'today' && e.date !== today) return false;
      if (dateFilter === 'yesterday' && e.date !== yesterday) return false;
      if (dateFilter === 'custom' && e.date !== customDate) return false;

      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchLabel = e.categoryLabel?.toLowerCase().includes(query);
        const matchNotes = e.notes?.toLowerCase().includes(query);
        if (!matchLabel && !matchNotes) return false;
      }

      return true;
    });
  }, [expenses, dateFilter, customDate, categoryFilter, searchQuery]);

  const totalFilteredAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const inventoryPurchasesTotal = filteredExpenses
    .filter((e) => e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);
  const operatingExpensesTotal = filteredExpenses
    .filter((e) => !e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['তারিখ', 'ক্যাটাগরি', 'প্রকার', 'পরিমাণ (৳)', 'নোট'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      e.categoryLabel,
      e.isInventoryPurchase ? 'কাঁচামাল/স্টক ক্রয়' : 'দোকান পরিচালনা খরচ',
      e.amount,
      e.notes || '',
    ]);
    exportToCSV(`tea_shop_expenses_${dateFilter}`, headers, rows);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">খরচ ও ক্রয়ের খাতা</h2>
          <p className="text-xs text-stone-500">
            দুধ, চা পাতা, চিনি, বিদ্যুৎ বিল, বেতন ও বিবিধ খরচ হিসাব
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
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-900/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন খরচ লিখুন</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-medium text-stone-500">মোট খরচ ও ক্রয়</span>
          <p className="text-lg sm:text-xl font-extrabold text-rose-700">
            {formatTaka(totalFilteredAmount)}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-medium text-stone-500">কাঁচামাল ও স্টক ক্রয়</span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-800">
            {formatTaka(inventoryPurchasesTotal)}
          </p>
          <span className="text-[10px] text-stone-400">দুধ, চা পাতা, চিনি, কাপ, সিগারেট</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-medium text-stone-500">দোকান পরিচালনা খরচ</span>
          <p className="text-lg sm:text-xl font-extrabold text-stone-800">
            {formatTaka(operatingExpensesTotal)}
          </p>
          <span className="text-[10px] text-stone-400">বিদ্যুৎ, ভাড়া, বেতন, গ্যাস</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        {/* Date Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'today'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            আজ
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'yesterday'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            গতকাল
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === 'all'
                ? 'bg-rose-700 text-white shadow-xs'
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

        {/* Category & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="খরচের বিবরণ দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-48 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">সব ক্যাটাগরি</option>
              {allCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">এই ফিল্টারে কোনো খরচের তথ্য পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      expense.isInventoryPurchase
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {expense.isInventoryPurchase ? (
                      <Boxes className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        {expense.categoryLabel}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          expense.isInventoryPurchase
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {expense.isInventoryPurchase ? 'কাঁচামাল / স্টক' : 'পরিচালনা খরচ'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">
                      তারিখ: {formatBengaliDate(expense.date)} • {formatBengaliTime(expense.timestamp)}
                    </p>
                    {expense.notes && (
                      <p className="text-[11px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                        নোট: {expense.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-extrabold text-rose-700">
                    -{formatTaka(expense.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(expense)}
                      title="সম্পাদনা করুন"
                      className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
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

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingExpense ? 'খরচ সম্পাদনা করুন' : 'নতুন খরচ বা ক্রয় লিখুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Category Quick Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  ক্যাটাগরি নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-2xl">
                  {allCategories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleCategorySelect(c.key, c.label, c.isInv)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        formCategory === c.key
                          ? 'bg-rose-100 border-rose-500 text-rose-900'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: ৩৫০"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Inventory purchase flag */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsInventory}
                    onChange={(e) => setFormIsInventory(e.target.checked)}
                    className="mt-1 w-4 h-4 text-amber-700 rounded-sm border-stone-300 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      এটি কি কাঁচামাল / পণ্য ক্রয়?
                    </span>
                    <span className="text-[11px] text-amber-800 leading-tight block">
                      টিক দিলে এটি কাঁচামাল/স্টক ক্রয় হিসেবে হিসাব হবে এবং নিট লাভ সঠিকভাবে গণনা করবে
                    </span>
                  </div>
                </label>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="বিবরণ..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                  className="flex-1 py-2.5 rounded-xl bg-rose-700 text-white font-bold text-sm hover:bg-rose-800 shadow-md shadow-rose-900/20"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingExpense ? 'আপডেট করুন' : 'খরচ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
