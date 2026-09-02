/* ================= ADMIN ================= */
const adminState={
  repairFilter:{brand:'',status:'',payment:'',search:''},
  priceFilter:{brand:'',service:''},
  modal:null, // {type,...}
  sidebarOpen:false
};

function adminView(hash){
  if(!ADMIN_SESSION) return loginRedirectNotice();
  const sub = hash.split('/')[1] || 'overview';
  return `
  <div class="admin-shell">
    <aside class="admin-sidebar ${adminState.sidebarOpen?'open':''}" id="admin-sidebar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <div class="logo" style="font-size:17px"><span class="mark">&#9881;&#65039;</span>FixMyPhone</div>
        <button class="hide-desktop" style="background:none;border:none;color:#fff;font-size:20px" onclick="adminState.sidebarOpen=false;render();">&times;</button>
      </div>
      ${[
        ['overview','&#128202;','Overview'],['repairs','&#128241;','Repairs'],['customers','&#128101;','Customers'],
        ['brands','&#127970;','Brands & Models'],['pricing','&#128176;','Pricing'],['technicians','&#128119;','Technicians'],
        ['payments','&#128179;','Payments'],['invoices','&#129534;','Invoices'],['settings','&#9881;&#65039;','Settings']
      ].map(t=>`<a href="#admin/${t[0]}" class="${sub===t[0]?'active':''}" onclick="adminState.sidebarOpen=false;">${t[1]} ${t[2]}</a>`).join('')}
      <div style="flex:1"></div>
      <a href="#home" style="color:rgba(255,255,255,.5)">&#8592; Back to Website</a>
      <a href="javascript:void(0)" onclick="adminLogout()" style="color:#ff9d9d">&#9211; Logout</a>
    </aside>
    <main class="admin-main">
      <div class="admin-topbar">
        <button class="btn btn-outline btn-sm" style="display:none" id="admin-hamburger" onclick="adminState.sidebarOpen=true;render();">&#9776; Menu</button>
        <h2 style="margin:0;font-family:Poppins;font-size:20px;text-transform:capitalize">${sub.replace('-',' ')}</h2>
        <span class="small-note">Logged in as admin@fixmyphone.com</span>
      </div>
      ${adminSection(sub)}
    </main>
  </div>
  <style>@media(max-width:900px){#admin-hamburger{display:inline-flex !important}}</style>`;
}
function loginRedirectNotice(){
  setTimeout(()=>{ if(!ADMIN_SESSION) nav('#login'); },10);
  return `<div class="wrap container-section">Redirecting to login…</div>`;
}
function adminSection(sub){
  if(sub==='overview') return adminOverview();
  if(sub==='repairs') return adminRepairs();
  if(sub==='customers') return adminCustomers();
  if(sub==='brands') return adminBrands();
  if(sub==='pricing') return adminPricing();
  if(sub==='technicians') return adminTechnicians();
  if(sub==='payments') return adminPayments();
  if(sub==='invoices') return adminInvoices();
  if(sub==='settings') return adminSettings();
  return '';
}

/* ---- overview ---- */
function adminOverview(){
  const bks=DB.bookings;
  const total=bks.length;
  const pending=bks.filter(b=>b.status==='Booked'&&!b.cancelled).length;
  const inProgress=bks.filter(b=>['Received','Diagnosed','In Progress','Quality Check'].includes(b.status)&&!b.cancelled).length;
  const completed=bks.filter(b=>b.status==='Completed').length;
  const cancelled=bks.filter(b=>b.cancelled).length;
  const customers=new Set(bks.map(b=>b.customer.mobile)).size;
  const techs=DB.technicians.length;
  const todayB=bks.filter(b=>b.createdAt===todayISO()).length;
  const revenue=bks.filter(b=>b.payment.status==='Paid').reduce((a,b)=>a+b.payment.amountPaid,0);
  const pendingPay=bks.filter(b=>b.payment.status!=='Paid'&&!b.cancelled).reduce((a,b)=>a+b.price,0);

  // repairs by brand
  const byBrand={};
  bks.forEach(b=>{ byBrand[b.device.brandName]=(byBrand[b.device.brandName]||0)+1; });
  const brandRows=Object.entries(byBrand).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxBrand=Math.max(...brandRows.map(r=>r[1]),1);

  // by service
  const byService={};
  bks.forEach(b=>{ byService[b.serviceName]=(byService[b.serviceName]||0)+1; });
  const svcRows=Object.entries(byService).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxSvc=Math.max(...svcRows.map(r=>r[1]),1);

  // status donut
  const statusCounts={};
  bks.forEach(b=>{ const s=b.cancelled?'Cancelled':b.status; statusCounts[s]=(statusCounts[s]||0)+1; });
  const colors=['#2F6FEF','#5B8DEF','#16A34A','#D97706','#DC2626','#7C8798','#9CB8FF'];
  let acc=0; const segs=Object.entries(statusCounts).map(([k,v],i)=>{ const pct=v/total*100; const seg=`${colors[i%colors.length]} ${acc}% ${acc+pct}%`; acc+=pct; return {k,v,pct,color:colors[i%colors.length],seg}; });
  const donutBg=segs.map(s=>s.seg).join(', ');

  return `
  <div class="stat-cards">
    ${statCard(total,'Total Repairs')}${statCard(pending,'Pending')}${statCard(inProgress,'In Progress')}${statCard(completed,'Completed')}${statCard(cancelled,'Cancelled')}
  </div>
  <div class="stat-cards">
    ${statCard(customers,'Total Customers')}${statCard(techs,'Total Technicians')}${statCard(todayB,"Today's Bookings")}${statCard(fmtINR(revenue),'Monthly Revenue')}${statCard(fmtINR(pendingPay),'Pending Payments')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px" class="grid2">
    <div class="admin-panel">
      <div class="panel-title">Repairs by Brand</div>
      ${brandRows.map(r=>`<div class="mini-bar-row"><span class="lbl">${r[0]}</span><div class="mini-bar-track"><div class="mini-bar-fill" style="width:${r[1]/maxBrand*100}%"></div></div><span>${r[1]}</span></div>`).join('')}
    </div>
    <div class="admin-panel">
      <div class="panel-title">Repairs by Service</div>
      ${svcRows.map(r=>`<div class="mini-bar-row"><span class="lbl">${r[0]}</span><div class="mini-bar-track"><div class="mini-bar-fill" style="width:${r[1]/maxSvc*100}%;background:#16A34A"></div></div><span>${r[1]}</span></div>`).join('')}
    </div>
  </div>
  <div class="admin-panel">
    <div class="panel-title">Completed vs Pending vs In Progress vs Cancelled</div>
    <div class="donut-wrap">
      <div class="donut" style="background:conic-gradient(${donutBg})"></div>
      <div>${segs.map(s=>`<div class="legend-row"><span class="legend-dot" style="background:${s.color}"></span>${s.k}: ${s.v} (${s.pct.toFixed(0)}%)</div>`).join('')}</div>
    </div>
  </div>`;
}
function statCard(n,l){ return `<div class="stat-card"><div class="n">${n}</div><div class="l">${l}</div></div>`; }

