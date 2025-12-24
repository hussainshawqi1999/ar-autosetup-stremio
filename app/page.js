"use client";
import React, { useState } from 'react';
import { 
  Settings, ShieldCheck, ListOrdered, RefreshCw, Trash2, 
  Subtitles, CheckCircle2, LayoutGrid, Database, Key, Box
} from 'lucide-react';

export default function StremioAutoSetup() {
  const [authKey, setAuthKey] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // إعدادات Debrid
  const [debrid, setDebrid] = useState({ type: 'realdebrid', apiKey: '' });
  const [subKeys, setSubKeys] = useState({ subdl: '', subsource: '' });
  
  // قائمة الإضافات (المصفوفة النهائية التي ستُرسل لـ Stremio)
  const [addons, setAddons] = useState([]);

  // --- 1. تسجيل الدخول والتحقق من الحساب ---
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
      } else { alert("خطأ في البيانات: " + (data.error || "تأكد من الحساب")); }
    } catch (e) { alert("فشل الاتصال بخادم Stremio"); }
    setLoading(false);
  };

  // --- 2. بناء روابط الإضافات بناءً على القائمة المطلوبة ---
  const generateAddons = () => {
    if (!debrid.apiKey) return alert("يرجى إدخال مفتاح Debrid");
    
    const { type, apiKey } = debrid;
    
    // قائمة القوالب (Templates) لكل الإضافات التي طلبتها
    const presets = [
      // Scrapers الأساسية
      { name: 'Torrentio', url: `https://torrentio.strem.fun/${type}=${apiKey}/manifest.json` },
      { name: 'Comet', url: `https://comet.elfhosted.com/${apiKey}/manifest.json` },
      { name: 'MediaFusion', url: `https://mediafusion.elfhosted.com/config/${apiKey}/manifest.json` },
      { name: 'Jackettio', url: `https://jackettio.strem.fun/config/${apiKey}/manifest.json` },
      { name: 'TorrentsDB', url: `https://torrents-db.strem.fun/${type}=${apiKey}/manifest.json` },
      
      // إضافات إضافية
      { name: 'Sootio', url: `https://sootio.strem.io/${type}=${apiKey}/manifest.json` },
      { name: 'Peerflix', url: `https://peerflix-node.strem.io/manifest.json` },
      { name: 'ThePirateBay+', url: `https://tpb-plus.strem.io/manifest.json` },
      { name: 'Nuvio Streams', url: `https://nuvio.strem.io/config/${apiKey}/manifest.json` },
      { name: 'WebStreamr', url: `https://webstreamr.strem.io/manifest.json` },
      
      // أدوات و Metadata
      { name: 'Cinemeta', url: `https://v3-cinemeta.strem.io/manifest.json` },
      { name: 'Anime Kitsu', url: `https://anime-kitsu.strem.io/manifest.json` },
      { name: 'Local Files', url: `https://local-files.strem.io/manifest.json` },
      { name: 'AIOLists', url: `https://aiolists.strem.io/manifest.json` },
      
      // الترجمة
      { name: 'SubHero', url: `https://subhero.strem.io/manifest.json` },
      { name: 'Subdivx', url: `https://subdivx.strem.io/manifest.json` }
    ];

    // إضافة إضافات الترجمة بـ API المخصص إذا وُجدت
    if (subKeys.subdl) presets.push({ name: 'SubDL', url: `https://subdl.strem.io/config/${subKeys.subdl}/manifest.json` });
    if (subKeys.subsource) presets.push({ name: 'SubSource', url: `https://subsource.strem.io/config/${subKeys.subsource}/manifest.json` });

    const finalAddons = presets.map(p => ({
      transportUrl: p.url,
      transportName: 'http',
      name: p.name
    }));

    setAddons(finalAddons);
    alert("تم تجهيز قائمة الإضافات!");
    setStep(3);
  };

  // --- 3. جلب الإضافات الحالية من الحساب ---
  const loadFromAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/addonCollectionGet', {
        method: 'POST',
        body: JSON.stringify({ authKey })
      });
      const data = await res.json();
      if (data.result?.addons) {
        setAddons(data.result.addons);
        setStep(3);
      }
    } catch (e) { alert("خطأ في جلب البيانات"); }
    setLoading(false);
  };

  // --- 4. المزامنة النهائية (Sync) ---
  const syncAddons = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/addonCollectionSet', {
        method: 'POST',
        body: JSON.stringify({ authKey, addons })
      });
      const data = await res.json();
      if (data.result?.success) alert("نجاح! تمت المزامنة مع حسابك.");
    } catch (e) { alert("فشلت المزامنة"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-10 flex justify-center items-center" dir="rtl">
      <div className="w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 bg-blue-600/10 border-b border-slate-800 text-center">
          <h1 className="text-3xl font-black text-blue-500 mb-2 italic">Stremio Auto Setup - By Hussain</h1>
          <p className="text-slate-400 text-sm">أداة الإعداد التلقائي والمزامنة الاحترافية</p>
        </div>

        <div className="p-8">
          {/* Step 1: Login */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xl font-bold mb-4"><ShieldCheck className="text-blue-500"/> سجل دخولك أولاً</div>
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 transition" placeholder="البريد الإلكتروني" onChange={e => setCredentials({...credentials, email: e.target.value})} />
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 transition" type="password" placeholder="كلمة المرور" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center">
                {loading ? <RefreshCw className="animate-spin" /> : "تحقق من الحساب وتابع"}
              </button>
            </div>
          )}

          {/* Step 2: Debrid & Preset Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400"><Database size={20}/> إعداد Debrid</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="p-4 rounded-xl bg-slate-900 border border-slate-800" value={debrid.type} onChange={e => setDebrid({...debrid, type: e.target.value})}>
                    <option value="realdebrid">Real-Debrid</option>
                    <option value="alldebrid">All-Debrid</option>
                    <option value="premiumize">Premiumize</option>
                    <option value="debridlink">Debrid-Link</option>
                    <option value="easydebrid">EasyDebrid</option>
                    <option value="torbox">TorBox</option>
                  </select>
                  <input className="p-4 rounded-xl bg-slate-900 border border-slate-800" placeholder="API Key" onChange={e => setDebrid({...debrid, apiKey: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400"><Subtitles size={20}/> مفاتيح الترجمة (اختياري)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs" placeholder="SubDL API Key" onChange={e => setSubKeys({...subKeys, subdl: e.target.value})} />
                  <input className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs" placeholder="SubSource API Key" onChange={e => setSubKeys({...subKeys, subsource: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button onClick={generateAddons} className="bg-green-600 p-4 rounded-xl font-bold hover:bg-green-700 transition">توليد كل الإضافات</button>
                <button onClick={loadFromAccount} className="bg-slate-700 p-4 rounded-xl font-bold hover:bg-slate-600 transition">جلب إضافاتي الحالية</button>
              </div>
            </div>
          )}

          {/* Step 3: Reorder & Sync */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
                <div>
                  <h2 className="font-bold">جاهز للمزامنة</h2>
                  <p className="text-xs text-slate-400">لديك {addons.length} إضافة في القائمة</p>
                </div>
                <button onClick={syncAddons} className="bg-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-500 flex items-center gap-2">
                  {loading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={18}/>} مزامنة (Sync)
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {addons.map((addon, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 group">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 text-xs">{index + 1}</span>
                      <span className="font-medium text-sm text-blue-300 truncate max-w-[200px]">{addon.name || addon.transportUrl.split('/')[2]}</span>
                    </div>
                    <button onClick={() => setAddons(addons.filter((_, i) => i !== index))} className="text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 size={18}/>
                    </button>
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
