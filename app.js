'use strict';
const campaignConfig = window.ACNE_CAMPAIGN || {};
const defaultQuestions=[
 {title:'鏡を見て、いちばん気になるのは？',hint:'近いものを1つ選んでください',options:['赤く炎症したニキビ','繰り返すポツポツ','赤み・色素沈着の跡','クレーター・凸凹・毛穴'],feedback:[
  '赤みが残っている期間や、現在の炎症の有無を伝えましょう。',
  '繰り返す頻度と、これまでの治療経過を伝えましょう。',
  '色が気になり始めた時期と、日頃のケアを伝えましょう。',
  '凹みの場所や気になっている期間を伝え、医師と治療を相談しましょう。'
 ]},
 {title:'もしニキビ悩みが解決したら、いちばん叶えたいのは？',hint:'近いものを1つ選んでください',options:['すっぴんに自信を持ちたい','メイクを楽しみたい','人目を気にせず近づきたい','写真で盛らなくていい肌に'],feedback:Array(4).fill('なりたい肌や、楽しみたいことをカウンセリングでお聞かせください。')},
 {title:'肌に合わせたオーダーメイド治療で、交通費も最大3万円サポートされるなら？',hint:'近いものを1つ選んでください',options:['予約してみたい','内容を見てみたい'],feedback:Array(2).fill('一人ひとりの肌に合わせて、医師が施術を組み合わせます。')}
];
const questions = Array.isArray(campaignConfig.questions) && campaignConfig.questions.length ? campaignConfig.questions : defaultQuestions;

const $ = selector => document.querySelector(selector);
const quiz = $('[data-quiz]');
const content = $('#content');
const sticky = $('#reservation-cta');
const answers = questions.map(() => new Set());
const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const guides = [
 '繰り返す頻度と、これまでの治療経過を伝えましょう。',
 '凹みの場所や気になっている期間を伝え、医師と治療を相談しましょう。',
 '色が気になり始めた時期と、日頃のケアを伝えましょう。',
 '赤みが残っている期間や、現在の炎症の有無を伝えましょう。'
];
const worries = [
 '麻酔や薬剤などの追加費用を含め、総額の見積もりを確認。',
 '痛みへの対応と、メイク・仕事に戻るまでの目安を確認。',
 '必要な回数・間隔を、ご自身の予定に合わせて確認。',
 '今の肌の状態に対して、適応と選択肢を医師に確認。'
];
const defaultFeedback = [
 guides,
 [
  'いつから、どのような変化があるかを診察で伝えましょう。',
  '気になり始めた時期と、その後の肌の変化を伝えましょう。',
  '長く続くお悩みも、これまでの経過から一緒に整理しましょう。',
  '繰り返す頻度や時期を伝えると、相談の手がかりになります。'
 ],
 [
  '今お使いのアイテムや、使用後の肌の変化を伝えましょう。',
  '使ったお薬の名前と、使用期間を伝えましょう。',
  '受けた治療や処方薬、その後の経過を伝えましょう。',
  '治療が決まっていなくても、気になることから相談できます。'
 ],
 worries
];
const feedback = questions.map((q, i) => q.feedback || q.options.map((_, j) => defaultFeedback[i]?.[j] || '気になることを、カウンセリングでお聞かせください。'));
let step = 0;
let furthestStep = 0;
let nextButtonScrollTimer;

function scrollToNextButton(section) {
 clearTimeout(nextButtonScrollTimer);
 nextButtonScrollTimer = setTimeout(() => {
  const button = section.querySelector('[data-next]');
  if (section.hidden || button.disabled) return;
  const viewport = window.visualViewport;
  const targetBottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) * 0.82;
  const distance = button.getBoundingClientRect().bottom - targetBottom;
  if (distance > 0) window.scrollTo({top: window.scrollY + distance, behavior: motion});
 }, motion === 'auto' ? 0 : 350);
}

function allAnswered() {
 return answers.every(answer => answer.size > 0);
}

