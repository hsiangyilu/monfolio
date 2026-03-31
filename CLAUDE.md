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
- [ ] Connect GitHub repo to Vercel for auto-deploy on push (via Vercel dashboard → Git Integration)
- [x] Optionally add a `/api/health` route for better health checks
