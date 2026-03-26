/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                retro: {
                    base: '#e6e1d6',
                    card: '#f9f8f4',
                    terminal: '#0c0c0c',
                    amber: '#da8a2d',
                    olive: '#526239',
                    oliveHover: '#3e4a2a',
                    shadow: '#cfc9bd',
                    input: '#e4ddce',
                    brown: '#875a25',
                    gray: '#787878',
                    text: '#1a1a1a'
                }
            },
            fontFamily: {
                dos: ['"Press Start 2P"', 'monospace'],
                body: ['"Share Tech Mono"', 'monospace'],
                pixel: ['"VT323"', 'monospace']
            },
            boxShadow: {
                'brutal': '6px 6px 0px 0px #cfc9bd',
                'brutal-sm': '4px 4px 0px 0px #cfc9bd',
                'brutal-active': '2px 2px 0px 0px #cfc9bd',
            }
        },
    },
    plugins: [],
}