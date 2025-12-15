/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // CodeForge Design System
                'bg-dark': '#0F172A',
                'card-surface': '#1E293B',
                'primary-blue': '#3B82F6',
                'accent-purple': '#8B5CF6',
                'danger': '#EF4444',
                'success': '#10B981',
            },
            fontFamily: {
                'display': ['Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s infinite linear',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
                    '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
