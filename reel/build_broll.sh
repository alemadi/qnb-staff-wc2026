#!/bin/bash
set -e
cd /tmp/claude-0/-home-user-staff-wc2026/eeb8af3d-b659-50ba-8563-2689496a991b/scratchpad/reel
FF=./ffmpeg
mkdir -p seg
# brand grade: deepen blacks, warm-gold push, cool shadows, vignette, subtle grain
GC="fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=contrast=1.09:brightness=-0.03:saturation=1.06:gamma=0.95,colorbalance=rs=0.03:bs=-0.04:rm=0.03:bm=-0.03,vignette=PI/4.2,noise=alls=6:allf=t"
BLACK="color=c=0x050507:s=1080x1920:r=30"
ENC="-r 30 -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p"

echo "[1/6] gold texture (cold open, 3.0s)"
$FF -y -i broll/goldtex.mp4 -t 3.0 -vf "$GC,fade=t=in:st=0:d=0.4,fade=t=out:st=2.6:d=0.4,format=yuv420p" $ENC seg/s1_gold.mp4 2>seg/log1.txt

echo "[2/6] black filler (2.9->8.9, 5.9s)"
$FF -y -f lavfi -i $BLACK -t 5.9 -vf format=yuv420p $ENC seg/s2_black.mp4 2>seg/log2.txt

echo "[3/6] tournament: trophy -> stadium xfade (5.7s)"
$FF -y -i broll/trophy.mp4 -i broll/stadium.mp4 -filter_complex \
"[0:v]$GC,trim=0:3.7,setpts=PTS-STARTPTS,fps=30[a];[1:v]$GC,trim=0:2.5,setpts=PTS-STARTPTS,fps=30[b];[a][b]xfade=transition=fade:duration=0.5:offset=3.2,fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st=5.3:d=0.4,format=yuv420p[v]" \
-map "[v]" $ENC seg/s3_tourn.mp4 2>seg/log3.txt

echo "[4/6] black filler (14.6->26.9, 12.3s)"
$FF -y -f lavfi -i $BLACK -t 12.3 -vf format=yuv420p $ENC seg/s4_black.mp4 2>seg/log4.txt

echo "[5/6] maldives (4.15s)"
$FF -y -i broll/maldives.mp4 -t 4.15 -vf "$GC,fade=t=in:st=0:d=0.4,fade=t=out:st=3.75:d=0.4,format=yuv420p" $ENC seg/s5_mal.mp4 2>seg/log5.txt

echo "[6/6] black filler (31.05->33.0, 1.95s)"
$FF -y -f lavfi -i $BLACK -t 1.95 -vf format=yuv420p $ENC seg/s6_black.mp4 2>seg/log6.txt

echo "concat..."
printf "file 'seg/s1_gold.mp4'\nfile 'seg/s2_black.mp4'\nfile 'seg/s3_tourn.mp4'\nfile 'seg/s4_black.mp4'\nfile 'seg/s5_mal.mp4'\nfile 'seg/s6_black.mp4'\n" > seg/list.txt
$FF -y -f concat -safe 0 -i seg/list.txt -c copy base.mp4 2>seg/logcat.txt || \
  $FF -y -f concat -safe 0 -i seg/list.txt $ENC base.mp4 2>seg/logcat2.txt
echo "=== base.mp4 ==="
./ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 base.mp4
echo "done"