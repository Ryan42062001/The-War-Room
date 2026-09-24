// WR-151 DORMANT: inert localhost-only isolated-browser security qualification.
// NEVER loaded by ordinary CI, Builder PR publication, or War Room app.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const V4 = '198.51.100.1';
const V6 = '2001:db8::1';
const TARGETS = ['http://198.51.100.1:443/wr151-inert',
  'http://[2001:db8::1]:443/wr151-inert'];
const PROXY_KEYS = /(?:^|_)(?:http|https|all|no)_proxy$|proxy|broker|agent|socket/i;
const EXPECTED_DENIAL = /ERR_(?:ADDRESS_UNREACHABLE|INTERNET_DISCONNECTED|NETWORK_CHANGED|NETWORK_ACCESS_DENIED|PROXY_CONNECTION_FAILED)/;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const audit = (kind, receipt) => console.log('WR151_' + kind + ' ' + JSON.stringify(receipt));
const netInode = pid => fs.readlinkSync('/proc/' + pid + '/ns/net');
const procStatus = pid => fs.readFileSync('/proc/' + pid + '/status', 'utf8');
const procField = (s, name) => (s.match(new RegExp('^' + name + ':\\s*([^\\n]+)', 'm')) || [])[1]?.trim();
const cmd = (name, args) => execFileSync(name, args, {encoding:'utf8',timeout:3000,
  stdio:['ignore','pipe','pipe']}).trim();
const listPids = () => fs.readdirSync('/proc').filter(n => /^[0-9]+$/.test(n)).map(Number);

