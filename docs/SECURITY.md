# Security — Profile phase

- Không có endpoint đăng ký. Tài khoản chủ sở hữu được tạo thủ công bằng script CLI; script dừng nếu email đã tồn tại.
- Cookie phiên JWT dùng `HttpOnly`, `SameSite=Strict`, hạn 12 giờ; production bật `Secure`. `JWT_SECRET` bắt buộc dài tối thiểu 32 ký tự.
- CORS chỉ cho phép `FRONTEND_ORIGIN`; các endpoint cập nhật Profile kiểm tra phiên và chỉ truy cập portfolio gắn với user trong phiên.
- Email/mật khẩu sai trả cùng thông báo; mật khẩu được kiểm tra bằng bcrypt. User `is_active=false` không đăng nhập/tiếp tục phiên được.
- Script tạo chủ sở hữu dùng bcrypt. Cách băm của user đã tồn tại chưa được xác định từ DDL; cần xác nhận trước khi dùng các tài khoản cũ.
- Chưa có giới hạn tốc độ đăng nhập trong giai đoạn này. Cần bổ sung trước khi đưa API công khai ra Internet.

## Prisma CLI dependency override

Prisma 6.19.3 khóa `deepmerge-ts` ở 7.1.5 qua `@prisma/config`; phiên bản dưới 8 bị ảnh hưởng bởi [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Override gốc dùng phiên bản 8.x đã vá. Theo mã đang cài, `@prisma/config` chỉ truyền export `deepmerge` cho bộ nạp config. Prisma đang theo dõi việc nâng dependency trong [prisma/prisma#30052](https://github.com/prisma/prisma/issues/30052). Xác nhận lại khi nâng Prisma và gỡ override sau khi upstream đã cập nhật.

## Vận hành

- Thay toàn bộ giá trị mẫu `.env.example`; không đưa `.env` vào Git.
- Dùng HTTPS trong production để cookie `Secure` hoạt động.
- Không chạy `prisma db push`, migrations hoặc DDL từ ứng dụng này; database hiện có được giữ nguyên.
