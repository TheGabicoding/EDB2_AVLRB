import {
  BalanceStep,
  OperationStep,
  PackageMetadata,
  TreeMetrics,
  ValidationCheck,
  ValidationReport,
  VisualNode
} from '../types/tree';
import { generatePackageMetadata } from '../utils/packageGenerator';

/**
 * Nó interno da Árvore AVL.
 * Armazena a chave (ID da encomenda), metadados logísticos, referências aos filhos
 * e a altura da subárvore enraizada neste nó (folha = altura 1).
 */
export class AVLNode {
  key: number;
  metadata: PackageMetadata;
  height: number;
  left: AVLNode | null = null;
  right: AVLNode | null = null;

  constructor(key: number, metadata?: PackageMetadata) {
    this.key = key;
    this.metadata = metadata ?? generatePackageMetadata(key);
    this.height = 1;
  }
}

/**
 * Implementação completa e manual da Árvore AVL (Adelson-Velsky e Landis).
 * Não utiliza bibliotecas externas de balanceamento.
 *
 * Decisões de projeto:
 * - Altura de nó nulo = 0; Altura de nó folha = 1.
 * - Fator de Balanceamento (FB) = altura(esquerda) - altura(direita).
 * - Invariante AVL: Para todo nó N, -1 <= FB(N) <= 1.
 * - Chaves duplicadas: Rejeitadas com aviso documentado no log (IDs de encomendas são únicos),
 *   mantendo a árvore íntegra e contabilizando a tentativa em `duplicateAttempts`.
 * - Remoção de nó com 2 filhos: Substituição pelo sucessor em-ordem (menor elemento da subárvore direita).
 */
export class AVLTree {
  root: AVLNode | null = null;
  metrics: TreeMetrics;
  history: OperationStep[] = [];

