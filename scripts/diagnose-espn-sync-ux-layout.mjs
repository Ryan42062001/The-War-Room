import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
function mark(name) { process.stdout.write(`[stage] ${name}\n`); }
function bounded(label, promise, timeoutMs = 12000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Timed out at ${label} after ${timeoutMs}ms`)), timeoutMs); })
  ]).finally(() => clearTimeout(timer));
}
const mimeTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer((request,response)=>{const relative=request.url==='/'?'index.html':request.url.split('?')[0].replace(/^\//,'');const filePath=path.join(root,relative);if(!filePath.startsWith(root)){response.statusCode=403;response.end('forbidden');return;}fs.readFile(filePath,(error,data)=>{if(error){response.statusCode=404;response.end('not found');return;}response.statusCode=200;response.setHeader('Content-Type',mimeTypes[path.extname(filePath)]||'application/octet-stream');response.setHeader('Cache-Control','no-store');response.end(data);});});
mark('server-listen-start');
await bounded('server-listen',new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)),5000);
mark('server-listening');
const appUrl=`http://127.0.0.1:${server.address().port}/`;
function healthyStatus(overrides={}){return{extensionVersion:'0.9.14',config:{teams:10,draftSlot:4,rounds:16},picks:[{overallPick:1},{overallPick:2},{overallPick:3}],espn:{connected:true,draftPage:true,expectedCompleted:3,method:'network',visibleCandidates:0},warRoom:{connected:true,applied:3,unmatched:0,requiredExtensionVersion:'0.9.14'},...overrides,espn:{connected:true,draftPage:true,expectedCompleted:3,method:'network',visibleCandidates:0,...(overrides.espn||{})},warRoom:{connected:true,applied:3,unmatched:0,requiredExtensionVersion:'0.9.14',...(overrides.warRoom||{})}};}
let browser;let popupContext;
try{
  mark('browser-launch-start');browser=await bounded('browser-launch',chromium.launch({headless:true,executablePath:process.env.CHROME_PATH}),15000);mark('browser-launch-complete');
  mark('war-room-page-create-start');const page=await bounded('war-room-page-create',browser.newPage({viewport:{width:1280,height:900}}),8000);mark('war-room-page-created');
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  mark('war-room-navigation-start');await bounded('war-room-navigation',page.goto(appUrl,{waitUntil:'domcontentloaded',timeout:10000}),12000);mark('war-room-navigation-complete');
  mark('war-room-status-selector-wait-start');await bounded('war-room-status-selector',page.waitForSelector('#espn-sync-status',{state:'attached',timeout:8000}),10000);mark('war-room-status-selector-ready');
  mark('presentation-script-load-start');await bounded('presentation-script-load',page.addScriptTag({url:appUrl+'extensions/espn-companion/sync-presentation.js'}),8000);mark('presentation-script-loaded');
  mark('trust-ui-script-load-start');await bounded('trust-ui-script-load',page.addScriptTag({url:appUrl+'extensions/espn-companion/war-room-sync-trust-ui.js'}),8000);await bounded('trust-ui-ready',page.waitForFunction(()=>Boolean(window.WarRoomEspnSyncTrustUi),null,{timeout:8000}),10000);mark('trust-ui-script-loaded');
  mark('war-room-state-tests-start');const stateResult=await bounded('war-room-state-tests',page.evaluate(status=>{const p=window.WarRoomEspnSyncTrustUi.renderStatus(status);const b=document.getElementById('espn-sync-status');return{key:p.key,text:b.innerText.trim(),hidden:b.hidden};},healthyStatus()),8000);assert.equal(stateResult.key,'caughtUp');assert.equal(stateResult.hidden,false);mark('war-room-state-tests-complete');
  mark('responsive-tests-start');
  for(const width of [320,360,375,390,412,430,768,1280]){
    await bounded(`responsive-set-${width}`,page.setViewportSize({width,height:900}),5000);
    const metrics=await bounded(`responsive-measure-${width}`,page.evaluate(status=>{
      window.WarRoomEspnSyncTrustUi.renderStatus(status);
      const badge=document.getElementById('espn-sync-status');const rect=badge.getBoundingClientRect();const shownWidth=document.documentElement.scrollWidth;const text=badge.innerText.trim();
      badge.hidden=true;const hiddenWidth=document.documentElement.scrollWidth;badge.hidden=false;window.WarRoomEspnSyncTrustUi.renderStatus(status);
      const offenders=Array.from(document.querySelectorAll('body *')).map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,80),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};}).filter(x=>x.right>window.innerWidth+1||x.left<-1).sort((a,b)=>b.right-a.right).slice(0,8);
      const statusbar=document.querySelector('.statusbar');
      return{width,shownWidth,hiddenWidth,viewport:window.innerWidth,text,badgeLeft:Math.round(rect.left),badgeRight:Math.round(rect.right),statusbarWrap:statusbar?getComputedStyle(statusbar).flexWrap:null,offenders};
    },healthyStatus()),8000);
    process.stdout.write(`[diagnostic] responsive ${JSON.stringify(metrics)}\n`);
    if(width!==768){assert.ok(metrics.shownWidth<=metrics.viewport+1,`${width}px overflow`);assert.ok(metrics.badgeLeft>=-1&&metrics.badgeRight<=width+1,`${width}px badge outside viewport`);}
  }
  mark('responsive-tests-complete');assert.deepEqual(pageErrors,[]);
  mark('war-room-page-close-start');await bounded('war-room-page-close',page.close(),8000);mark('war-room-page-close-complete');
  mark('popup-context-create-start');popupContext=await bounded('popup-context-create',browser.newContext({viewport:{width:320,height:900}}),8000);mark('popup-context-create-complete');
  mark('popup-init-script-start');await bounded('popup-init-script',popupContext.addInitScript(initialStatus=>{window.__warRoomPopupStatus=initialStatus;const onMessage={addListener:function(){}};window.chrome={runtime:{getManifest:function(){return{version:'0.9.14'};},getURL:function(value){return value;},sendMessage:function(){return Promise.resolve(window.__warRoomPopupStatus);},onMessage},tabs:{query:function(){return Promise.resolve([]);},create:function(){return Promise.resolve();}},storage:{local:{get:function(){return Promise.resolve({});},set:function(){return Promise.resolve();},remove:function(){return Promise.resolve();}}},scripting:{executeScript:function(){return Promise.resolve([]);}}};},healthyStatus()),8000);mark('popup-init-script-complete');
  mark('popup-page-create-start');const popup=await bounded('popup-page-create',popupContext.newPage(),8000);mark('popup-page-create-complete');const popupErrors=[];popup.on('pageerror',error=>popupErrors.push(error.message));
  mark('popup-navigation-start');await bounded('popup-navigation',popup.goto(appUrl+'extensions/espn-companion/popup.html',{waitUntil:'load',timeout:10000}),12000);mark('popup-navigation-complete');
  mark('popup-health-wait-start');await bounded('popup-health-wait',popup.waitForFunction(()=>document.getElementById('sync-health-title')?.textContent.includes('Caught up'),null,{timeout:8000}),10000);mark('popup-health-wait-complete');
  mark('popup-state-tests-start');const popupHealth=await bounded('popup-state-tests',popup.evaluate(()=>({heading:document.querySelector('h1')?.textContent||'',health:document.getElementById('sync-health-title')?.textContent||'',width:document.documentElement.scrollWidth,viewport:window.innerWidth})),8000);assert.equal(popupHealth.heading,'ESPN Live Sync');assert.equal(popupHealth.health,'ESPN Live Sync · Caught up');assert.ok(popupHealth.width<=popupHealth.viewport+1);mark('popup-state-tests-complete');
  mark('technical-details-test-start');await bounded('technical-details-click',popup.locator('.technical-details summary').click({timeout:8000}),10000);const technicalText=await bounded('technical-details-read',popup.locator('.technical-details').innerText({timeout:8000}),10000);assert.match(technicalText,/Structured page state/);assert.match(technicalText,/Network observation/);assert.match(technicalText,/Board fallback/);assert.match(technicalText,/Copy diagnostics/);assert.match(technicalText,/Reset trace/);assert.deepEqual(popupErrors,[]);mark('technical-details-test-complete');
  mark('popup-context-close-start');await bounded('popup-context-close',popupContext.close(),8000);popupContext=null;mark('popup-context-close-complete');
  mark('browser-close-start');await bounded('browser-close',browser.close(),10000);browser=null;mark('browser-close-complete');
  mark('server-close-start');await bounded('server-close',new Promise(resolve=>{server.close(resolve);if(typeof server.closeAllConnections==='function')server.closeAllConnections();}),8000);mark('server-close-complete');mark('diagnostic-success');
}catch(error){process.stderr.write(`[diagnostic-error] ${error&&error.stack?error.stack:error}\n`);throw error;}finally{if(popupContext){try{await bounded('finally-popup-context-close',popupContext.close(),3000);}catch{}}if(browser){try{await bounded('finally-browser-close',browser.close(),5000);}catch{}}if(server.listening){try{await bounded('finally-server-close',new Promise(resolve=>{server.close(resolve);if(typeof server.closeAllConnections==='function')server.closeAllConnections();}),3000);}catch{}}}
