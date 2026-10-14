// js/dashboard_v2.js
// Clean, fixed dashboard logic for FoodWizz
// - KPIs with period filter: Sales (USD), Tickets, Inventory Value (USD), Low Stock count
// - Tables: Inventory (Name, Qty, Cost, Min, Expiration) and Low Stock

import { auth, db } from "./Authentication/conection.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ===== Helpers =====
const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const TZ = 'America/Panama';
let sales4wChart = null;
let tickets7dChart = null;
const ZIP_PATH = '../assets/FoodWizz-Portable-Universal.zip';

function setAvatarSrc(imgEl, url) {
  if (!imgEl || !url) return;
  const sep = url.includes('?') ? '&' : '?';
  imgEl.src = `${url}${sep}cb=${Date.now()}`;
}

function getPanamaDayBounds() {
  const now = new Date();
  const y = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(now);
  const m = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: '2-digit' }).format(now);
  const d = new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: '2-digit' }).format(now);
  const start = new Date(`${y}-${m}-${d}T00:00:00.000-05:00`);
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-05:00`);
  return { start, end };
}

async function loadTopDishes(period = 'today') {
  const bodyId = 'topDishesBody';
  if (!document.getElementById(bodyId)) return;
  setHTML(bodyId, '<tr><td colspan="3" class="empty-state">Loading top dishes...</td></tr>');

  try {
    const { start, end } = getPeriodBounds(period);
    const salesQ = query(
      collection(db, 'sales'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      where('status', '==', 'completed')
    );
    const snaps = await getDocs(salesQ);

    // Aggregate by dishId or name if provided
    const agg = new Map(); // key -> { name?, dishId?, units, sales }
    snaps.forEach(snap => {
      const s = snap.data();
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(it => {
        const dishId = it.dishId || it.dishID || null;
        const name = it.name || null;
        const qty = Number(it.qty ?? it.quantity ?? 0) || 0;
        const price = Number(it.price ?? it.unitPrice ?? 0) || 0;
        const amount = qty * price;
        const key = dishId || name || `unknown-${Math.random().toString(36).slice(2)}`;
        if (!agg.has(key)) agg.set(key, { name, dishId, units: 0, sales: 0 });
        const rec = agg.get(key);
        rec.units += qty;
        rec.sales += amount;
        if (!rec.name && name) rec.name = name;
        if (!rec.dishId && dishId) rec.dishId = dishId;
      });
    });

    // Resolve missing names for keys that have dishId but no name
    const needNames = Array.from(agg.values()).filter(r => r.dishId && !r.name);
    await Promise.all(needNames.map(async r => {
      try {
        const dref = doc(db, 'dishes', r.dishId);
        const ddoc = await getDoc(dref);
        if (ddoc.exists()) {
          const d = ddoc.data();
          r.name = d.name || r.name || r.dishId;
        }
      } catch {}
    }));

    const list = Array.from(agg.values())
      .filter(r => r.units > 0)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    if (list.length === 0) {
      setHTML(bodyId, '<tr><td colspan="3" class="empty-state">No sales in selected period.</td></tr>');
      return;
    }

    const rows = list.map(r => `
      <tr>
        <td>${(r.name || r.dishId || 'Unknown')}</td>
        <td>${r.units}</td>
        <td>${fmtUSD.format(r.sales)}</td>
      </tr>
    `);
    setHTML(bodyId, rows.join(''));
  } catch (e) {
    console.error('Error loading top dishes:', e);
    setHTML(bodyId, '<tr><td colspan="3" class="empty-state">Error loading top dishes.</td></tr>');
  }
}

function getPanamaLast7Bounds() {
  const now = new Date();
  const y = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(now);
  const m = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: '2-digit' }).format(now);
  const d = new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: '2-digit' }).format(now);
  const end = new Date(`${y}-${m}-${d}T23:59:59.999-05:00`);
  const startToday = new Date(`${y}-${m}-${d}T00:00:00.000-05:00`);
  const start = new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function getPanamaMonthBounds() {
  const now = new Date();
  const y = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(now);
  const m = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: '2-digit' }).format(now);
  const start = new Date(`${y}-${m}-01T00:00:00.000-05:00`);
  const nextMonth = (parseInt(m, 10) === 12) ? 1 : (parseInt(m, 10) + 1);
  const nextYear = (parseInt(m, 10) === 12) ? (parseInt(y, 10) + 1) : parseInt(y, 10);
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2,'0')}-01T00:00:00.000-05:00`);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}

