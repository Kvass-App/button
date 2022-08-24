<template>
  <component
    ref="$el"
    :is="tag"
    v-bind="{
      ...$attrs,
      disabled,
      type,
      class: classNames,
    }"
  >
    <div class="kvass-button__content">
      <slot>
        <span v-if="labelComp || $slots.label" class="kvass-button__label">
          <slot name="label">
            {{ labelComp }}
          </slot>
        </span>
        <span v-if="$slots.icon" class="kvass-button__icon">
          <slot name="icon" />
        </span>
      </slot>
    </div>
  </component>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, useAttrs, useSlots, watch } from 'vue'

import { Capitalize, isPromise } from './utils'

const emit = defineEmits(['click', 'onSuccess', 'onError'])
const attrs = useAttrs()
const slots = useSlots()
const props = defineProps({
  tag: {
    type: String,
    default: 'button',
  },
  theme: {
    type: String,
    enum: ['default', 'primary', 'secondary', 'warning', 'error', 'success'],
    default: 'default',
  },
  label: String,
  labels: {
    type: Object,
    default: () => ({}),
  },
  iconPlacement: {
    type: String,
    default: 'right',
    enum: ['left', 'right'],
  },
  loading: Boolean,
  loadingOnClick: [Boolean, Function],
  promise: Promise,
  stateTimeout: {
    type: Number,
    default: 1000,
  },
  confirm: Boolean,
})

const state = ref('')
const innerPromise = ref(null)
const stateTimer = ref(null)
const loadingThreshold = ref(null)
const clickAway = ref(null)
const clickBinding = ref(null)
const $el = ref()

function clickAwayFunc(event) {
  if (!$el.value.contains(event.target)) resetState()
}

const themeComp = computed(() => {
  if (!onState.value) return props.theme
  if (state.value === 'confirm') return 'warning'
  return state.value || 'default'
})

const labelComp = computed(() => {
  if (!onState.value) return props.label
  if (isLoading.value) return attrs['loading-label'] || props.labels.loading
  return attrs[state.value + '-label'] || props.labels[state.value]
})

const disabled = computed(() => {
  return isLoading.value || attrs.disabled
})

const isLoading = computed(() => {
  return state.value === 'loading' || props.loading
})

const type = computed(() => {
  if (props.confirm && state.value !== 'confirm') return 'button'
  return attrs.type
})

const onState = computed(() => {
  return state.value || isLoading.value
})

const isBusy = computed(() => {
  return ['success', 'error'].includes(state.value) || isLoading.value
})

const classNames = computed(() => {
  return [
    'kvass-button',
    'kvass-button--' + themeComp.value,
    {
      'kvass-button--loading': isLoading.value,
      'kvass-button--busy': isBusy.value,
      'kvass-button--icon-left': slots.icon && props.iconPlacement === 'left',
      'kvass-button--icon-right':
        (slots.icon && props.iconPlacement === 'right') || state.value === 'confirm',
    },
  ]
})

function hookPromise(promise) {
  if (!promise) return
  resetState()
  innerPromise.value = promise

  loadingThreshold.value = setTimeout(() => (state.value = 'loading'), 100)

  let initStateTimeout = s => {
    resetState()
    if (props.stateTimeout) {
      state.value = state
      stateTimer.value = setTimeout(() => {
        resetState()
        emit('on' + Capitalize(s))
      }, props.stateTimeout)
    } else emit('on' + Capitalize(s))
  }

  innerPromise.value.then(() => initStateTimeout('success')).catch(() => initStateTimeout('error'))
}

function resetState() {
  if (loadingThreshold.value) clearTimeout(loadingThreshold.value)
  if (stateTimer.value) clearTimeout(stateTimer.value)
  innerPromise.value = null
  state.value = null
}

