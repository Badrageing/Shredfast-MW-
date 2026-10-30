// ShredFast: private cloud sync, durable offline queue, and portable backups.
const CLOUD_URL = 'https://srgxrkjkexzfjztspibf.supabase.co';
const CLOUD_KEY = 'sb_publishable_CQBqODnDyv7dWEkwqsxBUA_bzf5LqWF';
const cloud = window.supabase?.createClient(CLOUD_URL, CLOUD_KEY, {
    auth: { storageKey: 'sf_cloud_auth_v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
let account = null, pending = [], savedLogs = [], syncRunning = false, accountEpoch = 0;
let syncMessage = 'Nur auf diesem Gerät gespeichert', storageFault = false;
const cacheKey = () => account ? 'sf_cloud_v1_' + account.id + (appBlock === 'block2' ? '' : '_' + appBlock) : localLogsKey();
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function normalizeLogs(value) {
    if (!Array.isArray(value) || value.length > getPlan().length) throw new Error('Backup enthält zu viele Sessions für diesen Block.');
    const seen = new Set();
    return value.map(row => {
        const plan = getPlan().find(p => row && row.key === `W${p.week}-${p.day}`);
        if (!plan || seen.has(row.key) || (appBlock === 'block2' && row.workoutId !== plan.workoutId)) throw new Error('Ungültige oder doppelte Session.');
        seen.add(row.key);
        if (appBlock === 'hybrid1') return normalizeHybridEntry(row, plan);
        const clean = {key: row.key, week: plan.week, day: plan.day, workoutId: plan.workoutId};
        for (const key of ['date','weight','mins','secs','rounds','note']) {
            if (row[key] != null && !['string','number'].includes(typeof row[key])) throw new Error('Ungültiges Datenfeld.');
            clean[key] = String(row[key] ?? '');
            if (clean[key].length > (key === 'note' ? 2000 : 100)) throw new Error('Datenfeld zu lang.');
        }
        for (const key of ['weight','mins','secs','rounds']) {
            if (clean[key] !== '' && (!Number.isFinite(Number(clean[key])) || Number(clean[key]) < 0)) throw new Error('Ungültiger Zahlenwert.');
        }
        if (Number(clean.secs) > 59) throw new Error('Sekunden müssen zwischen 0 und 59 liegen.');
        return clean;
    });
}

function persistCloudState(nextLogs = logs, nextPending = pending) {
    try {
        localStorage.setItem(cacheKey(), JSON.stringify(account ? {logs: nextLogs, pending: nextPending} : nextLogs));
        storageFault = false;
        return true;
    } catch (error) {
        storageFault = true;
        syncMessage = 'Gerätespeicher nicht verfügbar – bitte sofort Backup exportieren.';
        updateCloudUI();
        return false;
    }
}

function loadDeviceState() {
    try {
        const raw = localStorage.getItem(cacheKey());
        const state = raw ? JSON.parse(raw) : (account ? {logs: [], pending: []} : []);
        logs = normalizeLogs(account ? state.logs : state);
        pending = account && Array.isArray(state.pending) ? state.pending : [];
        savedLogs = structuredClone(logs);
        storageFault = false;
    } catch (error) {
        logs = []; pending = []; savedLogs = [];
        storageFault = true;
        syncMessage = 'Lokale Daten konnten nicht gelesen werden. Original bleibt erhalten; bitte Backup sichern.';
    }
}

function storeTrainingChange() {
    if (storageFault) { alert('Speicherfehler: Bitte erst ein Backup exportieren und die App neu öffnen.'); return false; }
    let clean;
    try { clean = normalizeLogs(logs); } catch (error) { alert(error.message); return false; }
    const nextPending = [...pending];
    if (account) {
        for (const old of savedLogs) if (!clean.some(l => l.key === old.key)) {
            nextPending.push({id: crypto.randomUUID(), user_id: account.id, block_id: appBlock, session_key: old.key, entry: null, deleted: true});
        }
        for (const row of clean) if (JSON.stringify(row) !== JSON.stringify(savedLogs.find(l => l.key === row.key))) {
            nextPending.push({id: crypto.randomUUID(), user_id: account.id, block_id: appBlock, session_key: row.key, entry: row, deleted: false});
        }
    }
    if (!persistCloudState(clean, nextPending)) return false;
    logs = clean; pending = nextPending; savedLogs = structuredClone(logs);
    syncMessage = account ? 'Auf Gerät gesichert · Cloud-Abgleich ausstehend' : 'Nur auf diesem Gerät gespeichert';
    updateCloudUI();
    void syncCloud();
    return true;
}

async function syncCloud() {
    if (!account || !cloud || syncRunning || storageFault) return;
    if (!navigator.onLine) { syncMessage = 'Offline · Änderungen auf Gerät gesichert'; updateCloudUI(); return; }
    const epoch = accountEpoch, user = account.id, syncingBlock = appBlock;
    const batch = structuredClone(pending);
    syncRunning = true;
    syncMessage = 'Cloud wird abgeglichen …'; updateCloudUI();
    try {
        // Stable UUIDs make retries safe after interrupted requests. No UPDATE permission needed.
        if (batch.length) {
            const {error} = await cloud.from('shredfast_events').upsert(batch, {onConflict: 'id', ignoreDuplicates: true});
            if (error) throw error;
        }
        const events = [];
        for (let offset = 0; ; offset += 500) {
            const {data, error} = await cloud.from('shredfast_events').select('id,session_key,entry,deleted,created_at')
                .eq('user_id', user).eq('block_id', syncingBlock).order('created_at').order('id').range(offset, offset + 499);
            if (error) throw error;
            events.push(...data);
            if (data.length < 500) break;
        }
        if (epoch !== accountEpoch) return;
        const uploaded = new Set(batch.map(e => e.id));
        const remaining = pending.filter(e => !uploaded.has(e.id));
        const map = new Map();
        for (const event of [...events, ...remaining]) {
            if (event.deleted) map.delete(event.session_key);
            else { const [entry] = normalizeLogs([event.entry]); map.set(event.session_key, entry); }
        }
        const merged = [...map.values()];
        if (!persistCloudState(merged, remaining)) return;
        logs = merged; pending = remaining; savedLogs = structuredClone(logs);
        syncMessage = pending.length ? 'Weitere Änderungen werden übertragen …' : `Cloud gesichert · ${logs.length} Sessions · ${new Date().toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}`;
        render();
    } catch (error) {
        if (epoch === accountEpoch) syncMessage = 'Cloud nicht erreichbar / Anmeldung prüfen · lokale Daten bleiben erhalten';
    } finally {
        syncRunning = false; updateCloudUI();
        if (epoch !== accountEpoch || (pending.length && !syncMessage.startsWith('Cloud nicht'))) {
            if (!storageFault) setTimeout(() => void syncCloud(), 500);
        }
    }
}

function updateCloudUI() {
    const status = document.getElementById('savingStatus');
    status.textContent = syncMessage;
    status.style.color = storageFault ? '#fca5a5' : '#d1d5db';
    document.getElementById('cloudAccount').textContent = account ? 'Cloud-Konto: ' + account.email : 'Cloud-Backup aktivieren';
    document.getElementById('loginForm').hidden = !!account;
    document.getElementById('signedInTools').hidden = !account;
    document.getElementById('cloudUnavailable').hidden = !!cloud;
    document.getElementById('legacyImport').hidden = !account;
    document.getElementById('legacyImport').textContent = appBlock === 'block2' ? 'Bisherige iPhone-Daten übernehmen' : 'Lokale Trainings in dieses Konto übernehmen';
}

async function switchAccount(user) {
    if ((user?.id || null) === (account?.id || null)) return;
    closeHybrid(); closeModal(); accountEpoch++; account = user;
    loadDeviceState();
    syncMessage = storageFault ? syncMessage : (account ? 'Cloud wird geladen …' : 'Nur auf diesem Gerät gespeichert');
    render(); updateCloudUI();
    await syncCloud();
}

async function initCloud() {
    loadDeviceState(); render(); updateCloudUI();
    if (!cloud) return;
    cloud.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => void switchAccount(session?.user || null), 0);
    });
    try {
        const {data, error} = await cloud.auth.getSession();
        if (error) throw error;
        await switchAccount(data.session?.user || null);
    } catch (error) { syncMessage = 'Anmeldung nicht verfügbar · lokal weiter nutzbar'; updateCloudUI(); }
    window.addEventListener('online', () => void syncCloud());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void syncCloud(); });
    setInterval(() => void syncCloud(), 60000);
}

