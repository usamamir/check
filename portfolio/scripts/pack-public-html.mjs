import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const staging = join(root, '..', 'public_html_upload')
const zipPath = join(root, '..', 'digivistaco-public-html.zip')
const legacyZip = join(root, '..', 'digivistaco-upload.zip')
const artifactZip = '/opt/cursor/artifacts/digivistaco-public-html.zip'

execSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_STATIC_PACK: '1' },
})

if (!existsSync(dist)) {
  throw new Error('dist/ missing after build')
}

rmSync(staging, { recursive: true, force: true })
mkdirSync(staging, { recursive: true })

// Copy built site flat into staging (extract these INTO public_html)
const skip = new Set(['.vite', 'screenshot.png'])
for (const name of readdirSync(dist)) {
  if (skip.has(name)) continue
  cpSync(join(dist, name), join(staging, name), { recursive: true })
}

// Ensure .htaccess is present (Vite copies from public/, but be explicit)
const htaccessSrc = join(root, 'public', '.htaccess')
if (existsSync(htaccessSrc)) {
  cpSync(htaccessSrc, join(staging, '.htaccess'))
}

writeFileSync(
  join(staging, 'UPLOAD-TO-HOSTINGER.txt'),
  `Digivistaco portfolio — Hostinger / cPanel upload
================================================

NO WordPress needed. These files are a normal website.

Hostinger steps
---------------
1. Open hPanel → Files → File Manager
2. Open the folder: public_html
   (If this is the main domain, public_html is the site root)
3. Delete old site files inside public_html if you are replacing the whole site
   (keep folders like cgi-bin if Hostinger created them)
4. Upload digivistaco-public-html.zip into public_html
5. Right-click the zip → Extract
6. Make sure you see index.html directly inside public_html
   (not public_html/digivistaco-public-html/index.html)
7. Delete the zip after extracting
8. hPanel → SSL → enable free SSL for digivistaco.com and www
9. Visit https://digivistaco.com and hard-refresh (Ctrl/Cmd+Shift+R)

What you should see
-------------------
SellerOS 2016 desktop boots first.
Click "Update to 2026" to open the modern Commerce 2026 portfolio.

GoDaddy note
------------
Same idea: upload/extract into the domain document root (often public_html).

Do NOT upload SSL certificate files into this folder.
`,
)

rmSync(zipPath, { force: true })
execSync(`cd "${staging}" && zip -r "${zipPath}" . -x "*.DS_Store"`, { stdio: 'inherit' })

// Keep legacy filename in sync so older links still work
cpSync(zipPath, legacyZip)

mkdirSync('/opt/cursor/artifacts', { recursive: true })
cpSync(zipPath, artifactZip)

const files = readdirSync(staging)
console.log('Staging:', staging)
console.log('Zip:', zipPath)
console.log('Legacy zip:', legacyZip)
console.log('Artifact:', artifactZip)
console.log('Root files:', files.join(', '))
if (!files.includes('index.html') || !files.includes('.htaccess')) {
  throw new Error('Pack missing index.html or .htaccess')
}
