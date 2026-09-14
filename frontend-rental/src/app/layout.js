import "./globals.css";
import { CartProvider } from "./CartContext";
import Navbar from "./Navbar";

export const metadata = {
  title: "ร้านเช่าชุดสไตล์คุณ",
  description: "ระบบจองและเช่าชุดออนไลน์",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-800">
        {/* เอาโกดังมาครอบเว็บทั้งหมดไว้ */}
        <CartProvider>
          {/* เอาเมนู Navbar มาวาง */}
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}