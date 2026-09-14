"use client";
import { useState, useEffect } from "react";
import { useCart } from "./CartContext";
import { supabase } from '../supabaseClient';
import Link from "next/link";
import dynamic from "next/dynamic"; 

// 🌟 เรียกใช้ MapPicker แบบพิเศษ เพื่อไม่ให้หน้าจอขาวตอนโหลดแผนที่
const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-sm text-gray-500 bg-gray-100 rounded-xl animate-pulse">กำลังโหลดแผนที่... 🗺️</div>
});

export default function Navbar() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  
  // 🌟 ป้องกัน Server-Side Rendering สำหรับคอมโพเนนต์แผนที่
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 🌟 ควบคุม Popup อัปโหลดสลิป
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // 🌟 State สำหรับจัดส่งและแผนที่
  const [shippingMethod, setShippingMethod] = useState("local"); 
  const [address, setAddress] = useState("");
  const [shippingCost, setShippingCost] = useState(50); 
  
  // 📍 เก็บพิกัดและระยะทางที่ลูกค้าปักหมุด
  const [pinLocation, setPinLocation] = useState(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsCheckingAuth(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ==========================================
  // 🌟 ฟังก์ชันคำนวณระยะทางและค่าส่ง
  // ==========================================
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // รัศมีโลก (กิโลเมตร)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c).toFixed(2); 
  };

  const handleLocationSelect = (latlng) => {
    setPinLocation(latlng);
    
    const shopLat = 18.876016;
    const shopLng = 99.010307;
    
    const dist = calculateDistance(shopLat, shopLng, latlng.lat, latlng.lng);
    setDistance(dist);
    
    let cost = 50;
    if (dist > 5) {
       cost += Math.ceil(dist - 5) * 10;
    }
    setShippingCost(cost);
  };

  useEffect(() => {
    if (shippingMethod === "upcountry") {
      setShippingCost(50);
    } else if (shippingMethod === "local" && pinLocation) {
       let cost = 50;
       if (distance > 5) cost += Math.ceil(distance - 5) * 10;
       setShippingCost(cost);
    }
  }, [shippingMethod, distance, pinLocation]);

  const totalPrice = cart.reduce((sum, item) => sum + (item.rent_price || 0), 0);
  const finalTotalPrice = totalPrice + shippingCost; 

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150?text=No+Image";
    if (path.startsWith("http")) return path; 
    return `${process.env.NEXT_PUBLIC_API_URL}/${path}`;   
  };
  
  const handleFinalBooking = async (e) => {
    e.preventDefault();
    if (!customerName || !slipFile) {
      alert("กรุณากรอกชื่อและอัปโหลดรูปสลิปให้เรียบร้อยครับ!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("cloth_ids", cart.map(item => item.cloth_id || item.id).join(","));
      formData.append("start_dates", cart.map(item => item.start_date).join(","));
      formData.append("end_dates", cart.map(item => item.end_date).join(","));
      formData.append("total_prices", cart.map(item => item.rent_price).join(","));
      formData.append("customer_name", customerName);
      formData.append("slip_image", slipFile);
      formData.append("shipping_method", shippingMethod);
      formData.append("shipping_cost", shippingCost);

      let finalAddress = address;
      if (shippingMethod === "local" && pinLocation) {
         finalAddress += `\n[พิกัดจัดส่ง: ${pinLocation.lat.toFixed(6)}, ${pinLocation.lng.toFixed(6)} | ระยะทาง: ${distance} กม.]`;
      }
      formData.append("address", finalAddress);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/booking`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.status === "success") {
        alert("🎉 จองชุดและอัปโหลดสลิปสำเร็จเรียบร้อย!");
        if (typeof clearCart === "function") clearCart();
        else window.location.reload(); 
        setIsSlipModalOpen(false);
        setIsOpen(false);
        setCustomerName("");
        setSlipFile(null);
        setPinLocation(null);
      } else {
        const errorMsg = typeof result.detail === "object" ? JSON.stringify(result.detail) : (result.detail || "ไม่สามารถบันทึกการจองได้");
        alert("เกิดข้อผิดพลาด: " + errorMsg);
      }
    } catch (error) {
      console.error("Booking Error:", error);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้");
    } finally {
      setLoading(false);
    }
  };

  const isReadyToSubmit = customerName && slipFile && address && (shippingMethod === 'upcountry' || (shippingMethod === 'local' && pinLocation));

  return (
    <>
      <nav className="w-full bg-[#fae8e3] py-5 px-8 md:px-16 flex justify-between items-center border-b border-stone-200/50">
        <div className="flex items-center">
          <a href="/">
            <img src="/logo.png" alt="StyleFlow Logo" className="h-16 md:h-20 w-auto object-contain" />
          </a>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={() => setIsOpen(true)} style={{ color: '#f36589' }} className="font-bold flex items-center transition relative tracking-wide text-sm md:text-base hover:opacity-80">
            <span className="text-xl mr-1">🛒</span> CART
            <span className="ml-2 bg-[#f36589] text-white text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              {cart.length}
            </span>
          </button>

          {loading ? (
            <div className="text-sm text-gray-400">กำลังโหลด...</div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3">
                <Link href="/profile" className="shrink-0 hover:opacity-80 transition cursor-pointer">
                  <img src={user.user_metadata?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="Profile" className="w-10 h-10 rounded-full border-2 border-pink-400 object-cover shadow-sm" />
                </Link>
                <div className="flex flex-col">
                  <Link href="/profile" className="hover:underline cursor-pointer">
                    <span className="text-sm font-bold text-gray-800 leading-tight block">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button onClick={handleLogout} className="text-[11px] text-gray-400 hover:text-red-500 text-left transition-colors mt-0.5 cursor-pointer w-fit">
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link href="/login" className="bg-[#F8719D] hover:bg-[#E05B86] text-white px-6 py-2 rounded-md font-bold shadow-sm transition-colors">
              LOGIN
            </Link>
          )}
        </div>
      </nav>

      {isOpen && !isSlipModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-800">🛒 ตะกร้าชุดเช่าของคุณ</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
            </div>

            <div className="flex-grow overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-lg">ยังไม่มีชุดในตะกร้าของคุณเลยครับ 👗</div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <img src={getImageUrl(item.image || item.image_url || item.cloth_image)} alt={item.cloth_name || item.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                    <div className="flex-grow mx-4">
                      <h3 className="font-bold text-gray-800">{item.cloth_name}</h3>
                      <p className="text-xs text-gray-500">📅 {item.start_date} ถึง {item.end_date}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">ระยะเวลา: {item.rent_days || 1} วัน</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500 text-lg">{item.rent_price || 0} ฿</p>
                      <button onClick={() => removeFromCart(index)} className="text-xs text-red-400 hover:text-red-600 underline mt-1">ลบออก</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-700">ค่าเช่ารวม:</span>
                  <span className="text-3xl font-bold text-blue-600">{totalPrice} บาท</span>
                </div>
                <button 
                  onClick={() => setIsSlipModalOpen(true)}
                  className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-green-700 transition shadow-md"
                >
                  💳 ยืนยันการจอง / ชำระเงิน
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isSlipModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-xl font-bold text-gray-800">📸 แนบหลักฐานการชำระเงิน</h3>
              <button onClick={() => setIsSlipModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleFinalBooking} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center flex flex-col items-center">
                <p className="text-sm font-bold text-blue-800 mb-1">ยอดโอนรวมทั้งสิ้น (รวมค่าส่ง): <br/>
                   <span className="text-2xl text-red-500 block mt-1">{finalTotalPrice} บาท</span>
                </p>
                <p className="text-xs text-gray-600 mb-3">สแกน QR Code เพื่อชำระเงินผ่าน Mobile Banking</p>
                <div className="w-60 h-60 bg-white p-3 rounded-3xl shadow-md border border-blue-100 flex items-center justify-center">
                  <img src="/qrcode.png" alt="QR Code สำหรับชำระเงิน" className="w-full h-full object-contain" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ - นามสกุล ผู้จอง:</label>
                <input 
                  type="text" 
                  placeholder="กรอกชื่อของคุณ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">อัปโหลดสลิป (บังคับเลือกรูป):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSlipFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 bg-gray-50 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left">
                <label className="block font-bold text-gray-800 mb-2">🚚 เลือกวิธีการจัดส่ง</label>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      value="local" 
                      checked={shippingMethod === "local"} 
                      onChange={(e) => setShippingMethod(e.target.value)}
                    />
                    <span className="text-sm text-gray-700">ส่งด่วนในเชียงใหม่ (รอบ 18:00 น.)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="shippingMethod" 
                      value="upcountry" 
                      checked={shippingMethod === "upcountry"} 
                      onChange={(e) => setShippingMethod(e.target.value)}
                    />
                    <span className="text-sm text-gray-700">ส่งต่างจังหวัด (Flash / Kerry) - <b>ค่าส่ง 50 ฿</b></span>
                  </label>
                </div>

                {/* 🌟 แสดงแผนที่เฉพาะเมื่อเลือกจัดส่งในเชียงใหม่และโหลดบนเบราว์เซอร์แล้ว */}
                {shippingMethod === "local" && isMounted && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                     <label className="block text-sm font-bold text-blue-800 mb-2">
                       📍 ปักหมุดที่อยู่จัดส่งของคุณ
                     </label>
                     <MapPicker onLocationSelect={handleLocationSelect} />
                     
                     {pinLocation ? (
                        <div className="mt-3 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                            ✅ ปักหมุดเรียบร้อย!<br/> 
                            ระยะทางจากร้าน: <b>{distance} กิโลเมตร</b><br/>
                            <span className="text-red-500 font-bold mt-1 block">ค่าจัดส่ง: {shippingCost} บาท</span>
                        </div>
                     ) : (
                        <p className="mt-2 text-xs text-red-500 font-semibold">* กรุณาคลิกเลือกตำแหน่งบนแผนที่</p>
                     )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    {shippingMethod === 'local' ? '📍 พิมพ์รายละเอียดเพิ่มเติม (เช่น บ้านเลขที่, จุดสังเกต)' : '📍 ระบุที่อยู่จัดส่งต่างจังหวัด'}
                  </label>
                  <textarea
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={shippingMethod === 'local' ? "เช่น ถนนนิมมาน ซอย 1, บ้านเลขที่..." : "บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="w-1/2 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-300 transition"
                >
                  ย้อนกลับ
                </button>
                <button 
                  type="submit"
                  disabled={loading || !isReadyToSubmit}
                  className="w-1/2 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังบันทึก..." : "✅ ยืนยันการจอง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}