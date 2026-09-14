"use client";
import { createContext, useState, useContext } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (cloth) => {
    // 🛡️ เช็คว่ามีชุดนี้ในตะกร้า และ "ช่วงวันที่เลือก" ชนกันหรือไม่
    const isConflict = cart.some((item) => {
      if (item.id !== cloth.id) return false; // ถ้าคนละชุดกัน ผ่านไป

      // สูตรเช็คว่าช่วงวันที่ทับซ้อนกันไหม (Conflict Date Logic)
      // (StartA <= EndB) และ (EndA >= StartB)
      const newStart = new Date(cloth.start_date);
      const newEnd = new Date(cloth.end_date);
      const existingStart = new Date(item.start_date);
      const existingEnd = new Date(item.end_date);

      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (isConflict) {
      alert("❌ ชุดนี้มีคิวจองทับซ้อนกับช่วงวันที่อยู่ในตะกร้าของคุณแล้วครับ! กรุณาเลือกช่วงเวลาอื่น");
      return;
    }

    // ถ้าวันไม่ชนกัน (แม้จะเป็นชุดเดียวกัน แต่คนละช่วงวัน) ยอมให้เพิ่มลงตะกร้าได้เลย!
    setCart([...cart, cloth]);
    alert(`🛒 เพิ่มชุด "${cloth.cloth_name}" ลงในตะกร้าเรียบร้อยแล้ว!`);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}