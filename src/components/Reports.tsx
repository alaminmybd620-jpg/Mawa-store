import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Coffee,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { Sale, Expense, CreditTransaction, ShopSettings } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  getTodayDateString,
  exportToCSV,
  CATEGORY_LABELS,
} from '../utils/format';

interface ReportsProps {
  sales: Sale[];
  expenses: Expense[];
  creditTransactions: CreditTransaction[];
  settings: ShopSettings;
}

export const Reports: React.FC<ReportsProps> = ({
  sales,
  expenses,
  creditTransactions,
  settings,
}) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());

  // Compute Active Date Range
  const { filterStart, filterEnd, periodLabel } = useMemo(() => {
    const today = getTodayDateString();
    const now = new Date();

    if (period === 'today') {
      return { filterStart: today, filterEnd: today, periodLabel: 'আজকের হিসাব' };
    }

    if (period === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { filterStart: yStr, filterEnd: yStr, periodLabel: 'গতকালকের হিসাব' };
    }

    if (period === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 6);
      const startStr = startOfWeek.toISOString().split('T')[0];
      return { filterStart: startStr, filterEnd: today, periodLabel: 'গত ৭ দিনের হিসাব' };
    }

    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = startOfMonth.toISOString().split('T')[0];
      return { filterStart: startStr, filterEnd: today, periodLabel: 'চলতি মাসের হিসাব' };
    }

    return { filterStart: startDate, filterEnd: endDate, periodLabel: `${startDate} থেকে ${endDate}` };
  }, [period, startDate, endDate]);

  // Filtered Datasets
  const periodSales = useMemo(() => {
    return sales.filter((s) => s.date >= filterStart && s.date <= filterEnd);
  }, [sales, filterStart, filterEnd]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= filterStart && e.date <= filterEnd);
  }, [expenses, filterStart, filterEnd]);

  const periodCredits = useMemo(() => {
    return creditTransactions.filter((c) => c.date >= filterStart && c.date <= filterEnd);
  }, [creditTransactions, filterStart, filterEnd]);

  // Calculations
  const totalSales = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashSales = periodSales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.totalAmount, 0);
  const creditSales = periodSales
    .filter((s) => s.paymentMethod === 'credit')
    .reduce((acc, s) => acc + s.totalAmount, 0);
  const bkashSales = periodSales
    .filter((s) => s.paymentMethod === 'bkash')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  // Separate Material / Inventory purchases from Operating Expenses
  // To avoid counting inventory purchases twice in calculations!
  const inventoryPurchases = periodExpenses
    .filter((e) => e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);

  const operatingExpenses = periodExpenses
    .filter((e) => !e.isInventoryPurchase)
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = inventoryPurchases + operatingExpenses;

  // Accurate Profit Calculation: Total Sales minus Cost of Goods / Inventory Purchases & Operating Expenses
  const netProfit = totalSales - totalExpenses;
  const profitMarginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

  // Credit metrics
  const creditGiven = periodCredits
    .filter((c) => c.type === 'credit_taken')
    .reduce((acc, c) => acc + c.amount, 0);
  const creditCollected = periodCredits
    .filter((c) => c.type === 'payment_received')
    .reduce((acc, c) => acc + c.amount, 0);

  // Cups sold
  const milkTeaCups = periodSales
    .filter((s) => s.itemType === 'milk_tea')
    .reduce((acc, s) => acc + s.quantity, 0);
  const blackTeaCups = periodSales
    .filter((s) => s.itemType === 'black_tea')
    .reduce((acc, s) => acc + s.quantity, 0);

  // Category-wise Expense breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { label: string; amount: number; isInv: boolean }> = {};
    for (const e of periodExpenses) {
      if (!map[e.category]) {
        map[e.category] = {
          label: e.categoryLabel || CATEGORY_LABELS[e.category] || e.category,
          amount: 0,
          isInv: Boolean(e.isInventoryPurchase),
        };
      }
      map[e.category].amount += e.amount;
    }
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [periodExpenses]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['বিবরণ', 'টাকা (৳)'];
    const rows = [
      ['হিসাবের সময়কাল', periodLabel],
      ['মোট বিক্রি', totalSales],
      ['নগদ বিক্রি', cashSales],
      ['বাকিতে বিক্রি', creditSales],
      ['বিকাশ / অনলাইন বিক্রি', bkashSales],
      ['কাঁচামাল ও পণ্য ক্রয়', inventoryPurchases],
      ['দোকান পরিচালনা খরচ', operatingExpenses],
      ['মোট খরচ ও ক্রয়', totalExpenses],
      ['নিট লাভ / ক্ষতি', netProfit],
      ['দুধ চা বিক্রির কাপ সংখ্যা', milkTeaCups],
      ['লাল চা বিক্রির কাপ সংখ্যা', blackTeaCups],
      ['বাকির টাকা আদায়', creditCollected],
      ['নতুন বাকি প্রদান', creditGiven],
    ];
    exportToCSV(`profit_loss_report_${period}`, headers, rows);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Header & Export/Print Actions (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">লাভ-লোকসান খতিয়ান ও রিপোর্ট</h2>
          <p className="text-xs text-stone-500">
            দোকানের দৈনিক, সাপ্তাহিক ও মাসিক পূর্ণাঙ্গ আর্থিক হিসাব বিবরণী
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all"
            title="CSV এক্সেল ডাউনলোড"
          >
            <Download className="w-4 h-4" />
            <span>CSV ডাউনলোড</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/20 active:scale-95 transition-all"
            title="প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Period Filter Buttons (hidden on print) */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              period === 'today'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            আজকের দিন
          </button>
          <button
            onClick={() => setPeriod('yesterday')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              period === 'yesterday'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            গতকাল
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              period === 'week'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            গত ৭ দিন
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              period === 'month'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            চলতি মাস
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              period === 'custom'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            নির্দিষ্ট তারিখ পরিসীমা
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 pt-1 border-t border-stone-100 text-xs">
            <span className="text-stone-500 font-medium">শুরু:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium"
            />
            <span className="text-stone-500 font-medium">থেকে শেষ:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium"
            />
          </div>
        )}
      </div>

      {/* PRINT-FRIENDLY & ON-SCREEN FINANCIAL REPORT SHEET */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Printable Voucher Header */}
        <div className="text-center pb-5 border-b border-stone-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {settings.shopName || 'চা দোকান হিসাব খাতা'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            পরিচালক: {settings.ownerName || 'মোহাম্মদ আলমগীর'} • মোবাইল/ক্যাশ মেমো
          </p>
          <div className="inline-block bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 mt-2">
            {periodLabel} ({formatBengaliDate(filterStart)} - {formatBengaliDate(filterEnd)})
          </div>
        </div>

        {/* Highlight KPI Cards for Report */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium block">মোট বিক্রি</span>
            <p className="text-lg sm:text-xl font-black text-stone-900 mt-1">
              {formatTaka(totalSales)}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              নগদ: {formatTaka(cashSales)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium block">মোট খরচ ও ক্রয়</span>
            <p className="text-lg sm:text-xl font-black text-rose-700 mt-1">
              {formatTaka(totalExpenses)}
            </p>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              স্টক + দোকান খরচ
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium block">নিট লাভ / লোকসান</span>
            <p
              className={`text-lg sm:text-xl font-black mt-1 ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatTaka(netProfit)}
            </p>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              মার্জিন: {profitMarginPercent}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium block">চা বিক্রির মোট কাপ</span>
            <p className="text-lg sm:text-xl font-black text-amber-900 mt-1">
              {milkTeaCups + blackTeaCups} কাপ
            </p>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              দুধ: {milkTeaCups} | লাল: {blackTeaCups}
            </span>
          </div>
        </div>

        {/* Detailed Profit & Loss Statement Table */}
        <div className="border border-stone-200 rounded-2xl overflow-hidden">
          <div className="bg-stone-100/80 px-4 py-2.5 font-bold text-xs sm:text-sm text-stone-800 border-b border-stone-200 flex justify-between">
            <span>আর্থিক বিবরণী (Profit & Loss Statement)</span>
            <span>টাকা (৳)</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs sm:text-sm">
            {/* Sales Section */}
            <div className="p-3 bg-amber-50/30 flex justify-between font-bold text-stone-900">
              <span>(ক) মোট রাজস্ব / বিক্রি (Total Revenue)</span>
              <span>{formatTaka(totalSales)}</span>
            </div>
            <div className="px-6 py-2 flex justify-between text-stone-600 text-xs">
              <span>• নগদ বিক্রি (Cash Sales)</span>
              <span>{formatTaka(cashSales)}</span>
            </div>
            <div className="px-6 py-2 flex justify-between text-stone-600 text-xs">
              <span>• বাকিতে বিক্রি (Credit Sales)</span>
              <span>{formatTaka(creditSales)}</span>
            </div>
            {bkashSales > 0 && (
              <div className="px-6 py-2 flex justify-between text-stone-600 text-xs">
                <span>• বিকাশ / অনলাইন বিক্রি</span>
                <span>{formatTaka(bkashSales)}</span>
              </div>
            )}

            {/* Cost of Goods / Inventory Section */}
            <div className="p-3 bg-amber-50/30 flex justify-between font-bold text-stone-900">
              <span>(খ) বাদ: কাঁচামাল ও পণ্য ক্রয় (Stock / Raw Material Purchases)</span>
              <span className="text-rose-700">-{formatTaka(inventoryPurchases)}</span>
            </div>
            <div className="px-6 py-1.5 text-[11px] text-stone-500 italic">
              * নোট: কাঁচামাল ক্রয় একবারই হিসেবে এসেছে, দ্বিগুণ গণনা এড়ানো হয়েছে।
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-stone-50 flex justify-between font-bold text-stone-900 border-t border-stone-200">
              <span>(গ) প্রাক্কলিত ব্যবসায়িক মুনাফা (Gross Margin: ক - খ)</span>
              <span className="text-emerald-700 font-extrabold">{formatTaka(totalSales - inventoryPurchases)}</span>
            </div>

            {/* Operating Expenses Section */}
            <div className="p-3 bg-stone-50 flex justify-between font-bold text-stone-900">
              <span>(ঘ) বাদ: দোকান পরিচালনা খরচ (Operating Overhead Expenses)</span>
              <span className="text-rose-700">-{formatTaka(operatingExpenses)}</span>
            </div>
            <div className="px-6 py-2 flex justify-between text-stone-600 text-xs">
              <span>• বিদ্যুৎ, দোকান ভাড়া, কর্মচারীর বেতন, গ্যাস, বিবিধ</span>
              <span>{formatTaka(operatingExpenses)}</span>
            </div>

            {/* Net Profit Final Row */}
            <div className="p-4 bg-amber-900 text-white flex justify-between font-black text-sm sm:text-base rounded-b-2xl">
              <span>(ঙ) নিট লাভ / ক্ষতি (Net Profit: গ - ঘ)</span>
              <span className="text-emerald-300">{formatTaka(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Category Expense Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-amber-700" />
              <span>ক্যাটাগরি ভিত্তিক খরচের বিবরণ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryBreakdown.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 bg-stone-50/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                    <span className="font-medium text-stone-800">{cat.label}</span>
                    <span className="text-[10px] text-stone-400">
                      ({cat.isInv ? 'কাঁচামাল' : 'পরিচালনা'})
                    </span>
                  </div>
                  <span className="font-bold text-stone-900">{formatTaka(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Flow Summary */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-stone-800 block mb-1">
              বাকি খাতার লেনদেন সারসংক্ষেপ:
            </span>
            <p className="text-stone-600">
              নির্বাচিত সময়ে নতুন বাকি দেওয়া হয়েছে: <span className="font-bold text-rose-600">{formatTaka(creditGiven)}</span>
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-stone-600">
              নির্বাচিত সময়ে বাকির টাকা আদায় হয়েছে: <span className="font-bold text-emerald-700">{formatTaka(creditCollected)}</span>
            </p>
          </div>
        </div>

        {/* Print Signature Line (visible on print) */}
        <div className="hidden print:flex justify-between pt-16 text-xs text-stone-600">
          <div className="border-t border-stone-400 pt-1 px-4 text-center">
            হিসাব প্রস্তুতকারী
          </div>
          <div className="border-t border-stone-400 pt-1 px-4 text-center">
            দোকানদারের স্বাক্ষর
          </div>
        </div>
      </div>
    </div>
  );
};
