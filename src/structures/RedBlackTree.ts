import {
  BalanceStep,
  NodeColor,
  OperationStep,
  PackageMetadata,
  TreeMetrics,
  ValidationCheck,
  ValidationReport,
  VisualNode
} from '../types/tree';
import { generatePackageMetadata } from '../utils/packageGenerator';

/**
 * Nó da Árvore Rubro-Negra.
 * Utiliza ponteiro para o pai (`parent`) conforme Cormen et al. (CLRS)
 * para realizar rotações e ajustes de cores (`insertFixup` / `deleteFixup`) em O(log n).
 */
export class RBNode {
  key: number;
  metadata: PackageMetadata;
  color: NodeColor;
  left: RBNode;
  right: RBNode;
  parent: RBNode;

  constructor(
    key: number,
    color: NodeColor,
    nilNode?: RBNode,
    metadata?: PackageMetadata
  ) {
    this.key = key;
    this.metadata = metadata ?? generatePackageMetadata(key);
    this.color = color;
    this.left = nilNode ?? this;
    this.right = nilNode ?? this;
    this.parent = nilNode ?? this;
  }
}

/**
 * Implementação completa e manual da Árvore Rubro-Negra (Red-Black Tree)
 * baseada em Cormen, Leiserson, Rivest e Stein (Introduction to Algorithms - CLRS).
 * Não utiliza nenhuma biblioteca pronta de balanceamento.
 *
 * As 5 Propriedades Invariantes da Árvore Rubro-Negra:
 * 1. Todo nó é VERMELHO (RED) ou PRETO (BLACK).
 * 2. A raiz é sempre PRETA (BLACK).
 * 3. Toda folha sentinela (NIL) é PRETA (BLACK).
 * 4. Se um nó é VERMELHO, então ambos os seus filhos são PRETOS (não há dois nós vermelhos consecutivos).
 * 5. Para cada nó, todos os caminhos simples dele até folhas descendentes contêm o mesmo número de nós pretos (Black-Height).
 */
export class RedBlackTree {
  readonly NIL: RBNode;
  root: RBNode;
  metrics: TreeMetrics;
  history: OperationStep[] = [];

  private opRotations = 0;
  private opRecolors = 0;
  private opComparisons = 0;
  private opDetails: string[] = [];
  private opVisitedPath: number[] = [];
  private opBalanceSteps: BalanceStep[] = [];

