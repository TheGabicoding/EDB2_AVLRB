## 1. Cenários Obrigatórios do Enunciado do Trabalho (IMD0039 - UFRN)

| cenario | requisitoPDF | nosFinais | alturaAVL | alturaRB | alturaNegraRB | rotacoesAVL | rotacoesRB | recoloracoesRB | comparacoesAVL | comparacoesRB | duplicatasTratadas | invariantesPreservadas | percursoEmOrdemCoincide |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Inserção em Ordem Crescente (10 a 150) | Inserção sequencial crescente (Pior caso de BST) | 15 | 4 | 6 | 3 | 11 | 9 | 45 | 45 | 53 | 0 | true | true |
| 2. Inserção em Ordem Decrescente (150 a 10) | Inserção sequencial decrescente (Rotações à direita) | 15 | 4 | 6 | 3 | 11 | 9 | 45 | 45 | 53 | 0 | true | true |
| 3. Carga Não Ordenada + Duplicatas + Buscas | Carga não ordenada + Duplicatas + Buscas (existente e inexistente) | 10 | 4 | 4 | 2 | 4 | 0 | 11 | 30 | 29 | 1 | true | true |
| 4. Remoções: 0, 1 e 2 Filhos + Inexistente | Remoções com 0, 1 e 2 filhos + Remoção de inexistente | 6 | 3 | 3 | 2 | 3 | 3 | 21 | 35 | 31 | 0 | true | true |
| 5. Casos Limite: Árvore Vazia e Único Elemento | Casos limite: Árvore vazia, 1 elemento e reinserção | 3 | 2 | 2 | 1 | 0 | 0 | 2 | 6 | 6 | 1 | true | true |
| 6. Stress Test Black Friday (31 Operações Mistas) | Stress Test Black Friday (31 operações mistas) | 18 | 5 | 6 | 3 | 10 | 9 | 45 | 105 | 106 | 0 | true | true |

## 2. Experimento 1 — Inserção por Padrão de Chegada (N = 100, 500, 1000)

