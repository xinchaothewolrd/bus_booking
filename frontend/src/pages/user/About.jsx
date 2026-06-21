export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Về Bus Booking</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Câu chuyện của chúng tôi</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Bus Booking được thành lập vào năm 2026 với mục tiêu cách mạng hóa
          cách mà khách du lịch đặt vé xe bus. Chúng tôi tin rằng việc đặt vé
          nên dễ dàng, rẻ tiền và đáng tin cậy.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Ngày hôm nay, chúng tôi đã phục vụ hơn 100,000 khách hàng hài lòng
          trên khắp đất nước.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Tầm nhìn và Sứ mệnh</h2>
        <p className="text-gray-700 leading-relaxed">
          <strong>Tầm nhìn:</strong> Trở thành nền tảng đặt vé xe bus số 1 ở
          Việt Nam
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Sứ mệnh:</strong> Cung cấp dịch vụ đặt vé XE BUS chất lượng
          cao với giá tốt nhất
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Giá trị cốt lõi</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Tính minh bạch</li>
          <li>Tâm huyết với khách hàng</li>
          <li>Đổi mới liên tục</li>
          <li>Trách nhiệm với xã hội</li>
        </ul>
      </section>
    </div>
  );
}