  constructor() {
    this.NIL = new RBNode(0, 'BLACK');
    this.NIL.left = this.NIL;
    this.NIL.right = this.NIL;
    this.NIL.parent = this.NIL;
    this.root = this.NIL;
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): TreeMetrics {
    return {
      nodeCount: 0,
      height: 0,
      blackHeight: 0,
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
    this.opRecolors = 0;
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

  private setColor(node: RBNode, newColor: NodeColor, reason?: string): void {
    if (node === this.NIL) return;
    if (node.color !== newColor) {
      const oldColor = node.color;
      node.color = newColor;
      this.opRecolors++;
      this.metrics.recolorings++;
      if (reason) {
        this.opDetails.push(reason);
      }
      this.addBalanceStep(
        'recolor',
        `Recolorir nó #${node.key}`,
        reason ?? `A cor do nó #${node.key} mudou de ${oldColor === 'RED' ? 'vermelho' : 'preto'} para ${newColor === 'RED' ? 'vermelho' : 'preto'}.`,
        this.toVisualNode(this.root),
        [node.key]
      );
    }
  }

  /**
   * Rotação à Esquerda em torno do nó x.
   */
  private rotateLeft(x: RBNode): void {
    const y = x.right;
    x.right = y.left;

    if (y.left !== this.NIL) {
      y.left.parent = x;
    }

    y.parent = x.parent;

    if (x.parent === this.NIL) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;

    this.opRotations++;
    this.metrics.totalRotations++;
    this.metrics.leftRotations++;
    this.opDetails.push(
      `Rotação à Esquerda no nó #${x.key} → #${y.key} subiu na subárvore.`
    );
    this.addBalanceStep('rotation', 'Rotação à esquerda', `O nó #${y.key} sobe; o nó #${x.key} desce para a esquerda.`, this.toVisualNode(this.root), [x.key, y.key]);
  }

  /**
   * Rotação à Direita em torno do nó y.
   */
  private rotateRight(y: RBNode): void {
    const x = y.left;
    y.left = x.right;

    if (x.right !== this.NIL) {
      x.right.parent = y;
    }

    x.parent = y.parent;

    if (y.parent === this.NIL) {
      this.root = x;
    } else if (y === y.parent.right) {
      y.parent.right = x;
    } else {
      y.parent.left = x;
    }

    x.right = y;
    y.parent = x;

    this.opRotations++;
    this.metrics.totalRotations++;
    this.metrics.rightRotations++;
    this.opDetails.push(
      `Rotação à Direita no nó #${y.key} → #${x.key} subiu na subárvore.`
    );
    this.addBalanceStep('rotation', 'Rotação à direita', `O nó #${x.key} sobe; o nó #${y.key} desce para a direita.`, this.toVisualNode(this.root), [x.key, y.key]);
  }

  /**
   * Insere um novo pacote na Árvore Rubro-Negra.
   * Novos nós são sempre inseridos inicialmente com a cor VERMELHA (RED) para não violar a Altura Negra (Propriedade 5),
   * seguido de `insertFixup` para corrigir eventuais conflitos Vermelho-Vermelho (Propriedade 4) ou Raiz Vermelha (Propriedade 2).
   */
  public insert(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshotBefore = this.toVisualNode(this.root);

    let y = this.NIL;
    let x = this.root;

    while (x !== this.NIL) {
      y = x;
      this.opVisitedPath.push(x.key);
      this.opComparisons++;
      this.metrics.totalComparisons++;

      if (key === x.key) {
        this.metrics.duplicateAttempts++;
        this.opDetails.push(
          `Chave #${key} já existe na árvore Rubro-Negra. Inserção ignorada conforme regra de unicidade de pacotes.`
        );
        return this.recordStep(
          'INSERT',
          key,
          false,
          `Inserção rejeitada: Encomenda #${key} já está registrada.`,
          snapshotBefore,
          snapshotBefore
        );
      }

      x = key < x.key ? x.left : x.right;
    }

    const z = new RBNode(key, 'RED', this.NIL);
    z.parent = y;

    if (y === this.NIL) {
      this.root = z;
      this.opDetails.push(`Nó #${key} inserido como raiz inicial (inicialmente VERMELHO).`);
    } else if (z.key < y.key) {
      y.left = z;
      this.opDetails.push(`Nó #${key} inserido como filho esquerdo de #${y.key} com cor VERMELHA.`);
    } else {
      y.right = z;
      this.opDetails.push(`Nó #${key} inserido como filho direito de #${y.key} com cor VERMELHA.`);
    }

    this.addBalanceStep(
      'operation',
      'Nó inserido em vermelho',
      `A chave #${key} foi adicionada como folha vermelha antes da verificação de balanceamento.`
    );
    this.opVisitedPath.push(key);
    this.insertFixup(z);

    this.syncMetrics();
    const snapshotAfter = this.toVisualNode(this.root);
    this.metrics.successfulInserts++;

    return this.recordStep(
      'INSERT',
      key,
      true,
      `Encomenda #${key} inserida (${this.opRotations} rotação(ões), ${this.opRecolors} recoloração(ões)).`,
      snapshotBefore,
      snapshotAfter
    );
  }

  /**
   * Restaura as propriedades Rubro-Negras após a inserção de um nó VERMELHO.
   */
  private insertFixup(z: RBNode): void {
    while (z.parent.color === 'RED') {
      if (z.parent === z.parent.parent.left) {
        const uncle = z.parent.parent.right;

        // Caso 1: O tio de z é VERMELHO -> Recoloração de Pai, Tio e Avô
        if (uncle.color === 'RED') {
          this.opDetails.push(
            `Conflito Rubro-Rubro (#${z.parent.key} e #${z.key}): Caso 1 (Tio #${uncle.key} é VERMELHO) → Recolorindo pai e tio para PRETO e avô #${z.parent.parent.key} para VERMELHO.`
          );
          this.addBalanceStep('case', 'Caso 1 de inserção: tio vermelho', `Pai #${z.parent.key} e tio #${uncle.key} ficam pretos; avô #${z.parent.parent.key} fica vermelho.`, this.toVisualNode(this.root), [z.key, z.parent.key, uncle.key, z.parent.parent.key]);
          this.setColor(z.parent, 'BLACK');
          this.setColor(uncle, 'BLACK');
          this.setColor(z.parent.parent, 'RED');
          z = z.parent.parent;
        } else {
          // Caso 2: O tio é PRETO e z é filho direito (formato Triângulo LR)
          if (z === z.parent.right) {
            this.opDetails.push(
              `Caso 2 (Tio PRETO e #${z.key} forma triângulo à direita de #${z.parent.key}) → Rotação à Esquerda no pai.`
            );
            this.addBalanceStep(
              'case',
              'Caso 2 de inserção: triângulo',
              `Há conflito rubro-rubro; o tio é preto e #${z.key} forma um triângulo. Rotacionar o pai à esquerda para formar uma linha.`,
              this.toVisualNode(this.root),
              [z.key, z.parent.key, z.parent.parent.key]
            );
            z = z.parent;
            this.rotateLeft(z);
          }
          // Caso 3: O tio é PRETO e z é filho esquerdo (formato Linha LL)
          this.opDetails.push(
            `Caso 3 (Tio PRETO em linha) → Recolore pai #${z.parent.key} para PRETO, avô #${z.parent.parent.key} para VERMELHO e rotaciona o avô à Direita.`
          );
          this.addBalanceStep(
            'case',
            'Caso 3 de inserção: linha',
            `Há conflito rubro-rubro; o tio é preto e #${z.key}, seu pai e o avô formam uma linha. Recolorir pai e avô e rotacionar o avô.`,
            this.toVisualNode(this.root),
            [z.key, z.parent.key, z.parent.parent.key]
          );
          this.setColor(z.parent, 'BLACK');
          this.setColor(z.parent.parent, 'RED');
          this.rotateRight(z.parent.parent);
        }
      } else {
        // Simétrico: Pai de z é filho direito do avô
        const uncle = z.parent.parent.left;

        // Caso 1 Simétrico: Tio é VERMELHO
        if (uncle.color === 'RED') {
          this.opDetails.push(
            `Conflito Rubro-Rubro (#${z.parent.key} e #${z.key}): Caso 1 (Tio #${uncle.key} é VERMELHO) → Recolorindo pai e tio para PRETO e avô #${z.parent.parent.key} para VERMELHO.`
          );
          this.addBalanceStep('case', 'Caso 1 de inserção: tio vermelho', `Pai #${z.parent.key} e tio #${uncle.key} ficam pretos; avô #${z.parent.parent.key} fica vermelho.`, this.toVisualNode(this.root), [z.key, z.parent.key, uncle.key, z.parent.parent.key]);
          this.setColor(z.parent, 'BLACK');
          this.setColor(uncle, 'BLACK');
          this.setColor(z.parent.parent, 'RED');
          z = z.parent.parent;
        } else {
          // Caso 2 Simétrico: Tio é PRETO e z é filho esquerdo (formato Triângulo RL)
          if (z === z.parent.left) {
            this.opDetails.push(
              `Caso 2 (Tio PRETO e #${z.key} forma triângulo à esquerda de #${z.parent.key}) → Rotação à Direita no pai.`
            );
            this.addBalanceStep(
              'case',
              'Caso 2 de inserção: triângulo',
              `Há conflito rubro-rubro; o tio é preto e #${z.key} forma um triângulo. Rotacionar o pai à direita para formar uma linha.`,
              this.toVisualNode(this.root),
              [z.key, z.parent.key, z.parent.parent.key]
            );
            z = z.parent;
            this.rotateRight(z);
          }
          // Caso 3 Simétrico: Tio é PRETO e z é filho direito (formato Linha RR)
          this.opDetails.push(
            `Caso 3 (Tio PRETO em linha) → Recolore pai #${z.parent.key} para PRETO, avô #${z.parent.parent.key} para VERMELHO e rotaciona o avô à Esquerda.`
          );
          this.addBalanceStep(
            'case',
            'Caso 3 de inserção: linha',
            `Há conflito rubro-rubro; o tio é preto e #${z.key}, seu pai e o avô formam uma linha. Recolorir pai e avô e rotacionar o avô.`,
            this.toVisualNode(this.root),
            [z.key, z.parent.key, z.parent.parent.key]
          );
          this.setColor(z.parent, 'BLACK');
          this.setColor(z.parent.parent, 'RED');
          this.rotateLeft(z.parent.parent);
        }
      }
    }

    if (this.root.color === 'RED') {
      this.setColor(
        this.root,
        'BLACK',
        `Propriedade 2 garantida: Raiz #${this.root.key} definida como PRETA.`
      );
    }
  }

  /**
   * Substitui a subárvore enraizada em u pela subárvore enraizada em v.
   */
  private transplant(u: RBNode, v: RBNode): void {
    if (u.parent === this.NIL) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    v.parent = u.parent;
  }

  private minimum(node: RBNode): RBNode {
    let current = node;
    while (current.left !== this.NIL) {
      current = current.left;
    }
    return current;
  }

  /**
   * Remove uma encomenda da Árvore Rubro-Negra preservando todas as 5 propriedades.
   */
  public remove(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshotBefore = this.toVisualNode(this.root);

    if (this.root === this.NIL) {
      this.metrics.missingRemovals++;
      this.opDetails.push('Tentativa de remoção em árvore Rubro-Negra vazia.');
      return this.recordStep(
        'REMOVE',
        key,
        false,
        `Remoção falhou: A árvore Rubro-Negra está vazia.`,
        snapshotBefore,
        snapshotBefore
      );
    }

    // Localiza o nó z a ser removido
    let z = this.root;
    while (z !== this.NIL) {
      this.opVisitedPath.push(z.key);
      this.opComparisons++;
      this.metrics.totalComparisons++;

      if (key === z.key) {
        break;
      }
      z = key < z.key ? z.left : z.right;
    }

    if (z === this.NIL) {
      this.metrics.missingRemovals++;
      this.opDetails.push(`Encomenda #${key} não encontrada para remoção.`);
      return this.recordStep(
        'REMOVE',
        key,
        false,
        `Remoção não realizada: Encomenda #${key} inexistente no sistema.`,
        snapshotBefore,
        snapshotBefore
      );
    }

    let y = z;
    let yOriginalColor = y.color;
    let x: RBNode;

    if (z.left === this.NIL) {
      x = z.right;
      this.opDetails.push(
        z.right === this.NIL
          ? `Nó #${z.key} (${z.color}) era folha e foi removido.`
          : `Nó #${z.key} (${z.color}) possuía apenas filho direito (#${z.right.key}).`
      );
      this.transplant(z, z.right);
    } else if (z.right === this.NIL) {
      x = z.left;
      this.opDetails.push(
        `Nó #${z.key} (${z.color}) possuía apenas filho esquerdo (#${z.left.key}).`
      );
      this.transplant(z, z.left);
    } else {
      y = this.minimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      this.opDetails.push(
        `Nó #${z.key} possuía 2 filhos. Sucessor em-ordem #${y.key} (cor original ${yOriginalColor}) assumiu seu lugar.`
      );

      if (y.parent === z) {
        x.parent = y;
      } else {
        this.transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }

      this.transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      if (y.color !== z.color) {
        this.setColor(
          y,
          z.color,
          `Sucessor #${y.key} herdou a cor ${z.color} do nó removido #${z.key}.`
        );
      }
    }

    this.addBalanceStep('operation', 'Nó removido', `A estrutura foi atualizada para remover #${key}; agora verificaremos se a altura negra precisa de ajuste.`);

    if (yOriginalColor === 'BLACK') {
      this.opDetails.push(
        `Como um nó PRETO foi removido/movido, executando deleteFixup para restaurar a Altura Negra.`
      );
      this.deleteFixup(x);
    }

    this.syncMetrics();
    const snapshotAfter = this.toVisualNode(this.root);
    this.metrics.successfulRemovals++;

    return this.recordStep(
      'REMOVE',
      key,
      true,
      `Encomenda #${key} removida com sucesso (${this.opRotations} rotação(ões), ${this.opRecolors} recoloração(ões)).`,
      snapshotBefore,
      snapshotAfter
    );
  }

  /**
   * Restaura as propriedades Rubro-Negras quando a remoção de um nó PRETO altera a Altura Negra.
   */
  private deleteFixup(x: RBNode): void {
    while (x !== this.root && x.color === 'BLACK') {
      if (x === x.parent.left) {
        let w = x.parent.right;

        // Caso 1: Irmão w de x é VERMELHO
        if (w.color === 'RED') {
          this.addBalanceStep('case', 'Caso 1 de remoção', `O irmão #${w.key} é vermelho. Recolorir e rotacionar o pai à esquerda.`);
          this.opDetails.push(
            `DeleteFixup Caso 1: Irmão #${w.key} é VERMELHO → Recolore irmão para PRETO, pai #${x.parent.key} para VERMELHO e rotaciona pai à Esquerda.`
          );
          this.setColor(w, 'BLACK');
          this.setColor(x.parent, 'RED');
          this.rotateLeft(x.parent);
          w = x.parent.right;
        }

        // Caso 2: Irmão w é PRETO e ambos os filhos de w são PRETOS
        if (w.left.color === 'BLACK' && w.right.color === 'BLACK') {
          this.addBalanceStep('case', 'Caso 2 de remoção', `O irmão #${w.key} e seus dois filhos são pretos. Recolorir o irmão e subir o ajuste ao pai.`);
          this.setColor(
            w,
            'RED',
            `DeleteFixup Caso 2: Irmão #${w.key} tem ambos os filhos PRETOS → Irmão recolorido para VERMELHO.`
          );
          x = x.parent;
        } else {
          // Caso 3: Irmão w é PRETO, filho esquerdo de w é VERMELHO e filho direito é PRETO
          if (w.right.color === 'BLACK') {
            this.addBalanceStep('case', 'Caso 3 de remoção', `O sobrinho próximo #${w.left.key} é vermelho e o distante é preto. Rotacionar o irmão à direita.`);
            this.opDetails.push(
              `DeleteFixup Caso 3: Sobrinho próximo #${w.left.key} é VERMELHO → Recolore e rotaciona irmão #${w.key} à Direita.`
            );
            this.setColor(w.left, 'BLACK');
            this.setColor(w, 'RED');
            this.rotateRight(w);
            w = x.parent.right;
          }

          // Caso 4: Irmão w é PRETO e filho direito de w é VERMELHO
          this.opDetails.push(
            `DeleteFixup Caso 4: Sobrinho distante #${w.right.key} é VERMELHO → Ajusta cores e rotaciona pai #${x.parent.key} à Esquerda.`
          );
          this.addBalanceStep('case', 'Caso 4 de remoção', `O sobrinho distante #${w.right.key} é vermelho. Ajustar as cores e rotacionar o pai à esquerda.`);
          this.setColor(w, x.parent.color);
          this.setColor(x.parent, 'BLACK');
          this.setColor(w.right, 'BLACK');
          this.rotateLeft(x.parent);
          x = this.root;
        }
      } else {
        // Simétrico: x é filho direito
        let w = x.parent.left;

        // Caso 1 Simétrico
        if (w.color === 'RED') {
          this.addBalanceStep('case', 'Caso 1 de remoção (simétrico)', `O irmão #${w.key} é vermelho. Recolorir e rotacionar o pai à direita.`);
          this.opDetails.push(
            `DeleteFixup Caso 1: Irmão #${w.key} é VERMELHO → Recolore irmão para PRETO, pai #${x.parent.key} para VERMELHO e rotaciona pai à Direita.`
          );
          this.setColor(w, 'BLACK');
          this.setColor(x.parent, 'RED');
          this.rotateRight(x.parent);
          w = x.parent.left;
        }

        // Caso 2 Simétrico
        if (w.right.color === 'BLACK' && w.left.color === 'BLACK') {
          this.addBalanceStep('case', 'Caso 2 de remoção (simétrico)', `O irmão #${w.key} e seus dois filhos são pretos. Recolorir o irmão e subir o ajuste ao pai.`);
          this.setColor(
            w,
            'RED',
            `DeleteFixup Caso 2: Irmão #${w.key} tem ambos os filhos PRETOS → Irmão recolorido para VERMELHO.`
          );
          x = x.parent;
        } else {
          // Caso 3 Simétrico
          if (w.left.color === 'BLACK') {
            this.addBalanceStep('case', 'Caso 3 de remoção (simétrico)', `O sobrinho próximo #${w.right.key} é vermelho e o distante é preto. Rotacionar o irmão à esquerda.`);
            this.opDetails.push(
              `DeleteFixup Caso 3: Sobrinho próximo #${w.right.key} é VERMELHO → Recolore e rotaciona irmão #${w.key} à Esquerda.`
            );
            this.setColor(w.right, 'BLACK');
            this.setColor(w, 'RED');
            this.rotateLeft(w);
            w = x.parent.left;
          }

          // Caso 4 Simétrico
          this.opDetails.push(
            `DeleteFixup Caso 4: Sobrinho distante #${w.left.key} é VERMELHO → Ajusta cores e rotaciona pai #${x.parent.key} à Direita.`
          );
          this.addBalanceStep('case', 'Caso 4 de remoção (simétrico)', `O sobrinho distante #${w.left.key} é vermelho. Ajustar as cores e rotacionar o pai à direita.`);
          this.setColor(w, x.parent.color);
          this.setColor(x.parent, 'BLACK');
          this.setColor(w.left, 'BLACK');
          this.rotateRight(x.parent);
          x = this.root;
        }
      }
    }

    if (x !== this.NIL && x.color !== 'BLACK') {
      this.setColor(x, 'BLACK', `Nó #${x.key} colorido de PRETO para encerrar o ajuste.`);
    }
  }

  /**
   * Busca um pacote pelo seu identificador na Árvore Rubro-Negra.
   */
  public search(key: number): OperationStep {
    this.resetOpTrackers();
    const snapshot = this.toVisualNode(this.root);

    let current = this.root;
    let depth = 0;

    while (current !== this.NIL) {
      this.opVisitedPath.push(current.key);
      this.opComparisons++;
      this.metrics.totalComparisons++;

      if (key === current.key) {
        this.metrics.successfulSearches++;
        this.opDetails.push(
          `Encomenda #${key} (${current.metadata.trackingCode}) localizada no nível ${depth} (cor: ${current.color}) após ${this.opComparisons} comparação(ões).`,
          `Caminho percorrido: ${this.opVisitedPath.map((k) => `#${k}`).join(' → ')}`
        );
        return this.recordStep(
          'SEARCH',
          key,
          true,
          `Encomenda #${key} encontrada em ${this.opComparisons} comparação(ões)! Cor do nó: ${current.color}.`,
          snapshot,
          snapshot
        );
      }

      current = key < current.key ? current.left : current.right;
      depth++;
    }

    this.metrics.missingSearches++;
    this.opDetails.push(
      `Busca atingiu folha sentinela NIL após ${this.opComparisons} comparação(ões).`,
      this.opVisitedPath.length > 0
        ? `Caminho percorrido: ${this.opVisitedPath.map((k) => `#${k}`).join(' → ')} → NIL`
        : 'Árvore Rubro-Negra vazia.'
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
   * Percurso Em-Ordem (In-Order): retorna todas as encomendas em ordem estritamente crescente.
   */
  public inOrder(): PackageMetadata[] {
    const result: PackageMetadata[] = [];
    const traverse = (node: RBNode) => {
      if (node === this.NIL) return;
      traverse(node.left);
      result.push(node.metadata);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }

  /**
   * Calcula a altura total da árvore (maior caminho da raiz até uma folha real).
   */
  public getHeight(node: RBNode = this.root): number {
    if (node === this.NIL) return 0;
    return 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  /**
   * Calcula a Altura Negra (Black-Height) a partir de um nó (contando nós pretos no caminho até as folhas).
   */
  public getBlackHeight(node: RBNode = this.root): number {
    if (node === this.NIL) return 0;
    const leftBH = this.getBlackHeight(node.left);
    return leftBH + (node.color === 'BLACK' ? 1 : 0);
  }

  /**
   * Valida todas as propriedades da Árvore Rubro-Negra:
   * 1. Propriedade BST (ordenação binária).
   * 2. Propriedade da Raiz Preta.
   * 3. Ausência de nós vermelhos adjacentes (Pai VERMELHO não pode ter Filho VERMELHO).
   * 4. Igualdade da Altura Negra (Black-Height) em todos os caminhos da raiz até NIL.
   */
  public validate(): ValidationReport {
    const checks: ValidationCheck[] = [];

    // 1. Propriedade BST
    let bstValid = true;
    const checkBST = (node: RBNode, min: number, max: number) => {
      if (node === this.NIL) return;
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
        ? 'Chaves seguem estritamente a ordenação esquerda < pai < direita.'
        : 'Violação na ordenação de chaves detectada!'
    });

    // 2. Raiz Preta
    const rootBlack = this.root === this.NIL || this.root.color === 'BLACK';
    checks.push({
      name: 'Propriedade 2: Raiz é Sempre Preta',
      passed: rootBlack,
      description:
        this.root === this.NIL
          ? 'Árvore vazia (raiz aponta para sentinela NIL preta).'
          : `Raiz atual (#${this.root.key}) possui cor ${this.root.color}.`
    });

    // 3. Sem dois nós Vermelhos consecutivos
    let noRedRed = true;
    const checkRedProperty = (node: RBNode) => {
      if (node === this.NIL) return;
      if (node.color === 'RED') {
        if (node.left.color === 'RED' || node.right.color === 'RED') {
          noRedRed = false;
        }
      }
      checkRedProperty(node.left);
      checkRedProperty(node.right);
    };
    checkRedProperty(this.root);
    checks.push({
      name: 'Propriedade 4: Sem Nós Vermelhos Consecutivos',
      passed: noRedRed,
      description: noRedRed
        ? 'Nenhum nó VERMELHO possui filho VERMELHO.'
        : 'Violação Rubro-Rubro encontrada!'
    });

    // 4. Mesma Altura Negra em todos os caminhos
    let blackHeightValid = true;
    const checkBlackHeight = (node: RBNode): number => {
      if (node === this.NIL) return 1; // Contando sentinela NIL
      const leftBH = checkBlackHeight(node.left);
      const rightBH = checkBlackHeight(node.right);
      if (leftBH !== rightBH) {
        blackHeightValid = false;
      }
      return leftBH + (node.color === 'BLACK' ? 1 : 0);
    };
    checkBlackHeight(this.root);
    const bh = this.getBlackHeight(this.root);

    checks.push({
      name: 'Propriedade 5: Altura Negra Uniforme (Black-Height)',
      passed: blackHeightValid,
      description: blackHeightValid
        ? `Todos os caminhos da raiz às folhas possuem a mesma quantidade de nós pretos (BH = ${bh}).`
        : 'Caminhos com diferentes quantidades de nós pretos detectados!'
    });

    return {
      isValid: bstValid && rootBlack && noRedRed && blackHeightValid,
      checks
    };
  }

  /**
   * Converte a árvore Rubro-Negra em estrutura serializável para o visualizador SVG.
   */
  public toVisualNode(node: RBNode = this.root): VisualNode | null {
    if (node === this.NIL) return null;
    return {
      key: node.key,
      metadata: node.metadata,
      height: this.getHeight(node),
      color: node.color,
      blackHeight: this.getBlackHeight(node),
      left: this.toVisualNode(node.left),
      right: this.toVisualNode(node.right)
    };
  }

  public clear(): void {
    this.root = this.NIL;
    this.metrics = this.createInitialMetrics();
    this.history = [];
  }

  private countNodes(node: RBNode): number {
    if (node === this.NIL) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  private syncMetrics(): void {
    this.metrics.nodeCount = this.countNodes(this.root);
    this.metrics.height = this.getHeight(this.root);
    this.metrics.blackHeight = this.getBlackHeight(this.root);
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
      id: `rb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      operation,
      key,
      success,
      message,
      details: [...this.opDetails],
      rotationsInOp: this.opRotations,
      recolorsInOp: this.opRecolors,
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
