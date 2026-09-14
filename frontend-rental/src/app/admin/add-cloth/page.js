"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import Navbar from "../../Navbar"; // เอาคอมเมนต์ออกถ้ามีการใช้ Navbar

export default function AddClothPage() {
  const router = useRouter();
  
  // 📝 State เก็บข้อมูลฟอร์ม
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price1, setPrice1] = useState("");
  const [price2, setPrice2] = useState("");
  const [price3, setPrice3] = useState("");
  const [status, setStatus] = useState("ว่าง");
  
  // 📸 State รูปภาพ (รองรับสูงสุด 4 รูป)
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ดึงหมวดหมู่จากฐานข้อมูลตอนเปิดหน้า
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/categories");
      const result = await res.json();
      
      // 🌟 เพิ่มบรรทัดนี้เพื่อดูว่าเว็บได้รับข้อมูลอะไรมา
      console.log("ข้อมูลหมวดหมู่ที่ดึงได้:", result); 
      
      if (result.status === "success") {
        setCategories(result.data);
      } else {
        alert("ดึงหมวดหมู่ล้มเหลว: " + result.detail);
      }
    } catch (error) {
      console.error("ดึงหมวดหมู่ไม่สำเร็จ:", error);
    }
  };

  // ฟังก์ชันพรีวิวเมื่อเลือกรูป (จำกัด 4 รูป)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 4) {
      alert("❌ อัปโหลดรูปภาพได้สูงสุด 4 รูปเท่านั้นครับ");
      return;
    }

    if (files.length > 0) {
      setImages(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || images.length === 0 || !categoryId || !price1) {
      alert("⚠️ กรุณากรอกข้อมูลและอัปโหลดรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category_id", categoryId);
    formData.append("price_1_day", price1);
    formData.append("price_2_days", price2 || 0); // ถ้าไม่กรอกให้เป็น 0
    formData.append("price_3_days", price3 || 0);
    formData.append("status", status);
    
    // วนลูปแนบไฟล์รูปภาพทั้งหมดไปกับ FormData
    images.forEach((img) => {
      formData.append("images", img);
    });

    try {
      const res = await fetch("http://localhost:8000/api/cloths", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      
      if (result.status === "success") {
        alert("🎉 เพิ่มชุดใหม่เข้าร้านเรียบร้อยแล้ว!");
        router.push("/admin"); // เด้งกลับไปหน้าแอดมิน
      } else {
        alert("เกิดข้อผิดพลาด: " + result.detail);
      }
    } catch (error) {
      console.error(error);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* <Navbar /> */}
      
      <div className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">👗 เพิ่มชุดเช่าใหม่</h2>
            <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-blue-600 bg-gray-100 px-4 py-2 rounded-lg transition">
              ← กลับหน้าแอดมิน
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 📸 ส่วนอัปโหลดรูปภาพ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รูปภาพชุด (เลือกได้สูงสุด 4 รูป)</label>
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden mb-4">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                    <span className="text-3xl mb-1">📸</span>
                    <p className="text-sm font-bold">คลิกเพื่อเลือกรูปภาพทั้งหมด (เลือกคลุมหลายรูปได้เลย)</p>
                  </div>
                  {/* ใส่ multiple เพื่อให้เลือกได้หลายรูป */}
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} required />
                </label>

                {/* โชว์รูปพรีวิว */}
                {imagePreviews.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden border shadow-sm">
                        <img src={src} alt={`preview-${index}`} className="w-full h-full object-cover" />
                        {index === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center font-bold py-1">
                            หน้าปก
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 📝 ส่วนข้อมูลพื้นฐาน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อชุดเช่า</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เดรสราตรีสีแดง..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">หมวดหมู่</label>
                <select 
                  required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 cursor-pointer"
                >
                  <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 💰 ส่วนราคา 3 เรท */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ราคาเช่า (บาท)</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">1 วัน</label>
                  <input type="number" required value={price1} onChange={(e) => setPrice1(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border text-center font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">2 วัน</label>
                  <input type="number" value={price2} onChange={(e) => setPrice2(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border text-center font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">3 วัน</label>
                  <input type="number" value={price3} onChange={(e) => setPrice3(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-lg border text-center font-bold text-blue-600" />
                </div>
              </div>
            </div>

            {/* 🚥 ส่วนตั้งค่าสถานะเริ่มต้น */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">สถานะเริ่มต้น</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border font-bold outline-none transition cursor-pointer ${
                    status === 'ว่าง' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <option value="ว่าง">✅ ว่าง (พร้อมเช่า)</option>
                  <option value="ไม่ว่าง">❌ ไม่ว่าง (ซ่อมบำรุง/ซัก)</option>
                </select>
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl text-lg transition shadow-lg mt-4 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30"
              }`}
            >
              {loading ? "⏳ กำลังบันทึกข้อมูล..." : "➕ บันทึกข้อมูลและเพิ่มชุดเข้าร้าน"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}