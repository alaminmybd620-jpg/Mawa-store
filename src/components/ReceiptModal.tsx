import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Coffee,
  CheckCircle2,
  Share2,
  Calendar,
  User,
  CreditCard,
} from 'lucide-react';
import { CreditTransaction, ShopSettings, CustomerCredit } from '../types';
import {
  formatTaka,
  formatBengaliDate,
  formatBengaliTime,
  toBengaliNumber,
} from '../utils/format';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CreditTransaction | null;
  customer?: CustomerCredit | null;
  settings: ShopSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customer,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const receiptNo =
    transaction.receiptNo ||
    `MR-${transaction.date.replace(/-/g, '')}-${transaction.id.slice(-4).toUpperCase()}`;

  const txTimestamp = transaction.timestamp || Date.now();
  const paymentMethodLabel =
    transaction.paymentMethod === 'bkash' ? 'বিকাশ / মোবাইল ব্যাংকিং' : 'নগদ ক্যাশ';

  // Handle Share / Copy Text (Ideal for sending SMS or WhatsApp in Bangladesh)
  const handleCopyText = () => {
    const text = `========================
${settings.shopName || 'চা দোকান'} - পেমেন্ট রশিদ
রশিদ নং: ${receiptNo}
তারিখ: ${formatBengaliDate(transaction.date)}
গ্রাহক: ${transaction.customerName}
পরিশোধিত টাকা: ৳ ${transaction.amount} (${paymentMethodLabel})
${
  transaction.remainingBalance !== undefined
    ? `বর্তমান অবশিষ্ট বাকি: ৳ ${transaction.remainingBalance}\n`
    : ''
}${transaction.notes ? `বিবরণ: ${transaction.notes}\n` : ''}ধন্যবাদান্তে,
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
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-stone-900 text-stone-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">টাকা আদায়ের অফিসিয়াল রশিদ</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 bg-white printable-receipt text-stone-900">
          {/* Receipt Header */}
          <div className="text-center pb-4 border-b border-dashed border-stone-300">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-1.5 shadow-2xs">
              <Coffee className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-stone-900">
              {settings.shopName || 'চা দোকান হিসাব খাতা'}
            </h2>
            {settings.address && (
              <p className="text-xs text-stone-600 mt-0.5">{settings.address}</p>
            )}
            <p className="text-xs text-stone-500">
              পরিচালক: {settings.ownerName || 'মোহাম্মদ আলমগীর'}
              {settings.phone && ` • মোবাইল: ${settings.phone}`}
            </p>

            <div className="inline-block bg-stone-100 text-stone-800 text-[11px] font-bold px-3 py-1 rounded-full border border-stone-200 mt-2.5">
              {transaction.type === 'payment_received'
                ? 'মানি রিসিট (বাকি পরিশোধ রশিদ)'
                : 'বাকি গ্রহণের হিসাব মেমো'}
            </div>
          </div>

          {/* Receipt Meta (Date, Receipt No) */}
          <div className="grid grid-cols-2 gap-2 py-3 text-xs border-b border-stone-100">
            <div>
              <span className="text-stone-500 block text-[10px]">রশিদ নম্বর:</span>
              <span className="font-mono font-bold text-stone-800">{receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block text-[10px]">তারিখ ও সময়:</span>
              <span className="font-semibold text-stone-800">
                {formatBengaliDate(transaction.date)} {formatBengaliTime(txTimestamp)}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="py-3 border-b border-stone-100 text-xs">
            <span className="text-stone-500 block text-[10px]">গ্রাহকের নাম:</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-black text-stone-900 text-sm">
                {transaction.customerName}
              </span>
              {customer?.phone && (
                <span className="text-stone-500 text-xs">{customer.phone}</span>
              )}
            </div>
          </div>

          {/* Payment Amount Card */}
          <div className="my-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-800 block">
              {transaction.type === 'payment_received'
                ? 'আদায়কৃত / পরিশোধিত টাকা'
                : 'নতুন গৃহীত বাকি'}
            </span>
            <p className="text-3xl font-black text-emerald-900 mt-1 tracking-tight">
              {formatTaka(transaction.amount)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-emerald-700 font-semibold">
              <span>মাধ্যম: {paymentMethodLabel}</span>
            </div>
          </div>

          {/* Outstanding Balance Breakdown */}
          <div className="space-y-1.5 text-xs bg-stone-50 p-3 rounded-2xl border border-stone-200 mb-4">
            {transaction.previousBalance !== undefined && (
              <div className="flex justify-between text-stone-600">
                <span>পূর্বের মোট বকেয়া:</span>
                <span className="font-bold">{formatTaka(transaction.previousBalance)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>এই রশিদে জমা:</span>
              <span className="font-bold text-emerald-700">-{formatTaka(transaction.amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 pt-1.5 border-t border-stone-200 text-sm">
              <span>বর্তমান অবশিষ্ট বাকি পাওনা:</span>
              <span
                className={`font-black ${
                  (transaction.remainingBalance ?? customer?.currentBalance ?? 0) > 0
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                }`}
              >
                {formatTaka(transaction.remainingBalance ?? customer?.currentBalance ?? 0)}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {transaction.notes && (
            <p className="text-xs text-stone-500 italic mb-4 bg-stone-50 p-2 rounded-xl">
              বিবরণ: {transaction.notes}
            </p>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs text-stone-500">
            <div className="border-t border-stone-300 pt-1">গ্রাহকের স্বাক্ষর</div>
            <div className="border-t border-stone-300 pt-1">আদায়কারীর স্বাক্ষর</div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-stone-400 mt-4">
            ধন্যবাদ, আবার আসবেন! চা দোকান হিসাব খাতা দ্বারা সংগৃহীত।
          </div>
        </div>

        {/* Action Buttons (Hidden on print) */}
        <div className="no-print p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCopyText}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-stone-600" />
                <span>মেসেজ কপি / শেয়ার</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>রশিদ প্রিন্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
