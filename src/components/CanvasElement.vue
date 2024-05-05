<script setup lang="ts">
import { AcurastClient } from '@acurast/dapp'
// import { Buffer } from 'buffer'
// var Buffer = require('buffer/').Buffer
const width = defineModel('width')
const height = defineModel('height')
const iterations = defineModel('iterations')
const processors = defineModel('processors')
var acurastClient: any = undefined
var keys: any = undefined

async function generateKeys() {
  //   const keyPair = await crypto.subtle.generateKey(
  //     {
  //       name: 'ECDSA',
  //       namedCurve: 'P-256'
  //     },
  //     true,
  //     ['sign']
  //   )

  //   await crypto.subtle.exportKey('jwk', keyPair.privateKey).then((jwk: any) => {
  //     console.log('JWK')
  //     console.log(jwk)
  //     Buffer.from(jwk.d || '', 'base64').toString()
  //   })

  //   const [privateKeyRaw, publicKeyRaw] = await Promise.all([
  //     crypto.subtle
  //       .exportKey('jwk', keyPair.privateKey)
  //       .then((jwk: any) => Buffer.from(jwk.d || '', 'base64')),
  //     crypto.subtle
  //       .exportKey('raw', keyPair.publicKey)
  //       .then((arrayBuffer: any) => Buffer.from(arrayBuffer))
  //   ])

  //   keys = { privateKey: privateKeyRaw.toString('hex'), publicKey: publicKeyRaw.toString('hex') }
  keys = {
    privateKey: 'f3e6ebaefe0ee05601f98d5c94d14ae9d6c095b2fed4b05e2e5242a91fe61529',
    publicKey:
      '0467ff0dd3d37520e36c368aff5c23b717f0f48bd3e3812119e5482cafa00dd0f4eaa24049bc4a70145f144cdc015dfebc05a3c549c9dd846ee10eb7c5374324e1'
  }
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
      acurastClient.start({ secretKey: keys.privateKey, publicKey: keys.publicKey })
    } catch (error) {
      console.log('error on starting acurast client')
    }
  }
}

async function calculateMandelBrot() {
  console.log(
    `calculating mandelbrot with: width=${width.value} height=${height.value} iterations=${iterations.value} processors=${processors.value}`
  )

  //   set height, width of canvas
  const canvas = document.getElementById('mandelBrotCanvas')
  if (canvas !== null) {
    canvas.height = height.value
    canvas.width = width.value
  }
  //  trigger calculations for 2 rows each call to a processor
  await connectAcurastClient()
}

defineExpose({
  calculateMandelBrot
})
</script>

<template>
  <div>
    <canvas id="mandelBrotCanvas"></canvas>
  </div>
</template>
