"""Capture a real typed Python session on a dedicated Linux/X11 terminal window."""
import argparse,os,pty,re,select,shlex,subprocess,sys,tempfile,time
from pathlib import Path
HERE=Path(__file__).resolve().parents[1]

def terminal_session(stage):
    work=HERE/'evidence';os.chdir(work)
    pid,fd=pty.fork()
    if not pid:
        env=dict(os.environ,PS1='pilot$ ',PROMPT_COMMAND='',TERM='xterm',PYTHON_COLORS='0',NO_COLOR='1')
        os.execvpe('bash',['bash','--noprofile','--norc','-i'],env)
    def expect(marker):
        buf=b'';end=time.monotonic()+15
        while marker not in buf:
            if time.monotonic()>end:raise RuntimeError(repr(marker)+', '+repr(buf[-300:]))
            if select.select([fd],[],[],.2)[0]:
                part=os.read(fd,65536);os.write(1,part);buf+=part
    def key(s):os.write(fd,s.encode())
    def hold(label):
        (stage/(label+'.ready')).touch()
        while not (stage/(label+'.done')).is_file():time.sleep(.04)
    try:
        expect(b'pilot$ ');key('python3 -q -i ledger_cli.py\n');expect(b'>>> ');hold('opened')
        key('sum(amounts)');expect(b'sum(amounts)');hold('formula')
        key('\n');expect(b'>>> ');hold('total')
        key('cap - sum(amounts)\n');expect(b'>>> ');hold('headroom')
        key('sum(amounts) / eligible\n');expect(b'>>> ');hold('unit')
    finally:
        os.close(fd)
        try:os.kill(pid,15)
        except ProcessLookupError:pass

def capture(display,dest):
    env=dict(os.environ,DISPLAY=display,NO_AT_BRIDGE='1',GDK_BACKEND='x11',LC_ALL='C',NO_COLOR='1')
    title='Synthetic pilot ledger / recorded calculation'
    with tempfile.TemporaryDirectory(prefix='pilot-ledger-') as td:
        stage=Path(td)
        term=subprocess.Popen(['xfce4-terminal','--disable-server','--hide-menubar','--hide-toolbar','--hide-borders','--hide-scrollbar',
            '--font=DejaVu Sans Mono 19','--geometry=62x18+0+0','--title='+title,'--execute',sys.executable,__file__,'--worker',td],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:
            for step in ['opened','formula','total','headroom','unit']:
                until=time.monotonic()+35
                while not (stage/(step+'.ready')).exists():
                    if time.monotonic()>until or term.poll() is not None:raise RuntimeError('Terminal did not reach '+step)
                    time.sleep(.1)
                tree=subprocess.check_output(['xwininfo','-root','-tree'],env=env,text=True)
                line=next(x for x in tree.splitlines() if title in x);window=re.search(r'0x[0-9a-fA-F]+',line).group()
                time.sleep(.18)
                subprocess.run(['import','-window',window,'+repage',str(dest/('ledger-'+step+'.png'))],env=env,check=True)
                (stage/(step+'.done')).touch()
        finally:
            if term.poll() is None:term.terminate()
            term.wait(timeout=10)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--worker',type=Path);p.add_argument('--display');p.add_argument('--out',type=Path,default=HERE/'assets');a=p.parse_args()
    if a.worker:terminal_session(a.worker)
    else:
        if not a.display:p.error('--display must identify a dedicated X11 training screen')
        a.out.mkdir(parents=True,exist_ok=True);capture(a.display,a.out)
