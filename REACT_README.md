# Mediplus - Medical and Doctor Directory React App

This is a React-based medical and doctor directory application built from an HTML template. The project uses Vite for fast development and build processes.

## Project Structure

```
mediplus-lite/
├── public/                 # Static assets
│   ├── css/               # Stylesheets
│   ├── fonts/             # Font files
│   ├── img/               # Images
│   ├── js/                # JavaScript libraries
│   └── style.css          # Main stylesheet
├── src/
│   ├── components/        # React components
│   │   ├── Header.jsx     # Navigation header
│   │   ├── Footer.jsx     # Footer component
│   │   └── Preloader.jsx  # Loading animation
│   ├── pages/             # Page components
│   │   ├── Home.jsx       # Homepage
│   │   ├── Contact.jsx    # Contact page
│   │   └── NotFound.jsx   # 404 error page
│   ├── App.jsx            # Main App component
│   └── main.jsx           # Entry point
└── index.html             # HTML template
```

## Technologies Used

- **React** - JavaScript library for building user interfaces
- **Vite** - Next generation frontend tooling
- **React Router** - Client-side routing
- **Bootstrap** - CSS framework
- **Font Awesome & Icofont** - Icon libraries
- **jQuery** - For legacy plugins (Owl Carousel, etc.)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd c:\Users\USER\Desktop\mediplus-lite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Available Routes

- `/` - Home page
- `/contact` - Contact Us page
- `*` - 404 Not Found page (for any undefined routes)

## Features

- ✅ Fully responsive design
- ✅ Modern React architecture
- ✅ Client-side routing with React Router
- ✅ Reusable components (Header, Footer, etc.)
- ✅ Page-based structure for easy navigation
- ✅ All original template styles preserved
- ✅ Fast development with Vite HMR (Hot Module Replacement)

## Next Steps / To-Do

You can extend this project by:

1. **Adding more pages**: Create components for:
   - Doctors listing
   - Services page
   - Blog page
   - Appointment booking
   - About Us page

2. **Converting jQuery plugins to React**:
   - Replace Owl Carousel with React Slick or Swiper
   - Replace jQuery animations with React animations

3. **State Management**:
   - Add Redux or Context API for global state
   - Implement form handling with React Hook Form

4. **Backend Integration**:
   - Connect to a REST API or GraphQL endpoint
   - Implement appointment booking functionality
   - Add user authentication

5. **Optimization**:
   - Code splitting for better performance
   - Lazy loading for images
   - SEO optimization with React Helmet

## CSS and Assets

All CSS files, images, fonts, and JavaScript libraries from the original HTML template have been moved to the `public/` folder and are referenced with absolute paths (e.g., `/css/bootstrap.min.css`, `/img/logo.png`).

## License

This template is based on Mediplus by wpthemesgrid.com

## Support

For issues or questions, please refer to the original template documentation or create an issue in your repository.
