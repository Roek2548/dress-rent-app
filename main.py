from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles 
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import time # 🌟 เพิ่ม time สำหรับตั้งชื่อไฟล์ไม่ให้ซ้ำกัน
from dotenv import load_dotenv
from typing import List
from datetime import date

# โหลดค่าลับจากไฟล์ .env
load_dotenv(override=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("--- URL ที่ระบบใช้ตอนนี้คือ:", SUPABASE_URL)

# สร้างตัวเชื่อมต่อกับ Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Dress Rental API")

# (โฟลเดอร์ uploads ไม่จำเป็นแล้วบน Server จริง แต่คงไว้เผื่อทดสอบ)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==========================================
# ตั้งค่า CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API ระบบเช่าชุดเชื่อมต่อสำเร็จแล้ว!"}

@app.get("/api/cloths")
def get_all_cloths():
    try:
        response = supabase.table("cloth").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cloth/{id}")
def get_cloth_by_id(id: int):
    try:
        response = supabase.table("cloth").select("*").eq("cloth_id", id).execute()
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="ไม่พบข้อมูลชุดนี้")
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cloths/{cloth_id}/stock")
def get_cloth_stock(cloth_id: int):
    try:
        response = supabase.table("cloth_item").select("*, size(size_name)").eq("cloth_id", cloth_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CartRequest(BaseModel):
    user_id: str
    item_id: int
    start_date: str
    end_date: str
    total_days: int
    price_per_day: int

@app.post("/api/cart")
def add_to_cart(cart: CartRequest):
    try:
        cart_data = {
            "user_id": cart.user_id,
            "item_id": cart.item_id,
            "start_date": cart.start_date,
            "end_date": cart.end_date,
            "total_days": cart.total_days,
            "price_per_day": cart.price_per_day
        }
        response = supabase.table("cart").insert(cart_data).execute()
        return {"status": "success", "message": "เพิ่มสินค้าลงตะกร้าสำเร็จ!", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart/{user_id}")
def get_user_cart(user_id: str):
    try:
        query = "*, cloth_item(*, cloth(*), size(*))"
        response = supabase.table("cart").select(query).eq("user_id", user_id).execute()
        if not response.data:
            return {"status": "success", "message": "ตะกร้าสินค้าว่างเปล่า", "data": []}
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CheckoutRequest(BaseModel):
    user_id: str
    slip_image: str = ""

@app.post("/api/checkout")
def checkout_cart(req: CheckoutRequest):
    try:
        cart_response = supabase.table("cart").select("*").eq("user_id", req.user_id).execute()
        cart_items = cart_response.data
        if not cart_items:
            raise HTTPException(status_code=400, detail="ตะกร้าสินค้าว่างเปล่า ไม่สามารถชำระเงินได้")

        total_price = sum(item['price_per_day'] * item['total_days'] for item in cart_items)

        rental_data = {
            "user_id": req.user_id,
            "total_price": total_price,
            "status": "pending",
            "slip_image": req.slip_image
        }
        rental_res = supabase.table("rental").insert(rental_data).execute()
        new_rental_id = rental_res.data[0]['rental_id']

        rental_items_data = []
        for item in cart_items:
            rental_items_data.append({
                "rental_id": new_rental_id,
                "item_id": item['item_id'],
                "price_per_day": item['price_per_day'],
                "days": item['total_days'],
                "start_date": item['start_date'],
                "end_date": item['end_date'],
                "total_days": item['total_days']
            })
        supabase.table("rental_item").insert(rental_items_data).execute()
        supabase.table("cart").delete().eq("user_id", req.user_id).execute()

        return {
            "status": "success", 
            "message": "สร้างรายการเช่าสำเร็จ!", 
            "rental_id": new_rental_id,
            "total_price": total_price
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rentals/{user_id}")
def get_user_rentals(user_id: str):
    try:
        query = "*, rental_item(*, cloth_item(*, cloth(*), size(*)))"
        response = supabase.table("rental").select(query).eq("user_id", user_id).order("created_at", desc=True).execute()
        if not response.data:
            return {"status": "success", "message": "ยังไม่มีประวัติการเช่า", "data": []}
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/rentals")
def get_all_rentals_for_admin():
    try:
        query = "*, rental_item(*, cloth_item(*, cloth(*), size(*)))"
        response = supabase.table("rental").select(query).order("created_at", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateStatusRequest(BaseModel):
    status: str

@app.put("/api/admin/rentals/{rental_id}/status")
def update_rental_status(rental_id: int, req: UpdateStatusRequest):
    try:
        response = supabase.table("rental").update({"status": req.status}).eq("rental_id", rental_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="ไม่พบบิลหมายเลขนี้ในระบบ")
        return {
            "status": "success", 
            "message": f"อัปเดตสถานะบิลหมายเลข {rental_id} เป็น '{req.status}' สำเร็จ!", 
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UserCredentials(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
def register_user(user: UserCredentials):
    try:
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        return {
            "status": "success", 
            "message": "สมัครสมาชิกสำเร็จ!", 
            "user_id": res.user.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ไม่สามารถสมัครสมาชิกได้: {str(e)}")

@app.post("/api/auth/login")
def login_user(user: UserCredentials):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {
            "status": "success", 
            "message": "เข้าสู่ระบบสำเร็จ!", 
            "user_id": res.user.id,
            "access_token": res.session.access_token
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

class SocialLoginRequest(BaseModel):
    provider: str

@app.post("/api/auth/social")
def login_social(req: SocialLoginRequest):
    try:
        valid_providers = ["google", "facebook"]
        if req.provider.lower() not in valid_providers:
            raise HTTPException(status_code=400, detail="ตอนนี้ระบบรองรับแค่ google และ facebook ครับ")
        
        res = supabase.auth.sign_in_with_oauth({
            "provider": req.provider.lower(),
            "options": {
                "redirect_to": "http://localhost:8000/docs" 
            }
        })
        return {
            "status": "success", 
            "message": f"สร้างลิงก์สำหรับเข้าสู่ระบบด้วย {req.provider} สำเร็จ!", 
            "login_url": res.url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClothCreateRequest(BaseModel):
    cloth_name: str
    catagory_id: int
    price_1_day: int
    price_2_days: int
    price_3_days: int
    image: str = "" 
    status: str = "ว่าง" 

@app.post("/api/admin/cloth")
def create_cloth(req: ClothCreateRequest):
    try:
        new_cloth_data = {
            "cloth_name": req.cloth_name,
            "catagory_id": req.catagory_id,
            "price_1_day": req.price_1_day,
            "price_2_days": req.price_2_days,
            "price_3_days": req.price_3_days,
            "image": req.image,
            "status": req.status
        }
        response = supabase.table("cloth").insert(new_cloth_data).execute()
        return {
            "status": "success", 
            "message": f"เพิ่มชุด '{req.cloth_name}' เข้าร้านสำเร็จ!", 
            "data": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 🌟 API บันทึกการจองพร้อมอัปโหลดสลิปขึ้น Supabase Storage (ถัง qrcode)
# ==========================================
@app.post("/api/booking")
async def create_booking(
    cloth_ids: str = Form(...),     
    start_dates: str = Form(...),   
    end_dates: str = Form(...),     
    total_prices: str = Form(...),  
    customer_name: str = Form(...), 
    slip_image: UploadFile = File(...),
    shipping_method: str = Form(""),
    address: str = Form(""),
    shipping_cost: int = Form(0) 
):
    try:
        # 1. อ่านไฟล์รูปและอัปโหลดขึ้น Supabase Storage
        file_bytes = await slip_image.read()
        file_ext = slip_image.filename.split(".")[-1]
        file_name = f"slip_{int(time.time())}.{file_ext}"

        supabase.storage.from_("qrcode").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": slip_image.content_type}
        )
        
        # 2. ดึง Public URL ของสลิปเพื่อเซฟลงตาราง
        public_url = supabase.storage.from_("qrcode").get_public_url(file_name)

        c_ids = [int(x) for x in cloth_ids.split(",")]
        s_dates = start_dates.split(",")
        e_dates = end_dates.split(",")
        t_prices = [int(x) for x in total_prices.split(",")]

        booked_results = []

        # 3. บันทึกลงตาราง booking
        for i in range(len(c_ids)):
            booking_data = {
                "cloth_id": c_ids[i],
                "start_date": s_dates[i],
                "end_date": e_dates[i],
                "customer_name": customer_name,
                "total_price": t_prices[i],
                "slip_url": public_url,  # 🌟 ใช้ URL จริงบนฟ้าแทนพาธในเครื่อง
                "status": "รอดำเนินการ",
                "shipping_method": shipping_method,
                "address": address,
                "shipping_cost": shipping_cost,
                "shipping_status": "รอดำเนินการ" if shipping_method else None
            }
            response = supabase.table("booking").insert(booking_data).execute()
            booked_results.append(response.data[0])

        return {
            "status": "success",
            "message": "จองชุดและอัปโหลดสลิปสำเร็จเรียบร้อย!",
            "slip_url": public_url, 
            "data": booked_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/check-availability")
def check_availability(cloth_id: int, start_date: str, end_date: str):
    try:
        response = supabase.table("booking").select("*").eq("cloth_id", cloth_id).execute()
        new_start = date.fromisoformat(start_date)
        new_end = date.fromisoformat(end_date)
        
        for book in response.data:
            booked_start = date.fromisoformat(book["start_date"])
            booked_end = date.fromisoformat(book["end_date"])
            if new_start <= booked_end and new_end >= booked_start:
                return {"status": "booked", "message": "ชุดนี้ถูกจองไปแล้วในช่วงเวลานี้"}
                
        return {"status": "available", "message": "ชุดว่าง สามารถจองได้"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bookings")
def get_all_bookings():
    try:
        response = supabase.table("booking").select("*").order("id", desc=True).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StatusUpdate(BaseModel):
    status: str

@app.put("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: int, data: StatusUpdate):
    try:
        supabase.table("booking").update({"status": data.status}).eq("id", booking_id).execute()
        return {"status": "success", "message": "อัปเดตสถานะสำเร็จ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: int):
    try:
        supabase.table("booking").delete().eq("id", booking_id).execute()
        return {"status": "success", "message": "ลบออเดอร์สำเร็จ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 🌟 API สำหรับเพิ่มชุดใหม่พร้อมอัปโหลดรูปชุดขึ้น Supabase Storage (ถัง cloth)
# ==========================================
@app.post("/api/cloths")
async def add_new_cloth(
    name: str = Form(...),
    category_id: int = Form(...), 
    price_1_day: int = Form(...),
    price_2_days: int = Form(...),
    price_3_days: int = Form(...),
    status: str = Form("ว่าง"),
    images: List[UploadFile] = File(...)
):
    try:
        saved_urls = []
        
        # 1. วนลูปอัปโหลดรูปขึ้น Supabase
        for img in images[:4]: 
            file_bytes = await img.read()
            file_ext = img.filename.split(".")[-1]
            file_name = f"{int(time.time())}_{img.filename}"
            
            supabase.storage.from_("cloth").upload(
                path=file_name,
                file=file_bytes,
                file_options={"content-type": img.content_type}
            )
            
            # ดึง URL รูปล่าสุด
            public_url = supabase.storage.from_("cloth").get_public_url(file_name)
            saved_urls.append(public_url)
            
        # 2. บันทึกข้อมูลและ URL รูปลงตาราง
        cloth_data = {
            "cloth_name": name,
            "catagory_id": category_id,
            "price_1_day": price_1_day,
            "price_2_days": price_2_days,
            "price_3_days": price_3_days,
            "status": status,
            "image": saved_urls[0] if len(saved_urls) > 0 else None,
            "image_2": saved_urls[1] if len(saved_urls) > 1 else None,
            "image_3": saved_urls[2] if len(saved_urls) > 2 else None,
            "image_4": saved_urls[3] if len(saved_urls) > 3 else None,
        }
        
        response = supabase.table("cloth").insert(cloth_data).execute()
        return {"status": "success", "message": "เพิ่มชุดใหม่สำเร็จ", "data": response.data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
def get_categories():
    try:
        res = supabase.table("categories").select("*").execute() 
        return {"status": "success", "data": res.data}
    except Exception as e:
        return {"status": "error", "detail": str(e)}