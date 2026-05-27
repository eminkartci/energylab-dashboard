import { downloadBlob, sanitizeFilename } from './download'

function findChartSvg(container) {
  if (!container) throw new Error('Chart container not found')
  const svg = container.querySelector('.recharts-wrapper svg') || container.querySelector('svg')
  if (!svg) throw new Error('Chart SVG not found')
  return svg
}

function prepareSvgClone(svg, scale = 1) {
  const rect = svg.getBoundingClientRect()
  const width = Math.max(1, Math.ceil(rect.width * scale))
  const height = Math.max(1, Math.ceil(rect.height * scale))
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
  }
  return { clone, width, height }
}

export function exportChartSvg(container, filenameBase) {
  const svg = findChartSvg(container)
  const { clone } = prepareSvgClone(svg, 1)
  const svgString = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, `${sanitizeFilename(filenameBase)}.svg`)
}

export function exportChartPng(container, filenameBase) {
  const svg = findChartSvg(container)
  const scale = 2
  const { clone, width, height } = prepareSvgClone(svg, scale)
  const svgString = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(pngBlob => {
        if (!pngBlob) {
          reject(new Error('PNG export failed'))
          return
        }
        downloadBlob(pngBlob, `${sanitizeFilename(filenameBase)}.png`)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('PNG export failed'))
    }
    img.src = url
  })
}
