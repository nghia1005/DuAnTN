"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const errorRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!username || !password || !confirmPassword || !email || !phone || !fullName) {
            setError("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (password !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp!");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenTaiKhoan: username,
                    matKhau: password,
                    email: email,
                    soDienThoai: phone,
                    tenNhanVien: fullName
                })
            });
            const result = await res.json();
            if (result.success) {
                setSuccess(result.message || "Đăng ký thành công!");
                setTimeout(() => router.push("/login"), 1800);
            } else {
                setError(result.message || "Đăng ký thất bại!");
            }
        } catch (err) {
            setError("Không thể kết nối tới máy chủ!");
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(120deg, #cbb86c 0%, #f3e9c7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 24,
                    boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
                    padding: 36,
                    minWidth: 320,
                    maxWidth: 380,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 18
                }}
            >
                <h2 style={{ color: "#b59d3a", textAlign: "center", marginBottom: 18 }}>Đăng ký tài khoản</h2>
                <input
                    type="text"
                    placeholder="Tên tài khoản"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                <input
                    type="text"
                    placeholder="Tên nhân viên"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    style={{ padding: 12, borderRadius: 8, border: "2px solid #cbb86c", marginBottom: 6 }}
                />
                {error && (
                    <div ref={errorRef} style={{ color: "#fff", background: "#e57373", borderRadius: 8, padding: "7px 12px", margin: "4px 0", textAlign: "center", fontWeight: 500 }}>{error}</div>
                )}
                {success && (
                    <div style={{ color: "#6b5b1e", background: "#cbb86c", borderRadius: 8, padding: "7px 12px", margin: "4px 0", textAlign: "center", fontWeight: 600 }}>{success}</div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: 10,
                        padding: "12px 0",
                        background: "linear-gradient(90deg, #cbb86c 0%, #a08a2a 100%)",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        border: "none",
                        borderRadius: 10,
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(200,180,100,0.15)",
                        letterSpacing: 1
                    }}
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>
            </form>
        </div>
    );
} 