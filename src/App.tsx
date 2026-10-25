import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Columns2,
  Eraser,
  ListOrdered,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Shuffle,
  Trash2,
  XCircle,
  Package
} from 'lucide-react';
import { AVLTree } from './structures/AVLTree';
import { RedBlackTree } from './structures/RedBlackTree';
import { OperationStep, TreeType, VisualNode } from './types/tree';
import { TreeVisualizer } from './components/TreeVisualizer';
import { TEST_SCENARIOS, runScenarioOnBothTrees } from './utils/testScenarios';

type ViewMode = TreeType | 'BOTH';

export default function App() {
  const avlRef = useRef(new AVLTree());
  const rbRef = useRef(new RedBlackTree());
  const [, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const [view, setView] = useState<ViewMode>('AVL');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [lastAvl, setLastAvl] = useState<OperationStep | null>(null);
  const [lastRb, setLastRb] = useState<OperationStep | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [scenarioNote, setScenarioNote] = useState<string>('');

  const avl = avlRef.current;
  const rb = rbRef.current;

  const parseKey = (): number | null => {
    const n = Number(input.trim());
    if (input.trim() === '' || !Number.isInteger(n)) {
      setError('Informe um identificador inteiro válido (ex.: 42).');
      return null;
    }
    setError('');
    return n;
  };

  const run = (op: 'INSERT' | 'REMOVE' | 'SEARCH') => {
    const key = parseKey();
    if (key === null) return;
    const a = op === 'INSERT' ? avl.insert(key) : op === 'REMOVE' ? avl.remove(key) : avl.search(key);
    const r = op === 'INSERT' ? rb.insert(key) : op === 'REMOVE' ? rb.remove(key) : rb.search(key);
    setLastAvl(a);
    setLastRb(r);
    setSelectedStepId(null);
    setScenarioNote('');
    setInput('');
    refresh();
  };

  const insertRandom = (count: number) => {
    for (let i = 0; i < count; i++) {
      const key = Math.floor(Math.random() * 200) + 1;
      setLastAvl(avl.insert(key));
      setLastRb(rb.insert(key));
    }
    setSelectedStepId(null);
    setScenarioNote('');
    refresh();
  };

  const reset = () => {
    avl.clear();
    rb.clear();
    setLastAvl(null);
    setLastRb(null);
    setSelectedStepId(null);
    setScenarioNote('');
    setError('');
    refresh();
  };

  const loadScenario = (id: string) => {
    const sc = TEST_SCENARIOS.find((s) => s.id === id);
    if (!sc) return;
    runScenarioOnBothTrees(sc, avl, rb);
    setLastAvl(avl.history[0] ?? null);
    setLastRb(rb.history[0] ?? null);
    setSelectedStepId(null);
    setScenarioNote(`${sc.title} — ${sc.description}`);
    refresh();
  };

  const trees: Record<TreeType, { tree: AVLTree | RedBlackTree; last: OperationStep | null }> = {
    AVL: { tree: avl, last: lastAvl },
    RB: { tree: rb, last: lastRb }
  };

  const activeType: TreeType = view === 'BOTH' ? 'AVL' : view;
  const active = trees[activeType];
  const history = active.tree.history;
  const shownStep = history.find((h) => h.id === selectedStepId) ?? active.last;

  const rootOf = (t: TreeType): VisualNode | null => trees[t].tree.toVisualNode();
  const inOrder = active.tree.inOrder();
  const validation = active.tree.validate();
  const m = active.tree.metrics;

  const renderTree = (t: TreeType) => {
    const selectedIndex = selectedStepId
      ? history.findIndex((item) => item.id === selectedStepId)
      : 0;
    const step = view === 'BOTH'
      ? trees[t].tree.history[selectedIndex] ?? trees[t].last
      : t === activeType ? shownStep : trees[t].last;
    return (
      <TreeVisualizer
        key={t}
        treeType={t}
        root={rootOf(t)}
        snapshotBefore={step ? step.snapshotBefore : undefined}
        balanceSteps={step?.balanceSteps}
        operationId={step?.id}
        highlightedPath={step?.visitedPath}
        targetKey={step?.key}
        compact={view === 'BOTH'}
      />
    );
  };

  const stats = [
    { label: 'Nós', value: m.nodeCount },
    { label: 'Altura', value: m.height },
    { label: 'Rotações', value: m.totalRotations },
    { label: 'Comparações', value: m.totalComparisons },
    ...(activeType === 'RB'
      ? [
          { label: 'Altura negra', value: m.blackHeight ?? 0 },
          { label: 'Recolorações', value: m.recolorings }
        ]
      : [{ label: 'Rotações duplas', value: m.doubleRotations }])
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-amazon-dark border-b border-amazon-orange/40">
        <div className="max-w-[1500px] mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amazon-orange flex items-center justify-center text-slate-900">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Amazon Engineering Challenge — Árvores Balanceadas
              </h1>
              <p className="text-xs text-slate-400">
                IMD0039 · Estruturas de Dados Básicas II · AVL vs. Rubro-Negra · Logística Black Friday
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
          {/* Painel de controle */}
          <aside className="space-y-4">
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-slate-200">Árvore</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ['AVL', 'AVL'],
                  ['RB', 'Rubro-Negra'],
                  ['BOTH', 'Lado a lado']
                ] as [ViewMode, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1 ${
                      view === id
                        ? 'bg-amazon-orange text-slate-900 border-amazon-orange'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {id === 'BOTH' && <Columns2 className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                As operações são aplicadas às duas árvores com os mesmos dados, permitindo a comparação direta.
              </p>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-slate-200">Operações</h2>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run('INSERT')}
                placeholder="ID da encomenda (inteiro)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amazon-orange"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => run('INSERT')} className="btn bg-emerald-600 hover:bg-emerald-500">
                  <Plus className="w-4 h-4" /> Inserir
                </button>
                <button onClick={() => run('SEARCH')} className="btn bg-sky-600 hover:bg-sky-500">
                  <Search className="w-4 h-4" /> Buscar
                </button>
                <button onClick={() => run('REMOVE')} className="btn bg-rose-600 hover:bg-rose-500">
                  <Trash2 className="w-4 h-4" /> Remover
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => insertRandom(8)} className="btn bg-slate-700 hover:bg-slate-600">
                  <Shuffle className="w-4 h-4" /> +8 aleatórios
                </button>
                <button onClick={reset} className="btn bg-slate-700 hover:bg-slate-600">
                  <Eraser className="w-4 h-4" /> Limpar
                </button>
              </div>
            </section>

            <details className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-200">
                Cenários de teste <span className="text-slate-500">({TEST_SCENARIOS.length})</span>
              </summary>
              <div className="space-y-2 mt-3">
                {TEST_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadScenario(s.id)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                    <Play className="w-3.5 h-3.5 text-amazon-orange shrink-0" />
                    {s.title}
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-0.5">{s.badge}</div>
                </button>
                ))}
              </div>
            </details>
          </aside>

          {/* Área principal */}
          <div className="space-y-4 min-w-0">
            {scenarioNote && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg px-4 py-2">
                <strong>Cenário carregado:</strong> {scenarioNote}
              </div>
            )}

            <div className={view === 'BOTH' ? 'grid grid-cols-1 2xl:grid-cols-2 gap-4' : ''}>
              {view === 'BOTH' ? (
                <>
                  {renderTree('AVL')}
                  {renderTree('RB')}
                </>
              ) : (
                renderTree(view)
              )}
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 ${activeType === 'RB' ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-2`}>
              {stats.map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                  <div className="text-[10px] uppercase text-slate-500 tracking-wide">{s.label}</div>
                  <div className="text-lg font-bold font-mono text-amazon-amber">{s.value}</div>
                </div>
              ))}
            </div>
            {view === 'BOTH' && (
              <p className="text-[11px] text-slate-500 -mt-2">
                Métricas e histórico abaixo referem-se à árvore AVL; selecione “Rubro-Negra” para ver as dela.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Log */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <h3 className="px-4 py-2.5 text-sm font-bold bg-slate-950/70 border-b border-slate-800">
                  Linha do tempo da operação ({activeType === 'AVL' ? 'AVL' : 'Rubro-Negra'})
                </h3>
                <div className="p-4 text-xs space-y-2">
                  {shownStep ? (
                    <>
                      <div
                        className={`flex items-start gap-2 font-semibold ${
                          shownStep.success ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {shownStep.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        {shownStep.message}
                      </div>
                      <ol className="space-y-2 max-h-56 overflow-auto border-l border-slate-700 ml-1 pl-3">
                        {shownStep.balanceSteps.map((item, i) => (
                          <li key={`${item.kind}-${i}`} className="relative text-slate-300">
                            <span className={`absolute -left-[18px] top-1 w-2 h-2 rounded-full ${
                              item.kind === 'case' ? 'bg-amber-400' :
                              item.kind === 'rotation' ? 'bg-sky-400' :
                              item.kind === 'recolor' ? 'bg-fuchsia-400' : 'bg-slate-500'
                            }`} />
                            <strong className="text-slate-100">{item.title}</strong>
                            <p className="text-slate-400">{item.description}</p>
                          </li>
                        ))}
                      </ol>
                      {shownStep.details.length > 0 && (
                        <details className="text-slate-400">
                          <summary className="cursor-pointer">Detalhes da operação</summary>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {shownStep.details.map((detail, i) => <li key={i}>{detail}</li>)}
                          </ul>
                        </details>
                      )}
                      <div className="text-slate-500 font-mono">
                        comparações: {shownStep.comparisonsInOp} · rotações: {shownStep.rotationsInOp}
                        {activeType === 'RB' && ` · recolorações: ${shownStep.recolorsInOp}`}
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">Execute uma operação para ver a explicação detalhada.</p>
                  )}
                </div>
                {history.length > 0 && (
                  <div className="border-t border-slate-800 max-h-48 overflow-auto">
                    {history.slice(0, 40).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedStepId(h.id)}
                        className={`w-full text-left px-4 py-1.5 text-[11px] flex gap-2 hover:bg-slate-800 ${
                          h.id === shownStep?.id ? 'bg-slate-800' : ''
                        }`}
                      >
                        <span className="text-slate-500 font-mono">{h.timestamp}</span>
                        <span
                          className={`font-bold w-14 ${h.success ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {h.operation}
                        </span>
                        <span className="text-slate-300 truncate">{h.message}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <div className="space-y-4">
                {/* Validação */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <h3 className="px-4 py-2.5 text-sm font-bold bg-slate-950/70 border-b border-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verificação das propriedades
                    <span
                      className={`ml-auto text-[11px] px-2 py-0.5 rounded-full ${
                        validation.isValid
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {validation.isValid ? 'Todas válidas' : 'Violação!'}
                    </span>
                  </h3>
                  <ul className="p-4 space-y-2 text-xs">
                    {validation.checks.map((c) => (
                      <li key={c.name} className="flex gap-2">
                        {c.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-200">{c.name}</div>
                          <div className="text-slate-400">{c.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Em ordem */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <h3 className="px-4 py-2.5 text-sm font-bold bg-slate-950/70 border-b border-slate-800 flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-sky-400" />
                    Percurso em ordem (crescente)
                  </h3>
                  <div className="p-4 flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                    {inOrder.length === 0 ? (
                      <span className="text-xs text-slate-500">Árvore vazia.</span>
                    ) : (
                      inOrder.map((p) => (
                        <span
                          key={p.id}
                          title={`${p.trackingCode} · ${p.destination} · ${p.priority}`}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono"
                        >
                          {p.id}
                        </span>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-600 py-6">
        Implementação manual de AVL e Rubro-Negra (sem bibliotecas de balanceamento) · Autor: Gabriel Pinheiro
      </footer>
    </div>
  );
}
