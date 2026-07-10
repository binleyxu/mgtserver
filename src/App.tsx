import { Suspense } from 'react'

import './App.css'
import { AppRouter } from './router'

function App() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>页面加载中...</div>}>
      <AppRouter />
    </Suspense>
  )
}

export default App
