# AnonymousChat - Hệ thống Chat Ẩn Danh

## Giới thiệu

AnonymousChat là một hệ thống chat ẩn danh hỗ trợ phòng chung và phòng riêng, bảo mật đầu cuối (end-to-end encryption), giới hạn số lượng kết nối trên mỗi IP cho phòng riêng, và nhiều tính năng nâng cao khác. Hệ thống được xây dựng với **ReactJS** (frontend), **FastAPI** (backend), **Redis** (lưu trữ tạm thời), và **Docker** để dễ dàng triển khai.

---

## Tính năng nổi bật

- **Chat phòng chung (public) và phòng riêng (private)**
- **Tạo phòng riêng với mã phòng và mật khẩu (tùy chọn)**
- **Giới hạn số lượng kết nối trên mỗi IP cho phòng riêng**
- **Ẩn phòng riêng, chỉ ai có mã phòng/mật khẩu mới vào được**
- **Mã hóa đầu-cuối (E2EE) cho tin nhắn văn bản**
- **Gửi sticker, emoji**
- **Thông báo người dùng online, thông báo hệ thống**
- **Không lưu thông tin cá nhân, không log IP trên frontend/backend**
- **Giao diện hiện đại, hỗ trợ responsive**
- **Triển khai dễ dàng với Docker Compose**

---

## Yêu cầu hệ thống

- Docker & Docker Compose
- (Tùy chọn) Node.js và Python nếu muốn chạy thủ công ngoài Docker

---

## Hướng dẫn cài đặt & chạy hệ thống

### 1. Clone source code

```bash
git clone https://github.com/L1oNngg/Anonymous_Chat.git
cd AnonymousChat
```

### 2. Cấu hình biến môi trường (nếu cần)

- Sửa file `.env` trong thư mục `frontend` để trỏ đúng API/WS nếu chạy trên server khác.
- Mặc định đã cấu hình cho localhost.

### 3. Build & chạy bằng Docker Compose

```bash
docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

- Truy cập frontend tại: http://localhost:3000 hoặc http://localhost (tùy cấu hình port)
- Backend chạy ở http://localhost:8000 (API), WebSocket ở ws://localhost:8000

### 4. Nếu muốn chạy thủ công (không dùng Docker)

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level error --no-access-log
```

#### Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

---

## Một số lưu ý bảo mật

- **Tin nhắn được mã hóa đầu-cuối trên client, server không đọc được nội dung.**
- **Không log IP, username, sessionId ở backend/frontend.**
- **Phòng riêng chỉ hiện với người đã join hoặc có mã phòng.**
- **Có thể đặt mật khẩu cho phòng riêng để tăng bảo mật.**
- **Giới hạn số lượng kết nối trên mỗi IP cho phòng riêng để chống spam.**

---

## Đóng góp & phát triển

- Fork, tạo pull request hoặc mở issue nếu bạn muốn đóng góp thêm tính năng hoặc phát hiện lỗi.
- Mọi ý kiến đóng góp đều được hoan nghênh!

---

## Tác giả

- AnonymousChat Team (2025)
