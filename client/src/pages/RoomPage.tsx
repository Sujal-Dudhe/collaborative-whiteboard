import Navbar from '../components/ui/Navbar'

export default function RoomPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
            <Navbar />
            <main style={{ paddingTop: '56px' }} className="flex items-center justify-center h-[calc(100vh-56px)]">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Room Page — coming soon
                </h1>
            </main>
        </div>
    )
}