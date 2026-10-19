# API hiện có

Base URL: `/api`. JSON request/response. Cookie xác thực `portfolio_session` là HttpOnly, SameSite Strict, thời hạn 12 giờ.

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | Công khai | Kiểm tra email/mật khẩu với tài khoản đang hoạt động; đặt cookie phiên. |
| POST | `/auth/logout` | Công khai | Xóa cookie phiên. |
| GET | `/auth/session` | Chủ sở hữu | Xác minh cookie và trạng thái tài khoản. |
| GET | `/profile/public` | Công khai | Đọc Profile của portfolio có slug cấu hình và `is_published=true`. |
| GET | `/profile/admin` | Đã đăng nhập | Đọc Profile thuộc portfolio của chính user trong phiên. |
| PATCH | `/profile/admin` | Đã đăng nhập | Tạo/cập nhật các trường Profile theo portfolio của user trong phiên. |

## Work experience

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/experiences/public` | Public | Reads visible experience records for the configured, published portfolio, ordered by `sortOrder`. |
| GET | `/experiences/admin` | Authenticated owner | Lists all experience records for the signed-in owner's portfolio. |
| POST | `/experiences/admin` | Authenticated owner | Creates an experience record and optionally links an owner-uploaded company logo. |
| PATCH | `/experiences/admin/:id` | Authenticated owner | Replaces the record fields for an experience owned by the signed-in user. |
| DELETE | `/experiences/admin/:id` | Authenticated owner | Deletes the owned record and its media links. |
| POST | `/media/admin/upload` | Authenticated owner | Uploads JPEG, PNG, GIF, WebP, or PDF (maximum 10 MB) to the configured storage directory and records metadata in `media_assets`. |
| GET | `/media/admin/:id/file` | Authenticated owner | Streams a media file belonging to the signed-in owner's portfolio. |
| GET | `/media/:id/file` | Public | Streams an image only while it is linked as the company logo of a visible experience on the configured published portfolio. |

Experience fields use the existing `experiences` table. `achievements` is stored as JSON. Logo associations use the existing `portfolio_media` table with `entity_type=experience` and `media_role=company_logo`. The additive migration adds only `experiences.achievements`.

## Media

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/media/admin` | Authenticated owner | Lists the owner's media assets and references. |
| POST | `/media/admin/upload` | Authenticated owner | Stores a validated image or PDF and writes metadata to `media_assets`. |
| GET | `/media/admin/:id/file` | Authenticated owner | Streams an asset belonging to the owner. |
| DELETE | `/media/admin/:id` | Authenticated owner | Deletes only an unreferenced asset and its file. |
| GET | `/media/:id/file` | Public, linked assets only | Streams an image/PDF only when referenced by allowed published content. |

## Projects

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/projects/public` | Public | Lists visible projects for the configured published portfolio. |
| GET | `/projects/public/:slug` | Public | Reads one visible project by slug (legacy rows may use ID). |
| GET | `/projects/admin` | Authenticated owner | Lists all owner projects. |
| POST | `/projects/admin` | Authenticated owner | Creates a project and links owner media. |
| PATCH | `/projects/admin/:id` | Authenticated owner | Updates an owner project. |
| DELETE | `/projects/admin/:id` | Authenticated owner | Deletes an owner project and its media links. |

Project images use existing `media_assets` and `portfolio_media` links. Public image reads require a visible project on the published portfolio.

## Interests

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/interests/public` | Public | Lists visible interests for the configured published portfolio. |
| GET | `/interests/admin` | Authenticated owner | Lists all owner interests. |
| POST | `/interests/admin` | Authenticated owner | Creates an interest and optionally links an owner image. |
| PATCH | `/interests/admin/:id` | Authenticated owner | Updates an owner interest. |
| DELETE | `/interests/admin/:id` | Authenticated owner | Deletes an owner interest and its media link. |

Interest icons reuse `portfolio_media` with `entity_type=interest`, `media_role=icon`; no schema change is needed.

## Admin dashboard

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard` | Authenticated owner | Returns per-section totals, visible counts, portfolio publication state, and database query status for the owner's portfolio. |

Education, Certificates, and Skills currently have database models but no module controllers/API implementation in this project version.

PATCH `/profile/admin` nhận `fullName` (bắt buộc, tối đa 150), `headline` (200), `phone` (30), `contactEmail` (email, 255), `location` (255), `bio` (10.000), `avatarMediaId`, `cvMediaId` và `coverMediaId`. Chuỗi tùy chọn rỗng được chuẩn hóa thành `null`; media ID phải thuộc portfolio của chủ tài khoản và khớp loại tệp cho trường đó.
