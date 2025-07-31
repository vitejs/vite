# استفاده از Node 20 به عنوان تصویر پایه
FROM node:20-alpine

# نصب Git برای جلوگیری از خطاهای مرتبط با دستورات Git
RUN apk add --no-cache git

# تعیین پوشه کاری
WORKDIR /app

# کپی فایل‌های package.json و pnpm-lock.yaml
COPY package*.json ./

# نصب pnpm به صورت جهانی
RUN npm install -g pnpm

# نصب وابستگی‌ها با pnpm
RUN pnpm install

# نصب tsdown در صورت نیاز (بر اساس خطای شما)
RUN pnpm add tsdown --save-dev

# نصب سایر وابستگی‌های گم شده در صورت لزوم
RUN pnpm add rollup-plugin-license --save-dev

# کپی بقیه فایل‌های پروژه
COPY . .

# اجرای بیلد پروژه
RUN pnpm run build

# نمایش پورت 3000
EXPOSE 3000

# دستور برای شروع برنامه
CMD ["pnpm", "run", "serve"]
