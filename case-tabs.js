(() => {
 const section=document.querySelector('#cases');
 const tabs=[...section.querySelectorAll('[role="tab"]')];
 const panels=[...section.querySelectorAll('[role="tabpanel"]')];
 const show=(index,focus=false)=>{
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
  if(focus)tabs[index].focus();
 };
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>show(i));
  tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();show(n,true);}});
 });
})();
