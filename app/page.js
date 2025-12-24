"use client";
import React, { useState } from 'react';
import { 
  ShieldCheck, RefreshCw, Trash2, Database, CheckCircle2, XCircle, Activity, Star, 
  Layers, Loader2, ArrowUp, ArrowDown, Film, MonitorPlay, ZapOff, PlayCircle
} from 'lucide-react';

export default function NanoBananaPro() {
  const [authKey, setAuthKey] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
  
  const [debrid, setDebrid] = useState({ type: 'realdebrid', apiKey: '' });
  const [addons, setAddons] = useState([]);
  const rpdbKey = "t0-free-rpdb"; // مفتاح التقييمات المدمج

  // --- تسجيل الدخول ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, type: 'Login' })
      });
      const data = await res.json();
      if (data.result?.authKey) { setAuthKey(data.result.authKey); setStep(2); }
      else { alert("بيانات الدخول غير صحيحة"); }
    } catch (e) { alert("فشل الاتصال بخادم Stremio"); }
    setLoading(false);
  };

  // --- توليد الإضافات (صيغة مبسطة جداً) ---
  const generateAddons = () => {
    const { type, apiKey } = debrid;
    const presets = [
      { name: 'Cinemeta (Official)', url: 'https://v3-cinemeta.strem.io/manifest.json' },
      { name: 'Public Movie Domains', url: 'https://public-domain-movies.strem.io/manifest.json' },
      { name: 'SubHero Arabic', url: 'https://subhero.strem.io/manifest.json' }
    ];

    // Torrentio بناءً على وجود ديبريد أو عدمه
    let tUrl = "https://torrentio.strem.fun/";
    if (apiKey) tUrl += `${type}=${apiKey}|`;
    tUrl += `language=ar|rpdb=${rpdbKey}/manifest.json`;
    presets.push({ name: 'Torrentio', url: tUrl });

    if (apiKey) {
      presets.push({ name: 'StremThru Torz', url: `https://stremthru.strem.io/torz/config/${apiKey}/manifest.json` });
    }

    setAddons(presets.map(p => ({ transportUrl: p.url, transportName: 'http', name: p.name, status: 'pending' })));
    setStep(3);
  };

  // --- التحكم في القائمة ---
  const moveAddon = (index, direction) => {
    const newAddons = [...addons];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newAddons.length) return;
    [newAddons[index], newAddons[target]] = [newAddons[target], newAddons[index]];
    setAddons(newAddons);
  };

  const deleteAddon = (index) => setAddons(addons.filter((_, i) => i !== index));

  // --- المزامنة المتسلسلة الموثوقة ---
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const startSequentialSync = async () => {
    if (addons.length === 0) return alert("القائمة فارغة");
    setLoading(true);
    let currentCollection = [];
    
    try {
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i];
        setSyncProgress({ current: i + 1, total: addons.length, status: `جاري ربط: ${addon.name}...` });

        // بناء المجموعة تدريجياً لضمان عدم ضياع السابق
        currentCollection.push({ transportUrl: addon.transportUrl, transportName: 'http' });

        const res = await fetch('https://api.strem.io/api/addonCollectionSet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey, addons: currentCollection })
        });
        
        const data = await res.json();
        if (!data.result?.success) throw new Error(`رفض ستريميو الإضافة: ${addon.name}`);

        // تحديث حالة الإضافة في الواجهة
        const updatedAddons = [...addons];
        updatedAddons[i].status = 'success';
        setAddons(updatedAddons);

        if (i < addons.length - 1) {
          setSyncProgress(prev => ({ ...prev, status: `نجح! بانتظار 5 ثوانٍ للإضافة التالية...` }));
          await delay(5000); // الانتظار المطلوب
        }
      }
      alert("تمت المزامنة بنجاح يا حسين! القائمة الآن في حسابك بالترتيب.");
    } catch (e) {
      alert("توقفت المزامنة: " + e.message);
    }
    setLoading(false);
    setSyncProgress({ current: 0, total: 0, status: '' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 flex justify-center items-center" dir="rtl">
      <div className="w-full max-w-xl bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="p-6 bg-blue-600/10 border-b border-slate-800 text-center italic font-black text-2xl text-blue-500">
          Nano Banana Pro 🍌 v27
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" placeholder="البريد الإلكتروني" onChange={e => setCredentials({...credentials, email: e.target.value})} />
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" type="password" placeholder="كلمة المرور" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-700">دخول</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-right">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-blue-400 block mb-2">إعداد Debrid (اختياري)</label>
                <div className="flex gap-2">
                  <select className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs" onChange={e => setDebrid({...debrid, type: e.target.value})}>
                    <option value="realdebrid">Real-Debrid</option>
                    <option value="torbox">TorBox</option>
                  </select>
                  <input className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs" placeholder="API Key" onChange={e => setDebrid({...debrid, apiKey: e.target.value})} />
                </div>
              </div>
              <button onClick={generateAddons} className="w-full bg-blue-600 p-4 rounded-xl font-bold">توليد القائمة والترتيب ←</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                <div className="text-right">
                  <h2 className="font-bold text-sm text-blue-400 italic">نظام المزامنة المتسلسلة</h2>
                  <p className="text-[10px] text-slate-400">سيتم تثبيت إضافة كل 5 ثوانٍ لضمان النجاح</p>
                </div>
                <button onClick={startSequentialSync} disabled={loading} className="bg-green-600 px-6 py-2 rounded-full font-bold text-xs shadow-lg">
                  {loading ? 'جاري المزامنة...' : 'بدء التثبيت'}
                </button>
              </div>

              {loading && (
                <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/30 text-center">
                   <p className="text-[10px] text-blue-300 font-bold">{syncProgress.status}</p>
                   <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}></div>
                   </div>
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto px-1 custom-scrollbar">
                {addons.map((ad, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition ${ad.status === 'success' ? 'bg-green-600/10 border-green-500/30' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-blue-400 font-bold">{i + 1}</span>
                      <span className="text-xs text-slate-200">{ad.name}</span>
                      {ad.status === 'success' && <CheckCircle2 size={14} className="text-green-500" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveAddon(i, 'up')} className="p-1 hover:bg-slate-800 rounded"><ArrowUp size={14}/></button>
                      <button onClick={() => moveAddon(i, 'down')} className="p-1 hover:bg-slate-800 rounded"><ArrowDown size={14}/></button>
                      <button onClick={() => deleteAddon(i)} className="p-1 hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
