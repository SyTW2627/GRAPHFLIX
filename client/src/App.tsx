import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import GraphScreen from './screens/main-screen/graph-screen'

import './App.css'

import LoginScreen from './screens/login-screen/LoginScreen'
import LandingScreen from './screens/landing-screen/LandingScreen'
import RegisterScreen from './screens/register-screen/RegisterScreen'
import AboutScreen from './screens/about-screen/AboutScreen'
import OnboardingScreen from './screens/onboarding-screen/OnboardingScreen'
import MovieScreen from './screens/movie-screen/MovieScreen';
import HelpScreen from './screens/help-screen/HelpScreen'

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AccountScreen from './screens/account-screen/AccountScreen'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/sobre-nosotros" element={<AboutScreen />} />
        <Route path="/grafo" element={<GraphScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/pelicula/:id_obra" element={<MovieScreen />} />

        <Route path="/help" element={<HelpScreen />} />
        <Route path="/perfil" element={<AccountScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
