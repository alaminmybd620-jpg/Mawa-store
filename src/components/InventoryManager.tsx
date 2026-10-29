import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Trash2,
  Edit2,
  X,
  History,
  TrendingDown,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { formatTaka, formatBengaliDate, getTodayDateString } from '../utils/format';

interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  onSaveItem: (item: InventoryItem) => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  onAutoAddExpense?: (
    category: string,
    categoryLabel: string,
    amount: number,
    notes: string
  ) => Promise<void>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventoryItems,
  onSaveItem,
  onDeleteItem,
  onAutoAddExpense,
}) => {
  // Restock Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [targetItem, setTargetItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number | ''>('');
  const [restockCost, setRestockCost] = useState<number | ''>('');
  const [logAsExpense, setLogAsExpense] = useState<boolean>(true);

  // Add / Edit Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [itemUnit, setItemUnit] = useState<string>('কেজি');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minAlertStock, setMinAlertStock] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Open Restock Modal
  const openRestock = (item: InventoryItem) => {
    setTargetItem(item);
    setRestockQty('');
    setRestockCost('');
    setLogAsExpense(true);
    setIsRestockModalOpen(true);
  };

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem || !restockQty || Number(restockQty) <= 0) return;

    setIsSubmitting(true);
    try {
      const addedQty = Number(restockQty);
      const totalCostNum = Number(restockCost) || 0;
      const updatedStock = Number(targetItem.currentStock) + addedQty;

      await onSaveItem({
        ...targetItem,
        currentStock: updatedStock,
        unitCost: totalCostNum > 0 && addedQty > 0 ? totalCostNum / addedQty : targetItem.unitCost,
        lastRestocked: getTodayDateString(),
      });

      // If user checked "log as expense", automatically record the purchase into expenses!
      if (logAsExpense && totalCostNum > 0 && onAutoAddExpense) {
        await onAutoAddExpense(
          targetItem.key || 'misc',
          `${targetItem.itemName} ক্রয়`,
          totalCostNum,
          `${addedQty} ${targetItem.unit} ক্রয় করা হয়েছে`
        );
      }

      setIsRestockModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Add Item
  const openAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemUnit('কেজি');
    setCurrentStock('');
    setMinAlertStock(2);
    setUnitCost('');
    setIsItemModalOpen(true);
  };

  // Open Edit Item
  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setItemUnit(item.unit);
    setCurrentStock(item.currentStock);
    setMinAlertStock(item.minAlertStock);
    setUnitCost(item.unitCost);
    setIsItemModalOpen(true);
  };

  // Handle Item Save
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || currentStock === '') return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onSaveItem({
          ...editingItem,
          itemName: itemName.trim(),
          unit: itemUnit.trim(),
          currentStock: Number(currentStock),
          minAlertStock: Number(minAlertStock) || 0,
          unitCost: Number(unitCost) || 0,
        });
      } else {
        const id = `inv_${Date.now()}`;
        await onSaveItem({
          id,
          userId: '',
          itemName: itemName.trim(),
          key: itemName.toLowerCase().replace(/\s+/g, '_'),
          unit: itemUnit.trim(),
          currentStock: Number(currentStock),
          minAlertStock: Number(minAlertStock) || 0,
          unitCost: Number(unitCost) || 0,
          lastRestocked: getTodayDateString(),
        });
      }
      setIsItemModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Usage adjust: deduct 1 unit or custom amount
  const handleDeductStock = async (item: InventoryItem, amountToDeduct: number) => {
    const updatedStock = Math.max(0, Number((item.currentStock - amountToDeduct).toFixed(2)));
    await onSaveItem({
      ...item,
      currentStock: updatedStock,
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">কাঁচামাল ও মজুদ (ইনভেন্টরি)</h2>
          <p className="text-xs text-stone-500">চা পাতা, দুধ, চিনি, কাপ ও সিগারেট স্টক ট্র্যাকিং</p>
        </div>
        <button
          onClick={openAddItem}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পণ্য যোগ করুন</span>
        </button>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {inventoryItems.map((item) => {
          const isLow = item.currentStock <= item.minAlertStock;
          const isOut = item.currentStock <= 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                isOut
                  ? 'border-rose-300 bg-rose-50/30'
                  : isLow
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isOut
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : isLow
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      আনুমানিক একক ক্রয়মূল্য: ৳{item.unitCost} / {item.unit}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isOut
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : isLow
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isOut ? 'স্টক শেষ!' : isLow ? 'কম মজুদ' : 'পর্যাপ্ত'}
                </span>
              </div>

              {/* Current Quantity Display & Alert */}
              <div className="bg-stone-50 rounded-xl p-3 flex items-center justify-between mb-3 border border-stone-100">
                <div>
                  <span className="text-[11px] text-stone-500 font-medium block">বর্তমান মজুদ:</span>
                  <p className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    {item.currentStock}{' '}
                    <span className="text-xs font-semibold text-stone-500">{item.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 font-medium block">সতর্কবার্তা সীমা:</span>
                  <p className="text-xs font-bold text-stone-700">
                    {item.minAlertStock} {item.unit} বা কম
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                {/* Restock Button */}
                <button
                  type="button"
                  onClick={() => openRestock(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>স্টক যোগ করুন</span>
                </button>

                {/* Quick usage deduction */}
                <button
                  type="button"
                  onClick={() => handleDeductStock(item, 1)}
                  title="১ একক ব্যবহার কমিয়ে নিন"
                  className="py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>-১ {item.unit}</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditItem(item)}
                  title="সম্পাদনা করুন"
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 active:scale-95 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  title="মুছে ফেলুন"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {isRestockModalOpen && targetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {targetItem.itemName} - স্টক যোগ করুন
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  বর্তমান মজুদ: {targetItem.currentStock} {targetItem.unit}
                </p>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  নতুন ক্রয়ের পরিমাণ ({targetItem.unit}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  placeholder={`যেমন: ৫ ${targetItem.unit}`}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মোট ক্রয়মূল্য (টাকা ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="যেমন: ৪৫০"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Auto log as expense checkbox */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logAsExpense}
                    onChange={(e) => setLogAsExpense(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-amber-700 rounded-sm border-stone-300 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      খরচের খাতায় স্বয়ংক্রিয়ভাবে লিখে রাখুন
                    </span>
                    <span className="text-[11px] text-amber-800 leading-tight block">
                      টিক দিলে এই ক্রয়মূল্যটি আজকের খরচের খাতায় যুক্ত হবে এবং ক্যাশ ড্রয়ার থেকে বাদ যাবে।
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 shadow-md shadow-amber-900/20"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'স্টক আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Inventory Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                {editingItem ? 'পণ্যের তথ্য পরিবর্তন' : 'নতুন কাঁচামাল / পণ্য যোগ'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পণ্যের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আদা, এলাচ, ওয়ান-টাইম কাপ"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পরিমাপের একক *
                  </label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="কেজি">কেজি (Kg)</option>
                    <option value="গ্রাম">গ্রাম (gm)</option>
                    <option value="লিটার">লিটার (Liter)</option>
                    <option value="পিস">পিস (Piece)</option>
                    <option value="প্যাকেট">প্যাকেট (Packet)</option>
                    <option value="শলাকা">শলাকা (Stick)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বর্তমান প্রারম্ভিক স্টক *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="০"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    সতর্কবার্তা সীমা
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="যেমন: ২"
                    value={minAlertStock}
                    onChange={(e) => setMinAlertStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    একক ক্রয়মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="যেমন: ৯০"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 shadow-md shadow-amber-900/20"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : editingItem ? 'আপডেট করুন' : 'পণ্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
