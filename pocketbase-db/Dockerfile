FROM alpine:latest

ARG PB_VERSION=0.39.11

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# create data directory for databases
RUN mkdir -p /pb/pb_data

RUN mkdir -p /pb/pb_migrations

# copy startup script
COPY start.sh /pb/start.sh
RUN chmod +x /pb/start.sh

EXPOSE 8080

# create volume for persistent data storage
VOLUME ["/pb/pb_data"]

# start PocketBase with auto-admin setup
CMD ["/pb/start.sh"]
