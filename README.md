# SRM-RH — Human Resources Management System

> A full-stack web application for managing employee leave requests and mission orders at SRM Fès-Meknès (Direction Provinciale de Taza).

## Overview
SRM-RH is an internal HR management application developed during an internship at SRM Fès-Meknès. It digitizes and centralizes the complete management of staff movements — from leave requests and mission orders to automatic balance calculations and official PDF document generation.

## Features
- Real-time Dashboard with 4 KPIs (employees, active leaves, ongoing missions, destinations)
- Employee Management — Full CRUD with automatic 22-day initial leave balance
- Leave Management — Automatic return date calculation, balance control, overlap detection
- Early Return & Balance Restitution — Dynamic recalculation and instant balance refund
- Mission Orders — Destination, reason, transport mode, and service vehicle tracking
- Overlap Detection — Prevents scheduling conflicts between leaves and missions
- Interim Validation — Restricts interim selection to same-department colleagues
- PDF Generation — Official bilingual (Arabic/French) documents at 300 DPI using jsPDF + HTML5 Canvas
- Toast Notifications — Success/Error alerts after every user action
- Dark/Light Mode — Fully responsive UI with theme support
- Annual Leave Renewal — Carry-over system (remaining days + 22 new days every January 1st)

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Vanilla CSS, jsPDF, HTML5 Canvas |
| Backend | Laravel 11 (PHP 8.2+), RESTful API |
| Database | MySQL (InnoDB), Eloquent ORM |

## Installation

### Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

### Frontend
cd frontend
npm install
npm run dev

## Author
Developed during an internship at SRM Fès-Meknès S.A. — Direction Provinciale de Taza

