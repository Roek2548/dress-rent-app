"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../supabaseClient";

function ClothCard({ cloth, isAdmin, onDelete }) {
  const clothId = cloth.id || cloth.cloth_id;
  const clothName = cloth.name || cloth.cloth_name || "ไม่มีชื่อชุด";

  const getImageUrl = (path) => {
    if (!path) {
      return "https://via.placeholder.com/300x400?text=No+Image";
    }

    if (path.startsWith("http")) {
      return path;
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
  };

  return (
    <div className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* ปุ่มลบสำหรับ Admin */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(clothId, clothName);
          }}
          className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-red-100 text-lg w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-colors cursor-pointer"
          title="ลบชุดนี้"
        >
          🗑️
        </button>
      )}

      {/* รูปชุด */}
      <Link href={`/cloth/${clothId}`}>
        <div className="cursor-pointer">
          <img
            src={getImageUrl(cloth.image)}
            alt={clothName}
            className="w-full h-80 object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/300x400?text=No+Image";
            }}
          />

          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {clothName}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              สถานะ: {cloth.status || "ว่าง"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloths, setCloths] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Email ที่มีสิทธิ์ Admin
  const adminEmails = ["lailai222@gmail.com"];

  useEffect(() => {
    // =========================
    // ดึงข้อมูล User
    // =========================
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        setIsAdmin(adminEmails.includes(currentUser.email));
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    // =========================
    // ดึงข้อมูลชุด
    // =========================
    const fetchClothes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const res = await fetch(`${apiUrl}/api/cloths`);

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const resData = await res.json();

        setCloths(resData.data || []);
      } catch (err) {
        console.error("Error fetching clothes:", err);
        setCloths([]);
      }
    };

    fetchUser();
    fetchClothes();

    // =========================
    // ตรวจสอบ Login / Logout
    // =========================
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        setIsAdmin(adminEmails.includes(currentUser.email));
      } else {
        setIsAdmin(false);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // Logout
  // =========================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // =========================
  // Delete Cloth
  // =========================
  const handleDeleteCloth = async (clothId, clothName) => {
  const confirmed = window.confirm(
    `⚠️ ต้องการลบชุด "${clothName}" หรือไม่?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${apiUrl}/api/cloths/${clothId}`, {
      method: "DELETE",
    });

    // พยายามอ่านข้อมูลที่ Backend ส่งกลับมา
    let responseData = {};

    try {
      responseData = await res.json();
    } catch (jsonError) {
      console.warn("Backend ไม่ได้ส่ง JSON กลับมา");
    }

    // เช็คว่าสำเร็จ
    if (res.ok && responseData.status !== "error") {
      alert("🗑️ ลบชุดเรียบร้อย");

      // ลบชุดออกจากหน้าจอทันที
      setCloths((prev) =>
        prev.filter((c) => (c.id || c.cloth_id) !== clothId)
      );
    } else {
      // แสดงรายละเอียด Error จาก Backend
      console.error("Backend Error:", responseData);

      const errorMessage =
        responseData.detail ||
        responseData.message ||
        responseData.error ||
        "ถูกปฏิเสธจากฐานข้อมูล";

      alert(`❌ ลบไม่สำเร็จ\n\nสาเหตุ: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Delete error:", error);

    alert(
      "❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์"
    );
  }
};

  // =========================
  // Loading
  // =========================
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">
          กำลังโหลดข้อมูลชุด... 👗
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* =========================
          Content
      ========================= */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {user ? (
          <>


            {/* =========================
                Cloth Grid
            ========================= */}
            {Array.isArray(cloths) && cloths.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {cloths.map((cloth) => (
                  <ClothCard
                    key={cloth.id || cloth.cloth_id}
                    cloth={cloth}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteCloth}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">👗</div>

                <h2 className="text-xl font-semibold text-gray-700">
                  ยังไม่มีชุดในระบบ
                </h2>

                <p className="text-gray-500 mt-2">
                  กรุณาเพิ่มชุดก่อนเริ่มใช้งาน
                </p>
              </div>
            )}
          </>
        ) : (
          /* =========================
             Not Login
          ========================= */
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">🔒</div>

              <h1 className="text-2xl font-bold text-gray-800">
                กรุณาเข้าสู่ระบบ
              </h1>

              <p className="text-gray-500 mt-3 mb-6">
                เข้าสู่ระบบสมาชิกเพื่อดูรายละเอียดและแคตตาล็อกชุดเช่าทั้งหมดของเรา
              </p>

              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                ไปที่หน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}