document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!cloud) return alert('Cloud-Modul konnte nicht geladen werden. Bitte App neu laden.');
    const button = document.getElementById('loginButton');
    button.disabled = true;
    const result = document.getElementById('loginResult');
    result.textContent = 'Anmeldung läuft …';
    try {
        const {data, error} = await cloud.auth.signInWithPassword({email: document.getElementById('cloudEmail').value.trim(), password: document.getElementById('cloudPassword').value});
        document.getElementById('cloudPassword').value = '';
        if (error) throw error;
        result.textContent = ''; await switchAccount(data.user);
    } catch (error) { result.textContent = 'Anmeldung fehlgeschlagen. Bitte bestehende LifeOS-App-Zugangsdaten prüfen.'; }
    finally { button.disabled = false; }
});

document.getElementById('signOut').addEventListener('click', async () => {
    if (pending.length && !confirm('Es gibt noch nicht übertragene Änderungen. Sie bleiben auf diesem Gerät für dieses Konto erhalten. Trotzdem abmelden?')) return;
    const {error} = await cloud.auth.signOut({scope:'local'});
    if (error) return alert('Abmeldung fehlgeschlagen. Bitte erneut versuchen.');
    await switchAccount(null);
});
document.getElementById('syncNow').addEventListener('click', () => void syncCloud());
document.getElementById('legacyImport').addEventListener('click', async () => {
    try {
        if (!account) return;
        const original = normalizeLogs(JSON.parse(localStorage.getItem(localLogsKey()) || '[]'));
        const missing = original.filter(row => !logs.some(l => l.key === row.key));
        if (!missing.length) return alert('Keine zusätzlichen lokalen Sessions gefunden. Bestehende Cloud-Einträge bleiben erhalten.');
        if (!confirm(`${missing.length} lokale Sessions dieses Blocks in das angezeigte Cloud-Konto übernehmen? Bestehende Cloud-Sessions werden nicht überschrieben.`)) return;
        logs = [...logs, ...missing]; if (!storeTrainingChange()) logs = structuredClone(savedLogs);
        render();
    } catch (error) { alert('Übernahme fehlgeschlagen: ' + error.message); }
});

