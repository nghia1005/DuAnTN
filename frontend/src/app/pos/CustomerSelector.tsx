"use client";
import React, { useState, useEffect } from 'react';

interface DiaChiDTO {
  idDiaChi: number;
  idKhachHang: number;
  thanhPho: string;
  quanHuyen: string;
  xaPhuong: string;
  ngoNgach: string;
  ghiChu: string;
  macDinh: string;
}

interface KhachHangDTO {
  idKhachHang: number;
  maKhachHang: string;
  tenKhachHang: string;
  ngaySinh: string;
  gioiTinh: boolean;
  soDienThoai: string;
  email: string;
  trangThai: string;
  gioiTinhText: string;
  emailXacThucText: string;
  trangThaiText: string;
  soDiaChi: number;
  danhSachDiaChi: DiaChiDTO[];
}

interface CustomerSelectorProps {
  selectedCustomer: KhachHangDTO | null;
  onCustomerSelectAction: (customer: KhachHangDTO | null) => void;
  onAddressSelectAction: (address: DiaChiDTO | null) => void;
  selectedAddress: DiaChiDTO | null;
  isShipping: boolean;
}

export default function CustomerSelector({
  selectedCustomer,
  onCustomerSelectAction,
  onAddressSelectAction,
  selectedAddress,
  isShipping
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<KhachHangDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    tenKhachHang: '',
    soDienThoai: '',
    email: '',
    gioiTinh: true,
    maKhachHang: '',
    trangThai: 'Hoạt động'
  });
  const [creating, setCreating] = useState(false);

  // Load danh sách khách hàng
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/khach-hang/hien-thi");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: KhachHangDTO) => {
    onCustomerSelectAction(customer);
    // Tự động chọn địa chỉ mặc định nếu có
    if (customer.danhSachDiaChi && customer.danhSachDiaChi.length > 0) {
      const defaultAddress = customer.danhSachDiaChi.find(addr => addr.macDinh === "Có");
      onAddressSelectAction(defaultAddress || customer.danhSachDiaChi[0]);
    } else {
      onAddressSelectAction(null);
    }
    setShowCustomerModal(false);
  };

  const handleRemoveCustomer = () => {
    onCustomerSelectAction(null);
    onAddressSelectAction(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.tenKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.soDienThoai.includes(searchTerm) ||
    customer.maKhachHang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm tạo khách hàng mới
  const handleCreateCustomer = async () => {
    if (!newCustomer.tenKhachHang.trim()) {
      alert('Tên khách hàng không được để trống!');
      return;
    }
    if (!/^[0-9]{10,11}$/.test(newCustomer.soDienThoai)) {
      alert('Số điện thoại phải có 10-11 số!');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newCustomer.email)) {
      alert('Email không đúng định dạng!');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('http://localhost:8080/khach-hang/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      if (response.ok) {
        const data = await response.json();
        let created = data.data || data;
        setCustomers(prev => [...prev, created]);
        onCustomerSelectAction(created);
        setShowCreateModal(false);
        setNewCustomer({ tenKhachHang: '', soDienThoai: '', email: '', gioiTinh: true, maKhachHang: '', trangThai: 'Hoạt động' });
      } else {
        alert('Tạo khách hàng thất bại!');
      }
    } catch (e) {
      alert('Lỗi khi tạo khách hàng!');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Hiển thị khách hàng đã chọn */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
          <span style={{ minWidth: 100, fontWeight: 600 }}>Khách hàng:</span>
          {selectedCustomer ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                flex: 1, 
                padding: '8px 12px', 
                borderRadius: 6, 
                border: '1px solid #bdbdbd', 
                background: '#f9f9f9',
                fontSize: 14
              }}>
                <div style={{ fontWeight: 600, color: '#1976d2' }}>
                  {selectedCustomer.tenKhachHang} ({selectedCustomer.maKhachHang})
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {selectedCustomer.soDienThoai} • {selectedCustomer.email}
                </div>
              </div>
              <button
                onClick={handleRemoveCustomer}
                style={{
                  padding: '4px 8px',
                  background: '#e57373',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12
                }}
                title="Bỏ chọn khách hàng"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCustomerModal(true)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #bdbdbd',
                  background: '#f5f5f5',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#666'
                }}
              >
                Chọn khách hàng...
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #1976d2',
                  background: '#1976d2',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 4
                }}
              >
                ➕ Tạo khách hàng mới
              </button>
            </>
          )}
        </div>

        {/* Hiển thị địa chỉ giao hàng khi bật giao hàng */}
        {isShipping && selectedCustomer && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Địa chỉ giao hàng:</div>
            {selectedCustomer.danhSachDiaChi && selectedCustomer.danhSachDiaChi.length > 0 ? (
              <div>
                <select
                  value={selectedAddress?.idDiaChi || ''}
                  onChange={(e) => {
                    const addressId = parseInt(e.target.value);
                    const address = selectedCustomer.danhSachDiaChi.find(addr => addr.idDiaChi === addressId);
                    onAddressSelectAction(address || null);
                    // Nếu có address thì tự động fill thông tin lên form giao hàng
                    if (address) {
                      // Gửi thêm thông tin cho form ngoài POSPage
                      if (typeof window !== 'undefined' && window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('auto-fill-shipping-info', { detail: address }));
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #bdbdbd',
                    background: '#fff',
                    fontSize: 14
                  }}
                >
                  <option value="">Chọn địa chỉ giao hàng</option>
                  {selectedCustomer.danhSachDiaChi.map((address) => (
                    <option key={address.idDiaChi} value={address.idDiaChi}>
                      {address.ngoNgach}, {address.xaPhuong}, {address.quanHuyen}, {address.thanhPho}
                      {address.macDinh === "Có" ? " (Mặc định)" : ""}
                    </option>
                  ))}
                </select>
                
                {selectedAddress && (
                  <div style={{
                    marginTop: 8,
                    padding: '12px',
                    background: '#f0f8ff',
                    borderRadius: 6,
                    border: '1px solid #b3d4fc',
                    fontSize: 13
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Thông tin địa chỉ:</div>
                    <div>📍 {selectedAddress.ngoNgach}</div>
                    <div>🏘️ {selectedAddress.xaPhuong}, {selectedAddress.quanHuyen}, {selectedAddress.thanhPho}</div>
                    {selectedAddress.ghiChu && (
                      <div>📝 Ghi chú: {selectedAddress.ghiChu}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '8px 12px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: 6,
                color: '#856404',
                fontSize: 13
              }}>
                ⚠️ Khách hàng này chưa có địa chỉ giao hàng
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal chọn khách hàng */}
      {showCustomerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(0,0,0,0.2)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Chọn khách hàng</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại hoặc mã khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              />
            </div>

            {/* Customer list */}
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              padding: '0 24px 24px 24px'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Đang tải danh sách khách hàng...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Không có khách hàng nào'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.idKhachHang}
                      onClick={() => handleCustomerSelect(customer)}
                      style={{
                        padding: '12px 16px',
                        border: '1px solid #eee',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedCustomer?.idKhachHang === customer.idKhachHang ? '#e3f2fd' : '#fff'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.background = selectedCustomer?.idKhachHang === customer.idKhachHang ? '#e3f2fd' : '#fff'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>
                            {customer.tenKhachHang}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>
                            📞 {customer.soDienThoai}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>
                            📧 {customer.email}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            Mã: {customer.maKhachHang} • {customer.soDiaChi} địa chỉ
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: customer.trangThai === 'Hoạt động' ? '#e8f5e9' : '#fff3e0',
                          color: customer.trangThai === 'Hoạt động' ? '#2e7d32' : '#f57c00'
                        }}>
                          {customer.trangThai}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo khách hàng mới */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: 400,
            padding: 32,
            boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
            position: 'relative',
            maxWidth: '95vw'
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 20,
                fontSize: 26,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#888',
                fontWeight: 700
              }}
            >×</button>
            <h3 style={{ margin: 0, marginBottom: 22, textAlign: 'center', fontSize: 22, fontWeight: 700 }}>Tạo khách hàng mới</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateCustomer();
              }}
            >
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Tên khách hàng</label>
                <input
                  type="text"
                  value={newCustomer.tenKhachHang}
                  onChange={e => setNewCustomer({ ...newCustomer, tenKhachHang: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', outline: 'none', fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Số điện thoại</label>
                <input
                  type="text"
                  value={newCustomer.soDienThoai}
                  onChange={e => setNewCustomer({ ...newCustomer, soDienThoai: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', outline: 'none', fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', outline: 'none', fontSize: 15 }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Giới tính</label>
                <select
                  value={newCustomer.gioiTinh ? 'true' : 'false'}
                  onChange={e => setNewCustomer({ ...newCustomer, gioiTinh: e.target.value === 'true' })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', outline: 'none', fontSize: 15 }}
                >
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Mã khách hàng (tùy chọn)</label>
                <input
                  type="text"
                  value={newCustomer.maKhachHang}
                  onChange={e => setNewCustomer({ ...newCustomer, maKhachHang: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', outline: 'none', fontSize: 15 }}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  background: creating ? '#90caf9' : '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 17,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  marginTop: 8,
                  transition: 'background 0.2s'
                }}
              >
                {creating ? 'Đang tạo...' : 'Tạo khách hàng'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 