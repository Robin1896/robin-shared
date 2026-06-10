// Usage: node make_icon.js <letter> <output.png>
const { createCanvas } = require('canvas')
const fs = require('fs')

const letter = process.argv[2] || 'E'
const outFile = process.argv[3] || 'icon.png'
const SIZE = 1024

const canvas = createCanvas(SIZE, SIZE)
const ctx = canvas.getContext('2d')

// Background — warm cream
ctx.fillStyle = '#ede8dd'
ctx.fillRect(0, 0, SIZE, SIZE)

// Measure letter
ctx.fillStyle = '#1a1d2e'
const fontSize = Math.round(SIZE * 0.72)
ctx.font = `normal ${fontSize}px Georgia, serif`
ctx.textAlign = 'left'
ctx.textBaseline = 'alphabetic'

const metrics = ctx.measureText(letter)
const letterW = metrics.width
const dotR = SIZE * 0.055
const dotGap = SIZE * 0.02

// Group bounding box
const groupW = letterW + dotGap + dotR * 2
const groupH = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

// Center group in canvas
const gx = (SIZE - groupW) / 2
const gy = (SIZE - groupH) / 2

// Draw letter
ctx.fillText(letter, gx, gy + metrics.actualBoundingBoxAscent)

// Draw dot
ctx.fillStyle = '#c14a1f'
ctx.beginPath()
ctx.arc(gx + letterW + dotGap + dotR, gy + metrics.actualBoundingBoxAscent - dotR * 0.5, dotR, 0, Math.PI * 2)
ctx.fill()

fs.writeFileSync(outFile, canvas.toBuffer('image/png'))
console.log(`${outFile} — ${letter} icon created`)
