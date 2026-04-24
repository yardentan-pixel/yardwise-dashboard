import { useState, useEffect, useCallback } from "react";

const CATEGORIES = ['ערבות בוכיות', 'כתיבה', 'עסק', 'אישי', 'ננטש באמצע'];
const STATUS_CYCLE = ['פתוח', 'בטיפול', 'הושלם'];

const STATUS_STYLE = {
  'פתוח':   { dot: '#ef4444', label: 'פתוח' },
  'בטיפול': { dot: '#f59e0b', label: 'בטיפול' },
  'הושלם':  { dot: '#22c55e', label: 'הושלם' },
};

const CAT_COLOR = {
  'ערבות בוכיות': '#a78bfa',
  'כתיבה':        '#60a5fa',
  'עסק':          '#fbbf24',
  'אישי':         '#f472b6',
  'ננטש באמצע':   '#94a3b8',
};

async function sb(url, key, method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0d0b; }
  :root { --bg: #0f0d0b; --surface: #1c1814; --border: #2d2620; --text: #f0ead8; --muted: #7a6e60; }
  .app { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Heebo', sans-serif; direction: rtl; }
  .header { padding: 28px 32px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #f0ead8; }
  .logo span { color: #d4a853; }
  .main { padding: 24px 32px; }
  .filters { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
  .filter-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; font-family: 'Heebo', sans-serif; font-size: 14px; transition: all 0.15s; }
  .filter-btn:hover { border-color: #d4a853; color: var(--text); }
  .filter-btn.active { background: #d4a853; border-color: #d4a853; color: #0f0d0b; font-weight: 600; }
  .stats { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 18px; font-size: 13px; color: var(--muted); }
  .stat strong { color: var(--text); font-size: 18px; display: block; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  .cat-section { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .cat-header { padding: 14px 18px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); }
  .cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .cat-title { font-weight: 600; font-size: 15px; flex: 1; }
  .cat-count { font-size: 12px; color: var(--muted); background: var(--bg); padding: 2px 8px; border-radius: 10px; }
  .tasks { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
  .task { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
  .task-top { display: flex; align-items: flex-start; gap: 10px; }
  .status-btn { width: 14px; height: 14px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0; margin-top: 3px; transition: transform 0.15s; }
  .status-btn:hover { transform: scale(1.3); }
  .task-title { font-size: 14px; font-weight: 500; flex: 1; line-height: 1.4; }
  .task-title.done { text-decoration: line-through; color: var(--muted); }
  .del-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 0 2px; opacity: 0; transition: opacity 0.15s; }
  .task:hover .del-btn { opacity: 1; }
  .task-desc { font-size: 12px; color: var(--muted); margin-top: 6px; margin-right: 24px; line-height: 1.5; }
  .task-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; margin-right: 24px; }
  .status-badge { font-size: 11px; padding: 2px 8px; border-radius: 8px; font-weight: 500; }
  .empty { padding: 20px; text-align: center; color: var(--muted); font-size: 13px; }
  .add-btn { background: #d4a853; color: #0f0d0b; border: none; border-radius: 8px; padding: 8px 20px; font-family: 'Heebo', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .add-btn:hover { opacity: 0.85; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 440px; direction: rtl; }
  .modal h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
  .field input, .field textarea, .field select { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text); font-family: 'Heebo', sans-serif; font-size: 14px; direction: rtl; outline: none; transition: border-color 0.15s; resize: none; }
  .field input:focus, .field textarea:focus, .field select:focus { border-color: #d4a853; }
  .field select option { background: #1c1814; }
  .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
  .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 8px 18px; font-family: 'Heebo', sans-serif; cursor: pointer; }
  .setup { max-width: 440px; margin: 60px auto; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; direction: rtl; }
  .setup h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
  .setup p { color: var(--muted); font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
  .error { color: #ef4444; font-size: 13px; margin-top: 12px; }
  .loading { text-align: center; padding: 60px; color: var(--muted); }
`;

export default function App() {
  const [config, setConfig] = useState({ url: '', key: '' });
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('פעיל');
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: CATEGORIES[0], status: 'פתוח' });

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage.get('yw-cfg');
        if (r?.value) {
          const c = JSON.parse(r.value);
          if (c.url && c.key) { setConfig(c); setReady(true); }
        }
      } catch {}
    }
    load();
  }, []);

  const fetch = useCallback(async (cfg = config) => {
    if (!cfg.url || !cfg.key) return;
    setLoading(true); setError('');
    try {
      const d = await sb(cfg.url, cfg.key, 'GET', 'tasks?select=*&order=created_at.desc');
      setTasks(d || []);
    } catch { setError('שגיאה בטעינה'); }
    setLoading(false);
  }, [config]);

  useEffect(() => { if (ready) fetch(); }, [ready]);

  async function saveConfig() {
    if (!config.url || !config.key) return;
    try {
      await window.storage.set('yw-cfg', JSON.stringify(config));
      setReady(true);
      setShowSettings(false);
      fetch(config);
    } catch { setError('שגיאה בשמירה'); }
  }

  async function addTask() {
    if (!newTask.title.trim()) return;
    try {
      await sb(config.url, config.key, 'POST', 'tasks', newTask);
      setNewTask({ title: '', description: '', category: CATEGORIES[0], status: 'פתוח' });
      setShowAdd(false);
      fetch();
    } catch { setError('שגיאה בהוספה'); }
  }

  async function cycleStatus(id, current) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    try {
      await sb(config.url, config.key, 'PATCH', `tasks?id=eq.${id}`, { status: next, updated_at: new Date().toISOString() });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    } catch {}
  }

  async function del(id) {
    try {
      await sb(config.url, config.key, 'DELETE', `tasks?id=eq.${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {}
  }

  const filtered = tasks.filter(t =>
    filter === 'הכל' ? true :
    filter === 'פעיל' ? t.status !== 'הושלם' :
    t.status === filter
  );

  const openCount = tasks.filter(t => t.status === 'פתוח').length;
  const inProgCount = tasks.filter(t => t.status === 'בטיפול').length;
  const doneCount = tasks.filter(t => t.status === 'הושלם').length;

  if (!ready || showSettings) {
    return (
      <div className="app">
        <style>{styles}</style>
        <div className="setup">
          <h2>⚙️ הגדרות YardWise</h2>
          <p>הכניסי את פרטי ה-Supabase שלך כדי לחבר את הדשבורד</p>
          <div className="field">
            <label>Project URL</label>
            <input placeholder="https://xxx.supabase.co" value={config.url} onChange={e => setConfig(p => ({ ...p, url: e.target.value }))} />
          </div>
          <div className="field">
            <label>Anon Key</label>
            <input placeholder="eyJh..." value={config.key} onChange={e => setConfig(p => ({ ...p, key: e.target.value }))} />
          </div>
          <div className="modal-actions">
            {ready && <button className="btn-secondary" onClick={() => setShowSettings(false)}>ביטול</button>}
            <button className="add-btn" onClick={saveConfig}>התחברי ✓</button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{styles}</style>
      <div className="header">
        <div className="logo">Yard<span>Wise</span> — לוח בקרה</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => setShowSettings(true)}>⚙️</button>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => fetch()}>↻ רענן</button>
          <button className="add-btn" onClick={() => setShowAdd(true)}>+ משימה חדשה</button>
        </div>
      </div>

      <div className="main">
        <div className="stats">
          <div className="stat"><strong style={{ color: '#ef4444' }}>{openCount}</strong>פתוחות</div>
          <div className="stat"><strong style={{ color: '#f59e0b' }}>{inProgCount}</strong>בטיפול</div>
          <div className="stat"><strong style={{ color: '#22c55e' }}>{doneCount}</strong>הושלמו</div>
          <div className="stat"><strong>{tasks.length}</strong>סה"כ</div>
        </div>

        <div className="filters">
          {['הכל', 'פעיל', 'פתוח', 'בטיפול', 'הושלם'].map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading">טוענת...</div>
        ) : (
          <div className="grid">
            {CATEGORIES.map(cat => {
              const catTasks = filtered.filter(t => t.category === cat);
              return (
                <div key={cat} className="cat-section">
                  <div className="cat-header">
                    <div className="cat-dot" style={{ background: CAT_COLOR[cat] }} />
                    <div className="cat-title">{cat}</div>
                    <div className="cat-count">{catTasks.length}</div>
                  </div>
                  <div className="tasks">
                    {catTasks.length === 0 ? (
                      <div className="empty">אין משימות</div>
                    ) : catTasks.map(task => (
                      <div key={task.id} className="task">
                        <div className="task-top">
                          <button
                            className="status-btn"
                            style={{ background: STATUS_STYLE[task.status].dot }}
                            onClick={() => cycleStatus(task.id, task.status)}
                            title="לחצי לשינוי סטטוס"
                          />
                          <div className={`task-title${task.status === 'הושלם' ? ' done' : ''}`}>{task.title}</div>
                          <button className="del-btn" onClick={() => del(task.id)} title="מחקי">✕</button>
                        </div>
                        {task.description && <div className="task-desc">{task.description}</div>}
                        <div className="task-meta">
                          <span className="status-badge" style={{ background: STATUS_STYLE[task.status].dot + '22', color: STATUS_STYLE[task.status].dot }}>
                            {STATUS_STYLE[task.status].label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(task.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {error && <div className="error" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <h2>משימה חדשה</h2>
            <div className="field">
              <label>כותרת *</label>
              <input placeholder="מה צריך לעשות?" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="field">
              <label>פירוט (אופציונלי)</label>
              <textarea rows={3} placeholder="הסבר קצר..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="field">
              <label>קטגוריה</label>
              <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>סטטוס</label>
              <select value={newTask.status} onChange={e => setNewTask(p => ({ ...p, status: e.target.value }))}>
                {STATUS_CYCLE.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="add-btn" onClick={addTask}>הוסיפי ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
