<script setup lang="ts">
import { AcurastClient, type Message } from '@acurast/dapp'
import type { CalculateMandelBrotPartResponse, HeatPoint } from 'acurast-mandelbrot-utils'
import { Buffer } from 'buffer'
import { AsyncSafeSet } from '../utils/async'
const width = defineModel<number>('width')
const height = defineModel<number>('height')
const iterations = defineModel<number>('iterations')
const processors = defineModel<string>('processors')
const calculating = defineModel<boolean>('calculating')
const clientId = defineModel<string>('clientID')
var acurastClient: any = undefined
var keys: any = undefined
var publicKeyHash: any = undefined
var receivedResults: AsyncSafeSet<number> = new AsyncSafeSet()

function heatToRGB(heatValue: number) {
  // Interpolate between blue and red
  var r = Math.floor(255 * heatValue)
  var b = Math.floor(255 * (1 - heatValue))
  var g = 0

  return { r: r, g: g, b: b }
}

async function drawCanvas(data: HeatPoint[]) {
  if (!calculating.value) {
    console.log('not calculating, therefore not drawing canvas')
    return
  }
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
  publicKeyHash = await crypto.subtle.digest('SHA-256', publicKeyCompressed)
  console.log('clientID:', Buffer.from(publicKeyHash.slice(0, 16)).toString('hex'))
}

async function callMissingValues() {
  console.log('call missing')
  if (keys === undefined) {
    await calculateMandelBrot()
    return
  }
  await callProcessors()
}

async function callProcessors() {
  if (height.value == undefined) {
    return
  }
  const processorsArray = (processors.value ?? '').split(',')

  const iterationStep = 5

  for (let i = 0; i < height.value; i += iterationStep) {
    if (await receivedResults.has(i)) {
      continue
    }

    try {
      await acurastClient.send(
        processorsArray[Math.floor(Math.random() * (processorsArray.length + 1))],
        Buffer.from(
          JSON.stringify({
            method: 'calculateMandelbrotPart',
            arguments: {
              startX: i,
              startY: 0,
              endX: i + iterationStep,
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
    } catch (_e) {
      i -= iterationStep // error in send method, we retry this call
    }
  }
}

async function connectAcurastClient() {
  if (keys === undefined) {
    await generateKeys()
  }

  clientId.value = Buffer.from(publicKeyHash.slice(0, 16)).toString('hex')
  console.log(`set client id to ${clientId.value}`)
  const maxTries = 1000
  for (let i = 1; i <= maxTries; i++) {
    console.log(`trying ${i}/${maxTries}`)
    for (let server of [
      'wss://websocket-proxy-1.prod.gke.acurast.com',
      'wss://websocket-proxy-2.prod.gke.acurast.com'
    ]) {
      try {
        acurastClient = new AcurastClient(server)
        await acurastClient.start({ secretKey: keys.privateKey, publicKey: keys.publicKey })
        acurastClient.onMessage(async (message: Message) => {
          const parsed: CalculateMandelBrotPartResponse | any = JSON.parse(
            message.payload.toString()
          )
          if (parsed.method != 'calculateMandelbrotPart') {
            console.warn(`received non result message ${message.payload.toString()}`)
            return
          }
          await drawCanvas(parsed.result)
          console.log(
            `received result ${parsed.result[0].x} from ${Buffer.from(message.sender).toString('hex')}`
          )
          await receivedResults.add(parsed.result[0].x)
        })
        return
      } catch (error) {
        console.log('error on starting acurast client')
      }
    }
  }
}

async function calculateMandelBrot() {
  await receivedResults.clear()
  clientId.value = undefined
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
  await callProcessors()
}

defineExpose({
  calculateMandelBrot
})
</script>

<template>
  <div v-show="calculating">
    <button
      v-show="calculating"
      v-on:click="
        (_e: any) => {
          calculating = false
        }
      "
    >
      GO BACK
    </button>
    <button
      v-show="calculating"
      v-on:click="
        (_e: any) => {
          callMissingValues()
        }
      "
    >
      Request Missing
    </button>
    <p>ClientId: {{ clientId ?? 'no client id set' }}</p>
  </div>
  <div v-show="calculating" style="border-color: antiquewhite; border-style: solid">
    <canvas id="mandelBrotCanvas"></canvas>
  </div>
</template>
