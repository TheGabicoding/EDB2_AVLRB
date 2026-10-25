# Amazon Engineering Challenge — Árvores Balanceadas (AVL e Rubro-Negra)

**Disciplina:** IMD0039 – Estruturas de Dados Básicas II (Trabalho da Unidade II)
**Autor:** Gabriel Augusto Gomes Pinheiro

**Repositório:** [github.com/TheGabicoding/EDB2_AVLRB](https://github.com/TheGabicoding/EDB2_AVLRB)

Protótipo em **React + TypeScript** para o sistema de logística da Amazon durante a Black Friday: registrar, localizar e remover identificadores de encomendas usando **Árvore AVL** e **Árvore Rubro-Negra**, ambas implementadas manualmente (sem bibliotecas de balanceamento), com visualização gráfica e comparação lado a lado.

## Como executar

Requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # versão compilada em dist/
npm run preview  # serve a versão compilada
npm run benchmark # executa os cenários e experimentos comparativos
```

O projeto usa React 18, TypeScript e Vite. `npm install` instala as dependências declaradas em `package.json`. A versão compilada fica em `dist/` após `npm run build`.

## Funcionalidades

| Requisito do enunciado | Onde |
|---|---|
| Seleção da estrutura exibida | Seletor para exibir AVL, Rubro-Negra ou ambas lado a lado |
| Inserção, remoção, busca | Painel "Operações" |
| Percurso em ordem | Painel "Percurso em ordem" |
| Visualização da árvore e das cores na RB | Visualizador SVG (altura/FB na AVL; cor/altura negra na RB; antes × depois da operação) |
| Busca/remoção de inexistentes, duplicatas | Tratados e explicados no passo a passo |
| Verificação das propriedades | Painel "Verificação das propriedades" (após cada operação) |
| Testes padronizados | 6 cenários em `src/utils/testScenarios.ts` (crescente, decrescente, não ordenada, remoções 0/1/2 filhos, vazia/1 elemento, stress) |

Cada inserção, busca ou remoção é aplicada às **duas árvores com os mesmos dados**. O seletor muda a visualização, não a estrutura que recebe a operação. Isso mantém as sequências iguais para a comparação de altura, rotações, recolorações e comparações.

Para experimentar pela interface, inicie `npm run dev`, insira um identificador no painel de operações ou carregue um dos seis cenários padronizados. Escolha AVL, Rubro-Negra ou lado a lado para visualizar a estrutura e os passos da operação.

## Estrutura do código

- `src/structures/AVLTree.ts` — AVL (rotações LL, RR, LR, RL; fator de balanceamento).
- `src/structures/RedBlackTree.ts` — Rubro-Negra no estilo CLRS (sentinela NIL, `insertFixup`, `deleteFixup`).
- `src/components/TreeVisualizer.tsx` — visualização SVG.
- `src/utils/testScenarios.ts` — cenários de teste.
- `scripts/benchmark.ts` — experimentos comparativos e exportação dos resultados.
- `scripts/plot_benchmark.py` — geração opcional de gráficos a partir do relatório Markdown.
- `requirements.txt` — dependências Python usadas apenas para gerar os gráficos.
- `docs/resultados_benchmark.md` e `docs/graficos/` — relatório e gráficos do benchmark.

Execute `npm run benchmark` para reproduzir os cenários obrigatórios e os experimentos de inserção, busca, remoção, cargas mistas, pico de inserção e robustez. O script atualiza os relatórios em `docs/`.

Para gerar os gráficos do relatório (opcional), instale Python 3 e execute:

```bash
python -m pip install -r requirements.txt
python scripts/plot_benchmark.py
```

O gerador de gráficos lê `docs/resultados_benchmark.md` e grava as imagens em `docs/graficos/`.

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

Os valores da tabela são os resultados finais de cada cenário padronizado, aplicando a mesma sequência às duas estruturas. Em todos eles, as invariantes foram validadas após cada operação e o percurso em ordem coincidiu entre AVL e Rubro-Negra. Os relatórios de benchmark contêm também os experimentos adicionais.
