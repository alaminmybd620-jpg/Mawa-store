import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Coffee,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Sale, Expense, CustomerCredit, InventoryItem } from '../types';
import { formatTaka, formatBengaliTime, getTodayDateString } from '../utils/format';

interface DashboardProps {
  todaySales: Sale[];
  todayExpenses: Expense[];
  allCustomers: CustomerCredit[];
  inventoryItems: InventoryItem[];
  cashBalance: number;
  milkTeaPrice: number;
  blackTeaPrice: number;
  onQuickSale: (sale: Omit<Sale, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  onNavigateTab: (tab: any) => void;
  onDeleteSale: (saleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  todaySales,
  todayExpenses,
  allCustomers,
  inventoryItems,
  cashBalance,
  milkTeaPrice,
  blackTeaPrice,
  onQuickSale,
  onNavigateTab,
  onDeleteSale,
}) => {
  // Quick Tea Sales State
  const [milkTeaCount, setMilkTeaCount] = useState<number>(1);
  const [blackTeaCount, setBlackTeaCount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'bkash'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string>('');

  // Calculations for Today
  const totalSalesToday = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.totalAmount, 0);
  const creditSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'credit')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const totalExpensesToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
  const inventoryPurchasesToday = todayExpenses
    .filter((e) => e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);
  const operatingExpensesToday = todayExpenses
    .filter((e) => !e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);

  // Profit calculation: Total Sales minus (Operating Expenses + Inventory Purchases today)
  // Ensures inventory purchases are not counted twice
  const estimatedProfitToday = totalSalesToday - totalExpensesToday;

  // Cups count
  const milkTeaCupsSold = todaySales
    .filter((s) => s.itemType === 'milk_tea')
    .reduce((acc, s) => acc + s.quantity, 0);
  const blackTeaCupsSold = todaySales
    .filter((s) => s.itemType === 'black_tea')
    .reduce((acc, s) => acc + s.quantity, 0);

  // Quick total for the active counter
  const activeOrderTotal = milkTeaCount * milkTeaPrice + blackTeaCount * blackTeaPrice;

