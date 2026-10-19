"""Inspect emitted coarse 143 geometry. This is not a native material preview."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

p=Path('review')
data=json.loads((p/'near-curtain143-coarse-mesh.json').read_text())
idx=np.asarray(data['index'],dtype=np.int64).reshape(-1,3)
owned=np.asarray(data['owned'])
ids=np.concatenate([np.arange(i*960,(i+1)*960) for i in owned])
sid=np.concatenate([np.arange(i*960,(i+1)*960) for i in data['fixedSides']])
gid=ids//960
fig,axes=plt.subplots(1,4,figsize=(14,9),layout='constrained')
for col,(key,axis) in enumerate([('baseline',0),('candidate',0),('baseline',2),('candidate',2)]):
    points=np.asarray(data[key],dtype=float).reshape(-1,3)
    tri=points[idx[ids]]
    normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    depth_axis=2 if axis==0 else 0
    direction=1 if axis==0 else -1
    visible=normal[:,depth_axis]*direction>0
    tri=tri[visible]
    family=gid[visible]
    depth=tri[:,:,depth_axis].mean(axis=1)*direction
    order=np.argsort(depth)
    tri=tri[order]
    family=family[order]
    norm=normal[visible][order]
    norm/=np.maximum(1e-12,np.linalg.norm(norm,axis=1))[:,None]
    light=np.maximum(0,norm@np.asarray([-.30,.20,.93]))
    shade=.53+.27*light
    base=np.asarray([.40,.29,.24])
    colors=shade[:,None]*base[None,:]
    colors+=((family%7)/7)[:,None]*np.asarray([.015,.010,.006])[None,:]
    ax=axes[col]
    ax.set_facecolor('#d4e6ef')
    side_tri=points[idx[sid]]
    side_order=np.argsort(side_tri[:,:,depth_axis].mean(axis=1)*direction)
    ax.add_collection(PolyCollection(side_tri[side_order][:,:,[axis,1]],facecolors='#909a9d',edgecolors='none',linewidths=0))
    ax.add_collection(PolyCollection(tri[:,:,[axis,1]],facecolors=np.clip(colors,0,1),edgecolors='none',linewidths=0))
    ax.set_ylim(-1.36,1.90)
    ax.set_xlim((-1.85,-.15) if axis==0 else (.05,1.35))
    ax.set_aspect('equal')
    ax.set_title(f'{key} — {"front" if axis==0 else "near profile"}')
    ax.set_xlabel('model X' if axis==0 else 'model Z')
    ax.set_ylabel('model Y')
    ax.grid(alpha=.15)
fig.suptitle('143 source-only coarse MASS geometry; no fine strands or native material/light response\nGray: protected side locks. Blue gaps expose actual projected openings.',fontsize=12)
fig.savefig(p/'near-curtain143-coarse-view.png',dpi=150)
print(p/'near-curtain143-coarse-view.png')
