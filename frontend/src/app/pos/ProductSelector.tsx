'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ProductDetail } from './types';

interface Props {
  onSelectAction: (product: ProductDetail, qty: number) => void;
  onCloseAction: () => void;
  products: ProductDetail[];
}

export default function ProductSelector({ onSelectAction, onCloseAction, products }: Props) {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qtyMap, setQtyMap] = useState<{ [id: number]: string }>({});
  // Modal nhập số lượng
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductDetail | null>(null);
  const [modalQty, setModalQty] = useState('1');

  // Lấy danh sách filter duy nhất
  const brands = Array.from(new Set(products.map(p => p.tenThuongHieu))).filter(Boolean);
  const categories = Array.from(new Set(products.map(p => p.tenDanhMuc))).filter(Boolean);
  const colors = Array.from(new Set(products.map(p => p.tenMauSac))).filter(Boolean);
  const sizes = Array.from(new Set(products.map(p => p.tenKichCo))).filter(Boolean);

  // Lọc dữ liệu theo filter và tìm kiếm
  const filtered = products.filter(d =>
    d.trangThai === 'Đang bán' && d.soLuong > 0 &&
    (!brand || d.tenThuongHieu === brand) &&
    (!category || d.tenDanhMuc === category) &&
    (!color || d.tenMauSac === color) &&
    (!size || d.tenKichCo === size) &&
    (!search || d.tenSanPham.toLowerCase().includes(search.toLowerCase()) || d.maSanPham.toLowerCase().includes(search.toLowerCase()))
  );

  // Thêm sản phẩm vào giỏ hàng
  const handleAddToCart = (product: ProductDetail) => {
    const qtyRaw = qtyMap[product.idChiTietSanPham];
    const qty = parseInt(qtyRaw || '1') || 1;
    if (!qtyRaw || qty < 1) {
      toast.error('Số lượng phải lớn hơn 0!');
      return;
    }
    if (qty > product.soLuong) {
      toast.error('Vượt quá số lượng tồn kho!');
      return;
    }
    if (product.soLuong === 0) {
      toast.error('Sản phẩm này đã hết hàng!');
      return;
    }
    onSelectAction(product, qty);
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  // Thêm sản phẩm vào giỏ hàng qua modal
  const handleModalAdd = () => {
    if (!selectedProductForModal) return;
    const qty = parseInt(modalQty || '1') || 1;
    console.log('DEBUG: modalQty =', modalQty, ', parsed qty =', qty, ', product =', selectedProductForModal);
    if (qty < 1) {
      toast.error('Số lượng phải lớn hơn 0!');
      return;
    }
    if (qty > selectedProductForModal.soLuong) {
      toast.error('Vượt quá số lượng tồn kho!');
      return;
    }
    onSelectAction(selectedProductForModal, qty);
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
    setSelectedProductForModal(null);
    setModalQty('1');
  };

  // Đặt lại filter và số lượng
  const handleReset = () => {
    setBrand('');
    setCategory('');
    setColor('');
    setSize('');
    setSearch('');
    setQtyMap({});
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        width: '90vw',
        maxWidth: 1200,
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        padding: 20,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#333' }}>Chọn sản phẩm</h2>
          <button
            onClick={onCloseAction}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
              padding: 5
            }}
          >
            ×
          </button>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select value={brand} onChange={e => setBrand(e.target.value)} style={{ minWidth: 120, borderRadius: 4, padding: 6 }}>
            <option value="">Thương hiệu</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ minWidth: 120, borderRadius: 4, padding: 6 }}>
            <option value="">Danh mục</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={color} onChange={e => setColor(e.target.value)} style={{ minWidth: 100, borderRadius: 4, padding: 6 }}>
            <option value="">Màu sắc</option>
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={size} onChange={e => setSize(e.target.value)} style={{ minWidth: 100, borderRadius: 4, padding: 6 }}>
            <option value="">Kích thước</option>
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="Tìm kiếm tên, mã..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, borderRadius: 4, padding: 6, border: '1px solid #ccc' }}
          />
          <button onClick={handleReset} style={{ borderRadius: 4, padding: '6px 16px', background: '#eee', border: '1px solid #bbb', fontWeight: 600, cursor: 'pointer' }}>Đặt lại</button>
        </div>

        {/* Products Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>STT</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Mã</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tên</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Danh mục</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Thương hiệu</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Màu sắc</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Kích thước</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Giá</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>SL</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                filtered.map((product, index) => (
                  <tr key={product.idChiTietSanPham} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px' }}>{index + 1}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{product.maSanPham}</td>
                    <td style={{ padding: '12px 8px' }}>{product.tenSanPham}</td>
                    <td style={{ padding: '12px 8px' }}>{product.tenDanhMuc}</td>
                    <td style={{ padding: '12px 8px' }}>{product.tenThuongHieu}</td>
                    <td style={{ padding: '12px 8px' }}>{product.tenMauSac}</td>
                    <td style={{ padding: '12px 8px' }}>{product.tenKichCo}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {product.gia?.toLocaleString()} ₫
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {product.soLuong}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedProductForModal(product);
                          setModalQty('1');
                        }}
                        disabled={product.soLuong === 0}
                        style={{
                          background: product.soLuong > 0 ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 16px',
                          cursor: product.soLuong > 0 ? 'pointer' : 'not-allowed',
                          fontSize: 14,
                          fontWeight: 'bold'
                        }}
                        title={product.soLuong === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                      >
                        {product.soLuong > 0 ? 'Thêm' : 'Hết hàng'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <button
            onClick={onCloseAction}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
      {selectedProductForModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setSelectedProductForModal(null)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 12 }}>Nhập số lượng muốn thêm</h3>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={selectedProductForModal.soLuong}
              value={modalQty}
              onChange={e => {
                let v = e.target.value.replace(/[^0-9]/g, '');
                if (v && parseInt(v) > selectedProductForModal.soLuong) {
                  toast.error('Vượt quá số lượng tồn kho!');
                }
                setModalQty(v);
              }}
              onBlur={e => {
                let v = e.target.value.replace(/[^0-9]/g, '');
                let num = parseInt(v) || 1;
                if (num < 1) num = 1;
                if (num > selectedProductForModal.soLuong) num = selectedProductForModal.soLuong;
                setModalQty(num.toString());
              }}
              style={{ width: 80, padding: 6, borderRadius: 4, border: '1px solid #ccc', textAlign: 'center', fontSize: 18, marginBottom: 8 }}
              autoFocus
            />
            {modalQty && parseInt(modalQty) > selectedProductForModal.soLuong && (
              <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>
                Vượt quá số lượng tồn kho!
              </div>
            )}
            <div style={{ marginBottom: 16 }}>Số lượng còn: <b>{selectedProductForModal.soLuong}</b></div>
            <button
              onClick={handleModalAdd}
              disabled={(() => {
                const qty = parseInt(modalQty || '1') || 1;
                return !modalQty || qty < 1 || qty > selectedProductForModal.soLuong;
              })()}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 