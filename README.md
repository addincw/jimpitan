# Jimpitan Website

Aplikasi RT, RW, kelurahan Pekauman, kecamatan Sidoarjo. Kabupaten Sidoarjo.
untuk mengelola dan pelaporan hasil jimpitan warga, melanjutkan kearifan lokal dengan pemanfaatan teknologi.

## Prerequisite

1. nodejs >= 20.X
2. mysql >= 10.x

## Quick Start

### Development Mode

1. create empty database on your server
2. copy `.env.example` as `.env` file
3. adjust `env` value same as your configuration server (environment, db, etc)
4. create schema for database. `npx sequelize-cli db:migrate`
5. seed database with master and dummy data. `npx sequelize-cli db:seed:all`
6. `npm run dev`
7. project can access on http://localhost:8080 (default port)

### Production Mode

1. create empty database on your server
2. copy `.env.example` as `.env` file
3. adjust `env` value same as your configuration server (environment, db, etc)
4. create schema for database. `npx sequelize-cli db:migrate`
5. seed database with master data only. `npx sequelize-cli db:seed --seed 20240116172759-master-role 20240116172760-master-user`
6. `npm run build`
7. `npm run start`
8. project can access on http://localhost:8080 (default port)
