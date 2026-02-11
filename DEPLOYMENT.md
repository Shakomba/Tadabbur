# GitHub Pages Deployment Notes

This project contains lecture audio files tracked by Git LFS (`assets/audio/*`).
GitHub Pages does not serve Git LFS objects directly, so the app now resolves local lecture audio
paths to `https://media.githubusercontent.com/...` at runtime when hosted on GitHub Pages.

## What to configure

1. Enable Pages in this repository using **GitHub Actions** as the source.
2. Keep your repository public if you want browser clients to stream audio without authentication.
3. If you use a custom domain (not `*.github.io`), set these meta tags in `index.html`:
   - `github-repo` as `owner/repo`
   - `github-branch` as the branch that contains your audio paths

Default behavior on `*.github.io`:
- owner/repo is auto-detected from URL
- default branch is fetched from the GitHub API (fallback: `main`)

## Deploy workflow

The workflow file is:
- `.github/workflows/deploy-pages.yml`

It publishes a static artifact from:
- `index.html`
- `assets/`
- `css/`
- `data/`
- `js/`
