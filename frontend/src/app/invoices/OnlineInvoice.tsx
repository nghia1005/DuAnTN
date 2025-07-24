import React, {useState, useEffect} from 'react';

// Định nghĩa kiểu dữ liệu hóa đơn online
interface OnlineInvoiceType {
    id: number;
    customer: {
        name: string;
        email: string;
        phone: string;
        city: string;
        district: string;
        ward: string;
        address: string;
        payment: string;
        voucher: string;
    };
    items: Array<{
        product: {
            tenSanPham: string;
            tenMauSac?: string;
            tenKichCo?: string;
            gia?: number;
        };
        quantity: number;
    }>;
    payment: string;
    voucher: string;
    total: number;
    discount: number;
    ship: number;
    needPay: number;
    date: string;
    status?: string; // Thêm trường status
    customerType?: string; // Thêm trường customerType
    noteHistory?: Array<{
        time: string;
        status: string;
        note: string;
    }>;
    leftStatus?: string; // Thêm trường leftStatus để lưu trạng thái hiển thị ở cột trái
}

const statusColor = (status: string) => {
    if (status === 'Hoàn tất') return '#388e3c';
    if (status === 'Chờ đóng gói') return '#d32f2f';
    return '#888';
};

// Sửa statusFlow để không còn 'Hoàn tất'
const statusFlow = [
    'Chờ xác nhận',
    'Chờ đóng gói',
    'Chờ vận chuyển',
    'Đang vận chuyển',
    'Đã nhận hàng',
];

function getNextStatus(current: string) {
    const idx = statusFlow.indexOf(current);
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1];
    return null;
}

// Sửa getStatus: Nếu payment là 'bank' => 'Đã xác nhận', nếu 'cod' => 'Chờ xác nhận', còn lại lấy status hoặc flow
const getStatus = (inv: OnlineInvoiceType) => {
    if (inv.status) return inv.status;
    if (inv.payment === 'bank') return 'Đã xác nhận';
    if (inv.payment === 'cod') return 'Chờ xác nhận';
    return 'Chờ xác nhận';
};

// Thêm các trạng thái filter như hình
const FILTERS = [
    {key: 'all', label: 'Tất cả'},
    {key: 'cho_xac_nhan', label: 'Chờ xác nhận'},
    {key: 'pending', label: 'Chờ đóng gói'},
    {key: 'cho_van_chuyen', label: 'Chờ vận chuyển'},
    {key: 'dang_van_chuyen', label: 'Đang vận chuyển'},
    {key: 'da_nhan_hang', label: 'Đã nhận hàng'},
    {key: 'done', label: 'Hoàn tất'},
];

const statusMap = {
    'Chờ xác nhận': '#ffb3b3',
    'Chờ đóng gói': '#ffe066',
    'Chờ vận chuyển': '#ff9800',
    'Đang vận chuyển': '#fbc02d',
    'Đã nhận hàng': '#388e3c',
    'Hoàn tất': '#7be495',
};

