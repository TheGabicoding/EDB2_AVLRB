import React, { useMemo } from 'react';
import { runAllBenchmarks } from '../utils/testScenarios';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cpu,
  GitCompare,
  Layers,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';

export const AnalysisPanel: React.FC = () => {
  const benchmarkResults = useMemo(() => runAllBenchmarks(), []);
  const seq = benchmarkResults[0];
  const passedScenarios = benchmarkResults.filter(
    (result) => result.allStepsValid && result.avlValidation.isValid &&
      result.rbValidation.isValid && result.inOrderMatch
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner Executivo Amazon Tech Lead */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
              <Award className="w-3.5 h-3.5" />
              Análise do trabalho
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Análise Comparativa & Recomendação Arquitetural (Black Friday)
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Avaliação experimental e teórica entre <strong>Árvore AVL</strong> e{' '}
              <strong>Árvore Rubro-Negra</strong> submetidas exatamente aos mesmos conjuntos de
              dados e sequências de operações de logística.
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-right shrink-0">
            <div className="text-xs text-slate-400">Cenários Executados</div>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {passedScenarios} / {benchmarkResults.length} cenários válidos
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verificação após cada operação
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa dos 6 Cenários de Teste Obrigatórios */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100">
              Resultados Experimentais nos Cenários Padronizados (Mesmas Entradas)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Executado em tempo real pelas implementações em TypeScript
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cenário de Teste</th>
                <th className="py-3 px-3 text-center">Nós Finais</th>
                <th className="py-3 px-3 text-center text-emerald-400">Altura AVL</th>
                <th className="py-3 px-3 text-center text-rose-400">Altura Rubro-Negra</th>
                <th className="py-3 px-3 text-center text-emerald-400">Rotações AVL</th>
                <th className="py-3 px-3 text-center text-rose-400">
                  Rotações RB (+Recolors)
                </th>
                <th className="py-3 px-3 text-center text-emerald-400">Comparações AVL</th>
                <th className="py-3 px-3 text-center text-rose-400">Comparações RB</th>
                <th className="py-3 px-4 text-center">Integridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {benchmarkResults.map((res) => (
                <tr key={res.scenario.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{res.scenario.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {res.scenario.amazonContext}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {res.avlMetrics.nodeCount}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      h = {res.avlMetrics.height}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                      h = {res.rbMetrics.height}{' '}
                      <span className="text-[10px] text-slate-400">
                        (BH:{res.rbMetrics.blackHeight})
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-300">
                    {res.avlMetrics.totalRotations}{' '}
                    <span className="text-[10px] text-slate-400">
                      (E:{res.avlMetrics.leftRotations} / D:{res.avlMetrics.rightRotations})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-rose-300">
                    {res.rbMetrics.totalRotations}{' '}
                    <span className="text-[10px] text-amber-300">
                      (+{res.rbMetrics.recolorings} cores)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-200">
                    {res.avlMetrics.totalComparisons}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-rose-200">
                    {res.rbMetrics.totalComparisons}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {res.allStepsValid &&
                    res.avlValidation.isValid &&
                    res.rbValidation.isValid &&
                    res.inOrderMatch ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Válido
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">Erro</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid de Discussão Técnica (Tópicos Obrigatórios da Seção 3 do PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Diferenças nas Estratégias de Balanceamento */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <GitCompare className="w-5 h-5" />
            <h4>1. Diferenças entre as Estratégias de Balanceamento</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A <strong>Árvore AVL</strong> adota um critério <em>estritamente rígido</em> baseado na
            altura exata das subárvores: para qualquer nó N, exige-se que o Fator de Balanceamento
            satisfaça |FB(N)| = |h(esq) − h(dir)| ≤ 1. Isso limita sua
            altura no pior caso a aproximadamente 1,44·log₂(n + 2).
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Já a <strong>Árvore Rubro-Negra</strong> utiliza um balanceamento{' '}
            <em>relaxado baseado em cores</em> (Vermelho/Preto) e na invariante de Altura Negra
            uniforme. Como caminhos podem alternar nós pretos e vermelhos, o maior caminho da raiz a
            uma folha pode ter até o dobro do menor caminho (h ≤ 2·log₂(n + 1)). Na prática,
            muitas violações são resolvidas apenas trocando bits de cor (O(1) por passo) sem
            alterar ponteiros estruturais.
          </p>
        </div>

        {/* 2. Altura Final vs Número de Rotações */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Layers className="w-5 h-5" />
            <h4>2. Altura Final vs. Custo de Rotações e Ajustes</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              <strong>Inserção Sequencial (Cenários 1 e 2):</strong> Com 15 elementos ordenados,
              uma BST comum teria altura <strong>15</strong>. Tanto a AVL quanto a Rubro-Negra
              comprimem a árvore, mas a AVL atinge <strong>altura {seq.avlMetrics.height}</strong>{' '}
              realizando <strong>{seq.avlMetrics.totalRotations} rotações</strong>, enquanto a
              Rubro-Negra estabiliza com <strong>altura {seq.rbMetrics.height}</strong> realizando
              apenas <strong>{seq.rbMetrics.totalRotations} rotações</strong> e{' '}
              <strong>{seq.rbMetrics.recolorings} recolorações</strong> (Caso 1 de Tio Vermelho).
            </li>
            <li>
              <strong>Remoções (Cenário 4 e 6):</strong> Na remoção, a Árvore Rubro-Negra garante
              teoricamente no máximo <strong>3 rotações</strong> para restaurar o balanceamento,
              enquanto a Árvore AVL pode propagar rotações até a raiz (Θ(log n) rotações no
              pior caso).
            </li>
          </ul>
        </div>

        {/* 3. Vantagens, Limitações e Aplicações */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Cpu className="w-5 h-5" />
            <h4>3. Vantagens, Limitações e Aplicações Reais</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3">
              <div className="font-bold text-emerald-300 mb-1">Árvore AVL</div>
              <p className="text-slate-300 mb-2">
                <strong>Vantagem:</strong> Menor altura garantida; buscas (`search`) exigem menos
                comparações em árvores grandes.
              </p>
              <p className="text-slate-400">
                <strong>Aplicação:</strong> Catálogos de produtos, tabelas de CEP/rotas fixas e
                índices <em>read-heavy</em> (muitas consultas, poucas escritas).
              </p>
            </div>
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-3">
              <div className="font-bold text-rose-300 mb-1">Árvore Rubro-Negra</div>
              <p className="text-slate-300 mb-2">
                <strong>Vantagem:</strong> Faz no máximo 2 rotações por inserção e 3 por remoção,
                o que pode ser útil em sistemas com muitas atualizações.
              </p>
              <p className="text-slate-400">
                <strong>Aplicação:</strong> Filas logísticas dinâmicas, <code>std::map</code> (C++),{' '}
                <code>java.util.TreeMap</code> e escalonador CFS do Linux.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Decisões de Implementação Documentadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <BookOpen className="w-5 h-5" />
            <h4>4. Decisões de Projeto & Tratamento de Exceções</h4>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed list-disc list-inside">
            <li>
              <strong>Valores Repetidos (Duplicatas):</strong> No domínio logístico da Amazon, cada
              identificador de pacote (<code>Tracking ID</code>) é único. Tentativas de inserir um
              ID já existente são interceptadas, rejeitadas sem corromper a árvore e contabilizadas
              na métrica <em>Duplicatas Rejeitadas</em>.
            </li>
            <li>
              <strong>Busca e Remoção de Inexistentes:</strong> Quando a busca atinge <code>null</code>{' '}
              (AVL) ou a sentinela <code>NIL</code> (Rubro-Negra), o sistema retorna status negativo
              tratado amigavelmente, registrando todo o caminho de comparações percorrido.
            </li>
            <li>
              <strong>Remoção de Nós com 2 Filhos:</strong> Ambas as estruturas utilizam a
              substituição pelo <strong>sucessor em-ordem</strong> (menor elemento da subárvore
              direita), preservando a ordenação estrita do percurso <em>In-Order</em>.
            </li>
          </ul>
        </div>
      </div>

      {/* Recomendação Técnica Final para a Equipe de Engenharia da Amazon */}
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg mb-3">
          <Zap className="w-6 h-6" />
          <h3>Recomendação técnica com base nos testes</h3>
        </div>
        <div className="space-y-3 text-sm text-slate-200 leading-relaxed">
          <p>
            Os cenários são pequenos e não medem tempo de execução. Eles permitem comparar altura e
            quantidade de rotações nas sequências testadas, mas não representam toda a carga de um
            sistema real:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
            <div className="bg-slate-950/90 border border-rose-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2 font-bold text-rose-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                Muitas inserções e remoções: Rubro-Negra
              </div>
              <p className="text-xs text-slate-300">
                Para uma carga com muitas inserções e remoções, a árvore Rubro-Negra pode ser
                adequada. Nos cenários executados, ela exigiu{' '}
                <strong>menos rotações estruturais</strong> que a AVL (ex.: {seq.rbMetrics.totalRotations} contra {seq.avlMetrics.totalRotations} na
                inserção sequencial; teto teórico de 2 por inserção e 3 por remoção), resolvendo parte dos ajustes apenas via
                recoloração. O protótipo mede rotações e recolorações, mas não mede tempo, memória ou
                concorrência.
              </p>
            </div>
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                Muitas buscas: AVL
              </div>
              <p className="text-xs text-slate-300">
                Nas sequências ordenadas com 15 elementos, a AVL teve altura{' '}
                <strong> {seq.avlMetrics.height}</strong> e a Rubro-Negra altura{' '}
                <strong> {seq.rbMetrics.height}</strong>. A menor altura pode reduzir o número de nós
                visitados em uma busca. A escolha final depende de quais operações são mais frequentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
