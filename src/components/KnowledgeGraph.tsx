"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SUBJECTS } from "@/lib/types";

const PAL = {
  active: { core: "#ffa040", glow: "rgba(255,160,64,0.80)",  ring: "rgba(255,160,64,0.25)", label: "Изучается" },
  full:   { core: "#6b8fff", glow: "rgba(107,143,255,0.70)", ring: "rgba(107,143,255,0.22)", label: "Полный" },
  beta:   { core: "#c8d4ff", glow: "rgba(200,212,255,0.55)", ring: "rgba(200,212,255,0.18)", label: "Бета" },
  locked: { core: "#232338", glow: "rgba(80,80,120,0.18)",   ring: "rgba(80,80,120,0.06)",  label: "Скоро" },
};
type Status = "active" | "full" | "beta" | "locked";

const LAYOUT: Record<string, { cx: number; cy: number }> = {
  "russian-history":  { cx: 0.50, cy: 0.42 }, "world-history":    { cx: 0.24, cy: 0.28 },
  "mathematics":      { cx: 0.73, cy: 0.27 }, "physics":          { cx: 0.84, cy: 0.51 },
  "chemistry":        { cx: 0.73, cy: 0.70 }, "biology":          { cx: 0.50, cy: 0.76 },
  "russian-language": { cx: 0.27, cy: 0.70 }, "literature":       { cx: 0.15, cy: 0.51 },
  "english":          { cx: 0.20, cy: 0.34 }, "social-studies":   { cx: 0.36, cy: 0.18 },
  "geography":        { cx: 0.63, cy: 0.17 }, "computer-science": { cx: 0.82, cy: 0.34 },
  "astronomy":        { cx: 0.62, cy: 0.83 },
};

const TOPICS: Record<string, string[]> = {
  "russian-history":  ["Древняя Русь","Монголы","Иван IV","Смута","Романовы","Пётр I","XIX век","Революция","СССР"],
  "world-history":    ["Античность","Средневековье","Ренессанс","Новое время","XX век","Холодная война"],
  "mathematics":      ["Алгебра","Геометрия","Анализ","Вероятность"],
  "physics":          ["Механика","Термодинамика","Электро","Квантовая"],
  "chemistry":        ["Атом","Реакции","Органика","Металлы"],
  "biology":          ["Клетка","Генетика","Эволюция","Экология","Анатомия"],
  "russian-language": ["Орфография","Пунктуация","Морфология","Синтаксис"],
  "literature":       ["Классика","XIX век","XX век","Современная","Анализ"],
  "english":          ["Грамматика","Лексика","Говорение","Письмо"],
  "social-studies":   ["Право","Экономика","Политика","Общество"],
  "geography":        ["Физическая","Климат","Страны","Экономическая"],
  "computer-science": ["Алгоритмы","Языки","Сети","БД","ИИ"],
  "astronomy":        ["Солнечная","Звёзды","Галактики","Космонавтика"],
};

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

function getStatus(id: string, progress: UserProgress[]): Status {
  if (progress.find(x => x.subject === id && x.xp_total > 0)) return "active";
  if (id === "russian-history") return "full";
  return ["world-history","mathematics","physics","chemistry","biology",
    "russian-language","literature","english","social-studies",
    "geography","computer-science","astronomy"].includes(id) ? "beta" : "locked";
}
function getR(s: Status) { return s==="full"?28:s==="active"?26:s==="beta"?20:14; }

interface GNode {
  id:string; label:string; emoji:string; status:Status;
  x:number; y:number; r:number; phase:number;
  topics:{x:number;y:number;label:string;phase:number}[];
}

function buildGraph(W:number, H:number, progress:UserProgress[]): GNode[] {
  return SUBJECTS.map(s => {
    const status=getStatus(s.id,progress), r=getR(status);
    const pos=LAYOUT[s.id]??{cx:0.5,cy:0.5};
    const cx=pos.cx*W, cy=pos.cy*H;
    const tops=(TOPICS[s.id]??[]).map((label,i,arr)=>{
      const orbitR=r*2.6+(arr.length>6?14:10);
      const angle=(i/arr.length)*Math.PI*2-Math.PI/2+(s.id.length%3)*0.4;
      return {x:cx+Math.cos(angle)*orbitR,y:cy+Math.sin(angle)*orbitR,label,phase:Math.random()*Math.PI*2};
    });
    return {id:s.id,label:s.title,emoji:s.emoji,status,x:cx,y:cy,r,phase:Math.random()*Math.PI*2,topics:tops};
  });
}