function verifyNamespace(stage) {
  const me = process.pid;
  const status = procStatus(me);
  const inode = netInode(me);
  assert.match(inode, /^net:\[\d+\]$/, stage + ': missing kernel network namespace inode');
  assert.notEqual(inode, process.env.WR151_PARENT_NETNS_INODE,
    stage + ': still in host network namespace');
  assert.ok(process.getuid() !== 0, stage + ': privilege not dropped');
  for (const cap of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb'])
    assert.equal(BigInt('0x' + procField(status,cap)), 0n, stage + ': capability ' + cap);
  assert.equal(procField(status,'NoNewPrivs'), '1', stage + ': privilege gains allowed');
  const links = JSON.parse(cmd('ip',['-j','link','show']));
  assert.deepEqual(links.map(x => x.ifname), ['lo'], stage + ': non-loopback interface');
  assert.ok(links[0].flags.includes('UP'), stage + ': loopback down');
  const routes4 = JSON.parse(cmd('ip',['-j','-4','route','show','table','main']));
  const routes6 = JSON.parse(cmd('ip',['-j','-6','route','show','table','main']));
  assert.deepEqual(routes4, [], stage + ': nonlocal IPv4 route exists');
  assert.deepEqual(routes6, [], stage + ': nonlocal IPv6 route exists');
  const default4 = cmd('ip',['-4','route','show','default']);
  const default6 = cmd('ip',['-6','route','show','default']);
  assert.equal(default4 + default6, '', stage + ': default route exists');
  const names = Object.keys(process.env).filter(name => PROXY_KEYS.test(name)).sort();
  assert.deepEqual(names, [], stage + ': inherited proxy/broker environment variable names');
  audit('NAMESPACE_RECEIPT', {stage, pid:me, ppid:process.ppid, netns:inode,
    hostNetns:process.env.WR151_PARENT_NETNS_INODE, uid:process.getuid(),
    noNewPrivs:true, caps:'none', interfaces:['lo'], mainRoutes4:0, mainRoutes6:0,
    defaultRoutes:0, inheritedProxyOrBrokerVariableNames:names});
  return inode;
}

function verifyNoInheritedBrokerSocket() {
  const descriptors = fs.readdirSync('/proc/self/fd').filter(s => /^\d+$/.test(s))
    .map(Number).filter(n => n > 2);
  const sockets = [];
  for (const fd of descriptors) {
    try {
      const kind = fs.readlinkSync('/proc/self/fd/' + fd);
      if (/^socket:\[\d+\]$/.test(kind)) sockets.push(fd);
    } catch { /* /proc enumeration races: fail only on surviving broker sockets */ }
  }
  assert.deepEqual(sockets, [], 'inherited broker socket detected before fixture creation');
  audit('BROKER_DESCRIPTOR_RECEIPT', {inheritedNonstdioSockets:0,
    originalProxyOrBrokerVariableNames:Object.keys(process.env).filter(k=>PROXY_KEYS.test(k))});
}

function inspectBrowserTree(browserPid, inode, serviceWorkerRequired) {
  assert.ok(Number.isInteger(browserPid) && browserPid > 1, 'browser OS PID absent');
  const meta = new Map();
  for (const pid of listPids()) {
    try {
      const status = procStatus(pid);
      const ppid = Number(procField(status,'PPid'));
      meta.set(pid, {pid,ppid,netns:netInode(pid),
        name:procField(status,'Name'), status});
    } catch { /* exited between enumerating and reading */ }
  }
  assert.ok(meta.has(browserPid), 'browser PID exited before process custody');
  const descendants = new Set([browserPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of meta.values())
      if (descendants.has(p.ppid) && !descendants.has(p.pid)) {
        descendants.add(p.pid); changed = true;
      }
  }
  const members = [...descendants].map(pid=>meta.get(pid)).filter(Boolean);
  assert.ok(members.length >= 2, 'Chromium child process attribution unavailable');
  for (const p of members) {
    assert.equal(p.netns, inode, 'Chromium descendant escaped namespace: pid ' + p.pid);
    assert.equal(Number(procField(p.status,'Uid')?.split(/\s+/)[0]),process.getuid(),
      'Chromium child changed uid: pid ' + p.pid);
    assert.equal(BigInt('0x'+procField(p.status,'CapEff')),0n,
      'Chromium descendant has effective capabilities: pid '+p.pid);
  }
  // ServiceWorker execution is a browser renderer thread. A CDP live
  // service_worker target alone has no OS PID. Require the kernel task-name
  // signature on exactly one Chromium renderer PID; if the actual Chromium
  // version does not expose this, fail UNVERIFIED rather than inventing a PID.
  const workerCandidates = [];
  for (const p of members) {
    let taskNames=[];
    try {
      taskNames=fs.readdirSync('/proc/'+p.pid+'/task').map(tid=>{
        try { return fs.readFileSync('/proc/'+p.pid+'/task/'+tid+'/comm','utf8').trim(); }
        catch { return ''; }
      });
    } catch { /* process exited */ }
    if (taskNames.some(name=>/service.?worker/i.test(name)))
      workerCandidates.push({pid:p.pid,threadNames:taskNames.filter(n=>/service.?worker/i.test(n))});
  }
  if (serviceWorkerRequired && workerCandidates.length !== 1) {
    audit('WORKER_PID_UNVERIFIED',{browserPid,workerPidCandidateCount:workerCandidates.length,
      reason:'CDP worker target cannot establish unique kernel worker renderer PID'});
    throw new Error('UNVERIFIED: unique controlling service-worker OS PID attribution unavailable');
  }
  audit('PROCESS_CUSTODY',{browserPid,descendantPids:[...descendants].sort((a,b)=>a-b),
    namespaceInode:inode,serviceWorkerPid:workerCandidates[0]?.pid ?? null,
    serviceWorkerKernelThreadNames:workerCandidates[0]?.threadNames ?? [],
    allDescendantsUnprivileged:true,allDescendantsSameNetns:true});
  return {browserPid,workerPid:workerCandidates[0]?.pid ?? null,descendants};
}

async function noRouteSocket(host) {
  return await new Promise((resolve,reject)=>{
    const socket = net.connect({host,port:443});
    const timeout = setTimeout(()=>{socket.destroy();reject(new Error('UNVERIFIED timeout: '+host));},2000);
    socket.once('connect',()=>{clearTimeout(timeout);socket.destroy();reject(new Error('EGRESS SUCCEEDED: '+host));});
    socket.once('error',error=>{
      clearTimeout(timeout);socket.destroy();
      if (['ENETUNREACH','EHOSTUNREACH','ENETDOWN','EAFNOSUPPORT'].includes(error.code))
        resolve(error.code);
      else reject(new Error('UNVERIFIED direct socket failure '+host+': '+error.code));
    });
  });
}

const PAGE = '<!doctype html><html><head><meta charset="utf-8"><title>WR151 INERT LOCAL FIXTURE</title></head><body>WR151 INERT LOCAL FIXTURE. NO WAR ROOM CONTENT.</body></html>';
const WORKER = [
  "self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));",
  "self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));",
  "self.addEventListener('message', event => {",
  "  if (!event.data || event.data.kind !== 'WR151_FETCH' || !event.ports[0]) return;",
  "  event.waitUntil((async () => {",
  "    const url = event.data.url;",
  "    try {",
  "      const response = await fetch(url, {mode:'no-cors',cache:'no-store',signal:AbortSignal.timeout(2500)});",
  "      event.ports[0].postMessage({url,unexpectedSuccess:true,status:response.status,type:response.type});",
  "    } catch (error) {",
  "      event.ports[0].postMessage({url,unexpectedSuccess:false,errorName:error.name});",
  "    }",
  "  })());",
  "});"
].join('\n');

function startFixture() {
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      if (req.url === '/') {
        res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
        res.end(PAGE); return;
      }
      if (req.url === '/sw.js') {
        res.writeHead(200,{'content-type':'application/javascript; charset=utf-8',
          'service-worker-allowed':'/','cache-control':'no-store'});
        res.end(WORKER); return;
      }
      if (req.url === '/ok') {
        res.writeHead(200,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
        res.end('WR151_LOOPBACK_OK'); return;
      }
      res.writeHead(404);res.end();
    });
    server.on('error',reject);
    server.listen(0,'127.0.0.1',()=>{
      const address=server.address();
      assert.equal(address.address,'127.0.0.1');
      resolve({server,url:'http://127.0.0.1:'+address.port});
    });
  });
}

