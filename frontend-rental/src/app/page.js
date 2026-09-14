"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from '../supabaseClient';
// ==========================================
// 1. คอมโพเนนต์ สำหรับการ์ดแต่ละใบ
// ==========================================
function ClothCard({ cloth }) {
  const clothId = cloth.id || cloth.cloth_id; 

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/300x400?text=No+Image";
    if (path.startsWith("http")) return path; 
    return `${process.env.NEXT_PUBLIC_API_URL}/${path}`; 
  };

  return (
    // 🌟 1. เอา <Link> มาคลุมกล่องทั้งหมด เพื่อให้คลิกได้ทั้งการ์ด
    <Link href={`/cloth/${clothId}`} className="block group cursor-pointer">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-white/50 flex flex-col">
        
        {/* 🌟 2. ส่วนรูปภาพ (ปรับสัดส่วนรูปภาพให้กระชับขึ้น) */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-stone-100">
          <img
            src={getImageUrl(cloth.image || cloth.image_url)}
            alt={cloth.name || cloth.cloth_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* 🌟 3. ส่วนข้อมูลด้านล่าง (เอาช่องว่างที่ห่างเกินไปออก) */}
        <div className="p-6 text-center bg-white">
          <h2 className="text-lg font-medium tracking-wide text-stone-800 mb-3 group-hover:text-stone-500 transition-colors">
            {cloth.name || cloth.cloth_name}
          </h2>
          <div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider inline-block shadow-sm ${
              cloth.status === 'ว่าง'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              สถานะ: {cloth.status || "ว่าง"}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}

// ==========================================
// 2. หน้าหลักของเว็บ (หน้าแคตตาล็อก)
// ==========================================
export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloths, setCloths] = useState([]);

  useEffect(() => {
    // 1. ดึงข้อมูลผู้ใช้จาก Supabase Session
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    fetchUser();

    // 2. ดึงข้อมูลชุดเช่าจาก Backend Python
    const fetchClothes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cloths`);
        const resData = await res.json();
        setCloths(resData.data || []);
      } catch (err) {
        console.error("Error fetching clothes:", err);
      }
    };
    fetchClothes();

    // 3. ระบบคอยฟังการ Login / Logout แบบ Realtime
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
  // 🌟 สิ้นสุดส่วนที่ต้องก๊อปปี้
  return (

    // เปลี่ยนจาก: <div className="min-h-screen bg-gray-50">
  <div className="min-h-screen bg-[#fae8e3] text-stone-800">

{/* ส่วนหัวข้อ (เปลี่ยนจากตัวหนังสือเป็นรูปภาพ) */}
        <div className="w-full mb-12">
          <img 
            src="/banner.png" 
            alt="Rental Style Flow Banner" 
            className="w-full h-auto object-cover"
          />
        </div>
        
{loading ? (
        <div className="text-center py-20 text-xl text-gray-500 font-bold animate-pulse">
          กำลังโหลดข้อมูลชุด... 👗
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 pb-20">
          
          {user ? (
            // 🔓 ถ้าล็อกอินแล้ว: โชว์ Grid ชุดเช่าตามปกติ
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {Array.isArray(cloths) && cloths.map((cloth, index) => (
  <ClothCard key={cloth.id || cloth.cloth_id || index} cloth={cloth} />
))}
            </div>
          ) : (
            // 🔒 ถ้ายังไม่ได้ล็อกอิน: โชว์กล่องแม่กุญแจให้ไปเข้าสู่ระบบ
            <div className="flex flex-col items-center justify-center py-20 bg-white/80 rounded-3xl border border-pink-100 shadow-sm mt-6 backdrop-blur-sm">
              <span className="text-6xl mb-4">🔒</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                กรุณาเข้าสู่ระบบ
              </h3>
              <p className="text-gray-500 mb-6">
                เข้าสู่ระบบสมาชิกเพื่อดูรายละเอียดและแคตตาล็อกชุดเช่าทั้งหมดของเรา
              </p>
              <Link 
                href="/login" 
                className="bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-full font-bold shadow-md transition-all hover:scale-105"
              >
                ไปที่หน้าเข้าสู่ระบบ
              </Link>
            </div>
          )}

        </div>
      )}
      </div>
  );
}