| carga | n | estrutura | alturaFinal | alturaIdeal | rotacoesPorInsercao | recoloracoesPorInsercao | comparacoesPorInsercao | maxRotacoesEmUmaOp | maxRecoloracoesEmUmaOp | invarianteOk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crescente (esteira sequencial) | 100 | AVL | 7 | 7 | 0.93 | 0 | 5.73 | 1 | 0 | true |
| Crescente (esteira sequencial) | 100 | RB | 11 | 7 | 0.89 | 4.45 | 8.09 | 1 | 16 | true |
| Crescente (esteira sequencial) | 500 | AVL | 9 | 9 | 0.982 | 0 | 7.98 | 1 | 0 | true |
| Crescente (esteira sequencial) | 500 | RB | 15 | 9 | 0.97 | 4.836 | 12.51 | 1 | 22 | true |
| Crescente (esteira sequencial) | 1000 | AVL | 10 | 10 | 0.99 | 0 | 8.98 | 1 | 0 | true |
| Crescente (esteira sequencial) | 1000 | RB | 17 | 10 | 0.983 | 4.909 | 14.48 | 1 | 25 | true |
| Decrescente (descarga LIFO) | 100 | AVL | 7 | 7 | 0.93 | 0 | 5.73 | 1 | 0 | true |
| Decrescente (descarga LIFO) | 100 | RB | 11 | 7 | 0.89 | 4.45 | 8.09 | 1 | 16 | true |
| Decrescente (descarga LIFO) | 500 | AVL | 9 | 9 | 0.982 | 0 | 7.98 | 1 | 0 | true |
| Decrescente (descarga LIFO) | 500 | RB | 15 | 9 | 0.97 | 4.836 | 12.51 | 1 | 22 | true |
| Decrescente (descarga LIFO) | 1000 | AVL | 10 | 10 | 0.99 | 0 | 8.98 | 1 | 0 | true |
| Decrescente (descarga LIFO) | 1000 | RB | 17 | 10 | 0.983 | 4.909 | 14.48 | 1 | 25 | true |
| Zigue-zague (extremos alternados) | 100 | AVL | 8 | 7 | 1.49 | 0 | 6.4 | 2 | 0 | true |
| Zigue-zague (extremos alternados) | 100 | RB | 11 | 7 | 1.35 | 4.45 | 8.09 | 2 | 16 | true |
| Zigue-zague (extremos alternados) | 500 | AVL | 11 | 9 | 1.588 | 0 | 9.29 | 2 | 0 | true |
| Zigue-zague (extremos alternados) | 500 | RB | 15 | 9 | 1.458 | 4.836 | 12.51 | 2 | 22 | true |
| Zigue-zague (extremos alternados) | 1000 | AVL | 12 | 10 | 1.605 | 0 | 10.51 | 2 | 0 | true |
| Zigue-zague (extremos alternados) | 1000 | RB | 17 | 10 | 1.477 | 4.909 | 14.48 | 2 | 25 | true |
| Rajadas ordenadas (lotes de CDs) | 100 | AVL | 7 | 7 | 0.93 | 0 | 5.73 | 1 | 0 | true |
| Rajadas ordenadas (lotes de CDs) | 100 | RB | 11 | 7 | 0.89 | 4.45 | 8.09 | 1 | 16 | true |
| Rajadas ordenadas (lotes de CDs) | 500 | AVL | 10 | 9 | 1.119 | 0 | 8.32 | 2 | 0 | true |
| Rajadas ordenadas (lotes de CDs) | 500 | RB | 14 | 9 | 1.587 | 4.535 | 11.03 | 2 | 19 | true |
| Rajadas ordenadas (lotes de CDs) | 1000 | AVL | 11.3 | 10 | 1.148 | 0 | 9.45 | 2 | 0 | true |
| Rajadas ordenadas (lotes de CDs) | 1000 | RB | 15 | 10 | 1.573 | 4.607 | 12.3 | 2 | 22 | true |
| Aleatória (pedidos simultâneos) | 100 | AVL | 8 | 7 | 0.65 | 0 | 5.4 | 2 | 0 | true |
| Aleatória (pedidos simultâneos) | 100 | RB | 8 | 7 | 0.577 | 2.143 | 5.44 | 2 | 11 | true |
| Aleatória (pedidos simultâneos) | 500 | AVL | 11 | 9 | 0.715 | 0 | 7.72 | 2 | 0 | true |
| Aleatória (pedidos simultâneos) | 500 | RB | 11 | 9 | 0.589 | 2.322 | 7.75 | 2 | 16 | true |
| Aleatória (pedidos simultâneos) | 1000 | AVL | 12 | 10 | 0.71 | 0 | 8.73 | 2 | 0 | true |
| Aleatória (pedidos simultâneos) | 1000 | RB | 12.3 | 10 | 0.593 | 2.327 | 8.8 | 2 | 19 | true |

## 3. Experimento 2 — Custo de Busca Pós-Construção (Existentes e Inexistentes)

