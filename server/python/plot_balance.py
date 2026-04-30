import sys
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
import io

def generate_chart():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            sys.exit(1)
        data = json.loads(input_data)
    except Exception as e:
        print("Error reading input data:", str(e), file=sys.stderr)
        sys.exit(1)

    past = data.get('pastData', [])
    if not past:
        sys.exit(0)

    dates = [d['date'][-5:] for d in past] # MM-DD format
    incomes = [d.get('income', 0) for d in past]
    expenses = [d.get('expense', 0) for d in past]

    # Clean, light dashboard theme
    fig, ax = plt.subplots(figsize=(8, 3.8), dpi=200)
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    x = np.arange(len(dates))
    
    # --- PLOT INCOME & EXPENSE ---
    # Plotting Income (Green)
    ax.plot(x, incomes, color='#10b981', linewidth=3, marker='o', markersize=6, markerfacecolor='#ffffff', markeredgewidth=2, label='Pemasukan', zorder=4)
    # Plotting Expense (Red)
    ax.plot(x, expenses, color='#ef4444', linewidth=3, marker='o', markersize=6, markerfacecolor='#ffffff', markeredgewidth=2, label='Pengeluaran', zorder=4)
    
    # Fill under lines
    ax.fill_between(x, incomes, alpha=0.1, color='#10b981', zorder=2)
    ax.fill_between(x, expenses, alpha=0.1, color='#ef4444', zorder=2)
    
    # Labels and Grid
    ax.set_ylabel('Nominal (Rp)', color='#64748b', fontsize=10, fontweight='bold', labelpad=10)
    ax.tick_params(axis='y', colors='#64748b', labelsize=8)
    ax.tick_params(axis='x', colors='#64748b', labelsize=8)
    ax.set_xticks(x)
    ax.set_xticklabels(dates)
    
    # Format currency
    def currency_fmt(val, pos):
        if val == 0: return "0"
        if val >= 1000000: return f"{val/1000000:.1f}M"
        if val >= 1000: return f"{int(val/1000)}k"
        return str(int(val))
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(currency_fmt))

    # Grids & Spines
    ax.grid(True, axis='y', linestyle='--', alpha=0.4, color='#cbd5e1', zorder=1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#e2e8f0')

    # Legend
    ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.15), ncol=2, frameon=False, labelcolor='#1e293b', fontsize=9)

    plt.tight_layout(pad=1.5)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor(), transparent=True)
    buf.seek(0)
    
    sys.stdout.buffer.write(buf.getvalue())

if __name__ == '__main__':
    generate_chart()
