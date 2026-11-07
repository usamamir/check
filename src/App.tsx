import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EquipmentPage } from './pages/EquipmentPage'
import { MusclesPage } from './pages/MusclesPage'
import { ExerciseBrowse } from './pages/ExerciseBrowse'

const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EquipmentPage />} />
        <Route path="/muscles" element={<MusclesPage />} />
        <Route path="/exercises" element={<ExerciseBrowse />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
