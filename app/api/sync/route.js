// app/api/sync/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // محاكاة طلب الـ API الدقيق من مشروع Bootstrapper
    const response = await fetch('https://api.strem.io/api/addonCollectionSet', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Stremio/1.6.0' 
      },
      body: JSON.stringify({
        type: "AddonCollectionSet", // الحقل السري لضمان قبول الطلب
        authKey: body.authKey,
        addons: body.addons
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect to Stremio" }, { status: 500 });
  }
}
