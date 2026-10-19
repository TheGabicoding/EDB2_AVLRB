import { AVLTree } from '../structures/AVLTree';
import { RedBlackTree } from '../structures/RedBlackTree';
import { TreeMetrics, ValidationReport } from '../types/tree';

export interface ScenarioAction {
  type: 'INSERT' | 'REMOVE' | 'SEARCH';
  key: number;
  note: string;
}

export interface TestScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  amazonContext: string;
  actions: ScenarioAction[];
}

export interface ScenarioBenchmarkResult {
  scenario: TestScenario;
  avlMetrics: TreeMetrics;
  rbMetrics: TreeMetrics;
  avlValidation: ValidationReport;
  rbValidation: ValidationReport;
  avlInOrder: number[];
  rbInOrder: number[];
  inOrderMatch: boolean;
  allStepsValid: boolean;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'ascending',
    title: '1. Inserção em Ordem Crescente (10 a 150)',
    badge: 'Pior Caso p/ BST Comum',
    description:
      'Insere 15 encomendas em ordem estritamente crescente (10, 20, 30, ..., 150). Em uma BST comum, degeneraria em lista encadeada de altura 15.',
    amazonContext:
      'Lote de etiquetas geradas sequencialmente por uma esteira automatizada no Centro de Distribuição GRU-SP.',
    actions: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map(
      (k) => ({
        type: 'INSERT',
        key: k,
        note: `Inserção sequencial crescente #${k}`
      })
    )
  },
  {
    id: 'descending',
    title: '2. Inserção em Ordem Decrescente (150 a 10)',
    badge: 'Rotações à Direita (LL)',
    description:
      'Insere 15 encomendas em ordem estritamente decrescente (150, 140, ..., 10), forçando sucessivas rotações à direita.',
    amazonContext:
      'Descarregamento LIFO (Last-In, First-Out) de um caminhão de transferência reversa.',
    actions: [150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map(
      (k) => ({
        type: 'INSERT',
        key: k,
        note: `Inserção sequencial decrescente #${k}`
      })
    )
  },
  {
    id: 'unordered-mix',
    title: '3. Carga Não Ordenada + Duplicatas + Buscas',
    badge: 'Fluxo Real Black Friday',
    description:
      'Insere chaves não ordenadas que provocam rotações simples e duplas (LR/RL), testa rejeição de duplicatas e realiza buscas de chaves existentes e inexistentes.',
    amazonContext:
      'Pedidos simultâneos de múltiplos estados chegando fora de ordem durante pico relâmpago da Black Friday.',
    actions: [
      { type: 'INSERT', key: 50, note: 'Raiz inicial #50' },
      { type: 'INSERT', key: 20, note: 'Subárvore esquerda #20' },
      { type: 'INSERT', key: 80, note: 'Subárvore direita #80' },
      { type: 'INSERT', key: 10, note: 'Extremo esquerdo #10' },
      { type: 'INSERT', key: 30, note: 'Filho interno #30' },
      { type: 'INSERT', key: 25, note: 'Provoca Rotação Dupla (LR / Triângulo)' },
      { type: 'INSERT', key: 70, note: 'Filho interno #70' },
      { type: 'INSERT', key: 90, note: 'Extremo direito #90' },
      { type: 'INSERT', key: 75, note: 'Provoca Rotação Dupla (RL / Triângulo)' },
      { type: 'INSERT', key: 60, note: 'Novo pacote #60' },
      { type: 'INSERT', key: 30, note: 'Teste de inserção de valor REPETIDO (#30)' },
      { type: 'SEARCH', key: 75, note: 'Busca de encomenda EXISTENTE (#75)' },
      { type: 'SEARCH', key: 999, note: 'Busca de encomenda INEXISTENTE (#999)' }
    ]
  },
  {
    id: 'removals-children',
    title: '4. Remoções: 0, 1 e 2 Filhos + Inexistente',
    badge: 'Teste Estrutural Completo',
    description:
      'Constrói árvore balanceada e remove nós folha (0 filhos), com 1 filho, com 2 filhos (raiz/intermediário) e tenta remover chave inexistente.',
    amazonContext:
      'Expedição de pacotes concluídos e cancelamento de pedidos em diferentes posições da árvore.',
    actions: [
      { type: 'INSERT', key: 40, note: 'Base #40' },
      { type: 'INSERT', key: 20, note: 'Base #20' },
      { type: 'INSERT', key: 60, note: 'Base #60' },
      { type: 'INSERT', key: 10, note: 'Folha #10' },
      { type: 'INSERT', key: 30, note: 'Interno #30' },
      { type: 'INSERT', key: 50, note: 'Interno #50' },
      { type: 'INSERT', key: 70, note: 'Interno #70' },
      { type: 'INSERT', key: 25, note: 'Folha #25 (faz #30 ter 1 filho)' },
      { type: 'INSERT', key: 65, note: 'Folha #65' },
      { type: 'INSERT', key: 80, note: 'Folha #80' },
      { type: 'REMOVE', key: 10, note: 'Remoção de nó FOLHA (0 filhos): #10' },
      { type: 'REMOVE', key: 30, note: 'Remoção de nó com 1 FILHO: #30' },
      { type: 'REMOVE', key: 60, note: 'Remoção de nó com 2 FILHOS: #60' },
      { type: 'REMOVE', key: 40, note: 'Remoção da RAIZ com 2 FILHOS: #40' },
      { type: 'REMOVE', key: 404, note: 'Remoção de elemento INEXISTENTE: #404' }
    ]
  },
  {
    id: 'edge-cases',
    title: '5. Casos Limite: Árvore Vazia e Único Elemento',
    badge: 'Robustez & Edge Cases',
    description:
      'Testa busca e remoção em árvore vazia, inserção de único elemento, busca/duplicata nesse elemento, remoção até esvaziar e reinserção.',
    amazonContext:
      'Inicialização de turno em novo centro logístico com fila zerada e primeiro pacote processado.',
    actions: [
      { type: 'SEARCH', key: 100, note: 'Busca em árvore VAZIA (#100)' },
      { type: 'REMOVE', key: 100, note: 'Remoção em árvore VAZIA (#100)' },
      { type: 'INSERT', key: 100, note: 'Inserção de ÚNICO elemento (#100)' },
      { type: 'SEARCH', key: 100, note: 'Busca do único elemento (#100)' },
      { type: 'INSERT', key: 100, note: 'Tentativa de duplicata do único elemento (#100)' },
      { type: 'REMOVE', key: 555, note: 'Remoção de inexistente em árvore unitária (#555)' },
      { type: 'REMOVE', key: 100, note: 'Remoção do único elemento (esvaziando a árvore)' },
      { type: 'INSERT', key: 42, note: 'Reinserção após esvaziamento (#42)' },
      { type: 'INSERT', key: 21, note: 'Adição de segundo nó (#21)' },
      { type: 'INSERT', key: 84, note: 'Adição de terceiro nó (#84)' }
    ]
  },
  {
    id: 'black-friday-stress',
    title: '6. Stress Test Black Friday (31 Operações Mistas)',
    badge: 'Benchmark Comparativo',
    description:
      'Simulação intensiva com 22 inserções, 5 remoções e 4 buscas comparando altura final, rotações e número de comparações entre AVL e Rubro-Negra.',
    amazonContext:
      'Pico de tráfego nacional com inserções em rajada, cancelamentos e consultas de rastreio em tempo real.',
    actions: [
      ...[15, 6, 18, 3, 7, 17, 20, 2, 4, 13, 9, 1, 5, 8, 10, 11, 12, 14, 16, 19, 21, 22].map(
        (k) => ({
          type: 'INSERT' as const,
          key: k,
          note: `Registro de pacote #${k}`
        })
      ),
      { type: 'REMOVE', key: 13, note: 'Expedição pacote #13' },
      { type: 'REMOVE', key: 6, note: 'Expedição pacote #6 (2 filhos)' },
      { type: 'REMOVE', key: 18, note: 'Expedição pacote #18 (2 filhos)' },
      { type: 'REMOVE', key: 1, note: 'Expedição pacote #1 (folha)' },
      { type: 'REMOVE', key: 99, note: 'Tentativa de remoção inexistente #99' },
      { type: 'SEARCH', key: 11, note: 'Rastreio pacote #11' },
      { type: 'SEARCH', key: 22, note: 'Rastreio pacote #22' },
      { type: 'SEARCH', key: 4, note: 'Rastreio pacote #4' },
      { type: 'SEARCH', key: 500, note: 'Rastreio pacote inexistente #500' }
    ]
  }
];

