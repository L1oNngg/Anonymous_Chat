```docker compose down --volumes --remove-orphans
docker compose build --no-cache
docker compose up -d
docker compose logs -f```

⏱ Mẹo tiết kiệm thời gian build sau này:
Lần tới nếu bạn chỉ muốn dọn sạch docker mà giữ lại node_modules, code frontend thì chỉ cần:

```docker compose down -v
docker system prune -f```
Không cần -a vì -a xóa cả image (phải build lại lâu hơn).
