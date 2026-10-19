export type TreeType = 'AVL' | 'RB';

export type NodeColor = 'RED' | 'BLACK';

export interface PackageMetadata {
  id: number;
  trackingCode: string;
  destination: string;
  priority: 'Prime Express' | 'Standard' | 'Same-Day';
}

export interface VisualNode {
  key: number;
  metadata?: PackageMetadata;
  height: number;
  balanceFactor?: number; // Específico para AVL: altura(esq) - altura(dir)
  color?: NodeColor;      // Específico para Rubro-Negra: 'RED' | 'BLACK'
  blackHeight?: number;   // Específico para Rubro-Negra
  left: VisualNode | null;
  right: VisualNode | null;
}

export type BalanceStepKind = 'operation' | 'case' | 'rotation' | 'recolor' | 'result';

export interface BalanceStep {
  kind: BalanceStepKind;
  title: string;
  description: string;
  snapshot: VisualNode | null;
  focusKeys?: number[];
}

export interface OperationStep {
  id: string;
  timestamp: string;
  operation: 'INSERT' | 'REMOVE' | 'SEARCH' | 'RESET' | 'SCENARIO';
  key?: number;
  success: boolean;
  message: string;
  details: string[];
  rotationsInOp: number;
  recolorsInOp: number;
  comparisonsInOp: number;
  visitedPath: number[];
  balanceSteps: BalanceStep[];
  snapshotBefore: VisualNode | null;
  snapshotAfter: VisualNode | null;
}

export interface TreeMetrics {
  nodeCount: number;
  height: number;
  blackHeight?: number;
  totalRotations: number;
  leftRotations: number;
  rightRotations: number;
  doubleRotations: number; // Contabilizado na AVL quando ocorre LR ou RL
  recolorings: number;     // Contabilizado na Rubro-Negra
  totalComparisons: number;
  successfulInserts: number;
  duplicateAttempts: number;
  successfulRemovals: number;
  missingRemovals: number;
  successfulSearches: number;
  missingSearches: number;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  description: string;
}

export interface ValidationReport {
  isValid: boolean;
  checks: ValidationCheck[];
}
