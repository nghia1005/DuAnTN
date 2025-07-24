"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./login.module.css";
import { useRouter } from "next/navigation";

console.log("render login page");

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score;
}

// const strengthText = ["Yếu", "Trung bình", "Khá", "Mạnh", "Rất mạnh"];
// const strengthColor = ["#e57373", "#ffb74d", "#ffd600", "#81c784", "#388e3c"];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(10);
  const errorRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input đầu tiên khi vào trang
  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // Đếm ngược lockout
  useEffect(() => {
    if (lockout && lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lockout && lockoutTime === 0) {
      setLockout(false);
      setLockoutTime(10);
      setFailCount(0);
    }
  }, [lockout, lockoutTime]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    console.log("submit login form");
    e.preventDefault();
    if (lockout) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenTaiKhoan: username,
          matKhau: password
        })
      });
      const result = await res.json();
      console.log("FULL LOGIN RESPONSE:", result); // 👈 Thêm log toàn bộ kết quả trả về
      // Sửa đoạn này để lấy user đúng chuẩn backend trả về
      const user = result.data || result.user || result.taiKhoan || result.khachHang;
      console.log("user login result:", user); // DEBUG
      // Ép kiểu idVaiTro sang số nếu có
      const idVaiTro = user?.idVaiTro !== undefined && user?.idVaiTro !== null ? Number(user.idVaiTro) : undefined;
      console.log("DEBUG idVaiTro:", idVaiTro, typeof idVaiTro);
      if (!user) {
        setError("Phản hồi không hợp lệ từ máy chủ! (Thiếu thông tin tài khoản)");
        setLoading(false);
        return;
      }
      if (result.success) {
        // Chuẩn hóa vai trò
        let vaiTro = user?.vaiTro || user?.role || user?.tenVaiTro || user?.roleName || "";
        if (!vaiTro && typeof idVaiTro !== "undefined") {
          if (idVaiTro === 1) vaiTro = "QUAN_TRI_VIEN";
          else if (idVaiTro === 2) vaiTro = "NHAN_VIEN";
          else if (idVaiTro === 3) vaiTro = "KHACH_HANG";
        }
        let userToSave = { ...user, vaiTro };
        // Nếu là khách hàng thì lấy thêm thông tin chi tiết
        if (idVaiTro === 3) {
          let idKhachHang = user.idKhachHang;
          // Nếu chưa có idKhachHang, tìm theo tên tài khoản
          if (!idKhachHang && user.tenTaiKhoan) {
            try {
              const resSearch = await fetch(`http://localhost:8080/khach-hang/tim-kiem/ten/${encodeURIComponent(user.tenKhachHang || user.tenTaiKhoan)}`);
              if (resSearch.ok) {
                const searchData = await resSearch.json();
                // searchData có thể là mảng, lấy phần tử đầu tiên
                if (Array.isArray(searchData) && searchData.length > 0) {
                  idKhachHang = searchData[0].idKhachHang;
                } else if (searchData && searchData.idKhachHang) {
                  idKhachHang = searchData.idKhachHang;
                }
              }
            } catch (err) {}
          }
          if (idKhachHang) {
            try {
              const resDetail = await fetch(`http://localhost:8080/khach-hang/chi-tiet/${idKhachHang}`);
              if (resDetail.ok) {
                const fullUser = await resDetail.json();
                const detail = fullUser.data || fullUser;
                userToSave = { ...detail, vaiTro };
              }
            } catch (err) {}
          }
        }
        localStorage.setItem('user', JSON.stringify(userToSave));
        // Phân quyền chuyển hướng
        if (typeof idVaiTro !== 'undefined' && idVaiTro !== null) {
          if (idVaiTro === 3) {
            setSuccess(true);
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(() => {
                router.push('/shop');
              }, 500);
            }, 1200);
            return;
          } else if (idVaiTro === 1 || idVaiTro === 2) {
            setSuccess(true);
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
            }, 1200);
            return;
          } else {
            setSuccess(true);
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
            }, 1200);
            return;
          }
        }
        // Nếu không có idVaiTro thì fallback kiểm tra role như cũ
        const rawRole = user?.role || user?.vaiTro || user?.tenVaiTro || user?.roleName || '';
        const role = rawRole
          .toUpperCase()
          .normalize('NFD').replace(/[  - 6f]/g, '')
          .replace(/\s/g, '')
          .replace('KHACHHANG', 'KHACH_HANG');
        if (role === 'KHACH_HANG') {
          setSuccess(true);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              router.push('/shop');
            }, 500);
          }, 1200);
        } else if (role === 'NHAN_VIEN' || role === 'QUAN_TRI_VIEN') {
          setSuccess(true);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              router.push('/dashboard');
            }, 500);
          }, 1200);
        } else {
          setSuccess(true);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              router.push('/dashboard');
            }, 500);
          }, 1200);
        }
        return;
      } else {
        setFailCount(f => f + 1);
        setError(result.message || "Đăng nhập thất bại!");
        setLoading(false);
        if (errorRef.current) {
          errorRef.current.classList.remove(styles.shake);
          void errorRef.current.offsetWidth;
          errorRef.current.classList.add(styles.shake);
        }
        if (failCount + 1 >= 3) {
          setLockout(true);
        }
      }
    } catch (err) {
      setError("Không thể kết nối tới máy chủ!");
      setLoading(false);
    }
  };

  // Nhấn Enter submit form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  // Tab chuyển input
  const handleTab = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      if (document.activeElement === userRef.current) {
        e.preventDefault();
        passRef.current?.focus();
      } else if (document.activeElement === passRef.current) {
        e.preventDefault();
        userRef.current?.focus();
      }
    }
  };

  // Press & hold con mắt để hiện mật khẩu
  const handleEyeDown = () => setShowPassword(true);
  const handleEyeUp = () => setShowPassword(false);

  // Độ mạnh mật khẩu
  const strength = getPasswordStrength(password);

  return (
    <div className={styles.loginBg}>
      <div className={styles.loginContainer + (fadeOut ? " " + styles.fadeOut : "")}>  
        <div className={styles.loginLeft}>
          <h2>
            Đăng nhập
            <br />
            <span>SoleKingStore</span>
          </h2>
          <form className={styles.loginForm} onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.floatingGroup}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className={username ? styles.filled : ""}
                required
                ref={userRef}
                onKeyDown={e => { handleKeyDown(e); handleTab(e); }}
                tabIndex={1}
              />
              <label htmlFor="username">Tên tài khoản</label>
            </div>
            <div className={styles.floatingGroup}>
              <div className={styles.passwordInput}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={password ? styles.filled : ""}
                  required
                  ref={passRef}
                  onKeyDown={e => { handleKeyDown(e); handleTab(e); }}
                  tabIndex={2}
                />
                <span
                  className={styles.eyeIcon}
                  onMouseDown={handleEyeDown}
                  onMouseUp={handleEyeUp}
                  onMouseLeave={handleEyeUp}
                  onTouchStart={handleEyeDown}
                  onTouchEnd={handleEyeUp}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
                <label htmlFor="password">Mật khẩu</label>
              </div>
            </div>
            {error && (
              <div ref={errorRef} className={styles.errorMsg}>
                {error}
              </div>
            )}
            {lockout && (
              <div className={styles.lockoutMsg}>
                Đăng nhập sai quá nhiều! Vui lòng thử lại sau {lockoutTime}s.
              </div>
            )}
            <button type="submit" className={styles.loginBtn} disabled={loading || lockout}>
              {loading ? (
                <span className={styles.spinner}></span>
              ) : (
                "Đăng nhập"
              )}
            </button>
            {success && (
              <div className={styles.toastSuccess}>Đăng nhập thành công!</div>
            )}
          </form>

          <div style={{textAlign: 'center', marginTop: 12}}>
            <a href="/forgot-password" style={{color: '#b59d3a', textDecoration: 'underline', fontSize: '0.98rem', cursor: 'pointer', marginRight: 16}}>Quên mật khẩu?</a>
          </div>
        </div>
        <div className={styles.loginRight}>
          <img
            src="/logo.jpg"
            alt="SoleKingStore Logo"
            className={styles.logoImg}
          />
          <div className={styles.rightText}>
            <b>WEBSITE BÁN GIÀY<br />SNEAKER<br />SOLEKINGSTORE</b>
          </div>
        </div>
      </div>
    </div>
  );
} 