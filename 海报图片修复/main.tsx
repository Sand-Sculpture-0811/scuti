import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {people, questions, score, COUNT, VERSION} from './scoring';
import './style.css';
const KEY=`scu-${VERSION}`;
const groups=[{name:'温柔连接派',en:'CONNECTION',tone:'green',ids:[0,6,12,15],desc:'把目光留给猫、朋友，也留给自己。'},{name:'生活探索派',en:'EXPLORATION',tone:'gold',ids:[1,3,7,10],desc:'从最后一分钟，跑向下一份小快乐。'},{name:'自由时区派',en:'OWN RHYTHM',tone:'purple',ids:[4,8,9,14],desc:'课表之外，每个人都有自己的时钟。'},{name:'校园应对派',en:'CAMPUS TACTICS',tone:'blue',ids:[2,5,11,13],desc:'用自己的办法，应对大学生活的小关卡。'}];
const groupFor=(i:number)=>groups.find(g=>g.ids.includes(i))!;
const asset=(i:number)=>`${import.meta.env.BASE_URL}${people[i].image}`;
function initial(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x?.version===VERSION&&Array.isArray(x.answers)&&x.answers.length===COUNT&&x.answers.every((v:number)=>Number.isInteger(v)&&v>=0&&v<=5))return {answers:x.answers as number[],index:Number.isInteger(x.index)&&x.index>=0&&x.index<COUNT?x.index:0};}catch{}return{answers:Array(COUNT).fill(0) as number[],index:0};}
function Portrait({i,className='',eager=false}:{i:number,className?:string,eager?:boolean}){return <img className={`portrait ${className}`} src={asset(i)} alt={`${people[i].name} ${people[i].id} 人格小人`} loading={eager?'eager':'lazy'} width="600" height="600"/>}
function App(){
 const [saved]=useState(initial),[answers,setAnswers]=useState(saved.answers),[index,setIndex]=useState(saved.index),[page,setPage]=useState<'home'|'quiz'|'result'>('home'),[filter,setFilter]=useState('全部'),[detail,setDetail]=useState<number|null>(null),[resetOpen,setResetOpen]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[storageOK,setStorageOK]=useState(true);
 const done=answers.filter(Boolean).length,result=done===COUNT?score(answers):null;
 const modal=useRef<HTMLDialogElement>(null),resetModal=useRef<HTMLDialogElement>(null);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify({version:VERSION,answers,index}));setStorageOK(true)}catch{setStorageOK(false)}},[answers,index]);
 useEffect(()=>{if(detail!==null)modal.current?.showModal();else modal.current?.close()},[detail]);
 useEffect(()=>{if(resetOpen)resetModal.current?.showModal();else resetModal.current?.close()},[resetOpen]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[page]);
 useEffect(()=>{if(page==='quiz')document.getElementById('question-title')?.focus({preventScroll:true})},[page,index]);
 useEffect(()=>{if(page!=='quiz'||detail!==null||resetOpen)return;const listener=(e:KeyboardEvent)=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;if(/^[1-5]$/.test(e.key)){e.preventDefault();choose(Number(e.key));}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[page,index,detail,resetOpen]);
 function choose(v:number){setAnswers(a=>a.map((x,i)=>i===index?v:x));setNotice('')}
 function start(){if(done===COUNT){setPage('result');return}setPage('quiz')}
 function reset(){setAnswers(Array(COUNT).fill(0));setIndex(0);setResetOpen(false);setNotice('');setPage('quiz')}
 function next(){if(index<COUNT-1)setIndex(index+1);else if(result)setPage('result');else setIndex(answers.findIndex(x=>!x))}
 async function download(){
  setBusy(true);setNotice('');
  const objectUrls:string[]=[];
  try{
   if(!result)throw Error('未完成作答');
   await document.fonts.ready;
   // Draw images directly onto Canvas: avoids SVG foreignObject image loss in Safari/WeChat.
   const portraits=await Promise.all(result.order.slice(0,3).map(async i=>{
    const response=await fetch(asset(i));
    if(!response.ok)throw Error('人物图片未加载');
    const blob=await response.blob();
    if(!blob.type.startsWith('image/'))throw Error('人物图片地址无效');
    const url=URL.createObjectURL(blob);objectUrls.push(url);
    const img=new Image();img.src=url;await img.decode();
    if(!img.naturalWidth)throw Error('人物图片解码失败');
    return img;
   }));
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=3600;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('浏览器不支持图片绘制');
   const lead=result.order[0],person=people[lead];
   const palette={green:['#407c67','#eaf3eb'],gold:['#a27318','#faf1dc'],purple:['#796092','#f0eaf5'],blue:['#387f96','#e7f2f6']} as const;
   const [tone,soft]=palette[groupFor(lead).tone as keyof typeof palette];
   const font='"PingFang SC","Microsoft YaHei",sans-serif';
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1080,3600);
   function text(s:string,x:number,y:number,size=28,color='#293943',weight=400){ctx!.font=`${weight} ${size}px ${font}`;ctx!.fillStyle=color;ctx!.fillText(s,x,y);}
   function wrap(s:string,x:number,y:number,width:number,size=27,line=45,color='#56645e'){
    ctx!.font=`400 ${size}px ${font}`;let part='';
    for(const char of s){if(ctx!.measureText(part+char).width>width&&part){text(part,x,y,size,color);y+=line;part='';}part+=char;}
    if(part){text(part,x,y,size,color);y+=line;}return y;
   }
   function portrait(img:HTMLImageElement,x:number,y:number,size:number){
    const ratio=Math.min(size/img.naturalWidth,size/img.naturalHeight),w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;
    ctx!.drawImage(img,x+(size-w)/2,y+(size-h)/2,w,h);
   }
   ctx.fillStyle=soft;ctx.fillRect(0,0,1080,650);
   text('川大人格图鉴  /  CAMPUS PERSONA CLUB',65,75,23,tone,600);
   text(groupFor(lead).name,65,140,24,tone);
   text(person.id,65,235,person.id.length>12?48:62,tone,750);
   text(person.name,65,315,55,'#293943',750);
   wrap(person.tagline,65,385,510,28,44,tone);
   text(person.traits.join(' · '),65,520,23,tone);
   portrait(portraits[0],600,175,435);
   text(`PERSONA ${String(lead+1).padStart(2,'0')} / 16`,695,610,18,tone,600);
   let y=720;
   text('你的校园生活，有这一面。',65,y,34,'#293943',700);y+=58;
   y=wrap(person.description,65,y,950,27,47);y+=20;
   const adviceTop=y;ctx.fillStyle='#fcf6e7';ctx.fillRect(65,adviceTop,950,180);
   text('写给你的生活便签',88,y+42,24,'#96762b',600);
   const adviceEnd=wrap(person.advice,88,y+88,900,26,43,'#6d664e');y=Math.max(adviceTop+205,adviceEnd+30);
   if(result.tied.length>1){y=wrap('本次存在同分，按直接行为得分及固定顺序选出展示人格。',65,y,950,21,34);y+=15;}
   text('你还有这些侧面',65,y,33,'#293943',700);y+=30;
   result.order.slice(1,3).forEach((i,k)=>{
    const x=65+k*485;ctx.fillStyle='#f4f7f3';ctx.fillRect(x,y,465,255);
    portrait(portraits[k+1],x+8,y+26,200);
    text(people[i].id,x+220,y+65,people[i].id.length>12?22:27,tone,650);
    text(people[i].name,x+220,y+115,26,'#293943',650);
    text(`${result.percent[i]}%`,x+220,y+180,40,tone,700);
   });y+=310;
   text('16型相对权重',65,y,33,'#293943',700);text('合计 100%',865,y,22,tone);y+=55;
   for(const i of result.order){
    text(people[i].name,65,y,24);text(people[i].id,295,y,19,'#6f7e85');
    ctx.fillStyle='#edf1ea';ctx.fillRect(500,y-18,435,11);
    ctx.fillStyle=palette[groupFor(i).tone as keyof typeof palette][0];ctx.fillRect(500,y-18,435*result.percent[i]/100,11);
    text(`${result.percent[i]}%`,955,y,23,tone,600);y+=48;
   }
   y+=20;y=wrap('试验性娱乐测试 · 相对权重不是心理学概率 · 非四川大学官方产品',65,y,950,20,33);y+=20;
   ctx.strokeStyle='#e5e9e7';ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(1015,y);ctx.stroke();y+=45;
   text('校园很大，每一种你都有位置。',65,y,24,tone,600);y+=50;
   const output=document.createElement('canvas');output.width=1080;output.height=Math.ceil(y);
   const outputContext=output.getContext('2d');if(!outputContext)throw Error('无法生成海报');
   outputContext.drawImage(canvas,0,0);
   const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(Error('导出失败')),'image/png'));
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.download=`川大人格-${person.id}.png`;link.href=url;document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),60000);
   setNotice('含人物图片的海报已生成；手机若打开图片预览，可长按保存。');
  }catch{setNotice('人物图片加载或海报生成失败，请检查网络后重试。本次未下载缺图海报。')}
  finally{objectUrls.forEach(url=>URL.revokeObjectURL(url));setBusy(false)}
 }
 const displayed=filter==='全部'?people.map((_,i)=>i):groups.find(g=>g.name===filter)!.ids;
 const lead=result?.order[0]??0;
 return <><header className="header"><a className="brand" href="#" onClick={e=>{e.preventDefault();setPage('home')}}><span className="brand-mark">川</span><span>川大人格图鉴<small>CAMPUS PERSONA CLUB</small></span></a><nav aria-label="主导航"><a href="#atlas" onClick={()=>setPage('home')}>人格图鉴</a><a href="#about" onClick={()=>setPage('home')}>关于测试</a><button className="nav-cta" onClick={start}>{done===COUNT?'我的结果':done?'继续测试':'开始测试'} <span>↗</span></button></nav></header>
 <main>{page==='home'?<>
 <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="live-dot"/> SCU CAMPUS PERSONAS · 2026 EDITION</p><h1>在川大，<br/>你是哪一种<br/><em>校园玩家？</em></h1><p className="hero-description">从长桥上的极限冲刺，到围合里的猫咪偶遇。<br/>把日常翻开，遇见一个有点熟悉、又有点好笑的你。</p><button className="primary hero-button" onClick={start}>{done===COUNT?'翻开我的结果':done?'继续我的探索':'找到我的校园人格'} <span>↗</span></button><div className="hero-facts"><span><b>16</b> 种校园人格</span><span><b>{COUNT}</b> 道行为小题</span><span><b>6–8</b> 分钟</span></div>{done>0&&<p className="saved-note">此设备已保存 {done}/{COUNT} 题 <button className="text-button" onClick={()=>setResetOpen(true)}>重新开始</button></p>}</div>
 <div className="hero-world"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="world-star star-one">✦</span><span className="world-star star-two">✧</span><div className="hero-figure figure-left"><Portrait i={1} eager/><span>Runner <b>长桥奔跑者</b></span></div><div className="hero-figure figure-main"><Portrait i={0} eager/><span>Cater <b>围合喂猫人</b></span></div><div className="hero-figure figure-right"><Portrait i={13} eager/><span>AIer <b>AI依赖者</b></span></div><div className="floating-note"><i/> 普通的一天，<br/><strong>也很有你自己的风格。</strong></div><div className="world-caption">16 CHARACTERS. COUNTLESS WAYS TO BE YOU.</div></div></section>
 <div className="manifesto-strip"><span>不是标准答案，<b>是校园生活的切片。</b></span><span>原创校园小人 / 只在本机保存 / 非官方娱乐测试</span></div>
 <section className="atlas section" id="atlas"><div className="section-heading"><div><p className="eyebrow">MEET YOUR CAMPUS PEOPLE</p><h2>你的同类，<span>在这里。</span></h2></div><p>有人把快乐放在烤肠里，有人把时间留给深夜。<br/>点击小人，先认识这16种校园生活方式。</p></div><div className="filters" role="group" aria-label="人格分类">{['全部',...groups.map(g=>g.name)].map(name=><button className={filter===name?'active':''} key={name} aria-pressed={filter===name} onClick={()=>setFilter(name)}>{name}{name==='全部'&&<small>16</small>}</button>)}</div><div className="character-grid">{displayed.map(i=><button className={`character-card ${groupFor(i).tone}`} key={people[i].id} onClick={()=>setDetail(i)}><div className="card-top"><span>{groupFor(i).name}</span><small>NO. {String(i+1).padStart(2,'0')}</small></div><div className="portrait-stage"><Portrait i={i}/><span className="card-arrow">↗</span></div><div className="card-copy"><p className="english">{people[i].id}</p><h3>{people[i].name}</h3><p className="card-line">{people[i].tagline}</p></div></button>)}</div></section>
 <section id="about" className="about section"><div><p className="eyebrow">A LITTLE LESS LABEL. A LITTLE MORE YOU.</p><h2>不用成为谁。<br/>如实回答，<em>就很有趣。</em></h2><p>这是一个围绕川大校园日常设计的娱乐图鉴。<br/>人物名称是梗，结果不是对能力、人品或经济条件的判断。</p></div><div className="about-steps"><article><span>01</span><div><h3>回想最近一个月</h3><p>按真实发生的频率回答。没有经历过的行为，可以选“从不”。</p></div></article><article><span>02</span><div><h3>看见自己的多个侧面</h3><p>具体行为与反向题共同计分，展示主导人格、两个侧面和完整相对权重。</p></div></article><article><span>03</span><div><h3>把小人带走</h3><p>保存你的中英双语人格海报。答案仅存本机，无需登录，也不会上传。</p></div></article></div></section>
 <section className="end-cta"><div><p className="eyebrow">YOUR CAMPUS STORY STARTS HERE</p><h2>这一次，轮到你入图鉴了。</h2></div><button className="primary" onClick={start}>发现我的人格 <span>↗</span></button></section>
 </>:page==='quiz'?<section className="quiz-shell"><aside className="quiz-aside"><p className="eyebrow">A MOMENT FOR YOURSELF</p><h2>不用想得太久，<br/>选最像你的。</h2><Portrait i={groups[Math.floor(index/12)%4].ids[Math.floor(index/3)%4]} eager/><p>最近一个月 · 真实频率<br/>没有经历过，可以选“从不”</p><button className="text-button" onClick={()=>setPage('home')}>← 暂存并返回首页</button></aside><div className="question-panel"><div className="quiz-topline"><span>校园行为观察</span><span><b>{String(index+1).padStart(2,'0')}</b> / {COUNT}</span></div><progress aria-label="已完成题数" value={done} max={COUNT}/><p className="eyebrow question-kicker">QUESTION {String(index+1).padStart(2,'0')}</p><h2 tabIndex={-1} id="question-title">{questions[index].text}</h2><p className="question-help">选择发生的频率，而不是你希望自己是什么样。</p><div className="options" role="group" aria-label="选择频率">{['从不','很少','有时','经常','总是'].map((s,i)=><button key={s} className={answers[index]===i+1?'selected':''} aria-pressed={answers[index]===i+1} onClick={()=>choose(i+1)}><span className="option-key">{i+1}</span><b>{s}</b><span className="option-ring">{answers[index]===i+1?'✓':''}</span></button>)}</div><div className="question-nav"><button className="secondary" disabled={index===0} onClick={()=>setIndex(index-1)}>← 上一题</button><button className="primary" disabled={!answers[index]} onClick={next}>{index===COUNT-1?(result?'生成我的人格':'补齐未答题目'):'下一题'} <span>→</span></button></div><div className="save-status" role="status"><span className={storageOK?'live-dot':'warning-dot'}/>{storageOK?`已自动保存 · 完成 ${done}/${COUNT} 题`:'本机存储不可用，请勿关闭页面'}<small>键盘 1–5 也能选择</small></div></div></section>:
 result&&<section className={`result-page ${groupFor(lead).tone}`}><div className="result-navigation"><button className="text-button" onClick={()=>setPage('home')}>← 回到图鉴</button><span>YOUR CAMPUS PERSONA / 2026</span></div><div id="share-poster" className="share-poster"><div className="result-hero"><div className="result-copy"><p className="eyebrow">川大人格图鉴 · 我的校园人格</p><span className="result-category">{groupFor(lead).name} / {groupFor(lead).en}</span><p className="result-en">{people[lead].id}</p><h1>{people[lead].name}</h1><p className="result-tagline">“{people[lead].tagline}”</p><div className="trait-tags">{people[lead].traits.map(t=><span key={t}>{t}</span>)}</div></div><div className="result-figure"><div className="result-orbit"/><Portrait i={lead} eager/><span className="figure-number">PERSONA {String(lead+1).padStart(2,'0')} / 16</span></div></div><div className="result-body"><div className="result-story"><div><p className="eyebrow">THIS SOUNDS A LITTLE LIKE YOU</p><h2>你的校园生活，有这一面。</h2><p className="story">{people[lead].description}</p></div><aside className="advice"><span>写给你的生活便签</span><p>{people[lead].advice}</p><b>TAKE IT EASY. BE YOURSELF.</b></aside></div><div className="result-context">{result.tied.length>1?'这次有多个类型同分，展示人格由直接行为得分及固定顺序选出。':result.mixed?'你的前两种倾向比较接近：你可以同时拥有不止一种校园生活方式。':'这是这份答卷中相对更突出的行为倾向，不是对你全部生活的定义。'}{result.flat&&<span> 本次每题选项相同，区分信息有限，仍保留你的完整结果。</span>}{result.tensionCount>=4&&<span> 部分正反向回答存在差异，你也可以回看题目，确认是否符合实际。</span>}</div><div className="section-heading compact"><div><p className="eyebrow">THERE IS MORE TO YOU</p><h2>你还有这些侧面。</h2></div><p>原始16型占比，不对前三重新归一化</p></div><div className="runners">{result.order.slice(1,3).map((i,k)=><div className={`runner-card ${groupFor(i).tone}`} key={i}><Portrait i={i} eager/><div><small>侧面 0{k+2}</small><p className="english">{people[i].id}</p><h3>{people[i].name}</h3><b>{result.percent[i]}<small>%</small></b></div></div>)}</div><div className="distribution"><div className="section-heading compact"><div><p className="eyebrow">YOUR FULL SPECTRUM</p><h2>16型相对权重</h2></div><span>合计 100%</span></div><div className="bars">{result.order.map(i=><div className={`bar-row ${groupFor(i).tone}`} key={i}><div className="bar-label"><span>{people[i].name}</span><small>{people[i].id}</small></div><div className="bar-track"><i style={{width:result.percent[i]+'%'}}/></div><b>{result.percent[i]}%</b></div>)}</div><p className="fineprint">百分比表示本次答卷中各类型的相对权重，不是心理学概率。评分仍为试验性，未经真实人群效度验证。</p></div><div className="poster-footer"><b>川大人格图鉴 <span>CAMPUS PERSONA CLUB</span></b><span>48题 · 非官方娱乐测试 · 答案仅存本机</span></div></div></div><div className="result-actions"><button className="primary" disabled={busy} onClick={download}>{busy?'正在制作海报…':'保存我的人格海报'} <span>↓</span></button><button className="secondary" onClick={()=>{setIndex(0);setPage('quiz')}}>回看我的回答</button><button className="text-button" onClick={()=>setResetOpen(true)}>重新测试</button></div><p className="download-status" role="status">{notice}</p>{import.meta.env.DEV&&<details className="debug"><summary>开发评分面板</summary><pre>{JSON.stringify(result,null,2)}</pre></details>}</section>}</main>
 <footer className="footer"><div><a className="brand" href="#" onClick={()=>setPage('home')}><span className="brand-mark">川</span><span>川大人格图鉴<small>CAMPUS PERSONA CLUB</small></span></a><p>校园很大，每一种你都有位置。</p></div><div><p>非四川大学官方产品，与 MBTI 无关联，不是人格诊断。</p><p>人物名称为校园幽默，不鼓励违规，也不据此判断能力、经济条件或人品。</p><small>2026 · EXPERIMENTAL EDITION 02 · LOCAL FIRST</small></div></footer>
 <dialog ref={modal} className="person-dialog" onCancel={()=>setDetail(null)} onClick={e=>{if(e.target===e.currentTarget)setDetail(null)}}>{detail!==null&&<div className={`dialog-content ${groupFor(detail).tone}`}><button className="close-dialog" aria-label="关闭人物介绍" onClick={()=>setDetail(null)}>×</button><div className="dialog-image"><Portrait i={detail} eager/></div><div className="dialog-copy"><p className="eyebrow">{groupFor(detail).name}</p><p className="english">{people[detail].id}</p><h2>{people[detail].name}</h2><p className="dialog-tagline">{people[detail].tagline}</p><div className="trait-tags">{people[detail].traits.map(t=><span key={t}>{t}</span>)}</div><p className="story">{people[detail].description}</p><p className="dialog-advice">{people[detail].advice}</p><button className="primary" onClick={()=>{setDetail(null);start()}}>看看我是哪种人格 ↗</button></div></div>}</dialog>
 <dialog ref={resetModal} className="reset-dialog" onCancel={()=>setResetOpen(false)}><p className="eyebrow">A FRESH START</p><h2>重新开始这次探索？</h2><p>将清除本次48题的回答和结果。</p><div className="question-nav"><button className="secondary" onClick={()=>setResetOpen(false)}>保留当前回答</button><button className="primary" onClick={reset}>重新开始</button></div></dialog>
 </>;
}
createRoot(document.getElementById('root')!).render(<App/>);
