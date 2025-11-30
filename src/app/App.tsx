import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/landing/ui/LandingPage';
import MapPage from '../pages/home/ui/Page';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
