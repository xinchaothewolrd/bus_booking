import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Trang không tìm thấy</p>
        <p className="text-gray-500 mb-8">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-block"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
