import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Coffee,
  Receipt,
  Share2,
} from 'lucide-react';
import { Sale, ShopSettings } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  formatBengaliTime,
} from '../utils/format';

interface SaleMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: ShopSettings;
}

export const SaleMemoModal: React.FC<SaleMemoModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sale) return null;

  const memoNo = `SM-${sale.date.replace(/-/g, '')}-${sale.id.slice(-4).toUpperCase()}`;
  const paymentMethodLabel =
    sale.paymentMethod === 'cash'
      ? 'নগদ ক্যাশ'
      : sale.paymentMethod === 'credit'
      ? `বাকি (${sale.customerName || 'কাস্টমার'})`
      : 'বিকাশ / অনলাইন';

  const handleCopyText = () => {
    const text = `========================
${settings.shopName || 'চা দোকান'} - ক্যাশ মেমো
মেমো নং: ${memoNo}
তারিখ: ${formatBengaliDate(sale.date)}
আইটেম: ${sale.itemName}
পরিমাণ: ${sale.quantity}
দর: ৳ ${sale.unitPrice}
মোট টাকা: ৳ ${sale.totalAmount}
পরিশোধ: ${paymentMethodLabel}
${sale.notes ? `নোট: ${sale.notes}\n` : ''}ধন্যবাদান্তে,
${settings.ownerName || 'দোকানদার'}
========================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-stone-200 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="no-print bg-stone-900 text-stone-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">বিক্রির ক্যাশ মেমো</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Memo Body */}
        <div className="p-6 bg-white printable-receipt text-stone-900">
          <div className="text-center pb-4 border-b border-dashed border-stone-300">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-1 shadow-2xs">
              <Coffee className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-stone-900">
              {settings.shopName || 'চা দোকান হিসাব খাতা'}
            </h2>
            {settings.address && (
              <p className="text-[11px] text-stone-600 mt-0.5">{settings.address}</p>
            )}
            <p className="text-[11px] text-stone-500">
              পরিচালক: {settings.ownerName || 'মোহাম্মদ আলমগীর'}
              {settings.phone && ` • মোবা: ${settings.phone}`}
            </p>

            <span className="inline-block bg-amber-50 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 mt-2">
              ক্যাশ মেমো / বিক্রয় রশিদ
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 py-2.5 text-xs border-b border-stone-100">
            <div>
              <span className="text-[10px] text-stone-400 block">মেমো নং:</span>
              <span className="font-mono font-bold text-stone-800">{memoNo}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 block">তারিখ ও সময়:</span>
              <span className="font-medium text-stone-700">
                {formatBengaliDate(sale.date)} {formatBengaliTime(sale.timestamp)}
              </span>
            </div>
          </div>

          {/* Item Row Table */}
          <div className="py-3 border-b border-stone-100">
            <div className="flex justify-between items-center text-xs font-bold text-stone-500 pb-1.5 border-b border-stone-100">
              <span>পণ্য / বিবরণ</span>
              <span className="text-right">টাকা (৳)</span>
            </div>

            <div className="pt-2 flex justify-between items-start text-xs">
              <div>
                <p className="font-bold text-stone-900 text-sm">{sale.itemName}</p>
                <p className="text-stone-500 mt-0.5">
                  {sale.quantity} x ৳{sale.unitPrice}
                </p>
              </div>
              <p className="font-black text-base text-stone-900">
                {formatTaka(sale.totalAmount)}
              </p>
            </div>
          </div>

          {/* Total & Payment Method */}
          <div className="my-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-stone-500 block text-[10px]">পরিশোধের মাধ্যম:</span>
              <span className="font-bold text-amber-950">{paymentMethodLabel}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block text-[10px]">মোট সর্বমোট:</span>
              <span className="text-lg font-black text-amber-950">
                {formatTaka(sale.totalAmount)}
              </span>
            </div>
          </div>

          {sale.notes && (
            <p className="text-xs text-stone-500 italic mb-3 bg-stone-50 p-2 rounded-lg">
              নোট: {sale.notes}
            </p>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[11px] text-stone-500">
            <div className="border-t border-stone-300 pt-1">ক্রেতার স্বাক্ষর</div>
            <div className="border-t border-stone-300 pt-1">বিক্রেতার স্বাক্ষর</div>
          </div>

          <p className="text-center text-[10px] text-stone-400 mt-3">
            চা দোকান হিসাব খাতা • ধন্যবাদ, আবার আসবেন!
          </p>
        </div>

        {/* Footer Actions */}
        <div className="no-print p-3 bg-stone-50 border-t border-stone-200 flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                <span>মেসেজ কপি</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
