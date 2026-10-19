"""Actual158 coarse triangles under one fixed diagnostic light; no photo pixels."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root = Path('review')
d = json.loads((root / 'collar158-coarse-data.json').read_text())
light = np.asarray([-.38, .48, .79]); light /= np.linalg.norm(light)

def surfaces(mode, hair):
    for item in d['context']:
        if item.get('kind') == 'hair' and not hair:
            continue
        yield item, 'position', 'normal', item.get('kind', 'cloth')
    for item in d['changed']:
        yield item, mode, 'normalBefore' if mode == 'before' else 'normalAfter', 'leaf' if 'spread-collar' in item['name'] else 'edge'

def draw(ax, mode, angle, hair):
    theta = np.deg2rad(angle)
    right = np.asarray([np.cos(theta), 0., np.sin(theta)])
    toward = np.asarray([-np.sin(theta), 0., np.cos(theta)])
    triangles, colors = [], []
    for item, pos, norm, kind in surfaces(mode, hair):
        indices = np.asarray(item['index'], dtype=np.int64).reshape(-1, 3)
        vertices = np.asarray(item[pos]).reshape(-1, 3)
        normals = np.asarray(item[norm]).reshape(-1, 3)
        tri = vertices[indices]
        nn = normals[indices].mean(axis=1)
        nn /= np.maximum(1e-15, np.linalg.norm(nn, axis=1))[:, None]
        shade = .52 + .43 * np.maximum(0, nn @ light)
        palette = {'cloth': [.91, .94, .97], 'leaf': [1., .99, .96], 'edge': [.63, .68, .70], 'skin': [.79, .57, .48], 'hair': [.14, .075, .058]}
        rgb = shade[:, None] * palette[kind]
        triangles.append(tri); colors.append(rgb)
    tri, rgb = np.concatenate(triangles), np.concatenate(colors)
    order = np.argsort(tri.mean(axis=1) @ toward)
    xy = np.stack([tri @ right, tri[:, :, 1]], axis=2)
    ax.add_collection(PolyCollection(xy[order], facecolors=rgb[order], edgecolors='none', linewidths=0, antialiaseds=False, rasterized=True))
    ax.set_xlim((-1.2, .8) if angle == 0 else ((-.43, 1.03) if angle > 0 else (-1.08, .47)))
    ax.set_ylim(.38, 1.64)
    ax.set_aspect('equal')
    ax.set_facecolor('#d3e6ef')
    label = 'front + fixed hair MASS' if hair else ('isolated front' if angle == 0 else f'isolated {angle:+d}° oblique')
    ax.set_title(f'{"OFF" if mode == "before" else "ON"} — {label}', fontsize=10)
    ax.tick_params(labelsize=7)

fig, axes = plt.subplots(4, 2, figsize=(12, 15), layout='constrained')
for row, (angle, hair) in enumerate([(0, True), (0, False), (65, False), (-65, False)]):
    for col, mode in enumerate(['before', 'after']):
        draw(axes[row, col], mode, angle, hair)
fig.suptitle('158 existing closed collar leaves / coherent free-edge roll\nOriginal triangles and section thickness; fixed diagnostic light only. Accepted maps and cast shadows are assessed in native views.', fontsize=12)
fig.savefig(root / 'collar158-coarse-view.png', dpi=125)
plt.close(fig)
print(root / 'collar158-coarse-view.png')
