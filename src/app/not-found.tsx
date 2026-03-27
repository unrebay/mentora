import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <Logo size="sm" fontSize="1.44rem" href="/" />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-gray-100 select-none mb-2">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Страница не найдена</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Кажется, эта страница исчезла как Атлантида.
            Но мы поможем тебе вернуться на правильный путь.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              На главную
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              В дашборд
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
