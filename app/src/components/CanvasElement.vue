<script setup lang="ts">
import { AcurastClient, type Message } from '@acurast/dapp'
import { Buffer } from 'buffer'
import { AsyncSafeSet } from '../utils/async'
import type {
  PingCall,
  MandelBrotHeatCall,
  MandelBrotHeatCallResponse,
  Point,
  PingResponse,
  MandelBrotConfig
} from '../sharedUtils/interfaces'
import { getPoint } from '../sharedUtils/coordinateHandling'
import type { PartialResultInfo } from '@/utils/interfaces'
const width = defineModel<number>('width')
const height = defineModel<number>('height')
const iterations = defineModel<number>('iterations')
const processors = defineModel<string>('processors')
const calculating = defineModel<boolean>('calculating')
const clientId = defineModel<string>('clientID')
const processors_health = defineModel<any[]>('processorsHealth')
const MAX_PER_CALL = 2000

processors_health.value = [] as any[]
var acurastClient: any = undefined
var keys: any = undefined
var publicKeyHash: any = undefined
var receivedResults: AsyncSafeSet<PartialResultInfo> = new AsyncSafeSet()

function heatToRGB(heatValue: number) {
  // Interpolate between blue and red
  var r = Math.floor(255 * heatValue)
  var b = Math.floor(255 * (1 - heatValue))
  var g = 0

  return { r: r, g: g, b: b }
}

function delay(ms: number): any {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function drawCanvas(startPoint: Point, results: number[]) {
  const canvas = document.getElementById('mandelBrotCanvas')
  var ctx = canvas.getContext('2d')
  let i = 0

  results.forEach((result) => {
    var color = heatToRGB(result)
    let p = getPoint(startPoint, i, {
      height: height.value,
      width: width.value,
      maxIterations: iterations.value
    })
    ctx.fillStyle = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')'
    ctx.fillRect(p.x, p.y, 1, 1) // Adjust the size of the point as needed
    i++
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

async function pingProcessors() {
  processors_health.value = []
  if (keys === undefined) {
    await connectAcurastClient()
  }
  const processorsArray = (processors.value ?? '').split(',')
  console.log(`processors to check ${processorsArray}`)
  for (let item of processorsArray) {
    await acurastClient.send(
      item,
      Buffer.from(
        JSON.stringify({
          method: 'ping'
        })
      )
    )
  }
}

async function callMissingValues() {
  if (keys === undefined) {
    await connectAcurastClient()
  }
  let results = await receivedResults.values()
  let lastResult: undefined | PartialResultInfo = undefined
  let config = {
    height: height.value || 0,
    width: width.value || 0,
    maxIterations: iterations.value || 10
  } as MandelBrotConfig
  let expectedStartPoint: Point = { x: 0, y: 0 }
  let delayTime = Math.floor(1000 / (processors.value ?? 'a').split(',').length)

  console.log('maxPerCall', MAX_PER_CALL, 'delayTime', delayTime)

  if (results === undefined || results.length === 0) {
    console.log('initial calculating')
    while (expectedStartPoint.x <= config.width && expectedStartPoint.y <= config.height) {
      expectedStartPoint = await callMandelBrotHeat(
        {
          method: 'mandelbrotHeat',
          arguments: {
            startPoint: expectedStartPoint,
            amountOfValues: MAX_PER_CALL,
            config: config
          }
        },
        delayTime
      )
    }
    return
  }

  results.sort((a: any, b: any) => {
    return a.x - b.x
  })

  let resultsArray = results
  let maxValue = resultsArray.length

  for (let i = 0; i < maxValue; i++) {
    let element = resultsArray[i]
    console.log('element', element)
    console.log('lastResult', lastResult)

    if (lastResult !== undefined) {
      expectedStartPoint = getPoint(lastResult.point, lastResult.numberOfResults, config)
    }
    if (expectedStartPoint.x == element.point && expectedStartPoint.y == element.point) {
      continue
    }
    let amountMissingValues =
      (element.point.x - expectedStartPoint.x > 0 ? element.point.x - expectedStartPoint.x : 0) *
        config.height +
      (expectedStartPoint.y - element.point.y)

    if (amountMissingValues > 0) {
      while (amountMissingValues > 0) {
        let valuesToRequest =
          MAX_PER_CALL < amountMissingValues ? MAX_PER_CALL : amountMissingValues

        expectedStartPoint = await callMandelBrotHeat(
          {
            method: 'mandelbrotHeat',
            arguments: {
              startPoint: expectedStartPoint,
              amountOfValues: valuesToRequest,
              config: config
            }
          },
          delayTime
        )

        amountMissingValues -= valuesToRequest
      }
    }
    lastResult = element
  }

  if (lastResult === undefined) {
    console.log('last result was undefined')
    return
  }

  let nexStartPoint = getPoint(lastResult?.point, MAX_PER_CALL, config)

  while (nexStartPoint.x <= config.width) {
    nexStartPoint = await callMandelBrotHeat(
      {
        method: 'mandelbrotHeat',
        arguments: {
          startPoint: nexStartPoint,
          amountOfValues: MAX_PER_CALL,
          config: config
        }
      },
      delayTime
    )
  }
}

async function callMandelBrotHeat(call: MandelBrotHeatCall, delayTime: number): Promise<Point> {
  await randomTriggerProcessorsCmd(call)
  await delay(delayTime)
  return getPoint(call.arguments.startPoint, call.arguments.amountOfValues, call.arguments.config)
}

async function randomTriggerProcessorsCmd(call: MandelBrotHeatCall | PingCall) {
  const processorsArray = (processors.value ?? '').split(',')
  return acurastClient.send(
    processorsArray[Math.floor(Math.random() * processorsArray.length)],
    Buffer.from(
      JSON.stringify({
        method: call.method,
        arguments: call.arguments
      })
    )
  )
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
          try {
            let parsed: MandelBrotHeatCallResponse | PingResponse | any = JSON.parse(
              message.payload.toString()
            )
            switch (parsed.method) {
              case 'ping':
                console.log('processor health', parsed)
                break
              case 'mandelbrotHeat':
                await receivedResults.add({
                  point: parsed.arguments.startPoint,
                  numberOfResults: parsed.result.length
                })
                await drawCanvas(parsed.arguments.startPoint, parsed.result)
                break
              default:
                console.warn('received non result message', message.payload.toString())
                break
            }
          } catch (error) {
            console.log(`error in message handler ${error}`)
          }
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
  await callMissingValues()
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

    <button
      v-show="calculating"
      v-on:click="
        (_e: any) => {
          pingProcessors()
        }
      "
    >
      Ping processors
    </button>
    <p>ClientId: {{ clientId ?? 'no client id set' }}</p>
  </div>
  <div v-show="calculating" style="border-color: antiquewhite; border-style: solid">
    <canvas id="mandelBrotCanvas"></canvas>
  </div>
</template>
