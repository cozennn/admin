const i18n = {
 ar: {
  loginTitle:"تسجيل الدخول",loginSubtitle:"سجّلي الدخول لإدارة موقع NorDa.",username:"اسم المستخدم",password:"كلمة المرور",login:"دخول",logout:"تسجيل الخروج",
  overviewEyebrow:"مساحة الإدارة",overviewTitle:"نظرة عامة",overviewSubtitle:"ملخص سريع لنشاط موقعك.",projectRequests:"طلبات المشاريع",allRequests:"كل الطلبات",openTickets:"التذاكر المفتوحة",needsAttention:"تحتاج إلى المتابعة",messages:"الرسائل",allMessages:"كل الرسائل",manageTitle:"إدارة الموقع",requestsLink:"طلبات المشاريع",requestsDescription:"عرض الطلبات الواردة وتفاصيلها",ticketsLink:"التذاكر",ticketsDescription:"قراءة محادثات الدعم",accountLink:"الحساب",accountDescription:"عرض معلومات الحساب",privateWorkspace:"مساحة إدارة خاصة",
  backDashboard:"← العودة إلى لوحة التحكم",requestsTitle:"طلبات المشاريع",requestsSubtitle:"الطلبات التي أرسلها العملاء عبر الموقع.",name:"الاسم",email:"البريد الإلكتروني",subject:"الموضوع",status:"الحالة",createdAt:"تاريخ الإنشاء",loading:"جارٍ التحميل…",noRequests:"لا توجد طلبات بعد.",records:"سجلات",ticketsTitle:"التذاكر",ticketsSubtitle:"اختاري تذكرة لقراءة رسائلها.",allTickets:"كل التذاكر",ticketMessages:"رسائل التذكرة",chooseTicket:"اختاري تذكرة لعرض الرسائل.",accountTitle:"الحساب",accountSubtitle:"معلومات حساب الإدارة الحالي.",currentUsername:"اسم المستخدم الحالي"
 },
 en: {
  loginTitle:"Sign in",loginSubtitle:"Sign in to manage your NorDa website.",username:"Username",password:"Password",login:"Sign in",logout:"Log out",
  overviewEyebrow:"ADMIN WORKSPACE",overviewTitle:"Overview",overviewSubtitle:"A quick summary of your website activity.",projectRequests:"Project requests",allRequests:"All requests",openTickets:"Open tickets",needsAttention:"Needs follow-up",messages:"Messages",allMessages:"All messages",manageTitle:"Manage website",requestsLink:"Project requests",requestsDescription:"View incoming requests and details",ticketsLink:"Tickets",ticketsDescription:"Read support conversations",accountLink:"Account",accountDescription:"View account information",privateWorkspace:"Private admin workspace",
  backDashboard:"← Back to dashboard",requestsTitle:"Project requests",requestsSubtitle:"Requests submitted by customers through the website.",name:"Name",email:"Email",subject:"Subject",status:"Status",createdAt:"Created at",loading:"Loading…",noRequests:"No requests yet.",records:"records",ticketsTitle:"Tickets",ticketsSubtitle:"Select a ticket to read its messages.",allTickets:"All tickets",ticketMessages:"Ticket messages",chooseTicket:"Select a ticket to view its messages.",accountTitle:"Account",accountSubtitle:"Current admin account information.",currentUsername:"Current username"
 }
};
function currentLanguage(){try{return localStorage.getItem('admin_lang')==='en'?'en':'ar';}catch{return 'ar';}}
function applyLanguage(){
 const lang=currentLanguage(), root=document.documentElement;
 root.lang=lang;root.dir=lang==='ar'?'rtl':'ltr';
 document.querySelectorAll('[data-i18n]').forEach(el=>{const value=i18n[lang][el.dataset.i18n];if(value!==undefined)el.textContent=value;});
 document.querySelectorAll('[data-language-toggle]').forEach(el=>{el.textContent=lang==='ar'?'English':'العربية';el.setAttribute('aria-label',lang==='ar'?'Switch to English':'التبديل إلى العربية');});
}
function toggleLanguage(){const next=currentLanguage()==='ar'?'en':'ar';try{localStorage.setItem('admin_lang',next);}catch{}applyLanguage();}
async function apiFetch(path,options={}){return fetch(path,{...options,credentials:'include',headers:{...(options.headers||{})}});}
async function checkAuth(){
 const response=await apiFetch('/api/auth/me',{headers:{Accept:'application/json'}});
 if(!response.ok){location.replace('login.html');throw new Error('unauthorized');}
 const data=await response.json();
 if(data.ok===false){location.replace('login.html');throw new Error('unauthorized');}
 return data;
}
async function logout(){try{await apiFetch('/api/auth/logout',{method:'POST'});}catch(e){}finally{location.replace('login.html');}}
document.addEventListener('DOMContentLoaded',()=>{
 applyLanguage();
 document.querySelectorAll('[data-language-toggle]').forEach(el=>el.addEventListener('click',toggleLanguage));
 document.querySelectorAll('[data-logout]').forEach(el=>el.addEventListener('click',logout));
 if(document.body.hasAttribute('data-protected'))checkAuth().catch(()=>{});
});