  // Handle Quick Tea Order Submit
  const handleQuickOrder = async () => {
    if (activeOrderTotal <= 0) return;
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      alert('অনুগ্রহ করে বাকি রাখার জন্য গ্রাহকের নাম নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = getTodayDateString();
      const customer = allCustomers.find((c) => c.id === selectedCustomerId);

      // Add Milk Tea Sale if count > 0
      if (milkTeaCount > 0) {
        await onQuickSale({
          date: today,
          itemName: 'দুধ চা',
          itemType: 'milk_tea',
          quantity: milkTeaCount,
          unitPrice: milkTeaPrice,
          totalAmount: milkTeaCount * milkTeaPrice,
          paymentMethod,
          customerName: customer ? customer.customerName : undefined,
          customerId: customer ? customer.id : undefined,
        });
      }

      // Add Black Tea Sale if count > 0
      if (blackTeaCount > 0) {
        await onQuickSale({
          date: today,
          itemName: 'লাল চা / রং চা',
          itemType: 'black_tea',
          quantity: blackTeaCount,
          unitPrice: blackTeaPrice,
          totalAmount: blackTeaCount * blackTeaPrice,
          paymentMethod,
          customerName: customer ? customer.customerName : undefined,
          customerId: customer ? customer.id : undefined,
        });
      }

      // Reset counter
      setMilkTeaCount(1);
      setBlackTeaCount(0);
      setPaymentMethod('cash');
      setSelectedCustomerId('');

      setShowSuccessToast(`৳ ${activeOrderTotal} বিক্রি সফলভাবে যুক্ত হয়েছে!`);
      setTimeout(() => setShowSuccessToast(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check low stock items
  const lowStockItems = inventoryItems.filter(
    (item) => item.currentStock <= item.minAlertStock
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div
          onClick={() => onNavigateTab('inventory')}
          className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-800">
                মজুদ সতর্কবার্তা ({lowStockItems.length}টি কাঁচামাল কম আছে)
              </p>
              <p className="text-[11px] text-rose-600">
                {lowStockItems.map((i) => `${i.itemName} (${i.currentStock} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
        </div>
      )}

      {/* KPI Cards: 4 Summary Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Today's Total Sales */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-500">আজকের মোট বিক্রি</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatTaka(totalSalesToday)}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-stone-500">
            <span className="text-emerald-600 font-medium">নগদ: {formatTaka(cashSalesToday)}</span>
            {creditSalesToday > 0 && (
              <span className="text-rose-600 font-medium">বাকি: {formatTaka(creditSalesToday)}</span>
            )}
          </div>
        </div>

        {/* 2. Today's Total Expenses */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-500">আজকের মোট খরচ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatTaka(totalExpensesToday)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-stone-500">
            <span>স্টক: {formatTaka(inventoryPurchasesToday)}</span>
            <span>•</span>
            <span>দোকান: {formatTaka(operatingExpensesToday)}</span>
          </div>
        </div>

        {/* 3. Estimated Profit */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-500">আনুমানিক নিট লাভ</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                estimatedProfitToday >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-lg sm:text-2xl font-extrabold tracking-tight ${
              estimatedProfitToday >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatTaka(estimatedProfitToday)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1.5">
            {estimatedProfitToday >= 0 ? 'লাভের অবস্থায় আছে' : 'খরচ বেশি হয়েছে'}
          </p>
        </div>

        {/* 4. Cash in Register / Drawer */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-500">ড্রয়ারে মোট ক্যাশ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold text-blue-700 tracking-tight">
            {formatTaka(cashBalance)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1.5">বর্তমান ক্যাশ ব্যালেন্স</p>
        </div>
      </div>

      {/* Desktop Split View: Counter & Actions on Left (7 cols), Recent Stream on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: QUICK SALES ENTRY CARD + Action Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* QUICK SALES ENTRY CARD: Optimized for Bangladeshi Tea Stall Rush Hours */}
          <div className="bg-gradient-to-br from-amber-900 to-amber-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-amber-800/80">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/30 flex items-center justify-center text-amber-300">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">দ্রুত চা বিক্রি এন্ট্রি</h2>
              <p className="text-[11px] text-amber-200/70">এক ক্লিকে কাপ যোগ করে বিক্রি সম্পন্ন করুন</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-amber-200/80">আজকের কাপ:</span>
            <p className="text-xs font-bold text-amber-300">
              দুধ: {milkTeaCupsSold} | লাল: {blackTeaCupsSold}
            </p>
          </div>
        </div>

        {/* Tea Counter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Milk Tea Counter */}
          <div className="bg-amber-900/70 border border-amber-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-300" />
                <span className="font-bold text-white text-sm sm:text-base">দুধ চা</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-700/80 text-amber-200">
                ৳ {milkTeaPrice} / কাপ
              </span>
            </div>

            {/* Counter Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMilkTeaCount((prev) => Math.max(0, prev - 1))}
                  className="w-9 h-9 rounded-xl bg-amber-800 hover:bg-amber-700 active:scale-90 flex items-center justify-center text-white transition-all shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xl font-extrabold text-white">
                  {milkTeaCount}
                </span>
                <button
                  type="button"
                  onClick={() => setMilkTeaCount((prev) => prev + 1)}
                  className="w-9 h-9 rounded-xl bg-amber-800 hover:bg-amber-700 active:scale-90 flex items-center justify-center text-white transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMilkTeaCount(preset)}
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                      milkTeaCount === preset
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'bg-amber-800/80 hover:bg-amber-800 text-amber-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-right text-xs font-semibold text-amber-200">
              মোট: ৳ {milkTeaCount * milkTeaPrice}
            </div>
          </div>

          {/* Black Tea Counter */}
          <div className="bg-amber-900/70 border border-amber-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-sm sm:text-base">লাল চা / রং চা</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-700/80 text-amber-200">
                ৳ {blackTeaPrice} / কাপ
              </span>
            </div>

            {/* Counter Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBlackTeaCount((prev) => Math.max(0, prev - 1))}
                  className="w-9 h-9 rounded-xl bg-amber-800 hover:bg-amber-700 active:scale-90 flex items-center justify-center text-white transition-all shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xl font-extrabold text-white">
                  {blackTeaCount}
                </span>
                <button
                  type="button"
                  onClick={() => setBlackTeaCount((prev) => prev + 1)}
                  className="w-9 h-9 rounded-xl bg-amber-800 hover:bg-amber-700 active:scale-90 flex items-center justify-center text-white transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBlackTeaCount(preset)}
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                      blackTeaCount === preset
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : 'bg-amber-800/80 hover:bg-amber-800 text-amber-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-right text-xs font-semibold text-amber-200">
              মোট: ৳ {blackTeaCount * blackTeaPrice}
            </div>
          </div>
        </div>

        {/* Payment Method Selector & Customer Credit Selection */}
        <div className="bg-amber-950/60 p-3 rounded-2xl border border-amber-800/50 mb-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-200">পরিশোধের মাধ্যম:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-amber-900/80 text-amber-200 hover:bg-amber-900'
                }`}
              >
                💵 নগদ
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === 'credit'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-amber-900/80 text-amber-200 hover:bg-amber-900'
                }`}
              >
                📒 বাকি
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  paymentMethod === 'bkash'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-amber-900/80 text-amber-200 hover:bg-amber-900'
                }`}
              >
                📱 বিকাশ
              </button>
            </div>
          </div>

          {/* If Credit selected: Choose customer */}
          {paymentMethod === 'credit' && (
            <div className="pt-2 border-t border-amber-800/40">
              <label className="block text-xs text-amber-200 mb-1">
                কার নামে বাকি লিখবেন?
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-amber-900 border border-amber-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value="">-- গ্রাহক নির্বাচন করুন --</option>
                {allCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} (বর্তমান বাকি: ৳ {c.currentBalance})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Submit Big Action Button */}
        <button
          type="button"
          disabled={activeOrderTotal <= 0 || isSubmitting}
          onClick={handleQuickOrder}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span>সংরক্ষণ হচ্ছে...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>বিক্রি জমা দিন (মোট ৳ {activeOrderTotal})</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onNavigateTab('sales')}
          className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-amber-400 flex items-center gap-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">অন্যান্য বিক্রি</p>
            <p className="text-[10px] text-stone-500">সিগারেট ও নাস্তা</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-amber-400 flex items-center gap-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">খরচ লিখুন</p>
            <p className="text-[10px] text-stone-500">দুধ, চা পাতা, চিনি</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('credit')}
          className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-amber-400 flex items-center gap-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">বাকি খাতা</p>
            <p className="text-[10px] text-stone-500">টাকা আদায় ও তালিকা</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3 rounded-2xl border border-stone-200/80 hover:border-amber-400 flex items-center gap-2.5 shadow-2xs hover:shadow-xs transition-all text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">পূর্ণাঙ্গ রিপোর্ট</p>
            <p className="text-[10px] text-stone-500">দৈনিক ও মাসিক লাভ</p>
          </div>
        </button>
        </div>
      </div>

        {/* Right Side: Today's Recent Sales Feed (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              আজকের সাম্প্রতিক বিক্রি ({todaySales.length}টি)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
          >
            সব দেখুন <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaySales.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">আজকে এখনও কোনো বিক্রি এন্ট্রি করা হয়নি।</p>
            <p className="text-xs text-stone-400 mt-1">উপরের বাটনে ক্লিক করে দ্রুত বিক্রি যোগ করুন।</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {todaySales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-stone-50/70 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {sale.quantity}x
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-stone-900">
                      {sale.itemName}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {formatBengaliTime(sale.timestamp)} •{' '}
                      <span
                        className={`font-semibold ${
                          sale.paymentMethod === 'cash'
                            ? 'text-emerald-600'
                            : sale.paymentMethod === 'credit'
                            ? 'text-rose-600'
                            : 'text-pink-600'
                        }`}
                      >
                        {sale.paymentMethod === 'cash'
                          ? 'নগদ'
                          : sale.paymentMethod === 'credit'
                          ? `বাকি (${sale.customerName || 'নামবিহীন'})`
                          : 'বিকাশ'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {formatTaka(sale.totalAmount)}
                  </span>
                  <button
                    onClick={() => onDeleteSale(sale.id)}
                    title="মুছে ফেলুন"
                    className="text-stone-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
