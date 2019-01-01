#!/bin/bash

cd raw

mkdir webm
mkdir mp4

for i in d*.mp4; do
    n=${i%.mp4}
    n=${n:1}
    mkdir webm/$n
    ffmpeg -i $i -map 0:0 -vcodec libvpx-vp9 -b:v 3000k -f webm_chunk -header webm/$n/720.hdr webm/$n/%d.720.chk
    ffmpeg -i $i -vf scale=-1:580 -map 0:0 -vcodec libvpx-vp9 -b:v 1600k -f webm_chunk -header webm/$n/580.hdr webm/$n/%d.580.chk
    ffmpeg -i $i -vf scale=-1:360 -map 0:0 -vcodec libvpx-vp9 -b:v 750k -f webm_chunk -header webm/$n/360.hdr webm/$n/%d.360.chk

    mkdir mp4/$n
    ffmpeg -y -i $i -an -c:v libx264 -g 60 -keyint_min 60 -b:v 5000k -maxrate 5000k -bufsize 5000k -vf scale=-1:720 $n.720.mp4
    ffmpeg -y -i $i -an -c:v libx264 -g 60 -keyint_min 60 -b:v 2700k -maxrate 2700k -bufsize 2700k -vf scale=1032:580 $n.580.mp4
    ffmpeg -y -i $i -an -c:v libx264 -g 60 -keyint_min 60 -b:v 1250k -maxrate 1250k -bufsize 1250k -vf scale=-1:360 $n.360.mp4

    MP4Box -dash 2000 -segment-name %s. -frag 2000 -rap -frag-rap -out mp4/$n/$n $n.360.mp4 $n.580.mp4 $n.720.mp4
done

rm **/*.hdr
rm **/*.mpd


for f in mp4/**/*.m4s; do
    if [[ $f =~ [0-9]+\.([0-9]+)\.([0-9]+)\.m4s ]]
    then
        echo "$f :: $(dirname $f)/$((${BASH_REMATCH[2]} - 1)).${BASH_REMATCH[1]}.chk"
    else
        echo "$f doesn't match" >&2 # this could get noisy if there are a lot of non-matching files
    fi
done