#!/usr/bin/env python3
"""Drive an interactive CLI (surge) through a pseudo-terminal.

ANSWERS="first|second|third" are typed one per idle period.
"""
import os
import pty
import select
import sys
import time

cmd = sys.argv[1:]
answers = os.environ.get("ANSWERS", "").split("|")

pid, fd = pty.fork()
if pid == 0:
    os.execvp(cmd[0], cmd)

buf = b""
sent = 0
deadline = time.time() + 240
while time.time() < deadline:
    r, _, _ = select.select([fd], [], [], 1.0)
    if r:
        try:
            data = os.read(fd, 4096)
        except OSError:
            break
        if not data:
            break
        buf += data
        sys.stdout.write(data.decode(errors="replace"))
        sys.stdout.flush()
    else:
        if sent < len(answers):
            os.write(fd, answers[sent].encode() + b"\n")
            sent += 1
            time.sleep(1.5)
        else:
            time.sleep(2)
try:
    os.waitpid(pid, os.WNOHANG)
except Exception:
    pass
