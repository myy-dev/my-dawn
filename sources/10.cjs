'use strict';

// Fireworks over still water: a 12-second show (eight shells and a five-shell finale) that plays twice
// per 24-second loop, so it lines up with the 24-second ambience. Ported from the HyperFrames scene.
const W = 1920, H = 1080, horizon = 700, showSeconds = 12, loopSeconds = 24;
// Every slow motion (stars, shore lights, ripples) turns a whole number of times per show, so the loop is seamless.
const K = Math.PI * 2 / showSeconds;

function createScene(createCanvas) {
const sky=createCanvas(W,horizon);const s=sky.getContext('2d');
// A 1/8-size copy of the sky; scaling it back up blurs it for the soft light on the water.
const soft=createCanvas(W/8,horizon/8);const sg=soft.getContext('2d');
let seed=271828;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const stars=Array.from({length:260},()=>({x:rnd()*W,y:rnd()*(horizon-70),r:.3+rnd()*1.3,a:.12+rnd()*.55,phase:rnd()*6.28}));
const colors=['255,192,96','255,105,167','102,232,223','184,162,255','232,238,255'];
const moon={x:1720,y:120};
// peony: projected sphere. ring: tilted circle. willow: slow, long, drooping trails. strobe: sparks blink late in life.
const shots=[
{t:1.0,x:960,y:300,r:300,c:0,type:'peony'},
{t:1.5,x:520,y:340,r:280,c:1,type:'ring',tilt:.45,rot:-.35},
{t:2.6,x:1340,y:290,r:300,c:2,type:'peony'},
{t:3.9,x:820,y:280,r:340,c:0,type:'willow'},
{t:5.2,x:400,y:320,r:270,c:3,type:'strobe'},
{t:6.1,x:1250,y:390,r:260,c:2,type:'ring',tilt:.6,rot:.4},
{t:7.3,x:640,y:270,r:320,c:1,type:'peony'},
{t:8.1,x:1150,y:250,r:330,c:4,type:'strobe'},
// Finale: five shells inside one second, then the sky settles before the loop point.
{t:9.3,x:960,y:320,r:370,c:0,type:'willow'},
{t:9.55,x:500,y:330,r:300,c:2,type:'peony'},
{t:9.75,x:1420,y:330,r:290,c:1,type:'peony'},
{t:10.0,x:740,y:220,r:280,c:3,type:'ring',tilt:.5,rot:.2},
{t:10.15,x:1200,y:400,r:260,c:4,type:'strobe'}];
for(const b of shots){
const ring=b.type==='ring', willow=b.type==='willow', n=ring?170:willow?230:270;
b.k=willow?.8:1.1;
// Front/back sparks of a sphere project toward the center, so a peony fills in instead of reading as a hoop.
b.p=Array.from({length:n},(_,i)=>{
const angle=i/n*Math.PI*2+rnd()*.06, depth=rnd()*2-1, ember=!ring&&i%4===0;
let ux=Math.cos(angle),uy=Math.sin(angle),v;
if(ring){v=.95+rnd()*.1;uy*=b.tilt;const cr=Math.cos(b.rot),sr=Math.sin(b.rot);[ux,uy]=[ux*cr-uy*sr,ux*sr+uy*cr];}
else v=ember?.025+rnd()*.38:Math.sqrt(1-depth*depth)*(.72+rnd()*.35);
return {ux:ux*v,uy:uy*v,
life:willow?3.2+rnd()*1.3:ember?2.1+rnd()*1.4:1.8+rnd()*1.5,phase:rnd()*7,
thick:willow?.5+rnd()*.9:ember?.65+rnd()*.8:.65+rnd()*1.6,
gravity:willow?40+rnd()*12:ember?10+rnd()*10:22+rnd()*14,
tail:willow?.35+rnd()*.25:.12+rnd()*.15};});
b.end=Math.max(...b.p.map(q=>q.life));}
const lights=Array.from({length:46},()=>({x:rnd()*W,y:horizon-3-rnd()*6,a:.25+rnd()*.5,warm:rnd()<.75,phase:rnd()*6.28}));
const hill=x=>horizon-30+Math.sin(x*.0042+1.3)*16+Math.sin(x*.011)*8, shore=x=>horizon-16+Math.sin(x*.019)*4+Math.sin(x*.043)*3;
function line(g,x,y,px,py,color,alpha,width){g.strokeStyle=`rgba(${color},${Math.max(0,alpha)})`;g.lineWidth=width;g.beginPath();g.moveTo(px,py);g.lineTo(x,y);g.stroke();}
function glow(g,x,y,r,c,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${c},${a})`);gr.addColorStop(.2,`rgba(${c},${a*.3})`);gr.addColorStop(1,`rgba(${c},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function renderAt(ctx,t){
const bg=s.createLinearGradient(0,0,0,horizon);bg.addColorStop(0,'#020613');bg.addColorStop(.6,'#081326');bg.addColorStop(1,'#1a2438');s.fillStyle=bg;s.fillRect(0,0,W,horizon);
for(const st of stars){s.fillStyle=`rgba(208,224,255,${st.a*(.75+.25*Math.sin(t*K+st.phase))})`;s.beginPath();s.arc(st.x,st.y,st.r,0,7);s.fill();}
glow(s,moon.x,moon.y,70,'157,188,235',.09);s.fillStyle='#d2dbea';s.beginPath();s.arc(moon.x,moon.y,19,0,7);s.fill();s.fillStyle='#040b19';s.beginPath();s.arc(moon.x+9,moon.y-6,18,0,7);s.fill();
// Fireworks fade over the last 0.8 s so the loop restarts from a dark sky.
const A=t>11.2?Math.max(0,(12-t)/.8):1;
s.fillStyle='#0b1323';s.beginPath();s.moveTo(0,horizon);for(let x=0;x<=W;x+=24)s.lineTo(x,hill(x));s.lineTo(W,horizon);s.fill();
// Smoke left by each shell drifts with the wind and thins out.
for(const b of shots){const age=t-b.t;if(age<.3||age>8)continue;const m=Math.min(1,(age-.3)/1.2)*Math.exp(-age/4)*A;
glow(s,b.x+age*14,b.y+10-age*3,b.r*(.55+age*.12),'92,104,128',.05*m);}
s.globalCompositeOperation='lighter';
for(const b of shots){let age=t-b.t;const c=colors[b.c];if(age<-.95||age>b.end)continue;
if(age<0){const u=(age+.95)/.95, pos=v=>{const e=1-(1-v)*(1-v);return [b.x-45*(1-e)+Math.sin(v*17+b.x)*3,horizon-5+(b.y-horizon+5)*e];};
for(let k=8;k>=1;k--){const v=u-k*.03;if(v<0)continue;const [tx,ty]=pos(v);s.fillStyle=`rgba(${c},${.55*(1-k/9)*A})`;s.fillRect(tx-1,ty-1,2,2);}
const [x,y]=pos(u),[px,py]=pos(Math.max(0,u-.06));line(s,x,y,px,py,'255,240,215',.85*A,1.6);glow(s,x,y,14,c,.6*A);continue;}
glow(s,b.x,b.y,b.r*1.3,c,.05*Math.exp(-age*1.3)*A);glow(s,b.x+age*18,b.y-12,100+age*60,c,.015*Math.exp(-age*.7)*A);
if(age<.25)glow(s,b.x,b.y,b.r*.3,c,.5*Math.pow(1-age/.25,2)*A);
glow(s,b.x+age*8,b.y+age*age*14,38+age*14,c,.12*Math.exp(-age*2.5)*A);
const strobe=b.type==='strobe', willow=b.type==='willow';
for(const q of b.p){if(age>q.life)continue;const life=Math.max(0,1-age/q.life);
const ex=(1-Math.exp(-age*b.k))*b.r, tail=willow?q.tail+age*.09:(q.tail+Math.min(age,1)*.09)*(.35+.65*life), old=Math.max(0,age-tail), prev=(1-Math.exp(-old*b.k))*b.r;
let x=b.x+q.ux*ex+age*8,y=b.y+q.uy*ex+age*age*q.gravity;
let px=b.x+q.ux*prev+old*8,py=b.y+q.uy*prev+old*old*q.gravity;
let a=(willow?.8*Math.pow(life,.45):Math.pow(life,.7)*(.65+.35*Math.sin(age*18+q.phase)**2))*A;
const lit=strobe&&age>.7&&Math.sin(age*31+q.phase*9)>.35;
if(strobe&&age>.7&&!lit)a*=.08;
if(!willow&&!strobe&&age>1.3)a*=.45+.55*Math.sin(age*23+q.phase*5)**2;
// Soft halo ramps in over 0.4 s so a fresh shell doesn't open as a white blob.
line(s,x,y,px,py,c,a*.13*Math.min(1,age/.4),q.thick*6);
if(willow){// Willow trails pass through their midpoint so they bend with gravity.
const mid=(age+old)/2, me=(1-Math.exp(-mid*b.k))*b.r, mx=b.x+q.ux*me+mid*8, my=b.y+q.uy*me+mid*mid*q.gravity;
line(s,mx,my,px,py,c,a*.6,q.thick);line(s,x,y,mx,my,c,a,q.thick);}
else line(s,x,y,px,py,c,a,q.thick);if(age<.65){s.fillStyle=`rgba(255,249,222,${a*.5})`;s.fillRect(x,y,1.8,1.8);}
if(lit){s.fillStyle=`rgba(255,250,235,${a})`;s.fillRect(x-1.3,y-1.3,2.6,2.6);}
if(willow&&age>.8&&q.phase>4){line(s,x-2,y+9,x,y,c,a*.3,.6);}
}
}
s.globalCompositeOperation='source-over';
// A distant shore, kept low and dark.
s.fillStyle='#040a13';s.beginPath();s.moveTo(0,horizon);for(let x=0;x<=W;x+=18)s.lineTo(x,shore(x));s.lineTo(W,horizon);s.fill();
for(const l of lights){if(l.y<shore(l.x)+2)continue;s.fillStyle=`rgba(${l.warm?'255,196,130':'190,215,255'},${l.a*(.85+.15*Math.sin(t*2*K+l.phase))})`;s.fillRect(l.x,l.y,1.6,1.6);}
ctx.fillStyle='#030913';ctx.fillRect(0,0,W,H);ctx.drawImage(sky,0,0);
// Reflection: rows mirror the sky (compressed, since the water band is short), each row shifted by the ripple.
const span=640;ctx.globalAlpha=.6;for(let y=horizon;y<H;y+=2){let d=(y-horizon)/(H-horizon),sy=Math.max(0,horizon-d*span),dx=Math.sin(y*.2+t*4*K)*(3+d*15)+Math.sin(y*.071-t*2*K)*8;ctx.drawImage(sky,0,sy,W,2,dx,y,W,2);}
// Soft spill: the blurred sky, mirrored with the same compression, added on top.
sg.drawImage(sky,0,0,soft.width,soft.height);const k=(H-horizon)/span;
ctx.save();ctx.beginPath();ctx.rect(0,horizon,W,H-horizon);ctx.clip();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35;
ctx.setTransform(1,0,0,-k,0,horizon*(1+k));ctx.drawImage(soft,0,0,W,horizon);ctx.restore();
ctx.globalAlpha=1;const water=ctx.createLinearGradient(0,horizon,0,H);water.addColorStop(0,'rgba(3,10,20,.1)');water.addColorStop(1,'rgba(2,7,15,.55)');ctx.fillStyle=water;ctx.fillRect(0,horizon,W,H-horizon);
for(let i=0;i<45;i++){let y=horizon+14+i*(H-horizon-14)/45;ctx.strokeStyle=`rgba(110,156,195,${.025+.02*Math.sin(i*5+t*2*K)})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
const vignette=ctx.createRadialGradient(960,430,320,960,440,1120);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
}

  return (ctx, phase) => {
    const u = ((phase % 1) + 1) % 1;
    renderAt(ctx, (u * loopSeconds) % showSeconds);
  };
}

module.exports = {
  title: '물 위로 터지는 불꽃',
  slug: 'fireworks-over-still-water',
  sound: 'fireworks',
  posterPhase: 10.4 / 24,
  createScene,
};
