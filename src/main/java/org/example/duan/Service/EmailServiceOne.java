package org.example.duan.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(to);
                message.setSubject("Thông tin tài khoản SoleKing Store");
                message.setText(
                        "Xin chào " + fullName + "\n\n" +
                                "Tài khoản của bạn đã được tạo thành công!\n\n" +
                                "Thông tin đăng nhập:\n" +
                                "- Tên đăng nhập: " + username + "\n" +
                                "- Mật khẩu: " + password + "\n\n" +
//                                "Vui lòng đăng nhập tại: http://localhost:3000/login\n\n" +
                                "Trân trọng,\n" +
                                "Đội ngũ SoleKing Store"
                );

                mailSender.send(message);
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

