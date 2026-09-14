"use client";
import { useEffect, useState } from "react";

// 🌟 ฟังก์ชันแยกที่อยู่และพิกัดออกจากกัน (ใส่ไว้ด้านนอกคอมโพเนนต์)
const extractLocation = (addressStr) => {
  if (!addressStr) return { cleanAddress: "-", lat: null, lng: null };
  
  // ใช้ Regex ดักจับพิกัดที่เราส่งมาจากหน้าบ้าน
  const regex = /\[พิกัดจัดส่ง:\s*([\d.-]+),\s*([\d.-]+).*?\]/;
  const match = addressStr.match(regex);
  
  if (match) {
    const cleanAddress = addressStr.replace(regex, "").trim(); // เอาพิกัดออกจากข้อความที่อยู่
    return { cleanAddress, lat: match[1], lng: match[2] };
  }
  return { cleanAddress: addressStr, lat: null, lng: null };
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [cloths, setCloths] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [previewImage, setPreviewImage] = useState(null); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
    const [resBookings, resCloths] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cloths`)
      ]);
      
      const resultBookings = await resBookings.json();
      const resultCloths = await resCloths.json();

      if (resultBookings.status === "success") {
        setBookings(resultBookings.data);
      }
      
      if (resultCloths.data) {
        setCloths(resultCloths.data);
      } else {
        setCloths(resultCloths);
      }
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClothInfo = (clothId) => {
    return cloths.find(c => c.id === clothId || c.cloth_id === clothId) || null;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const result = await res.json();
      if (result.status === "success") {
        setBookings((prevBookings) =>
          prevBookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
      }
    } catch (error) {
      console.error("อัปเดตสถานะไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบออเดอร์รหัส #${id} ?\n(ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้)`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`, {
        method: "DELETE",
      });
      
      const result = await res.json();
      if (result.status === "success") {
        setBookings(bookings.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("ลบข้อมูลไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 ระบบจัดการหลังบ้าน</h1>
          
          <div className="flex gap-4">
            <a href="/admin/add-cloth" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition flex items-center gap-2">
              ➕ เพิ่มชุดใหม่
            </a>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold shadow-sm">
              ออเดอร์ทั้งหมด: {bookings.length} รายการ
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl text-gray-500 font-bold animate-pulse">⏳ กำลังโหลดข้อมูล...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 text-lg mt-4 font-medium">ยังไม่มีรายการจองชุด</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-800 text-white text-sm uppercase tracking-wide">
                    <th className="p-4 text-center whitespace-nowrap">รหัส</th>
                    <th className="p-4 whitespace-nowrap">ชื่อลูกค้า</th>
                    <th className="p-4 text-center whitespace-nowrap">ข้อมูลชุดเช่า</th>
                    <th className="p-4 text-center whitespace-nowrap">วันที่เริ่ม-คืน</th>
                    <th className="p-4 text-right whitespace-nowrap">ยอดชำระ</th>
                    <th className="p-4 text-center whitespace-nowrap">สลิปโอนเงิน</th>
                    <th className="p-4 text-center whitespace-nowrap">การจัดส่ง</th>
                    <th className="p-4 whitespace-nowrap">ที่อยู่ลูกค้า</th>
                    <th className="p-4 text-center whitespace-nowrap">สถานะ</th>
                    <th className="p-4 text-center whitespace-nowrap">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((item) => {
                    const currentStatus = item.status || "รอดำเนินการ";
                    const clothInfo = getClothInfo(item.cloth_id);
                    const getImageUrl = (path) => {
                      if (!path) return "https://via.placeholder.com/150?text=No+Image";
                      if (path.startsWith("http")) return path; 
                      return `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
                    };

                    // 🌟 ดึงข้อมูลพิกัดและที่อยู่แบบคลีนๆ
                    const { cleanAddress, lat, lng } = extractLocation(item.address);
                    
                    // 🌟 คำนวณยอดรวมสุทธิ (ค่าเช่า + ค่าส่ง)
                    const grandTotal = (Number(item.total_price) || 0) + (Number(item.shipping_cost) || 0);

                    return (
                      <tr key={item.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="p-4 text-center font-bold text-gray-600">#{item.id}</td>
                        <td className="p-4 font-semibold text-gray-800">{item.customer_name}</td>
                        
                        <td className="p-4 text-center">
                            {clothInfo ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div 
                                        onClick={() => setPreviewImage(getImageUrl(clothInfo.image || clothInfo.image_url || clothInfo.cloth_image))} 
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        title="คลิกเพื่อดูรูปชุดขนาดใหญ่"
                                    >
                                        <img 
                                            src={getImageUrl(clothInfo.image || clothInfo.image_url || clothInfo.cloth_image)} 
                                            alt={clothInfo.cloth_name || clothInfo.name || "cloth"} 
                                            className="w-12 h-16 object-cover rounded-md border border-stone-200 shadow-sm"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                                        ชุดที่ {item.cloth_id}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-400">-</span>
                            )}
                        </td>

                        <td className="p-4 text-center text-sm font-medium text-gray-600">
                          <span className="text-blue-600">📅 {item.start_date}</span> <br/> 
                          <span className="text-red-500">ถึง {item.end_date}</span>
                        </td>
                        
                        {/* 🌟 แสดงยอดชำระแบบรวมค่าส่งแล้ว */}
                        <td className="p-4 text-right">
                          <div className="font-bold text-green-600 text-lg">{grandTotal} ฿</div>
                          {item.shipping_cost > 0 && (
                             <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                               (รวมค่าส่ง {item.shipping_cost} ฿)
                             </div>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          {item.slip_url ? (
                            <img
                                src={item.slip_url?.startsWith("http") ? item.slip_url : `${process.env.NEXT_PUBLIC_API_URL}/${item.slip_url}`} 
                                alt="slip"
                                className="w-14 h-14 object-cover rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-400 mx-auto transition hover:scale-110 shadow-sm"
                                onClick={() => setPreviewImage(item.slip_url?.startsWith("http") ? item.slip_url : `${process.env.NEXT_PUBLIC_API_URL}/${item.slip_url}`)}
                            />
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ไม่มีรูป</span>
                          )}
                        </td>

                        <td className="p-4 text-center text-sm">
                          {item.shipping_method === 'local' ? (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                              🚚 ส่งด่วน (เชียงใหม่)
                            </span>
                          ) : item.shipping_method === 'upcountry' ? (
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                              📦 ส่งต่างจังหวัด
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* 🌟 คอลัมน์ที่อยู่ พร้อมปุ่มนำทาง Google Maps */}
                        <td className="p-4 text-sm text-gray-700 max-w-xs break-words">
                          {item.address ? (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col gap-2 shadow-sm">
                                <span className="leading-relaxed">{cleanAddress}</span>
                                
                                {/* ถ้ามีข้อมูลพิกัด (lat, lng) ให้โชว์ปุ่มนี้ */}
                                {lat && lng && (
                                   <a 
                                     href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="mt-1 bg-[#4285F4] text-white hover:bg-[#3367D6] px-3 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                   >
                                     <span className="text-sm">📍</span> เปิดแผนที่นำทาง
                                   </a>
                                )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer text-center appearance-none transition-colors ${
                              currentStatus === 'รอดำเนินการ' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              currentStatus === 'อนุมัติแล้ว' ? 'bg-green-100 text-green-800 border-green-300' :
                              currentStatus === 'คืนชุดแล้ว' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            <option value="รอดำเนินการ">รอดำเนินการ</option>
                            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                            <option value="คืนชุดแล้ว">คืนชุดแล้ว</option>
                            <option value="ยกเลิก">ยกเลิก</option>
                          </select>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-colors border border-red-100 hover:border-red-500"
                            title="ลบออเดอร์"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4 backdrop-blur-sm transition-opacity">
          <div className="relative max-w-lg w-full flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-red-400 text-3xl font-bold transition drop-shadow-md" 
              onClick={() => setPreviewImage(null)}
            >
              ✕ ปิด
            </button>
            <img src={previewImage} alt="preview" className="w-full h-auto rounded-xl shadow-2xl object-contain max-h-[85vh] border-4 border-white" />
          </div>
        </div>
      )}
    </div>
  );
}