function browserOsPid() {
  // Playwright Browser has no public process() API. Derive the *actual* OS
  // Chromium parent from /proc PPid and an executable identity check instead.
  const candidates=[];
  for (const pid of listPids()) {
    try {
      const status=procStatus(pid);
      if (Number(procField(status,'PPid'))!==process.pid) continue;
      const cmdline=fs.readFileSync('/proc/'+pid+'/cmdline','utf8');
      if (/(?:chrome-headless-shell|chrome|chromium)/i.test(cmdline))
        candidates.push(pid);
    } catch { /* short-lived child */ }
  }
  assert.equal(candidates.length,1,'UNVERIFIED: unique Playwright Chromium parent OS PID');
  return candidates[0];
}

async function browserScenario({url, inode, proxyMode}) {
  verifyNamespace(proxyMode ? 'proxy-before-launch' : 'direct-before-launch');
  const browserOptions={headless:true};
  if (proxyMode) {
    // Controlled documentation-only proxy: no host proxy, DNS, or relay.
    // Chromium's explicit proxy path MUST be denied by this same netns.
    browserOptions.proxy={server:'http://198.51.100.1:443',bypass:'127.0.0.1,localhost'};
  }
  const browser=await chromium.launch(browserOptions);
  const browserPid=browserOsPid();
  let context;
  const failures=[];
  try {
    context=await browser.newContext({serviceWorkers:'allow'});
    context.on('requestfailed',request=>{
      if (TARGETS.some(target=>request.url().startsWith(target))) {
        let worker=false;
        try { worker=Boolean(request.serviceWorker?.()); } catch {}
        failures.push({url:request.url(),worker,error:request.failure()?.errorText||''});
      }
    });
    const page=await context.newPage();
    await page.goto(url+'/',{waitUntil:'load',timeout:5000});
    assert.match(await page.title(),/^WR151 INERT LOCAL FIXTURE$/);
    await page.evaluate(async ()=>{
      await navigator.serviceWorker.register('/sw.js',{scope:'/'});
      await navigator.serviceWorker.ready;
    });
    await page.reload({waitUntil:'load',timeout:5000});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:5000});
    const ready=await page.evaluate(async ()=>{
      const response=await fetch('/ok',{cache:'no-store'});
      return {controlled:Boolean(navigator.serviceWorker.controller),
        scope:navigator.serviceWorker.controller?.scriptURL,
        status:response.status,body:await response.text()};
    });
    assert.deepEqual({controlled:ready.controlled,status:ready.status,body:ready.body},
      {controlled:true,status:200,body:'WR151_LOOPBACK_OK'},'positive local page+SW control');
    assert.equal(ready.scope,url+'/sw.js','unexpected SW asset/scope');

    // CDP target proves a live activated SW, not just register() resolving.
    const cdp=await browser.newBrowserCDPSession();
    const targets=(await cdp.send('Target.getTargets')).targetInfos;
    const swTargets=targets.filter(t=>t.type==='service_worker' && t.url===url+'/sw.js');
    assert.equal(swTargets.length,1,'UNVERIFIED: unique active controlling SW CDP target unavailable');
    const processReceipt=inspectBrowserTree(browserPid,inode,true);

    const directV4=await noRouteSocket(V4);
    const directV6=await noRouteSocket(V6);
    for (const address of TARGETS) {
      const pageResult=await page.evaluate(async target=>{
        try {
          const response=await fetch(target,{mode:'no-cors',cache:'no-store',
            signal:AbortSignal.timeout(2500)});
          return {unexpectedSuccess:true,status:response.status,type:response.type};
        } catch(error) {return {unexpectedSuccess:false,errorName:error.name};}
      },address);
      assert.equal(pageResult.unexpectedSuccess,false,'EGRESS: page external fetch succeeded '+address);
      const workerResult=await page.evaluate(target=>new Promise((resolve,reject)=>{
        const channel=new MessageChannel();
        const timeout=setTimeout(()=>reject(new Error('UNVERIFIED SW fetch timeout')),4000);
        channel.port1.onmessage=event=>{clearTimeout(timeout);resolve(event.data);};
        navigator.serviceWorker.controller.postMessage({kind:'WR151_FETCH',url:target},[channel.port2]);
      }),address);
      assert.equal(workerResult.url,address,'SW response URL mismatch');
      assert.equal(workerResult.unexpectedSuccess,false,'EGRESS: SW external fetch succeeded '+address);
    }
    const pageFailures=failures.filter(x=>!x.worker);
    const workerFailures=failures.filter(x=>x.worker);
    for (const target of TARGETS) {
      assert.ok(pageFailures.some(f=>f.url.startsWith(target)&&EXPECTED_DENIAL.test(f.error)),
        'UNVERIFIED page denial: no network-level failure receipt for '+target);
      assert.ok(workerFailures.some(f=>f.url.startsWith(target)&&EXPECTED_DENIAL.test(f.error)),
        'UNVERIFIED SW denial: no network-level failure receipt for '+target);
    }
    inspectBrowserTree(browserPid,inode,true);
    verifyNamespace(proxyMode?'proxy-after-probes':'direct-after-probes');
    audit('INERT_BROWSER_PROBES',{proxyMode,localPage:true,controllingServiceWorker:true,
      browserPid,serviceWorkerPid:processReceipt.workerPid,
      reservedTargets:TARGETS,ipv4SocketDenial:directV4,ipv6SocketDenial:directV6,
      pageNetworkDenials:pageFailures.map(f=>({url:f.url,error:f.error})),
      serviceWorkerNetworkDenials:workerFailures.map(f=>({url:f.url,error:f.error})),
      externalSuccesses:0});
  } finally {
    if (context) await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
    if (browserPid && fs.existsSync('/proc/'+browserPid))
      throw new Error('UNVERIFIED: browser PID remains after close');
  }
}

