// app/api/sync/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // إرسال طلب المزامنة - لاحظ استخدام مهلة زمنية (timeout) لضمان عدم التعليق
    const response = await fetch('https://api.strem.io/api/addonCollectionSet', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Stremio/1.6.0' 
      },
      body: JSON.stringify({
        type: "AddonCollectionSet", // الحقل الذي تعلمناه من مشروع bootstrapper
        authKey: body.authKey,
        addons: body.addons
      }),
      signal: AbortSignal.timeout(15000) // مهلة 15 ثانية لمنع تعليق الطلب
    });

    const text = await response.text(); // قراءة الرد كنص أولاً لتجنب خطأ الـ JSON
    
    if (!text) {
      return NextResponse.json({ result: { success: true } }); // إذا كان الرد فارغاً، نعتبره نجاحاً (لأن بعض خوادم ستريميو لا ترسل محتوى عند النجاح)
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON from Stremio: " + text }, { status: 500 });
    }
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Connection Timeout" }, { status: 500 });
  }
}
