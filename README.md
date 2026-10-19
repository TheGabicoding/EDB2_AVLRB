# Amazon Engineering Challenge — Árvores Balanceadas (AVL e Rubro-Negra)

**Disciplina:** IMD0039 – Estruturas de Dados Básicas II (Trabalho da Unidade II)
**Autor:** Gabriel Pinheiro

Protótipo em **React + TypeScript** para o sistema de logística da Amazon durante a Black Friday: registrar, localizar e remover identificadores de encomendas usando **Árvore AVL** e **Árvore Rubro-Negra**, ambas implementadas manualmente (sem bibliotecas de balanceamento), com visualização gráfica e análise comparativa.

## Como executar

Requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # versão compilada em dist/
npm run preview  # serve a versão compilada
```

## Funcionalidades

| Requisito do enunciado | Onde |
|---|---|
| Escolha da árvore (AVL / Rubro-Negra) | Seletor "Estrutura exibida" (há também modo lado a lado) |
| Inserção, remoção, busca | Painel "Operações" |
| Percurso em ordem | Painel "Percurso em ordem" |
| Visualização da árvore (cores na RB) | Visualizador SVG (altura/FB na AVL; cor/altura negra na RB; antes × depois da operação) |
| Busca/remoção de inexistentes, duplicatas | Tratados e explicados no passo a passo |
| Verificação das propriedades | Painel "Verificação das propriedades" (após cada operação) |
| Testes padronizados | 6 cenários em `src/utils/testScenarios.ts` (crescente, decrescente, não ordenada, remoções 0/1/2 filhos, vazia/1 elemento, stress) |
| Análise comparativa e recomendação | Aba "Análise & Recomendação" (valores medidos em tempo real) |

As operações são aplicadas às **duas árvores com os mesmos dados**, para comparar altura, rotações, recolorações e comparações.

## Estrutura do código

- `src/structures/AVLTree.ts` — AVL (rotações LL, RR, LR, RL; fator de balanceamento).
- `src/structures/RedBlackTree.ts` — Rubro-Negra no estilo CLRS (sentinela NIL, `insertFixup`, `deleteFixup`).
- `src/components/TreeVisualizer.tsx` — visualização SVG.
- `src/components/AnalysisPanel.tsx` — benchmarks e recomendação.
- `src/utils/testScenarios.ts` — cenários de teste.

## Decisões de projeto

- **Duplicatas:** rejeitadas (o ID da encomenda é único); a árvore não é alterada e a tentativa é contabilizada.
- **Busca/remoção de inexistentes e árvore vazia:** retornam falha tratada, com o caminho percorrido registrado.
- **Remoção de nó com 2 filhos:** substituição pelo **sucessor em ordem**.
- **AVL:** altura de nulo = 0, folha = 1; FB = h(esq) − h(dir); invariante |FB| ≤ 1.
- **Rubro-Negra:** raiz preta, sem dois vermelhos consecutivos, mesma altura negra em todos os caminhos.

## Resultados obtidos (mesmas entradas nas duas árvores)

| Cenário | AVL (altura / rotações) | RB (altura / rotações / recolorações) |
|---|---|---|
| Crescente (15) | 4 / 11 | 6 / 9 / 45 |
| Decrescente (15) | 4 / 11 | 6 / 9 / 45 |
| Não ordenada + duplicata + buscas | 4 / 4 | 4 / 0 / 11 |
| Remoções (0, 1, 2 filhos) | 3 / 3 | 3 / 3 / 21 |
| Vazia e 1 elemento | 2 / 0 | 2 / 0 / 2 |
| Stress (31 operações) | 5 / 10 | 6 / 9 / 45 |

Em todos os cenários as invariantes de ambas as árvores foram validadas e o percurso em ordem coincide nas duas estruturas.