function scrollToSection(element, immediately = false) {
 if (!element) return;
 const heading = element.querySelector('.quiz__q, h2') || element;
 if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
 heading.focus({preventScroll: true});
 requestAnimationFrame(() => {
  const progress = $('.tcb-progress');
  const offset = element.id === 'post-quiz-fv' ? 0 : Math.max(92, (progress?.getBoundingClientRect().height || 0) + 12);
  window.scrollTo({top: Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset), behavior: immediately ? 'instant' : motion});
 });
}

function renderQuestions() {
 $('.tcb-progress__numbers').innerHTML = questions.map((_, i) => `<span data-progress-dot>${i + 1}</span>`).join('');
 $('#quiz-steps').innerHTML = questions.map((question, questionIndex) => `
  <section class="quiz-step" data-step="${questionIndex}" data-answer-key="q${questionIndex + 1}" aria-labelledby="question-${questionIndex}" ${questionIndex ? 'hidden' : ''}>
   <p class="tcb-question-number" aria-hidden="true">Q.${String(questionIndex + 1).padStart(2, '0')}</p>
   <h2 class="quiz__q" id="question-${questionIndex}" tabindex="-1">${question.title}</h2>
   <p class="quiz__hint">${question.hint}</p>
   <div class="cards" role="group" aria-labelledby="question-${questionIndex}">
    ${question.options.map((option, optionIndex) => `
     <button class="card" type="button" data-choice="${optionIndex}" aria-pressed="false" aria-labelledby="choice-${questionIndex}-${optionIndex}">
      <span class="card__inner">
       <span class="card__face card__front">
        <span class="card__img quiz-art" aria-hidden="true" style="--x:${optionIndex / 3 * 100}%;--y:${(question.artRow ?? Math.min(questionIndex, 3)) / 3 * 100}%"></span>
        <span class="card__label" id="choice-${questionIndex}-${optionIndex}">${option}</span>
       </span>
       <span class="card__face card__back" aria-hidden="true">
        <span class="card__answer">
         <span class="card__eyebrow">ご相談のポイント</span>
         <span class="card__feedback" id="feedback-${questionIndex}-${optionIndex}">${feedback[questionIndex][optionIndex]}</span>
        </span>
        <span class="answer-nurse" aria-hidden="true"><img src="assets/quiz-nurse-20261024.png" width="309" height="320" alt=""/><span>ナース</span></span>
       </span>
      </span>
     </button>`).join('')}
   </div>
   <div class="quiz__actions">
    ${questionIndex ? '<button class="btn-prev" data-prev type="button">前の質問へ戻る</button>' : ''}
    <button class="btn-next" data-next type="button" disabled>${questionIndex === questions.length - 1 ? 'クーポンを見る' : '次へ進む'}<span aria-hidden="true"> ↓</span></button>
   </div>
  </section>`).join('');
}

function updateProgress() {
 const remaining = answers.filter(answer => !answer.size).length;
 $('#step-label').textContent = remaining ? `ご案内まで残り${remaining}問` : 'ご回答ありがとうございます';
 $('#step-count').textContent = `${step + 1} / ${questions.length}`;
 $('#progress').style.width = `${(step + 1) / questions.length * 100}%`;
 document.querySelectorAll('[data-progress-dot]').forEach((dot, index) => {
  dot.classList.toggle('is-on', index <= step);
  if (index === step) dot.setAttribute('aria-current', 'step');
  else dot.removeAttribute('aria-current');
 });
 document.querySelectorAll('.quiz-step').forEach((section, index) => {
  section.querySelector('[data-next]').disabled = index === questions.length - 1 ? !allAnswered() : !answers[index].size;
 });
}

function showStep(index, scroll = true) {
 clearTimeout(nextButtonScrollTimer);
 step = index;
 furthestStep = Math.max(furthestStep, index);
 document.querySelectorAll('.quiz-step').forEach((section, sectionIndex) => {
  section.hidden = sectionIndex > furthestStep;
  section.classList.toggle('is-active', sectionIndex === index);
  section.classList.toggle('is-revealed', sectionIndex <= furthestStep);
 });
 updateProgress();
 if (scroll) scrollToSection($(`.quiz-step[data-step="${index}"]`));
}

