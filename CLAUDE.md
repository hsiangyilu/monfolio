# Money Portfolio

Next.js app with Prisma ORM for personal finance portfolio management.

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://money-portfolio-red.vercel.app
- Deploy workflow: auto-deploy on push to main
- Deploy status command: HTTP health check
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://money-portfolio-red.vercel.app/api/health (HTTP 200 check)

### Custom deploy hooks
- Pre-merge: npm run build && npm run lint
- Deploy trigger: automatic on push to main (Vercel)
- Deploy status: poll production URL
- Health check: https://money-portfolio-red.vercel.app/api/health

### Setup TODO
- [x] Create Vercel project
- [x] First production deploy
- [x] Connect GitHub repo to Vercel for auto-deploy on push (via Vercel dashboard → Git Integration)
- [x] Optionally add a `/api/health` route for better health checks

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
