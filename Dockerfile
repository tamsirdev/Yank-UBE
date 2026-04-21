# Use a lightweight Nginx image to serve static files
FROM nginx:alpine

# Copy all files from the current directory to the Nginx HTML directory
COPY . /usr/share/nginx/html

# Update Nginx to listen on port 9000 instead of 80
RUN sed -i 's/listen\(.*\)80;/listen 9000;/g' /etc/nginx/conf.d/default.conf

# Expose port 9000 to allow external access
EXPOSE 9000

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
