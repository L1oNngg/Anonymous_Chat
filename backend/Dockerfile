# Sử dụng Python 3.9 làm base image
FROM python:3.9-slim-bookworm

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Sao chép các file requirements và cài đặt các dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ source code của backend vào container
COPY . .

# Expose port 8000 (cổng mà Uvicorn sẽ chạy)
EXPOSE 8000

# Command để chạy ứng dụng FastAPI với Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]