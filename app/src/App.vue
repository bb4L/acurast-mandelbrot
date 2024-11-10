<script setup lang="ts">
const width = defineModel<number>('width')
const height = defineModel<number>('height')
const iterations = defineModel<number>('iterations')
const processors = defineModel<string>('processors')
const calculating = defineModel<boolean>('calculating')
width.value = 1000
height.value = 1000
iterations.value = 100
calculating.value = false
processors.value = ''
import SubmitForm from './components/SubmitForm.vue'
import CanvasElement from './components/CanvasElement.vue'
import { ref } from 'vue'
const canvasComponent = ref(null)

defineEmits({
  redraw: () => {
    console.log('redraw')
    return true
  }
})

async function triggerCanvasRedraw() {
  console.log(
    `app retrigger canvas drawing  width=${width.value} height=${height.value} iterations=${iterations.value}`
  )
  canvasComponent.value.calculateMandelBrot()
}

async function triggerCanvasRedrawMin() {
  console.log(
    `app retrigger canvas drawing  width=${width.value} height=${height.value} iterations=${iterations.value}`
  )
  canvasComponent.value.calculateMandelBrotMin()
}
</script>

<template>
  <main>
    <!-- FIXME: add component to display stats e.g. acurast id, connected  -->
    <SubmitForm
      v-model:height="height"
      v-model:width="width"
      v-model:iterations="iterations"
      v-model:processors="processors"
      v-model:calculating="calculating"
      @redraw="triggerCanvasRedraw()"
      @redrawMin="triggerCanvasRedrawMin()"
    ></SubmitForm>
    <CanvasElement
      ref="canvasComponent"
      v-model:height="height"
      v-model:width="width"
      v-model:iterations="iterations"
      v-model:processors="processors"
      v-model:calculating="calculating"
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
