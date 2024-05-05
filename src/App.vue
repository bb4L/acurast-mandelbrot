<script setup lang="ts">
import { Buffer } from 'Buffer'

const width = defineModel('width')
const height = defineModel('height')
const iterations = defineModel('iterations')
const processors = defineModel('processors')
import SubmitForm from './components/SubmitForm.vue'
import CanvasElement from './components/CanvasElement.vue'
import { ref } from 'vue'
const canvasComponent = ref(null)

const emit = defineEmits({
  redraw: () => {
    console.log('redraw')
    return true
  }
})

console.log(`emit: ${emit}`)

// async function triggerCanvasRedraw(width: number, height: number, iterations: number) {
async function triggerCanvasRedraw() {
  // this.$refs.canvasComponent.calculateMandelBrot()
  console.log(
    `app retrigger canvas drawing  width=${width.value} height=${height.value} iterations=${iterations.value}`
  )
  canvasComponent.value.calculateMandelBrot()

  // FIXME: call canvas component function
}
</script>

<template>
  <main>
    <SubmitForm
      v-model:height="height"
      v-model:width="width"
      v-model:iterations="iterations"
      v-model:processors="processors"
      @redraw="triggerCanvasRedraw()"
    ></SubmitForm>
    <CanvasElement
      ref="canvasComponent"
      v-model:height="height"
      v-model:width="width"
      v-model:iterations="iterations"
      v-model:processors="processors"
    ></CanvasElement>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