document.getElementById('exportBackup').addEventListener('click', async () => {
    let legacyRaw;
    try { legacyRaw = localStorage.getItem(STORAGE_KEY); } catch (_) { legacyRaw = null; }
    const backup = {format:'shredfast-backup', version:2, block:appBlock, exportedAt:new Date().toISOString(), logs, pending, legacyRaw};
    const file = new File([JSON.stringify(backup, null, 2)], 'ShredFast-' + appBlock + '-Backup-' + new Date().toISOString().slice(0,10) + '.json', {type:'application/json'});
    try {
        if (navigator.canShare?.({files:[file]})) { await navigator.share({files:[file], title:'ShredFast Backup'}); return; }
    } catch (error) { if (error.name === 'AbortError') return; }
    const url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
});
document.getElementById('importBackup').addEventListener('change', async event => {
    try {
        const file = event.target.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) throw new Error('Datei ist zu groß.');
        const value = JSON.parse(await file.text());
        if (!Array.isArray(value) && (value.format !== 'shredfast-backup' || ![1,2].includes(value.version) || value.block !== appBlock)) throw new Error('Backupformat oder Trainingsblock passt nicht. Für alte Backups oben den bisherigen Block auswählen.');
        const imported = normalizeLogs(Array.isArray(value) ? value : value.logs);
        const missing = imported.filter(row => !logs.some(l => l.key === row.key));
        if (!missing.length) return alert('Keine zusätzlichen Sessions. Bestehende Einträge bleiben erhalten.');
        if (!confirm(`${missing.length} Sessions ergänzen? Bestehende Einträge werden nicht überschrieben.`)) return;
        logs = [...logs, ...missing]; if (!storeTrainingChange()) logs = structuredClone(savedLogs);
        render();
    } catch (error) { alert('Import fehlgeschlagen: ' + error.message); }
    finally { event.target.value = ''; }
});
