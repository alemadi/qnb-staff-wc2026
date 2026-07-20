#!/usr/bin/env python3
import subprocess, os, sys
HERE="/home/user/staff-wc2026/scratchpad-video"
FF=os.path.join(HERE,"ffmpeg"); C=os.path.join(HERE,"clips"); G=os.path.join(HERE,"graded")
TF=os.path.join(HERE,"titles","frames")
os.makedirs(G,exist_ok=True)
GRADE=("scale=1145:2036,crop=1080:1920,"
 "curves=r='0/0.02 0.25/0.22 0.5/0.52 0.75/0.85 1/1':g='0/0.01 0.5/0.49 1/0.99':b='0/0.06 0.25/0.24 0.5/0.46 0.75/0.68 1/0.90',"
 "eq=contrast=1.08:saturation=1.06:gamma=0.97,vignette=angle=PI/4.3,noise=alls=7:allf=t,format=yuv420p")

# footage EDL: file, in, dur(out), speed, xfade_after, transition
EDL=[
 ("9particle.mp4", 0.2, 4.7, 1.00, 0.50,"fade"),
 ("n3officeA.mp4", 0.1, 4.9, 1.00, 0.50,"fade"),
 ("n5phone.mp4",   0.3, 2.8, 1.00, 0.45,"fade"),
 ("8trophy.mp4",   0.4, 3.4, 1.00, 0.50,"fadeblack"),
 ("6stadium.mp4",  0.2, 4.7, 1.00, 0.50,"fade"),
 ("n6finallift.mp4",0.2,5.0, 0.90, 0.50,"fadeblack"),
 ("n2champB.mp4",  0.1, 3.4, 0.90, 0.50,"fade"),
 ("n4officeB.mp4", 0.3, 3.6, 1.00, 0.50,"fade"),
 ("7maldives.mp4", 0.2, 4.7, 1.00, 0.50,"fade"),
 ("n1champA.mp4",  0.2, 5.0, 0.96, 0.00,"end"),
]
# titles sequential (card, dur) with overlap
CARDS=[("title",4.60),("scale",5.00),("office",5.20),("race",5.00),
 ("final",5.20),("champion",5.90),("prize",4.60),("signoff",4.80)]
OV=0.35; PRE=0.40
cues=[]; s=PRE
for i,(c,d) in enumerate(CARDS):
    cues.append((c,round(s,3),d)); s=s+d-OV

def run(cmd,tag):
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode!=0:
        print(f"[FAIL {tag}]\n"+ " ".join(cmd)[:400]+"\n"+r.stderr[-1400:]); sys.exit(1)

# 1) grade each shot
for i,(f,tin,dur,sp,xf,tr) in enumerate(EDL):
    srcT=round(dur*sp,3)
    vf=f"setpts=(PTS-STARTPTS)/{sp},{GRADE}"
    if i==len(EDL)-1: vf+=",tpad=stop_mode=clone:stop_duration=1.0"
    out=os.path.join(G,f"s{i}.mp4")
    run([FF,"-y","-ss",str(tin),"-t",str(srcT),"-i",os.path.join(C,f),
         "-vf",vf,"-an","-r","30","-c:v","libx264","-crf","16","-preset","fast","-pix_fmt","yuv420p",out],f"grade{i}")
print("graded",len(EDL),"shots")

# 2) xfade chain
ins=[];
for i in range(len(EDL)): ins+=["-i",os.path.join(G,f"s{i}.mp4")]
fc=""; cur="0:v"; acc=EDL[0][2]
for i in range(1,len(EDL)):
    xf=EDL[i-1][4]; tr=EDL[i-1][5]; off=acc-xf
    out=f"vx{i}"
    fc+=f"[{cur}][{i}:v]xfade=transition={tr}:duration={xf}:offset={off:.3f}[{out}];"
    cur=out; acc=acc+EDL[i][2]-xf
fc=fc.rstrip(";")
run([FF,"-y",*ins,"-filter_complex",fc,"-map",f"[{cur}]","-r","30","-c:v","libx264","-crf","16","-preset","medium","-pix_fmt","yuv420p",os.path.join(HERE,"base.mp4")],"xfade")
print(f"base.mp4 built, ~{acc:.2f}s")

# 3) overlay titles (itsoffset method)
ins=["-i",os.path.join(HERE,"base.mp4")]
for c,st,d in cues: ins+=["-framerate","30","-itsoffset",str(st),"-i",os.path.join(TF,c,"f%05d.png")]
fc=""; cur="0:v"
for i,(c,st,d) in enumerate(cues, start=1):
    out=f"o{i}"; fc+=f"[{cur}][{i}:v]overlay=0:0:format=auto:eof_action=pass[{out}];"; cur=out
fc=fc.rstrip(";")
run([FF,"-y",*ins,"-filter_complex",fc,"-map",f"[{cur}]","-r","30","-c:v","libx264","-crf","15","-preset","medium","-pix_fmt","yuv420p",os.path.join(HERE,"cut_silent.mp4")],"titles")
print("cut_silent.mp4 built")
print("=== TITLE CUES ==="); [print(f"  {c:9s} {st:6.2f}s  (ends {st+d:.2f})") for c,st,d in cues]
