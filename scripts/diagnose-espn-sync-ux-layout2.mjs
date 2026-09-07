import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/,'$1')),'..');
const mark=n=>process.stdout.write(`[stage] ${n}\n`);
function bounded(label,promise,ms=10000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Timed out at ${label} after ${ms}ms`)),ms);})]).finally(()=>clearTimeout(timer));}
const server=http.createServer((req,res)=>{const rel=req.url==='/'?'index.html':req.url.split('?')[0].replace(/^\//,'');const p=path.join(root,rel);fs.readFile(p,(e,d)=>{if(e){res.statusCode=404;res.end('not found');return;}res.setHeader('Content-Type',path.extname(p)==='.css'?'text/css':path.extname(p)==='.html'?'text/html':'text/javascript');res.setHeader('Cache-Control','no-store');res.end(d);});});
const healthy={extensionVersion:'0.9.14',config:{teams:10,draftSlot:4,rounds:16},picks:[{overallPick:1},{overallPick:2},{overallPick:3}],espn:{connected:true,draftPage:true,expectedCompleted:3,method:'network',visibleCandidates:0},warRoom:{connected:true,applied:3,unmatched:0,requiredExtensionVersion:'0.9.14'}};
let browser,ctx;
try{
 mark('server-listen-start');await bounded('server-listen',new Promise(r=>server.listen(0,'127.0.0.1',r)),5000);mark('server-listening');const base=`http://127.0.0.1:${server.address().port}/`;
 mark('browser-launch-start');browser=await bounded('browser-launch',chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),15000);mark('browser-launch-complete');
 mark('war-room-page-create-start');const page=await bounded('war-room-page-create',browser.newPage({viewport:{width:1280,height:900}}));mark('war-room-page-created');const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 mark('war-room-navigation-start');await bounded('war-room-navigation',page.goto(base,{waitUntil:'domcontentloaded',timeout:10000}),12000);mark('war-room-navigation-complete');
 await bounded('war-room-status-selector',page.waitForSelector('#espn-sync-status',{state:'attached',timeout:8000}));mark('war-room-status-selector-ready');
 await bounded('presentation-script-load',page.addScriptTag({url:base+'extensions/espn-companion/sync-presentation.js'}));mark('presentation-script-loaded');
 await bounded('trust-ui-script-load',page.addScriptTag({url:base+'extensions/espn-companion/war-room-sync-trust-ui.js'}));await bounded('trust-ui-ready',page.waitForFunction(()=>Boolean(window.WarRoomEspnSyncTrustUi),null,{timeout:8000}));mark('trust-ui-script-loaded');
 mark('war-room-state-tests-start');await bounded('war-room-state-tests',page.evaluate(status=>window.WarRoomEspnSyncTrustUi.renderStatus(status).key,healthy));mark('war-room-state-tests-complete');
 mark('responsive-tests-start');
 for(const width of [320,360,375,390,412,430,768,1280]){
   await page.setViewportSize({width,height:900});
   const m=await bounded(`responsive-${width}`,page.evaluate(({status,width})=>{
     window.WarRoomEspnSyncTrustUi.renderStatus(status);const b=document.getElementById('espn-sync-status');const r=b.getBoundingClientRect();const shown=document.documentElement.scrollWidth;const text=b.innerText.trim();b.hidden=true;const hidden=document.documentElement.scrollWidth;b.hidden=false;window.WarRoomEspnSyncTrustUi.renderStatus(status);const offenders=Array.from(document.querySelectorAll('body *')).map(el=>{const x=el.getBoundingClientRect();return{tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,60),left:Math.round(x.left),right:Math.round(x.right),w:Math.round(x.width)};}).filter(x=>x.right>innerWidth+1||x.left<-1).sort((a,b)=>b.right-a.right).slice(0,6);const sb=document.querySelector('.statusbar');return{width,shown,hidden,viewport:innerWidth,text,badgeLeft:Math.round(r.left),badgeRight:Math.round(r.right),wrap:sb?getComputedStyle(sb).flexWrap:null,offenders};},{status:healthy,width}));
   process.stdout.write(`[diagnostic] ${JSON.stringify(m)}\n`);
   if(width!==768){assert.ok(m.shown<=m.viewport+1,`${width}px overflow`);assert.ok(m.badgeLeft>=-1&&m.badgeRight<=width+1,`${width}px badge bounds`);}
 }
 mark('responsive-tests-complete');assert.deepEqual(pageErrors,[]);
 mark('war-room-page-close-start');await bounded('war-room-page-close',page.close());mark('war-room-page-close-complete');
 mark('popup-context-create-start');ctx=await bounded('popup-context-create',browser.newContext({viewport:{width:320,height:900}}));mark('popup-context-create-complete');
 await ctx.addInitScript(status=>{window.__warRoomPopupStatus=status;window.chrome={runtime:{getManifest:()=>({version:'0.9.14'}),getURL:v=>v,sendMessage:()=>Promise.resolve(window.__warRoomPopupStatus),onMessage:{addListener(){}}},tabs:{query:()=>Promise.resolve([]),create:()=>Promise.resolve()},storage:{local:{get:()=>Promise.resolve({}),set:()=>Promise.resolve(),remove:()=>Promise.resolve()}},scripting:{executeScript:()=>Promise.resolve([])}};},healthy);
 mark('popup-page-create-start');const popup=await bounded('popup-page-create',ctx.newPage());mark('popup-page-create-complete');const popupErrors=[];popup.on('pageerror',e=>popupErrors.push(e.message));
 mark('popup-navigation-start');await bounded('popup-navigation',popup.goto(base+'extensions/espn-companion/popup.html',{waitUntil:'load',timeout:10000}),12000);mark('popup-navigation-complete');
 mark('popup-health-wait-start');await bounded('popup-health-wait',popup.waitForFunction(()=>document.getElementById('sync-health-title')?.textContent.includes('Caught up'),null,{timeout:8000}));mark('popup-health-wait-complete');
 mark('popup-state-tests-start');const ph=await popup.evaluate(()=>({h:document.querySelector('h1')?.textContent,s:document.getElementById('sync-health-title')?.textContent,w:document.documentElement.scrollWidth,v:innerWidth}));assert.equal(ph.h,'ESPN Live Sync');assert.equal(ph.s,'ESPN Live Sync · Caught up');assert.ok(ph.w<=ph.v+1);mark('popup-state-tests-complete');
 mark('technical-details-test-start');await bounded('technical-details-click',popup.locator('.technical-details summary').click({timeout:8000}));const t=await popup.locator('.technical-details').innerText();assert.match(t,/Structured page state/);assert.match(t,/Network observation/);assert.match(t,/Board fallback/);assert.match(t,/Copy diagnostics/);assert.match(t,/Reset trace/);assert.deepEqual(popupErrors,[]);mark('technical-details-test-complete');
 mark('popup-context-close-start');await bounded('popup-context-close',ctx.close());ctx=null;mark('popup-context-close-complete');
 mark('browser-close-start');await bounded('browser-close',browser.close());browser=null;mark('browser-close-complete');
 mark('server-close-start');await bounded('server-close',new Promise(r=>server.close(r)),8000);mark('server-close-complete');mark('diagnostic-success');
}catch(e){process.stderr.write(`[diagnostic-error] ${e.stack||e}\n`);throw e;}finally{if(ctx)try{await ctx.close();}catch{}if(browser)try{await browser.close();}catch{}if(server.listening)try{server.closeAllConnections?.();await new Promise(r=>server.close(r));}catch{}}
