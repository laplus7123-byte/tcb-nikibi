'use strict';
// EY支給の画像と設問が届いたら、この設定で差し替えます。
window.ACNE_CAMPAIGN = {
 assets: {
  introImage: 'assets/intro-coupon-ey-20261016.png',
  introButtonImage: 'assets/intro-coupon-button-ey-20261016.png',
  heroImage: '',
  heroWidth: 1678,
  heroHeight: 937,
  heroIncludesLogo: false
 },
 introButtonText: 'クーポンを受け取る',
 // nullなら現行3問を使用。支給後にtitle/hint/multi/options/feedbackを設定。
 questions: null,
 campaign: {
  start: '2026-10-01',
  end: '2026-11-03',
  periodLabel: '2026/10/1（木）〜11/3（火）',
  regularDiscount: 25000,
  discount: 30000,
  sourceUrl: 'https://tcb-beauty.net/menu/nikibi_all1_6'
 }
};
