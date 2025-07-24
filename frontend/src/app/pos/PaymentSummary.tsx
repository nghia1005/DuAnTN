'use client';
import React from 'react';
import { CartItem } from './CartList';
import { Voucher } from './VoucherSelector';
import QrSelector from './QrSelector';

interface Props {
  cart: CartItem[];
  voucher: Voucher | null;
  shipping: number;
  originalShipping?: number;
  paymentMethod?: string;
  selectedQR?: any;
  onSelectQR?: (qr: any) => void;
}

export default function PaymentSummary({ cart, voucher, shipping, originalShipping = 0, paymentMethod, selectedQR, onSelectQR }: Props) {
  const total = cart.reduce((sum, item) => sum + item.gia * item.qty, 0);
  
  // Helper tính toán giảm giá
  const calculateDiscount = (voucher: Voucher | null, total: number, shipping: number, originalShipping: number): number => {
    if (!voucher) return 0;
    if (voucher.kieuGiamGia === 'PERCENT') {
      const discountAmount = (total * voucher.phanTramGiamGia) / 100;
      return voucher.giaTriToiDa > 0 ? 
        Math.min(discountAmount, voucher.giaTriToiDa) : 
        discountAmount;
    } else if (voucher.kieuGiamGia === 'FIXED') {
      return voucher.giaTriToiDa;
    } else if (voucher.kieuGiamGia === 'FREE_SHIP') {
      return originalShipping;
    }
    return 0;
  };
  
  const isFreeShip = voucher && voucher.kieuGiamGia === 'FREE_SHIP';
  const discount = !isFreeShip ? calculateDiscount(voucher, total, shipping, originalShipping) : 0;
  const displayedShipping = isFreeShip ? 0 : Number(shipping || 0);
  const final = total - discount + displayedShipping;

  return (
    <div style={{ margin: '16px 0', background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
      <div>Tổng tiền: <b>{(total || 0).toLocaleString()}đ</b></div>
      {discount > 0 && (
        <div>Giảm giá: <b>-{discount.toLocaleString()}đ</b></div>
      )}
      <div>Phí ship: <b>{(displayedShipping || 0).toLocaleString()}đ</b></div>
      <div style={{ fontSize: 18, marginTop: 8 }}>Thanh toán: <b>{(final || 0).toLocaleString()}đ</b></div>
    </div>
  );
} 