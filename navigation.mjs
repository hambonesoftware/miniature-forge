// Navigation uses prototype metres, with Y up. Floor triangles and structural
// boxes come from the real Blender scene rather than a second visual model.
export class Grid {
  constructor(size=4){this.size=size;this.cells=new Map();}
  key(x,z){return `${Math.floor(x/this.size)},${Math.floor(z/this.size)}`;}
  add(item,minX,minZ,maxX,maxZ){for(let x=Math.floor(minX/this.size);x<=Math.floor(maxX/this.size);x++)for(let z=Math.floor(minZ/this.size);z<=Math.floor(maxZ/this.size);z++){const key=`${x},${z}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);}}
  at(x,z){return this.cells.get(this.key(x,z))||[];}
}
export function triangleHeight(t,x,z){
  const [a,b,c]=t,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
  if(Math.abs(den)<1e-10)return null;
  const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;
  const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
  return u>=-1e-5&&v>=-1e-5&&u+v<=1.00001?u*a[1]+v*b[1]+(1-u-v)*c[1]:null;
}
export function bodyHits(box,x,y,z,r=.22,height=1.7){
  if(y+.08>=box[1][1]||y+height<=box[0][1])return false;
  const dx=x-Math.max(box[0][0],Math.min(x,box[1][0]));
  const dz=z-Math.max(box[0][2],Math.min(z,box[1][2]));
  return dx*dx+dz*dz<r*r-1e-9;
}
export class Navigation {
  constructor(data){this.data=data;this.floor=new Grid();this.walls=new Grid();this.dynamic=[];
    for(const t of data.surfaces)this.floor.add(t,Math.min(...t.map(p=>p[0])),Math.min(...t.map(p=>p[2])),Math.max(...t.map(p=>p[0])),Math.max(...t.map(p=>p[2])));
    for(const b of data.obstacles)this.walls.add(b,b[0][0]-.3,b[0][2]-.3,b[1][0]+.3,b[1][2]+.3);
  }
  height(x,z,previous){let best=-Infinity;for(const [dx,dz] of[[0,0],[-.08,0],[.08,0],[0,-.08],[0,.08],[-.06,-.06],[.06,-.06],[-.06,.06],[.06,.06]])for(const t of this.floor.at(x+dx,z+dz)){const h=triangleHeight(t,x+dx,z+dz);if(h!==null&&h<=previous+.34&&h>best)best=h;}return Number.isFinite(best)?best:null;}
  blocked(x,y,z){return [...this.walls.at(x,z),...this.dynamic].some(b=>bodyHits(b,x,y,z));}
  move(position,dx,dz){const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.045));let [x,y,z]=position;
    for(let i=0;i<count;i++)for(const axis of [0,2]){
      const nx=x+(axis===0?dx/count:0),nz=z+(axis===2?dz/count:0),h=this.height(nx,nz,y);
      const [[minX,minZ],[maxX,maxZ]]=this.data.bounds;
      if(h!==null&&nx>minX+.25&&nx<maxX-.25&&nz>minZ+.25&&nz<maxZ-.25&&!this.blocked(nx,h,nz)){x=nx;y=h;z=nz;}
    }return [x,y,z];
  }
}
