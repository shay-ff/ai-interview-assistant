# AI Interview Assistant

A comprehensive React-based application designed to streamline the interview process by automatically parsing resumes, extracting candidate information, and facilitating AI-powered interviews. Built with modern web technologies and featuring intelligent resume analysis capabilities.

## 🚀 Features

### 📄 **Intelligent Resume Parsing**
- **Multi-format Support**: Parse PDF and DOCX resume files
- **Comprehensive Data Extraction**:
  - Contact information (name, email, phone)
  - Technical skills detection (60+ common technologies)
  - Experience level and education background
  - Location and social media links (LinkedIn, GitHub, Portfolio)
- **Smart Validation**: Real-time validation with quality scoring (0-100)
- **Error Handling**: Robust error handling with detailed feedback

### 👥 **Dual Interface Design**
- **Interviewee Portal**: Resume upload and interview session
- **Interviewer Dashboard**: Candidate management and evaluation
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### 🎯 **Advanced Candidate Management**
- **Redux State Management**: Centralized state with persistence
- **Search & Filter**: Advanced candidate search and sorting capabilities
- **Status Tracking**: Interview progress monitoring
- **Data Validation**: Comprehensive validation with visual feedback

### 🔧 **Developer Experience**
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Built with React 19 and latest hooks
- **Comprehensive Testing**: Unit tests with Vitest and React Testing Library
- **Code Quality**: ESLint, Prettier, and strict TypeScript configuration
- **Debug Tools**: Built-in debugging modal for resume parsing

## � Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
git clone <repository-url>
cd ai-interview-assistant
npm install
```

### Environment Setup
Create a `.env` file in the root directory with your AI service API keys:

```bash
# AI Service Configuration (choose one or more)
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: For Ollama local AI
VITE_OLLAMA_BASE_URL=http://localhost:11434
```

**Note**: The application will work with local AI fallback if no API keys are provided, but AI-powered features will be limited.

### Development
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Testing
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage report
```

### Build
```bash
npm run build
npm run preview
```

## �🛠️ Tech Stack

### **Frontend**
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Ant Design** - Professional UI component library
- **Redux Toolkit** - State management with persistence

### **Resume Processing**
- **PDF.js** - PDF text extraction
- **Mammoth.js** - DOCX document parsing
- **Custom Parsing Engine** - Intelligent data extraction

### **Development Tools**
- **Vitest** - Fast unit testing
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **React Testing Library** - Component testing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-interview-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── common/          # Shared components
│   │   ├── Layout.tsx
│   │   └── ResumeDebugModal.tsx
│   ├── interviewee/     # Interviewee-specific components
│   │   ├── ResumeUpload.tsx
│   │   ├── ChatInterface.tsx
│   │   └── Timer.tsx
│   └── interviewer/     # Interviewer-specific components
│       └── CandidateTable.tsx
├── pages/               # Page components
│   ├── Interviewee.tsx
│   ├── Interviewer.tsx
│   └── Landing.tsx
├── services/            # Business logic services
│   ├── resumeParser.ts  # Resume parsing logic
│   ├── validationService.ts # Data validation
│   ├── aiService.ts     # AI integration
│   └── scoringService.ts # Interview scoring
├── store/               # Redux store configuration
│   ├── slices/          # Redux slices
│   └── middleware/      # Redux middleware
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── test/                # Test configuration
```

## 🔍 Key Features Deep Dive

### **Resume Parsing Engine**
The application features a sophisticated resume parsing system that:

- **Extracts Text**: Converts PDF and DOCX files to searchable text
- **Identifies Skills**: Automatically detects 60+ technical skills including:
  - Programming languages (JavaScript, Python, Java, etc.)
  - Frameworks (React, Vue, Angular, etc.)
  - Tools & Technologies (Docker, AWS, Git, etc.)
  - Methodologies (Agile, Scrum, DevOps, etc.)
- **Validates Data**: Provides real-time validation with quality scoring
- **Handles Errors**: Graceful error handling for corrupted or unsupported files

### **Validation System**
- **Quality Scoring**: 0-100 scale based on completeness and accuracy
- **Error Detection**: Identifies missing or invalid information
- **Warning System**: Highlights potential issues without blocking progress
- **Visual Feedback**: Color-coded progress bars and detailed messaging

### **State Management**
- **Redux Toolkit**: Modern Redux with less boilerplate
- **Persistence**: Automatic state persistence across sessions
- **Type Safety**: Fully typed Redux store and actions
- **Middleware**: Custom middleware for error handling and logging

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test resumeParser.test.ts
```

**Test Coverage Includes:**
- Resume parsing functionality
- Data validation logic
- Redux store operations
- Component rendering
- Error handling scenarios

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface using Ant Design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators and progress bars
- **Error Handling**: User-friendly error messages and recovery options
- **Debug Tools**: Built-in debugging interface for developers

## 🔧 Configuration

### **Environment Variables**
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=your_api_url
VITE_AI_SERVICE_KEY=your_ai_service_key
```

### **File Upload Limits**
- **Supported Formats**: PDF, DOCX
- **Maximum Size**: 10MB
- **Validation**: Automatic file type and size validation

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

### **Deploy to Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@example.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] AI-powered interview question generation
- [ ] Real-time interview scoring
- [ ] Video interview integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API integration for external ATS systems

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**