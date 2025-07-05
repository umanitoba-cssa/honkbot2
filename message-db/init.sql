-- Initialize MySQL with proper user permissions
-- This script ensures the test user has the necessary permissions

-- Grant all privileges to the test user
GRANT ALL PRIVILEGES ON *.* TO 'test'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Create the default database if it doesn't exist
CREATE DATABASE IF NOT EXISTS honkbot;
