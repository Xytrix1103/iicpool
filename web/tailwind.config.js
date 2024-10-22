/** @type {import('tailwindcss').Config} */

import TailwindAnimate from 'tailwindcss-animate'

module.exports = {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				black: '#303030',
				gray: '#A2A2A2',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					green: '#72E1AC',
					red: '#FF6262',
					blue: '#35BCFF',
					yellow: '#FFCC00',
					gray: '#A2A2A2',
					darkred: '#8B0000',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 2px)`,
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				pulseRed: {
					'0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.7)' },
					'70%': { boxShadow: '0 0 0 20px rgba(255, 0, 0, 0)' },
					'100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				pulseRed: 'pulseRed 2s infinite',
			},
			fontFamily: {
				'sans': ['Montserrat', 'sans-serif'],
			},
		},
	},
	plugins: [TailwindAnimate],
	darkMode: ['class'],
}
