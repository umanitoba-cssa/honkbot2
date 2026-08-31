-- Initialize MySQL with proper user permissions
-- This script ensures the test user has the necessary permissions

-- Create the default database if it doesn't exist
CREATE DATABASE IF NOT EXISTS honkbot;

-- Grant all privileges to the test user from any host
GRANT ALL PRIVILEGES ON *.* TO 'test'@'%' WITH GRANT OPTION;

-- Also grant specifically to the root user from any host for admin operations
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'test_pass' WITH GRANT OPTION;

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;
