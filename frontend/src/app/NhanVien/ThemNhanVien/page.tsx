"use client";
import React, { useState } from "react";
import AdminLayout from "../../../component/Admin-Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import { FaSave, FaTimes } from "react-icons/fa";
import { useEffect } from 'react';

registerLocale("vi", vi);

export default function ThemNhanVienPage() {
    const [addForm, setAddForm] = useState({
        maNhanVien: "",
        tenNhanVien: "",
        email: "",
        soDienThoai: "",
        gioiTinh: "Nam",
        ngaySinh: "",
        diaChi: "",
        trangThai: "Hoạt động"
    });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState({
        maNhanVien: "",
        tenNhanVien: "",
        email: "",
        soDienThoai: "",
        ngaySinh: "",
        diaChi: "",
        chung: ""
    });
    const [successToast, setSuccessToast] = useState("");
    const [addressData, setAddressData] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<any>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
    const [selectedWard, setSelectedWard] = useState<any>(null);
    const [ngoNgach, setNgoNgach] = useState("");

    useEffect(() => {
        fetch('/vn-address.json')
            .then(res => res.json())
            .then(data => {
                // Nếu có key 'results' thì lấy ra mảng bên trong
                const arr = Array.isArray(data.results) ? data.results : [];
                setAddressData(arr);
            })
            .catch(() => setAddressData([]));
    }, []);

    // Lấy danh sách tỉnh/thành
    const provinces = addressData;
    // Lấy danh sách quận/huyện theo tỉnh đã chọn
    const districts = selectedProvince ? selectedProvince.districts : [];
    // Lấy danh sách xã/phường theo quận/huyện đã chọn
    const wards = selectedDistrict ? selectedDistrict.wards : [];

    const handleAddNhanVien = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError({
            maNhanVien: "",
            tenNhanVien: "",
            email: "",
            soDienThoai: "",
            ngaySinh: "",
            diaChi: "",
            chung: ""
        });
        let hasError = false;
        let newError = {
            maNhanVien: "",
            tenNhanVien: "",
            email: "",
            soDienThoai: "",
            ngaySinh: "",
            diaChi: "",
            chung: ""
        };
        // Validate số điện thoại phải bắt đầu bằng 0 và có ít nhất 10 số
        if (!/^0\d{9,}$/.test(addForm.soDienThoai)) {
            newError.soDienThoai = "Số điện thoại phải bắt đầu bằng số 0 và có ít nhất 10 chữ số";
            hasError = true;
        }
        // Validate mã NV không chứa dấu cách hoặc ký tự có dấu
        if (/\s/.test(addForm.maNhanVien)) {
            newError.maNhanVien = "Mã nhân viên không được chứa dấu cách";
            hasError = true;
        } else if (/[^^\x00-\x7F]/.test(addForm.maNhanVien)) {
            newError.maNhanVien = "Mã nhân viên không được chứa ký tự có dấu";
            hasError = true;
        }
        // Validate ngày sinh phải đủ 15 tuổi trở lên
        if (addForm.ngaySinh) {
            const dob = new Date(addForm.ngaySinh);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            if (age < 15) {
                newError.ngaySinh = "Nhân viên phải đủ 15 tuổi trở lên";
                hasError = true;
            }
        }
        // Validate họ tên không được để trống
        if (!addForm.tenNhanVien.trim()) {
            newError.tenNhanVien = "Họ và tên không được để trống";
            hasError = true;
        }
        // Validate email không được để trống
        if (!addForm.email.trim()) {
            newError.email = "Email không được để trống";
            hasError = true;
        }
        // Validate địa chỉ không được để trống (dựa trên các trường mới)
        if (!selectedProvince || !selectedDistrict || !selectedWard) {
            newError.diaChi = "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Xã/Phường";
            hasError = true;
        }
        if (hasError) {
            setAddError(newError);
            return;
        }
        setAddLoading(true);
        try {
            // Ghép địa chỉ
            const diaChiDayDu = `${ngoNgach ? ngoNgach + ', ' : ''}${selectedWard.ward_name}, ${selectedDistrict.district_name}, ${selectedProvince.province_name}`;
            let body: any = { ...addForm, gioiTinh: addForm.gioiTinh === "Nam", diaChi: diaChiDayDu };
            let fetchOptions: any = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            };
            const res = await fetch("http://localhost:8080/nhan-vien/them", fetchOptions);
            const data = await res.json();
            if (data.success) {
                setSuccessToast("Thêm nhân viên thành công!");
                setTimeout(() => {
                    window.location.href = "/NhanVien/HienThi";
                }, 800);
            } else {
                if (data.message && data.message.toLowerCase().includes('số điện thoại')) {
                    setAddError(prev => ({ ...prev, soDienThoai: data.message }));
                } else if (data.message && data.message.toLowerCase().includes('email')) {
                    setAddError(prev => ({ ...prev, email: data.message }));
                } else if (data.message && data.message.toLowerCase().includes('mã nhân viên')) {
                    setAddError(prev => ({ ...prev, maNhanVien: data.message }));
                } else {
                    setAddError(prev => ({ ...prev, chung: data.message || "Có lỗi xảy ra" }));
                }
            }
        } catch (err) {
            setAddError(prev => ({ ...prev, chung: "Không thể kết nối server" }));
        }
        setAddLoading(false);
    };

    return (
        <AdminLayout activeMenu="employees" pageTitle="Quản lý nhân viên" onMenuChangeAction={() => {}}>
            <div style={{
                maxWidth: 1100,
                margin: "40px auto",
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px #0002",
                padding: 32
            }}>
                <h2 style={{ textAlign: "center", color: "black", fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
                    Thêm nhân viên
                </h2>
                <form onSubmit={handleAddNhanVien}>
                    <div style={{ display: 'flex', gap: 32 }}>
                        {/* Cột trái */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label>Mã nhân viên *</label>
                                <input required placeholder="Nhập mã nhân viên" value={addForm.maNhanVien} onChange={e => setAddForm(f => ({ ...f, maNhanVien: e.target.value }))} style={{ width: "100%", padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", marginBottom: 4, background: '#fff', color: '#222' }} />
                                {addError.maNhanVien && <div style={{ color: "red", marginTop: 2, marginBottom: 2 }}>{addError.maNhanVien}</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Tên nhân viên *</label>
                                <input required placeholder="Nhập họ và tên" value={addForm.tenNhanVien} onChange={e => setAddForm(f => ({ ...f, tenNhanVien: e.target.value }))} style={{ width: "100%", padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", marginBottom: 4, background: '#fff', color: '#222' }} />
                                {addError.tenNhanVien && <div style={{ color: "red", marginTop: 2, marginBottom: 2 }}>{addError.tenNhanVien}</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label>Ngày sinh *</label>
                                    <DatePicker
                                        selected={addForm.ngaySinh ? new Date(addForm.ngaySinh) : null}
                                        onChange={date => setAddForm(f => ({
                                            ...f,
                                            ngaySinh: date
                                                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                                : ""
                                        }))}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Chọn ngày sinh"
                                        className="custom-datepicker-input"
                                        required
                                        showMonthDropdown
                                        showYearDropdown
                                        scrollableYearDropdown
                                        yearDropdownItemNumber={new Date().getFullYear() - 1970 + 1}
                                        minDate={new Date(1970, 0, 1)}
                                        maxDate={new Date()}
                                        wrapperClassName="custom-datepicker-wrapper"
                                        locale="vi"
                                    />
                                {addError.ngaySinh && <div style={{ color: "red", marginTop: 2, marginBottom: 2 }}>{addError.ngaySinh}</div>}
                                </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Giới tính *</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 4, height: 38 }}>
                                    <label className="custom-radio"><input type="radio" className="gender-radio" checked={addForm.gioiTinh === "Nam"} onChange={() => setAddForm(f => ({ ...f, gioiTinh: "Nam" }))} /><span className="checkmark"></span> Nam</label>
                                    <label className="custom-radio"><input type="radio" className="gender-radio" checked={addForm.gioiTinh === "Nữ"} onChange={() => setAddForm(f => ({ ...f, gioiTinh: "Nữ" }))} /><span className="checkmark"></span> Nữ</label>
                                </div>
                            </div>
                        </div>
                        {/* Cột phải */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Email *</label>
                                <input required type="email" placeholder="Nhập email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", marginBottom: 4, background: '#fff', color: '#222' }} />
                                {addError.email && <div style={{ color: "red", marginTop: 2, marginBottom: 2 }}>{addError.email}</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Số điện thoại *</label>
                                <input required placeholder="Số điện thoại" value={addForm.soDienThoai} onChange={e => setAddForm(f => ({ ...f, soDienThoai: e.target.value }))} style={{ width: "100%", padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", marginBottom: 4, background: '#fff', color: '#222' }} />
                                {addError.soDienThoai && <div style={{ color: "red", marginTop: 2, marginBottom: 2 }}>{addError.soDienThoai}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Tỉnh thành *</label>
                                    <select value={selectedProvince?.province_id || ''} onChange={e => {
                                        const p = provinces.find((p: any) => p.province_id === e.target.value);
                                        setSelectedProvince(p);
                                        setSelectedDistrict(null);
                                        setSelectedWard(null);
                                    }} style={{ width: '100%', padding: 9, borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={provinces.length === 0}>
                                        <option value="">{provinces.length === 0 ? 'Đang tải...' : 'Chọn tỉnh/thành'}</option>
                                        {provinces.map((p: any) => (
                                            <option key={String(p.province_id)} value={p.province_id}>{p.province_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Quận, huyện *</label>
                                    <select value={selectedDistrict?.district_id || ''} onChange={e => {
                                        const d = districts.find((d: any) => d.district_id === e.target.value);
                                        setSelectedDistrict(d);
                                        setSelectedWard(null);
                                    }} style={{ width: '100%', padding: 9, borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={!selectedProvince || districts.length === 0}>
                                        <option value="">{districts.length === 0 ? 'Chọn tỉnh/thành trước' : 'Chọn quận/huyện'}</option>
                                        {districts.map((d: any) => (
                                            <option key={String(d.district_id)} value={d.district_id}>{d.district_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Xã *</label>
                                    <select value={selectedWard?.ward_id || ''} onChange={e => {
                                        const w = wards.find((w: any) => w.ward_id === e.target.value);
                                        setSelectedWard(w);
                                    }} style={{ width: '100%', padding: 9, borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={!selectedDistrict || wards.length === 0}>
                                        <option value="">{wards.length === 0 ? 'Chọn quận/huyện trước' : 'Chọn phường/xã'}</option>
                                        {wards.map((w: any) => (
                                            <option key={String(w.ward_id)} value={w.ward_id}>{w.ward_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Ngõ</label>
                                    <input placeholder="Nhập ngõ/ngách" value={ngoNgach} onChange={e => setNgoNgach(e.target.value)} style={{ width: '100%', padding: 9, borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} />
                                </div>
                            </div>
                            {addError.diaChi && <div style={{ color: "red", marginTop: 2, marginBottom: 8 }}>{addError.diaChi}</div>}
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                                <button type="button" onClick={() => window.location.href = "/NhanVien/HienThi"} style={{ background: "#fff", color: "#888", border: "1.5px solid #bbb", borderRadius: 7, padding: "10px 22px", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                    <FaTimes style={{ fontSize: 18, color: "#888" }} /> Hủy
                                </button>
                                <button type="submit" disabled={addLoading} style={{ background: "#b59d3a", color: "#fff", border: "none", borderRadius: 7, padding: "10px 22px", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 6, cursor: addLoading ? "not-allowed" : "pointer" }}>
                                    <span style={{ fontSize: 20, fontWeight: 700, marginRight: 6 }}>+</span>
                                    {addLoading ? "Đang thêm..." : "Thêm nhân viên"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                {successToast && (
                    <div style={{ position: 'fixed', top: 30, right: 30, zIndex: 2000, background: '#2ecc40', color: '#fff', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16, boxShadow: '0 2px 12px #0002', minWidth: 220, textAlign: 'center' }}>
                        {successToast}
                    </div>
                )}
                {addError.chung && <div style={{ color: "red", marginTop: 10 }}>{addError.chung}</div>}
            </div>
        </AdminLayout>
    );
} 