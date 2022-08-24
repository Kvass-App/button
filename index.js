import ButtonComponent from './src/Component.vue'

const install = (Vue) => {
	Vue.component('button-component', ButtonComponent)
}

const Options = {
	type: 'submit',
	labels: {
		loading: 'Loading...',
		success: 'Completed',
		confirm: 'Are you sure?',
		error: 'Something went wrong',
	},
	loadingOnClick: false,
}

const setup = (options) => {
	for (let key in options) {
		if (!(key in Options)) return
		Options[key] = options[key]
	}
}

export default {
	install,
}

export { ButtonComponent, install as ButtonComponentInstaller, setup, Options }