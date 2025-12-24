// app/api/sync/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // إرسال الطلب من السيرفر (Server-side) لضمان القبول وتجاوز الـ CORS
    const response = await fetch('https://api.strem.io/api/addonCollectionSet', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Stremio/1.6.0' // محاكاة تطبيق ستريميو
      },
      body: JSON.stringify({
        type: "AddonCollectionSet", // الحقل الضروري المكتشف في كود bootstrapper
        authKey: body.authKey,
        addons: body.addons
      })
    });

    const data = await response.json();
    
    // إرجاع النتيجة للواجهة الأمامية
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
