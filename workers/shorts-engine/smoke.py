"""Offline verification with a synthetic fixture; never downloads or posts content."""
import json
import subprocess
import tempfile
from pathlib import Path
from engine import render

with tempfile.TemporaryDirectory() as folder:
    source = Path(folder)/"fixture.mp4"
    subprocess.run(["ffmpeg","-nostdin","-v","error","-y","-f","lavfi","-i",
                    "testsrc2=size=320x180:rate=30","-f","lavfi","-i","sine=frequency=440:sample_rate=44100",
                    "-t","25","-c:v","libx264","-threads","2","-pix_fmt","yuv420p","-c:a","aac",str(source)],check=True)
    words = [{"start":i,"end":i+0.8,"word":w} for i,w in enumerate(
        ["Veronica","Hub","teste","de","legendas","automáticas."]*4)]
    output, meta = render(source,{"start":2,"end":22},words,folder,0)
    assert output.stat().st_size > 1000
    assert meta["width"] == 1080 and meta["height"] == 1920 and abs(meta["duration"]-20)<0.2
    print(json.dumps({"ok":True,**meta,"bytes":output.stat().st_size}))
