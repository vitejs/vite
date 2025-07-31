# استفاده از Node 20 به عنوان تصویر پایه
FROM node:20-alpine

# نصب Git برای جلوگیری از خطاهای مرتبط با دستورات Git
RUN apk add --no-cache git

# تعیین پوشه کاری
WORKDIR /app

# کپی فایل‌های package.json و pnpm-lock.yaml
COPY package*.json ./
COPY pnpm-lock.yaml ./

# نصب pnpm به صورت جهانی
RUN npm install -g pnpm

# نصب وابستگی‌ها با pnpm
RUN pnpm install

# کپی بقیه فایل‌های پروژه
COPY . .

# نصب ابزارهای مورد نیاز build
RUN pnpm add -w -D tsdown premove

# اجرای lint و format طبق CONTRIBUTING.md
RUN pnpm run lint && pnpm run format

# اجرای بیلد پروژه
RUN pnpm run build

# اجرای تست‌ها طبق CONTRIBUTING.md
RUN pnpm run test

# نمایش پورت 3000
EXPOSE 3000

# دستور برای شروع برنامه (در صورت وجود اسکریپت serve)
CMD ["pnpm", "run", "serve"]
