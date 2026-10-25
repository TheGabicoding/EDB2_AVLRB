"""
Gera gráficos comparativos AVL x Rubro-Negra a partir do relatório Markdown
produzido por `npm run benchmark`, que executa as classes reais em src/structures.

Uso:
    python scripts/plot_benchmark.py
Saída: docs/graficos/*.png
"""
import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / "docs" / "resultados_benchmark.md"
OUT = ROOT / "docs" / "graficos"
OUT.mkdir(parents=True, exist_ok=True)

SECTION_KEYS = {
    1: "0_testes_obrigatorios_pdf",
    2: "1_insercao",
    3: "2_busca",
    4: "3_remocao",
    5: "4_carga_mista",
    6: "4b_carga_mista_aleatoria",
    7: "5_pico_insercao_flash",
    8: "6_robustez",
}


def parse_value(value):
    if value == "true":
        return True
    if value == "false":
        return False
    try:
        return int(value)
    except ValueError:
        try:
            return float(value)
        except ValueError:
            return value


def load_markdown_data():
    data = {}
    key = None
    headers = None

    for line in REPORT.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"##\s+(\d+)\.", line)
        if heading:
            key = SECTION_KEYS.get(int(heading.group(1)))
            headers = None
            continue

        if key is None or not line.startswith("|"):
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        if headers is None:
            headers = cells
            data[key] = []
            continue
        data[key].append(dict(zip(headers, (parse_value(cell) for cell in cells))))

    missing = set(SECTION_KEYS.values()) - data.keys()
    if missing:
        raise ValueError(f"Relatório Markdown sem as seções esperadas: {sorted(missing)}")
    return data


DATA = load_markdown_data()

COLORS = {"AVL": "#1f77b4", "RB": "#d62728"}
LABELS = {"AVL": "AVL", "RB": "Rubro-Negra"}


def rows(key, **filters):
    return [r for r in DATA[key] if all(r[k] == v for k, v in filters.items())]


def grouped_bars(ax, categories, series, ylabel, title, fmt="{:.1f}"):
    x = np.arange(len(categories))
    w = 0.38
    for i, kind in enumerate(("AVL", "RB")):
        bars = ax.bar(x + (i - 0.5) * w, series[kind], w, label=LABELS[kind], color=COLORS[kind])
        for b in bars:
            ax.annotate(fmt.format(b.get_height()), (b.get_x() + b.get_width() / 2, b.get_height()),
                        ha="center", va="bottom", fontsize=8)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=8)
    ax.set_ylabel(ylabel)
    ax.set_title(title, fontsize=10, fontweight="bold")
    ax.grid(axis="y", alpha=0.3)
    ax.legend()


def short(name):
    return name.split(" (")[0]


# ---- Figura 1: altura final por ordem de chegada (n máximo) + crescimento ----
ins = DATA["1_insercao"]
nmax = max(r["n"] for r in ins)
cargas = list(dict.fromkeys(r["carga"] for r in ins))

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
series = {k: [rows("1_insercao", carga=c, n=nmax, estrutura=k)[0]["alturaFinal"] for c in cargas]
          for k in ("AVL", "RB")}
grouped_bars(axes[0], [short(c) for c in cargas], series, "Altura final",
             f"Altura final após {nmax} inserções (menor = melhor)")
ideal = rows("1_insercao", carga=cargas[0], n=nmax, estrutura="AVL")[0]["alturaIdeal"]
axes[0].axhline(ideal, color="gray", ls="--", lw=1, label=f"Ideal ⌈log₂(n+1)⌉ = {ideal}")
axes[0].legend()

ns = sorted({r["n"] for r in ins})
for k in ("AVL", "RB"):
    axes[1].plot(ns, [rows("1_insercao", carga=cargas[0], n=n, estrutura=k)[0]["alturaFinal"] for n in ns],
                 "o-", color=COLORS[k], label=LABELS[k])
axes[1].plot(ns, [np.ceil(np.log2(n + 1)) for n in ns], "k--", lw=1, label="Ideal")
axes[1].set_xlabel("Nº de encomendas (n)")
axes[1].set_ylabel("Altura")
axes[1].set_title("Crescimento da altura — chegada crescente (esteira)", fontsize=10, fontweight="bold")
axes[1].grid(alpha=0.3)
axes[1].legend()
fig.suptitle("Impacto da ordem de chegada na altura", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "1_altura_por_chegada.png", dpi=150)
plt.close(fig)

# ---- Figura 2: custo de inserção (comparações e recolorações/rotações) ----
fig, axes = plt.subplots(1, 3, figsize=(17, 5))
for ax, metric, ylab, title in (
    (axes[0], "comparacoesPorInsercao", "Comparações / inserção", "Comparações por inserção"),
    (axes[1], "rotacoesPorInsercao", "Rotações / inserção", "Rotações por inserção"),
    (axes[2], "recoloracoesPorInsercao", "Recolorações / inserção", "Recolorações por inserção"),
):
    s = {k: [rows("1_insercao", carga=c, n=nmax, estrutura=k)[0][metric] for c in cargas] for k in ("AVL", "RB")}
    grouped_bars(ax, [short(c) for c in cargas], s, ylab, title, fmt="{:.2f}")
    ax.tick_params(axis="x", rotation=20)
