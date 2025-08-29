FROM node:22-alpine as build
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .

# Переменные окружения для сборки
ARG VITE_API_ORIGIN
ARG VITE_CDN_ORIGIN
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
ENV VITE_CDN_ORIGIN=$VITE_CDN_ORIGIN

RUN npm run build

# Продакшн стадия
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