function updateCards(questionIndex) {
 const section = $(`.quiz-step[data-step="${questionIndex}"]`);
 section.querySelectorAll('.card').forEach(card => {
  const selected = answers[questionIndex].has(Number(card.dataset.choice));
  card.classList.toggle('is-active', selected);
  card.classList.toggle('is-dim', !questions[questionIndex].multi && answers[questionIndex].size > 0 && !selected);
  card.setAttribute('aria-pressed', String(selected));
  card.querySelector('.card__back').setAttribute('aria-hidden', String(!selected));
  if (selected) card.setAttribute('aria-describedby', `feedback-${questionIndex}-${card.dataset.choice}`);
  else card.removeAttribute('aria-describedby');
 });
}

function revealContent(target = null, completed = false) {
 clearTimeout(nextButtonScrollTimer);
 content.hidden = false;
 content.classList.add('is-visible');
 document.body.classList.add('ito-survey-complete');
 if (sticky) {
  sticky.hidden = false;
  sticky.classList.add('is-show');
 }
 const destination = target || $('#post-quiz-fv') || content;
 if (completed) {
  $('[data-result-thanks]').textContent = 'ご回答ありがとうございます！';
 }
 scrollToSection(destination, completed);
 if (completed && !celebrated) {
  celebrated = true;
  requestAnimationFrame(() => requestAnimationFrame(celebrate));
 }
}

quiz.addEventListener('click', event => {
 const card = event.target.closest('[data-choice]');
 if (card && quiz.contains(card)) {
  const questionIndex = Number(card.closest('[data-step]').dataset.step);
  const choiceIndex = Number(card.dataset.choice);
  const selected = answers[questionIndex].has(choiceIndex);
  if (!questions[questionIndex].multi) answers[questionIndex].clear();
  if (!selected || !questions[questionIndex].multi) answers[questionIndex].add(choiceIndex);
  else answers[questionIndex].delete(choiceIndex);
  step = questionIndex;
  updateCards(questionIndex);
  updateProgress();
  clearTimeout(nextButtonScrollTimer);
  if (answers[questionIndex].has(choiceIndex)) scrollToNextButton(card.closest('[data-step]'));
  return;
 }
 const next = event.target.closest('[data-next]');
 if (next && !next.disabled) {
  const questionIndex = Number(next.closest('[data-step]').dataset.step);
  if (!answers[questionIndex].size) return;
  if (questionIndex < questions.length - 1) showStep(questionIndex + 1);
  else if (allAnswered()) revealContent(null, true);
  return;
 }
 const previous = event.target.closest('[data-prev]');
 if (previous) showStep(Number(previous.closest('[data-step]').dataset.step) - 1);
});