fig.suptitle(f"Custo de inserção (n = {nmax})", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "2_custo_insercao.png", dpi=150)
plt.close(fig)

# ---- Figura 3: busca (média e pior caso) ----
bus = DATA["2_busca"]
nb = max(r["n"] for r in bus)
cargas_b = list(dict.fromkeys(r["carga"] for r in bus))
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for ax, metric, ylab, title in (
    (axes[0], "comparacoesMediasBusca", "Comparações (média)", "Custo médio de busca"),
    (axes[1], "comparacoesPiorBusca", "Comparações (pior caso)", "Pior caso de busca (latência de cauda)"),
):
    s = {k: [rows("2_busca", carga=c, n=nb, estrutura=k)[0][metric] for c in cargas_b] for k in ("AVL", "RB")}
    grouped_bars(ax, [short(c) for c in cargas_b], s, ylab, title, fmt="{:.1f}")
    ax.tick_params(axis="x", rotation=20)
fig.suptitle(f"Busca por rastreio após construção (n = {nb})", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "3_busca.png", dpi=150)
plt.close(fig)

# ---- Figura 4: remoção ----
rem = DATA["3_remocao"]
padroes = list(dict.fromkeys(r["padraoRemocao"] for r in rem))
fig, axes = plt.subplots(1, 3, figsize=(17, 5))
for ax, metric, ylab, title in (
    (axes[0], "rotacoesPorRemocao", "Rotações / remoção", "Rotações (média)"),
    (axes[1], "maxRotacoesEmUmaRemocao", "Rotações (máx. numa operação)", "Pior caso de rotações"),
    (axes[2], "recoloracoesPorRemocao", "Recolorações / remoção", "Recolorações (média)"),
):
    s = {k: [np.mean([r[metric] for r in rows("3_remocao", n=nmax, padraoRemocao=p, estrutura=k)]) for p in padroes]
         for k in ("AVL", "RB")}
    grouped_bars(ax, [p.replace(" (", "\n(") .replace("Remover ", "") for p in padroes], s, ylab, title, fmt="{:.2f}")
    ax.tick_params(axis="x", labelsize=6)
fig.suptitle(f"Custo de remoção (n = {nmax}; média sobre as duas cargas prévias)", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "4_remocao.png", dpi=150)
plt.close(fig)

# ---- Figura 5: carga mista (trabalho total por operação, empilhado) ----
mix = DATA["4_carga_mista"]
mixes = list(dict.fromkeys(r["mix"] for r in mix))
fig, ax = plt.subplots(figsize=(11, 5.5))
x = np.arange(len(mixes))
w = 0.38
parts = (("comparacoesPorOp", "Comparações", 1.0), ("rotacoesPorOp", "Rotações", 0.7), ("recoloracoesPorOp", "Recolorações", 0.4))
for i, kind in enumerate(("AVL", "RB")):
    bottom = np.zeros(len(mixes))
    for metric, label, alpha in parts:
        vals = np.array([rows("4_carga_mista", mix=m, estrutura=kind)[0][metric] for m in mixes])
        ax.bar(x + (i - 0.5) * w, vals, w, bottom=bottom, color=COLORS[kind], alpha=alpha,
               label=f"{LABELS[kind]} — {label}", edgecolor="white")
        bottom += vals
    for xi, tot in zip(x + (i - 0.5) * w, bottom):
        ax.annotate(f"{tot:.2f}", (xi, tot), ha="center", va="bottom", fontsize=9, fontweight="bold")
ax.set_xticks(x)
ax.set_xticklabels([m.replace(" (", "\n(") for m in mixes], fontsize=8)
ax.set_ylabel("Trabalho por operação (comparações + rotações + recolorações)")
ax.set_title("Carga mista Black Friday (IDs crescentes): trabalho total por operação (menor = melhor)",
             fontsize=11, fontweight="bold")
ax.grid(axis="y", alpha=0.3)
ax.legend(fontsize=7, ncol=2)
fig.tight_layout()
fig.savefig(OUT / "5_carga_mista.png", dpi=150)
plt.close(fig)

# ---- Figura 6: painel-resumo ----
fig, axes = plt.subplots(2, 2, figsize=(14, 9))
s = {k: [rows("1_insercao", carga=c, n=nmax, estrutura=k)[0]["alturaFinal"] for c in cargas] for k in ("AVL", "RB")}
grouped_bars(axes[0, 0], [short(c) for c in cargas], s, "Altura", "Altura final", fmt="{:.0f}")
s = {k: [rows("2_busca", carga=c, n=nb, estrutura=k)[0]["comparacoesPiorBusca"] for c in cargas_b] for k in ("AVL", "RB")}
grouped_bars(axes[0, 1], [short(c) for c in cargas_b], s, "Comparações", "Pior caso de busca", fmt="{:.0f}")
s = {k: [rows("4_carga_mista", mix=m, estrutura=k)[0]["trabalhoTotalPorOp"] for m in mixes] for k in ("AVL", "RB")}
grouped_bars(axes[1, 0], ["Leitura\nintensa", "Balanceada", "Escrita\nintensa"], s, "Trabalho/op",
             "Trabalho total por operação (carga mista)", fmt="{:.1f}")
