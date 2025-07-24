"use client";
import React from 'react';

interface InvoiceDetailProps {
    invoice: {
        idHoaDon: number;
        maHoaDon: string;
        ngayTao: string;
        tenKhachHang?: string;
        tongTien: number;
        trangThai: string;
        loaiDon?: string;
        chiTiet?: {
            tenSanPham: string;
            soLuong: number;
            donGia: number;
            thanhTien: number;
        }[];
    };
    onCloseAction: () => void;
}

export default function InvoiceDetail({ invoice, onCloseAction }: InvoiceDetailProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="invoice-detail-modal">
            <div className="modal-overlay" onClick={onCloseAction}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Chi tiết hóa đơn {invoice.maHoaDon}</h3>
                    <button className="close-btn" onClick={onCloseAction}>×</button>
                </div>
                
                {!invoice || !invoice.idHoaDon ? (
                    <div style={{color: 'red', padding: 24}}>Không có dữ liệu hóa đơn!</div>
                ) : (
                    <div className="modal-body">
                        <div className="invoice-info">
                            <div className="info-row">
                                <span className="label">Mã hóa đơn:</span>
                                <span className="value">{invoice.maHoaDon}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Ngày tạo:</span>
                                <span className="value">{invoice.ngayTao ? new Date(invoice.ngayTao).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}) : ''}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Khách hàng:</span>
                                <span className="value">{invoice.tenKhachHang}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Loại hóa đơn:</span>
                                <span className="value">
                                    {invoice.loaiDon === 'pos' ? '🏪 Tại quầy' : '🌐 Online'}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Trạng thái:</span>
                                <span className="value status">{invoice.trangThai}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Tổng tiền:</span>
                                <span className="value amount">{formatCurrency(invoice.tongTien)}</span>
                            </div>
                        </div>

                        <div className="invoice-items">
                            <h4>Chi tiết sản phẩm</h4>
                            <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Giả sử invoice.items là mảng sản phẩm, nếu chưa có thì bạn cần truyền vào props */}
                                {(invoice.chiTiet || []).map((item, idx) => (
                                    <div key={idx} style={{
                                        border: '1px solid #eee',
                                        borderRadius: 8,
                                        padding: 16,
                                        background: '#fff',
                                        boxShadow: '0 1px 4px #eee',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 24,
                                        alignItems: 'flex-start',
                                    }}>
                                        <div style={{ minWidth: 180, flex: 2 }}>
                                            <div><b>STT:</b> {idx + 1}</div>
                                            <div><b>Tên sản phẩm:</b> {item.tenSanPham}</div>
                                        </div>
                                        <div style={{ minWidth: 120, flex: 1 }}>
                                            <div><b>Số lượng:</b> {item.soLuong}</div>
                                            <div><b>Đơn giá:</b> {formatCurrency(item.donGia)}</div>
                                            <div><b>Thành tiền:</b> {formatCurrency(item.thanhTien)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCloseAction}>
                        Đóng
                    </button>
                    <button className="btn btn-primary">
                        🖨️ In hóa đơn
                    </button>
                    <button className="btn btn-success">
                        📥 Xuất PDF
                    </button>
                </div>
            </div>

            <style jsx>{`
                .invoice-detail-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }

                .modal-content {
                    position: relative;
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.4rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #f5f5f5;
                    color: #333;
                }

                .modal-body {
                    padding: 24px;
                }

                .invoice-info {
                    margin-bottom: 24px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .label {
                    font-weight: 600;
                    color: #666;
                    min-width: 120px;
                }

                .value {
                    color: #2c3e50;
                    font-weight: 500;
                }

                .value.status {
                    color: #4caf50;
                    font-weight: 600;
                }

                .value.amount {
                    color: #b59d3a;
                    font-weight: 700;
                    font-size: 1.1rem;
                }

                .invoice-items h4 {
                    margin: 0 0 16px 0;
                    color: #2c3e50;
                    font-size: 1.2rem;
                }

                .items-table {
                    overflow-x: auto;
                }

                .items-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .items-table th,
                .items-table td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }

                .items-table th {
                    background: #f5f5f5;
                    font-weight: 600;
                    color: #333;
                    font-size: 0.9rem;
                }

                .items-table td {
                    font-size: 0.9rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid #e0e0e0;
                    background: #f9f9f9;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #b59d3a;
                    color: white;
                }

                .btn-primary:hover {
                    background: #8b7a2e;
                }

                .btn-secondary {
                    background: #757575;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #616161;
                }

                .btn-success {
                    background: #4caf50;
                    color: white;
                }

                .btn-success:hover {
                    background: #45a049;
                }
            `}</style>
        </div>
    );
} 