$('#skip').addEventListener('click', () => revealContent());
// Direct section links also work before the questionnaire is complete.
document.addEventListener('click', event => {
 const link = event.target.closest('a[href^="#"]');
 if (!link) return;
 const hash = link.getAttribute('href');
 if (hash.length < 2) return;
 const target = document.getElementById(hash.slice(1));
 if (!target || !content.contains(target) || !content.hidden) return;
 event.preventDefault();
 revealContent(target);
 history.replaceState(null, '', hash);
});
function applyCampaignAssets() {
 const assets = campaignConfig.assets || {};
 const hero = document.querySelector('[data-ey-hero]');
 if (assets.heroImage && hero) {
  const image = hero.querySelector(':scope > img');
  image.src = assets.heroImage;
  image.width = assets.heroWidth || 1678;
  image.height = assets.heroHeight || 937;
  hero.querySelector('.hero-brand').hidden = Boolean(assets.heroIncludesLogo);
  document.querySelector('link[rel="preload"][as="image"]').href = assets.heroImage;
 }
 if (assets.introImage) {
  const slot = $('[data-intro-art]');
  slot.closest('dialog').classList.add('has-supplied-art');
  slot.replaceChildren();
  const heading = document.createElement('h2');
  heading.id = 'intro-title';heading.className = 'sr-only';heading.textContent = 'WEB予約クーポンのご案内';
  const image = document.createElement('img');
  image.src = assets.introImage;image.alt = 'アンケートに答えてWEB予約クーポンのご案内を見る';
  slot.append(heading, image);
 }
 const label = $('[data-intro-button-label]');
 if (campaignConfig.introButtonText) {
  label.textContent = campaignConfig.introButtonText;
  const arrow = document.createElement('b');arrow.textContent = '›';arrow.setAttribute('aria-hidden', 'true');label.append(arrow);
 }
 if (assets.introButtonImage) {
  const image = $('[data-intro-button-image]');image.src = assets.introButtonImage;image.alt = campaignConfig.introButtonText || 'クーポンを受け取る';image.width = 750;image.height = 113;image.hidden = false;
  label.hidden = true;image.closest('button').classList.add('has-image');
 }
 if (campaignConfig.campaign?.periodLabel) document.querySelectorAll('[data-campaign-period], .coupon-period').forEach(el => el.textContent = campaignConfig.campaign.periodLabel);
}
applyCampaignAssets();
renderQuestions();
showStep(0, false);

const intro = $('[data-intro-popup]');
if (intro && typeof intro.showModal === 'function') {
 intro.querySelector('[data-intro-close]')?.addEventListener('click', () => intro.close());
 intro.querySelectorAll('[data-intro-start]').forEach(button => button.addEventListener('click', () => {
  intro.close();
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  showStep(0);
 }));
 intro.showModal();
}

// Display the verified campaign and send reservations to the original TCB page.
const couponDialog = document.querySelector('#coupon-preview');
function celebrate() {
 if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 const layer = document.querySelector('#confetti-layer');
 layer.replaceChildren();
 (couponDialog.open ? couponDialog : document.body).append(layer);
 for(let i=0;i<42;i++) {
  const bit=document.createElement('i');
  bit.style.setProperty('--left', `${Math.random()*100}%`);
  bit.style.setProperty('--drift', `${(Math.random()-.5)*300}px`);
  bit.style.setProperty('--delay', `${Math.random()*.4}s`);
  bit.style.background=['#ed8fc6','#86cfe7','#b5e8f8','#f8bedf'][i%4];
  layer.append(bit);
 }
 setTimeout(()=>layer.replaceChildren(),2600);
}
document.querySelectorAll('.coupon-cta').forEach(a=>a.addEventListener('click',e=>{
 e.preventDefault();couponDialog.showModal();celebrate();
}));
couponDialog.querySelector('.dialog-close').addEventListener('click',()=>couponDialog.close());
couponDialog.addEventListener('click',e=>{if(e.target===couponDialog){const r=couponDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)couponDialog.close();}});
let celebrated=false;
$('[data-coupon-return]')?.addEventListener('click', () => {
 couponDialog.close();
 revealContent($('#empathy'));
});
// Avoid stacking the sticky action on top of a full-size in-page action.
const inlineActions=[...document.querySelectorAll('#content .coupon-cta, #content .campaign-ticket, #content .offer-supplied-coupon, #post-quiz-fv.reference-offer')];
const visibleActions=new Set();
new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visibleActions.add(e.target);else visibleActions.delete(e.target);});sticky.classList.toggle('inline-action-visible',visibleActions.size>0);},{threshold:0.4}).observe(inlineActions[0]);
const ctaObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visibleActions.add(e.target);else visibleActions.delete(e.target);});sticky.classList.toggle('inline-action-visible',visibleActions.size>0);},{threshold:0.4});
inlineActions.slice(1).forEach(a=>ctaObserver.observe(a));
const footer = document.querySelector('.page-footer');
if (footer && sticky) new IntersectionObserver(entries => {
 sticky.classList.toggle('at-page-end', entries[0].isIntersecting);
}, {threshold: 0}).observe(footer);

