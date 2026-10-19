"""Actual165 original sleeve triangles. Geometry-only diagnostic, no photo pixels."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

p=Path('review')
d=json.loads((p/'sleeve165-coarse-data.json').read_text())
light=np.array([-.55,.5,.67]);light/=np.linalg.norm(light)

def draw(ax,key,angle,close):
    theta=np.deg2rad(angle)
    right=np.array([np.cos(theta),0.,np.sin(theta)])
    front=np.array([-np.sin(theta),0.,np.cos(theta)])
    items=[]
    for part in d['changed']+d['context']:
        moving='before' in part
        verts=np.asarray(part[key] if moving else part['position']).reshape(-1,3)
        norm=np.asarray(part['normalBefore' if key=='before' else 'normalAfter'] if moving else part['normal']).reshape(-1,3)
        idx=np.asarray(part['index']).reshape(-1,3)
        tri=verts[idx];n=norm[idx].mean(axis=1)
        n/=np.maximum(1e-14,np.linalg.norm(n,axis=1))[:,None]
        keep=(n@front>-.05)
        tri,n=tri[keep],n[keep]
        shade=.32+.65*np.maximum(0,n@light)
        rgb=shade[:,None]*np.array([1.,.99,.97])[None,:]
        xy=np.stack([tri@right,tri[:,:,1]],axis=2)
        items.extend(zip(tri.mean(axis=1)@front,xy,rgb))
    items.sort(key=lambda x:x[0])
    ax.add_collection(PolyCollection([x[1] for x in items],facecolors=[x[2] for x in items],edgecolors='none',linewidths=0,rasterized=True))
    if angle==0:
        ax.set_xlim((-2.13,-1.02) if close else (-2.22,2.22))
    else:
        ax.set_xlim((-.85,.60) if close else (-1.65,1.6))
    ax.set_ylim((-.05,1.43) if close else (-1.5,1.85))
    ax.set_aspect('equal');ax.set_facecolor('#d3e6ef')
    ax.set_title(f'{"OFF" if key=="before" else "ON"} — {"front" if angle==0 else "near profile"}{" sleeve" if close else " garment"}')
    ax.set_xlabel('blouse X' if angle==0 else 'oblique horizontal');ax.set_ylabel('blouse Y')

fig,axes=plt.subplots(3,2,figsize=(10,13),layout='constrained')
for row,(angle,close) in enumerate([(0,False),(0,True),(80,True)]):
    for col,key in enumerate(['before','after']):draw(axes[row,col],key,angle,close)
fig.suptitle('165 near-sleeve compression — original emitted grid, fixed diagnostic light\nNo117 atlas or new subdivision. Native full-scene art remains the decision.',fontsize=11)
fig.savefig(p/'sleeve165-coarse-view.png',dpi=140);plt.close(fig)
print(p/'sleeve165-coarse-view.png')
