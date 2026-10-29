import React, { useState } from 'react';
import { Download, Monitor, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Desktop Chrome / Android Flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Google Chrome বা ডিভাইসে অ্যাপটি ইনস্টল করুন"
        className="flex items-center gap-1.5 rounded-xl bg-amber-700/90 hover:bg-amber-600 border border-amber-500/60 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 animate-pulse"
      >
        <Download className="w-3.5 h-3.5 text-amber-200" />
        <span className="hidden sm:inline">ইনস্টল করুন</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-700 border border-amber-600/50 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">iOS ইনস্টল</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-stone-900">iPhone / iPad-এ অ্যাপ হিসেবে রাখুন</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                ১. সাফারির নিচে থাকা <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।<br />
                ২. নিচে স্ক্রোল করে <strong>Add to Home Screen (হোম স্ক্রিনে যোগ করুন)</strong> নির্বাচন করুন।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-amber-800 py-2.5 text-xs font-bold text-white hover:bg-amber-900 transition-all"
              >
                বুঝেছি, বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
