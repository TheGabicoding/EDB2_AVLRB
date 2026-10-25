/**
 * Benchmark comparativo AVL x Rubro-Negra para o Amazon Engineering Challenge (Black Friday).
 *
 * Abrange:
 * 1. Os 6 testes mínimos obrigatórios do enunciado da disciplina (IMD0039 - UFRN).
 * 2. Análise do padrão de chegada (crescente, decrescente, zigue-zague, rajadas, aleatório).
 * 3. Latência de busca pós-construção (chaves existentes e inexistentes).
 * 4. Padrões de remoção e teto de pior caso de rotações (teto teórico da Rubro-Negra <= 3).
 * 5. Cargas mistas Black Friday comparando IDs sequenciais (esteira) vs IDs aleatórios (UUIDs).
 * 6. Teste de hipótese: "Pico Relâmpago / Flash Ingestion" (inserção maciça pura de 500 a 5000 pedidos).
 * 7. Verificação contínua das invariantes das duas estruturas.
 *
 * Execução: npm run benchmark
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { AVLTree } from '../src/structures/AVLTree';
import { RedBlackTree } from '../src/structures/RedBlackTree';
import { OperationStep } from '../src/types/tree';
import { TEST_SCENARIOS, runScenarioOnBothTrees } from '../src/utils/testScenarios';

type Tree = AVLTree | RedBlackTree;
type Kind = 'AVL' | 'RB';

// ---------- Utilitários de Semente e Distribuição ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

function newTree(kind: Kind): Tree {
  return kind === 'AVL' ? new AVLTree() : new RedBlackTree();
}

interface Acc {
  ops: number;
  rotations: number;
  recolors: number;
  comparisons: number;
  maxRotationsOp: number;
  maxRecolorsOp: number;
  maxCompOp: number;
}
const newAcc = (): Acc => ({
  ops: 0,
  rotations: 0,
  recolors: 0,
  comparisons: 0,
  maxRotationsOp: 0,
  maxRecolorsOp: 0,
  maxCompOp: 0
});

function track(acc: Acc, s: OperationStep, tree: Tree) {
  acc.ops++;
  acc.rotations += s.rotationsInOp;
  acc.recolors += s.recolorsInOp;
  acc.comparisons += s.comparisonsInOp;
  acc.maxRotationsOp = Math.max(acc.maxRotationsOp, s.rotationsInOp);
  acc.maxRecolorsOp = Math.max(acc.maxRecolorsOp, s.recolorsInOp);
  acc.maxCompOp = Math.max(acc.maxCompOp, s.comparisonsInOp);
  tree.history = []; // Evita acumular snapshots de animação visual em memória durante benchmarks
}

function insertAll(tree: Tree, keys: number[], acc: Acc) {
  for (const k of keys) track(acc, tree.insert(k), tree);
}

function removeAll(tree: Tree, keys: number[], acc: Acc) {
  for (const k of keys) track(acc, tree.remove(k), tree);
}

function avgSearchComparisons(tree: Tree, keys: number[], sample: number, rand: () => number) {
  const picks = shuffle(keys, rand).slice(0, sample);
  let total = 0;
  let max = 0;
  for (const k of picks) {
    const s = tree.search(k);
    total += s.comparisonsInOp;
    max = Math.max(max, s.comparisonsInOp);
    tree.history = [];
  }
  return { avg: total / (picks.length || 1), max };
}

function avgNonExistentSearchComparisons(tree: Tree, maxExistingKey: number, sample: number, rand: () => number) {
  let total = 0;
  let max = 0;
  for (let i = 0; i < sample; i++) {
    // Chaves inexistentes fora do intervalo ou números negativos
    const fakeKey = maxExistingKey + 1000 + Math.floor(rand() * 5000);
    const s = tree.search(fakeKey);
    total += s.comparisonsInOp;
    max = Math.max(max, s.comparisonsInOp);
    tree.history = [];
  }
  return { avg: total / (sample || 1), max };
}

const heightOf = (t: Tree) => t.metrics.height;
const valid = (t: Tree) => t.validate().isValid;
const log2 = (n: number) => Math.log2(n);

interface Row {
  [k: string]: string | number | boolean;
}
const out: Record<string, Row[]> = {};

// =========================================================================
// BLOCO 0: CENÁRIOS OBRIGATÓRIOS DO ENUNCIADO DO TRABALHO (SLIDES 6 E 7)
// =========================================================================
{
  const rows: Row[] = [];
  const reqMap: Record<string, string> = {
    ascending: 'Inserção sequencial crescente (Pior caso de BST)',
    descending: 'Inserção sequencial decrescente (Rotações à direita)',
    'unordered-mix': 'Carga não ordenada + Duplicatas + Buscas (existente e inexistente)',
    'removals-children': 'Remoções com 0, 1 e 2 filhos + Remoção de inexistente',
    'edge-cases': 'Casos limite: Árvore vazia, 1 elemento e reinserção',
    'black-friday-stress': 'Stress Test Black Friday (31 operações mistas)'
  };

  for (const scenario of TEST_SCENARIOS) {
    const avl = new AVLTree();
    const rb = new RedBlackTree();
    const res = runScenarioOnBothTrees(scenario, avl, rb);

    rows.push({
      cenario: scenario.title,
      requisitoPDF: reqMap[scenario.id] ?? 'Requisito do enunciado',
      nosFinais: res.avlMetrics.nodeCount,
      alturaAVL: res.avlMetrics.height,
      alturaRB: res.rbMetrics.height,
      alturaNegraRB: res.rbMetrics.blackHeight,
      rotacoesAVL: res.avlMetrics.totalRotations,
      rotacoesRB: res.rbMetrics.totalRotations,
      recoloracoesRB: res.rbMetrics.recolorings,
      comparacoesAVL: res.avlMetrics.totalComparisons,
      comparacoesRB: res.rbMetrics.totalComparisons,
      duplicatasTratadas: res.avlMetrics.duplicateAttempts,
      invariantesPreservadas: res.allStepsValid && res.avlValidation.isValid && res.rbValidation.isValid,
      percursoEmOrdemCoincide: res.inOrderMatch
    });
  }
  out['0_testes_obrigatorios_pdf'] = rows;
}

// =========================================================================
// BLOCO 1: INSERÇÃO POR PADRÃO DE CHEGADA (SLIDE 8 - ANÁLISE COMPARATIVA)
// =========================================================================
type Gen = (n: number, rand: () => number) => number[];
const WORKLOADS: Record<string, Gen> = {
  'Crescente (esteira sequencial)': (n) => range(n),
  'Decrescente (descarga LIFO)': (n) => range(n).reverse(),
  'Zigue-zague (extremos alternados)': (n) => {
    const r: number[] = [];
    let lo = 1,
      hi = n;
    while (lo <= hi) {
      r.push(lo++);
      if (lo <= hi) r.push(hi--);
    }
    return r;
  },
  'Rajadas ordenadas (lotes de CDs)': (n, rand) => {
    const size = 50;
    const blocks: number[][] = [];
    for (let i = 1; i <= n; i += size) {
      blocks.push(range(Math.min(size, n - i + 1)).map((x) => x + i - 1));
    }
    return shuffle(blocks, rand).flat();
  },
  'Aleatória (pedidos simultâneos)': (n, rand) => shuffle(range(n), rand)
};

const SIZES = [100, 500, 1000];
const RANDOM_SEEDS = [1, 2, 3];

{
  const rows: Row[] = [];
  for (const [name, gen] of Object.entries(WORKLOADS)) {
    for (const n of SIZES) {
      for (const kind of ['AVL', 'RB'] as Kind[]) {
        const seeds = name.startsWith('Aleat') || name.startsWith('Rajadas') ? RANDOM_SEEDS : [1];
        let h = 0,
          rot = 0,
          rec = 0,
          cmp = 0,
          maxRot = 0,
          maxRec = 0,
          ok = true;
        for (const seed of seeds) {
          const t = newTree(kind);
          const acc = newAcc();
          insertAll(t, gen(n, rng(seed)), acc);
          h += heightOf(t);
          rot += acc.rotations;
          rec += acc.recolors;
          cmp += acc.comparisons;
          maxRot = Math.max(maxRot, acc.maxRotationsOp);
          maxRec = Math.max(maxRec, acc.maxRecolorsOp);
          ok = ok && valid(t) && t.metrics.nodeCount === n;
        }
        const k = seeds.length;
        rows.push({
          carga: name,
          n,
          estrutura: kind,
          alturaFinal: +(h / k).toFixed(1),
          alturaIdeal: Math.ceil(log2(n + 1)),
          rotacoesPorInsercao: +(rot / k / n).toFixed(3),
          recoloracoesPorInsercao: +(rec / k / n).toFixed(3),
          comparacoesPorInsercao: +(cmp / k / n).toFixed(2),
          maxRotacoesEmUmaOp: maxRot,
          maxRecoloracoesEmUmaOp: maxRec,
          invarianteOk: ok
        });
      }
    }
  }
  out['1_insercao'] = rows;
}

// =========================================================================
// BLOCO 2: BUSCA E RASTREIO PÓS-CONSTRUÇÃO (EXISTENTES E INEXISTENTES)
// =========================================================================
{
  const rows: Row[] = [];
  for (const [name, gen] of Object.entries(WORKLOADS)) {
    for (const n of SIZES) {
      for (const kind of ['AVL', 'RB'] as Kind[]) {
        const seeds = name.startsWith('Aleat') || name.startsWith('Rajadas') ? RANDOM_SEEDS : [1];
        let avgExist = 0,
          maxExist = 0;
        let avgNonExist = 0,
          maxNonExist = 0;

        for (const seed of seeds) {
          const t = newTree(kind);
          const keys = gen(n, rng(seed));
          insertAll(t, keys, newAcc());

          const rExist = avgSearchComparisons(t, keys, Math.min(n, 400), rng(99 + seed));
          avgExist += rExist.avg;
          maxExist = Math.max(maxExist, rExist.max);

          const rNonExist = avgNonExistentSearchComparisons(t, n, 100, rng(200 + seed));
          avgNonExist += rNonExist.avg;
          maxNonExist = Math.max(maxNonExist, rNonExist.max);
        }

        const k = seeds.length;
        rows.push({
          carga: name,
          n,
          estrutura: kind,
          comparacoesMediasBusca: +(avgExist / k).toFixed(2),
          comparacoesPiorBusca: maxExist,
          comparacoesMediasInexistente: +(avgNonExist / k).toFixed(2),
          comparacoesPiorInexistente: maxNonExist,
          log2n: +log2(n).toFixed(2)
        });
      }
    }
  }
  out['2_busca'] = rows;
}

// =========================================================================
// BLOCO 3: REMOÇÃO (EXPEDIÇÃO FIFO, CANCELAMENTOS ALEATÓRIOS E METADE)
// =========================================================================
{
  const rows: Row[] = [];
  const patterns: Record<string, (keys: number[], rand: () => number) => number[]> = {
    'Remover todas em ordem crescente (expedição FIFO)': (k) => [...k].sort((a, b) => a - b),
    'Remover todas em ordem aleatória (cancelamentos)': (k, r) => shuffle(k, r),
    'Remover metade aleatória': (k, r) => shuffle(k, r).slice(0, Math.floor(k.length / 2))
  };

  for (const n of SIZES) {
    for (const [pName, pick] of Object.entries(patterns)) {
      for (const [wName, gen] of [
        ['Crescente', WORKLOADS['Crescente (esteira sequencial)']],
        ['Aleatória', WORKLOADS['Aleatória (pedidos simultâneos)']]
      ] as [string, Gen][]) {
        for (const kind of ['AVL', 'RB'] as Kind[]) {
          const seeds = RANDOM_SEEDS;
          let rot = 0,
            rec = 0,
            cmp = 0,
            maxRot = 0,
            maxRec = 0,
            hEnd = 0,
            ok = true;
          for (const seed of seeds) {
            const t = newTree(kind);
            const keys = gen(n, rng(seed));
            insertAll(t, keys, newAcc());
            const acc = newAcc();
            const victims = pick(keys, rng(500 + seed));
            removeAll(t, victims, acc);
            rot += acc.rotations;
            rec += acc.recolors;
            cmp += acc.comparisons;
            maxRot = Math.max(maxRot, acc.maxRotationsOp);
            maxRec = Math.max(maxRec, acc.maxRecolorsOp);
            hEnd += heightOf(t);
            ok = ok && valid(t) && t.metrics.nodeCount === n - victims.length;
          }
          const k = seeds.length;
          const removed = pName.includes('metade') ? Math.floor(n / 2) : n;
          rows.push({
            n,
            padraoRemocao: pName,
            cargaInsercaoPrevia: wName,
            estrutura: kind,
            rotacoesPorRemocao: +(rot / k / removed).toFixed(3),
            recoloracoesPorRemocao: +(rec / k / removed).toFixed(3),
            comparacoesPorRemocao: +(cmp / k / removed).toFixed(2),
            maxRotacoesEmUmaRemocao: maxRot,
            maxRecoloracoesEmUmaRemocao: maxRec,
            alturaFinalMedia: +(hEnd / k).toFixed(1),
            invarianteOk: ok
          });
        }
      }
    }
  }
  out['3_remocao'] = rows;
}

// =========================================================================
// BLOCO 4: CARGA MISTA BLACK FRIDAY (IDs CRESCENTES DE ESTEIRA)
// =========================================================================
const MIXES: [string, number, number, number][] = [
  ['Leitura intensa (80% busca, 15% insere, 5% remove)', 0.8, 0.15, 0.05],
  ['Balanceada (50% busca, 30% insere, 20% remove)', 0.5, 0.3, 0.2],
  ['Escrita intensa (20% busca, 50% insere, 30% remove)', 0.2, 0.5, 0.3]
];
const OPS = 1500;

function runMixedWorkload(isRandomKeys: boolean): Row[] {
  const rows: Row[] = [];
  for (const [name, ps, pi] of MIXES) {
    for (const kind of ['AVL', 'RB'] as Kind[]) {
      let work = 0,
        rot = 0,
        rec = 0,
        cmp = 0,
        hSum = 0,
        ok = true,
        maxRot = 0;
      for (const seed of RANDOM_SEEDS) {
        const rand = rng(seed);
        const t = newTree(kind);
        const alive: number[] = [];
        let nextSeq = 1;
        const acc = newAcc();

        // Inicialização com 300 encomendas em trânsito
        for (let i = 0; i < 300; i++) {
          const k = isRandomKeys ? Math.floor(rand() * 1000000) : nextSeq++;
          t.insert(k);
          alive.push(k);
          t.history = [];
        }

        for (let i = 0; i < OPS; i++) {
          const r = rand();
          if (r < ps && alive.length) {
            // Busca de encomenda existente
            const pickKey = alive[Math.floor(rand() * alive.length)];
            track(acc, t.search(pickKey), t);
          } else if (r < ps + pi) {
            // Inserção de novo pacote
            const k = isRandomKeys ? Math.floor(rand() * 1000000) : nextSeq++;
            alive.push(k);
            track(acc, t.insert(k), t);
          } else if (alive.length) {
            // Expedição / Remoção de encomenda entregue
            const idx = Math.floor(rand() * alive.length);
            const k = alive.splice(idx, 1)[0];
            track(acc, t.remove(k), t);
          }
        }
        rot += acc.rotations;
        rec += acc.recolors;
        cmp += acc.comparisons;
        maxRot = Math.max(maxRot, acc.maxRotationsOp);
        hSum += heightOf(t);
        ok = ok && valid(t);
      }
      const k = RANDOM_SEEDS.length;
      work = (cmp + rot + rec * 0.2) / k / OPS; // Recoloração é mais barata que rotação
      rows.push({
        mix: name,
        estrutura: kind,
        comparacoesPorOp: +(cmp / k / OPS).toFixed(2),
        rotacoesPorOp: +(rot / k / OPS).toFixed(3),
        recoloracoesPorOp: +(rec / k / OPS).toFixed(3),
        maxRotacoesEmUmaOp: maxRot,
        alturaFinalMedia: +(hSum / k).toFixed(1),
        trabalhoTotalPorOp: +work.toFixed(2),
        invarianteOk: ok
      });
    }
  }
  return rows;
}

out['4_carga_mista'] = runMixedWorkload(false); // IDs crescentes de esteira
out['4b_carga_mista_aleatoria'] = runMixedWorkload(true); // IDs aleatórios (UUIDs)

// =========================================================================
// BLOCO 5: TESTE DE HIPÓTESE — "PICO RELÂMPAGO / FLASH INGESTION" (INSERÇÃO PURA)
// =========================================================================
{
  const rows: Row[] = [];
  const flashVolumes = [500, 1000, 2500, 5000];

  for (const n of flashVolumes) {
    for (const arrivalType of ['Sequencial (Esteira)', 'Aleatório (UUIDs)']) {
      for (const kind of ['AVL', 'RB'] as Kind[]) {
        const rand = rng(42);
        const keys = arrivalType.startsWith('Seq') ? range(n) : shuffle(range(n), rand);
        const t = newTree(kind);
        const acc = newAcc();

        insertAll(t, keys, acc);

        const workScore = +(acc.comparisons + acc.rotations * 1.5 + acc.recolors * 0.2).toFixed(0);

        rows.push({
          volumeN: n,
          tipoChegada: arrivalType,
          estrutura: kind,
          alturaFinal: heightOf(t),
          alturaIdeal: Math.ceil(log2(n + 1)),
          rotacoesTotal: acc.rotations,
          rotacoesPorIns: +(acc.rotations / n).toFixed(3),
          recoloracoesTotal: acc.recolors,
          recoloracoesPorIns: +(acc.recolors / n).toFixed(3),
          comparacoesTotal: acc.comparisons,
          comparacoesPorIns: +(acc.comparisons / n).toFixed(2),
          maxRotacoesEmUmaOp: acc.maxRotationsOp,
          scoreTrabalhoTotal: workScore,
          invarianteOk: valid(t)
        });
      }
    }
  }
  out['5_pico_insercao_flash'] = rows;
}

// =========================================================================
// BLOCO 6: ROBUSTEZ DAS INVARIANTES E EXCEÇÕES (VERIFICAÇÃO A CADA OPERAÇÃO)
// =========================================================================
{
  const rows: Row[] = [];
  for (const kind of ['AVL', 'RB'] as Kind[]) {
    let violations = 0,
      checks = 0;
    for (const seed of RANDOM_SEEDS) {
      const rand = rng(1000 + seed);
      const t = newTree(kind);
      const alive: number[] = [];
      for (let i = 0; i < 300; i++) {
        if (rand() < 0.6 || !alive.length) {
          const k = Math.floor(rand() * 400);
          t.insert(k);
          if (!alive.includes(k)) alive.push(k);
        } else {
          const k = alive.splice(Math.floor(rand() * alive.length), 1)[0];
          t.remove(k);
        }
        t.history = [];
        checks++;
        if (!valid(t)) violations++;
      }
    }
    rows.push({ estrutura: kind, validacoes: checks, violacoes: violations });
  }
  out['6_robustez'] = rows;
}

// =========================================================================
// FORMATAÇÃO E ESCRITA DOS RESULTADOS (MARKDOWN)
// =========================================================================
function md(rows: Row[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [
    `| ${cols.join(' | ')} |`,
    `| ${cols.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${cols.map((c) => String(r[c])).join(' | ')} |`)
  ].join('\n');
}

mkdirSync('docs', { recursive: true });

const titles: Record<string, string> = {
  '0_testes_obrigatorios_pdf': '1. Cenários Obrigatórios do Enunciado do Trabalho (IMD0039 - UFRN)',
  '1_insercao': '2. Experimento 1 — Inserção por Padrão de Chegada (N = 100, 500, 1000)',
  '2_busca': '3. Experimento 2 — Custo de Busca Pós-Construção (Existentes e Inexistentes)',
  '3_remocao': '4. Experimento 3 — Remoção (Expedição FIFO, Cancelamento Aleatório e Metade)',
  '4_carga_mista': '5. Experimento 4A — Carga Mista Black Friday (IDs Crescentes de Esteira)',
  '4b_carga_mista_aleatoria': '6. Experimento 4B — Carga Mista Black Friday (IDs Aleatórios / Hashes UUIDs)',
  '5_pico_insercao_flash': '7. Experimento 5 — Teste de Hipótese: "Pico Relâmpago / Flash Ingestion" (Inserção Maciça Pura)',
  '6_robustez': '8. Experimento 6 — Robustez e Preservação Contínua das Invariantes'
};

const guideSlides = `
## 9. Roteiro de Transposição dos Resultados para os Slides da Apresentação

| Slide da Apresentação (PDF) | Tópico do Enunciado | Dados e Tabelas Recomendadas |
|---|---|---|
| **Slide 6: Demonstração do Sistema** | Evidências de Inserção, Busca e Remoção | Usar tabela da **Seção 1 (Cenários Obrigatórios)** mostrando as operações 0, 1 e 2 filhos, duplicatas e busca de inexistente. |
| **Slide 7: Testes Realizados** | Apresentação dos cenários testados | Apresentar os 6 cenários padronizados com confirmação de invariantes 100% válidas e percurso em-ordem idêntico. |
| **Slide 8: Análise Comparativa** | Comparação de Alturas e Rotações | Contrastar **Inserção por Chegada (Seção 2)** e **Pico Flash Ingestion (Seção 7)** com gráficos de altura e trabalho. |
| **Slide 9: Recomendação Técnica** | Veredito fundamentado em evidências | Apresentar o comparativo entre **IDs de Esteira (Seção 5)** e **IDs Aleatórios (Seção 6)** + garantia de teto <= 3 rotações na RB. |
`;

const markdownContent =
  Object.entries(titles)
    .map(([k, title]) => `## ${title}\n\n${md(out[k] ?? [])}\n`)
    .join('\n') +
  '\n' +
  guideSlides;

writeFileSync('docs/resultados_benchmark.md', markdownContent);

console.log('Benchmark concluído com sucesso!');
console.log('Resultados exportados para:');
console.log(' - docs/resultados_benchmark.md');
