# Database — phạm vi Profile

Prisma map toàn bộ bảng trong DDL do chủ dự án cung cấp. Khóa chính và khóa ngoại `BIGINT UNSIGNED` dùng Prisma `BigInt`; thời gian `DATETIME(3)`, `DATE`, `TEXT`, `JSON` và unique key được ánh xạ sang kiểu MySQL tương ứng. Khóa ngoại composite của `portfolios.published_revision_id` được giữ ở dạng scalar trong Prisma để không thêm unique index không có trong DDL. Frontend/backend cài dependencies độc lập để khóa dependency bảo mật riêng từng app.

Không tự tạo database/table, không chạy migration hoặc `db push`. Lệnh `owner:create` là thao tác có chủ ý do người vận hành chạy sau khi xác nhận database đã có schema; lệnh chỉ thêm một user và portfolio trong transaction, không sửa nếu email đã có.

Kết nối tới database thật chưa được kiểm chứng trong môi trường phát triển vì chưa có `DATABASE_URL` được cấu hình ở workspace.

## Approved Experience addition

The supplied schema has no separate achievements field. The approved additive SQL file `backend/prisma/manual_migrations/add_experience_achievements.sql` adds nullable JSON column `experiences.achievements` only. It is executed directly with Prisma `db execute`, not through `prisma migrate`, so it does not create a migration-history table. The SQL has not been run in this workspace because no live `DATABASE_URL` is configured. Before applying it, inspect the live table and take a database backup.

Experience logo links reuse `media_assets` and `portfolio_media`; no media tables or foreign-key relationships are changed.
