# backend

## Setup

1. Install [Rye](https://rye.astral.sh) using the following default options:
```
❯ curl -sSf https://rye.astral.sh/get | bash
This script will automatically download and install rye (latest) for you.
######################################################################## 100.0%
Welcome to Rye!

This installer will install rye to /home/dwang/.rye
This path can be changed by exporting the RYE_HOME environment variable.

Details:
  Rye Version: 0.37.0
  Platform: linux (x86_64)

✔ Continue? · yes
✔ Select the preferred package installer · uv (fast, recommended)
✔ What should running `python` or `python3` do when you are not inside a Rye managed project? · Run a Python installed and managed by Rye
✔ Which version of Python should be used as default toolchain? · cpython@3.12
```

2. `cd backend`
3. `rye sync`
4. `cp .env.example .env`
5. Modify the `.env` file with the correct values
6. `rye run fastapi dev src/main.py`
