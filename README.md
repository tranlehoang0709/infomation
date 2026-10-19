# Personal Portfolio

Website portfolio cá nhân với frontend Next.js/TypeScript/Tailwind CSS, backend NestJS và Prisma/MySQL. Các module hiện có mã nguồn gồm Profile, Experiences, Projects, Media, Interests và Admin Dashboard. Education, Certificates và Skills chưa có API hoặc giao diện quản trị/công khai hoàn chỉnh.

## Bắt đầu

Xem [hướng dẫn cài đặt, chạy và triển khai](docs/SETUP.md). Trang công khai: `/`; đăng nhập quản trị: `/admin/login`; dashboard: `/admin/dashboard`; form Profile: `/admin`.

## Database

Prisma ánh xạ schema theo DDL MySQL chủ dự án cung cấp. Ứng dụng không tạo database/table và không chạy migration hoặc `db push`.

## Database và phạm vi

Prisma ánh xạ schema theo DDL MySQL của dự án. Ứng dụng không tự tạo database/bảng và không chạy `migrate` hoặc `db push`. Portfolio công khai chỉ được đọc khi `is_published = true`.

Profile, Experiences, Projects, Media, Interests và Admin Dashboard có API/UI trong phiên bản hiện tại. Education, Certificates và Skills chưa được triển khai end-to-end; xem trạng thái và hướng dẫn chạy trong [docs/SETUP.md](docs/SETUP.md).
