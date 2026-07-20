#!/usr/bin/env python3
import subprocess, os, sys
HERE="/home/user/staff-wc2026/scratchpad-video"
FF=os.path.join(HERE,"ffmpeg"); A=os.path.join(HERE,"audio")
def run(cmd,tag):
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode!=0: print(f"[FAIL {tag}]\n"+r.stderr[-1500:]); sys.exit(1)

TOTAL=38.6
# VO cues: (file, start_sec, gain)
VO=[("vo1.wav",1.0,1.0),("vo2.wav",7.3,1.0),("vo3.wav",12.9,1.0),
    ("vo4.wav",19.4,1.05),("vo5.wav",24.0,1.05),("vo7.wav",29.7,1.0)]
BOOMS=[0.4,10.9,18.05,23.65,33.45]   # hit times (s)
RISER_END=23.65                       # riser resolves into champion hit

# ---- 1) generate stems ----
run([FF,"-y","-f","lavfi","-i","sine=f=55:d=%.1f"%(TOTAL+1),"-f","lavfi","-i","sine=f=82.41:d=%.1f"%(TOTAL+1),
     "-f","lavfi","-i","sine=f=110:d=%.1f"%(TOTAL+1),"-f","lavfi","-i","sine=f=55.35:d=%.1f"%(TOTAL+1),
     "-f","lavfi","-i","sine=f=164.81:d=%.1f"%(TOTAL+1),
     "-filter_complex",
     "[0]volume=0.9[a];[1]volume=0.45[b];[2]volume=0.3[c];[3]volume=0.45[d];[4]volume=0.10[e];"
     "[a][b][c][d][e]amix=inputs=5:normalize=0,tremolo=f=0.11:d=0.32,lowpass=f=190,aecho=0.8:0.85:70:0.35,"
     "afade=t=in:st=0:d=4,afade=t=out:st=%.1f:d=4.5,volume=0.5,aformat=channel_layouts=stereo:sample_rates=48000"%(TOTAL-4),
     os.path.join(A,"drone.wav")],"drone")

run([FF,"-y","-f","lavfi","-i","sine=f=47:d=1.7","-f","lavfi","-i","sine=f=72:d=1.7",
     "-filter_complex","[0]volume=1.0[a];[1]volume=0.45[b];[a][b]amix=inputs=2:normalize=0,"
     "afade=t=out:st=0.09:d=1.6,lowpass=f=135,volume=1.5,aformat=channel_layouts=stereo:sample_rates=48000",
     os.path.join(A,"boom.wav")],"boom")

run([FF,"-y","-f","lavfi","-i","anoisesrc=d=2.7:color=pink:amplitude=0.8","-f","lavfi","-i","sine=f=60:d=2.7",
     "-filter_complex","[0]highpass=f=240,volume='0.04+0.7*(t/2.7)':eval=frame[n];"
     "[1]volume='0.25*(t/2.7)':eval=frame[s];[n][s]amix=inputs=2:normalize=0,"
     "afade=t=out:st=2.6:d=0.1,volume=0.8,aformat=channel_layouts=stereo:sample_rates=48000",
     os.path.join(A,"riser.wav")],"riser")

# ---- 2) build BED (drone + booms + riser) ----
bed_ins=["-i",os.path.join(A,"drone.wav")]
for _ in BOOMS: bed_ins+=["-i",os.path.join(A,"boom.wav")]
bed_ins+=["-i",os.path.join(A,"riser.wav")]
fc="[0:a]volume=1.0[bed];"
labels=["[bed]"]
idx=1
for t in BOOMS:
    ms=int(t*1000); fc+=f"[{idx}:a]adelay={ms}|{ms},volume=0.8[bm{idx}];"; labels.append(f"[bm{idx}]"); idx+=1
rms=int(max(0,RISER_END-2.7)*1000)
fc+=f"[{idx}:a]adelay={rms}|{rms}[rz];"; labels.append("[rz]")
fc+="".join(labels)+f"amix=inputs={len(labels)}:normalize=0,volume=1.0[bedmix]"
run([FF,"-y",*bed_ins,"-filter_complex",fc,"-map","[bedmix]","-t",str(TOTAL),
     "-c:a","pcm_s16le","-ar","48000",os.path.join(A,"bed.wav")],"bed")

# ---- 3) VO bus ----
vo_ins=[]
for f,st,g in VO: vo_ins+=["-i",os.path.join(A,f)]
fc=""; labs=[]
for i,(f,st,g) in enumerate(VO):
    ms=int(st*1000); fc+=f"[{i}:a]adelay={ms}|{ms},volume={g},highpass=f=90,acompressor=threshold=0.15:ratio=3:attack=8:release=180[v{i}];"; labs.append(f"[v{i}]")
fc+="".join(labs)+f"amix=inputs={len(labs)}:normalize=0,volume=1.3,aformat=channel_layouts=stereo:sample_rates=48000[vobus]"
run([FF,"-y",*vo_ins,"-filter_complex",fc,"-map","[vobus]","-t",str(TOTAL),
     "-c:a","pcm_s16le","-ar","48000",os.path.join(A,"vobus.wav")],"vobus")

# ---- 4) master mixes ----
# VO master: duck bed under VO, then sum, loudnorm -14 LUFS
run([FF,"-y","-i",os.path.join(A,"bed.wav"),"-i",os.path.join(A,"vobus.wav"),
     "-filter_complex",
     f"[1:a]apad=whole_dur={TOTAL},asplit=2[vpa][vpb];"
     "[0:a][vpa]sidechaincompress=threshold=0.04:ratio=7:attack=15:release=320:makeup=1[bd];"
     "[bd][vpb]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=11[mx]",
     "-map","[mx]","-t",str(TOTAL),"-c:a","pcm_s16le","-ar","48000",os.path.join(A,"mix_vo.wav")],"mix_vo")
# Clean master (no VO): bed a touch louder, loudnorm -16
run([FF,"-y","-i",os.path.join(A,"bed.wav"),"-filter_complex","[0:a]volume=1.25,loudnorm=I=-16:TP=-1.5:LRA=11[mx]",
     "-map","[mx]","-t",str(TOTAL),"-c:a","pcm_s16le","-ar","48000",os.path.join(A,"mix_clean.wav")],"mix_clean")
print("AUDIO DONE: audio/mix_vo.wav, audio/mix_clean.wav")
