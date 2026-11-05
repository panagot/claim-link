import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { NetworkProvider } from './components/NetworkContext'
import { WalletProvider } from './components/WalletContext'
import Docs from './pages/Docs'
import Home from './pages/Home'
import Roadmap from './pages/Roadmap'
import Security from './pages/Security'
import Seed from './pages/Seed'
import Status from './pages/Status'
import Workspace from './pages/Workspace'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <NetworkProvider>
        <WalletProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="app" element={<Workspace />} />
              <Route path="app/claim" element={<Workspace />} />
              <Route path="app/refund" element={<Workspace />} />
              <Route path="docs" element={<Docs />} />
              <Route path="security" element={<Security />} />
              <Route path="status" element={<Status />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="seed" element={<Seed />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WalletProvider>
      </NetworkProvider>
    </BrowserRouter>
  )
}
