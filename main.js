import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll'

const locomotiveScroll = new LocomotiveScroll()

// Function to check if device is mobile
const isMobile = () => {
  return window.innerWidth <= 768
}

let model;

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  isMobile() ? 45 : 30, // Wider FOV for mobile
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.z = isMobile() ? 7 : 5 // Move camera back on mobile for better view

const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas'), antialias: true , alpha: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputEncoding = THREE.sRGBEncoding

// Post processing setup
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const rgbShiftPass = new ShaderPass(RGBShiftShader)
rgbShiftPass.uniforms['amount'].value = isMobile() ? 0.0015 : 0.0030 // Reduce effect on mobile
composer.addPass(rgbShiftPass)

const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileCubemapShader()

// Load HDRI environment map
new RGBELoader()
  .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    scene.environment = envMap
    texture.dispose()
    pmremGenerator.dispose()
  })

// Load 3D Model
const loader = new GLTFLoader()
loader.load(
  '.public/DamagedHelmet.gltf',
  function (gltf) {
    model = gltf.scene
    if (isMobile()) {
      model.scale.set(0.8, 0.8, 0.8) // Scale down model on mobile
    }
    scene.add(model)
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded')
  },
  function (error) {
    console.error('An error occurred loading the model:', error)
  }
)

// Handle both mouse and touch events
const handleInteraction = (x, y) => {
  if(model) {
    const rotationX = (x/window.innerWidth - 0.5) * (Math.PI * (isMobile() ? 0.08 : 0.12))
    const rotationY = (y/window.innerHeight - 0.5) * (Math.PI * (isMobile() ? 0.08 : 0.12))
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: isMobile() ? 0.5 : 0.8, // Faster animation on mobile
      ease: "power2.out"
    })
  }
}

window.addEventListener('mousemove', (e) => {
  handleInteraction(e.clientX, e.clientY)
})

window.addEventListener('touchmove', (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  handleInteraction(touch.clientX, touch.clientY)
})

window.addEventListener('resize', () => {
  // Update camera properties
  camera.aspect = window.innerWidth / window.innerHeight
  camera.fov = isMobile() ? 45 : 30
  camera.position.z = isMobile() ? 7 : 5
  camera.updateProjectionMatrix()
  
  // Update renderer and composer
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
  
  // Update model scale if it exists
  if (model) {
    model.scale.set(isMobile() ? 0.8 : 1, isMobile() ? 0.8 : 1, isMobile() ? 0.8 : 1)
  }
})

function animate() {
  requestAnimationFrame(animate)
  composer.render()
}
animate()
