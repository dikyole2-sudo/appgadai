# 🏛️ Pegadaian Syariah Management System

Sistem manajemen Pegadaian Syariah yang lengkap dengan fitur pinjam, tebus, perpanjang, dan laporan keuangan.

## ✨ Features

### 🏦 Core Features
- **Manajemen Nasabah** - Pendaftaran dan data nasabah lengkap
- **Manajemen Pinjaman** - Proses gadai dengan perhitungan otomatis
- **Manajemen Transaksi** - Tebus, perpanjang, dan tracking
- **Inventory System** - Management barang gadai
- **Cash Flow** - Tracking arus kas real-time
- **Laporan** - Export Excel & PDF dengan data lengkap

### 📊 Dashboard & Analytics
- Real-time statistics
- Cash flow monitoring
- Transaction trends
- Customer demographics
- Performance metrics

### 🔐 Security & Authentication
- JWT-based authentication
- Role-based access control
- Secure session management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   npm run db:push
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - URL: http://localhost:3000
   - Email: admin@mandirigadai.id
   - Password: admin123

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── components/     # UI components
│   │   └── lib/           # Utilities and database
│   ├── components/ui/      # shadcn/ui components
│   └── hooks/             # Custom React hooks
├── prisma/
│   └── schema.prisma      # Database schema
├── scripts/
│   ├── clear-database.ts  # Database cleanup
│   └── seed-default.ts    # Default data seeding
└── public/               # Static assets
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Database
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio

### Utilities
- `bash scripts/reset-system.sh` - Reset entire system
- `npx tsx scripts/clear-database.ts` - Clear all data
- `npx tsx scripts/seed-default.ts` - Seed default data

## 📊 Export & Reports

### Excel Export
- Comprehensive financial data
- Customer demographics with percentages
- Transaction details
- Monthly trends (for monthly reports)
- Professional formatting with styled headers

### PDF Export
- Clean, professional layout
- Multi-page support with pagination
- Structured sections
- Footer with page numbers and timestamps

## 💰 Cash Flow System

System automatically tracks:
- **Cash Out**: When new loans are created (net amount)
- **Cash In**: When loans are redeemed or extended
- **Real-time balance** updates

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Core Operations
- `GET/POST /api/nasabah` - Customer management
- `GET/POST /api/barang` - Loan management
- `GET/POST /api/transaksi` - Transaction management
- `GET /api/inventory` - Inventory management
- `GET /api/cash` - Cash flow data
- `GET /api/laporan` - Report data
- `GET /api/laporan/export` - Export data

## 🎨 UI Components

Built with:
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icon system

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts for all screen sizes
- Optimized for tablets and desktops

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes
- Input validation
- SQL injection prevention with Prisma

## 🧪 Testing & Quality

- ESLint for code quality
- TypeScript strict mode
- Error boundary handling
- Input sanitization

## 🚨 Error Handling

- Comprehensive error logging
- User-friendly error messages
- Graceful fallbacks
- Network error recovery

## 🔄 Real-time Updates

- Socket.io integration for real-time updates
- Live dashboard statistics
- Instant transaction notifications
- Real-time cash flow updates

## 📈 Performance

- Optimized database queries
- Efficient data loading
- Minimal re-renders
- Fast page loads

## 🛳️ Production Deployment

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Build & Deploy
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues and questions:
- Check the documentation
- Review error logs
- Contact development team

## 📄 License

This project is licensed under the MIT License.

---

**© 2024 Pegadaian Syariah Management System**