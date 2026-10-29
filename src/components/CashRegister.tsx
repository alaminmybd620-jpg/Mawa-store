import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Coins,
  Calendar,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CashEntry, Sale, Expense, CreditTransaction } from '../types';
import { formatTaka, formatBengaliDate, getTodayDateString } from '../utils/format';

interface CashRegisterProps {
  cashEntries: CashEntry[];
  todaySales: Sale[];
  todayExpenses: Expense[];
  todayCreditTransactions: CreditTransaction[];
  isOpen: boolean;
  onClose: () => void;
  onAddCashEntry: (entry: Omit<CashEntry, 'id' | 'userId'>) => Promise<void>;
  onDeleteCashEntry: (entryId: string) => void;
}

export const CashRegister: React.FC<CashRegisterProps> = ({
  cashEntries,
  todaySales,
  todayExpenses,
  todayCreditTransactions,
  isOpen,
  onClose,
  onAddCashEntry,
  onDeleteCashEntry,
}) => {
  if (!isOpen) return null;

  const today = getTodayDateString();

  // Calculations for Today's Cash Flow:
  // 1. Opening Cash for today (if any recorded in cash_entries)
  const openingEntry = cashEntries.find(
    (e) => e.date === today && e.type === 'opening_balance'
  );
  const openingCash = openingEntry ? openingEntry.amount : 0;

  // 2. Direct Cash Sales today
  const cashSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.totalAmount, 0);

  // 3. Cash from Credit Recovery today (বাকি আদায়)
  const creditCollectedToday = todayCreditTransactions
    .filter((t) => t.date === today && t.type === 'payment_received')
    .reduce((acc, t) => acc + t.amount, 0);

  // 4. Other Cash In
  const otherCashInToday = cashEntries
    .filter((e) => e.date === today && e.type === 'cash_in')
    .reduce((acc, e) => acc + e.amount, 0);

  // 5. Total Cash Inflows
  const totalCashInflow = openingCash + cashSalesToday + creditCollectedToday + otherCashInToday;

  // 6. Cash paid out for expenses today
  const totalCashExpense = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 7. Other Cash Out
  const otherCashOutToday = cashEntries
    .filter((e) => e.date === today && e.type === 'cash_out')
    .reduce((acc, e) => acc + e.amount, 0);

  // 8. Total Cash Outflows
  const totalCashOutflow = totalCashExpense + otherCashOutToday;

  // 9. Current Expected Cash in Drawer
  const closingCashInDrawer = totalCashInflow - totalCashOutflow;

  // Modal Form State
  const [formType, setFormType] = useState<'opening_balance' | 'cash_in' | 'cash_out'>('opening_balance');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddCashEntry({
        date: today,
        type: formType,
        amount: Number(formAmount),
        description: formDesc.trim() || (formType === 'opening_balance' ? 'সকালের প্রারম্ভিক ক্যাশ' : 'ক্যাশ সমন্বয়'),
      });
      setFormAmount('');
      setFormDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">ক্যাশ রেজিস্টার (ড্রয়ার হিসাব)</h3>
              <p className="text-xs text-stone-500">তারিখ: {formatBengaliDate(today)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expected Cash In Drawer Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 mb-4 shadow-md border border-emerald-700">
          <span className="text-xs font-semibold text-emerald-200">
            বর্তমানে ড্রয়ারে মোট ক্যাশ থাকা উচিত:
          </span>
          <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-white">
            {formatTaka(closingCashInDrawer)}
          </p>
          <p className="text-[11px] text-emerald-200/80 mt-1">
            (প্রারম্ভিক ক্যাশ + আজকের নগদ বিক্রি + বাকি আদায় - মোট খরচ)
          </p>
        </div>

        {/* Breakdown List */}
        <div className="space-y-2 mb-4 text-xs">
          <div className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-100">
            <span className="text-stone-600 font-medium">১. সকালের প্রারম্ভিক ক্যাশ (ভাঙতি/ক্যাশ)</span>
            <span className="font-bold text-stone-900">{formatTaka(openingCash)}</span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-100">
            <span className="text-stone-600 font-medium">২. আজকের নগদ বিক্রি</span>
            <span className="font-bold text-emerald-700">+{formatTaka(cashSalesToday)}</span>
          </div>

          <div className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-100">
            <span className="text-stone-600 font-medium">৩. বাকির টাকা আদায় (কাস্টমার পেমেন্ট)</span>
            <span className="font-bold text-emerald-700">+{formatTaka(creditCollectedToday)}</span>
          </div>

          {otherCashInToday > 0 && (
            <div className="flex justify-between items-center p-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-stone-600 font-medium">৪. অন্যান্য নগদ জমা</span>
              <span className="font-bold text-emerald-700">+{formatTaka(otherCashInToday)}</span>
            </div>
          )}

          <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-rose-800 font-medium">৫. আজকের নগদ খরচ ও মালামাল ক্রয়</span>
            <span className="font-bold text-rose-700">-{formatTaka(totalCashExpense)}</span>
          </div>

          {otherCashOutToday > 0 && (
            <div className="flex justify-between items-center p-2 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-rose-800 font-medium">৬. অন্যান্য নগদ উত্তোলন</span>
              <span className="font-bold text-rose-700">-{formatTaka(otherCashOutToday)}</span>
            </div>
          )}
        </div>

        {/* Add Entry Form */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 mb-4">
          <h4 className="text-xs font-bold text-stone-900 mb-2.5">
            ক্যাশ এন্ট্রি যুক্ত করুন (প্রারম্ভিক ক্যাশ বা জমা/উত্তোলন):
          </h4>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setFormType('opening_balance')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                  formType === 'opening_balance'
                    ? 'bg-amber-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                প্রারম্ভিক ক্যাশ
              </button>
              <button
                type="button"
                onClick={() => setFormType('cash_in')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                  formType === 'cash_in'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                নগদ জমা (+)
              </button>
              <button
                type="button"
                onClick={() => setFormType('cash_out')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                  formType === 'cash_out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-700'
                }`}
              >
                নগদ উত্তোলন (-)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                required
                placeholder="টাকা (৳)"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="বিবরণ (ঐচ্ছিক)"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'ক্যাশ এন্ট্রি সংরক্ষণ'}
            </button>
          </form>
        </div>

        {/* Recent Manual Cash Entries List */}
        {cashEntries.filter((e) => e.date === today).length > 0 && (
          <div className="border-t border-stone-100 pt-3">
            <h5 className="text-[11px] font-bold text-stone-500 mb-2">আজকের ম্যানুয়াল ক্যাশ লগ:</h5>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {cashEntries
                .filter((e) => e.date === today)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-stone-50 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-stone-800">{entry.description}</span>
                      <span className="text-[10px] text-stone-400 ml-1">
                        ({entry.type === 'opening_balance' ? 'প্রারম্ভিক' : entry.type === 'cash_in' ? 'জমা' : 'উত্তোলন'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{formatTaka(entry.amount)}</span>
                      <button
                        onClick={() => onDeleteCashEntry(entry.id)}
                        className="text-stone-300 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
