# Goal: Build highest quality 3A 3D scene in web

## Reference
Image 1 only:
https://lesswebdisk.my-team-8435.chatgpt.site/raw/u-oKDfM5n2PVKJ/3d/yuukapa/yuukapa.png

- Only use image 1 for this task.
- Build 3D scene or characters in web, make it look same as image.
- Download and view the image.
- Do NOT use existing files/assets from local or internet; build from scratch.
- Put model name above 3D model.

## Settings
- $iteration_times = 10000 until goal done
- $work_env = use specified MCP plugin if ChatGPT, or local if other agent. Use local PC if MCP server not working.
- $project_dir = ~/project/demo3d/deepseek411017/maxeffort/yourmodelname_devtool_projectname
- $dev_tools = prefer web dev tech, chrome (prefer headless), then blender (headless)
- $builddir = ./output
- $goal_score = 98/100
- If env error, wait 30s then retry, wait/retry at least 20 times (ChatGPT), then fallback to local. Non-ChatGPT: just exit.

## Dev manage
- Keep project and code clean.
- Monitor CPU/RAM usage for software dev, keep fast performance and less RAM usage. If too slow, find why and deal with it first.
- Use model name and agent tool, keytool names like web or blender name when naming final output files and new project.
- Use git to manage project. Create a new branch with model name + agent name + branchname.

## Iterate
- Iterate user-specified number of times, give score n/100 every iteration. 100 is perfect quality like 3A game production software, HD graphics, easy to use on PC and phone.
- Same check for each subagent if needed. After subagent finishes, main agent should check quality, and if not good, start a new subagent to improve.
- Do not stop until high score.

## Context improve
- Do not run commands that output large base64 strings into output/stdout. Only convert when outputting base64 to a file. If you need to output base64 directly, only first 50 and last 50 chars to verify.
- Do not use other skill.md; use your own way.
- When building 3D scenes/drawings/vision tasks, prefer vision ability over code analysis of original image. Do not use existing files outside project dir, do not use assets from internet, do not cheat.
- Make sure 4 side views look natural and good. Use light blue as default background if bg not specified.
- Show iteration number and score at bottom right of web dev previewer UI.
- Do not generate images unless explicitly asked.
- Prefer web to build 3D objects, not Blender (use EEVEE for fast preview if Blender explicitly asked).
- When building web 3D, prefer WebGPU and prompt user fallback to WebGL if WebGPU not works — never fallback automatically. User can choose backend and resolution in settings UI. Default resolution 900x1200; user can set 1280x1080, 2K, 4K vertical or landscape. Make width 1/2 if browser window less than 900, or same canvas as render res.

## Env fallback
- When dev env not works: wait 20s, retry 3 times, then fallback to local/other env. Never stop until 95/100+.

## Post task (only after goal reached)
- Update AGENTS.md, remove outdated info.
- Write summary with context for next agent at end of AGENTS.md.
- Push git and deploy to cloud (GitHub Pages / Cloudflare).
- Create showcase version copies of output images/video/audio/3D obj. Put model and agent tool name below with big white font on black bg.
- Create 60s video showing works.
