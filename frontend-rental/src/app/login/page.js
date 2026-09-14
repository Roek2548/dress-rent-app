"use client";

import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🌟 เพิ่มตัวแปรสำหรับจัดการแท็บ ('customer' หรือ 'admin')
  const [activeTab, setActiveTab] = useState('customer'); 
  
  const router = useRouter();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // สำหรับแอดมิน อาจจะเช็คเงื่อนไขแยก หรือล็อกอินปกติ
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } else {
      alert(`เข้าสู่ระบบ${activeTab === 'admin' ? 'แอดมิน' : ''}สำเร็จ!`);
      // ถ้าเป็นแอดมินให้ไปหน้า dashboard ถ้าเป็นลูกค้าไปหน้าแรก
      if (activeTab === 'admin') {
        router.push('/admin'); 
      } else {
        router.push('/'); 
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Google Login Error: " + error.message);
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
    if (error) alert("Facebook Login Error: " + error.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        
        {/* 🌟 แถบเมนู Tabs ด้านบน */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <button 
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex-1 py-4 text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'customer' 
                ? 'font-bold text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'font-medium text-gray-500 hover:bg-gray-100'
            }`}
          >
            🛍️ สำหรับลูกค้า
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-4 text-sm flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'admin' 
                ? 'font-bold text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'font-medium text-gray-500 hover:bg-gray-100'
            }`}
          >
            📊 สำหรับผู้ดูแลร้าน
          </button>
        </div>

        <div className="p-8 pb-6">
          <div className="text-center mb-6">
            <span className="text-4xl inline-block mb-2">
              {activeTab === 'admin' ? '🔐' : '👋'}
            </span>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'admin' ? 'ระบบจัดการหลังบ้าน' : 'เข้าสู่ระบบสมาชิก'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'admin' ? 'กรุณาเข้าสู่ระบบเพื่อจัดการร้านค้า' : 'เข้าสู่ระบบเพื่อรับสิทธิพิเศษและดูประวัติการเช่าชุด'}
            </p>
          </div>

          {/* 🌟 ปุ่ม Social Login (โชว์เฉพาะหน้าลูกค้า) */}
          {activeTab === 'customer' && (
            <>
              <div className="space-y-3">
                <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 p-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  เข้าสู่ระบบด้วย Google
                </button>
                <button type="button" onClick={handleFacebookLogin} className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white p-2.5 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm">
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5 brightness-0 invert" />
                  เข้าสู่ระบบด้วย Facebook
                </button>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-400 font-medium">หรือใช้อีเมล</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </>
          )}

          {/* ฟอร์มล็อกอินด้วยอีเมล (ใช้ร่วมกันทั้งลูกค้าและแอดมิน) */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === 'admin' ? "admin@shop.com" : "user@email.com"}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 shadow-md disabled:opacity-50 ${
                activeTab === 'admin' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        {/* 🌟 ลิงก์ไปหน้าสมัครสมาชิก (โชว์เฉพาะหน้าลูกค้า) */}
        {activeTab === 'customer' && (
          <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
            <p className="text-sm text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <a href="/register" className="text-blue-600 font-bold hover:underline cursor-pointer">
                สมัครสมาชิกเลย
              </a>
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}