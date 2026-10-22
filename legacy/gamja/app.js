'use strict';
const $=s=>document.querySelector(s);
let answers=[],index=0,locked=false,timer=null;
const views=['intro','quiz','result'];
function show(id){views.forEach(v=>$('#'+v).hidden=v!==id);window.scrollTo({top:0,behavior:'instant'})}
function renderQuestion(focus=true){
 clearTimeout(timer);locked=false;show('quiz');
 const q=QUESTIONS[index];
 $('#progress-count').textContent=`${index+1} / 7`;
 $('#progress').setAttribute('aria-valuenow',index);
 $('#progress i').style.width=`${index/7*100}%`;
 $('#scene').textContent=q.scene;
 $('#question-title').textContent=q.title;
 $('#question-title').style.whiteSpace='pre-line';
 $('#question-hint').textContent=q.hint;
 $('#options').replaceChildren();
 q.options.forEach((o,i)=>{
  const button=document.createElement('button');button.type='button';button.className='option';
  button.innerHTML=`<span class="letter">${'ABCD'[i]}</span><span><strong>${o.title}</strong></span><span class="tick" aria-hidden="true">↗</span>`;
  button.setAttribute('aria-pressed',String(answers[index]===i));
  if(answers[index]===i)button.classList.add('selected');
  button.addEventListener('click',()=>{
   if(locked)return;locked=true;answers[index]=i;
   document.querySelectorAll('.option').forEach(b=>{b.disabled=true;b.classList.remove('selected');b.setAttribute('aria-pressed','false')});
   button.classList.add('selected');button.setAttribute('aria-pressed','true');button.querySelector('.tick').textContent='✓';
   timer=setTimeout(()=>{locked=false;if(index===6)renderResult();else{index++;renderQuestion()}},240);
  });
  $('#options').appendChild(button);
 });
 $('#quiz-foot').textContent=index===6?'마지막 선택이야!':'정답은 없어, 편하게 골라봐';
 if(focus)$('#question-title').focus({preventScroll:true});
}
$('#start').addEventListener('click',()=>{answers=[];index=0;renderQuestion()});
$('#back').addEventListener('click',()=>{clearTimeout(timer);locked=false;if(index===0){show('intro');$('#start').focus()}else{index--;renderQuestion()}});
function renderResult(){
 const r=calculateResult(answers),top=r.ranked[0],second=r.ranked[1],p=PROFILES[top];
 const tied=r.leaders.length>1;
 const title=tied?(r.leaders.length===2?'두 가지 모습의 감자':'여러 모습의 감자'):p.name;
 const shortCopy={F:'새로운 걸 떠올리고 만들어보는 쪽에 끌리는구나',T:'바로 결정하기보다 이유부터 살펴보는구나',I:'할 일을 정리하고 하나씩 끝내는 걸 좋아하는구나',E:'사람들의 이야기를 듣고 의견을 맞추는구나'};
 const summary=tied?'상황에 따라 서로 다른 방식을 고르는 편이구나':shortCopy[top];
 const related=tied?r.leaders:r.close?[top,second]:[top];
 const characterMarkup=related.map(a=>`<figure class="result-character"><div class="potato-sprite ${PROFILES[a].imageClass}" role="img" aria-label="${PROFILES[a].imageAlt}"></div><figcaption>${AXES[a]}형</figcaption></figure>`).join('');
 $('#result').innerHTML=`<div class="result-top"><span class="eyebrow">나의 직무 궁합 힌트</span><h2 id="result-title" tabindex="-1">${title}</h2><div class="result-characters">${characterMarkup}</div><p class="teaser-summary">${summary}</p>${!tied&&r.close?`<p class="result-small">${AXES[second]}형의 모습도 함께 나타났어</p>`:''}</div>
 <section class="score-peek" aria-labelledby="score-title"><div class="score-peek-head"><h3 id="score-title">내 선택에 담긴 성향</h3><span>각 14점 만점</span></div><div class="score-peek-bars">${Object.keys(AXES).map(a=>`<div class="score-peek-row"><span>${AXES[a]}</span><div class="score-peek-track" aria-hidden="true"><i style="width:${r.scores[a]/14*100}%" class="${r.leaders.includes(a)?'is-leading':''}"></i></div><b>${r.scores[a]}점</b></div>`).join('')}</div><p class="score-peek-note">잘하는 정도가 아니라, 이번 답변에서 드러난 선호야</p></section>
 <div class="teaser-next"><p>이런 나는 어떤 일을 할 때<br><strong>더 잘 맞고, 덜 지칠까?</strong></p><a id="report-link" class="primary" href="#">나와 맞는 직무 더 알아보기 <span>↗</span></a><p class="next-note">직무분석지 소개와 신청 방법을 볼 수 있어</p></div>
 <div class="teaser-bottom"><button class="back" id="retry">다시 해보기</button><p class="disclaimer">7번의 선택으로 본 성향 힌트야 · 적성검사는 아니야</p></div>`;
 const url=new URL('/gamja/report',location.origin);url.searchParams.set('src','gamja');
 const params=new URLSearchParams(location.search);
 ['src','slug','utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'].forEach(k=>{if(params.get(k))url.searchParams.set(k,params.get(k))});
 $('#report-link').href=url.href;
 $('#retry').addEventListener('click',()=>{answers=[];index=0;renderQuestion()});
 show('result');$('#result-title').focus({preventScroll:true});
}
