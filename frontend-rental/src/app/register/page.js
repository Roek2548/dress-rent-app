"use client"; // จำเป็นต้องใส่ถ้าใช้ Next.js App Router

import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // ปรับ path ให้ตรงกับไฟล์ที่คุณสร้าง

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 🌟 ฟังก์ชันสมัครสมาชิกด้วย Email/Password
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // เก็บชื่อลงในฐานข้อมูลด้วย
        }
      }
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'สมัครสำเร็จ! กรุณาเช็คอีเมลเพื่อยืนยันตัวตน' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        
        <div className="p-8 pb-6">
          <div className="text-center mb-6">
            <span className="text-4xl inline-block mb-2">✨</span>
            <h2 className="text-2xl font-bold text-gray-800">สมัครสมาชิกใหม่</h2>
          </div>

          {/* แจ้งเตือนสถานะ */}
          {message.text && (
            <div className={`p-3 mb-4 text-sm rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}

          {/* 🌟 ฟอร์มสมัครสมาชิก (ผูกฟังก์ชัน onSubmit แล้ว) */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
                minLength="6"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 shadow-md disabled:opacity-50"
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>
        </div>
{/* ... (โค้ดฟอร์มสมัครสมาชิกด้านบน) ... */}
        
        {/* 🌟 เพิ่มส่วนนี้กลับเข้าไปใต้ฟอร์ม */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center mt-6">
          <p className="text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{' '}
            <a href="/login" className="text-blue-600 font-bold hover:underline cursor-pointer">
              เข้าสู่ระบบเลย
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}