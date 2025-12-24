"use client";
import React, { useState } from 'react';
import { 
  Settings, ShieldCheck, ListOrdered, RefreshCw, Trash2, 
  Subtitles, CheckCircle2, Database, Key, Box, XCircle, Activity, Globe, Star
} from 'lucide-react';

export default function NanoBananaPro() {
  const [authKey, setAuthKey] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // إعدادات الخدمات واللغة
  const [debrid, setDebrid] = useState({ type: 'realdebrid', apiKey: '' });
  const [tmdbKey, setTmdbKey] = useState('');
  const [tmdbLang, setTmdbLang] = useState('ar-SA');
  const rpdbKey = "t0-free-rpdb"; // مفتاح التقييمات المدمج
  
  const [verifyStatus, setVerifyStatus] = useState({ debrid: 'idle', subdl: 'idle', subsource: 'idle', tmdb: 'idle' });
  const [subKeys, setSubKeys] = useState({ subdl: '', subsource: '' });
  const [addons, setAddons] = useState([]);

  const languages = [
    { name: 'العربية (السعودية)', value: 'ar-SA' },
    { name: 'العربية (الإمارات)', value: 'ar-AE' },
    { name: 'English (US)', value: 'en-US' },
  ];

  // --- 1. وظيفة التحقق الشاملة (Real API Calls for All Providers) ---
  const verifyAPI = async (service, key) => {
    if (!key) return alert("يرجى إدخال المفتاح أولاً");
    setVerifyStatus(prev => ({ ...prev, [service]: 'loading' }));

    try {
      let isValid = false;

      // أ- التحقق من TMDB
      if (service === 'tmdb') {
        const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${key}`);
        isValid = res.ok;
      } 
      
      // ب- التحقق من مزودي الـ Debrid بناءً على النوع المختار
      else if (service === 'debrid') {
        switch (debrid.type) {
          case 'realdebrid':
            const rdRes = await fetch(`https://api.real-debrid.com/rest/1.0/user?auth_token=${key}`);
            isValid = rdRes.ok;
            break;
            
          case 'torbox':
            const tbRes = await fetch(`https://api.torbox.app/v1/api/user/me`, {
              headers: { 'Authorization': `Bearer ${key}` }
            });
            const tbData = await tbRes.json();
            isValid = tbData.success === true;
            break;
            
          case 'alldebrid':
            // All-Debrid يتطلب agent (اسم التطبيق)
            const adRes = await fetch(`https://api.alldebrid.com/v4/user/details?agent=nano_banana&apikey=${key}`);
            const adData = await adRes.json();
            isValid = adData.status === 'success';
            break;
            
          case 'premiumize':
            const pmRes = await fetch(`https://www.premiumize.me/api/account/info?apikey=${key}`);
            const pmData = await pmRes.json();
            isValid = pmData.status === 'success';
            break;
            
          case 'debridlink':
            const dlRes = await fetch(`https://debrid-link.com/api/v2/account/infos?apikey=${key}`);
            const dlData = await dlRes.json();
            isValid = dlData.success === true;
            break;

          default:
            isValid = key.length > 10;
        }
      }
      
      // ج- التحقق من مفاتيح الترجمة (فحص أولي)
      else {
        isValid = key.length > 8;
      }

      setVerifyStatus(prev => ({ ...prev, [service]: isValid ? 'success' : 'error' }));
    } catch (e) {
      console.error("Verification error:", e);
      setVerifyStatus(prev => ({ ...prev, [service]: 'error' }));
    }
  };

  // --- 2. تسجيل دخول Stremio ---
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
      } else { alert("خطأ في بيانات الدخول"); }
    } catch (e) { alert("فشل الاتصال بخادم Stremio"); }
    setLoading(false);
  };

  // --- 3. بناء الروابط (Debrid + Language + RPDB) ---
  const generateAddons = () => {
    const { type, apiKey } = debrid;
    const shortLang = tmdbLang.split('-')[0];

    const presets = [
      { name: 'TMDB Metadata', url: `https://tmdb-addons.strem.io/config/${tmdbKey}/language=${tmdbLang}/manifest.json` },
      { name: 'Torrentio', url: `https://torrentio.strem.fun/${type}=${apiKey}|language=${shortLang}|rpdb=${rpdbKey}/manifest.json` },
      { name: 'Comet', url: `https://comet.elfhosted.com/${apiKey}/tmdb_api=${tmdbKey}/language=${shortLang}/rpdb=${rpdbKey}/manifest.json` },
      { name: 'Jackettio', url: `https://jackettio.strem.fun/config/${apiKey}/manifest.json` },
      { name: 'MediaFusion', url: `https://mediafusion.elfhosted.com/config/${apiKey}/manifest.json` },
      { name: 'Cinemeta', url: `https://v3-cinemeta.strem.io/manifest.json` }
    ];

    if (subKeys.subdl) presets.push({ name: 'SubDL', url: `https://subdl.strem.io/config/${subKeys.subdl}/manifest.json` });
    if (subKeys.subsource) presets.push({ name: 'SubSource', url: `https://subsource.strem.io/config/${subKeys.subsource}/manifest.json` });

    const finalAddons = presets.map(p => ({
      transportUrl: p.url,
      transportName: 'http',
      flags: { official: false }
    }));

    setAddons(finalAddons);
    setStep(3);
  };

  // --- 4. المزامنة ---
  const syncToStremio = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.strem.io/api/addonCollectionSet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey, addons })
      });
      const data = await res.json();
      if (data.result?.success) alert("Nano Banana Pro: تمت المزامنة بنجاح!");
    } catch (e) { alert("فشلت المزامنة"); }
    setLoading(false);
  };

  const StatusIcon = ({ status }) => {
    if (status === 'loading') return <Activity className="animate-spin text-blue-400" size={16}/>;
    if (status === 'success') return <CheckCircle2 className="text-green-500" size={16}/>;
    if (status === 'error') return <XCircle className="text-red-500" size={16}/>;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-10 flex justify-center items-center" dir="rtl">
      <div className="w-full max-w-2xl bg-[#0f172a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 bg-blue-600/10 border-b border-slate-800 text-center">
          <h1 className="text-2xl font-black text-blue-500 mb-1 italic">Nano Banana Pro 🍌</h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">Advanced Stremio Configurator</p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500">حساب Stremio</label>
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition" placeholder="البريد الإلكتروني" onChange={e => setCredentials({...credentials, email: e.target.value})} />
              <input className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition" type="password" placeholder="كلمة المرور" onChange={e => setCredentials({...credentials, password: e.target.value})} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-700 transition">تحقق من الحساب</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* TMDB Section */}
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <label className="text-sm font-bold text-blue-400 flex items-center gap-2"><Globe size={18}/> إعداد TMDB واللغة</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <input className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm pr-12" placeholder="TMDB API Key" onChange={e => setTmdbKey(e.target.value)} />
                    <button onClick={() => verifyAPI('tmdb', tmdbKey)} className="absolute left-2 top-2 bg-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1">تحقق <StatusIcon status={verifyStatus.tmdb}/></button>
                  </div>
                  <select className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm" value={tmdbLang} onChange={e => setTmdbLang(e.target.value)}>
                    {languages.map(l => <option key={l.value} value={l.value}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Debrid Section */}
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <label className="text-sm font-bold text-blue-400 flex items-center gap-2"><Database size={18}/> إعداد Debrid</label>
                <div className="flex gap-2">
                  <select className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm" value={debrid.type} onChange={e => setDebrid({...debrid, type: e.target.value})}>
                    <option value="realdebrid">Real-Debrid</option>
                    <option value="torbox">TorBox</option>
                    <option value="alldebrid">All-Debrid</option>
                    <option value="premiumize">Premiumize</option>
                    <option value="debridlink">Debrid-Link</option>
                  </select>
                  <div className="flex-1 relative">
                    <input className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-sm pr-12" placeholder="Debrid API Key" onChange={e => setDebrid({...debrid, apiKey: e.target.value})} />
                    <button onClick={() => verifyAPI('debrid', debrid.apiKey)} className="absolute left-2 top-2 bg-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1 font-bold">تحقق <StatusIcon status={verifyStatus.debrid}/></button>
                  </div>
                </div>
              </div>

              {/* RPDB & Subtitles */}
              <div className="flex flex-col md:flex-row gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                 <div className="flex-1 relative">
                    <label className="text-[10px] text-slate-500 mb-1 block">SubDL Key (Optional)</label>
                    <input className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-xs" onChange={e => setSubKeys({...subKeys, subdl: e.target.value})} />
                 </div>
                 <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/30">
                    <Star size={16} className="text-yellow-500 animate-pulse"/>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">RPDB Free Active</span>
                 </div>
              </div>

              <button onClick={generateAddons} className="w-full bg-green-600 p-4 rounded-xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-700 transition">توليد الإضافات وترتيبها ←</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                <h2 className="font-bold text-sm">القائمة النهائية ({addons.length})</h2>
                <button onClick={syncToStremio} className="bg-blue-600 px-6 py-1 rounded-full font-bold text-xs animate-pulse">مزامنة الآن</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {addons.map((addon, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 group transition hover:border-blue-500/50">
                    <span className="text-[10px] text-blue-300 truncate max-w-[200px] font-mono">{addon.transportUrl}</span>
                    <button onClick={() => setAddons(addons.filter((_, idx) => idx !== i))}><Trash2 size={14} className="text-red-500 opacity-0 group-hover:opacity-100 transition"/></button>
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
