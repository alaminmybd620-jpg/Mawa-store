import React, { useState } from 'react';
import {
  Settings,
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Save,
  Coffee,
  Store,
  Tag,
  Boxes,
  RotateCcw,
  AlertTriangle,
  FolderPlus,
  Phone,
  MapPin,
} from 'lucide-react';
import { ShopSettings, CustomProduct, CustomCategory } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ShopSettings;
  onClose: () => void;
  onSaveSettings: (settings: ShopSettings) => Promise<void>;
  onResetDemoData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  // Active Tab inside settings
  const [activeTab, setActiveTab] = useState<'profile' | 'tea_prices' | 'products' | 'categories' | 'data'>('profile');

  // Shop Profile state
  const [shopName, setShopName] = useState<string>(settings.shopName || 'ভাই ভাই চা স্টল');
  const [ownerName, setOwnerName] = useState<string>(settings.ownerName || 'মোহাম্মদ আলমগীর');
  const [phone, setPhone] = useState<string>(settings.phone || '০১৭১২-৩৪৫৬৭৮');
  const [address, setAddress] = useState<string>(settings.address || 'দোকান নং ৪, স্টেশন রোড, ঢাকা');

  // Tea Prices
  const [milkTeaPrice, setMilkTeaPrice] = useState<number>(settings.milkTeaPrice || 20);
  const [blackTeaPrice, setBlackTeaPrice] = useState<number>(settings.blackTeaPrice || 5);

  // Custom Products (Snacks, Cigarettes, Bakery)
  const initialCustom: CustomProduct[] = settings.customItems
    ? JSON.parse(settings.customItems)
    : [
        { id: '1', name: 'টোস্ট বিস্কুট', price: 10, category: 'নাস্তা' },
        { id: '2', name: 'স্পেশাল কেক', price: 15, category: 'নাস্তা' },
        { id: '3', name: 'সিদ্ধ ডিম', price: 15, category: 'নাস্তা' },
        { id: '4', name: 'বেনসন সিগারেট', price: 18, category: 'সিগারেট' },
        { id: '5', name: 'গোল্ডলিফ সিগারেট', price: 13, category: 'সিগারেট' },
        { id: '6', name: 'পান / সুপারি', price: 10, category: 'অন্যান্য' },
      ];
  const [customItems, setCustomItems] = useState<CustomProduct[]>(initialCustom);

  // Custom Product Add / Edit
  const [editingProduct, setEditingProduct] = useState<CustomProduct | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodCategory, setProdCategory] = useState<string>('নাস্তা');

  // Custom Expense Categories
  const initialCategories: CustomCategory[] = settings.customCategories
    ? JSON.parse(settings.customCategories)
    : [
        { id: 'c1', key: 'gas', label: 'গ্যাস সিলিন্ডার / জ্বালানি', isInventory: false },
        { id: 'c2', key: 'packaging', label: 'প্যাকেজিং / পলি ব্যাগ', isInventory: true },
        { id: 'c3', key: 'spices', label: 'আদা, এলাচ ও মসলা', isInventory: true },
        { id: 'c4', key: 'mineral_water', label: 'খাবার পানির জার', isInventory: false },
      ];
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(initialCategories);

  // Category Add / Edit
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [catLabel, setCatLabel] = useState<string>('');
  const [catIsInventory, setCatIsInventory] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Handle Product Save (Add or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice || Number(prodPrice) < 0) return;

    if (editingProduct) {
      setCustomItems(
        customItems.map((item) =>
          item.id === editingProduct.id
            ? { ...item, name: prodName.trim(), price: Number(prodPrice), category: prodCategory }
            : item
        )
      );
      setEditingProduct(null);
    } else {
      const newItem: CustomProduct = {
        id: `prod_${Date.now()}`,
        name: prodName.trim(),
        price: Number(prodPrice),
        category: prodCategory,
      };
      setCustomItems([...customItems, newItem]);
    }
    setProdName('');
    setProdPrice('');
  };

  const handleEditProductClick = (item: CustomProduct) => {
    setEditingProduct(item);
    setProdName(item.name);
    setProdPrice(item.price);
    setProdCategory(item.category || 'নাস্তা');
  };

  const handleRemoveProduct = (id: string) => {
    setCustomItems(customItems.filter((i) => i.id !== id));
    if (editingProduct?.id === id) {
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
    }
  };

  // Handle Category Save
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) return;

    if (editingCategory) {
      setCustomCategories(
        customCategories.map((c) =>
          c.id === editingCategory.id
            ? { ...c, label: catLabel.trim(), isInventory: catIsInventory }
            : c
        )
      );
      setEditingCategory(null);
    } else {
      const newCat: CustomCategory = {
        id: `cat_${Date.now()}`,
        key: `custom_${Date.now()}`,
        label: catLabel.trim(),
        isInventory: catIsInventory,
      };
      setCustomCategories([...customCategories, newCat]);
    }
    setCatLabel('');
    setCatIsInventory(true);
  };

  const handleEditCategoryClick = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setCatLabel(cat.label);
    setCatIsInventory(cat.isInventory);
  };

  const handleRemoveCategory = (id: string) => {
    setCustomCategories(customCategories.filter((c) => c.id !== id));
    if (editingCategory?.id === id) {
      setEditingCategory(null);
      setCatLabel('');
    }
  };

  // Global Save
  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    try {
      await onSaveSettings({
        ...settings,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        milkTeaPrice: Number(milkTeaPrice) || 20,
        blackTeaPrice: Number(blackTeaPrice) || 5,
        customItems: JSON.stringify(customItems),
        customCategories: JSON.stringify(customCategories),
      });
      setShowSavedToast(true);
      setTimeout(() => {
        setShowSavedToast(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                দোকানের সেটিংস ও ব্যবস্থাপনা
              </h3>
              <p className="text-xs text-stone-500">মূল্য পরিবর্তন, পণ্য ও ক্যাটাগরি নিয়ন্ত্রণ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-stone-100 mb-4 text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            দোকান প্রোফাইল
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tea_prices')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'tea_prices'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            চায়ের নির্ধারিত দাম
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            পণ্য ও নাস্তা ({customItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'categories'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            খরচের ক্যাটাগরি ({customCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'data'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ডাটা রিসেট
          </button>
        </div>

        {/* Tab Contents (Scrollable body) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm">
          {/* TAB 1: SHOP PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  দোকানের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="যেমন: ভাই ভাই চা স্টল"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  মালিক / পরিচালকের নাম
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ আলমগীর"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  দোকানের মোবাইল নম্বর (রশিদে প্রিন্ট হবে)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="০১৭১২-৩৪৫৬৭৮"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  দোকানের ঠিকানা / বাজার (রশিদে প্রিন্ট হবে)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: স্টেশন বাজার, ঢাকা"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TEA PRICES */}
          {activeTab === 'tea_prices' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <p className="text-xs text-amber-900 font-medium">
                  এখানে মূল চায়ের কাপ প্রতি নির্ধারিত বিক্রয় মূল্য সেট করুন। ড্যাশবোর্ডে দ্রুত চা বিক্রির সময় এই দাম স্বয়ংক্রিয়ভাবে হিসাব হবে:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      ☕ দুধ চা (৳ / কাপ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={milkTeaPrice}
                      onChange={(e) => setMilkTeaPrice(Number(e.target.value) || 0)}
                      className="w-full bg-stone-50 border border-amber-300 rounded-xl px-3 py-2 text-base font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      🍵 লাল চা / রং চা (৳ / কাপ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={blackTeaPrice}
                      onChange={(e) => setBlackTeaPrice(Number(e.target.value) || 0)}
                      className="w-full bg-stone-50 border border-amber-300 rounded-xl px-3 py-2 text-base font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & SNACKS (EDIT, DELETE, ADD) */}
          {activeTab === 'products' && (
            <div className="space-y-3.5">
              {/* Product Form (Add / Edit) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                <h4 className="text-xs font-bold text-stone-900 mb-2">
                  {editingProduct ? 'পণ্যটি সংশোধন করুন:' : 'নতুন পণ্য বা নাস্তা যোগ করুন:'}
                </h4>

                <form onSubmit={handleSaveProduct} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="পণ্যের নাম (যেমন: কেক)"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="দাম (টাকা ৳)"
                      value={prodPrice}
                      onChange={(e) =>
                        setProdPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="নাস্তা">নাস্তা / বিস্কুট</option>
                      <option value="সিগারেট">সিগারেট</option>
                      <option value="পান">পান / সুপারি</option>
                      <option value="পানীয়">ঠাণ্ডা পানীয় / পানি</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setProdName('');
                          setProdPrice('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs"
                      >
                        বাতিল
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      {editingProduct ? (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>পরিবর্তন সংরক্ষণ</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>পণ্য যুক্ত করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Product List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {customItems.length === 0 ? (
                  <p className="text-center text-xs text-stone-400 py-4">কোনো পণ্য নেই।</p>
                ) : (
                  customItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 hover:border-amber-300 transition-all text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900">{item.name}</span>
                        {item.category && (
                          <span className="text-[10px] text-stone-400 ml-2 bg-stone-100 px-1.5 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-900 text-sm">৳{item.price}</span>
                        <button
                          type="button"
                          onClick={() => handleEditProductClick(item)}
                          title="সম্পাদনা করুন"
                          className="p-1 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-stone-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.id)}
                          title="মুছে ফেলুন"
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSE CATEGORIES (EDIT, DELETE, ADD) */}
          {activeTab === 'categories' && (
            <div className="space-y-3.5">
              {/* Category Form */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                <h4 className="text-xs font-bold text-stone-900 mb-2">
                  {editingCategory ? 'ক্যাটাগরি সংশোধন করুন:' : 'নতুন খরচের ক্যাটাগরি তৈরি করুন:'}
                </h4>

                <form onSubmit={handleSaveCategory} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="ক্যাটাগরির নাম (যেমন: প্যাকেজিং / পলি ব্যাগ)"
                      value={catLabel}
                      onChange={(e) => setCatLabel(e.target.value)}
                      className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />

                    <label className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={catIsInventory}
                        onChange={(e) => setCatIsInventory(e.target.checked)}
                        className="rounded-sm text-amber-800 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-xs text-stone-700 font-semibold">
                        এটি কাঁচামাল / পণ্য ক্রয়
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCatLabel('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs"
                      >
                        বাতিল
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      {editingCategory ? (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>আপডেট করুন</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>ক্যাটাগরি যুক্ত করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {customCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 hover:border-amber-300 transition-all text-xs"
                  >
                    <div>
                      <span className="font-bold text-stone-900">{cat.label}</span>
                      <span
                        className={`text-[10px] ml-2 px-2 py-0.5 rounded-full font-bold ${
                          cat.isInventory
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {cat.isInventory ? 'কাঁচামাল' : 'পরিচালনা'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCategoryClick(cat)}
                        title="সম্পাদনা করুন"
                        className="p-1 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-stone-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        title="মুছে ফেলুন"
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DATA RESET & CLEANUP */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-900 text-sm">
                      পরীক্ষামূলক (ডেমো) লেনদেন মুছে ফেলুন
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      আপনি যদি অ্যাপটি শুরু করার পর পূর্বের টেস্ট বিক্রি ও টেস্ট খরচের এন্ট্রিগুলো পরিষ্কার করে একদম নতুন বাস্তব খাতা শুরু করতে চান, তাহলে নিচের বাটনে ক্লিক করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            'আপনি কি নিশ্চিত যে ডেমো লেনদেনগুলো মুছে একদম ফ্রেশ খাতা শুরু করতে চান?'
                          )
                        ) {
                          onResetDemoData?.();
                          onClose();
                        }
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>সব টেস্ট লেনদেন পরিষ্কার করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs hover:bg-stone-50"
          >
            বন্ধ করুন
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitAll}
            className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-900/20 active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <span>সংরক্ষণ হচ্ছে...</span>
            ) : showSavedToast ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>সংরক্ষিত হয়েছে!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>সকল পরিবর্তন সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
