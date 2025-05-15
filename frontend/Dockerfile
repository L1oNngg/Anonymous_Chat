# Sử dụng Node.js để build ứng dụng
FROM node:16-alpine as builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm ci --force

# Sao chép source code
COPY . .

# Build ứng dụng React
RUN npm run build

# Sử dụng nginx để phục vụ các file build
FROM nginx:alpine

# Sao chép các file build từ giai đoạn trước
COPY --from=builder /app/build /usr/share/nginx/html

# Cấu hình nginx (nếu cần)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở port 80
EXPOSE 80

# Command chạy nginx
CMD ["nginx", "-g", "daemon off;"]