FROM alpine:latest

ARG PB_VERSION=0.20.3

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# create data directory for databases
RUN mkdir -p /pb/pb_data

# copy startup script
COPY start.sh /pb/start.sh
RUN chmod +x /pb/start.sh

# uncomment to copy the local pb_migrations dir into the image
# COPY ./pb_migrations /pb/pb_migrations

# uncomment to copy the local pb_hooks dir into the image
# COPY ./pb_hooks /pb/pb_hooks

EXPOSE 8080

# create volume for persistent data storage
VOLUME ["/pb/pb_data"]

# start PocketBase with auto-admin setup
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
