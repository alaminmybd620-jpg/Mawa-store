import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', desc: 'দুধ চা দ্রুত বিক্রি যোগ করুন' },
    { key: '2', desc: 'লাল চা দ্রুত বিক্রি যোগ করুন' },
    { key: 'N', desc: 'নতুন বিক্রি ফরম খুলুন' },
    { key: 'E', desc: 'নতুন খরচ ফরম খুলুন' },
    { key: 'B', desc: 'বাকি খাতা খুলুন' },
    { key: 'C', desc: 'ক্যাশ রেজিস্টার ড্রয়ার খুলুন' },
    { key: 'R', desc: 'হিসাব খতিয়ান ও রিপোর্ট দেখুন' },
    { key: 'S', desc: 'দোকান সেটিংস খুলুন' },
    { key: 'F', desc: 'ফুলস্ক্রিন (POS মোড) টগল করুন' },
    { key: 'Esc', desc: 'যেকোনো খোলা ডায়ালগ বা পপআপ বন্ধ করুন' },
    { key: '?', desc: 'এই কীবোর্ড শর্টকাট সহায়িকা দেখুন' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              কম্পিউটার কীবোর্ড শর্টকাট (Chrome Optimized)
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-500 mb-3">
          পিসিতে বা ল্যাপটপে মাউস ছাড়াই দ্রুত চা দোকান হিসাব পরিচালনা করতে নিচের কীগুলো ব্যবহার করুন:
        </p>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100 text-xs"
            >
              <span className="text-stone-700 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg shadow-2xs font-mono font-bold text-amber-900 text-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition-all"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
