"""Internal original-geometry section figure; no photo or texture processing."""
import json
import os
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR', '/tmp/chin162-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

root = Path(__file__).resolve().parent
data = json.loads((root / 'chin162-coarse-sections.json').read_text())
sections = data['sections']
fig, axes = plt.subplots(2, 3, figsize=(14, 9), constrained_layout=True)
for ax, (u, title, axis, sign) in zip(axes.flat, [
    (0, 'Front section', 2, 1), (.875, 'Near quarter section', 2, 1),
    (.25, 'Far side section', 0, 1), (.75, 'Near side section', 0, -1),
    (.5, 'Back section', 2, -1),
]):
    s = min(sections, key=lambda s: abs(s['u'] - u))
    old = np.asarray(s['old'])
    neck = np.asarray(s['oldNeck'])
    upper = np.asarray(s['retainedUpper'])
    new = np.asarray([p['point'] for p in s['points']])
    ax.plot(sign * old[:, axis], old[:, 1], '--', color='#2563a6', lw=1.6, label='Retired lower head')
    ax.plot(sign * neck[:, axis], neck[:, 1], '--', color='#69747d', lw=1.6, label='Original upper neck')
    ax.plot(sign * upper[:, axis], upper[:, 1], '-', color='#2563a6', lw=2, label='Retained upper boundary')
    ax.plot(sign * new[:, axis], new[:, 1], '-', color='#c7531b', lw=2.2, label='New connected band')
    # The existing neck row36→32 return uses its original positions.
    ax.plot(sign * neck[:5, axis], neck[:5, 1], '-', color='#c7531b', lw=2.2)
    for p, marker, color in [(new[0], 'o', '#17496d'), (new[-1], 's', '#902ea0'), (neck[0], 'o', '#17496d')]:
        ax.scatter(sign * p[axis], p[1], s=22, marker=marker, color=color, zorder=4)
    ax.set(title=title, xlabel=('World Z' if axis == 2 else 'World X') + (' × −1' if sign == -1 else ''), ylabel='World Y')
    ax.set_aspect('equal', adjustable='datalim')
    ax.grid(alpha=.22)

ax = axes.flat[-1]
for value, color in [(0, '#17496d'), (.26, '#2b8a73'), (.48, '#e2952f'), (.73, '#c7531b'), (1, '#902ea0')]:
    points = np.array([min(s['points'], key=lambda q: abs(q['v'] - value))['point'] for s in sections])
    points = np.vstack([points, points[0]])
    ax.plot(points[:, 0], points[:, 2], color=color, label=f'Band v={value:g}')
ax.set(title='World X/Z sections (16 angular samples)', xlabel='World X', ylabel='World Z')
ax.set_aspect('equal', adjustable='datalim')
ax.grid(alpha=.22)
ax.legend(fontsize=8)
axes.flat[0].legend(fontsize=8)
fig.suptitle('Candidate162: actual159 source sections and one coarse connected annulus\nPurple squares mark existing neck row36, the face/neck material switch. This is a geometry study, not a render.', fontsize=13)
fig.savefig(root / 'chin162-coarse-sections.png', dpi=150)
plt.close(fig)