function getPeriodBounds(period) {
  if (period === 'last7') return getPanamaLast7Bounds();
  if (period === 'month') return getPanamaMonthBounds();
  return getPanamaDayBounds();
}

function endOfTodayPanama() {
  const now = new Date();
  const y = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric' }).format(now);
  const m = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: '2-digit' }).format(now);
  const d = new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: '2-digit' }).format(now);
  return new Date(`${y}-${m}-${d}T23:59:59.999-05:00`);
}

function formatDatePanama(d) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: '2-digit', day: '2-digit' }).format(d);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  const hex = [];
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0');
    hex.push(h);
  }
  return hex.join('');
}

async function initZipMeta() {
  const metaEl = document.getElementById('zipMeta');
  const btn = document.getElementById('btnVerifyZip');
  const hashEl = document.getElementById('zipHash');
  const copyBtn = document.getElementById('btnCopyZipHash');
  if (!metaEl) return;

  // Try HEAD to get content-length
  try {
    let size;
    try {
      const headRes = await fetch(ZIP_PATH, { method: 'HEAD' });
      if (headRes && headRes.ok) {
        const len = headRes.headers.get('content-length');
        if (len) {
          const parsed = parseInt(len, 10);
          if (Number.isFinite(parsed) && parsed > 0) size = parsed;
        }
      }
    } catch {}

    if (size == null) {
      // Fallback: range request minimal to get headers
      try {
        const res = await fetch(ZIP_PATH, { headers: { 'Range': 'bytes=0-0' } });
        if (res && (res.status === 206 || res.ok)) {
          const len = res.headers.get('content-range') || res.headers.get('content-length');
          // content-range like: bytes 0-0/12345
          if (len && len.includes('/')) {
            const total = parseInt(len.split('/')[1], 10);
            if (Number.isFinite(total) && total > 0) size = total;
          } else if (len) {
            const parsed = parseInt(len, 10);
            if (Number.isFinite(parsed) && parsed > 0) size = parsed;
          }
        }
      } catch {}
    }

    // Final fallback: download blob to read size (works in file:// or servers without headers)
    if (size == null) {
      try {
        const getRes = await fetch(ZIP_PATH);
        if (getRes && getRes.ok) {
          const blob = await getRes.blob();
          if (blob && Number.isFinite(blob.size) && blob.size > 0) size = blob.size;
        }
      } catch {}
    }
    if (size != null && Number.isFinite(size) && size > 0) {
      metaEl.textContent = `File size: ${formatBytes(size)}`;
    } else {
      metaEl.textContent = 'File ready to download';
    }
  } catch (e) {
    metaEl.textContent = 'File ready to download';
  }

  if (btn && hashEl) btn.addEventListener('click', async () => {
    try {
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      hashEl.textContent = '';
      const res = await fetch(ZIP_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      const hex = bufferToHex(digest);
      hashEl.textContent = `SHA-256: ${hex}`;
    } catch (e) {
      console.warn('SHA-256 failed:', e);
      hashEl.textContent = 'SHA-256 unavailable (CORS or fetch blocked). Download file to verify locally.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify SHA-256';
    }
  });

  if (copyBtn && hashEl) {
    copyBtn.addEventListener('click', async () => {
      const text = (hashEl.textContent || '').replace(/^SHA-256:\s*/i, '').trim();
      if (!text) {
        copyBtn.textContent = 'Copy hash';
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = prev), 1500);
      } catch (e) {
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copy failed';
        setTimeout(() => (copyBtn.textContent = prev), 1500);
      }
    });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

async function loadKPIs(period = 'today') {
  try {
    // Sales (USD) and Tickets based on selected period
    const { start, end } = getPeriodBounds(period);
    const salesQ = query(
      collection(db, 'sales'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      where('status', '==', 'completed')
    );
    const salesSnaps = await getDocs(salesQ);
    const salesAmount = salesSnaps.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
    const tickets = salesSnaps.size;

    setText('kpiSalesToday', fmtUSD.format(salesAmount));
    setText('kpiTicketsToday', String(tickets));
  } catch (e) {
    console.error('Error loading Sales KPIs:', e);
    setText('kpiSalesToday', '—');
    setText('kpiTicketsToday', '—');
  }

  try {
    // Inventory/Ingredients KPIs
    // Try 'inventory' first, then fallback to 'ingredients'
    let invSnaps;
    try {
      invSnaps = await getDocs(collection(db, 'inventory'));
      // Some SDKs may not set .empty on undefined; ensure shape
    } catch { invSnaps = { empty: true, docs: [] }; }

    let usingIngredients = false;
    if (invSnaps.empty || !invSnaps.docs || invSnaps.docs.length === 0) {
      invSnaps = await getDocs(collection(db, 'ingredients'));
      usingIngredients = true;
    }
    let invValue = 0;
    let lowCount = 0;
    let ingredientsCount = 0;

    invSnaps.forEach(doc => {
      const data = doc.data();
      const qty = usingIngredients ? (data.stock ?? 0) : (data.qty_on_hand ?? 0);
      const cost = usingIngredients ? (data.cost ?? 0) : (data.cost_unit ?? 0);
      const minq = usingIngredients ? (data.min_stock ?? 0) : (data.min_qty ?? 0);
      invValue += (Number(qty) * Number(cost));
      if (Number(qty) <= Number(minq)) lowCount += 1;
      ingredientsCount += 1;
    });

    setText('kpiInventoryValue', fmtUSD.format(invValue));
    setText('kpiLowStock', String(lowCount));
    setText('kpiIngredients', String(ingredientsCount));
  } catch (e) {
    console.error('Error loading Inventory KPIs:', e);
    setText('kpiInventoryValue', '—');
    setText('kpiLowStock', '—');
    setText('kpiIngredients', '—');
  }

  // Suppliers count
  try {
    const supSnaps = await getDocs(collection(db, 'distributors'));
    setText('kpiSuppliers', String(supSnaps.size ?? supSnaps.docs?.length ?? 0));
  } catch (e) {
    console.warn('Suppliers KPI not available:', e);
    setText('kpiSuppliers', '—');
  }
}

async function loadInventoryTable() {
  const bodyId = 'dataTable';
  if (!document.getElementById(bodyId)) return;
  setHTML(bodyId, '<tr><td colspan="5" class="empty-state">Loading inventory data...</td></tr>');

  try {
    let snaps;
    let usingIngredients = false;
    try {
      snaps = await getDocs(collection(db, 'inventory'));
    } catch { snaps = { empty: true, docs: [] }; }
    if (snaps.empty || !snaps.docs || snaps.docs.length === 0) {
      snaps = await getDocs(collection(db, 'ingredients'));
      usingIngredients = true;
    }
    if (!snaps || snaps.empty || !snaps.docs || snaps.docs.length === 0) {
      setHTML(bodyId, '<tr><td colspan="5" class="empty-state">No inventory/ingredients found. Add items to get started!</td></tr>');
      return;
    }

    const rows = [];
    snaps.forEach(doc => {
      const data = doc.data();
      const name = data.name || 'N/A';
      const qty = usingIngredients ? (data.stock ?? 'N/A') : (data.qty_on_hand ?? 'N/A');
      const cost = (usingIngredients ? data.cost : data.cost_unit);
      const costFmt = cost != null ? fmtUSD.format(cost) : 'N/A';
      const min = usingIngredients ? (data.min_stock ?? 'N/A') : (data.min_qty ?? 'N/A');
      let exp = '—';
      if (!usingIngredients && data.expire_at && typeof data.expire_at.toDate === 'function') {
        const dt = data.expire_at.toDate();
        exp = new Intl.DateTimeFormat('en-US', { timeZone: TZ }).format(dt);
      }

      rows.push(`
        <tr>
          <td>${name}</td>
          <td>${qty}</td>
          <td>${costFmt}</td>
          <td>${min}</td>
          <td>${exp}</td>
        </tr>
      `);
    });

    setHTML(bodyId, rows.join(''));
  } catch (e) {
    console.error('Error loading inventory table:', e);
    setHTML(bodyId, '<tr><td colspan="5" class="empty-state">Error loading inventory.</td></tr>');
  }
}

async function loadLowStockTable() {
  const bodyId = 'lowStockTableBody';
  if (!document.getElementById(bodyId)) return;
  setHTML(bodyId, '<tr><td colspan="5" class="empty-state">Loading low stock...</td></tr>');

  try {
    let snaps;
    let usingIngredients = false;
    try {
      snaps = await getDocs(collection(db, 'inventory'));
    } catch { snaps = { empty: true, docs: [] }; }
    if (snaps.empty || !snaps.docs || snaps.docs.length === 0) {
      snaps = await getDocs(collection(db, 'ingredients'));
      usingIngredients = true;
    }
    const items = [];
    snaps.forEach(doc => {
      const data = doc.data();
      const qty = usingIngredients ? (data.stock ?? 0) : (data.qty_on_hand ?? 0);
      const min = usingIngredients ? (data.min_stock ?? 0) : (data.min_qty ?? 0);
      if (qty <= min) items.push({ id: doc.id, ...data });
    });

    if (items.length === 0) {
      setHTML(bodyId, '<tr><td colspan="5" class="empty-state">No low stock items. Great job!</td></tr>');
      return;
    }

    // Sort by urgency
    items.sort((a, b) => {
      const deficitA = (a.qty_on_hand ?? 0) - (a.min_qty ?? 0);
      const deficitB = (b.qty_on_hand ?? 0) - (b.min_qty ?? 0);
      if (deficitA !== deficitB) return deficitA - deficitB;
      const aExp = a.expire_at && typeof a.expire_at.toDate === 'function' ? a.expire_at.toDate().getTime() : Infinity;
      const bExp = b.expire_at && typeof b.expire_at.toDate === 'function' ? b.expire_at.toDate().getTime() : Infinity;
      return aExp - bExp;
    });

    const rows = items.map(it => {
      const exp = (it.expire_at && typeof it.expire_at.toDate === 'function')
        ? new Intl.DateTimeFormat('en-US', { timeZone: TZ }).format(it.expire_at.toDate())
        : '—';
      return `
        <tr>
          <td>${it.name || 'N/A'}</td>
          <td>${it.qty_on_hand ?? 'N/A'}</td>
          <td>${it.min_qty ?? 'N/A'}</td>
          <td>${it.cost_unit != null ? fmtUSD.format(it.cost_unit) : 'N/A'}</td>
          <td>${exp}</td>
        </tr>
      `;
    });

    setHTML(bodyId, rows.join(''));
  } catch (e) {
    console.error('Error loading low stock table:', e);
    setHTML(bodyId, '<tr><td colspan="5" class="empty-state">Error loading low stock.</td></tr>');
  }
}

function wireLogout() {
  const btns = document.querySelectorAll('[data-action="logout"], button[onclick="logout()"]');
  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'loginRegister.html';
      } catch (e) {
        console.error('Error signing out:', e);
        alert('Error signing out. Please try again.');
      }
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'loginRegister.html';
    return;
  }

  try {
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = user.displayName || 'User';
    if (emailEl) emailEl.textContent = user.email || '';

    // Load avatar from Firestore users/{uid}.photo_url or fallback to Auth photoURL
    if (avatarEl) {
      try {
        const uref = doc(db, 'users', user.uid);
        const usnap = await getDoc(uref);
        const photoUrl = (usnap.exists() && usnap.data().photo_url) ? usnap.data().photo_url : (user.photoURL || '');
        if (photoUrl) setAvatarSrc(avatarEl, photoUrl);

        // Live updates: listen for changes to photo_url
        onSnapshot(uref, (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            if (d && d.photo_url) {
              setAvatarSrc(avatarEl, d.photo_url);
            }
          }
        });
      } catch {}
    }
  } catch {}

  wireLogout();

  let currentPeriod = 'today';
  const sel = document.getElementById('periodSelect');
  if (sel) {
    sel.addEventListener('change', async () => {
      currentPeriod = sel.value;
      await loadKPIs(currentPeriod);
      await loadTopDishes(currentPeriod);
    });
  }

  await loadKPIs(currentPeriod);
  await loadInventoryTable();
  await loadLowStockTable();

  // Charts
  await renderCharts();
  // Top dishes for default period
  await loadTopDishes(currentPeriod);
  // ZIP meta init
  await initZipMeta();
});

