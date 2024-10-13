/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			fontFamily: {
				'sans': ['Montserrat', 'sans-serif'],
			},
			colors: {
				'primary': '#8B0000',
			},
		},
	},
	plugins: [],
}
