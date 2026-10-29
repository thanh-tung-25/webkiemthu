# Giai đoạn 1: build Angular.
FROM node:14-bullseye AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG TURNSTILE_SITE_KEY
RUN if [ -n "$TURNSTILE_SITE_KEY" ]; then \
    TURNSTILE_SITE_KEY="$TURNSTILE_SITE_KEY" node -e "const fs=require('fs'); const p='src/environments/environment.prod.ts'; fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/turnstileSiteKey: '[^']*'/, 'turnstileSiteKey: '+JSON.stringify(process.env.TURNSTILE_SITE_KEY)));"; \
    fi

RUN npm run build -- --configuration production


# Giai đoạn 2: Nginx chỉ phục vụ file Angular đã build.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/shop-clothing-ui /usr/share/nginx/html

EXPOSE 80