| carga | n | estrutura | comparacoesMediasBusca | comparacoesPiorBusca | comparacoesMediasInexistente | comparacoesPiorInexistente | log2n |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Crescente (esteira sequencial) | 100 | AVL | 5.8 | 7 | 7 | 7 | 6.64 |
| Crescente (esteira sequencial) | 100 | RB | 6.2 | 11 | 11 | 11 | 6.64 |
| Crescente (esteira sequencial) | 500 | AVL | 7.96 | 9 | 9 | 9 | 8.97 |
| Crescente (esteira sequencial) | 500 | RB | 8.39 | 15 | 15 | 15 | 8.97 |
| Crescente (esteira sequencial) | 1000 | AVL | 9.02 | 10 | 10 | 10 | 9.97 |
| Crescente (esteira sequencial) | 1000 | RB | 9.47 | 16 | 17 | 17 | 9.97 |
| Decrescente (descarga LIFO) | 100 | AVL | 5.8 | 7 | 7 | 7 | 6.64 |
| Decrescente (descarga LIFO) | 100 | RB | 6.2 | 11 | 6 | 6 | 6.64 |
| Decrescente (descarga LIFO) | 500 | AVL | 7.96 | 9 | 9 | 9 | 8.97 |
| Decrescente (descarga LIFO) | 500 | RB | 8.39 | 15 | 8 | 8 | 8.97 |
| Decrescente (descarga LIFO) | 1000 | AVL | 9.02 | 10 | 10 | 10 | 9.97 |
| Decrescente (descarga LIFO) | 1000 | RB | 9.47 | 16 | 9 | 9 | 9.97 |
| Zigue-zague (extremos alternados) | 100 | AVL | 6.03 | 8 | 8 | 8 | 6.64 |
| Zigue-zague (extremos alternados) | 100 | RB | 6.2 | 11 | 6 | 6 | 6.64 |
| Zigue-zague (extremos alternados) | 500 | AVL | 8.3 | 11 | 11 | 11 | 8.97 |
| Zigue-zague (extremos alternados) | 500 | RB | 8.42 | 15 | 9 | 9 | 8.97 |
| Zigue-zague (extremos alternados) | 1000 | AVL | 9.18 | 12 | 12 | 12 | 9.97 |
| Zigue-zague (extremos alternados) | 1000 | RB | 9.4 | 16 | 10 | 10 | 9.97 |
| Rajadas ordenadas (lotes de CDs) | 100 | AVL | 5.8 | 7 | 7 | 7 | 6.64 |
| Rajadas ordenadas (lotes de CDs) | 100 | RB | 6.2 | 11 | 11 | 11 | 6.64 |
| Rajadas ordenadas (lotes de CDs) | 500 | AVL | 8.14 | 10 | 9.67 | 10 | 8.97 |
| Rajadas ordenadas (lotes de CDs) | 500 | RB | 8.47 | 14 | 12.33 | 13 | 8.97 |
| Rajadas ordenadas (lotes de CDs) | 1000 | AVL | 9.21 | 12 | 10.33 | 11 | 9.97 |
| Rajadas ordenadas (lotes de CDs) | 1000 | RB | 9.57 | 15 | 14.33 | 15 | 9.97 |
| Aleatória (pedidos simultâneos) | 100 | AVL | 5.88 | 8 | 6.67 | 7 | 6.64 |
| Aleatória (pedidos simultâneos) | 100 | RB | 5.91 | 8 | 6.33 | 7 | 6.64 |
| Aleatória (pedidos simultâneos) | 500 | AVL | 8.22 | 11 | 8.33 | 9 | 8.97 |
| Aleatória (pedidos simultâneos) | 500 | RB | 8.23 | 11 | 8.67 | 10 | 8.97 |
| Aleatória (pedidos simultâneos) | 1000 | AVL | 9.25 | 12 | 10.33 | 11 | 9.97 |
| Aleatória (pedidos simultâneos) | 1000 | RB | 9.31 | 12 | 10 | 11 | 9.97 |

## 4. Experimento 3 — Remoção (Expedição FIFO, Cancelamento Aleatório e Metade)

