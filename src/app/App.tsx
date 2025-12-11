import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapPage from '../pages/home/ui/Page';
import LoginPage from '../pages/auth/ui/LoginPage';
import SignupPage from '../pages/auth/ui/SignupPage';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
