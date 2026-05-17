const PROXY = 'https://mcp.aka.page';
let checkTimer = null;
let settings = {};
let codeCache = null; // Map<storeCd, kakaoId> — START_MONITORING 때 초기화

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('message', e => {
  const { type, data } = e.data || {};
  if (type === 'START_MONITORING') { settings = data; codeCache = null; startMonitoring(); broadcast({ type:'STATUS', status:'active' }); }
  if (type === 'STOP_MONITORING') stopMonitoring();
  if (type === 'CHECK_NOW') checkStock(true);
});

function startMonitoring() {
  stopMonitoring();
  checkStock(false);
  checkTimer = setInterval(() => checkStock(false), settings.intervalMs || 5 * 60 * 1000);
}
function stopMonitoring() { if (checkTimer) { clearInterval(checkTimer); checkTimer = null; } }

async function getCodeMap() {
  if (codeCache) return codeCache;
  const map = new Map();
  for (const ks of (settings.kakaoStores || []).slice(0, 50)) {
    const local = ks.name.replace(/^세븐일레븐\s*/, '').replace(/점$/, '');
    if (!local) continue;
    try {
      const r = await fetch(`${PROXY}/api/seveneleven/stores?keyword=${encodeURIComponent(local)}&limit=3`);
      if (r.ok) {
        const j = await r.json();
        const store = (j?.data?.list || [])[0];
        if (store?.storeCd) map.set(store.storeCd, ks.kakaoId);
      }
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
    broadcast({ type:'STATUS', status:'checking' });
    const codeMap = await getCodeMap();
    const targetCds = [...codeMap.keys()];

    const allChecked = []; // 모든 매장 결과 (0개 포함)
    const allStocked = []; // 재고 있는 매장만

    for (const prod of products) {
      const itemCd = prod.itemCd; if (!itemCd) continue;
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
            const qty = parseInt(s.stock ?? s.realStock ?? 0);
            const kakaoId = codeMap.get(s.storeCd);
            allChecked.push({ ...s, productName: prod.name, itemCd, kakaoId, stock: qty });
            if (qty > 0) allStocked.push({ ...s, productName: prod.name, itemCd, kakaoId, stock: qty });
          });
        } catch (_) {}
        if (i + CHUNK < targetCds.length) await sleep(300);
      }
    }

    broadcast({ type:'STATUS', status:'done', stocked: allStocked, allChecked, isManual, time: new Date().toISOString() });

    if (allStocked.length > 0) {
      showNotification(allStocked[0].productName || '포켓몬카드', allStocked);
    } else if (isManual) {
      self.registration.showNotification('재고 없음', {
        body: '선택한 매장에 현재 재고가 없습니다.', icon: './icon-192.png', tag: 'no-stock'
      });
    }
  } catch (err) {
    broadcast({ type:'STATUS', status:'error', message: err.message });
  }
}

function showNotification(keyword, stores) {
  const body = stores.slice(0, 3).map(s =>
    `📍 ${s.storeName||s.storeNm||'매장'} (${s.stock}개)`
  ).join('\n') + (stores.length > 3 ? `\n외 ${stores.length-3}개 매장` : '');
  self.registration.showNotification(`🎴 ${keyword} 재고 발견! (${stores.length}곳)`, {
    body, icon:'./icon-192.png', badge:'./icon-192.png',
    tag:'stock-found', renotify:true, vibrate:[200,100,200], data:{ stores }
  });
}

async function broadcast(msg) {
  const all = await clients.matchAll({ type:'window' });
  all.forEach(c => c.postMessage(msg));
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type:'window' }).then(list =>
    list.length ? list[0].focus() : clients.openWindow('./index.html')
  ));
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