| n | padraoRemocao | cargaInsercaoPrevia | estrutura | rotacoesPorRemocao | recoloracoesPorRemocao | comparacoesPorRemocao | maxRotacoesEmUmaRemocao | maxRecoloracoesEmUmaRemocao | alturaFinalMedia | invarianteOk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 100 | Remover todas em ordem crescente (expedição FIFO) | Crescente | AVL | 0.44 | 0 | 4.49 | 1 | 0 | 0 | true |
| 100 | Remover todas em ordem crescente (expedição FIFO) | Crescente | RB | 0.45 | 2.61 | 4.46 | 1 | 7 | 0 | true |
| 100 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | AVL | 0.623 | 0 | 4.7 | 4 | 0 | 0 | true |
| 100 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | RB | 0.597 | 2.263 | 4.36 | 3 | 8 | 0 | true |
| 100 | Remover todas em ordem aleatória (cancelamentos) | Crescente | AVL | 0.24 | 0 | 5.38 | 4 | 0 | 0 | true |
| 100 | Remover todas em ordem aleatória (cancelamentos) | Crescente | RB | 0.283 | 2.07 | 4.66 | 2 | 7 | 0 | true |
| 100 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | AVL | 0.363 | 0 | 5.31 | 4 | 0 | 0 | true |
| 100 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | RB | 0.343 | 1.83 | 4.55 | 3 | 8 | 0 | true |
| 100 | Remover metade aleatória | Crescente | AVL | 0.113 | 0 | 6.34 | 2 | 0 | 7 | true |
| 100 | Remover metade aleatória | Crescente | RB | 0.267 | 2.327 | 5.49 | 2 | 7 | 7 | true |
| 100 | Remover metade aleatória | Aleatória | AVL | 0.407 | 0 | 6.2 | 4 | 0 | 7 | true |
| 100 | Remover metade aleatória | Aleatória | RB | 0.34 | 1.66 | 5.43 | 3 | 7 | 7.3 | true |
| 500 | Remover todas em ordem crescente (expedição FIFO) | Crescente | AVL | 0.484 | 0 | 6.06 | 1 | 0 | 0 | true |
| 500 | Remover todas em ordem crescente (expedição FIFO) | Crescente | RB | 0.486 | 2.888 | 6.59 | 1 | 9 | 0 | true |
| 500 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | AVL | 0.674 | 0 | 6.63 | 5 | 0 | 0 | true |
| 500 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | RB | 0.663 | 2.417 | 5.95 | 3 | 10 | 0 | true |
| 500 | Remover todas em ordem aleatória (cancelamentos) | Crescente | AVL | 0.259 | 0 | 7.59 | 4 | 0 | 0 | true |
| 500 | Remover todas em ordem aleatória (cancelamentos) | Crescente | RB | 0.262 | 2.209 | 6.67 | 3 | 8 | 0 | true |
| 500 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | AVL | 0.377 | 0 | 7.65 | 4 | 0 | 0 | true |
| 500 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | RB | 0.37 | 1.945 | 6.81 | 3 | 8 | 0 | true |
| 500 | Remover metade aleatória | Crescente | AVL | 0.165 | 0 | 8.56 | 4 | 0 | 9 | true |
| 500 | Remover metade aleatória | Crescente | RB | 0.205 | 2.429 | 7.59 | 3 | 8 | 9.3 | true |
| 500 | Remover metade aleatória | Aleatória | AVL | 0.401 | 0 | 8.61 | 4 | 0 | 9.7 | true |
| 500 | Remover metade aleatória | Aleatória | RB | 0.393 | 1.899 | 7.66 | 3 | 8 | 10.3 | true |
| 1000 | Remover todas em ordem crescente (expedição FIFO) | Crescente | AVL | 0.491 | 0 | 6.81 | 1 | 0 | 0 | true |
| 1000 | Remover todas em ordem crescente (expedição FIFO) | Crescente | RB | 0.492 | 2.937 | 7.58 | 1 | 10 | 0 | true |
| 1000 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | AVL | 0.697 | 0 | 7.51 | 6 | 0 | 0 | true |
| 1000 | Remover todas em ordem crescente (expedição FIFO) | Aleatória | RB | 0.67 | 2.436 | 6.56 | 3 | 11 | 0 | true |
| 1000 | Remover todas em ordem aleatória (cancelamentos) | Crescente | AVL | 0.262 | 0 | 8.57 | 4 | 0 | 0 | true |
| 1000 | Remover todas em ordem aleatória (cancelamentos) | Crescente | RB | 0.283 | 2.257 | 7.67 | 3 | 9 | 0 | true |
| 1000 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | AVL | 0.376 | 0 | 8.65 | 5 | 0 | 0 | true |
| 1000 | Remover todas em ordem aleatória (cancelamentos) | Aleatória | RB | 0.396 | 1.989 | 7.83 | 3 | 8 | 0 | true |
| 1000 | Remover metade aleatória | Crescente | AVL | 0.187 | 0 | 9.54 | 4 | 0 | 10 | true |
| 1000 | Remover metade aleatória | Crescente | RB | 0.217 | 2.438 | 8.61 | 2 | 9 | 11 | true |
| 1000 | Remover metade aleatória | Aleatória | AVL | 0.375 | 0 | 9.65 | 4 | 0 | 11 | true |
| 1000 | Remover metade aleatória | Aleatória | RB | 0.375 | 1.831 | 8.79 | 3 | 8 | 11.3 | true |