const BG_STARS=Array.from({length:120},(_,i)=>({
  x:((i*137.5)%1000)/10, y:((i*97.3+17)%1000)/10,
  r:0.15+(i%3)*0.1, a:0.2+(i%4)*0.1,
}));

function drawBg(ctx:CanvasRenderingContext2D,W:number,H:number){
  for(const s of BG_STARS){
    ctx.fillStyle=`rgba(255,255,255,${s.a})`;
    ctx.beginPath(); ctx.arc((s.x/100)*W,(s.y/100)*H,s.r,0,Math.PI*2); ctx.fill();
  }
}

function render(ctx:CanvasRenderingContext2D,nodes:GNode[],hov:string|null,t:number,W:number,H:number){
  ctx.clearRect(0,0,W,H); drawBg(ctx,W,H);
  // Constellation connections
  for(const n of nodes){
    if(n.status==="locked")continue;
    const pal=PAL[n.status], isH=n.id===hov;
    for(const tp of n.topics){
      ctx.save(); ctx.strokeStyle=pal.ring.replace(/[\d.]+\)$/,`${isH?0.3:0.08})`);
      ctx.lineWidth=isH?0.8:0.35;
      ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(tp.x,tp.y); ctx.stroke(); ctx.restore();
    }
  }
  // Topic dots
  for(const n of nodes){
    if(n.status==="locked")continue;
    const pal=PAL[n.status], isH=n.id===hov;
    for(const tp of n.topics){
      const sh=0.5+0.5*Math.sin(t*0.0006+tp.phase);
      const tr=isH?3.5+1.5*sh:2.2+0.8*sh, op=isH?(0.6+0.4*sh):(0.22+0.12*sh);
      ctx.save();
      const g=ctx.createRadialGradient(tp.x,tp.y,0,tp.x,tp.y,tr*2.5);
      g.addColorStop(0,pal.glow.replace(/[\d.]+\)$/,`${op*0.8})`)); g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(tp.x,tp.y,tr*2.5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=isH?8:4; ctx.shadowColor=pal.glow; ctx.fillStyle=pal.core; ctx.globalAlpha=op;
      ctx.beginPath(); ctx.arc(tp.x,tp.y,tr*0.45,0,Math.PI*2); ctx.fill(); ctx.restore();
      if(isH){
        ctx.save(); ctx.font="9px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle=pal.core; ctx.globalAlpha=0.85*sh; ctx.shadowColor="rgba(0,0,0,0.9)"; ctx.shadowBlur=6;
        const dx=tp.x-n.x,dy=tp.y-n.y,len=Math.sqrt(dx*dx+dy*dy)||1;
        ctx.fillText(tp.label,tp.x+dx/len*8,tp.y+dy/len*8); ctx.restore();
      }
    }
  }
  // Subject nodes
  for(const n of [...nodes].sort((a,b)=>a.r-b.r)){
    const isH=n.id===hov, sh=0.7+0.3*Math.sin(t*0.0007+n.phase);
    const pal=PAL[n.status], gR=n.r*(isH?3.8:2.4)*sh, cR=n.r*(isH?1.22:1)*sh;
    ctx.save();
    if(n.status!=="locked"||isH){
      const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,gR);
      g.addColorStop(0,pal.glow); g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,n.y,gR,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=isH?22*sh:14*sh; ctx.shadowColor=pal.glow; ctx.fillStyle=pal.core;
    ctx.beginPath(); ctx.arc(n.x,n.y,cR,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=pal.ring; ctx.lineWidth=isH?1.5:0.8; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(n.x,n.y,cR+4*sh,0,Math.PI*2); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.font=isH?"bold 12px system-ui":"10px system-ui";
    ctx.textAlign="center"; ctx.textBaseline="top";
    ctx.fillStyle=isH?"#fff":pal.core;
    ctx.globalAlpha=isH?1:(n.status==="locked"?0.3:0.65+0.35*sh);
    ctx.shadowColor="rgba(0,0,0,0.95)"; ctx.shadowBlur=10;
    ctx.fillText(n.label,n.x,n.y+cR+7); ctx.restore();
  }
}