function onClick(event) {
  if (props.confirm && state.value !== 'confirm') {
    clickAway.value = clickAwayFunc.bind(this)
    window.addEventListener('click', clickAway.value)
    return (state.value = 'confirm')
  }
  if (clickAway.value) {
    window.removeEventListener('click', clickAway.value)
    clickAway.value = null
  }
  resetState()
  emit('click', event)

  let loadingOnClick = 'loadingOnClick' in props ? props.loadingOnClick : false
  if (loadingOnClick) {
    if (
      (typeof loadingOnClick === 'function' && loadingOnClick.apply(this)) ||
      (typeof loadingOnClick !== 'function' && loadingOnClick)
    ) {
      state.value = 'loading'
    }
  }
}

onBeforeMount(() => {
  watch(
    () => props.promise,
    value => {
      if (isPromise(value)) hookPromise(value)
    },
  )
  clickBinding.value = onClick.bind(this)
})

onMounted(() => {
  $el.value.addEventListener('click', clickBinding.value)
})

onBeforeUnmount(() => {
  $el.value.removeEventListener('click', clickBinding.value)
})
</script>

<style lang="scss">
$states: ('default', 'primary', 'secondary', 'warning', 'success', 'error');

$variables: (
  'default': transparent,
  'default-contrast': currentColor,
  'default-border': rgba(0, 0, 0, 0.1),
  'primary': #3a9acd,
  'primary-border': var(--primary),
  'primary-contrast': white,
  'secondary': #ff773f,
  'secondary-border': var(--secondary),
  'secondary-contrast': white,
  'warning': #ff773f,
  'warning-border': var(--warning),
  'warning-contrast': white,
  'success': #33ca62,
  'success-border': var(--success),
  'success-contrast': white,
  'error': #e83b35,
  'error-border': var(--error),
  'error-contrast': white,
  'border-radius': 3px,
  'button-padding-y': 0.5em,
  'button-padding-x': 1em,
  'button-disabled': #ccc,
  'button-disabled-contrast': darken(#ccc, 35%),
);

@function GetVariable($key) {
  @return var(--#{$key}, map-get($variables, $key));
}

.kvass-button {
  font: inherit;

  position: relative;

  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;

  padding: GetVariable('button-padding-y') GetVariable('button-padding-x');

  border-width: 1px;
  border-style: solid;
  border-color: transparent;
  border-radius: GetVariable('border-radius');

  &__content {
    display: inline-flex;
    align-items: center;
    gap: GetVariable('button-padding-y');
    justify-content: center;
    transition: all 150ms ease;
  }

  &:disabled,
  &[disabled='disabled'] {
    pointer-events: none;

    // filter: saturate(0);
  }

  &:hover {
    filter: brightness(0.95);
  }

  &:focus-visible {
    outline: 2px solid;
    outline-offset: 2px;
  }

  &--icon {
    z-index: 1;

    // justify-content: space-between;

    &-left {
      flex-direction: row-reverse;
    }
  }

  &--busy {
    pointer-events: none !important;
  }

  &--loading {
    overflow: hidden;

    cursor: wait;

    .kvass-button__content {
      opacity: 0;
      transform: translateY(0.3rem);
    }

    &:after {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      display: inline-block;

      width: 1.25rem;
      height: 1.25rem;

      content: '';
      animation: loader 1s infinite linear;

      border-radius: 30rem;
      border: 2px solid transparent;
      border-right-color: currentColor;

      @keyframes loader {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    }
  }

  &__label {
    z-index: 1;

    flex-grow: 1;
  }

  &__icon {
    border-radius: 0 GetVariable('border-radius') GetVariable('border-radius') 0;

    &:first-child:last-child {
      padding: GetVariable('button-padding-y') GetVariable('button-padding-x');

      border-radius: GetVariable('border-radius') 0 0 GetVariable('border-radius');
    }
  }

  @each $state in $states {
    &--#{$state} {
      color: GetVariable('#{$state}-contrast');
      border-color: GetVariable('#{$state}-border');
      background-color: GetVariable('#{$state}');

      &--inverted {
        color: GetVariable('#{$state}');
        border-color: GetVariable('#{$state}');
        background-color: GetVariable('#{$state}-contrast');
      }
    }
  }
}
</style>
