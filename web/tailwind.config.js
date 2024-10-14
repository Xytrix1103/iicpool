/** @type {import('tailwindcss').Config} */

import TailwindAnimate from 'tailwindcss-animate'

module.exports = {
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
				primary: {
					DEFAULT: '#8B0000',
				},
			},
		},
	},
	plugins: [TailwindAnimate],
	darkMode: ['class'],
}
