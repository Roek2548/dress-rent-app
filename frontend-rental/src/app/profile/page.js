'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: 'กำลังโหลด...',
    email: '',
    phone: '-',
    id: '',
    avatarUrl: null
  });

  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // States สำหรับจัดการ Modal แก้ไขข้อมูล
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchRealData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          window.location.href = '/login';
          return;
        }

        const authUser = session.user;
        const avatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
        const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        const phoneNum = authUser.user_metadata?.phone || '';

        setUser({
          name: fullName,
          email: authUser.email,
          phone: phoneNum || 'ยังไม่ได้ระบุเบอร์โทร',
          id: authUser.id,
          avatarUrl: avatar
        });

        setEditName(fullName);
        setEditPhone(phoneNum);

        // ดึงประวัติการเช่าชุดจากตาราง orders ใน Supabase
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', authUser.id);

        if (!orderError && orders) {
          setRentalHistory(orders);
        }

      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          phone: editPhone
        }
      });

      if (error) {
        alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
      } else {
        setUser(prev => ({
          ...prev,
          name: editName,
          phone: editPhone || 'ยังไม่ได้ระบุเบอร์โทร'
        }));
        setIsEditOpen(false);
        alert('อัปเดตข้อมูลส่วนตัวสำเร็จ!');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดบางประการ');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'กำลังใช้งาน': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'คืนชุดแล้ว': return 'bg-green-100 text-green-700 border-green-200';
      case 'จัดเตรียมชุด': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">โปรไฟล์ของฉัน</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-full hover:bg-gray-700 transition duration-150 text-sm font-medium shadow-sm cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* User Information Card */}
        <div className="bg-white shadow-xl shadow-gray-100 rounded-3xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            
            <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-4xl font-bold shrink-0 shadow-inner overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name !== 'กำลังโหลด...' ? user.name.substring(0, 2) : '...'
              )}
            </div>
            
            <div className="flex-grow space-y-4">
                <div className='flex justify-between items-start'>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500 mt-1">รหัสสมาชิก: {user.id ? `${user.id.substring(0, 8)}...` : '-'}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditOpen(true)}
                      className="flex items-center gap-1.5 bg-pink-50 text-pink-700 px-4 py-1.5 rounded-full hover:bg-pink-100 transition text-sm font-medium border border-pink-200 cursor-pointer"
                    >
                      แก้ไขข้อมูล
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-100 pt-4 mt-4">
                    <p className="text-gray-700"><strong className='text-gray-900'>อีเมล:</strong> <span className='font-mono'>{user.email}</span></p>
                    <p className="text-gray-700"><strong className='text-gray-900'>เบอร์โทรศัพท์:</strong> <span className='font-mono'>{user.phone}</span></p>
                </div>
            </div>
          </div>
        </div>

        {/* Rental History Section */}
        <div className="bg-white shadow-xl shadow-gray-100 rounded-3xl p-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">ประวัติการเช่าชุด</h2>
          
          {loading ? (
            <p className="text-center py-10 text-gray-500">กำลังโหลดข้อมูลประวัติการเช่า...</p>
          ) : rentalHistory.length > 0 ? (
            <div className="space-y-5">
              {rentalHistory.map((order) => (
                <div key={order.id} className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-pink-100 transition hover:shadow-md">
                  <div className='flex-grow'>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900 text-lg">{order.dressName}</p>
                      <span className={`px-3 py-0.5 border text-sm rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-mono mt-1">เลขที่คำสั่งซื้อ: {order.id}</p>
                    <p className="text-gray-600 mt-3">ระยะเวลา: <span className='font-medium text-gray-800'>{order.date}</span></p>
                  </div>
                  
                  <button className="shrink-0 text-pink-700 font-medium text-sm hover:text-pink-900 border border-pink-200 px-5 py-2.5 rounded-xl hover:bg-pink-50 transition cursor-pointer">
                      ดูรายละเอียด
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-lg font-medium text-gray-600">ยังไม่มีประวัติการเช่าชุด</p>
            </div>
          )}
        </div>
        
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">แก้ไขข้อมูลส่วนตัว</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="เช่น 0891234567"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">อีเมล (ไม่สามารถเปลี่ยนได้)</label>
                <input 
                  type="text" 
                  value={user.email} 
                  disabled 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-medium hover:bg-pink-700 transition cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}