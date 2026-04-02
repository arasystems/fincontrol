import { useState, useEffect, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════
   FINCONTROL — App Web de Controle Financeiro
   ═══════════════════════════════════════════ */

// ── Dados de exemplo ──
const SAMPLE_TRANSACTIONS = [
  { id: "1", title: "Salário", amount: 8500, type: "income", category: "salary", date: "2026-04-01", note: "" },
  { id: "2", title: "Freelance", amount: 2000, type: "income", category: "freelance", date: "2026-03-18", note: "" },
  { id: "3", title: "Aluguel", amount: 1800, type: "expense", category: "housing", date: "2026-03-10", note: "" },
  { id: "4", title: "Conta de Luz", amount: 215, type: "expense", category: "housing", date: "2026-03-25", note: "" },
  { id: "5", title: "Supermercado", amount: 387.5, type: "expense", category: "food", date: "2026-04-01", note: "" },
  { id: "6", title: "Posto Shell", amount: 280, type: "expense", category: "transport", date: "2026-03-20", note: "" },
  { id: "7", title: "Netflix", amount: 55.9, type: "expense", category: "entertainment", date: "2026-03-22", note: "" },
  { id: "8", title: "Academia", amount: 119.9, type: "expense", category: "health", date: "2026-03-05", note: "" },
];

const SAMPLE_BUDGETS = [
  { id: "b1", category: "food", limit: 800 },
  { id: "b2", category: "housing", limit: 2200 },
  { id: "b3", category: "transport", limit: 500 },
  { id: "b4", category: "entertainment", limit: 400 },
  { id: "b5", category: "health", limit: 300 },
  { id: "b6", category: "education", limit: 200 },
];

const SAMPLE_GOALS = [
  { id: "g1", name: "Viagem Europa", emoji: "✈️", target: 15000, current: 8200, note: "Férias de julho — passagem + hospedagem" },
  { id: "g2", name: "Troca de Carro", emoji: "🚗", target: 30000, current: 5000, note: "Entrada para financiamento" },
  { id: "g3", name: "Reserva de Emergência", emoji: "🏡", target: 25000, current: 12400, note: "6 meses de despesas essenciais" },
];

const CATEGORIES = {
  food: { label: "Alimentação", emoji: "🛒", color: "#F0932B" },
  housing: { label: "Moradia", emoji: "🏠", color: "#6C5CE7" },
  transport: { label: "Transporte", emoji: "🚗", color: "#E74C6F" },
  entertainment: { label: "Lazer", emoji: "🎬", color: "#A29BFE" },
  health: { label: "Saúde", emoji: "🏋️", color: "#00B894" },
  education: { label: "Educação", emoji: "📚", color: "#0984E3" },
  salary: { label: "Salário", emoji: "💼", color: "#00B894" },
  freelance: { label: "Freelance", emoji: "💰", color: "#00CEC9" },
  other: { label: "Outros", emoji: "📦", color: "#636E72" },
};

const GOAL_EMOJIS = ["🎯", "✈️", "🚗", "🏡", "💻", "📚", "🎓", "💍", "🏖️", "🎸", "📱", "🏋️"];

// ── Utilitários ──
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (a, b) => (b > 0 ? Math.min(a / b, 1.5) : 0);
const relDate = (d) => {
  const t = new Date(), dt = new Date(d + "T12:00:00");
  const diff = Math.floor((t - dt) / 86400000);
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

// ── Storage hook com localStorage ──
function useStorage(key, fallback) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });

  const save = useCallback((val) => {
    setData(val);
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key]);

  return [data, save, true];
}

