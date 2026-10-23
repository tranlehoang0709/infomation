# Personal Portfolio

Personal portfolio built with Next.js, NestJS, TypeScript, Tailwind CSS, Prisma, and MySQL. Profile, education, certificates, skills, experience, projects, media, interests, and the admin dashboard use the existing application schema.

## Bắt đầu

Xem [hướng dẫn cài đặt, chạy và triển khai](docs/SETUP.md). Trang công khai: `/`; đăng nhập quản trị: `/admin/login`; dashboard: `/admin/dashboard`; form Profile: `/admin`.

## Database

Prisma ánh xạ schema theo DDL MySQL chủ dự án cung cấp. Ứng dụng không tạo database/table và không chạy migration hoặc `db push`.

## Database và phạm vi

Prisma ánh xạ schema theo DDL MySQL của dự án. Ứng dụng không tự tạo database/bảng và không chạy `migrate` hoặc `db push`. Portfolio công khai chỉ được đọc khi `is_published = true`.

Profile, Education, Certificates, Skills, Experiences, Projects, Media, Interests, and Admin Dashboard have API/UI flows. See [docs/SETUP.md](docs/SETUP.md) for setup and run instructions.
