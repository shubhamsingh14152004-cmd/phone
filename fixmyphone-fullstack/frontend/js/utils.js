function uid(n){n=n||8;return Array.from({length:n},()=>'abcdefghjkmnpqrstuvwxyz0123456789'[Math.floor(Math.random()*33)]).join('');}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
function fmtINR(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
function todayISO(){return new Date().toISOString().slice(0,10);}
function addDays(iso,d){const dt=new Date(iso);dt.setDate(dt.getDate()+d);return dt.toISOString().slice(0,10);}
function fmtDate(iso){if(!iso)return '—';const d=new Date(iso);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function seededRand(seedStr){let seed=hashStr(seedStr)||1;return function(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;seed|=0;return ((seed>>>0)%10000)/10000;};}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanWa(num){
  if(!num) return '919004245310';
  let cleaned = String(num).replace(/[^0-9]/g, '');
  if(cleaned.length === 10) cleaned = '91' + cleaned;
  return cleaned;
}
function getStorePhone(){
  return (window.DB && DB.settings && DB.settings.storePhone) || '+91 9004245310';
}
function getStoreWhatsApp(){
  return (window.DB && DB.settings && DB.settings.storeWhatsApp) || '9004245310';
}
function getStoreAddress(){
  return (window.DB && DB.settings && DB.settings.storeAddress) || 'Shop 14, Linking Road, Bandra West, Mumbai 400050';
}

