import { spawnSync } from 'child_process';
const WD='/tmp/claude-0/-home-user-staff-wc2026/eeb8af3d-b659-50ba-8563-2689496a991b/scratchpad/reel';
const SR=48000, DUR=33.0;
const inputs=[]; const parts=[]; const labels=[];
let idx=0;
function add(inArgs, filter){ inputs.push(...inArgs); const l='e'+idx; parts.push(`[${idx}:a]${filter}[${l}]`); labels.push('['+l+']'); idx++; }
const ms=t=>Math.round(t*1000);

// ---- low-frequency impacts (booms) [time, gain, freq] ----
const booms=[[0.35,0.55,58],[3.05,0.32,72],[4.55,0.32,72],[6.05,0.32,72],[7.35,0.38,64],
 [10.25,0.7,54],[12.15,0.58,58],[14.7,0.48,60],[18.7,0.44,62],[22.4,0.92,48],[27.35,0.68,54],[31.2,0.6,56]];
for(const [t,g,f] of booms){
  add(['-f','lavfi','-t','1.1','-i',`sine=frequency=${f}:sample_rate=${SR}`],
      `volume=${g}*exp(-t*5.5):eval=frame,adelay=${ms(t)}`);
}
// ---- attack clicks on the biggest hits ----
for(const [t,g] of [[0.35,0.16],[10.25,0.14],[22.4,0.2],[27.35,0.14]]){
  add(['-f','lavfi','-t','0.12','-i',`anoisesrc=color=white:sample_rate=${SR}`],
      `volume=${g}*exp(-t*40):eval=frame,highpass=f=320,adelay=${ms(t)}`);
}
// ---- ascending "counter stop" dings on the 4 stats [time,gain,freq] ----
for(const [t,g,f] of [[3.1,0.16,1046],[4.6,0.16,1174],[6.1,0.16,1318],[7.4,0.2,1568]]){
  add(['-f','lavfi','-t','0.5','-i',`sine=frequency=${f}:sample_rate=${SR}`],
      `volume=${g}*exp(-t*9):eval=frame,adelay=${ms(t)}`);
}
// ---- rising whooshes into the big reveals [start, dur, gain] ----
for(const [t,d,g] of [[9.55,0.7,0.26],[21.55,0.85,0.32],[26.7,0.65,0.26],[30.5,0.7,0.24]]){
  add(['-f','lavfi','-t',String(d),'-i',`anoisesrc=color=pink:sample_rate=${SR}`],
      `volume=${g}*pow(t/${d}\\,2):eval=frame,highpass=f=500,lowpass=f=6000,afade=t=out:st=${(d-0.06).toFixed(2)}:d=0.06,adelay=${ms(t)}`);
}
// ---- confetti sparkle at the champion reveal ----
add(['-f','lavfi','-t','1.8','-i',`anoisesrc=color=white:sample_rate=${SR}`],
    `volume=0.15*exp(-t*2.6):eval=frame,highpass=f=4800,tremolo=f=13:d=0.7,adelay=${ms(22.4)}`);

// ---- low sustained drone bed (tension), whole track ----
add(['-f','lavfi','-t',String(DUR),'-i',`sine=frequency=55:sample_rate=${SR}`], `volume=0.055`);
add(['-f','lavfi','-t',String(DUR),'-i',`sine=frequency=82.5:sample_rate=${SR}`], `volume=0.04`);
// bed gets a gentle swell toward the champion moment then eases
add(['-f','lavfi','-t',String(DUR),'-i',`sine=frequency=110:sample_rate=${SR}`], `volume=0.03*(0.4+0.6*sin(3.14159*t/${DUR})):eval=frame`);

const mixIn=labels.join('');
const filter = `${parts.join(';')};${mixIn}amix=inputs=${labels.length}:normalize=0:dropout_transition=0[mx];`+
  `[mx]lowpass=f=14000,highpass=f=28,alimiter=limit=0.92:level=false,`+
  `loudnorm=I=-15:TP=-1.4:LRA=11,afade=t=in:st=0:d=0.15,afade=t=out:st=${(DUR-0.7).toFixed(2)}:d=0.7,atrim=0:${DUR},aformat=sample_rates=${SR}:channel_layouts=stereo[out]`;

const args=['-y',...inputs,'-filter_complex',filter,'-map','[out]','-c:a','pcm_s16le',`${WD}/audio.wav`];
const r=spawnSync(`${WD}/ffmpeg`,args,{encoding:'utf8'});
if(r.status!==0){ console.error(r.stderr.split('\n').slice(-12).join('\n')); process.exit(1); }
console.log('audio.wav written. inputs:',idx);
