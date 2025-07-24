import React, { useState, useEffect } from "react";

// Danh sách mã QR mẫu, bạn có thể sửa/thêm tùy ý
const qrOptions = [
  {
    id: "acb",
    name: "ACB - Nguyễn Văn Nghĩa",
    account: "SỐ TÀI KHOẢN",
    bank: "ACB",
    qrImage: "/qr/acb.jpg",
  },
  {
    id: "vcb",
    name: "Vietcombank - Nguyễn Văn A",
    account: "0123456789",
    bank: "Vietcombank",
    qrImage: "/qr/acb.jpg",
  },
];

interface QrSelectorProps {
  amount: number; // Số tiền cần thanh toán
  onSelect?: (qr: typeof qrOptions[0]) => void;
  showOnlySelect?: boolean;
  triggerNode?: React.ReactNode; // Cho phép custom nút bấm
  autoOpen?: boolean;
}

const QrSelector: React.FC<QrSelectorProps> = ({ amount, onSelect, showOnlySelect, triggerNode, autoOpen = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<typeof qrOptions[0] | null>(null);

  useEffect(() => {
    if (autoOpen) setShowModal(true);
  }, [autoOpen]);

  const handleSelect = (qr: typeof qrOptions[0]) => {
    setSelectedQR(qr);
    setShowModal(false);
    onSelect && onSelect(qr);
  };

  return (
    <div style={{ display: 'inline' }}>
      {triggerNode ? (
        <span onClick={() => setShowModal(true)}>{triggerNode}</span>
      ) : (
        <button type="button" onClick={() => setShowModal(true)}>
          QR
        </button>
      )}
      {showModal && (
        <div className="modal-bg">
          <div className="modal">
            <h3>Chọn mã QR</h3>
            <button onClick={() => setShowModal(false)}>Đóng</button>
            <div style={{ display: "flex", gap: 16 }}>
              {qrOptions.map((qr) => (
                <div
                  key={qr.id}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #ccc",
                    padding: 8,
                  }}
                  onClick={() => handleSelect(qr)}
                >
                  <img src={qr.qrImage} alt={qr.name} width={100} />
                  <div>{qr.name}</div>
                  <div>
                    {qr.account} ({qr.bank})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nếu không phải chỉ chọn thì hiển thị QR lớn */}
      {!showOnlySelect && selectedQR && (
        <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 12, marginTop: 12, fontSize: 16 }}>
          <div style={{ fontWeight: 700 }}>
            {selectedQR.bank} - {selectedQR.name}
          </div>
          <div>
            STK: <b>{selectedQR.account}</b> ({selectedQR.bank})
          </div>
          <div>
            Số tiền: <b>{amount.toLocaleString()}đ</b>
          </div>
          <div>
            Nội dung: Chuyển tiền thanh toán QR CODE
          </div>
        </div>
      )}

      {/* CSS cho modal */}
      <style jsx>{`
        .modal-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          min-width: 300px;
        }
      `}</style>
    </div>
  );
};

export default QrSelector; 