export default function KnowledgeGraph({ className="", userProgress=[] }: Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const nodesRef=useRef<GNode[]>([]);
  const hoverRef=useRef<string|null>(null);
  const rafRef=useRef<number>(0);
  const [hoverId,setHoverId]=useState<string|null>(null);

  const init=useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const p=canvas.parentElement!;
    const W=p.clientWidth||800, H=p.clientHeight||600, dpr=window.devicePixelRatio||1;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=`${W}px`; canvas.style.height=`${H}px`;
    canvas.getContext("2d")!.scale(dpr,dpr);
    nodesRef.current=buildGraph(W,H,userProgress);
  },[userProgress]);

  useEffect(()=>{
    init(); window.addEventListener("resize",init);
    const t0=performance.now();
    function loop(now:number){
      const c=canvasRef.current,s=nodesRef.current;
      if(c&&s.length){
        render(c.getContext("2d")!,s,hoverRef.current,now-t0,c.clientWidth,c.clientHeight);
      }
      rafRef.current=requestAnimationFrame(loop);
    }
    rafRef.current=requestAnimationFrame(loop);
    return()=>{ cancelAnimationFrame(rafRef.current); window.removeEventListener("resize",init); };
  },[init]);

  const onMM=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c)return;
    const r=c.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    let cl:GNode|null=null, cd=55;
    for(const n of nodesRef.current){ const d=Math.hypot(n.x-mx,n.y-my); if(d<cd){cd=d;cl=n;} }
    const id=cl?.id??null;
    if(id!==hoverRef.current){hoverRef.current=id;setHoverId(id);}
  },[]);

  const onML=useCallback(()=>{hoverRef.current=null;setHoverId(null);},[]);

  const onCk=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c)return;
    const r=c.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
    for(const n of nodesRef.current){
      if(Math.hypot(n.x-mx,n.y-my)<n.r*2){ window.location.href=`/learn/${n.id}`; return; }
    }
  },[]);

  const tPos=useRef({x:0,y:0});
  const onTS=useCallback((e:React.TouchEvent)=>{tPos.current={x:e.touches[0].clientX,y:e.touches[0].clientY};},[]);
  const onTM=useCallback((e:React.TouchEvent)=>{
    const c=canvasRef.current; if(!c)return;
    const r=c.getBoundingClientRect(),mx=e.touches[0].clientX-r.left,my=e.touches[0].clientY-r.top;
    let cl:GNode|null=null,cd=65;
    for(const n of nodesRef.current){const d=Math.hypot(n.x-mx,n.y-my);if(d<cd){cd=d;cl=n;}}
    const id=cl?.id??null;
    if(id!==hoverRef.current){hoverRef.current=id;setHoverId(id);}
  },[]);
  const onTE=useCallback((e:React.TouchEvent)=>{
    const dx=e.changedTouches[0].clientX-tPos.current.x, dy=e.changedTouches[0].clientY-tPos.current.y;
    if(Math.hypot(dx,dy)<10&&hoverRef.current){ window.location.href=`/learn/${hoverRef.current}`; }
  },[]);

  const hoverNode=nodesRef.current.find(n=>n.id===hoverId);

  return (
    <div className={`relative w-full h-full ${className}`} style={{background:"#06060f",borderRadius:"inherit"}}>
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        {(Object.entries(PAL) as [Status,typeof PAL[Status]][]).map(([k,v])=>(
          <div key={k} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:v.core,boxShadow:`0 0 5px ${v.core}`}}/>
            <span className="text-[10px] text-white/40 font-medium">{v.label}</span>
          </div>
        ))}
      </div>
      <p className="absolute top-4 left-4 z-10 text-[10px] text-white/25 pointer-events-none md:hidden">Нажми на звезду</p>
      {hoverId && hoverNode && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/15"
          style={{background:"rgba(6,6,15,0.90)",backdropFilter:"blur(12px)"}}>
          <span className="text-lg">{hoverNode.emoji}</span>
          <span className="text-sm font-semibold text-white">{hoverNode.label}</span>
          <a href={`/learn/${hoverId}`} className="text-xs font-bold px-2.5 py-1 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
            Учиться →
          </a>
        </div>
      )}
      <canvas ref={canvasRef} onMouseMove={onMM} onMouseLeave={onML} onClick={onCk}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        className="block w-full h-full" style={{cursor:hoverId?"pointer":"default"}}/>
    </div>
  );
}
