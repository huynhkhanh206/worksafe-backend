# WorkSafe — Backend (Node.js + Express + PostgreSQL)

Bám theo `worksafe-backend-spec.md` đã thống nhất trước đó. Weather provider dùng **OpenWeatherMap** (API "2.5" miễn phí — không phải One Call 3.0, vì bản đó cần bật subscription/thẻ thanh toán dù có hạn mức free).

## 1. Cài đặt

```bash
npm install
cp .env.example .env
```

Điền vào `.env`:
- `DATABASE_URL` — chuỗi kết nối PostgreSQL. Nếu chưa có, tạo miễn phí ở [Neon](https://neon.tech), [Render Postgres](https://render.com) hoặc [Supabase](https://supabase.com).
- `OPENWEATHER_API_KEY` — lấy tại https://openweathermap.org/api (mục "Current Weather Data" free tier, **không** cần thẻ thanh toán). Lưu ý: key mới tạo có thể mất 10 phút–2 tiếng mới kích hoạt, nếu gọi thử mà bị lỗi 401 ngay sau khi đăng ký thì chỉ cần đợi thêm.
- `JWT_SECRET` — một chuỗi ngẫu nhiên bất kỳ, càng dài càng tốt.

## 2. Khởi tạo database

```bash
npm run migrate
```

Lệnh này tạo 4 bảng (`users`, `profiles`, `risk_thresholds`, `weather_cache`) và nạp sẵn ngưỡng rủi ro mặc định nếu bảng `risk_thresholds` đang trống.

## 3. Chạy server

```bash
npm run dev     # tự restart khi sửa code
# hoặc
npm start
```

Mặc định chạy ở `http://localhost:4000`. Kiểm tra nhanh: `GET http://localhost:4000/api/health`.

## 4. Chạy test

```bash
npm test
```

Bộ test hiện có kiểm tra riêng phần **Risk Engine** (công thức Heat Index + ánh xạ 4 mức + shape JSON trả về) — chạy độc lập, không cần DB hay mạng. Đã chạy thật và **pass cả 7/7**, bao gồm một test đối chiếu với ví dụ tham chiếu kinh điển của NWS (100°F/55% độ ẩm → Heat Index ≈ 124°F).

## 5. Các endpoint chính

Chi tiết đầy đủ nằm trong spec đã publish trước đó; tóm tắt:

| Method | Path | Cần token |
|---|---|---|
| POST | `/api/auth/register` | không |
| POST | `/api/auth/login` | không |
| GET/PUT | `/api/profile` | có |
| GET | `/api/weather/current?lat=&lng=` | có |
| GET | `/api/health` | không |

## 6. Deploy

- **Render**: deploy trực tiếp, không cần sửa gì — Render chạy `npm start` (Express thường) ngay được.
- **Vercel**: đã có sẵn `vercel.json` + `api/index.js` bọc Express app thành serverless function, deploy được luôn mà không cần sửa code.
- Nhớ cấu hình 3 biến môi trường (`DATABASE_URL`, `OPENWEATHER_API_KEY`, `JWT_SECRET`) trên nền tảng deploy, tương tự file `.env`.

## 7. Việc còn thiếu để nối trọn với app Flutter

Backend này đã sẵn sàng, nhưng phía Flutter **hiện vẫn dùng `MockWeatherService`** — chưa có phần code thật sự gọi API này. Cần bổ sung bên Flutter:

1. Một `ApiWeatherService` gọi `GET /api/weather/current`, thay cho `MockWeatherService`.
2. Hàm `WeatherSnapshot.fromJson(...)` / `HourlyRisk.fromJson(...)` để parse JSON trả về thành đúng model hiện có.
3. Lưu JWT token sau khi đăng ký/đăng nhập (ví dụ bằng `shared_preferences`) để đính kèm vào header `Authorization: Bearer <token>` cho các lần gọi sau.
4. Gọi API cập nhật hồ sơ (`PUT /api/profile`) ở màn hình Thiết lập hồ sơ, thay vì chỉ giữ trong bộ nhớ tạm như hiện tại.

Nếu muốn, mình có thể viết luôn phần này ở bước tiếp theo.