// ═══════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════
export default function FinControl() {
  const [tab, setTab] = useState("home");
  const [txs, setTxs, txLoaded] = useStorage("fc_txs", SAMPLE_TRANSACTIONS);
  const [budgets, setBudgets, bLoaded] = useStorage("fc_budgets", SAMPLE_BUDGETS);
  const [goals, setGoals, gLoaded] = useStorage("fc_goals", SAMPLE_GOALS);
  const [modal, setModal] = useState(null); // "tx" | "goal" | null

  const loaded = txLoaded && bLoaded && gLoaded;

  // ── Cálculos ──
  const sorted = useMemo(() => [...txs].sort((a, b) => b.date.localeCompare(a.date)), [txs]);
  const income = useMemo(() => txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [txs]);
  const expenses = useMemo(() => txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [txs]);
  const balance = income - expenses;

  const expByCat = useMemo(() => {
    const m = {};
    txs.filter(t => t.type === "expense").forEach(t => { m[t.category] = (m[t.category] || 0) + t.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [txs]);

  const spentIn = useCallback((cat) => txs.filter(t => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0), [txs]);

  // ── CRUD ──
  const addTx = (tx) => { setTxs([...txs, { ...tx, id: uid() }]); setModal(null); };
  const delTx = (id) => setTxs(txs.filter(t => t.id !== id));
  const addGoal = (g) => { setGoals([...goals, { ...g, id: uid() }]); setModal(null); };
  const delGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const updateGoalAmt = (id, amt) => setGoals(goals.map(g => g.id === id ? { ...g, current: amt } : g));

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "DM Sans, sans-serif", color: "#6B6D85" }}>Carregando...</div>;

  const tabs = [
    { id: "home", icon: "🏠", label: "Início" },
    { id: "transactions", icon: "📋", label: "Transações" },
    { id: "charts", icon: "📊", label: "Gráficos" },
    { id: "budget", icon: "💰", label: "Orçamento" },
    { id: "goals", icon: "🎯", label: "Metas" },
  ];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,700&display=swap" rel="stylesheet" />

      {/* ── Conteúdo da tela ── */}
      <div style={S.content}>
        {tab === "home" && <HomeScreen txs={sorted} balance={balance} income={income} expenses={expenses} onAdd={() => setModal("tx")} />}
        {tab === "transactions" && <TransactionsScreen txs={sorted} onAdd={() => setModal("tx")} onDelete={delTx} />}
        {tab === "charts" && <ChartsScreen income={income} expenses={expenses} balance={balance} expByCat={expByCat} totalExp={expenses} txCount={txs.length} />}
        {tab === "budget" && <BudgetScreen budgets={budgets} spentIn={spentIn} />}
        {tab === "goals" && <GoalsScreen goals={goals} onAdd={() => setModal("goal")} onDelete={delGoal} onUpdate={updateGoalAmt} />}
      </div>

      {/* ── Barra inferior ── */}
      <nav style={S.nav}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.navBtn, color: tab === t.id ? "#6C5CE7" : "#A0A3BD" }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Botão flutuante ── */}
      {(tab === "home" || tab === "transactions") && (
        <button onClick={() => setModal("tx")} style={S.fab}>+</button>
      )}

      {/* ── Modais ── */}
      {modal === "tx" && <AddTxModal onSave={addTx} onClose={() => setModal(null)} />}
      {modal === "goal" && <AddGoalModal onSave={addGoal} onClose={() => setModal(null)} />}
    </div>
  );
}

