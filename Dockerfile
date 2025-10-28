# Use official Nginx image as a base image
FROM nginx:alpine

# Copy custom Nginx configuration file to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Set the working directory to Nginx's default HTML directory
WORKDIR /usr/share/nginx/html

# Copy the contents of the Front-End directory to the working directory
COPY Front-End/ .

# Expose port 80 to allow traffic to the web server
EXPOSE 80

# Run Nginx in the foreground when the container starts
CMD ["nginx", "-g", "daemon off;"]