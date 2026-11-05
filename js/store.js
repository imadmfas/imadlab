// تخزين محلي آمن (قد يكون التخزين معطّلًا في بعض المتصفحات)
export const store = {
  get(k) { try { const v = localStorage.getItem('imadlab:' + k); return v == null ? null : JSON.parse(v); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('imadlab:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
