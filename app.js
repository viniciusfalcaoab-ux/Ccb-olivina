(()=>{
const C=window.CONFIG,$=s=>document.querySelector(s);
if(!C||/COLE_AQUI/.test(C.URL)){document.body.innerHTML='<div class="cfg"><h2>Falta configurar o banco</h2><p>Abra o arquivo config.js e cole a URL e a chave do Supabase (passo 3 do LEIA-ME).</p></div>';return}
const sb=supabase.createClient(C.URL,C.KEY);
const MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ST={agendada:'Agendada',realizada:'Realizada',cancelada:'Cancelada'};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoje=new Date(),HM=hoje.getFullYear()*12+hoje.getMonth()+1;
const S={y:hoje.getFullYear(),m:hoje.getMonth()+1,tab:'agenda',v:[],ad:{},ov:null,adm:false,day:null,load:true,err:null,hist:null};
const closed=()=>S.ov!==null?S.ov:S.y*12+S.m<HM;
const P={agenda:'M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01',calendario:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',historico:'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4',admin:'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24"><path d="${P[n]}"/></svg>`;
const msgErr=e=>/Mês encerrado/.test(e.message||'')?'Este mês está encerrado. Reabra o mês para alterar.':'Não foi possível concluir. Tente de novo.';

function toast(t,e){const x=$('#tt');x.textContent=t;x.className='on'+(e?' er':'');clearTimeout(toast.t);toast.t=setTimeout(()=>x.className='',3200)}
function modal(h){const m=$('#md');m.innerHTML='<div class="sheet">'+h+'</div>';m.classList.add('on')}
function close(){$('#md').classList.remove('on');if(ask.r){const r=ask.r;ask.r=null;r(false)}}
const ask=(t,b)=>new Promise(r=>{modal(`<h3>${t}</h3><div class="adm" style="margin-top:14px"><button class="btn" data-a="yes">${b}</button><button class="bt" data-a="no">Voltar</button></div>`);ask.r=r});

function card(v){const p=v.participacoes||[],ok=!closed()&&v.status==='agendada';
 const lista=p.length?`<ol>${p.map(x=>`<li>${esc(x.nome)}</li>`).join('')}</ol>`:'<p class="vz">Ninguém confirmou participação ainda.</p>';
 return `<article class="vc ${v.status}"><div class="dt"><b>${v.data.slice(8)}</b><small>${MES[+v.data.slice(5,7)-1].slice(0,3)}</small></div>
 <div class="vi"><h3>${esc(v.nome)}</h3><p>${v.hora?v.hora.slice(0,5)+' h':'Horário a definir'}</p>${v.responsavel?`<p class="mu">Responsável: ${esc(v.responsavel)}</p>`:''}<p><span class="chip ${v.status}">${ST[v.status]}</span><b>${p.length}</b> confirmado${p.length===1?'':'s'}${v.previstos?` de ${v.previstos} previstos`:''}</p></div>
 ${S.ad[v.id]?`<p class="end">${esc(S.ad[v.id])}</p>`:''}${v.observacoes?`<p class="end">${esc(v.observacoes)}</p>`:''}
 <details><summary>Participantes confirmados (${p.length})</summary>${lista}</details>
 ${ok?`<button class="btn" data-a="conf" data-id="${v.id}">CONFIRMAR PARTICIPAÇÃO</button>`:''}
 ${S.adm?`<div class="adm"><button class="bt" data-a="edit" data-id="${v.id}">Editar</button>${v.status==='agendada'?`<button class="bt" data-a="real" data-id="${v.id}">Realizada</button><button class="bt" data-a="canc" data-id="${v.id}">Cancelar</button>`:''}<button class="bt rd" data-a="del" data-id="${v.id}">Excluir</button></div>`:''}</article>`}

const vazio=()=>`<div class="vazio"><h3>Não há visitas programadas para este mês.</h3>${S.adm&&!closed()?'<button class="btn" data-a="nova">Cadastrar visita</button>':''}</div>`;

function cal(){const first=new Date(S.y,S.m-1,1).getDay(),n=new Date(S.y,S.m,0).getDate(),by={};
 S.v.forEach(v=>{const d=+v.data.slice(8);(by[d]=by[d]||[]).push(v)});
 let g='DSTQQSS'.split('').map(x=>`<i>${x}</i>`).join('')+'<span></span>'.repeat(first);
 for(let d=1;d<=n;d++){const hj=S.y===hoje.getFullYear()&&S.m===hoje.getMonth()+1&&d===hoje.getDate();
  g+=`<button data-a="dia" data-d="${d}" class="${hj?'hj':''} ${S.day===d?'sel':''}" aria-label="Dia ${d}">${d}${by[d]?'<u></u>':''}</button>`}
 const sel=S.day?(by[S.day]?by[S.day].map(card).join(''):'<p class="vz" style="text-align:center">Nenhuma visita neste dia.</p>'):'';
 return `<div class="cal">${g}</div>${sel}`}

async function loadHist(){const r=await sb.from('visitas').select('ano,mes,status'),m={};
 (r.data||[]).forEach(x=>{const k=x.ano*12+x.mes;(m[k]=m[k]||{ano:x.ano,mes:x.mes,t:0,r:0}).t++;if(x.status==='realizada')m[k].r++});
 S.hist=Object.values(m).sort((a,b)=>(b.ano*12+b.mes)-(a.ano*12+a.mes));draw()}
function hist(){if(!S.hist){loadHist();return '<div class="sk"></div><div class="sk"></div>'}
 return S.hist.length?S.hist.map(h=>`<button class="hm ${h.ano*12+h.mes<HM?'arq':''}" data-a="mes" data-y="${h.ano}" data-m="${h.mes}"><b>${MES[h.mes-1]} ${h.ano}</b><span>${h.t} visita${h.t===1?'':'s'}, ${h.r} realizada${h.r===1?'':'s'}${h.ano*12+h.mes<HM?' — encerrado':''}</span></button>`).join(''):'<div class="vazio"><h3>Ainda não há histórico.</h3></div>'}

function admin(){
 if(!S.adm)return `<form class="card" data-f="login"><h3>Acesso dos organizadores</h3><p class="mu">Somente para quem organiza as visitas.</p><label>E-mail<input name="e" type="email" autocomplete="username" required></label><label>Senha<input name="s" type="password" autocomplete="current-password" required></label><button class="btn">ENTRAR</button></form>`;
 return `<div class="card"><h3>Administração</h3><p class="mu">${MES[S.m-1]} de ${S.y}: mês ${closed()?'encerrado':'aberto'}.</p><div class="adm"><button class="btn" data-a="nova">Cadastrar visita</button><button class="bt" data-a="messt">${closed()?'Reabrir este mês':'Encerrar este mês'}</button><button class="bt" data-a="sair">Sair</button></div></div>`}

function draw(){
 const t=S.tab,pr=t==='agenda'||t==='calendario';
 const body=pr&&S.load?'<div class="sk"></div><div class="sk"></div>':pr&&S.err?`<div class="vazio"><h3>${S.err}</h3><button class="btn" data-a="re">Tentar de novo</button></div>`:t==='agenda'?(S.v.length?S.v.map(card).join(''):vazio()):t==='calendario'?cal():t==='historico'?hist():admin();
 const lb={agenda:'Visitas',calendario:'Calendário',historico:'Histórico',admin:'Admin'};
 $('#app').innerHTML=`<header><div class="mono">CCB</div><div><h1>CCB OLIVINA</h1><p>AGENDA DE VISITAS</p></div></header>
 <main class="${closed()&&t!=='historico'?'arq':''}">${t!=='historico'?`<div class="mes"><button aria-label="Mês anterior" data-a="mv" data-n="-1">‹</button><div><h2>${MES[S.m-1].toUpperCase()}</h2><span>${S.y}</span></div><button aria-label="Próximo mês" data-a="mv" data-n="1">›</button></div>${closed()?'<p class="aviso">Mês encerrado — registros disponíveis apenas para consulta.</p>':''}`:'<h2 class="ht">HISTÓRICO DE VISITAS</h2>'}${body}</main>
 <nav>${Object.keys(lb).map(n=>`<button class="${t===n?'on':''}" data-a="tab" data-t="${n}">${ic(n)}<span>${lb[n]}</span></button>`).join('')}</nav>`}

async function load(q){
 if(!q){S.load=true;draw()}
 const [a,b]=await Promise.all([
  sb.from('visitas').select('*,participacoes(id,nome,criado_em)').eq('ano',S.y).eq('mes',S.m).order('data').order('hora'),
  sb.from('meses').select('encerrado').eq('ano',S.y).eq('mes',S.m).maybeSingle()]);
 if(a.error){S.err='Não foi possível carregar. Verifique a internet.';S.v=[]}
 else{S.err=null;S.v=a.data.map(v=>({...v,participacoes:(v.participacoes||[]).sort((x,y)=>x.criado_em<y.criado_em?-1:1)}))}
 S.ov=b.data?b.data.encerrado:null;S.ad={};
 if(S.adm&&S.v.length){const r=await sb.from('visitas_privado').select('*').in('visita_id',S.v.map(x=>x.id));(r.data||[]).forEach(x=>{if(x.endereco)S.ad[x.visita_id]=x.endereco})}
 S.load=false;draw()}

function formV(v){v=v||{};modal(`<h3>${v.id?'Editar visita':'Nova visita'}</h3><form data-f="visita" data-id="${v.id||''}">
 <label>Pessoa ou família *<input name="nome" value="${esc(v.nome)}" maxlength="120" required></label>
 <div class="r2"><label>Data *<input name="data" type="date" value="${v.data||''}" required></label><label>Horário<input name="hora" type="time" value="${(v.hora||'').slice(0,5)}"></label></div>
 <label>Responsável<input name="resp" value="${esc(v.responsavel)}" maxlength="80"></label>
 <label>Endereço (só administradores veem)<input name="end" value="${esc(S.ad[v.id])}" maxlength="200"></label>
 <div class="r2"><label>Pessoas previstas<input name="prev" type="number" min="0" max="999" inputmode="numeric" value="${v.previstos||''}"></label><label>Situação<select name="st">${Object.keys(ST).map(k=>`<option value="${k}" ${k===(v.status||'agendada')?'selected':''}>${ST[k]}</option>`).join('')}</select></label></div>
 <label>Observações (todos veem)<textarea name="obs" rows="3" maxlength="500">${esc(v.observacoes)}</textarea></label>
 <button class="btn">SALVAR</button></form><button class="bt" data-a="no">Cancelar</button>`)}

async function up(id,d,ok){const r=await sb.from('visitas').update(d).eq('id',id);if(r.error)return toast(msgErr(r.error),1);S.hist=null;toast(ok);await load(1)}
async function checkAdm(){const s=await sb.auth.getSession();S.adm=false;if(s.data.session){const r=await sb.rpc('is_admin');S.adm=r.data===true}}

document.addEventListener('click',async e=>{
 if(e.target.id==='md')return close();
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,D=b.dataset,v=S.v.find(x=>x.id===D.id);
 if(a==='tab'){S.tab=D.t;if(D.t==='historico')S.hist=null;draw()}
 else if(a==='mv'){const k=S.y*12+S.m-1+ +D.n;S.y=Math.floor(k/12);S.m=k%12+1;S.day=null;load()}
 else if(a==='mes'){S.y=+D.y;S.m=+D.m;S.tab='agenda';S.day=null;load()}
 else if(a==='dia'){S.day=S.day===+D.d?null:+D.d;draw()}
 else if(a==='re')load();
 else if(a==='no')close();
 else if(a==='yes'){const r=ask.r;ask.r=null;close();r&&r(true)}
 else if(a==='conf'){modal(`<h3>CONFIRMAR VISITA</h3><p class="mu">Digite seu nome para registrar sua participação.</p><form data-f="conf" data-id="${D.id}"><input name="n" placeholder="Digite seu nome completo" autocomplete="name" maxlength="80" required><button class="btn">CONFIRMAR</button></form><button class="bt" data-a="no">Cancelar</button>`);setTimeout(()=>{const i=$('#md input');i&&i.focus()},60)}
 else if(a==='nova')formV();
 else if(a==='edit'&&v)formV(v);
 else if(a==='real'&&v)up(v.id,{status:'realizada'},'Visita marcada como realizada.');
 else if(a==='canc'&&v){if(await ask(`Cancelar a visita de ${esc(v.nome)}? Ela continua no histórico como cancelada.`,'Cancelar visita'))up(v.id,{status:'cancelada'},'Visita cancelada.')}
 else if(a==='del'&&v){if(await ask(`Excluir definitivamente a visita de ${esc(v.nome)}? Isso apaga também a lista de confirmados e não pode ser desfeito.`,'Excluir')){const r=await sb.from('visitas').delete().eq('id',v.id);if(r.error)return toast(msgErr(r.error),1);S.hist=null;toast('Visita excluída.');await load(1)}}
 else if(a==='messt'){const novo=!closed();if(await ask(novo?`Encerrar ${MES[S.m-1]} de ${S.y}? Ninguém poderá confirmar nem alterar visitas.`:`Reabrir ${MES[S.m-1]} de ${S.y} para alterações?`,novo?'Encerrar mês':'Reabrir mês')){const r=await sb.from('meses').upsert({ano:S.y,mes:S.m,encerrado:novo});if(r.error)return toast(msgErr(r.error),1);toast(novo?'Mês encerrado.':'Mês reaberto.');await load(1)}}
 else if(a==='sair'){await sb.auth.signOut();S.adm=false;S.ad={};draw()}
});

document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,k=f.dataset.f,btn=f.querySelector('.btn'),g=n=>f.elements[n].value;btn.disabled=true;
 try{
  if(k==='conf'){
   const r=await sb.rpc('confirmar_participacao',{p_visita:f.dataset.id,p_nome:g('n')});
   const M={duplicado:'Esse nome já está confirmado nesta visita.',encerrada:'Esta visita não aceita mais confirmações.',nome_invalido:'Digite seu nome completo.',nao_encontrada:'Visita não encontrada.'};
   if(r.error||r.data!=='ok'){toast(r.error?'Não foi possível confirmar. Tente de novo.':(M[r.data]||'Erro.'),1);return}
   modal('<div class="okm"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 15-17"/></svg><h3>Participação confirmada com sucesso!</h3></div>');setTimeout(close,1600);await load(1)}
  else if(k==='login'){
   const r=await sb.auth.signInWithPassword({email:g('e').trim(),password:g('s')});
   if(r.error){toast('E-mail ou senha incorretos.',1);return}
   await checkAdm();if(!S.adm){await sb.auth.signOut();toast('Esta conta não tem permissão de administrador.',1);return}
   toast('Acesso liberado.');await load(1)}
  else if(k==='visita'){
   const id=f.dataset.id,d={nome:g('nome').trim(),data:g('data'),hora:g('hora')||null,responsavel:g('resp').trim()||null,observacoes:g('obs').trim()||null,previstos:+g('prev')||0,status:g('st')};
   if(d.nome.length<2||!d.data){toast('Informe o nome e a data da visita.',1);return}
   const r=id?await sb.from('visitas').update(d).eq('id',id).select('id').single():await sb.from('visitas').insert(d).select('id').single();
   if(r.error){toast(msgErr(r.error),1);return}
   await sb.from('visitas_privado').upsert({visita_id:r.data.id,endereco:g('end').trim()||null});
   close();S.y=+d.data.slice(0,4);S.m=+d.data.slice(5,7);S.hist=null;S.tab='agenda';toast('Visita salva.');await load()}
 }finally{btn.disabled=false}
});

(async()=>{draw();await checkAdm();await load();
 sb.channel('p').on('postgres_changes',{event:'*',schema:'public',table:'participacoes'},()=>{if(!$('#md').classList.contains('on'))load(1)}).subscribe()})();
})();
