import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const {chromium}=createRequire(import.meta.url)('playwright');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/,'$1')),'../..');
const server=http.createServer((request,response)=>{
  const relative=request.url==='/'?'index.html':request.url.split('?')[0].replace(/^\//,'');
  fs.readFile(path.join(root,relative),(error,data)=>{
    response.statusCode=error?404:200;
    response.end(error?'not found':data);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const appUrl=`http://127.0.0.1:${server.address().port}/`;

async function measure(label,args=[]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  try {
    await page.goto(appUrl,{waitUntil:'load'});
    await page.waitForSelector('tr.draftrow',{state:'attached'});
    await page.waitForSelector('[data-command-setting="teams"]');
    await page.waitForFunction(()=>typeof WarRoomCommandBarFixes==='object');
    await page.evaluate(()=>{
      clearDraftStateFromBoard();
      WarRoomCommandBarFixes.applySettings({teams:10,slot:5,rounds:16},false);
    });
    await page.waitForFunction(()=>document.body.getAttribute('data-draft-command-mode')==='waiting');
    const waiting=await page.evaluate(()=>{
      const bar=document.getElementById('draft-command-bar');
      const style=getComputedStyle(bar);
      return {
        bar_height:bar.getBoundingClientRect().height,
        inner_width:window.innerWidth,
        client_width:document.documentElement.clientWidth,
        body_font:getComputedStyle(document.body).fontFamily,
        bar_font:style.fontFamily,
        bar_line_height:style.lineHeight,
      };
    });
    await page.evaluate(()=>{
      [...document.querySelectorAll('tr.draftrow')].slice(0,4).forEach((row,index)=>{
        row.classList.remove('drafted-mine','drafted-other');
        row.classList.add('drafted-other');
        row.setAttribute('data-pick',String(index+1));
        row.setAttribute('data-team-slot',String(index+1));
      });
      triggerAllBoardUpdates({deferIntelligence:true});
    });
    await page.waitForFunction(()=>document.body.getAttribute('data-draft-command-mode')==='on-clock');
    await page.waitForSelector('.draft-command-alternatives');
    const onClock=await page.evaluate(()=>({
      bar_height:document.getElementById('draft-command-bar').getBoundingClientRect().height,
      status_height:document.querySelector('.draft-command-status')?.getBoundingClientRect().height ?? null,
      recommendation_height:document.querySelector('.draft-command-recommendation')?.getBoundingClientRect().height ?? null,
      alternatives_height:document.querySelector('.draft-command-alternatives')?.getBoundingClientRect().height ?? null,
    }));
    return {label,args,waiting,on_clock:onClock,delta_px:onClock.bar_height-waiting.bar_height};
  } finally {
    await browser.close();
  }
}

try {
  const variants=[
    ['baseline',[]],
    ['no_subpixel',['--disable-font-subpixel-positioning']],
    ['no_hinting',['--font-render-hinting=none']],
    ['no_subpixel_no_hinting',['--disable-font-subpixel-positioning','--font-render-hinting=none']],
    ['force_scale_1',['--force-device-scale-factor=1']],
    ['hide_scrollbars',['--hide-scrollbars']],
  ];
  const measurements=[];
  for(const [label,args] of variants) measurements.push(await measure(label,args));
  const evidence={platform:process.platform,arch:process.arch,measurements};
  console.log(JSON.stringify({wr074_command_bar_metrics:evidence}));
  if(process.env.GITHUB_STEP_SUMMARY){
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`### WR-074 command-bar platform metrics\n\n\`\`\`json\n${JSON.stringify(evidence,null,2)}\n\`\`\`\n`);
  }
} finally {
  await new Promise(resolve=>server.close(resolve));
}