  // Contadores temporários por operação para relatório detalhado
  private opRotations = 0;
  private opComparisons = 0;
  private opDetails: string[] = [];
  private opVisitedPath: number[] = [];
  private opBalanceSteps: BalanceStep[] = [];

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): TreeMetrics {
    return {
      nodeCount: 0,
      height: 0,
      totalRotations: 0,
      leftRotations: 0,
      rightRotations: 0,
      doubleRotations: 0,
      recolorings: 0,
      totalComparisons: 0,
      successfulInserts: 0,
      duplicateAttempts: 0,
      successfulRemovals: 0,
      missingRemovals: 0,
      successfulSearches: 0,
      missingSearches: 0
    };
  }

  private resetOpTrackers(): void {
    this.opRotations = 0;
    this.opComparisons = 0;
    this.opDetails = [];
    this.opVisitedPath = [];
    this.opBalanceSteps = [];
  }

  private addBalanceStep(
    kind: BalanceStep['kind'],
    title: string,
    description: string,
    snapshot = this.toVisualNode(this.root),
    focusKeys?: number[]
  ): void {
    this.opBalanceSteps.push({ kind, title, description, snapshot, focusKeys });
  }

  /** Cria um quadro completo com a nova raiz da subárvore já conectada ao caminho. */
  private snapshotWithSubtree(oldRootKey: number, newRoot: AVLNode): VisualNode | null {
    const replacement = this.toVisualNode(newRoot);
    const replace = (node: VisualNode | null): VisualNode | null => {
      if (!node || node.key === oldRootKey) return node ? replacement : null;
      return { ...node, left: replace(node.left), right: replace(node.right) };
    };
    return replace(this.toVisualNode(this.root));
  }

  /**
   * Retorna a altura de um nó (0 se nulo).
   */
  public getHeight(node: AVLNode | null): number {
    return node ? node.height : 0;
  }

  /**
   * Calcula o Fator de Balanceamento: FB(n) = h(esq) - h(dir).
   */
  public getBalanceFactor(node: AVLNode | null): number {
    if (!node) return 0;
    return this.getHeight(node.left) - this.getHeight(node.right);
  }

  /**
   * Atualiza a altura do nó com base nas alturas de seus filhos.
   */
  private updateHeight(node: AVLNode): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  /**
   * Rotação Simples à Direita (Caso Esquerda-Esquerda / LL).
   *
   *       y                   x
   *      / \                 / \
   *     x   T3    ===>      T1  y
   *    / \                     / \
   *   T1  T2                  T2  T3
   */
  private rotateRight(y: AVLNode): AVLNode {
    const x = y.left!;
    const T2 = x.right;

    // Executa a rotação
    x.right = y;
    y.left = T2;

    // Atualiza alturas (primeiro o nó que desceu, depois a nova raiz da subárvore)
    this.updateHeight(y);
    this.updateHeight(x);

    // Contabiliza métricas
    this.opRotations++;
    this.metrics.totalRotations++;
    this.metrics.rightRotations++;
    this.opDetails.push(
      `Rotação à Direita (LL) no pivô #${y.key} → #${x.key} assumiu o topo da subárvore.`
    );
    this.addBalanceStep(
      'rotation',
      'Rotação simples à direita',
      `O nó #${x.key} sobe e o nó #${y.key} desce para a direita.`,
      this.snapshotWithSubtree(y.key, x),
      [x.key, y.key]
    );

    return x;
  }

  /**
   * Rotação Simples à Esquerda (Caso Direita-Direita / RR).
   *
   *     x                       y
   *    / \                     / \
   *   T1  y       ===>        x   T3
   *      / \                 / \
   *     T2  T3              T1  T2
   */
  private rotateLeft(x: AVLNode): AVLNode {
    const y = x.right!;
    const T2 = y.left;

    // Executa a rotação
    y.left = x;
    x.right = T2;

    // Atualiza alturas
    this.updateHeight(x);
    this.updateHeight(y);

    // Contabiliza métricas
    this.opRotations++;
    this.metrics.totalRotations++;
    this.metrics.leftRotations++;
    this.opDetails.push(
      `Rotação à Esquerda (RR) no pivô #${x.key} → #${y.key} assumiu o topo da subárvore.`
    );
    this.addBalanceStep(
      'rotation',
      'Rotação simples à esquerda',
      `O nó #${y.key} sobe e o nó #${x.key} desce para a esquerda.`,
      this.snapshotWithSubtree(x.key, y),
      [x.key, y.key]
    );

    return y;
  }

  /**
   * Insere uma nova encomenda na Árvore AVL.
   * Trata duplicatas documentando a rejeição.
   */
  public insert(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshotBefore = this.toVisualNode(this.root);

    let duplicateFound = false;
    this.root = this.insertNode(this.root, key, () => {
      duplicateFound = true;
    });

    this.syncMetrics();
    const snapshotAfter = this.toVisualNode(this.root);

    if (duplicateFound) {
      this.metrics.duplicateAttempts++;
      this.opDetails.push(
        `Chave #${key} já existe na árvore. Decisão de projeto: duplicatas são rejeitadas para preservar unicidade dos pacotes.`
      );
      const step = this.recordStep(
        'INSERT',
        key,
        false,
        `Inserção rejeitada: Encomenda #${key} já está registrada.`,
        snapshotBefore,
        snapshotAfter
      );
      return step;
    }

    this.metrics.successfulInserts++;
    const step = this.recordStep(
      'INSERT',
      key,
      true,
      `Encomenda #${key} inserida com sucesso${
        this.opRotations > 0 ? ` (${this.opRotations} rotação(ões) aplicada(s))` : ' (sem necessidade de rotação)'
      }.`,
      snapshotBefore,
      snapshotAfter
    );
    return step;
  }

  private insertNode(
    node: AVLNode | null,
    key: number,
    onDuplicate: () => void
  ): AVLNode {
    if (!node) {
      this.opDetails.push(`Nó folha #${key} alocado com altura inicial 1.`);
      this.opVisitedPath.push(key);
      return new AVLNode(key);
    }

    this.opVisitedPath.push(node.key);
    this.opComparisons++;
    this.metrics.totalComparisons++;

    if (key < node.key) {
      node.left = this.insertNode(node.left, key, onDuplicate);
    } else if (key > node.key) {
      node.right = this.insertNode(node.right, key, onDuplicate);
    } else {
      onDuplicate();
      return node;
    }

    // 1. Atualiza altura do ancestral atual
    this.updateHeight(node);

    // 2. Verifica Fator de Balanceamento
    const balance = this.getBalanceFactor(node);

    // Caso 1: Esquerda-Esquerda (LL)
    if (balance > 1 && node.left && key < node.left.key) {
      this.opDetails.push(
        `Desbalanceamento detectado no nó #${node.key} (FB = +${balance}). Caso Esquerda-Esquerda (LL).`
      );
      this.addBalanceStep('case', 'Caso LL identificado', `O nó #${node.key} ficou com FB ${balance}. Corrigir com rotação à direita.`, this.toVisualNode(this.root), [node.key, node.left.key]);
      return this.rotateRight(node);
    }

    // Caso 2: Direita-Direita (RR)
    if (balance < -1 && node.right && key > node.right.key) {
      this.opDetails.push(
        `Desbalanceamento detectado no nó #${node.key} (FB = ${balance}). Caso Direita-Direita (RR).`
      );
      this.addBalanceStep('case', 'Caso RR identificado', `O nó #${node.key} ficou com FB ${balance}. Corrigir com rotação à esquerda.`, this.toVisualNode(this.root), [node.key, node.right.key]);
      return this.rotateLeft(node);
    }

    // Caso 3: Esquerda-Direita (LR - Rotação Dupla à Direita)
    if (balance > 1 && node.left && key > node.left.key) {
      this.metrics.doubleRotations++;
      this.opDetails.push(
        `Desbalanceamento detectado no nó #${node.key} (FB = +${balance}). Caso Esquerda-Direita (LR - Rotação Dupla).`
      );
      this.addBalanceStep('case', 'Caso LR identificado', `O nó #${node.key} ficou com FB ${balance}. Fazer rotação à esquerda no filho e depois à direita no nó desbalanceado.`, this.toVisualNode(this.root), [node.key, node.left.key]);
      node.left = this.rotateLeft(node.left);
      return this.rotateRight(node);
    }

    // Caso 4: Direita-Esquerda (RL - Rotação Dupla à Esquerda)
    if (balance < -1 && node.right && key < node.right.key) {
      this.metrics.doubleRotations++;
      this.opDetails.push(
        `Desbalanceamento detectado no nó #${node.key} (FB = ${balance}). Caso Direita-Esquerda (RL - Rotação Dupla).`
      );
      this.addBalanceStep('case', 'Caso RL identificado', `O nó #${node.key} ficou com FB ${balance}. Fazer rotação à direita no filho e depois à esquerda no nó desbalanceado.`, this.toVisualNode(this.root), [node.key, node.right.key]);
      node.right = this.rotateRight(node.right);
      return this.rotateLeft(node);
    }

    return node;
  }

  /**
   * Remove uma encomenda pelo seu identificador.
   * Trata árvore vazia, elemento inexistente e nós com 0, 1 ou 2 filhos,
   * rebalanceando todos os ancestrais no retorno da recursão.
   */
  public remove(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshotBefore = this.toVisualNode(this.root);

    if (!this.root) {
      this.metrics.missingRemovals++;
      this.opDetails.push('Tentativa de remoção em árvore vazia.');
      return this.recordStep(
        'REMOVE',
        key,
        false,
        `Remoção falhou: A árvore AVL está vazia (encomenda #${key} não encontrada).`,
        snapshotBefore,
        snapshotBefore
      );
    }

    let found = false;
    this.root = this.removeNode(this.root, key, () => {
      found = true;
    });

    this.syncMetrics();
    const snapshotAfter = this.toVisualNode(this.root);

    if (!found) {
      this.metrics.missingRemovals++;
      this.opDetails.push(`Chave #${key} não foi localizada para remoção.`);
      return this.recordStep(
        'REMOVE',
        key,
        false,
        `Remoção não realizada: Encomenda #${key} inexistente no sistema.`,
        snapshotBefore,
        snapshotAfter
      );
    }

    this.metrics.successfulRemovals++;
    return this.recordStep(
      'REMOVE',
      key,
      true,
      `Encomenda #${key} removida com sucesso${
        this.opRotations > 0 ? ` (${this.opRotations} rotação(ões) de rebalanceamento)` : ''
      }.`,
      snapshotBefore,
      snapshotAfter
    );
  }

  private removeNode(
    node: AVLNode | null,
    key: number,
    onFound: () => void
  ): AVLNode | null {
    if (!node) {
      return null;
    }

    this.opVisitedPath.push(node.key);
    this.opComparisons++;
    this.metrics.totalComparisons++;

    if (key < node.key) {
      node.left = this.removeNode(node.left, key, onFound);
    } else if (key > node.key) {
      node.right = this.removeNode(node.right, key, onFound);
    } else {
      onFound();

      // Caso A: Nó folha ou com apenas 1 filho
      if (!node.left || !node.right) {
        const child = node.left ? node.left : node.right;
        if (!child) {
          this.opDetails.push(`Nó #${key} era folha (0 filhos) e foi removido diretamente.`);
          return null;
        } else {
          this.opDetails.push(
            `Nó #${key} possuía 1 filho (#${child.key}), que assumiu sua posição.`
          );
          return child;
        }
      }

      // Caso B: Nó com 2 filhos -> Substitui pelo sucessor em-ordem (menor da subárvore direita)
      const successor = this.getMinValueNode(node.right);
      this.opDetails.push(
        `Nó #${key} possuía 2 filhos. Substituído pelo sucessor em-ordem #${successor.key}.`
      );
      node.key = successor.key;
      node.metadata = successor.metadata;
      node.right = this.removeNode(node.right, successor.key, () => {});
    }

    // Atualiza altura e verifica balanceamento na volta da recursão
    this.updateHeight(node);
    const balance = this.getBalanceFactor(node);

    // Esquerda-Esquerda (LL)
    if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
      this.opDetails.push(
        `Pós-remoção: nó #${node.key} desbalanceado (FB = +${balance}). Caso LL.`
      );
      this.addBalanceStep('case', 'Caso LL identificado após remoção', `O nó #${node.key} ficou com FB ${balance}. Corrigir com rotação à direita.`);
      return this.rotateRight(node);
    }

    // Esquerda-Direita (LR)
    if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
      this.metrics.doubleRotations++;
      this.opDetails.push(
        `Pós-remoção: nó #${node.key} desbalanceado (FB = +${balance}). Caso LR (Rotação Dupla).`
      );
      this.addBalanceStep('case', 'Caso LR identificado após remoção', `O nó #${node.key} ficou com FB ${balance}. Fazer rotação à esquerda no filho e depois à direita no nó desbalanceado.`);
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Direita-Direita (RR)
    if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
      this.opDetails.push(
        `Pós-remoção: nó #${node.key} desbalanceado (FB = ${balance}). Caso RR.`
      );
      this.addBalanceStep('case', 'Caso RR identificado após remoção', `O nó #${node.key} ficou com FB ${balance}. Corrigir com rotação à esquerda.`);
      return this.rotateLeft(node);
    }

    // Direita-Esquerda (RL)
    if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
      this.metrics.doubleRotations++;
      this.opDetails.push(
        `Pós-remoção: nó #${node.key} desbalanceado (FB = ${balance}). Caso RL (Rotação Dupla).`
      );
      this.addBalanceStep('case', 'Caso RL identificado após remoção', `O nó #${node.key} ficou com FB ${balance}. Fazer rotação à direita no filho e depois à esquerda no nó desbalanceado.`);
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private getMinValueNode(node: AVLNode): AVLNode {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  /**
   * Busca um elemento na Árvore AVL registrando o caminho percorrido e número de comparações.
   */
  public search(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshot = this.toVisualNode(this.root);

    let current = this.root;
    let depth = 0;

    while (current !== null) {
      this.opVisitedPath.push(current.key);
      this.opComparisons++;
      this.metrics.totalComparisons++;

      if (key === current.key) {
        this.metrics.successfulSearches++;
        this.opDetails.push(
          `Encomenda #${key} (${current.metadata.trackingCode}) localizada no nível ${depth} após ${this.opComparisons} comparação(ões).`,
          `Caminho percorrido: ${this.opVisitedPath.map((k) => `#${k}`).join(' → ')}`
        );
        return this.recordStep(
          'SEARCH',
          key,
          true,
          `Encomenda #${key} encontrada em ${this.opComparisons} comparação(ões)! Destino: ${current.metadata.destination}.`,
          snapshot,
          snapshot
        );
      }

      current = key < current.key ? current.left : current.right;
      depth++;
    }

    this.metrics.missingSearches++;
    this.opDetails.push(
      `Busca encerrada em ponteiro nulo após ${this.opComparisons} comparação(ões).`,
      this.opVisitedPath.length > 0
        ? `Caminho percorrido: ${this.opVisitedPath.map((k) => `#${k}`).join(' → ')} → NULL`
        : 'Árvore vazia (raiz nula).'
    );

    return this.recordStep(
      'SEARCH',
      key,
      false,
      `Encomenda #${key} não encontrada (${this.opComparisons} comparação(ões)).`,
      snapshot,
      snapshot
    );
  }

  /**
   * Percurso Em-Ordem (In-Order Traversal): Esquerda -> Raiz -> Direita.
   * Retorna os elementos estritamente em ordem crescente.
   */
  public inOrder(): PackageMetadata[] {
    const result: PackageMetadata[] = [];
    const traverse = (node: AVLNode | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.metadata);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  /**
   * Verifica rigorosamente se todas as propriedades de uma Árvore AVL são preservadas:
   * 1. Propriedade de Árvore Binária de Busca (BST): esq < raiz < dir.
   * 2. Alturas armazenadas consistentes com `1 + max(h(esq), h(dir))`.
   * 3. Fator de Balanceamento de todos os nós dentro do intervalo [-1, 0, +1].
   */
  public validate(): ValidationReport {
    const checks: ValidationCheck[] = [];

    // 1. Verificar propriedade BST
    let bstValid = true;
    const checkBST = (node: AVLNode | null, min: number, max: number) => {
      if (!node) return;
      if (node.key <= min || node.key >= max) {
        bstValid = false;
      }
      checkBST(node.left, min, node.key);
      checkBST(node.right, node.key, max);
    };
    checkBST(this.root, -Infinity, Infinity);
    checks.push({
      name: 'Propriedade de Busca Binária (BST)',
      passed: bstValid,
      description: bstValid
        ? 'Todos os nós à esquerda são menores e à direita são maiores que o pai.'
        : 'Violação de ordenação BST detectada!'
    });

    // 2. Verificar Fator de Balanceamento |FB| <= 1 e consistência de altura
    let balanceValid = true;
    let heightConsistent = true;
    let maxAbsBF = 0;

    const checkBalance = (node: AVLNode | null): number => {
      if (!node) return 0;
      const leftH = checkBalance(node.left);
      const rightH = checkBalance(node.right);
      const expectedH = 1 + Math.max(leftH, rightH);
      if (node.height !== expectedH) {
        heightConsistent = false;
      }
      const bf = leftH - rightH;
      maxAbsBF = Math.max(maxAbsBF, Math.abs(bf));
      if (Math.abs(bf) > 1) {
        balanceValid = false;
      }
      return expectedH;
    };
    checkBalance(this.root);

    checks.push({
      name: 'Invariante de Balanceamento AVL (|FB| ≤ 1)',
      passed: balanceValid,
      description: balanceValid
        ? `Todos os nós possuem FB ∈ {-1, 0, +1}. Maior |FB| atual = ${maxAbsBF}.`
        : 'Violação de balanceamento: existe nó com |FB| > 1!'
    });

    checks.push({
      name: 'Consistência de Alturas das Subárvores',
      passed: heightConsistent,
      description: heightConsistent
        ? `Alturas recalculadas conferem com os metadados de cada nó (Altura total = ${this.getHeight(this.root)}).`
        : 'Inconsistência encontrada no atributo height de algum nó!'
    });

    return {
      isValid: bstValid && balanceValid && heightConsistent,
      checks
    };
  }

  /**
   * Converte a estrutura interna em uma árvore serializável para o componente visualizador SVG.
   */
  public toVisualNode(node: AVLNode | null = this.root): VisualNode | null {
    if (!node) return null;
    return {
      key: node.key,
      metadata: node.metadata,
      height: node.height,
      balanceFactor: this.getBalanceFactor(node),
      left: this.toVisualNode(node.left),
      right: this.toVisualNode(node.right)
    };
  }

  public clear(): void {
    this.root = null;
    this.metrics = this.createInitialMetrics();
    this.history = [];
  }

  private countNodes(node: AVLNode | null): number {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  private syncMetrics(): void {
    this.metrics.nodeCount = this.countNodes(this.root);
    this.metrics.height = this.getHeight(this.root);
  }

  private recordStep(
    operation: OperationStep['operation'],
    key: number | undefined,
    success: boolean,
    message: string,
    snapshotBefore: VisualNode | null,
    snapshotAfter: VisualNode | null
  ): OperationStep {
    const operationName =
      operation === 'INSERT' ? 'Inserção' : operation === 'REMOVE' ? 'Remoção' : 'Busca';
    const balanceSteps: BalanceStep[] = [
      {
        kind: 'operation',
        title: 'Estado inicial',
        description: `${operationName} de #${key}: estado da árvore antes da operação.`,
        snapshot: snapshotBefore
      },
      ...this.opBalanceSteps,
      { kind: 'result', title: 'Resultado', description: message, snapshot: snapshotAfter }
    ];
    const step: OperationStep = {
      id: `avl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      operation,
      key,
      success,
      message,
      details: [...this.opDetails],
      rotationsInOp: this.opRotations,
      recolorsInOp: 0,
      comparisonsInOp: this.opComparisons,
      visitedPath: [...this.opVisitedPath],
      balanceSteps,
      snapshotBefore,
      snapshotAfter
    };
    this.history.unshift(step);
    return step;
  }
}
