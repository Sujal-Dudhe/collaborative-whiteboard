import ThemeToggle from './ThemeToggle'

export default function Navbar() {
    return (
        <nav className="
            w-full px-6 py-4 flex items-center justify-between
            bg-white dark:bg-gray-900
            border-b border-gray-200 dark:border-gray-700
            shadow-sm
        ">
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                ✏️ Whiteboard
            </span>
            <ThemeToggle />
        </nav>
    )
}