const OnlineInvoice: React.FC = () => {
    const [invoices, setInvoices] = useState<OnlineInvoiceType[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<OnlineInvoiceType | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
    const [searchId, setSearchId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [todayChecked, setTodayChecked] = useState(false);
    // Modal chuyển trạng thái
    const [showModal, setShowModal] = useState(false);
    const [modalNextStatus, setModalNextStatus] = useState<string | null>(null);
    const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null);
    // 1. Thêm state cho ghi chú chuyển trạng thái
    const [modalNote, setModalNote] = useState('');
    // 1. Thêm state cho modal chuyển trạng thái cột trái
    const [showLeftModal, setShowLeftModal] = useState(false);
    const [leftModalInvoiceId, setLeftModalInvoiceId] = useState<number | null>(null);
    const [leftModalNote, setLeftModalNote] = useState('');

    // Hàm cập nhật trạng thái hóa đơn
    const updateInvoiceStatus = (invoiceId: number, newStatus: string, note?: string) => {
        const invoices = JSON.parse(localStorage.getItem('online_invoices') || '[]');
        const idx = invoices.findIndex((item: any) => item.id === invoiceId);
        if (idx !== -1) {
            invoices[idx].status = newStatus;
            if (note && note.trim()) {
                if (!invoices[idx].noteHistory) invoices[idx].noteHistory = [];
                invoices[idx].noteHistory.push({
                    time: new Date().toLocaleString('vi-VN'),
                    status: newStatus,
                    note,
                });
            }
            localStorage.setItem('online_invoices', JSON.stringify(invoices));
            setInvoices([...invoices].reverse()); // Đảm bảo cập nhật lại danh sách bên trái
            const updated = invoices[idx];
            setSelectedInvoice(updated);
        }
    };

    // Lấy danh sách hóa đơn online từ localStorage
    useEffect(() => {
        const data = localStorage.getItem('online_invoices');
        if (data) {
            let parsed = JSON.parse(data) as OnlineInvoiceType[];
            // Đảm bảo mỗi hóa đơn đều có leftStatus đúng logic
            parsed = parsed.map(inv => {
                if (inv.leftStatus) return inv;
                if (inv.payment === 'bank') return { ...inv, leftStatus: 'Đã xác nhận' };
                return { ...inv, leftStatus: 'Chờ xác nhận' };
            });
            setInvoices(parsed.reverse()); // Đảo ngược cho hóa đơn mới lên đầu
            setSelectedInvoice(parsed.length > 0 ? parsed[parsed.length - 1] : null);
        } else {
            setInvoices([]);
            setSelectedInvoice(null);
        }
    }, []);

    // Khi có hóa đơn mới (tab khác tạo), tự động cập nhật
    useEffect(() => {
        const onStorage = () => {
            const data = localStorage.getItem('online_invoices');
            if (data) {
                const parsed = JSON.parse(data) as OnlineInvoiceType[];
                setInvoices(parsed.reverse());
                setSelectedInvoice(parsed.length > 0 ? parsed[parsed.length - 1] : null);
            } else {
                setInvoices([]);
                setSelectedInvoice(null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Lọc hóa đơn theo filter, tìm kiếm và các bộ lọc
    const filteredInvoices = invoices.filter(inv => {
        const status = getStatus(inv);
        // Lọc theo trạng thái
        if (filter !== 'all') {
            if (filter === 'pending' && status !== 'Chờ đóng gói') return false;
            if (filter === 'done' && status !== 'Hoàn tất') return false;
            // Các trạng thái khác có thể mở rộng logic ở đây
            // Hiện tại chỉ demo 2 trạng thái chính, bạn có thể bổ sung logic mapping status cho các trạng thái khác nếu muốn
            if (filter !== 'pending' && filter !== 'done') return false;
        }
        // Lọc theo mã hóa đơn
        if (searchId && !inv.id.toString().includes(searchId.trim())) return false;
        // Lọc theo giá
        if (minPrice && inv.needPay < Number(minPrice)) return false;
        if (maxPrice && inv.needPay > Number(maxPrice)) return false;
        // Lọc theo ngày
        if (todayChecked) {
            const today = new Date();
            const invDate = new Date(inv.date);
            if (
                invDate.getDate() !== today.getDate() ||
                invDate.getMonth() !== today.getMonth() ||
                invDate.getFullYear() !== today.getFullYear()
            ) return false;
        } else {
            if (fromDate && new Date(inv.date) < new Date(fromDate)) return false;
            if (toDate && new Date(inv.date) > new Date(toDate)) return false;
        }
        return true;
    });

    if (!invoices.length) {
        return <div style={{color: '#888', fontSize: 18, textAlign: 'center', marginTop: 40}}>Chưa có hóa đơn online
            nào!</div>;
    }

    // Đảm bảo ô trạng thái ở trên tên khách hàng lấy giá trị từ selectedInvoice.status (nếu có), nếu không thì 'Chờ xác nhận'.
    const currentStatus = selectedInvoice?.status || 'Chờ xác nhận';
    let nextStatus = null;
    if (currentStatus === 'Chờ xác nhận') nextStatus = 'Đã xác nhận';
    else if (currentStatus === 'Đã xác nhận') nextStatus = 'Chờ đóng gói';
    else if (currentStatus === 'Chờ đóng gói') nextStatus = 'Chờ vận chuyển';
    else if (currentStatus === 'Chờ vận chuyển') nextStatus = 'Đang vận chuyển';
    else if (currentStatus === 'Đang vận chuyển') nextStatus = 'Đã nhận hàng';

    return (
        <React.Fragment>
            <div style={{background: '#fffbe6', minHeight: '100vh', padding: 32}}>
                {/* 1. Thanh trạng thái */}
                <div style={{
                    background: '#fff',
                    borderRadius: 18,
                    border: '2px solid #eee',
                    padding: 18,
                    marginBottom: 18
                }}>
                    <div style={{display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap'}}>
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                style={{
                                    padding: '16px 36px',
                                    border: '2px solid #bbb',
                                    borderRadius: 16,
                                    fontSize: 18,
                                    fontWeight: 600,
                                    background: filter === f.key ? '#1976d2' : '#fff',
                                    color: filter === f.key ? '#fff' : '#222',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: 140
                                }}
                                onClick={() => setFilter(f.key as any)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* 2. Bộ lọc */}
                <div style={{
                    background: '#fff',
                    borderRadius: 18,
                    border: '2px solid #eee',
                    padding: 18,
                    marginBottom: 18
                }}>
                    <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center'}}>
                        <input
                            style={{
                                border: '2px solid #bbb',
                                borderRadius: 8,
                                padding: '10px 16px',
                                minWidth: 180,
                                flex: 1
                            }}
                            placeholder='Tìm kiếm hóa đơn...'
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                        />
                        <input
                            type='number'
                            style={{border: '2px solid #bbb', borderRadius: 8, padding: '10px', width: 70}}
                            placeholder='Từ'
                            value={minPrice}
                            onChange={e => setMinPrice(e.target.value)}
                        />
                        <input
                            type='number'
                            style={{border: '2px solid #bbb', borderRadius: 8, padding: '10px', width: 100}}
                            placeholder='Đến'
                            value={maxPrice}
                            onChange={e => setMaxPrice(e.target.value)}
                        />
                        <input
                            type='datetime-local'
                            style={{border: '2px solid #bbb', borderRadius: 8, padding: '10px'}}
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                        <input
                            type='datetime-local'
                            style={{border: '2px solid #bbb', borderRadius: 8, padding: '10px'}}
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                        <select
                            style={{border: '2px solid #bbb', borderRadius: 8, padding: '10px 16px'}}
                            value={todayChecked ? 'today' : ''}
                            onChange={e => setTodayChecked(e.target.value === 'today')}
                        >
                            <option value=''>Chọn ngày</option>
                            <option value='today'>Hôm nay</option>
                        </select>
                        <button
                            style={{
                                padding: '10px 24px',
                                border: '2px solid #bbb',
                                borderRadius: 8,
                                background: '#eee',
                                fontWeight: 600,
                                marginLeft: 'auto'
                            }}
                            onClick={() => {
                                setSearchId('');
                                setMinPrice('');
                                setMaxPrice('');
                                setFromDate('');
                                setToDate('');
                                setTodayChecked(false);
                            }}
                        >
                            Xóa lọc
                        </button>
                    </div>
                </div>
                {/* 3. Nội dung 2 cột */}
                <div style={{display: 'flex', gap: 24}}>
                    {/* Cột trái: Danh sách hóa đơn online */}
                    <div style={{flexBasis: '40%', flexGrow: 0, flexShrink: 0}}>
                        <div style={{fontWeight: 700, marginBottom: 18}}>Bảng hóa đơn online</div>
                        {filteredInvoices.length === 0 && (
                            <div style={{color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40}}>Không có hóa
                                đơn nào phù hợp!</div>
                        )}
                        {filteredInvoices.map(inv => {
                            // Hiển thị trạng thái cột trái theo leftStatus
                            const leftStatus = inv.leftStatus || 'Chờ xác nhận';
                            return (
                                <div
                                    key={inv.id}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedInvoice?.id === inv.id ? '#ffe9b3' : '#fafafa',
                                        border: '2px solid #bbb',
                                        borderRadius: 24,
                                        marginBottom: 16,
                                        boxShadow: '0 4px 16px #eee',
                                        padding: 12,
                                        minWidth: 220,
                                        maxWidth: '100%',
                                        transition: 'box-shadow 0.2s, background 0.2s'
                                    }}
                                    onClick={() => setSelectedInvoice(inv)}
                                >
                                    <div style={{display: 'flex', alignItems: 'flex-start', marginBottom: 8}}>
                  <span
                      style={{
                          border: 'none',
                          borderRadius: 16,
                          background: leftStatus === 'Đã xác nhận' ? '#388e3c' : (statusMap[leftStatus as keyof typeof statusMap] || '#eee'),
                          color: leftStatus === 'Đã xác nhận' ? '#fff' : (['Đã xác nhận', 'Chờ xác nhận'].includes(leftStatus) ? '#fff' : '#222'),
                          padding: '7px 14px',
                          fontWeight: 700,
                          fontSize: 15,
                          minWidth: 70,
                          textAlign: 'center',
                          boxShadow: '0 2px 8px #ddd',
                          cursor: leftStatus === 'Chờ xác nhận' ? 'pointer' : 'default',
                          transition: 'background 0.2s',
                      }}
                      onClick={e => {
                          e.stopPropagation();
                          if (leftStatus === 'Chờ xác nhận') {
                              setLeftModalInvoiceId(inv.id);
                              setShowLeftModal(true);
                          }
                      }}
                  >
                    {leftStatus}
                  </span>
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontWeight: 600,
                                            fontSize: 15,
                                            lineHeight: 1.2
                                        }}>Mã hóa đơn: <b style={{fontSize: 18}}>{inv.id}</b></span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 13,
                                        marginBottom: 2
                                    }}>
                                        <span style={{color: '#666'}}>{inv.date}</span>
                                        <span style={{color: '#222', fontWeight: 500}}>{inv.customer.name || ''}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 13,
                                        alignItems: 'center'
                                    }}>
                                        <span style={{color: '#222', fontWeight: 500}}>{inv.customer.name || ''}</span>
                                        <span style={{
                                            fontWeight: 700,
                                            color: '#e67e22',
                                            fontSize: 16
                                        }}>{inv.needPay.toLocaleString()} đ</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Cột phải: Chi tiết hóa đơn */}
                    <div style={{
                        flexBasis: '60%',
                        flexGrow: 0,
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'flex-start'
                    }}>
                        {selectedInvoice ? (
                            <div style={{
                                background: '#fff',
                                borderRadius: 18,
                                boxShadow: '0 2px 12px #eee',
                                padding: 28,
                                width: '100%'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', marginBottom: 12, gap: 16}}>
                                    <div style={{
                                        borderRadius: 12,
                                        background: statusMap[currentStatus as keyof typeof statusMap] || '#eee',
                                        color: ['Hoàn tất', 'Đã nhận hàng', 'Đã xác nhận', 'Chờ xác nhận'].includes(currentStatus) ? '#fff' : '#222',
                                        padding: '7px 18px',
                                        fontWeight: 700,
                                        fontSize: 16,
                                        minWidth: 90,
                                        textAlign: 'center',
                                        display: 'inline-block'
                                    }}>
                                        {currentStatus}
                                    </div>
                                    <span style={{marginLeft: 'auto', fontWeight: 600, fontSize: 18}}>
                      Hóa đơn <b>#{selectedInvoice.id}</b>
                    </span>
                                </div>
                                <div style={{color: '#222', fontSize: 16, marginBottom: 12}}>
                                    Khách hàng: <b>{selectedInvoice.customer.name || ''}</b>
                                </div>
                                <div style={{color: '#666', fontSize: 15, margin: '0 0 12px 0'}}>Thời gian mua
                                    hàng: <b>{selectedInvoice.date}</b></div>
                                {/* Loại khách hàng */}
                                <div style={{color: '#888', fontSize: 15, marginBottom: 12}}>
                                    Loại khách
                                    hàng: <b>{selectedInvoice.customerType === 'Thành viên' ? 'Thành viên' : 'Khách lẻ/Khách vãng lai'}</b>
                                </div>
                                {/* Bảng sản phẩm */}
                                <div style={{marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
                                    {selectedInvoice.items.map((sp, idx) => (
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
                                            <div style={{minWidth: 180, flex: 2}}>
                                                <div><b>STT:</b> {idx + 1}</div>
                                                <div><b>Tên sản phẩm:</b> {sp.product.tenSanPham}</div>
                                                <div><b>Màu sắc:</b> {sp.product.tenMauSac || ''}</div>
                                                <div><b>Kích thước:</b> {sp.product.tenKichCo || ''}</div>
                                            </div>
                                            <div style={{minWidth: 120, flex: 1}}>
                                                <div><b>Đơn giá:</b> {sp.product.gia?.toLocaleString()} đ</div>
                                                <div><b>Số lượng:</b> {sp.quantity}</div>
                                                <div><b>Thành
                                                    tiền:</b> {((sp.product.gia || 0) * sp.quantity).toLocaleString()} đ
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Thông tin giao hàng & tổng tiền */}
                                <div style={{display: 'flex', gap: 32, marginBottom: 8}}>
                                    <div style={{flex: 1}}>
                                        <div style={{color: '#888', fontWeight: 500, marginBottom: 4}}>Thông tin giao
                                            hàng:
                                        </div>
                                        <div style={{fontSize: 15}}>Người
                                            nhận: <b>{selectedInvoice.customer.name || ''}</b></div>
                                        <div style={{fontSize: 15}}>Số điện
                                            thoại: <b>{selectedInvoice.customer.phone || ''}</b></div>
                                        <div style={{fontSize: 15}}>Địa chỉ giao
                                            hàng: <b>{selectedInvoice.customer.address}, {selectedInvoice.customer.ward}, {selectedInvoice.customer.district}, {selectedInvoice.customer.city}</b>
                                        </div>
                                        <div style={{fontSize: 15}}>Ghi
                                            chú: <b>{selectedInvoice.payment === 'cod' ? 'Thanh toán khi nhận hàng' : selectedInvoice.payment === 'bank' ? 'Chuyển khoản với QR' : (selectedInvoice.customer.payment || '')}</b>
                                        </div>
                                    </div>
                                    <div style={{minWidth: 160}}>
                                        <div style={{color: '#888', fontWeight: 500, marginBottom: 4}}>Tổng kết:</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15}}>
                                            <span>Tổng tiền:</span>
                                            <span style={{
                                                color: '#e67e22',
                                                fontWeight: 700
                                            }}>{selectedInvoice.total.toLocaleString()} đ</span>
                                        </div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15}}>
                                            <span>Giảm giá:</span>
                                            <span style={{
                                                color: '#e74c3c',
                                                fontWeight: 700
                                            }}>- {selectedInvoice.discount.toLocaleString()} đ</span>
                                        </div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 15}}>
                                            <span>Phí vận chuyển:</span>
                                            <span style={{
                                                color: '#2980b9',
                                                fontWeight: 700
                                            }}>{selectedInvoice.ship.toLocaleString()} đ</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: 17,
                                            marginTop: 6,
                                            fontWeight: 700
                                        }}>
                                            <span>Tổng cộng:</span>
                                            <span
                                                style={{color: '#e67e22'}}>{selectedInvoice.needPay.toLocaleString()} đ</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{color: '#888', fontSize: 14, marginTop: 10}}>
                                    Thanh
                                    toán: <b>{selectedInvoice.payment === 'cod' ? 'Thanh toán khi nhận hàng' : selectedInvoice.payment === 'bank' ? 'Chuyển khoản với QR' : (selectedInvoice.payment || '')}</b>
                                </div>
                                {/* 2. Bên phải (chi tiết hóa đơn): */}
                                {/* Xác định trạng thái hiện tại */}
                                {/* Button chuyển trạng thái chỉ hiện khi có nextStatus */}
                                {nextStatus && (
                                    <div style={{marginTop: 24, textAlign: 'right'}}>
                                        <button
                                            style={{
                                                padding: '12px 32px',
                                                background: '#1976d2',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontWeight: 700,
                                                fontSize: 17,
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px #1976d222',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => {
                                                setModalNextStatus(nextStatus);
                                                setModalInvoiceId(selectedInvoice.id);
                                                setShowModal(true);
                                            }}
                                        >
                                            {nextStatus}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span style={{fontSize: 28, fontWeight: 700, color: '#888'}}>Chọn hóa đơn</span>
                        )}
                    </div>
                </div>
            </div>
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 32, minWidth: 350, maxWidth: 500,
                        boxShadow: '0 4px 32px #0002', position: 'relative'
                    }}>
                        <div style={{fontWeight: 700, fontSize: 20, marginBottom: 16, color: '#1976d2'}}>
                            Xác nhận chuyển trạng thái hóa đơn
                        </div>
                        <div style={{marginBottom: 12, fontSize: 16}}>
                            Bạn có muốn chuyển trạng thái hóa đơn sang <b>{modalNextStatus}</b> không?
                        </div>
                        <div style={{marginBottom: 16}}>
                            <label style={{fontWeight: 600, fontSize: 15}}>Ghi chú:</label>
                            <textarea
                                value={modalNote}
                                onChange={e => setModalNote(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    borderRadius: 8,
                                    border: '1px solid #bbb',
                                    padding: 8,
                                    fontSize: 15,
                                    marginTop: 6
                                }}
                                placeholder="Nhập ghi chú ..."
                            />
                        </div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
                            <button
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: '1px solid #bbb',
                                    background: '#fff',
                                    fontWeight: 600,
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowModal(false)}
                            >Hủy
                            </button>
                            <button
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#1976d2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setShowModal(false);
                                    if (modalInvoiceId && modalNextStatus) {
                                        updateInvoiceStatus(modalInvoiceId, modalNextStatus, modalNote);
                                        setModalNote('');
                                    }
                                }}
                            >Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showLeftModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 32, minWidth: 350, maxWidth: 500,
                        boxShadow: '0 4px 32px #0002', position: 'relative'
                    }}>
                        <div style={{fontWeight: 700, fontSize: 20, marginBottom: 16, color: '#1976d2'}}>
                            Xác nhận chuyển trạng thái hóa đơn bên trái
                        </div>
                        <div style={{marginBottom: 12, fontSize: 16}}>
                            Bạn có muốn chuyển trạng thái hóa đơn sang <b>Đã xác nhận</b> không?
                        </div>
                        <div style={{marginBottom: 16}}>
                            <label style={{fontWeight: 600, fontSize: 15}}>Ghi chú:</label>
                            <textarea
                                value={leftModalNote}
                                onChange={e => setLeftModalNote(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%',
                                    borderRadius: 8,
                                    border: '1px solid #bbb',
                                    padding: 8,
                                    fontSize: 15,
                                    marginTop: 6
                                }}
                                placeholder="Nhập ghi chú ..."
                            />
                        </div>
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
                            <button
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: '1px solid #bbb',
                                    background: '#fff',
                                    fontWeight: 600,
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setShowLeftModal(false);
                                    setLeftModalNote('');
                                }}
                            >Hủy
                            </button>
                            <button
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#1976d2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setShowLeftModal(false);
                                    if (leftModalInvoiceId) {
                                        // Cập nhật leftStatus và noteHistory (của leftStatus)
                                        const invoices = JSON.parse(localStorage.getItem('online_invoices') || '[]');
                                        const idx = invoices.findIndex((item: any) => item.id === leftModalInvoiceId);
                                        if (idx !== -1) {
                                            invoices[idx].leftStatus = 'Đã xác nhận';
                                            if (!invoices[idx].noteHistory) invoices[idx].noteHistory = [];
                                            invoices[idx].noteHistory.push({
                                                time: new Date().toLocaleString('vi-VN'),
                                                status: 'Đã xác nhận (bên trái)',
                                                note: leftModalNote,
                                            });
                                            localStorage.setItem('online_invoices', JSON.stringify(invoices));
                                            setInvoices([...invoices].reverse());
                                        }
                                    }
                                    setLeftModalNote('');
                                }}
                            >Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default OnlineInvoice; 