async function main() {
  assert.equal(process.env.NODE_ENV,'test');
  assert.match(process.env.WR151_EXPECTED_HEAD||'',/^[0-9a-f]{40}$/);
  const inode=verifyNamespace('entry');
  verifyNoInheritedBrokerSocket();
  const {server,url}=await startFixture();
  audit('INERT_FIXTURE',{host:'127.0.0.1',port:Number(new URL(url).port),
    inertHtmlOnly:true,inertServiceWorkerOnly:true,loadedWarRoomAssets:false});
  try {
    await browserScenario({url,inode,proxyMode:false});
    // The intentional proxy is documentation-addressed and used only inside
    // the already isolated netns; proxy env VALUES never leave this process.
    process.env.HTTP_PROXY='http://198.51.100.1:443';
    process.env.HTTPS_PROXY='http://198.51.100.1:443';
    process.env.ALL_PROXY='http://198.51.100.1:443';
    audit('CONTROLLED_PROXY_ENV',{names:['ALL_PROXY','HTTPS_PROXY','HTTP_PROXY'],
      configuredAfterInitialScrub:true,proxyIsDocumentationOnly:true});
    // Inspect with expected deliberate proxy variable names, then sanitize
    // again before launching the Chromium proxy-path test.
    for (const name of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY']) delete process.env[name];
    await browserScenario({url,inode,proxyMode:true});
    audit('PREFLIGHT_INERT_PASS',{head:process.env.WR151_EXPECTED_HEAD,netns:inode,
      browserAndWorkerConfinement:true,proxyPathDenied:true,unexpectedExternalSuccesses:0,
      note:'Only inert app-free hosted netns proof; no War Room/browser recovery A->B->A'});
  } finally {
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    audit('FIXTURE_SERVER_CLOSED',{loopbackServerClosed:true});
  }
}
main().catch(error=>{
  audit('PREFLIGHT_FAIL_CLOSED',{name:error.name,message:error.message,
    gate:'UNVERIFIED_OR_FAILED',neverTreatAsPilotPass:true});
  process.exitCode=1;
});
