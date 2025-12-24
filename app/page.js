"use client";
import React, { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Save, Loader2, AlertCircle } from 'lucide-react';

export default function NanoBananaPro() {
  const [authKey, setAuthKey] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [rdKey, setRdKey] = useState('');
  const [torboxKey, setTorboxKey] = useState('');
  const [addons, setAddons] = useState([]);

  // --- 1. تسجيل الدخول ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, type: 'Login' })
      });
      const data = await res.json();
      if (data.result?.authKey) { 
        setAuthKey(data.result.authKey); 
        setStep(2); 
      } else { 
        alert("بيانات الدخول غير صحيحة"); 
      }
    } catch (e) { 
      alert("فشل الاتصال بخادم ستريميو"); 
    }
    setLoading(false);
  };

  // --- 2. توليد القائمة (الروابط فقط) ---
  const generateAddons = () => {
    const presets = [];
    
    // Torrentio - Torbox
    if (torboxKey) {
      presets.push({ 
        name: 'Torrentio (Torbox)', 
        url: `https://torrentio.strem.fun/torbox=${torboxKey}/manifest.json` 
      });
    }

    // Torrentio - RealDebrid
    if (rdKey) {
      presets.push({ 
        name: 'Torrentio (Real-Debrid)', 
        url: `https://torrentio.strem.fun/realdebrid=${rdKey}/manifest.json` 
      });
    }
    
    // Subsource Arabic (الرابط المعتمد)
    presets.push({ 
      name: 'Subsource Arabic', 
      url: `https://subsource.strem.top/YXJhYmljLGVuZ2xpc2gvaGlJbmNsdWRlLw==/manifest.json` 
    });

    // SubHero Arabic (الرابط المعتمد)
    presets.push({ 
      name: 'SubHero Arabic', 
      url: `https://subhero.onrender.com/%7B%22language%22%3A%22en%2Car%22%7D/manifest.json` 
    });

    setAddons(presets.map(p => ({ transportUrl: p.url, transportName: 'http', name: p.name })));
    setStep(3);
  };

  // --- 3. المزامنة عبر السيرفر الوسيط ---
  const startSync = async () => {
    setLoading(true);
    try {
      // نرسل الروابط فقط إلى ملف route.js وهو سيقوم بجلب المانيفست وحل مشكلة null
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authKey: authKey,
          addons: addons.map(ad => ({ transportUrl: ad.transportUrl, transportName: "http" }))
        })
      });
      
      const data = await res.json();
      
      if (data.result?.success) {
        alert("نجاح! تم إصلاح المانيفست وتثبيت الإضافات في حسابك.");
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        // أحياناً النجاح لا يعيد رسالة واضحة
        alert("تمت العملية (يرجى التحقق من تطبيق ستريميو للتأكد).");
      }
    } catch (e) { 
      alert("فشل: " + e.message); 
    }
    setLoading(false);
  };

  // وظائف الترتيب والحذف
  const move = (idx, dir) => {
    const list = [...addons];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target >= 0 && target < list.length) {
      [list[idx], list[target]] = [list[target], list[idx]];
      setAddons(list);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 flex justify-center items-center" dir="rtl">
      <div className="w-full max-w-lg bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="p-6 bg-blue-600/10 border-b border-slate-800 text-center font-black text-blue-500 text-2xl italic">
          Nano Banana Pro 🍌 Final Fix
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" placeholder="إيميل ستريميو" onChange={e => setCredentials({...credentials, email: e.target.value})} />
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" type="password" placeholder="كلمة المرور" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 p-4 rounded-xl font-bold">{loading ? "جاري الدخول..." : "دخول"}</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs" placeholder="Real-Debrid API Key" onChange={e => setRdKey(e.target.value)} />
              <input className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs" placeholder="Torbox API Key" onChange={e => setTorboxKey(e.target.value)} />
              <button onClick={generateAddons} className="w-full bg-blue-600 p-4 rounded-xl font-bold">توليد القائمة ←</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20 flex gap-2 items-center">
                <AlertCircle size={16} className="text-blue-400" />
                <p className="text-[10px] text-blue-200 font-bold tracking-tight">سيتم معالجة المانيفست تلقائياً واستبدال القائمة القديمة.</p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto px-1">
                {addons.map((ad, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-slate-800 bg-slate-900">
                    <span className="text-xs font-bold">{ad.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => move(i, 'up')} className="p-1 hover:bg-slate-800 rounded">↑</button>
                      <button onClick={() => move(i, 'down')} className="p-1 hover:bg-slate-800 rounded">↓</button>
                      <button onClick={() => setAddons(addons.filter((_, idx) => idx !== i))} className="text-red-500 px-2">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={startSync} disabled={loading} className="w-full bg-green-600 p-4 rounded-xl font-bold flex justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {loading ? 'جاري جلب المانيفست والمزامنة...' : 'تثبيت نهائي'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