## 5. Experimento 4A — Carga Mista Black Friday (IDs Crescentes de Esteira)

| mix | estrutura | comparacoesPorOp | rotacoesPorOp | recoloracoesPorOp | maxRotacoesEmUmaOp | alturaFinalMedia | trabalhoTotalPorOp | invarianteOk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Leitura intensa (80% busca, 15% insere, 5% remove) | AVL | 7.89 | 0.145 | 0 | 2 | 9.3 | 8.03 | true |
| Leitura intensa (80% busca, 15% insere, 5% remove) | RB | 8.6 | 0.152 | 0.837 | 2 | 13.7 | 8.92 | true |
| Balanceada (50% busca, 30% insere, 20% remove) | AVL | 8.5 | 0.336 | 0 | 4 | 10 | 8.83 | true |
| Balanceada (50% busca, 30% insere, 20% remove) | RB | 9.3 | 0.352 | 1.895 | 2 | 13.3 | 10.03 | true |
| Escrita intensa (20% busca, 50% insere, 30% remove) | AVL | 9.12 | 0.542 | 0 | 4 | 10.7 | 9.66 | true |
| Escrita intensa (20% busca, 50% insere, 30% remove) | RB | 10.59 | 0.572 | 3.056 | 2 | 14 | 11.78 | true |

## 6. Experimento 4B — Carga Mista Black Friday (IDs Aleatórios / Hashes UUIDs)

| mix | estrutura | comparacoesPorOp | rotacoesPorOp | recoloracoesPorOp | maxRotacoesEmUmaOp | alturaFinalMedia | trabalhoTotalPorOp | invarianteOk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Leitura intensa (80% busca, 15% insere, 5% remove) | AVL | 7.89 | 0.11 | 0 | 4 | 10.3 | 8 | true |
| Leitura intensa (80% busca, 15% insere, 5% remove) | RB | 7.98 | 0.093 | 0.34 | 3 | 11 | 8.14 | true |
| Balanceada (50% busca, 30% insere, 20% remove) | AVL | 8.35 | 0.274 | 0 | 4 | 11 | 8.62 | true |
| Balanceada (50% busca, 30% insere, 20% remove) | RB | 8.26 | 0.218 | 0.808 | 3 | 11.3 | 8.64 | true |
| Escrita intensa (20% busca, 50% insere, 30% remove) | AVL | 8.76 | 0.439 | 0 | 4 | 11 | 9.2 | true |
| Escrita intensa (20% busca, 50% insere, 30% remove) | RB | 8.59 | 0.364 | 1.26 | 3 | 11.7 | 9.2 | true |

## 7. Experimento 5 — Teste de Hipótese: "Pico Relâmpago / Flash Ingestion" (Inserção Maciça Pura)

