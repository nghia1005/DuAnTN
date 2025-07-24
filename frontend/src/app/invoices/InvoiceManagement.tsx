"use client";
import React, { useState, useEffect } from 'react';
import InvoiceDetail from './InvoiceDetail';

interface Invoice {
    id: string;
    maHoaDon: string;
    ngayTao: string;
    khachHang: string;
    tongTien: number;
    trangThai: string;
    loaiHoaDon: 'pos' | 'online';
    thanhTien?: number;
    giamGia?: number;
    phiShip?: number;
    items?: {
        tenSanPham: string;
        soLuong: number;
        donGia: number;
        thanhTien: number;
    }[];
}

export default function InvoiceManagement() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:8080/api/hoadon')
            .then(res => res.json())
            .then(data => {
                setInvoices(data);
                setLoading(false);
            });
    }, []);

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = (invoice.maHoaDon || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (invoice.tenKhachHang || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || invoice.trangThai === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã thanh toán':
                return '#4caf50';
            case 'Chờ thanh toán':
                return '#ff9800';
            case 'Đã hủy':
                return '#f44336';
            default:
                return '#757575';
        }
    };

    const handleViewInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedInvoice(null);
    };

    const handlePrintInvoice = (invoice: Invoice) => {
        console.log('In hóa đơn:', invoice);
        // TODO: Implement print invoice
    };

    const handleExportInvoice = (invoice: Invoice) => {
        console.log('Xuất hóa đơn:', invoice);
        // TODO: Implement export invoice
    };

    return (
        <div className="invoice-management">
            <div className="invoice-header">
                <h2>Hóa đơn tại quầy</h2>
                <div className="header-actions">
                    <button className="btn btn-primary">
                        <span>➕</span>
                        Tạo hóa đơn mới
                    </button>
                </div>
            </div>

            <div className="invoice-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã hóa đơn hoặc khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <div className="filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                        <option value="Đã hủy">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div className="invoice-content">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📄</div>
                        <h3>Không có hóa đơn nào</h3>
                        <p>Chưa có hóa đơn nào được tạo hoặc không tìm thấy hóa đơn phù hợp.</p>
                    </div>
                ) : (
                    <div className="invoice-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã hóa đơn</th>
                                    <th>Ngày tạo</th>
                                    <th>Khách hàng</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td>
                                            <span className="invoice-code">{invoice.maHoaDon}</span>
                                        </td>
                                        <td>{new Date(invoice.ngayTao).toLocaleDateString('vi-VN')}</td>
                                        <td>{invoice.tenKhachHang}</td>
                                        <td>
                                            <span className="amount">{formatCurrency(invoice.tongTien)}</span>
                                        </td>
                                        <td>
                                            <span 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(invoice.trangThai) }}
                                            >
                                                {invoice.trangThai}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-sm btn-info"
                                                    onClick={() => handleViewInvoice(invoice)}
                                                    title="Xem chi tiết"
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handlePrintInvoice(invoice)}
                                                    title="In hóa đơn"
                                                >
                                                    🖨️
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleExportInvoice(invoice)}
                                                    title="Xuất hóa đơn"
                                                >
                                                    📥
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showDetailModal && selectedInvoice && (
                <InvoiceDetail
                    invoice={selectedInvoice}
                    onCloseAction={handleCloseDetailModal}
                />
            )}

            <style jsx>{`
                .invoice-management {
                    padding: 24px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .invoice-header h2 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.8rem;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
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

                .btn-sm {
                    padding: 4px 8px;
                    font-size: 0.8rem;
                }

                .btn-info {
                    background: #2196f3;
                    color: white;
                }

                .btn-secondary {
                    background: #757575;
                    color: white;
                }

                .btn-success {
                    background: #4caf50;
                    color: white;
                }

                .invoice-filters {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                    align-items: center;
                }

                .search-box {
                    position: relative;
                    flex: 1;
                }

                .search-input {
                    width: 100%;
                    padding: 10px 40px 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }

                .search-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }

                .filter-select {
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    background: white;
                }

                .invoice-table {
                    overflow-x: auto;
                }

                .invoice-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .invoice-table th,
                .invoice-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e0e0e0;
                }

                .invoice-table th {
                    background: #f5f5f5;
                    font-weight: 600;
                    color: #333;
                }

                .invoice-code {
                    font-weight: 600;
                    color: #b59d3a;
                }

                .amount {
                    font-weight: 600;
                    color: #2c3e50;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .action-buttons {
                    display: flex;
                    gap: 4px;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .spinner {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #b59d3a;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }

                .empty-state h3 {
                    margin: 0 0 8px 0;
                    color: #333;
                }

                .empty-state p {
                    margin: 0;
                    color: #666;
                }
            `}</style>
        </div>
    );
} 