/* ---- repairs management ---- */
function adminRepairs(){
  const f=adminState.repairFilter;
  let list=DB.bookings.slice();
  if(f.brand) list=list.filter(b=>b.device.brandId===f.brand);
  if(f.status) list=list.filter(b=> (f.status==='Cancelled'? b.cancelled : (b.status===f.status && !b.cancelled)));
  if(f.payment) list=list.filter(b=>b.payment.status===f.payment);
  if(f.search){ const q=f.search.toLowerCase(); list=list.filter(b=> b.repairId.toLowerCase().includes(q)||b.customer.name.toLowerCase().includes(q)||b.device.modelName.toLowerCase().includes(q)||b.customer.mobile.includes(q)); }
  list.sort((a,b)=> b.createdAt.localeCompare(a.createdAt));

  return `
  <div class="admin-panel">
    <div class="filter-row">
      <input placeholder="Search ID, customer, model, mobile…" value="${escapeHtml(f.search)}" oninput="adminState.repairFilter.search=this.value;render();" style="min-width:220px">
      <select onchange="adminState.repairFilter.brand=this.value;render();">
        <option value="">All Brands</option>
        ${DB.brands.map(b=>`<option value="${b.id}" ${f.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
      </select>
      <select onchange="adminState.repairFilter.status=this.value;render();">
        <option value="">All Status</option>
        ${STATUS_STAGES.concat('Cancelled').map(s=>`<option value="${s}" ${f.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <select onchange="adminState.repairFilter.payment=this.value;render();">
        <option value="">All Payments</option>
        ${['Pending','Partial','Paid','Refunded'].map(s=>`<option value="${s}" ${f.payment===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="adminState.repairFilter={brand:'',status:'',payment:'',search:''};render();">Clear</button>
    </div>
    <table class="data-table">
      <thead><tr><th>Repair ID</th><th>Customer</th><th>Brand</th><th>Model</th><th>Repair</th><th>Technician</th><th>Price</th><th>Status</th><th>Payment</th><th>Booked</th><th>Actions</th></tr></thead>
      <tbody>
        ${list.map(b=>`
        <tr>
          <td data-label="Repair ID"><strong>${b.repairId}</strong></td>
          <td data-label="Customer">${escapeHtml(b.customer.name)}<br><span class="small-note">${b.customer.mobile}</span></td>
          <td data-label="Brand">${b.device.brandName}</td>
          <td data-label="Model">${b.device.modelName}</td>
          <td data-label="Repair">${b.serviceName}</td>
          <td data-label="Technician">${b.technicianName}</td>
          <td data-label="Price">${fmtINR(b.price)}</td>
          <td data-label="Status"><span class="pill ${b.cancelled?'badge-danger':(b.status==='Completed'?'badge-ok':'badge-blue')}">${b.cancelled?'Cancelled':b.status}</span></td>
          <td data-label="Payment"><span class="pill ${b.payment.status==='Paid'?'badge-ok':(b.payment.status==='Refunded'?'badge-danger':'badge-warn')}">${b.payment.status}</span></td>
          <td data-label="Booked">${fmtDate(b.createdAt)}</td>
          <td data-label="Actions"><button class="btn btn-outline btn-sm" onclick="openRepairModal('${b.id}')">Manage</button></td>
        </tr>`).join('')}
        ${list.length===0?'<tr><td colspan="11" style="text-align:center;color:var(--gray-500);padding:20px">No repairs match these filters.</td></tr>':''}
      </tbody>
    </table>
  </div>
  ${adminState.modal&&adminState.modal.type==='repair' ? repairModal(adminState.modal.id) : ''}`;
}
function openRepairModal(id){ adminState.modal={type:'repair',id}; render(); }
function closeModal(){ adminState.modal=null; render(); }
function repairModal(id){
  const b=DB.bookings.find(x=>x.id===id); if(!b) return '';
  return `
  <div class="modal-bg" onclick="if(event.target===this)closeModal()">
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <h3 style="margin:0 0 4px">${b.repairId}</h3>
      <p class="small-note" style="margin:0 0 18px">${b.device.brandName} ${b.device.modelName} • ${b.serviceName}</p>

      <div class="field"><label>Status</label>
        <select onchange="updateBookingStatus('${b.id}',this.value)">
          ${STATUS_STAGES.map(s=>`<option value="${s}" ${b.status===s&&!b.cancelled?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Assign Technician</label>
        <select onchange="assignTechnician('${b.id}',this.value)">
          <option value="">Not assigned</option>
          ${DB.technicians.map(t=>`<option value="${t.id}" ${b.technicianId===t.id?'selected':''}>${t.name} — ${t.specialization}</option>`).join('')}
        </select>
      </div>
      <div class="grid2">
        <div class="field"><label>Price (₹)</label><input type="number" value="${b.price}" onchange="updateBookingField('${b.id}','price',Number(this.value))"></div>
        <div class="field"><label>Payment Status</label>
          <select onchange="updateBookingPayment('${b.id}','status',this.value)">
            ${['Pending','Partial','Paid','Refunded'].map(s=>`<option value="${s}" ${b.payment.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>Payment Method</label>
        <select onchange="updateBookingPayment('${b.id}','method',this.value)">
          ${['—','Cash','UPI','Card','Online Payment'].map(s=>`<option value="${s}" ${b.payment.method===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Add Note</label>
        <div style="display:flex;gap:8px"><input id="note-input-${b.id}" placeholder="Internal note…"><button class="btn btn-outline btn-sm" onclick="addBookingNote('${b.id}')">Add</button></div>
        <div style="margin-top:10px">${b.notes.map(n=>`<div class="small-note" style="margin-bottom:4px">• ${escapeHtml(n.text)} <span style="opacity:.6">(${fmtDate(n.at)})</span></div>`).join('')||'<div class="small-note">No notes yet.</div>'}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
        ${b.status==='Completed'?`<button class="btn btn-outline btn-sm" onclick="openInvoice('${b.id}')">View Invoice</button>`:''}
        ${!b.cancelled?`<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel Repair</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="deleteBooking('${b.id}')">Delete</button>
      </div>
    </div>
  </div>`;
}
async function updateBookingStatus(id,status){
  const b=DB.bookings.find(x=>x.id===id); if(!b) return;
  b.status=status; b.cancelled=false;
  if(!b.statusHistory.find(h=>h.status===status)) b.statusHistory.push({status,at:todayISO(),note:''});
  await persist('bookings'); toast('Status updated to "'+status+'".'); render();
}
async function assignTechnician(id,techId){
  const b=DB.bookings.find(x=>x.id===id); if(!b) return;
  const t=DB.technicians.find(x=>x.id===techId);
  b.technicianId=t?t.id:null; b.technicianName=t?t.name:'Not yet assigned';
  await persist('bookings'); toast('Technician updated.'); render();
}
async function updateBookingField(id,field,val){
  const b=DB.bookings.find(x=>x.id===id); if(!b) return;
  b[field]=val; await persist('bookings'); toast('Updated.');
}
async function updateBookingPayment(id,field,val){
  const b=DB.bookings.find(x=>x.id===id); if(!b) return;
  b.payment[field]=val;
  if(field==='status'&&val==='Paid') b.payment.amountPaid=b.price;
  if(field==='status'&&val==='Refunded') b.payment.amountPaid=0;
  await persist('bookings'); toast('Payment updated.'); render();
}
async function addBookingNote(id){
  const input=document.getElementById('note-input-'+id);
  if(!input||!input.value.trim()) return;
  const b=DB.bookings.find(x=>x.id===id);
  b.notes.push({text:input.value.trim(),at:todayISO()});
  await persist('bookings'); render();
}
async function cancelBooking(id){
  const b=DB.bookings.find(x=>x.id===id); b.cancelled=true;
  await persist('bookings'); toast('Repair cancelled.'); closeModal();
}
async function deleteBooking(id){
  DB.bookings=DB.bookings.filter(x=>x.id!==id);
  await persist('bookings'); toast('Repair deleted.'); closeModal();
}

/* ---- customers ---- */
function adminCustomers(){
  const map={};
  DB.bookings.forEach(b=>{
    const k=b.customer.mobile;
    if(!map[k]) map[k]={...b.customer, repairs:0, totalSpend:0};
    map[k].repairs++;
    if(b.payment.status==='Paid') map[k].totalSpend+=b.payment.amountPaid;
  });
  const list=Object.values(map);
  return `
  <div class="admin-panel">
    <table class="data-table">
      <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Repairs</th><th>Total Paid</th><th>Actions</th></tr></thead>
      <tbody>
        ${list.map(c=>`<tr>
          <td data-label="Name">${escapeHtml(c.name)}</td>
          <td data-label="Mobile">${c.mobile}</td>
          <td data-label="Email">${c.email}</td>
          <td data-label="City">${c.city}</td>
          <td data-label="Repairs">${c.repairs}</td>
          <td data-label="Total Paid">${fmtINR(c.totalSpend)}</td>
          <td data-label="Actions"><button class="btn btn-outline btn-sm" onclick="adminState.repairFilter={brand:'',status:'',payment:'',search:'${c.mobile}'};nav('#admin/repairs')">View Repairs</button></td>
        </tr>`).join('')}
        ${list.length===0?'<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--gray-500)">No customers yet.</td></tr>':''}
      </tbody>
    </table>
  </div>`;
}

/* ---- brands & models ---- */
function adminBrands(){
  return `
  <div class="admin-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="panel-title" style="margin:0">Brand & Model Database</div>
      <button class="btn btn-primary btn-sm" onclick="openAddBrand()">+ Add Brand</button>
    </div>
    ${DB.brands.map(b=>`
      <div style="border:1px solid var(--gray-100);border-radius:12px;padding:14px 16px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div><strong>${b.name}</strong> <span class="pill badge-gray">${b.tier}</span> ${!b.enabled?'<span class="pill badge-danger">Disabled</span>':''}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="toggleBrandEnabled('${b.id}')">${b.enabled?'Disable':'Enable'}</button>
            <button class="btn btn-outline btn-sm" onclick="openAddSeries('${b.id}')">+ Series</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBrand('${b.id}')">Delete Brand</button>
          </div>
        </div>
        <div style="margin-top:10px">
        ${b.series.map(s=>`
          <div style="margin:8px 0 8px 14px;padding:10px;background:var(--gray-50);border-radius:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
              <span style="font-weight:600;font-size:13.5px">${s.name} ${!s.enabled?'<span class="pill badge-danger">Disabled</span>':''}</span>
              <div style="display:flex;gap:6px">
                <button class="btn btn-outline btn-sm" onclick="openAddModel('${b.id}','${s.id}')">+ Model</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSeries('${b.id}','${s.id}')">Delete Series</button>
              </div>
            </div>
            <div class="model-chip-row" style="margin-top:8px">
              ${s.models.map(m=>`<span class="model-chip" style="cursor:default;${!m.enabled?'opacity:.45':''}" title="Click to toggle">
                ${m.name}
                <a href="javascript:void(0)" onclick="toggleModelEnabled('${b.id}','${s.id}','${m.id}')" style="margin-left:6px;color:var(--blue)">${m.enabled?'⏸':'▶'}</a>
                <a href="javascript:void(0)" onclick="deleteModel('${b.id}','${s.id}','${m.id}')" style="margin-left:4px;color:var(--danger)">✕</a>
              </span>`).join('')}
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>
  ${adminState.modal&&adminState.modal.type==='addBrand'?addBrandModal():''}
  ${adminState.modal&&adminState.modal.type==='addSeries'?addSeriesModal():''}
  ${adminState.modal&&adminState.modal.type==='addModel'?addModelModal():''}
  `;
}
function openAddBrand(){ adminState.modal={type:'addBrand'}; render(); }
function addBrandModal(){
  return `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3 style="margin:0 0 16px">Add Brand</h3>
    <form onsubmit="return submitAddBrand(event)">
      <div class="field"><label>Brand Name</label><input name="name" required></div>
      <div class="field"><label>Tier (used for auto-pricing of new models)</label>
        <select name="tier"><option value="premium">Premium</option><option value="mid" selected>Mid-range</option><option value="budget">Budget</option></select>
      </div>
      <button class="btn btn-primary" style="width:100%">Add Brand</button>
    </form>
  </div></div>`;
}
async function submitAddBrand(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const name=f.get('name').trim(); if(!name) return false;
  DB.brands.push({id:slug(name)+'-'+uid(4),name,tier:f.get('tier'),enabled:true,series:[]});
  await persist('brands'); toast('Brand added.'); closeModal();
  return false;
}
function openAddSeries(brandId){ adminState.modal={type:'addSeries',brandId}; render(); }
function addSeriesModal(){
  return `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3 style="margin:0 0 16px">Add Series</h3>
    <form onsubmit="return submitAddSeries(event)">
      <div class="field"><label>Series Name</label><input name="name" required></div>
      <button class="btn btn-primary" style="width:100%">Add Series</button>
    </form>
  </div></div>`;
}
async function submitAddSeries(e){
  e.preventDefault();
  const name=new FormData(e.target).get('name').trim(); if(!name) return false;
  const b=DB.brands.find(x=>x.id===adminState.modal.brandId);
  b.series.push({id:b.id+'__'+slug(name)+'-'+uid(4),name,enabled:true,models:[]});
  await persist('brands'); toast('Series added.'); closeModal();
  return false;
}
function openAddModel(brandId,seriesId){ adminState.modal={type:'addModel',brandId,seriesId}; render(); }
function addModelModal(){
  return `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3 style="margin:0 0 16px">Add Model</h3>
    <form onsubmit="return submitAddModel(event)">
      <div class="field"><label>Model Name</label><input name="name" required placeholder="e.g. iPhone 17 Pro Max"></div>
      <p class="small-note">Prices for all 12 repair types will be auto-generated based on the brand's tier — editable anytime from Pricing.</p>
      <button class="btn btn-primary" style="width:100%">Add Model</button>
    </form>
  </div></div>`;
}
async function submitAddModel(e){
  e.preventDefault();
  const name=new FormData(e.target).get('name').trim(); if(!name) return false;
  const b=DB.brands.find(x=>x.id===adminState.modal.brandId);
  const s=b.series.find(x=>x.id===adminState.modal.seriesId);
  const modelId=s.id+'__'+slug(name)+'-'+uid(4);
  s.models.push({id:modelId,name,enabled:true});
  await persist('brands');
  SERVICES_SEED.forEach(svc=>{
    const rnd=seededRand(b.id+'|'+modelId+'|'+svc.id)();
    const [lo,hi]=svc.range[b.tier]; const price=Math.round((lo+rnd*(hi-lo))/10)*10;
    DB.prices.push({id:uid(10),brandId:b.id,seriesId:s.id,modelId,serviceId:svc.id,price,time:svc.time,warrantyDays:svc.warrantyDays,enabled:true});
  });
  await persist('prices');
  toast('Model added with auto-generated pricing.'); closeModal();
  return false;
}
async function toggleBrandEnabled(id){ const b=DB.brands.find(x=>x.id===id); b.enabled=!b.enabled; await persist('brands'); render(); }
async function toggleModelEnabled(bid,sid,mid){ const b=DB.brands.find(x=>x.id===bid); const s=b.series.find(x=>x.id===sid); const m=s.models.find(x=>x.id===mid); m.enabled=!m.enabled; await persist('brands'); render(); }
async function deleteBrand(id){ if(!confirm('Delete this brand and all its series/models?'))return; DB.brands=DB.brands.filter(x=>x.id!==id); DB.prices=DB.prices.filter(p=>p.brandId!==id); await persist('brands'); await persist('prices'); toast('Brand deleted.'); render(); }
async function deleteSeries(bid,sid){ if(!confirm('Delete this series and all its models?'))return; const b=DB.brands.find(x=>x.id===bid); b.series=b.series.filter(x=>x.id!==sid); DB.prices=DB.prices.filter(p=>p.seriesId!==sid); await persist('brands'); await persist('prices'); toast('Series deleted.'); render(); }
async function deleteModel(bid,sid,mid){ if(!confirm('Delete this model?'))return; const b=DB.brands.find(x=>x.id===bid); const s=b.series.find(x=>x.id===sid); s.models=s.models.filter(x=>x.id!==mid); DB.prices=DB.prices.filter(p=>p.modelId!==mid); await persist('brands'); await persist('prices'); toast('Model deleted.'); render(); }

/* ---- pricing management ---- */
function adminPricing(){
  const f=adminState.priceFilter;
  let rows=DB.prices.slice();
  if(f.brand) rows=rows.filter(r=>r.brandId===f.brand);
  if(f.service) rows=rows.filter(r=>r.serviceId===f.service);
  rows=rows.slice(0,160); // keep table manageable; use filters to narrow
  return `
  <div class="admin-panel">
    <div class="filter-row">
      <select onchange="adminState.priceFilter.brand=this.value;render();">
        <option value="">All Brands</option>
        ${DB.brands.map(b=>`<option value="${b.id}" ${f.brand===b.id?'selected':''}>${b.name}</option>`).join('')}
      </select>
      <select onchange="adminState.priceFilter.service=this.value;render();">
        <option value="">All Repair Types</option>
        ${SERVICES_SEED.map(s=>`<option value="${s.id}" ${f.service===s.id?'selected':''}>${s.name}</option>`).join('')}
      </select>
      <span class="small-note" style="align-self:center">Showing ${rows.length} of ${DB.prices.filter(r=>(!f.brand||r.brandId===f.brand)&&(!f.service||r.serviceId===f.service)).length} matching prices. Narrow with filters to edit more precisely.</span>
    </div>
    <table class="data-table">
      <thead><tr><th>Brand</th><th>Model</th><th>Repair</th><th>Price (₹)</th><th>Time</th><th>Warranty (days)</th><th>Enabled</th><th>Actions</th></tr></thead>
      <tbody>
        ${rows.map(r=>{
          const b=findBrand(DB.brands,r.brandId); const m=findModel(DB.brands,r.modelId); const svc=SERVICES_SEED.find(s=>s.id===r.serviceId);
          if(!b||!m||!svc) return '';
          return `<tr>
            <td data-label="Brand">${b.name}</td>
            <td data-label="Model">${m.model.name}</td>
            <td data-label="Repair">${svc.name}</td>
            <td data-label="Price"><input type="number" value="${r.price}" style="width:100px" onchange="updatePriceField('${r.id}','price',Number(this.value))"></td>
            <td data-label="Time"><input value="${r.time}" style="width:130px" onchange="updatePriceField('${r.id}','time',this.value)"></td>
            <td data-label="Warranty"><input type="number" value="${r.warrantyDays}" style="width:80px" onchange="updatePriceField('${r.id}','warrantyDays',Number(this.value))"></td>
            <td data-label="Enabled"><input type="checkbox" ${r.enabled?'checked':''} onchange="updatePriceField('${r.id}','enabled',this.checked)"></td>
            <td data-label="Actions"><button class="btn btn-danger btn-sm" onclick="deletePriceRow('${r.id}')">Delete</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}
async function updatePriceField(id,field,val){ const r=DB.prices.find(x=>x.id===id); r[field]=val; await persist('prices'); }
async function deletePriceRow(id){ DB.prices=DB.prices.filter(x=>x.id!==id); await persist('prices'); toast('Price row deleted.'); render(); }

/* ---- technicians ---- */
function adminTechnicians(){
  return `
  <div class="admin-panel">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="panel-title" style="margin:0">Technicians</div>
      <button class="btn btn-primary btn-sm" onclick="openAddTech()">+ Add Technician</button>
    </div>
    <table class="data-table">
      <thead><tr><th>Name</th><th>Contact</th><th>Specialization</th><th>Experience</th><th>Status</th><th>Active</th><th>Completed</th><th>Actions</th></tr></thead>
      <tbody>
      ${DB.technicians.map(t=>{
        const active=DB.bookings.filter(b=>b.technicianId===t.id && !['Completed'].includes(b.status) && !b.cancelled).length;
        const done=DB.bookings.filter(b=>b.technicianId===t.id && b.status==='Completed').length;
        return `<tr>
          <td data-label="Name">${escapeHtml(t.name)}</td>
          <td data-label="Contact">${t.phone}<br><span class="small-note">${t.email}</span></td>
          <td data-label="Specialization">${escapeHtml(t.specialization)}</td>
          <td data-label="Experience">${t.experience}</td>
          <td data-label="Status"><span class="pill ${t.status==='Active'?'badge-ok':'badge-warn'}">${t.status}</span></td>
          <td data-label="Active">${active}</td>
          <td data-label="Completed">${done}</td>
          <td data-label="Actions"><button class="btn btn-outline btn-sm" onclick="toggleTechStatus('${t.id}')">${t.status==='Active'?'Set On Leave':'Set Active'}</button> <button class="btn btn-danger btn-sm" onclick="deleteTech('${t.id}')">Remove</button></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>
  ${adminState.modal&&adminState.modal.type==='addTech'?addTechModal():''}`;
}
function openAddTech(){ adminState.modal={type:'addTech'}; render(); }
function addTechModal(){
  return `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3 style="margin:0 0 16px">Add Technician</h3>
    <form onsubmit="return submitAddTech(event)">
      <div class="grid2"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone" required></div></div>
      <div class="field"><label>Email</label><input name="email" type="email" required></div>
      <div class="field"><label>Specialization</label><input name="specialization" required placeholder="e.g. Samsung & Android Flagships"></div>
      <div class="grid2"><div class="field"><label>Experience</label><input name="experience" placeholder="e.g. 3 years"></div>
      <div class="field"><label>Status</label><select name="status"><option>Active</option><option>On Leave</option></select></div></div>
      <button class="btn btn-primary" style="width:100%">Add Technician</button>
    </form>
  </div></div>`;
}
async function submitAddTech(e){
  e.preventDefault(); const f=new FormData(e.target);
  DB.technicians.push({id:uid(8),name:f.get('name'),phone:f.get('phone'),email:f.get('email'),specialization:f.get('specialization'),experience:f.get('experience')||'—',status:f.get('status')});
  await persist('technicians'); toast('Technician added.'); closeModal();
  return false;
}
async function toggleTechStatus(id){ const t=DB.technicians.find(x=>x.id===id); t.status=t.status==='Active'?'On Leave':'Active'; await persist('technicians'); render(); }
async function deleteTech(id){ if(!confirm('Remove this technician?'))return; DB.technicians=DB.technicians.filter(x=>x.id!==id); await persist('technicians'); toast('Technician removed.'); render(); }

/* ---- payments ---- */
function adminPayments(){
  const list=DB.bookings.filter(b=>!b.cancelled);
  return `
  <div class="admin-panel">
    <table class="data-table">
      <thead><tr><th>Repair ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
      ${list.map(b=>`<tr>
        <td data-label="Repair ID">${b.repairId}</td>
        <td data-label="Customer">${escapeHtml(b.customer.name)}</td>
        <td data-label="Amount">${fmtINR(b.price)}</td>
        <td data-label="Method"><select onchange="updateBookingPayment('${b.id}','method',this.value)">${['—','Cash','UPI','Card','Online Payment'].map(m=>`<option ${b.payment.method===m?'selected':''}>${m}</option>`).join('')}</select></td>
        <td data-label="Status"><select onchange="updateBookingPayment('${b.id}','status',this.value)">${['Pending','Partial','Paid','Refunded'].map(s=>`<option ${b.payment.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
        <td data-label="Date">${fmtDate(b.createdAt)}</td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ---- invoices ---- */
function adminInvoices(){
  const list=DB.bookings.filter(b=>b.status==='Completed');
  return `
  <div class="admin-panel">
    <table class="data-table">
      <thead><tr><th>Repair ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Actions</th></tr></thead>
      <tbody>
      ${list.map(b=>`<tr>
        <td data-label="Repair ID">${b.repairId}</td>
        <td data-label="Customer">${escapeHtml(b.customer.name)}</td>
        <td data-label="Amount">${fmtINR(b.price)}</td>
        <td data-label="Payment">${b.payment.status}</td>
        <td data-label="Actions"><button class="btn btn-outline btn-sm" onclick="openInvoice('${b.id}')">View / Print</button></td>
      </tr>`).join('')}
      ${list.length===0?'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gray-500)">No completed repairs yet.</td></tr>':''}
      </tbody>
    </table>
  </div>`;
}
function openInvoice(bookingId){ location.hash='#invoice/'+bookingId; }
function invoiceView(bookingId){
  const b=DB.bookings.find(x=>x.id===bookingId);
  if(!b) return `<div class="wrap container-section">Invoice not found.</div>`;
  const labour=Math.round(b.price*0.35), parts=b.price-labour;
  const warrantyEnd = b.warrantyDays>0 ? addDays((b.statusHistory.find(h=>h.status==='Completed')||{at:b.createdAt}).at,b.warrantyDays) : null;
  return `
  <section class="container-section">
    <div class="wrap" style="max-width:760px">
      <div id="invoice-actions" style="display:flex;justify-content:flex-end;gap:10px;margin-bottom:16px">
        <button class="btn btn-outline" onclick="history.back()">Back</button>
        <button class="btn btn-primary" onclick="window.print()">Print / Download</button>
      </div>
      <div class="invoice-sheet">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
          <div><div class="logo" style="color:var(--navy);font-size:20px"><span class="mark">&#9881;&#65039;</span>FixMyPhone</div>
            <p class="small-note" style="margin-top:6px">${escapeHtml((DB.settings && DB.settings.storeAddress) || getStoreAddress())}<br>📞 ${escapeHtml((DB.settings && DB.settings.storePhone) || getStorePhone())} • 💬 WA: ${escapeHtml((DB.settings && DB.settings.storeWhatsApp) || getStoreWhatsApp())} • ✉️ ${escapeHtml((DB.settings && DB.settings.storeEmail) || 'support@fixmyphone.in')}</p></div>
          <div style="text-align:right"><h2 style="margin:0">INVOICE</h2><p class="small-note">${b.repairId}<br>${fmtDate(todayISO())}</p></div>
        </div>
        <div class="grid2" style="margin-bottom:22px">
          <div><strong>Billed To</strong><p class="small-note">${escapeHtml(b.customer.name)}<br>${escapeHtml(b.customer.address)}, ${escapeHtml(b.customer.city)} ${escapeHtml(b.customer.pincode)}<br>${b.customer.mobile}</p></div>
          <div><strong>Device</strong><p class="small-note">${b.device.brandName} ${b.device.modelName}${b.device.variant?(' • '+escapeHtml(b.device.variant)):''}<br>${b.device.imei?('IMEI: '+escapeHtml(b.device.imei)):''}</p></div>
        </div>
        <table class="data-table" style="margin-bottom:20px">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td data-label="Description">${b.serviceName} — Parts</td><td data-label="Amount">${fmtINR(parts)}</td></tr>
            <tr><td data-label="Description">${b.serviceName} — Labour</td><td data-label="Amount">${fmtINR(labour)}</td></tr>
            <tr><td data-label="Description"><strong>Total</strong></td><td data-label="Amount"><strong>${fmtINR(b.price)}</strong></td></tr>
          </tbody>
        </table>
        <div class="grid2">
          <div class="sum-row"><span class="k">Payment Status</span><span class="v">${b.payment.status}</span></div>
          <div class="sum-row"><span class="k">Payment Method</span><span class="v">${b.payment.method}</span></div>
          <div class="sum-row"><span class="k">Warranty</span><span class="v">${b.warrantyDays>0?(b.warrantyDays+' days'):'Not applicable'}</span></div>
          ${warrantyEnd?`<div class="sum-row"><span class="k">Warranty Valid Until</span><span class="v">${fmtDate(warrantyEnd)}</span></div>`:''}
        </div>
        <p class="small-note" style="margin-top:24px">Thank you for choosing FixMyPhone. This is a system-generated invoice.</p>
      </div>
    </div>
  </section>`;
}

/* ---- settings ---- */
function adminSettings(){
  const s = DB.settings || {};
  const phone = s.storePhone || '+91 9004245310';
  const wa = s.storeWhatsApp || '9004245310';
  const waClean = cleanWa(wa);
  const email = s.storeEmail || 'support@fixmyphone.in';
  const hours = s.hours || 'Mon–Sat: 10:00 AM – 8:00 PM';
  const storeName = s.storeName || 'FixMyPhone';
  const addrs = Array.isArray(s.addresses) ? s.addresses : [
    { id: 'addr_main', title: 'Main Service Centre', fullAddress: s.storeAddress || 'Shop 14, Linking Road, Bandra West, Mumbai 400050', phone, whatsapp: wa, timing: hours, isPrimary: true }
  ];

  return `
  <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:24px;align-items:start" class="grid2">
    <!-- Store Contact Information -->
    <div class="admin-panel">
      <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>⚙️ General &amp; Contact Settings</span>
        <span class="pill badge-ok">Live API Sync</span>
      </div>
      <p class="small-note" style="margin-bottom:18px">These contact details will update live across the website header, WhatsApp floating popup, hero section, footer, and booking invoices.</p>

      <form onsubmit="saveGeneralSettings(event)">
        <div class="field">
          <label>Store / Business Name</label>
          <input name="storeName" value="${escapeHtml(storeName)}" required placeholder="e.g. FixMyPhone">
        </div>

        <div class="field">
          <label>📞 Phone Number (Call Support)</label>
          <input name="storePhone" value="${escapeHtml(phone)}" required placeholder="e.g. +91 9004245310">
          <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center">
            <span class="small-note">Direct calling link for customers</span>
            <a href="tel:${phone}" class="small-note" style="color:var(--blue);font-weight:600">Test Call ↗</a>
          </div>
        </div>

        <div class="field">
          <label>💬 WhatsApp Support Number</label>
          <input name="storeWhatsApp" value="${escapeHtml(wa)}" required placeholder="e.g. 9004245310 or +91 9004245310">
          <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center">
            <span class="small-note">Direct WhatsApp chat redirect link</span>
            <a href="https://wa.me/${waClean}" target="_blank" rel="noopener noreferrer" class="small-note" style="color:#25D366;font-weight:600">Test WhatsApp ↗</a>
          </div>
        </div>

        <div class="field">
          <label>✉️ Support Email Address</label>
          <input type="email" name="storeEmail" value="${escapeHtml(email)}" required placeholder="e.g. support@fixmyphone.in">
        </div>

        <div class="field">
          <label>⏰ Opening Hours / Timings</label>
          <input name="hours" value="${escapeHtml(hours)}" required placeholder="e.g. Mon–Sat: 10:00 AM – 8:00 PM, Sun: 11:00 AM – 5:00 PM">
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:8px" type="submit">💾 Save Contact Settings</button>
      </form>
    </div>

    <!-- Store Address / Locations Manager -->
    <div class="admin-panel">
      <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <span>📍 Store Addresses &amp; Locations (${addrs.length})</span>
        <button class="btn btn-primary btn-sm" onclick="openAddressModal()">+ Add New Address</button>
      </div>
      <p class="small-note" style="margin-bottom:18px">Manage physical repair centres, store branches, and drop-off points displayed on your website.</p>

      <div style="display:flex;flex-direction:column;gap:14px">
        ${addrs.map(a=>{
          const aPhone = a.phone || phone;
          const aWa = a.whatsapp || wa;
          const fullAddr = a.fullAddress || `${a.street || ''}, ${a.area || ''}, ${a.city || ''} ${a.pincode || ''}`.replace(/^, | ,/g,'');
          return `
          <div class="card" style="padding:18px;border:1.5px solid ${a.isPrimary?'var(--blue)':'var(--gray-100)'};background:${a.isPrimary?'var(--ice)':'#fff'}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
              <div>
                <strong style="font-size:15px;color:var(--navy)">${escapeHtml(a.title || 'Service Centre')}</strong>
                ${a.isPrimary?'<span class="pill badge-blue" style="margin-left:8px;font-size:11px">⭐ Primary Store</span>':''}
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-outline btn-sm" style="padding:4px 10px;font-size:12px" onclick="openAddressModal('${a.id}')">Edit</button>
                ${!a.isPrimary?`<button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:12px" onclick="deleteAddress('${a.id}')">Delete</button>`:''}
              </div>
            </div>

            <p style="font-size:13.5px;color:var(--gray-700);line-height:1.5;margin:0 0 10px">
              🏢 <strong>Address:</strong> ${escapeHtml(fullAddr)}
            </p>

            <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--gray-500);margin-bottom:12px">
              ${a.timing?`<span>⏰ ${escapeHtml(a.timing)}</span>`:''}
              ${aPhone?`<span>📞 ${escapeHtml(aPhone)}</span>`:''}
              ${aWa?`<span>💬 WA: ${escapeHtml(aWa)}</span>`:''}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid rgba(0,0,0,.06)">
              ${!a.isPrimary?`
                <button class="btn btn-outline btn-sm" onclick="setPrimaryAddress('${a.id}')">⭐ Set as Primary Store</button>
              `:`
                <span class="small-note" style="color:var(--blue);font-weight:600">Default for website header &amp; invoices</span>
              `}
              <a href="https://maps.google.com/?q=${encodeURIComponent(fullAddr)}" target="_blank" rel="noopener noreferrer" class="small-note" style="color:var(--gray-700);font-weight:600">View Map ↗</a>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  ${adminState.modal && adminState.modal.type==='addressModal' ? addressModalHtml() : ''}
  `;
}

function openAddressModal(addrId){
  const s = DB.settings || {};
  const addrs = s.addresses || [];
  const existing = addrId ? addrs.find(x => x.id === addrId) : null;
  adminState.modal = {
    type: 'addressModal',
    addrId: addrId || null,
    data: existing ? { ...existing } : {
      title: '',
      street: '',
      area: '',
      city: '',
      pincode: '',
      fullAddress: '',
      phone: s.storePhone || '',
      whatsapp: s.storeWhatsApp || '',
      timing: s.hours || 'Mon–Sat: 10:00 AM – 8:00 PM',
      isPrimary: addrs.length === 0
    }
  };
  render();
}

function addressModalHtml(){
  const m = adminState.modal || {};
  const d = m.data || {};
  const isEdit = !!m.addrId;
  return `
  <div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal-box" style="max-width:540px">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h3 style="margin:0 0 6px">${isEdit ? 'Edit Store Address' : 'Add New Store Address'}</h3>
    <p class="small-note" style="margin-bottom:18px">Add branch or store location details for customer drop-off and pickup.</p>
    <form onsubmit="return submitAddressForm(event)">
      <div class="field">
        <label>Branch / Location Title</label>
        <input name="title" required value="${escapeHtml(d.title || '')}" placeholder="e.g. Bandra Service Centre or Andheri Express Point">
      </div>
      <div class="grid2">
        <div class="field">
          <label>Shop / Building / Street</label>
          <input name="street" required value="${escapeHtml(d.street || '')}" placeholder="e.g. Shop 14, Linking Road">
        </div>
        <div class="field">
          <label>Area / Landmark</label>
          <input name="area" required value="${escapeHtml(d.area || '')}" placeholder="e.g. Bandra West">
        </div>
      </div>
      <div class="grid2">
        <div class="field">
          <label>City</label>
          <input name="city" required value="${escapeHtml(d.city || '')}" placeholder="e.g. Mumbai">
        </div>
        <div class="field">
          <label>Pincode</label>
          <input name="pincode" required value="${escapeHtml(d.pincode || '')}" placeholder="e.g. 400050">
        </div>
      </div>
      <div class="grid2">
        <div class="field">
          <label>Branch Phone (Optional)</label>
          <input name="phone" value="${escapeHtml(d.phone || '')}" placeholder="e.g. +91 9004245310">
        </div>
        <div class="field">
          <label>Branch WhatsApp (Optional)</label>
          <input name="whatsapp" value="${escapeHtml(d.whatsapp || '')}" placeholder="e.g. 9004245310">
        </div>
      </div>
      <div class="field">
        <label>Opening Timings for this Branch</label>
        <input name="timing" value="${escapeHtml(d.timing || '')}" placeholder="e.g. Mon–Sat: 10:00 AM – 8:00 PM">
      </div>
      <div class="field" style="display:flex;align-items:center;gap:10px;margin-top:10px">
        <input type="checkbox" id="isPrimaryAddr" name="isPrimary" ${d.isPrimary?'checked':''} style="width:auto;margin:0">
        <label for="isPrimaryAddr" style="margin:0;cursor:pointer">⭐ Set as Primary Store Address</label>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:14px" type="submit">${isEdit ? 'Update Address' : 'Add Store Address'}</button>
    </form>
  </div></div>`;
}

async function submitAddressForm(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const m = adminState.modal || {};
  const s = DB.settings = DB.settings || {};
  s.addresses = s.addresses || [];

  const title = f.get('title').trim();
  const street = f.get('street').trim();
  const area = f.get('area').trim();
  const city = f.get('city').trim();
  const pincode = f.get('pincode').trim();
  const phone = f.get('phone').trim() || s.storePhone;
  const whatsapp = f.get('whatsapp').trim() || s.storeWhatsApp;
  const timing = f.get('timing').trim() || s.hours;
  const isPrimary = f.get('isPrimary') === 'on' || s.addresses.length === 0;

  const fullAddress = `${street}, ${area}, ${city} ${pincode}`.replace(/^, | ,/g, '');

  if(isPrimary){
    s.addresses.forEach(a => { a.isPrimary = false; });
    s.storeAddress = fullAddress;
  }

  if(m.addrId){
    const idx = s.addresses.findIndex(x => x.id === m.addrId);
    if(idx !== -1){
      s.addresses[idx] = { ...s.addresses[idx], title, street, area, city, pincode, fullAddress, phone, whatsapp, timing, isPrimary };
    }
  } else {
    s.addresses.push({
      id: 'addr_' + uid(6),
      title, street, area, city, pincode, fullAddress, phone, whatsapp, timing, isPrimary
    });
  }

  if(!s.addresses.some(a => a.isPrimary) && s.addresses.length > 0){
    s.addresses[0].isPrimary = true;
    s.storeAddress = s.addresses[0].fullAddress;
  }

  await persist('settings');
  toast(m.addrId ? 'Store address updated.' : 'New store address added.');
  closeModal();
  return false;
}

async function setPrimaryAddress(addrId){
  const s = DB.settings;
  if(!s || !s.addresses) return;
  s.addresses.forEach(a => {
    if(a.id === addrId){
      a.isPrimary = true;
      s.storeAddress = a.fullAddress;
    } else {
      a.isPrimary = false;
    }
  });
  await persist('settings');
  toast('Primary store location updated.');
  render();
}

async function deleteAddress(addrId){
  const s = DB.settings;
  if(!s || !s.addresses) return;
  if(s.addresses.length <= 1){
    toast('Cannot delete the only store address.');
    return;
  }
  if(!confirm('Are you sure you want to delete this store address?')) return;
  const target = s.addresses.find(x => x.id === addrId);
  s.addresses = s.addresses.filter(x => x.id !== addrId);
  if(target && target.isPrimary && s.addresses.length > 0){
    s.addresses[0].isPrimary = true;
    s.storeAddress = s.addresses[0].fullAddress;
  }
  await persist('settings');
  toast('Store address deleted.');
  render();
}

async function saveGeneralSettings(e){
  e.preventDefault();
  const f = new FormData(e.target);
  const s = DB.settings = DB.settings || {};
  s.storeName = f.get('storeName').trim();
  s.storePhone = f.get('storePhone').trim();
  s.storeWhatsApp = f.get('storeWhatsApp').trim();
  s.storeEmail = f.get('storeEmail').trim();
  s.hours = f.get('hours').trim();
  await persist('settings');
  toast('Contact settings saved successfully.');
  render();
}

async function updateSetting(key,val){ DB.settings[key]=val; await persist('settings'); toast('Settings updated.'); }