async function renderCharts() {
  try {
    await Promise.all([
      buildSales4WeeksChart(),
      buildTickets7DaysChart(),
    ]);
  } catch (e) {
    console.warn('Charts render warning:', e);
  }
}

async function buildSales4WeeksChart() {
  const canvas = document.getElementById('chartSales4w');
  if (!canvas) return;

  // Define 4 weekly buckets of 7 days each ending today
  const end = endOfTodayPanama();
  const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000); // 28-day window

  // Fetch sales once for the whole window
  const q = query(
    collection(db, 'sales'),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    where('status', '==', 'completed')
  );
  const snaps = await getDocs(q);

  // Buckets: [start..start+6], [..+13], [..+20], [..+27]
  const buckets = [0, 0, 0, 0];
  snaps.forEach(doc => {
    const data = doc.data();
    const dt = data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : null;
    if (!dt) return;
    const offsetDays = Math.floor((dt.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (offsetDays < 0 || offsetDays > 27) return;
    const bucketIndex = Math.floor(offsetDays / 7); // 0..3
    buckets[bucketIndex] += (data.amount || 0);
  });

  const labels = [];
  for (let i = 0; i < 4; i++) {
    const bStart = new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const bEnd = new Date(start.getTime() + ((i + 1) * 7 - 1) * 24 * 60 * 60 * 1000);
    labels.push(`${formatDatePanama(bStart)} - ${formatDatePanama(bEnd)}`);
  }

  const ctx = canvas.getContext('2d');
  if (sales4wChart) sales4wChart.destroy();
  sales4wChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sales (USD)',
        data: buckets,
        backgroundColor: '#ff7f00'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function buildTickets7DaysChart() {
  const canvas = document.getElementById('chartTickets7d');
  if (!canvas) return;

  const end = endOfTodayPanama();
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, 'sales'),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    where('status', '==', 'completed')
  );
  const snaps = await getDocs(q);

  // Map days to counts
  const labels = [];
  const counts = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push(formatDatePanama(d));
    counts.push(0);
  }

  snaps.forEach(doc => {
    const data = doc.data();
    const dt = data.date && typeof data.date.toDate === 'function' ? data.date.toDate() : null;
    if (!dt) return;
    const dayIndex = Math.floor((dt.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex > 6) return;
    counts[dayIndex] += 1;
  });

  const ctx = canvas.getContext('2d');
  if (tickets7dChart) tickets7dChart.destroy();
  tickets7dChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Tickets',
        data: counts,
        borderColor: '#1a1a1a',
        backgroundColor: 'rgba(26,26,26,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, precision: 0 } }
    }
  });
}