| volumeN | tipoChegada | estrutura | alturaFinal | alturaIdeal | rotacoesTotal | rotacoesPorIns | recoloracoesTotal | recoloracoesPorIns | comparacoesTotal | comparacoesPorIns | maxRotacoesEmUmaOp | scoreTrabalhoTotal | invarianteOk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 500 | Sequencial (Esteira) | AVL | 9 | 9 | 491 | 0.982 | 0 | 0 | 3989 | 7.98 | 1 | 4726 | true |
| 500 | Sequencial (Esteira) | RB | 15 | 9 | 485 | 0.97 | 2418 | 4.836 | 6257 | 12.51 | 1 | 7468 | true |
| 500 | Aleatório (UUIDs) | AVL | 11 | 9 | 343 | 0.686 | 0 | 0 | 3845 | 7.69 | 2 | 4360 | true |
| 500 | Aleatório (UUIDs) | RB | 11 | 9 | 284 | 0.568 | 1130 | 2.26 | 3902 | 7.8 | 2 | 4554 | true |
| 1000 | Sequencial (Esteira) | AVL | 10 | 10 | 990 | 0.99 | 0 | 0 | 8977 | 8.98 | 1 | 10462 | true |
| 1000 | Sequencial (Esteira) | RB | 17 | 10 | 983 | 0.983 | 4909 | 4.909 | 14481 | 14.48 | 1 | 16937 | true |
| 1000 | Aleatório (UUIDs) | AVL | 12 | 10 | 668 | 0.668 | 0 | 0 | 8744 | 8.74 | 2 | 9746 | true |
| 1000 | Aleatório (UUIDs) | RB | 12 | 10 | 581 | 0.581 | 2319 | 2.319 | 8776 | 8.78 | 2 | 10111 | true |
| 2500 | Sequencial (Esteira) | AVL | 12 | 12 | 2488 | 0.995 | 0 | 0 | 25905 | 10.36 | 1 | 29637 | true |
| 2500 | Sequencial (Esteira) | RB | 20 | 12 | 2480 | 0.992 | 12395 | 4.958 | 42879 | 17.15 | 1 | 49078 | true |
| 2500 | Aleatório (UUIDs) | AVL | 13 | 12 | 1784 | 0.714 | 0 | 0 | 25199 | 10.08 | 2 | 27875 | true |
| 2500 | Aleatório (UUIDs) | RB | 14 | 12 | 1487 | 0.595 | 5766 | 2.306 | 25373 | 10.15 | 2 | 28757 | true |
| 5000 | Sequencial (Esteira) | AVL | 13 | 13 | 4987 | 0.997 | 0 | 0 | 56809 | 11.36 | 1 | 64290 | true |
| 5000 | Sequencial (Esteira) | RB | 22 | 13 | 4978 | 0.996 | 24886 | 4.977 | 95715 | 19.14 | 1 | 108159 | true |
| 5000 | Aleatório (UUIDs) | AVL | 15 | 13 | 3466 | 0.693 | 0 | 0 | 55565 | 11.11 | 2 | 60764 | true |
| 5000 | Aleatório (UUIDs) | RB | 15 | 13 | 2872 | 0.574 | 11641 | 2.328 | 55650 | 11.13 | 2 | 62286 | true |

## 8. Experimento 6 — Robustez e Preservação Contínua das Invariantes

| estrutura | validacoes | violacoes |
| --- | --- | --- |
| AVL | 900 | 0 |
| RB | 900 | 0 |


## 9. Roteiro de Transposição dos Resultados para os Slides da Apresentação

| Slide da Apresentação (PDF) | Tópico do Enunciado | Dados e Tabelas Recomendadas |
|---|---|---|
| **Slide 6: Demonstração do Sistema** | Evidências de Inserção, Busca e Remoção | Usar tabela da **Seção 1 (Cenários Obrigatórios)** mostrando as operações 0, 1 e 2 filhos, duplicatas e busca de inexistente. |
| **Slide 7: Testes Realizados** | Apresentação dos cenários testados | Apresentar os 6 cenários padronizados com confirmação de invariantes 100% válidas e percurso em-ordem idêntico. |
| **Slide 8: Análise Comparativa** | Comparação de Alturas e Rotações | Contrastar **Inserção por Chegada (Seção 2)** e **Pico Flash Ingestion (Seção 7)** com gráficos de altura e trabalho. |
| **Slide 9: Recomendação Técnica** | Veredito fundamentado em evidências | Apresentar o comparativo entre **IDs de Esteira (Seção 5)** e **IDs Aleatórios (Seção 6)** + garantia de teto <= 3 rotações na RB. |
