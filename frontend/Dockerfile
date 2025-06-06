# Sử dụng một image Node.js làm base image
FROM node:18-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép các file package vào container
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép phần còn lại của code
COPY . .

# Build ứng dụng (nếu cần - ví dụ: React)
RUN npm run build

# Sử dụng một image Nginx để phục vụ ứng dụng
FROM nginx:alpine

# Sao chép build từ giai đoạn trước
COPY --from=builder /app/build /usr/share/nginx/html

# Thêm cấu hình Nginx custom cho SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]