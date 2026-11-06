import { writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'

mkdirSync('build-resources', { recursive: true })
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#0c1412"/>
  <text x="256" y="340" text-anchor="middle" font-size="280" font-family="Arial Black, sans-serif" fill="#b8ff3c">R</text>
</svg>`
writeFileSync('build-resources/icon.svg', svg)
execSync('ffmpeg -y -i build-resources/icon.svg build-resources/icon.png', { stdio: 'inherit' })
console.log('Wrote build-resources/icon.png')
