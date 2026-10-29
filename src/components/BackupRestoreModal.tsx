import React, { useState } from 'react';
import { Database, Download, Upload, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Sale, Expense, CustomerCredit, CreditTransaction, InventoryItem, CashEntry, ShopSettings } from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullData: {
    sales: Sale[];
    expenses: Expense[];
    customers: CustomerCredit[];
    creditTransactions: CreditTransaction[];
    inventory: InventoryItem[];
    cashEntries: CashEntry[];
    settings: ShopSettings;
  };
  onRestoreData: (importedData: any) => Promise<void>;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  fullData,
  onRestoreData,
}) => {
  if (!isOpen) return null;

  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Export JSON Backup
  const handleExportJSON = () => {
    const backupObject = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'চা দোকান হিসাব খাতা (Tea Shop Accounts)',
      data: fullData,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupObject, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `tea_shop_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.data || typeof parsed.data !== 'object') {
          throw new Error('অকার্যকর ব্যাকআপ ফাইল ফরম্যাট।');
        }

        setIsRestoring(true);
        await onRestoreData(parsed.data);
        setRestoreStatus('ব্যাকআপ ডেটা সফলভাবে রিস্টোর হয়েছে!');
        setTimeout(() => {
          setRestoreStatus('');
          onClose();
        }, 2000);
      } catch (err: any) {
        console.error(err);
        setErrorMsg('ফাইলটি পড়া যায়নি বা ফাইলের ফরম্যাট ভুল।');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">ব্যাকআপ ও রিস্টোর</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {restoreStatus && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{restoreStatus}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Current Counts Summary */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1">
            <span className="font-bold text-stone-800 block mb-1">বর্তমানে সিস্টেমে সংরক্ষিত:</span>
            <div className="grid grid-cols-2 gap-1 text-stone-600">
              <p>• মোট বিক্রি এন্ট্রি: {fullData.sales.length}টি</p>
              <p>• মোট খরচ এন্ট্রি: {fullData.expenses.length}টি</p>
              <p>• বাকি গ্রাহক: {fullData.customers.length} জন</p>
              <p>• মজুদ আইটেম: {fullData.inventory.length}টি</p>
            </div>
          </div>

          {/* Backup Download Button */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-blue-400 transition-all bg-white shadow-2xs">
            <h4 className="text-sm font-bold text-stone-900 mb-1">
              সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড (JSON)
            </h4>
            <p className="text-xs text-stone-500 mb-3">
              আপনার সমস্ত বিক্রি, খরচ, বাকি খাতা ও মজুদের একটি সুরক্ষিত ফাইল আপনার ফোনে বা কম্পিউটারে সেভ করে রাখুন।
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ব্যাকআপ ফাইল ডাউনলোড করুন</span>
            </button>
          </div>

          {/* Restore Data File Upload */}
          <div className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 transition-all bg-white shadow-2xs">
            <h4 className="text-sm font-bold text-stone-900 mb-1">
              পূর্বের ব্যাকআপ রিস্টোর (JSON Restore)
            </h4>
            <p className="text-xs text-stone-500 mb-3">
              পূর্বে ডাউনলোড করা কোনো JSON ব্যাকআপ ফাইল থেকে সমস্ত তথ্য পুনরুদ্ধার করতে ফাইলটি নির্বাচন করুন।
            </p>
            <label className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 border border-stone-300 cursor-pointer active:scale-95 transition-all">
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                  <span>রিস্টোর হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-stone-700" />
                  <span>ফাইল নির্বাচন ও রিস্টোর</span>
                </>
              )}
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 text-right">
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
