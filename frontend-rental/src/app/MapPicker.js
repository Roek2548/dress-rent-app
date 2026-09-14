"use client";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
// 🌟 นำเข้าระบบค้นหาและ CSS ของมัน
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// 🔧 แก้ปัญหาหมุดไม่โหลด
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SHOP_LOCATION = [18.876016, 99.010307];

export default function MapPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  // 🌟 ฟังก์ชันสร้าง "กล่องค้นหา" บนแผนที่
  function SearchField() {
    const map = useMap();

    useEffect(() => {
      const provider = new OpenStreetMapProvider();
      
      const searchControl = new GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: false, 
        showPopup: false,
        autoClose: true, 
        
        // 🚨 จุดสำคัญที่แก้บั๊กจอแดงคือบรรทัดนี้ครับ! 🚨
        retainZoomLevel: true, // เปลี่ยนเป็น true เพื่อสั่งห้ามมันใช้ระบบ fitBounds โดยเด็ดขาด
        
        animateZoom: true,
        keepResult: true,
        searchLabel: 'ค้นหาสถานที่, ถนน, หมู่บ้าน...',
      });

      map.addControl(searchControl);

      // เมื่อลูกค้าค้นหาเจอและกดเลือกสถานที่
      map.on('geosearch/showlocation', (e) => {
        const { x, y } = e.location; 
        const latlng = { lat: y, lng: x };
        setPosition(latlng); 
        
        // 🌟 เรามาสั่งให้มันบินไปที่พิกัด และซูมระดับ 16 ด้วยโค้ดของเราเองตรงนี้แทนครับ
        map.flyTo(latlng, 16); 

        if (onLocationSelect) {
          onLocationSelect(latlng); 
        }
      });

      return () => {
        if (map && searchControl) {
           map.removeControl(searchControl);
        }
      };
    }, [map]);

    return null;
  }

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        if (onLocationSelect) {
          onLocationSelect(e.latlng);
        }
      },
    });

    return position === null ? null : <Marker position={position}></Marker>;
  }

  return (
    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm relative z-0">
      <MapContainer 
        center={SHOP_LOCATION} 
        zoom={13} 
        style={{ height: "350px", width: "100%" }} 
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        <Marker position={SHOP_LOCATION} opacity={0.5} /> 
        <SearchField />
        <LocationMarker />
      </MapContainer>
    </div>
  );
}