"use client";
import React, { useState } from 'react';
import { 
  ShieldCheck, RefreshCw, Trash2, Database, CheckCircle2, XCircle, Activity, Star, 
  Layers, Loader2, ArrowUp, ArrowDown, Film, MonitorPlay, ZapOff 
} from 'lucide-react';

export default function NanoBananaPro() {
  const [authKey, setAuthKey] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
  
  // إعدادات الخدمات (جعل API Key اختيارياً)
  const [debrid, setDebrid] = useState({ type: 'realdebrid', apiKey: '' });
  const [verifyStatus, setVerifyStatus] = useState({ debrid: 'idle' });
  const [addons, setAddons] = useState([]);
  const rpdbKey = "t0-free-rpdb"; 

  // --- التحقق من الـ API (يعمل فقط إذا تم إدخال مفتاح) ---
  const verifyAPI = async (service, key) => {
    if (!key) return; // لا حاجة للتحقق إذا كان الحقل فارغاً
    setVerifyStatus(prev => ({ ...prev, [service]: 'loading' }));
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, type: debrid.type, key })
      });
      const data = await res.json();
      setVerifyStatus(prev => ({ ...prev, [service]: data.success ? 'success' : 'error' }));
    } catch (e) { setVerifyStatus(prev => ({ ...prev, [service]: 'error' })); }
  };

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

  // --- توليد قائمة الإضافات (منطق الديبريد الاختياري) ---
  const generateAddons = () => {
    const { type, apiKey } = debrid;
    
    // الإضافات الأساسية التي لا تحتاج ديبريد
    const presets = [
      { name: 'Cinemeta (Official)', url: 'https://v3-cinemeta.strem.io/manifest.json' },
      { name: 'Public Movie Domains', url: 'https://public-domain-movies.strem.io/manifest.json' },
      { name: 'SubHero', url: 'https://subhero.strem.io/manifest.json' }
    ];

    // بناء رابط Torrentio بناءً على وجود الديبريد أو عدمه
    let torrentioUrl = "https://torrentio.strem.fun/";
    if (apiKey) {
      torrentioUrl += `${type}=${apiKey}|`;
    }
    torrentioUrl += `language=ar|rpdb=${rpdbKey}/manifest.json`;
    presets.push({ name: apiKey ? 'Torrentio (Debrid)' : 'Torrentio (P2P)', url: torrentioUrl });

    // إضافة StremThru فقط في حال وجود ديبريد لأنه لا يعمل بدونه
    if (apiKey) {
      presets.push({ name: 'StremThru Torz', url: `https://stremthru.strem.io/torz/config/${apiKey}/manifest.json` });
    }

    setAddons(presets.map(p => ({ transportUrl: p.url, transportName: 'http', name: p.name })));
    setStep(3);
  };

  // --- وظائف التحكم (ترتيب وحذف) ---
  const moveAddon = (index, direction) => {
    const newAddons = [...addons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newAddons.length) return;
    [newAddons[index], newAddons[targetIndex]] = [newAddons[targetIndex], newAddons[index]];
    setAddons(newAddons);
  };

  const deleteAddon = (index) => setAddons(addons.filter((_, i) => i !== index));

  // --- المزامنة المتسلسلة (واحدة تلو الأخرى) ---
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const syncOneByOne = async () => {
    if (addons.length === 0) return alert("القائمة فارغة!");
    setLoading(true);
    setSyncProgress({ current: 0, total: addons.length, status: 'بدء المزامنة المتسلسلة...' });
    
    let currentCollection = [];
    try {
      for (let i = 0; i < addons.length; i++) {
        const addon = addons[i];
        setSyncProgress({ current: i + 1, total: addons.length, status: `جاري تثبيت: ${addon.name}...` });
        currentCollection.push({ transportUrl: addon.transportUrl, transportName: 'http' });

        const res = await fetch('https://api.strem.io/api/addonCollectionSet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey, addons: currentCollection })
        });
        
        const data = await res.json();
        if (!data.result?.success) throw new Error(`فشل تثبيت ${addon.name}`);

        if (i < addons.length - 1) {
          setSyncProgress(prev => ({ ...prev, status: `تم! بانتظار 5 ثوانٍ للإضافة التالية...` }));
          await delay(5000);
        }
      }
      alert("تمت المزامنة بنجاح! القائمة مرتبة كما طلبت.");
      setSyncProgress({ current: 0, total: 0, status: 'اكتمل بنجاح ✅' });
    } catch (e) { alert("حدث خطأ أثناء المزامنة: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 flex justify-center items-center" dir="rtl">
      <div className="w-full max-w-xl bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="p-6 bg-blue-600/10 border-b border-slate-800 text-center italic font-black text-2xl text-blue-500">
          Nano Banana Pro 🍌 v26
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4 text-right">
              <label className="text-sm font-bold text-slate-500">بيانات ستريميو</label>
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" placeholder="البريد الإلكتروني" onChange={e => setCredentials({...credentials, email: e.target.value})} />
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none" type="password" placeholder="كلمة المرور" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 p-4 rounded-xl font-bold">دخول ومتابعة</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-right">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                   <label className="text-xs font-bold text-blue-400 flex items-center gap-2"><Database size={16}/> إعداد Debrid (اختياري)</label>
                   {!debrid.apiKey && <span className="text-[10px] text-amber-500 flex items-center gap-1"><ZapOff size={12}/> وضع الـ P2P مفعّل</span>}
                </div>
                <div className="flex gap-2">
                  <select className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs" onChange={e => setDebrid({...debrid, type: e.target.value})}>
                    <option value="realdebrid">Real-Debrid</option>
                    <option value="torbox">TorBox</option>
                  </select>
                  <div className="flex-1 relative">
                    <input className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs pr-10" placeholder="API Key (اتركه فارغاً للتثبيت العادي)" onChange={e => setDebrid({...debrid, apiKey: e.target.value})} />
                    {debrid.apiKey && (
                      <button onClick={() => verifyAPI('debrid', debrid.apiKey)} className="absolute left-1.5 top-1.5 bg-slate-700 p-1.5 rounded text-[8px] flex items-center gap-1 font-bold">
                         تحقق {verifyStatus.debrid === 'loading' ? <Loader2 className="animate-spin" size={10}/> : verifyStatus.debrid === 'success' ? '✅' : '❌'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={generateAddons} className="w-full bg-blue-600 p-4 rounded-xl font-bold shadow-lg">توليد الإضافات والترتيب ←</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                <div className="text-right">
                  <h2 className="font-bold text-sm text-blue-400 italic">التحكم النهائي</h2>
                  <p className="text-[10px] text-slate-400">رتب أو احذف الإضافات قبل المزامنة المتسلسلة</p>
                </div>
                <button onClick={syncOneByOne} disabled={loading} className="bg-green-600 px-6 py-2 rounded-full font-bold text-xs shadow-lg shadow-green-900/40">
                  {loading ? 'جاري العمل...' : 'بدء المزامنة'}
                </button>
              </div>

              {loading && (
                <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/30 text-center animate-pulse">
                   <p className="text-[10px] text-blue-300 font-bold">{syncProgress.status}</p>
                   <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}></div>
                   </div>
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto px-1">
                {addons.map((ad, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 group transition hover:border-blue-500/40">
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] bg-slate-800 w-5 h-5 flex items-center justify-center rounded-full text-blue-400 font-bold">{i + 1}</div>
                      <span className="text-xs font-medium text-slate-200">{ad.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveAddon(i, 'up')} disabled={i === 0} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-20"><ArrowUp size={14}/></button>
                      <button onClick={() => moveAddon(i, 'down')} disabled={i === addons.length - 1} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-20"><ArrowDown size={14}/></button>
                      <button onClick={() => deleteAddon(i)} className="p-1.5 hover:bg-red-900/30 text-red-500 rounded-lg"><Trash2 size={14}/></button>
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
