"use client";
import React, {useState} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

export default function TraCuuPage() {
    const [maDon, setMaDon] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const handleSearch = async () => {
        setError("");
        setOrder(null);
        setHistory([]);
        if (!maDon.trim()) {
            setError("Vui lòng nhập mã đơn hàng!");
            return;
        }
        setLoading(true);
        try {
            // Lấy thông tin đơn hàng theo mã
            const res = await fetch(`http://localhost:8080/api/hoadon/ma/${encodeURIComponent(maDon.trim())}`);
            if (!res.ok) throw new Error("Không tìm thấy đơn hàng!");
            const data = await res.json();
            console.log('DATA ĐƠN HÀNG:', data);
            setOrder(data.data || data);
            // Lấy lịch sử trạng thái đơn hàng
            const resHis = await fetch(`http://localhost:8080/lich-su-hoa-don/ma/${encodeURIComponent(maDon.trim())}`);
            if (resHis.ok) {
                const hisData = await resHis.json();
                setHistory(hisData.data || hisData);
            }
        } catch (err: any) {
            setError(err.message || "Không tìm thấy đơn hàng!");
        } finally {
            setLoading(false);
        }
    };

    if (order) {
        console.log('ORDER HIỂN THỊ:', order);
    }

    return (
        <Box sx={{maxWidth: 600, mx: "auto", mt: 6, bgcolor: "#fff", borderRadius: 4, boxShadow: 2, p: 4}}>
            <Typography variant="h4" sx={{fontWeight: 800, color: "#b59d3a", mb: 2, textAlign: "center"}}>
                Tra cứu đơn hàng
            </Typography>
            <Box sx={{display: "flex", gap: 2, mb: 2, justifyContent: "center"}}>
                <TextField
                    label="Nhập mã đơn hàng"
                    value={maDon}
                    onChange={e => setMaDon(e.target.value)}
                    variant="outlined"
                    sx={{flex: 1}}
                />
            </Box>
            <Box sx={{display: "flex", gap: 2, mb: 2, justifyContent: "center"}}>
                <Button variant="contained" sx={{bgcolor: "#b59d3a", fontWeight: 700}} onClick={handleSearch}
                        disabled={loading}>
                    Tra cứu
                </Button>
            </Box>
            {loading && <Box sx={{display: "flex", justifyContent: "center", my: 3}}><CircularProgress/></Box>}
            {error && <Typography color="error" sx={{mb: 2, textAlign: "center"}}>{error}</Typography>}
            {order && (
                <Box sx={{mt: 3}}>
                    <Typography variant="h6" sx={{fontWeight: 700, color: '#b59d3a', mb: 1}}>Thông tin đơn
                        hàng</Typography>
                    <Box sx={{mb: 1}}><b>Mã đơn hàng:</b> {order.maHoaDon}</Box>
                    <Box sx={{mb: 1}}><b>Khách hàng:</b> {order.tenNguoiNhan || order.khachHang?.tenKhachHang || "-"}
                    </Box>
                    <Box sx={{mb: 1}}><b>Số điện thoại:</b> {order.soDienThoai || order.khachHang?.soDienThoai || "-"}
                    </Box>
                    <Box sx={{mb: 1}}><b>Địa chỉ nhận:</b> {order.diaChiNhanHang || "-"}</Box>
                    <Box sx={{mb: 1}}><b>Trạng thái:</b> {order.trangThai || "-"}</Box>
                    <Box sx={{mb: 1}}><b>Tổng tiền:</b> {order.tongTien?.toLocaleString("vi-VN") || "-"} VND</Box>
                    <Box sx={{mb: 1}}><b>Ngày giao hàng:</b> {order.ngayGiaoHang || "-"}</Box>
                    <Box sx={{mb: 1}}><b>Ghi chú:</b> {order.ghiChu || "-"}</Box>
                    <Box sx={{mb: 2}}><b>Danh sách sản phẩm:</b>
                        <ul style={{margin: 0, paddingLeft: 18}}>
                            {(order.chiTiet || []).length === 0 ? (
                                <li>Không có sản phẩm nào trong đơn hàng này.</li>
                            ) : (
                                (order.chiTiet || []).map((ct: any, idx: number) => (
                                    <li key={idx}>
                                        <b>Tên sản phẩm:</b> {ct.tenSanPham} <b>- Màu sắc:</b> {ct.mauSac} <b>- Kích cỡ:</b> {ct.kichCo} <b>- Số lượng:</b> {ct.soLuong} <b>- Đơn giá:</b> {ct.donGia?.toLocaleString('vi-VN') || '-'} VND
                                    </li>
                                ))
                            )}
                        </ul>
                    </Box>

                    {history.length > 0 && (
                        <Box sx={{mt: 2}}>
                            <Typography variant="h6" sx={{fontWeight: 700, color: '#b59d3a', mb: 1}}>Lịch sử trạng
                                thái</Typography>
                            <ul style={{margin: 0, paddingLeft: 18}}>
                                {history.map((h, idx) => (
                                    <li key={idx}>
                                        {h.ngayTao ? (new Date(h.ngayTao)).toLocaleString('vi-VN') + ': ' : ''}
                                        <b>{h.trangThaiCu}</b> → <b>{h.trangThaiMoi}</b>
                                    </li>
                                ))}
                            </ul>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
} 