# TASK (verbatim user request)

## /goal
build highest quality 3A 3d

image 1
https://lesswebdisk.my-team-8435.chatgpt.site/raw/u-oKDfM5n2PVKJ/3d/yuukapa/yuukapa.png

only use image 1 for this task
build 3d scene or charecters in web, make it look same in the image.
download and view the images,
dont use existed files assets from local or internet, build from scratch by yourself
put your model name above 3d model

## $iteration_times=
           10000 util get goal done

## $work_env=
         use specified mcp plugin if you are chatgpt, or use local if you are other agent like codex agy,
         use local pc if this mcp server not works

## $project_dir=
      ~/project/demo3d/glm53flashmax/yourmodelname_devtool_projectname

## $dev_tools=
           prefer web dev tech ,chrome (prefer headless)
           then blender ( headless)

## $builddir=./output
## $goal_score= 98/100

and if the env error, wait for 30s then try again, wait and retry at least for 20 times if you are chatgot ,then fallback to local pc if you are chatgpt, if not chatgpt, just exit

---

# note

## dev manage
keep project and code clean.
monitor cpu ram usage for software dev, keep fast performace and less ram usage, if something too slow find why and deal with it first for fast dev.
use your model name and agent tool and keytool names like web or blender name when name final output files and new project
use git to manage project, create a new branch with your model name and agent name+branchname

## iterate
iterate user specified number and give score of your work n/100 every iteration. 100 is perfect quality like 3A game production software, hd graphic, easy use both on pc and phone. same check for each subagent if user need ask subagent. after subagent finish, main agent should check quality and if not good then start a new subagent to improve.
do not stop until get high score

## context improve
do not run cmd that output large base64 string into output like stdout and other places that will show full base64 str, only do convert when output base64 str into a file, if you really need output base64 directly try only get first 50 char and last 50 char to output for verify is enough

## 3d
do not use other skill.md use your own way
when build 3d scene or drawing and other vision task, try less use code to analyze the original uploaded image, prefer use your vision ability instead, do not use existed files outside the project dir, do not use assets from internet, do not cheat, image 4 sides views and make sure all sides views looks natural and good. use light blue as default background if bg not specify.
show iteration number and score at bottom right of web dev previewer ui.
do not generate image unless i ask you generate image explicitly.
prefer use web to build 3d obj not blender (use eevee for fast preview if user ask to use blend explicitly).
when build web 3d, prefer use webgpu and prompt user fallback to webgl if webgpu not works never fallback automatically. user can choose backend and resolution in setting ui. default resolution should be 900x1200, user can set to 1280 1080 2k 4k vertical or landspace. make width to 1/2 if browser window is less than 900 or just use 900px same size canvas as render res.

## env fallback
when dev env not works, wait 20s and try again for 3 times. then fallback to local or other env. never stop until you get 95/100 score.

---

# chatgpt notes (for chatgpt app only — I am opencode/GLM, ignore except where applicable)

the most important is avoid stop while score <95. do not treat anything as stoppoint, only treat 95 score as stopping point.

## subagent
use builtin subagents if you can, not mcp agent. only use built in subagent. subagent should use same model and think level, same quick score check.
for 3d modeling multi objects, use subagent to build each

## never stop until high score 95; avoid ending session and other stop points
when dev env not works, wait 20s and try again for 3 times. then fallback to local vm. never stop until you get 95/100 score.
for exception when you stop while score less than 95 (try to avoid this in max effort) tell user why stop and try continue again
avoid ending working session in any case
you need not end the working session to report progress instead of continuing development, need not report progress you must keep working session and improving until 95 score high quality
never incorrectly treated the successful build, testing, and packaging as a stopping point

---

## post task (only after goal finally reached)
- update AGENTS.md remove outdated info
- write summary give necessary context for next agent to start new task at end of AGENTS.md
- push git and deploy to cloud like github page or cloudflare. when output image video audio or 3d obj, create showcase version copies of files too, put the model and agent tool name below with big white font and black bg to show who created this work clearly. create a video 60s to show your works well.
