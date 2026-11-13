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

import { BrowserRouter, Route, Routes } from 'react-router-dom'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/sobre-nosotros" element={<AboutScreen />} />
        <Route path="/grafo" element={<GraphScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
