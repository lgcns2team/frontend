import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapPage from '../pages/home/ui/Page';
import LoginPage from '../pages/auth/ui/LoginPage';
import SignupPage from '../pages/auth/ui/SignupPage';
import DiscussionRoomPage from '../pages/discussion/ui/DiscussionRoomPage';
import GreetingPage from '../pages/greeting/ui/GreetingPage';
import { PrivateRoute } from '../shared/components/PrivateRoute';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GreetingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/map" element={
          <PrivateRoute>
            <MapPage />
          </PrivateRoute>
        } />
        <Route path="/discussion/:id" element={
          <PrivateRoute>
            <DiscussionRoomPage />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
