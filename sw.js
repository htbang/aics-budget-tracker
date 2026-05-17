const PROXY = 'https://mcp.aka.page';
let checkTimer = null;
let settings = {};
let codeCache = null; // Map<storeCd, kakaoId> — cleared on each START_MONITORING

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('message', e => {
  const { type, data } = e.data || {};
  if (type === 'START_MONITORING') {
    settings = data;
    codeCache = null; // reset cache whenever stores/products change
    startMonitoring();
    broadcast({ type: 'STATUS', status: 'active' });
  }
  if (type === 'STOP_MONITORING') stopMonitoring();
  if (type === 'CHECK_NOW') checkStock(true);
});

function startMonitoring() {
  stopMonitoring();
  checkStock(false);
  checkTimer = setInterval(() => checkStock(false), settings.intervalMs || 5 * 60 * 1000);
}

function stopMonitoring() {
  if (checkTimer) { clearInterval(checkTimer); checkTimer = null; }
}

// Resolve kakao store names → 7-Eleven store codes (cached)
async function getCodeMap() {
  if (codeCache) return codeCache;
  const kakaoStores = settings.kakaoStores || [];
  const map = new Map(); // storeCd -> kakaoId
  for (const ks of kakaoStores.slice(0, 50)) {
    const local = ks.name.replace(/^세븐일레븐\s*/, '').replace(/점$/, '');
    if (!local) continue;
    try {
      const r = await fetch(`${PROXY}/api/seveneleven/stores?keyword=${encodeURIComponent(local)}&limit=3`);
      if (!r.ok) continue;
      const j = await r.json();
      const list = j?.data?.list || [];
      if (list[0]?.storeCd) map.set(list[0].storeCd, ks.kakaoId);
    } catch (_) {}
    await sleep(120);
  }
  codeCache = map;
  return map;
}

async function checkStock(isManual) {
  const products = settings.products || [];
  const kakaoStores = settings.kakaoStores || [];
  if (!products.length || !kakaoStores.length) return;

  try {
    broadcast({ type: 'STATUS', status: 'checking' });

    const codeMap = await getCodeMap();
    const targetCds = [...codeMap.keys()];

    const allStocked = [];

    for (const prod of products) {
      const itemCd = prod.itemCd;
      if (!itemCd) continue;

      if (targetCds.length) {
        const CHUNK = 50;
        for (let i = 0; i < targetCds.length; i += CHUNK) {
          const chunk = targetCds.slice(i, i + CHUNK);
          try {
            const r = await fetch(`${PROXY}/api/seveneleven/inventory`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemCd, storeCdList: chunk })
            });
            if (!r.ok) continue;
            const j = await r.json();
            (j?.data?.storeList || j?.storeList || []).forEach(s => {
              if (parseInt(s.stock ?? s.realStock ?? 0) > 0) {
                allStocked.push({ ...s, productName: prod.name, kakaoId: codeMap.get(s.storeCd) });
              }
            });
          } catch (_) {}
          if (i + CHUNK < targetCds.length) await sleep(300);
        }
      }
    }

    broadcast({ type: 'STATUS', status: 'done', stocked: allStocked, isManual, time: new Date().toISOString() });

    if (allStocked.length > 0) {
      showNotification(allStocked[0].productName || '포켓몬카드', allStocked);
    } else if (isManual) {
      self.registration.showNotification('재고 없음', {
        body: '선택한 매장에 현재 재고가 없습니다.',
        icon: './icon-192.png',
        tag: 'no-stock'
      });
    }
  } catch (err) {
    broadcast({ type: 'STATUS', status: 'error', message: err.message });
  }
}

function showNotification(keyword, stores) {
  const top = stores.slice(0, 3);
  const body = top.map(s => {
    const nm  = s.storeName || s.storeNm || '매장';
    const qty = s.stock ?? s.realStock ?? '?';
    return `📍 ${nm} (${qty}개)`;
  }).join('\n') + (stores.length > 3 ? `\n외 ${stores.length - 3}개 매장` : '');

  self.registration.showNotification(`🎴 ${keyword} 재고 발견! (${stores.length}곳)`, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'stock-found',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { stores }
  });
}

async function broadcast(msg) {
  const all = await clients.matchAll({ type: 'window' });
  all.forEach(c => c.postMessage(msg));
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
