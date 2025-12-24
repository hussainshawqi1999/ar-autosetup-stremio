import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { authKey, addons: newAddonsOnly } = body;

    let currentAddons = [];
    try {
      const getRes = await fetch('https://api.strem.io/api/addonCollectionGet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey, type: "AddonCollectionGet" })
      });
      const getData = await getRes.json();
      if (getData.result?.addons) {
        currentAddons = getData.result.addons;
      }
    } catch (e) {
      console.log("Could not fetch existing addons, proceeding with new only.");
    }

    const enrichedNewAddons = await Promise.all(newAddonsOnly.map(async (addon) => {
      try {
        const manifestRes = await fetch(addon.transportUrl);
        const manifestJson = await manifestRes.json();
        return {
          transportUrl: addon.transportUrl,
          transportName: "http",
          manifest: manifestJson
        };
      } catch (e) {
        console.error(`Failed to fetch manifest for ${addon.transportUrl}`);
        return null;
      }
    }));

    const validNewAddons = enrichedNewAddons.filter(a => a !== null);

    const existingUrls = new Set(currentAddons.map(a => a.transportUrl));
    const uniqueNewAddons = validNewAddons.filter(a => !existingUrls.has(a.transportUrl));
    
    const finalAddonList = [...currentAddons, ...uniqueNewAddons];

    if (finalAddonList.length === 0) {
      return NextResponse.json({ error: "القائمة فارغة تماماً" }, { status: 400 });
    }

    const response = await fetch('https://api.strem.io/api/addonCollectionSet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "AddonCollectionSet",
        authKey: authKey,
        addons: finalAddonList
      })
    });

    const text = await response.text();
    if (!text || text.trim() === "") return NextResponse.json({ result: { success: true } });

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ result: { success: true } });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
