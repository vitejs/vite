# مرحله اول: ساخت اپلیکیشن
FROM node:20-alpine as build

# تنظیم پوشه کاری
WORKDIR /app

# کپی کردن فایل‌های package و نصب وابستگی‌ها
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# کپی کردن کل پروژه به داخل کانتینر
COPY . .

# ساخت پروژه
RUN pnpm build

# مرحله دوم: اجرای اپلیکیشن
FROM node:20-alpine

WORKDIR /app

# کپی کردن فقط فایل‌های لازم از مرحله ساخت به کانتینر نهایی
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules

# پورت مورد نظر برای اپلیکیشن
EXPOSE 3000

# اجرای اپلیکیشن
CMD ["pnpm", "run", "dev"]
