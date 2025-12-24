"use client";
import React, { useState, useEffect } from 'react';
import { Layout, Settings, Link2, RefreshCw, Trash2, GripVertical, CheckCircle, XCircle } from 'lucide-react';

export default function StremioManager() {
  const [authKey, setAuthKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Login, 2: Setup, 3: Manage
  const [debridKey, setDebridKey] = useState('');
  const [debridType, setDebridType] = useState('realdebrid');
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. تسجيل الدخول والتحقق
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, type: 'Login' })
      });
      const data = await res.json();
      if (data.result?.authKey) {
        setAuthKey(data.result.authKey);
        setStep(2);
      } else {
        alert("فشل تسجيل الدخول: " + (data.error || "بيانات خاطئة"));
      }
    } catch (e) { alert("خطأ في الاتصال بخادم Stremio"); }
    setLoading(false);
  };

  // 2. التحقق من مفتاح Debrid (مثال لـ Real-Debrid)
  const verifyDebrid = async () => {
    if (!debridKey) return alert("أدخل المفتاح أولاً");
    // ملاحظة: التحقق الفعلي يحتاج وسيط (Proxy) لتجنب الـ CORS
    alert("سيتم التحقق عند التثبيت...");
  };

  // 3. بناء روابط الإضافات وتثبيتها تلقائياً
  const autoInstall = async () => {
    const templates = [
      { name: 'Torrentio', url: `https://torrentio.strem.fun/${debridType}=${debridKey}/manifest.json` },
      { name: 'Comet', url: `https://comet.elfhosted.com/${debridKey}/manifest.json` },
      { name: 'MediaFusion', url: `https://mediafusion.elfhosted.com/config/${debridKey}/manifest.json` }
    ];

    const newAddons = templates.map(t => ({
      transportUrl: t.url,
      transportName: 'http'
    }));

    setAddons([...addons, ...newAddons]);
    alert("تم تجهيز الإضافات، اضغط Sync للمزامنة");
    setStep(3);
  };

  // 4. جلب الإضافات المثبتة حالياً
  const loadCurrentAddons = async () => {
    setLoading(true);
    const res = await fetch('https://api.strem.io/api/addonCollectionGet', {
      method: 'POST',
      body: JSON.stringify({ authKey })
    });
    const data = await res.json();
    if (data.result?.addons) {
      setAddons(data.result.addons);
      setStep(3);
    }
    setLoading(false);
  };

  // 5. مزامنة القائمة مع حساب Stremio
  const syncAddons = async () => {
    setLoading(true);
    const res = await fetch('https://api.strem.io/api/addonCollectionSet', {
      method: 'POST',
      body: JSON.stringify({ authKey, addons })
    });
    const data = await res.json();
    if (data.result?.success) alert("تمت المزامنة بنجاح!");
    setLoading(false);
  };

  const removeAddon = (idx) => {
    setAddons(addons.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans" dir="rtl">
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-2">Stremio Auto Setup 🍌</h1>
        <p className="text-slate-400">الإدارة الذكية لإضافاتك</p>
      </header>

      <main className="max-w-2xl mx-auto bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        
        {/* Step 1: Login */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">تسجيل الدخول إلى Stremio</h2>
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="كلمة المرور" className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition">
              {loading ? "جاري التحقق..." : "دخول"}
            </button>
          </div>
        )}

        {/* Step 2: API Config */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">إعداد خدمات Debrid والترجمة</h2>
            <div>
              <label className="block text-sm mb-2 text-slate-400">اختر خدمة الـ Debrid</label>
              <select className="w-full p-3 rounded bg-slate-700" value={debridType} onChange={(e) => setDebridType(e.target.value)}>
                <option value="realdebrid">Real-Debrid</option>
                <option value="alldebrid">AllDebrid</option>
                <option value="premiumize">Premiumize</option>
                <option value="torbox">TorBox</option>
              </select>
            </div>
            <input type="text" placeholder="API Key الخاص بالخدمة" className="w-full p-3 rounded bg-slate-700 border border-slate-600" value={debridKey} onChange={(e) => setDebridKey(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={autoInstall} className="bg-green-600 hover:bg-green-700 p-3 rounded-lg font-bold transition">تثبيت الإضافات المقترحة</button>
              <button onClick={loadCurrentAddons} className="bg-slate-600 hover:bg-slate-700 p-3 rounded-lg font-bold transition">جلب إضافاتي الحالية</button>
            </div>
          </div>
        )}

        {/* Step 3: Manage & Sync */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">إدارة القائمة ({addons.length})</h2>
              <button onClick={syncAddons} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full flex items-center gap-2">
                <RefreshCw size={18} /> مزامنة (Sync)
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {addons.map((addon, index) => (
                <div key={index} className="flex items-center gap-4 bg-slate-700 p-4 rounded-xl border border-slate-600 group">
                  <GripVertical className="text-slate-500 cursor-move" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-mono text-blue-300 truncate">{addon.transportUrl}</p>
                  </div>
                  <button onClick={() => removeAddon(index)} className="text-red-400 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
