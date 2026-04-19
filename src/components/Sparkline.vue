<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'

const props = defineProps<{
  data: number[]
  color: string
  width?: number
  height?: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

function draw() {
  const el = canvas.value
  if (!el || props.data.length < 2) return

  const w = props.width ?? 60
  const h = props.height ?? 20
  const dpr = window.devicePixelRatio || 1
  el.width = w * dpr
  el.height = h * dpr
  el.style.width = `${w}px`
  el.style.height = `${h}px`

  const ctx = el.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const data = props.data
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  ctx.clearRect(0, 0, w, h)

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, props.color + '40')
  gradient.addColorStop(1, props.color + '00')

  ctx.beginPath()
  for (let i = 0; i < data.length; i++) {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((data[i] - min) / range) * (h - pad * 2)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }

  // Fill
  const lastX = w - pad
  const firstX = pad
  ctx.lineTo(lastX, h)
  ctx.lineTo(firstX, h)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  // Stroke line
  ctx.beginPath()
  for (let i = 0; i < data.length; i++) {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((data[i] - min) / range) * (h - pad * 2)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = props.color
  ctx.lineWidth = 1.5
  ctx.stroke()
}

onMounted(draw)
watchEffect(draw)
</script>

<template>
  <canvas ref="canvas" class="sparkline"></canvas>
</template>

<style scoped>
.sparkline {
  display: block;
  vertical-align: middle;
}
</style>
