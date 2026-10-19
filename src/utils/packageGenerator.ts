import { PackageMetadata } from '../types/tree';

const HUBS = [
  'GRU-SP (Cajamar)',
  'GIG-RJ (São João de Meriti)',
  'CNF-MG (Betim)',
  'VCP-SP (Campinas)',
  'REC-PE (Cabo de Santo Agostinho)',
  'POA-RS (Nova Santa Rita)',
  'BSB-DF (Santa Maria)',
  'CWB-PR ( Araucária)'
];

const PRIORITIES: PackageMetadata['priority'][] = [
  'Prime Express',
  'Same-Day',
  'Standard'
];

export function generatePackageMetadata(id: number): PackageMetadata {
  const absId = Math.abs(id);
  const hubIndex = absId % HUBS.length;
  const priorityIndex = absId % PRIORITIES.length;
  const prefix = absId % 2 === 0 ? 'AMZ-BF' : 'TBA-BR';
  const padded = String(absId).padStart(5, '0');

  return {
    id,
    trackingCode: `${prefix}-${padded}`,
    destination: HUBS[hubIndex],
    priority: PRIORITIES[priorityIndex]
  };
}
