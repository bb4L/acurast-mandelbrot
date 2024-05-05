<script setup lang="ts">
import { AcurastClient } from '@acurast/dapp'
const width = defineModel('width')
const height = defineModel('height')
const iterations = defineModel('iterations')
const processors = defineModel('processors')
const calculating = defineModel('calculating')
var acurastClient: any = undefined
var keys: any = undefined

function heatToRGB(heatValue) {
  // Interpolate between blue and red
  var r = Math.floor(255 * heatValue)
  var b = Math.floor(255 * (1 - heatValue))
  var g = 0

  return { r: r, g: g, b: b }
}

async function drawCanvas(data) {
  console.log('drawing canvas ...')
  const canvas = document.getElementById('mandelBrotCanvas')
  var ctx = canvas.getContext('2d')

  data.forEach(function (entry) {
    var color = heatToRGB(entry.heat)
    var x = entry.x
    var y = entry.y

    // Draw a point at (x, y) with color determined by heat
    ctx.fillStyle = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')'
    ctx.fillRect(x, y, 1, 1) // Adjust the size of the point as needed
  })
}

async function generateKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign']
  )

  await crypto.subtle.exportKey('jwk', keyPair.privateKey).then((jwk: any) => {
    console.log('JWK')
    console.log(jwk)
    Buffer.from(jwk.d || '', 'base64').toString()
  })

  const [privateKeyRaw, publicKeyRaw] = await Promise.all([
    crypto.subtle
      .exportKey('jwk', keyPair.privateKey)
      .then((jwk: any) => Buffer.from(jwk.d || '', 'base64')),
    crypto.subtle
      .exportKey('raw', keyPair.publicKey)
      .then((arrayBuffer: any) => Buffer.from(arrayBuffer))
  ])

  keys = { privateKey: privateKeyRaw.toString('hex'), publicKey: publicKeyRaw.toString('hex') }
  const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2
  const publicKeyCompressed = Buffer.concat([
    new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
    publicKeyRaw.subarray(1, publicKeyCompressedSize + 1)
  ])
  const publicKeyHash = await crypto.subtle.digest('SHA-256', publicKeyCompressed)
  console.log('clientID:', Buffer.from(publicKeyHash.slice(0, 16)).toString('hex'))
}

async function connectAcurastClient() {
  if (keys === undefined) {
    await generateKeys()
  }
  for (let server of [
    'wss://websocket-proxy-1.prod.gke.acurast.com',
    'wss://websocket-proxy-2.prod.gke.acurast.com'
  ]) {
    try {
      acurastClient = new AcurastClient(server)
      await acurastClient.start({ secretKey: keys.privateKey, publicKey: keys.publicKey })
      acurastClient.onMessage(async (message: Message) => {
        const parsed: any = JSON.parse(message.payload.toString())
        await drawCanvas(parsed.result)
      })
      return
    } catch (error) {
      console.log('error on starting acurast client')
    }
  }
}

async function calculateMandelBrot() {
  calculating.value = true
  console.log(
    `calculating mandelbrot with: width=${width.value} height=${height.value} iterations=${iterations.value} processors=${processors.value}`
  )

  //   set height, width of canvas
  const canvas = document.getElementById('mandelBrotCanvas')
  if (canvas !== null) {
    canvas.height = height.value
    canvas.width = width.value
  } else {
    console.error('no canvas object')
    return
  }
  await connectAcurastClient()
  const processorsArray = processors.value.split(',')
  for (let i = 0; i < height.value; i++) {
    acurastClient.send(
      processorsArray[Math.floor(Math.random() * processorsArray.length)],
      Buffer.from(
        JSON.stringify({
          method: 'calculateMandelbrotPart',
          arguments: {
            startX: i,
            startY: 0,
            endX: i + 1,
            endY: width.value,
            config: {
              height: height.value,
              width: width.value,
              maxIterations: iterations.value
            }
          }
        })
      )
    )
  }
}

defineExpose({
  calculateMandelBrot
})
</script>

<template>
  <div v-show="calculating" style="border-color: antiquewhite; border-style: solid">
    <canvas id="mandelBrotCanvas"></canvas>
  </div>
</template>