// ═══════════════════════════════
// TELA: INÍCIO
// ═══════════════════════════════
function HomeScreen({ txs, balance, income, expenses, onAdd }) {
  return (
    <div style={S.screen}>
      <p style={{ fontSize: 14, color: "#6B6D85", margin: 0 }}>Olá 👋</p>
      <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: "#1E1E2D" }}>Bem-vindo ao Momiquas Budget</h2>

      {/* Card saldo */}
      <div style={S.balanceCard}>
        <div style={S.balanceBubble1} />
        <div style={S.balanceBubble2} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", position: "relative" }}>Saldo Total</span>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 34, fontWeight: 700, color: "#fff", margin: "4px 0 14px", position: "relative" }}>{fmt(balance)}</div>
        <div style={{ display: "flex", gap: 24, position: "relative" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>↑ Receitas</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#A8FFE4", marginTop: 2 }}>{fmt(income)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>↓ Despesas</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#FFBDCA", marginTop: 2 }}>{fmt(expenses)}</div>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Receita", icon: "↑", bg: "rgba(0,184,148,.12)", clr: "#00B894" },
          { label: "Despesa", icon: "↓", bg: "rgba(231,76,111,.1)", clr: "#E74C6F" },
          { label: "Transf.", icon: "⇄", bg: "rgba(108,92,231,.1)", clr: "#6C5CE7" },
        ].map(a => (
          <button key={a.label} onClick={onAdd} style={S.quickBtn}>
            <span style={{ ...S.quickIcon, background: a.bg, color: a.clr }}>{a.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#1E1E2D" }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Últimas transações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Últimas Transações</h3>
        <span style={{ fontSize: 12, color: "#6C5CE7", fontWeight: 500, cursor: "pointer" }}>Ver tudo →</span>
      </div>
      {txs.slice(0, 5).map(tx => <TxRow key={tx.id} tx={tx} />)}
    </div>
  );
}

// ═══════════════════════════════
// TELA: TRANSAÇÕES
// ═══════════════════════════════
function TransactionsScreen({ txs, onAdd, onDelete }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? txs : txs.filter(t => t.type === filter);

  return (
    <div style={S.screen}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>Transações</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "Todas"], ["income", "Receitas"], ["expense", "Despesas"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ ...S.chip, ...(filter === v ? S.chipActive : {}) }}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#A0A3BD" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          Nenhuma transação encontrada
        </div>
      ) : (
        filtered.map(tx => (
          <div key={tx.id} style={{ position: "relative" }}>
            <TxRow tx={tx} />
            <button onClick={() => onDelete(tx.id)} style={S.deleteBtn} title="Excluir">✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════
// TELA: GRÁFICOS
// ═══════════════════════════════
function ChartsScreen({ income, expenses, balance, expByCat, totalExp, txCount }) {
  const maxBar = Math.max(income, expenses, balance, 1);
  return (
    <div style={S.screen}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Relatórios</h2>

      {/* Receita vs Despesa */}
      <Card title="Receita vs Despesa">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
          {[
            { label: "Receita", val: income, color: "#00B894" },
            { label: "Despesa", val: expenses, color: "#E74C6F" },
            { label: "Economia", val: Math.max(balance, 0), color: "#6C5CE7" },
          ].map(b => (
            <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: b.color }}>{fmt(b.val)}</span>
              <div style={{ width: "100%", height: `${(b.val / maxBar) * 100}%`, minHeight: 6, background: b.color, borderRadius: "6px 6px 2px 2px", transition: "height .6s ease" }} />
              <span style={{ fontSize: 11, color: "#A0A3BD" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Por Categoria */}
      <Card title="Gastos por Categoria">
        {expByCat.length === 0 ? (
          <p style={{ color: "#A0A3BD", fontSize: 13 }}>Sem despesas este mês</p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Donut SVG */}
            <svg viewBox="0 0 42 42" width="120" height="120" style={{ flexShrink: 0 }}>
              {(() => {
                let offset = 0;
                return expByCat.map(([cat, amt]) => {
                  const p = totalExp > 0 ? (amt / totalExp) * 100 : 0;
                  const el = <circle key={cat} cx="21" cy="21" r="15.91" fill="none" stroke={CATEGORIES[cat]?.color || "#999"} strokeWidth="4" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={-offset} strokeLinecap="round" />;
                  offset += p;
                  return el;
                });
              })()}
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {expByCat.slice(0, 5).map(([cat, amt]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORIES[cat]?.color, flexShrink: 0 }} />
                  <span>{CATEGORIES[cat]?.label}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 500, color: "#6B6D85" }}>{totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Resumo */}
      <Card title="Resumo do Mês">
        {[
          { l: "Total de Receitas", v: fmt(income), c: "#00B894" },
          { l: "Total de Despesas", v: fmt(expenses), c: "#E74C6F" },
          { l: "Saldo Final", v: fmt(balance), c: balance >= 0 ? "#00B894" : "#E74C6F" },
          { l: "Transações", v: `${txCount}`, c: "#6C5CE7" },
        ].map((r, i) => (
          <div key={r.l}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ fontSize: 14, color: "#6B6D85" }}>{r.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: r.c }}>{r.v}</span>
            </div>
            {i < 3 && <div style={{ height: 1, background: "#F0F1F6" }} />}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══════════════════════════════
// TELA: ORÇAMENTO
// ═══════════════════════════════
function BudgetScreen({ budgets, spentIn }) {
  const totalSpent = budgets.reduce((s, b) => s + spentIn(b.category), 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const remaining = totalLimit - totalSpent;

  return (
    <div style={S.screen}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Orçamentos</h2>
      <p style={{ fontSize: 12, color: "#6B6D85", margin: "4px 0 16px" }}>
        {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^./, c => c.toUpperCase())}
      </p>

      {budgets.map(b => {
        const spent = spentIn(b.category);
        const prog = pct(spent, b.limit);
        const color = prog > 0.85 ? "#E74C6F" : prog > 0.65 ? "#F0932B" : "#00B894";
        return (
          <div key={b.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}>
                {CATEGORIES[b.category]?.emoji} {CATEGORIES[b.category]?.label}
              </span>
              <span style={{ fontSize: 12, color: "#6B6D85" }}><strong style={{ color: "#1E1E2D" }}>{fmt(spent)}</strong> / {fmt(b.limit)}</span>
            </div>
            <ProgressBar value={Math.min(prog, 1)} color={color} />
          </div>
        );
      })}

      {/* Resumo total */}
      <div style={{ ...S.card, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#6B6D85", marginBottom: 4 }}>Total Gasto / Orçamento</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(totalSpent)} <span style={{ fontSize: 14, fontWeight: 400, color: "#A0A3BD" }}>/ {fmt(totalLimit)}</span></div>
        <div style={{ margin: "10px 0 6px" }}><ProgressBar value={pct(totalSpent, totalLimit)} color={remaining > 0 ? "#00B894" : "#E74C6F"} /></div>
        <div style={{ fontSize: 11, fontWeight: 500, color: remaining > 0 ? "#00B894" : "#E74C6F" }}>
          {remaining > 0 ? `Você ainda tem ${fmt(remaining)} disponível ✨` : `Orçamento estourado em ${fmt(Math.abs(remaining))}`}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// TELA: METAS
// ═══════════════════════════════
function GoalsScreen({ goals, onAdd, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState("");

  return (
    <div style={S.screen}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Metas de Economia</h2>

      {goals.map(g => {
        const prog = g.target > 0 ? Math.min(g.current / g.target, 1) : 0;
        const status = prog >= 1 ? { t: "Concluída", c: "#00B894" } : prog >= 0.5 ? { t: "Em progresso", c: "#00B894" } : { t: "Nova", c: "#6C5CE7" };
        return (
          <div key={g.id} style={{ ...S.card, padding: 18, borderRadius: 20, position: "relative" }}>
            <button onClick={() => onDelete(g.id)} style={{ ...S.deleteBtn, top: 12, right: 12 }} title="Excluir">✕</button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{g.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, padding: "4px 10px", borderRadius: 6, background: status.c + "18", color: status.c }}>{status.t}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{g.name}</div>
            {g.note && <div style={{ fontSize: 12, color: "#6B6D85", marginBottom: 12 }}>{g.note}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              {editing === g.id ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "#6B6D85" }}>R$</span>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...S.input, width: 90, padding: "4px 8px", fontSize: 12 }} autoFocus />
                  <button onClick={() => { onUpdate(g.id, parseFloat(editVal.replace(",", ".")) || 0); setEditing(null); }} style={{ ...S.chipActive, ...S.chip, fontSize: 10, padding: "4px 10px" }}>OK</button>
                </div>
              ) : (
                <span style={{ color: "#00B894", fontWeight: 600, cursor: "pointer" }} onClick={() => { setEditing(g.id); setEditVal(String(g.current)); }}>{fmt(g.current)} ✏️</span>
              )}
              <span style={{ color: "#6B6D85" }}>Meta: {fmt(g.target)}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#F0F1F6", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 5, width: `${prog * 100}%`, background: "linear-gradient(90deg, #00B894, #A29BFE)", transition: "width .8s ease" }} />
            </div>
          </div>
        );
      })}

      <button onClick={onAdd} style={S.dashedBtn}>+ Nova Meta</button>
    </div>
  );
}

// ═══════════════════════════════
// MODAL: ADICIONAR TRANSAÇÃO
// ═══════════════════════════════
function AddTxModal({ onSave, onClose }) {
  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const cats = type === "expense"
    ? ["food", "housing", "transport", "entertainment", "health", "education", "other"]
    : ["salary", "freelance", "other"];

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Nova Transação</h3>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", gap: 4, background: "#F0F1F6", borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {[["expense", "Despesa"], ["income", "Receita"]].map(([v, l]) => (
            <button key={v} onClick={() => { setType(v); setCategory(v === "expense" ? "food" : "salary"); }}
              style={{ ...S.segBtn, ...(type === v ? S.segBtnActive : {}) }}>{l}</button>
          ))}
        </div>

        <label style={S.label}>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Supermercado" style={S.input} />

        <label style={S.label}>Valor (R$)</label>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" style={S.input} />

        <label style={S.label}>Data</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />

        <label style={S.label}>Categoria</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ ...S.catChip, ...(category === c ? { background: "#6C5CE7" + "18", borderColor: "#6C5CE7", color: "#6C5CE7" } : {}) }}>
              {CATEGORIES[c]?.emoji} {CATEGORIES[c]?.label}
            </button>
          ))}
        </div>

        <label style={S.label}>Observação (opcional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar nota..." style={S.input} />

        <button disabled={!title || !amount}
          onClick={() => onSave({ title, amount: parseFloat(amount.replace(",", ".")) || 0, type, category, date, note })}
          style={{ ...S.primaryBtn, opacity: (!title || !amount) ? 0.5 : 1 }}>
          Salvar Transação
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// MODAL: ADICIONAR META
// ═══════════════════════════════
function AddGoalModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [note, setNote] = useState("");

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Nova Meta</h3>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        <label style={S.label}>Ícone</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {GOAL_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              style={{ fontSize: 22, padding: 6, background: emoji === e ? "#6C5CE7" + "18" : "transparent", border: emoji === e ? "2px solid #6C5CE7" : "2px solid transparent", borderRadius: 8, cursor: "pointer" }}>
              {e}
            </button>
          ))}
        </div>

        <label style={S.label}>Nome da meta</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem Europa" style={S.input} />

        <label style={S.label}>Valor alvo (R$)</label>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="0,00" inputMode="decimal" style={S.input} />

        <label style={S.label}>Já economizei (R$)</label>
        <input value={current} onChange={e => setCurrent(e.target.value)} placeholder="0,00" inputMode="decimal" style={S.input} />

        <label style={S.label}>Descrição (opcional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Breve descrição..." style={S.input} />

        <button disabled={!name || !target}
          onClick={() => onSave({ name, emoji, target: parseFloat(target.replace(",", ".")) || 0, current: parseFloat(current.replace(",", ".")) || 0, note })}
          style={{ ...S.primaryBtn, opacity: (!name || !target) ? 0.5 : 1 }}>
          Salvar Meta
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// COMPONENTES REUTILIZÁVEIS
// ═══════════════════════════════
function TxRow({ tx }) {
  const cat = CATEGORIES[tx.category] || CATEGORIES.other;
  return (
    <div style={S.txRow}>
      <span style={{ ...S.txIcon, background: cat.color + "14" }}>{cat.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.title}</div>
        <div style={{ fontSize: 11, color: "#6B6D85" }}>{cat.label}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === "expense" ? "#E74C6F" : "#00B894" }}>
          {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
        </div>
        <div style={{ fontSize: 10, color: "#A0A3BD" }}>{relDate(tx.date)}</div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ ...S.card, borderRadius: 20, padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: "#F0F1F6", overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(value, 1) * 100}%`, background: color, transition: "width .8s ease" }} />
    </div>
  );
}

// ═══════════════════════════════
// ESTILOS
// ═══════════════════════════════
const S = {
  app: {
    fontFamily: "'DM Sans', sans-serif",
    color: "#1E1E2D",
    background: "#F0F1F6",
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 80,
  },
  screen: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "20px 16px",
  },
  // Nav
  nav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0 14px",
    background: "#fff",
    borderTop: "1px solid rgba(0,0,0,.06)",
    zIndex: 50,
  },
  navBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "color .2s",
  },
  // FAB
  fab: {
    position: "fixed",
    bottom: 90,
    right: "max(16px, calc(50% - 195px))",
    width: 52,
    height: 52,
    background: "linear-gradient(135deg, #6C5CE7, #8B5CF6)",
    borderRadius: 16,
    border: "none",
    color: "#fff",
    fontSize: 26,
    fontWeight: 300,
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(108,92,231,.4)",
    zIndex: 40,
    transition: "transform .2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Balance card
  balanceCard: {
    background: "linear-gradient(135deg, #6C5CE7, #8B7BF7, #A29BFE)",
    borderRadius: 20,
    padding: 24,
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(108,92,231,.3)",
  },
  balanceBubble1: {
    position: "absolute", top: -40, right: -40, width: 140, height: 140,
    background: "rgba(255,255,255,.12)", borderRadius: "50%",
  },
  balanceBubble2: {
    position: "absolute", bottom: -30, left: -20, width: 100, height: 100,
    background: "rgba(255,255,255,.06)", borderRadius: "50%",
  },
  // Quick actions
  quickBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "14px 8px",
    background: "#fff",
    border: "1px solid rgba(0,0,0,.06)",
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    transition: "transform .15s",
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 600,
  },
  // Transaction row
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "#fff",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  // Cards
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    border: "1px solid rgba(0,0,0,.06)",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
  },
  // Chips
  chip: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,.06)",
    color: "#6B6D85",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 20,
    cursor: "pointer",
    transition: "all .2s",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
  },
  chipActive: {
    background: "#6C5CE7",
    color: "#fff",
    borderColor: "#6C5CE7",
    boxShadow: "0 3px 12px rgba(108,92,231,.25)",
  },
  catChip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1.5px solid rgba(0,0,0,.08)",
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    color: "#1E1E2D",
    transition: "all .15s",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "none",
    background: "rgba(231,76,111,.08)",
    color: "#E74C6F",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    transition: "opacity .15s",
  },
  dashedBtn: {
    width: "100%",
    padding: 14,
    border: "2px dashed #A0A3BD",
    borderRadius: 14,
    background: "transparent",
    color: "#6B6D85",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all .2s",
  },
  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 100,
    animation: "fadeIn .2s ease",
  },
  modal: {
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    padding: "24px 20px 32px",
    width: "100%",
    maxWidth: 430,
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "slideUp .3s ease",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "#F0F1F6",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6B6D85",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6B6D85",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(0,0,0,.08)",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1E1E2D",
    background: "#FAFAFA",
    outline: "none",
    transition: "border .15s",
    boxSizing: "border-box",
  },
  segBtn: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#6B6D85",
    cursor: "pointer",
    transition: "all .2s",
  },
  segBtnActive: {
    background: "#6C5CE7",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(108,92,231,.3)",
  },
  primaryBtn: {
    width: "100%",
    padding: 14,
    marginTop: 20,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #6C5CE7, #8B5CF6)",
    color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(108,92,231,.35)",
    transition: "opacity .15s",
  },
};
