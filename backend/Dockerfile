FROM node:22-alpine

# Установка рабочей директории
WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm ci && npm cache clean --force

# Копирование исходного кода
COPY . .

# Создание директорий для загрузок
RUN mkdir -p images temp

# Переменные окружения
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Открытие порта
EXPOSE 3000

# Команда запуска
CMD ["npm", "run", "dev:docker"]