s = {k: [np.mean([r["maxRotacoesEmUmaRemocao"] for r in rows("3_remocao", n=nmax, padraoRemocao=p, estrutura=k)]) for p in padroes]
     for k in ("AVL", "RB")}
grouped_bars(axes[1, 1], ["FIFO\ncrescente", "Aleatória\n(todas)", "Metade\naleatória"], s, "Rotações",
             "Pior caso de rotações numa remoção (única vantagem da RB)", fmt="{:.1f}")
for a in axes[0]:
    a.tick_params(axis="x", labelsize=7, rotation=15)
fig.suptitle("Resumo técnico AVL × Rubro-Negra — cenário Black Friday Amazon", fontsize=14, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "6_resumo.png", dpi=150)
plt.close(fig)

# ---- Figura 7: visão geral por tamanho (100, 500, 1000): inserção, busca e remoção ----
fig, axes = plt.subplots(1, 3, figsize=(17, 5))
ns = sorted({r["n"] for r in ins})
def avg_over(key, metric, n, kind, **flt):
    return np.mean([r[metric] for r in rows(key, n=n, estrutura=kind, **flt)])
panels = (
    (axes[0], "1_insercao", "comparacoesPorInsercao", "Comparações / inserção", "Inserção (média das 5 chegadas)"),
    (axes[1], "2_busca", "comparacoesMediasBusca", "Comparações / busca", "Busca (média das 5 chegadas)"),
    (axes[2], "3_remocao", "comparacoesPorRemocao", "Comparações / remoção", "Remoção (média dos padrões)"),
)
for ax, key, metric, ylab, title in panels:
    s = {k: [avg_over(key, metric, n, k) for n in ns] for k in ("AVL", "RB")}
    grouped_bars(ax, [f"n = {n}" for n in ns], s, ylab, title, fmt="{:.2f}")
fig.suptitle("Custo por operação em função do volume (100, 500 e 1000 encomendas)", fontsize=13, fontweight="bold")
fig.tight_layout()
fig.savefig(OUT / "7_visao_por_volume.png", dpi=150)
plt.close(fig)

# ---- Figura 8: Pico Relâmpago / Flash Ingestion (500 a 5000 encomendas) ----
if "5_pico_insercao_flash" in DATA:
    flash = DATA["5_pico_insercao_flash"]
    vols = sorted({r["volumeN"] for r in flash})
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    # Painel 1: Rotações por inserção (IDs Aleatórios UUIDs)
    ax = axes[0]
    for k in ("AVL", "RB"):
        pts = [rows("5_pico_insercao_flash", volumeN=v, tipoChegada="Aleatório (UUIDs)", estrutura=k)[0]["rotacoesPorIns"] for v in vols]
        ax.plot(vols, pts, "o-", color=COLORS[k], label=f"{LABELS[k]} (Aleatório)", lw=2)
    ax.set_xlabel("Volume de Encomendas Inseridas (N)")
    ax.set_ylabel("Rotações por Inserção")
    ax.set_title("Taxa de Rotações — IDs Aleatórios (UUIDs)\n(RB economiza ~17% de rotações)", fontsize=10, fontweight="bold")
    ax.grid(alpha=0.3)
    ax.legend()

    # Painel 2: Altura final (Sequencial vs Aleatório)
    ax = axes[1]
    for k in ("AVL", "RB"):
        pts_seq = [rows("5_pico_insercao_flash", volumeN=v, tipoChegada="Sequencial (Esteira)", estrutura=k)[0]["alturaFinal"] for v in vols]
        pts_rnd = [rows("5_pico_insercao_flash", volumeN=v, tipoChegada="Aleatório (UUIDs)", estrutura=k)[0]["alturaFinal"] for v in vols]
        ax.plot(vols, pts_seq, "s--", color=COLORS[k], alpha=0.6, label=f"{LABELS[k]} (Esteira Sequencial)")
        ax.plot(vols, pts_rnd, "o-", color=COLORS[k], lw=2, label=f"{LABELS[k]} (Aleatório UUIDs)")
    ax.set_xlabel("Volume de Encomendas Inseridas (N)")
    ax.set_ylabel("Altura Final")
    ax.set_title("Altura Final em Função do Volume de Inserção\n(Esteira Sequencial vs IDs Aleatórios)", fontsize=10, fontweight="bold")
    ax.grid(alpha=0.3)
    ax.legend(fontsize=8)

    fig.suptitle("Pico Relâmpago Black Friday: Inserção Maciça (Até 5.000 Encomendas)", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(OUT / "8_flash_ingestion.png", dpi=150)
    plt.close(fig)

print("Gráficos gerados em", OUT)
for p in sorted(OUT.glob("*.png")):
    print(" -", p.name)
