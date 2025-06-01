<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const musicStore = useMusicStore()
const canvasRef = ref(null)
const animationRef = ref(null)

let audioContext = null
let analyser = null
let source = null
let dataArray = null

onMounted(() => {
  setupVisualizer()
})

onUnmounted(() => {
  if (animationRef.value) {
    cancelAnimationFrame(animationRef.value)
  }
  
  if (audioContext) {
    audioContext.close()
  }
})

function setupVisualizer() {
  if (!musicStore.audioElement) return
  
  try {
    // Create audio context if not exists
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create analyser node
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 64
      
      // Create buffer to receive data
      const bufferLength = analyser.frequencyBinCount
      dataArray = new Uint8Array(bufferLength)
      
      // Connect audio element to analyser
      source = audioContext.createMediaElementSource(musicStore.audioElement)
      source.connect(analyser)
      analyser.connect(audioContext.destination)
    }
    
    // Start drawing
    drawVisualizer()
  } catch (error) {
    console.error('Failed to set up visualizer:', error)
  }
}

function drawVisualizer() {
  if (!canvasRef.value || !analyser) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Get frequency data
  analyser.getByteFrequencyData(dataArray)
  
  // Set up styling
  const barWidth = width / dataArray.length
  
  // Draw bars
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * height
    
    // Change color based on frequency
    const hue = i * 4 // rainbow effect
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
    
    // Draw the bar
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
  }
  
  // Schedule next frame
  animationRef.value = requestAnimationFrame(drawVisualizer)
}
</script>

<template>
  <canvas ref="canvasRef" class="visualizer" width="80" height="30"></canvas>
</template>

<style scoped>
.visualizer {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
</style> 