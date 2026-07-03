import { useThemeStore } from "../../store/themeStore";

export default function ThemeToggle() {
    const { isDark, toggle } = useThemeStore()
    
    return (
        <button
            onClick={toggle}
            className="
            p-2 rounded-lg transition-colors duration-200
                bg-gray-100 hover:bg-gray-200
                dark:bg-gray-800 dark:hover:bg-gray-700
                text-gray-800 dark:text-gray-100
            "
            aria-label="Toggle theme"
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    )
}