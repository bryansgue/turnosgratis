FROM nginx:1.27-alpine
COPY public/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
# La carpeta /usr/share/nginx/html/data se monta como volumen (la actualiza el cron del host)
# → los enlaces se refrescan sin redeploy. Ver docker-compose.yml.
