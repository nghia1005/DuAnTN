package org.example.duan.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailServiceOne {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceOne.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendAccountInfo(String to, String username, String password, String fullName) {
        try {
            if (mailSender != null) {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Thông tin tài khoản SoleKing Store");

                String htmlContent =
                    "<div style='font-family:sans-serif;'>" +
                    "<div style='display:flex;align-items:center;gap:18px;margin-bottom:16px;'>" +
                    "  <img src='https://res.cloudinary.com/dqlemoknn/image/upload/v1751608918/logo-removebg-preview_ujpag6.png' alt='SoleKing Logo' style='width:100px;'/>" +
                    "  <span style='font-size:2rem;font-weight:700;color:#222;font-family:sans-serif;'>SoleKing Store</span>" +
                    "</div>" +
                    "<h2 style='color:#222;'>Xin chào " + fullName + "!</h2>" +
                    "<p style='color:#222;font-size:1.1rem;font-weight:600;margin-bottom:8px;'>Chào mừng bạn đã trở thành khách hàng của SoleKing Store!</p>" +
                    "<p style='color:#222;'>Chúng tôi rất vinh dự được đồng hành cùng bạn trên hành trình khám phá những sản phẩm thời trang đẳng cấp và dịch vụ tận tâm nhất.</p>" +
                    "<p style='color:#222;'>Cảm ơn bạn đã tin tưởng lựa chọn SoleKing Store. Chúng tôi cam kết mang đến cho bạn trải nghiệm mua sắm tuyệt vời cùng nhiều ưu đãi hấp dẫn dành riêng cho khách hàng thân thiết.</p>" +
                    "<p style='color:#222;'>Tài khoản của bạn đã được tạo thành công!</p>" +
                    "<div style='color:#222; margin-top: 12px;'>" +
                    "  <div style='font-weight:bold;'>Tên đăng nhập: " + username + "</div>" +
                    "  <div style='font-weight:bold;'>Mật khẩu: " + password + "</div>" +
                    "</div>" +
                    "<p style='color:#222;'>Hãy đăng nhập và khám phá ngay những sản phẩm mới nhất cùng các chương trình ưu đãi đặc biệt chỉ dành cho bạn!</p>" +
                    "<p style='color:#222;'>Nếu cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi qua email hoặc hotline trên website.</p>" +
                    "<p style='color:#222;'>Trân trọng!<br/>Đội ngũ SoleKing Store</p>" +
                    "</div>";

                helper.setText(htmlContent, true); // true = isHtml

                mailSender.send(mimeMessage);
                logger.info("Email sent successfully to: {}", to);
            } else {
                // Log thông tin tài khoản khi chưa cấu hình email
                logger.info("=== THÔNG TIN TÀI KHOẢN MỚI ===");
                logger.info("Email: {}", to);
                logger.info("Tên nhân viên: {}", fullName);
                logger.info("Tên đăng nhập: {}", username);
                logger.info("Mật khẩu: {}", password);
                logger.info("================================");
            }
        } catch (Exception e) {
            logger.error("Error sending email: {}", e.getMessage());
            // Log thông tin tài khoản khi có lỗi gửi email
            logger.info("=== THÔNG TIN TÀI KHOẢN MỚI (Gửi email thất bại) ===");
            logger.info("Email: {}", to);
            logger.info("Tên nhân viên: {}", fullName);
            logger.info("Tên đăng nhập: {}", username);
            logger.info("Mật khẩu: {}", password);
            logger.info("================================");
        }
    }
}

