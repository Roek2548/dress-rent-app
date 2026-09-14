"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useCart } from "../../CartContext";

export default function ClothDetail({ params }) {
  const { id } = use(params); 
  const [cloth, setCloth] = useState(null);
  const { addToCart } = useCart();
  const [mainImage, setMainImage] = useState("");

  // 📅 ตัวแปรเก็บวันที่เริ่มต้นเช่าและวันคืนชุด
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const fetchSingleCloth = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cloth/${id}`);
      const data = await res.json();
      if (data.status === "success") {
          setCloth(data.data);
          
          // 🌟 เช็คและแปลง URL ก่อนเซ็ตค่าให้รูปใหญ่
          let firstImg = "https://via.placeholder.com/600";
          if (data.data.image) {
            firstImg = data.data.image.startsWith("http") 
              ? data.data.image 
              : `${process.env.NEXT_PUBLIC_API_URL}/${data.data.image}`;
          }
          setMainImage(firstImg);
        }
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    }
  };

  useEffect(() => {
    fetchSingleCloth();
  }, [id]);

// 🧮 ปรับสูตรคำนวณ: เอาวันคืนลบวันรับตรงๆ (เช่าวันที่ 9 คืนวันที่ 10 = 1 วัน)
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // ลบกันตรงๆ

      if (diffDays > 0) {
        setTotalDays(diffDays);
        let pricePerDay = cloth?.price_1_day || cloth?.price_per_day || 100;
        if (diffDays === 2 && cloth?.price_2_days) pricePerDay = cloth.price_2_days / 2;
        if (diffDays >= 3 && cloth?.price_3_days) pricePerDay = cloth.price_3_days / 3;
        
        setTotalPrice(pricePerDay * diffDays);
      } else if (diffDays === 0) {
        // กรณีรับและคืนภายในวันเดียวกัน อนุโลมให้นับเป็น 1 วัน
        setTotalDays(1);
        let pricePerDay = cloth?.price_1_day || cloth?.price_per_day || 100;
        setTotalPrice(pricePerDay);
      } else {
        setTotalDays(0);
        setTotalPrice(0);
      }
    }
  }, [startDate, endDate, cloth]);

const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันที่เริ่มต้นเช่าและวันคืนชุดก่อนครับ! 📅");
      return;
    }
    if (totalDays <= 0) {
      alert("วันคืนชุดต้องอยู่หลังวันเริ่มต้นเช่าครับ!");
      return;
    }

    try {
      // 🛡️ วิ่งไปเช็คกับหลังบ้านก่อนว่าช่วงเวลานี้ชุดถูกจองไปหรือยัง
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-availability?cloth_id=${id}&start_date=${startDate}&end_date=${endDate}`);
      const result = await res.json();

      if (result.status === "booked") {
        alert("❌ ขออภัยครับ ชุดนี้ถูกเช่าหรือมีคิวจองในช่วงเวลานี้ไปแล้ว ไม่สามารถเลือกได้!");
        return;
      }

      // ถ้าว่าง ค่อยยอมให้เพิ่มลงตะกร้า
      const cartItem = { 
        ...cloth, 
        rent_days: totalDays, 
        rent_price: totalPrice,
        start_date: startDate,
        end_date: endDate
      };
      addToCart(cartItem);

    } catch (error) {
      console.error("ตรวจสอบคิวไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการตรวจสอบคิว กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (!cloth) return <div className="text-center mt-20 text-2xl font-bold text-gray-600">กำลังโหลดข้อมูลชุด... 👗</div>;

  const allImages = [
  cloth.image, 
  cloth.image_2, 
  cloth.image_3, 
  cloth.image_4
]
.filter(img => img)
.map(img => img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_API_URL}/${img}`);

  // 🌟 ค่าส่งตอนนี้ 50 บาทเท่ากันทั้งเชียงใหม่และต่างจังหวัด
    const shippingCost = 50;
    const finalPrice = totalPrice + shippingCost; // ✅ เปลี่ยนชื่อเป็น finalPrice และเอา totalPrice ตัวเดิมมาบวกค่าส่ง

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* โซนรูปภาพ */}
        <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col items-center justify-start border-r border-gray-100">
          <div className="w-full h-96 mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <img src={mainImage} alt={cloth.cloth_name} className="w-full h-full object-contain" />
          </div>
          <div className="flex space-x-3 w-full justify-center">
            {allImages.map((imgUrl, index) => (
              <div 
                key={index} 
                onClick={() => setMainImage(imgUrl)} 
                className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  mainImage === imgUrl ? "border-blue-600 shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={imgUrl} className="w-full h-full object-cover" alt="thumbnail" />
              </div>
            ))}
          </div>
        </div>

        {/* โซนเลือกวันจอง */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{cloth.cloth_name}</h1>
          <p className="text-lg text-gray-600 mb-6">ระบบจองคิวเช่าชุดล่วงออนไลน์</p>

          {/* กล่องเลือกปฏิทิน */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">วันที่รับชุด (Start):</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">วันที่คืนชุด (End):</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl mb-6">
            <p className="text-gray-700 mb-1">ระยะเวลาเช่า: <span className="font-bold text-blue-600">{totalDays} วัน</span></p>
            <p className="text-gray-700 mb-2">ราคารวมสุทธิ:</p>
            <p className="text-4xl font-bold text-blue-600">{totalPrice || 0} บาท</p>
          </div>

          <button 
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition duration-300 shadow-lg mb-4"
          >
            🛒 ยืนยันการจอง / เพิ่มลงตะกร้า
          </button>

          <Link href="/" className="text-center text-gray-500 hover:text-blue-600 font-medium transition">
            ⬅️ กลับไปหน้าร้านค้า
          </Link>
        </div>
      </div>
    </div>
  );
}