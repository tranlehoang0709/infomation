# Cài đặt và chạy

## Yêu cầu

- Node.js 24.x và npm.
- MySQL hiện có với schema `personal_portfolio` đã được tạo theo DDL đã cung cấp.
- Tài khoản MySQL có quyền đọc/ghi những bảng ứng dụng sử dụng. Không dùng quyền tạo/xóa schema nếu không cần.

## Cấu hình môi trường

1. Sao chép `.env.example` thành `.env` ở thư mục gốc.
2. Điền `DATABASE_URL` theo dạng `mysql://user:password@host:3306/personal_portfolio`. Mã hóa ký tự đặc biệt trong tên user/mật khẩu theo URL encoding.
3. Thay `JWT_SECRET` bằng giá trị ngẫu nhiên dài ít nhất 32 ký tự; đặt `FRONTEND_ORIGIN` đúng origin của frontend.
4. Đặt `PORTFOLIO_SLUG` khớp `portfolios.slug` trong MySQL. `NEXT_PUBLIC_API_URL` là URL API mà trình duyệt truy cập được, ví dụ `http://localhost:4000/api` khi phát triển.
5. Đặt `NEXT_PUBLIC_SITE_URL` thành origin chính thức của website (ví dụ `https://example.com`) trước khi build để canonical URL, sitemap và liên kết chia sẻ mạng xã hội dùng đúng domain production.

Không gửi file `.env` hoặc mật khẩu qua chat; `.env` đã được Git ignore.

## Cài dependencies

Chạy `npm install` tại thư mục gốc để cài lệnh chạy song song. Sau đó chạy `npm install` riêng trong thư mục `backend`, rồi trong `frontend`. Mỗi ứng dụng có lockfile riêng để backend áp dụng security override Prisma mà npm hiện không truyền qua workspace link.

## Tạo Prisma Client và tài khoản chủ sở hữu

1. Từ `backend`, chạy `npm run db:generate`. Lệnh này sinh Prisma Client từ schema; không kết nối để thay đổi database.
2. Nếu bảng `users` và `portfolios` chưa có tài khoản/chủ portfolio, đặt `OWNER_EMAIL`, `OWNER_PASSWORD`, `PORTFOLIO_TITLE` trong `.env` rồi chạy từ thư mục gốc `npm run owner:create --prefix backend`.
3. Script tạo user và portfolio trong một transaction, không tạo bảng. Nếu email đã tồn tại, script dừng mà không đổi tài khoản hiện có. Mật khẩu mới dùng bcrypt; sau khi chạy, xóa `OWNER_PASSWORD` khỏi `.env` nếu không còn cần.

Không chạy script tạo owner nếu các hàng tương ứng đã tồn tại. DDL không cho biết định dạng hash của user đã có; tài khoản cũ cần được xác nhận tương thích bcrypt trước khi dùng.

## Chạy ứng dụng

Từ thư mục gốc, chạy `npm run dev`.

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Trang Profile công khai: `/` (không cần đăng nhập; chỉ đọc khi portfolio đã xuất bản).
- Đăng nhập quản trị: `/admin/login`
- Form Profile: `/admin`
- Work experience: `/admin/experiences`

## Work experience migration and uploads

Before applying the approved SQL change, confirm the live `experiences` table matches the supplied DDL, does not already contain `achievements`, and take a database backup. Then run `npm run db:apply:experience-achievements --prefix backend` from the repository root. It executes only the explicit `ALTER TABLE` file and does not create a Prisma migration-history table. Do not run it against production until the target database is confirmed and backed up. Run `npm run db:generate --prefix backend` after the column is applied.

Run the Experience and Media unit tests with `npm run test --prefix backend`.

Set `MEDIA_STORAGE_DIR` in `.env` to a writable directory. The default `../storage/uploads` resolves from the backend working directory to the repository's ignored `storage/uploads` folder. The server accepts JPEG, PNG, GIF, WebP, and PDF files up to 10 MB. See the Media library section below for storage and public access rules.

## Media library

No database migration is required for Media. The implementation uses the existing `media_assets`, `portfolio_media`, and profile media ID columns. Keep `MEDIA_STORAGE_DIR` outside any web server public/static directory and ensure the backend account can read and write it.

After signing in, open `/admin/media` to upload, preview, and review stored images/PDFs. Upload and library endpoints require the admin session: `POST /api/media/admin/upload`, `GET /api/media/admin`, `GET /api/media/admin/:id/file`, and `DELETE /api/media/admin/:id`. Files are limited to 10 MB; extension, declared MIME type, and file signature must agree for JPEG, PNG, GIF, WebP, or PDF. Filenames on disk are generated UUIDs.

Media linked to profile fields or portfolio content cannot be deleted. Unlink it from the relevant content form first. If the storage file is already missing, the library can remove its unused database metadata safely. Public file delivery is limited to linked profile avatar/cover/CV, visible project images, visible experience logos, visible interest icons, and visible certificate files on the published portfolio. PDFs are delivered as attachments.

## Tình trạng module hiện tại

Profile, education, certificates, skills, experience, projects, media, interests, owner authentication, and the admin dashboard use the existing schema and owner-scoped APIs. These sections need no database migration.

Dashboard API là `GET /api/admin/dashboard` và yêu cầu cookie admin hợp lệ. Thống kê được truy vấn từ MySQL theo portfolio của user đăng nhập; database không được tạo lại hoặc migrate bởi hướng dẫn chạy này.

## Build và chạy production

1. Cấu hình `.env` ở thư mục gốc với `DATABASE_URL`, `JWT_SECRET` tối thiểu 32 ký tự, `FRONTEND_ORIGIN`, `PORTFOLIO_SLUG`, `PORT`, `MEDIA_STORAGE_DIR` và `NEXT_PUBLIC_API_URL`. Dùng HTTPS và đặt `FRONTEND_ORIGIN` là origin chính xác của frontend trong production.
2. Đặt `NEXT_PUBLIC_API_URL` trước khi build frontend vì biến `NEXT_PUBLIC_*` được đóng vào bundle. API cần truy cập được từ trình duyệt của người dùng.
3. Chạy `npm run build` ở thư mục gốc. Lệnh này build NestJS trước rồi Next.js.
4. Khởi chạy API bằng `npm run start:prod --prefix backend` và frontend bằng `npm run start --prefix frontend`. Dùng process manager của môi trường triển khai để tự khởi động lại dịch vụ.
5. Giữ `MEDIA_STORAGE_DIR` ngoài static/public directory; mount persistent storage và sao lưu thư mục này cùng database. Đảm bảo tiến trình backend có quyền đọc/ghi.

Khi phát triển Windows, `install-dependencies.bat` cài dependencies và generate Prisma Client; `run.bat` chạy cả API và frontend. Hai script không tạo hoặc sửa bảng MySQL. `.env` không được commit.

## Kiểm tra

- `npm test --prefix backend` chạy unit tests có sẵn cho validation, service logic, quyền controller, auth cookie, upload/media và dashboard.
- `npm run build --prefix backend` và `npm run build --prefix frontend` kiểm tra compile/type/build.
- Các lệnh trên không thay cho kiểm thử tích hợp với MySQL đang chạy. Xác nhận `DATABASE_URL`, đối chiếu schema thực tế với `backend/prisma/schema.prisma`, đăng nhập bằng tài khoản owner được cấp sẵn, rồi kiểm thử CRUD, 401 khi không đăng nhập, public visibility và upload trong môi trường mục tiêu.