export function runScenarioOnBothTrees(
  scenario: TestScenario,
  avl: AVLTree,
  rb: RedBlackTree
): ScenarioBenchmarkResult {
  avl.clear();
  rb.clear();

  let allStepsValid = true;

  for (const action of scenario.actions) {
    if (action.type === 'INSERT') {
      avl.insert(action.key);
      rb.insert(action.key);
    } else if (action.type === 'REMOVE') {
      avl.remove(action.key);
      rb.remove(action.key);
    } else if (action.type === 'SEARCH') {
      avl.search(action.key);
      rb.search(action.key);
    }

    // Confere as invariantes depois de cada operação, e não apenas no final.
    const ordersMatch = avl.inOrder().map((item) => item.id).join(',') ===
      rb.inOrder().map((item) => item.id).join(',');
    allStepsValid = allStepsValid && avl.validate().isValid && rb.validate().isValid && ordersMatch;
  }

  const avlInOrder = avl.inOrder().map((m) => m.id);
  const rbInOrder = rb.inOrder().map((m) => m.id);
  const inOrderMatch =
    avlInOrder.length === rbInOrder.length &&
    avlInOrder.every((val, idx) => val === rbInOrder[idx]);

  return {
    scenario,
    avlMetrics: { ...avl.metrics },
    rbMetrics: { ...rb.metrics },
    avlValidation: avl.validate(),
    rbValidation: rb.validate(),
    avlInOrder,
    rbInOrder,
    inOrderMatch,
    allStepsValid
  };
}

export function runAllBenchmarks(): ScenarioBenchmarkResult[] {
  return TEST_SCENARIOS.map((scenario) => {
    const avl = new AVLTree();
    const rb = new RedBlackTree();
    return runScenarioOnBothTrees(scenario, avl, rb);
  });
}
