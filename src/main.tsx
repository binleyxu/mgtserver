import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      button={{ autoInsertSpace: false }}
      theme={{
        token: {
          colorPrimary: '#2f7f86',
          colorInfo: '#2f7f86',
          colorSuccess: '#2e8f66',
          colorWarning: '#d08b37',
          colorError: '#c04b47',
          colorBgContainer: '#ffffff',
          colorBorder: '#d7e1e7',
          borderRadius: 10,
          fontSize: 14,
          lineHeight: 1.45,
          boxShadow: '0 8px 24px rgba(20, 38, 51, 0.08)',
        },
        components: {
          Layout: {
            headerHeight: 64,
          },
          Menu: {
            itemHeight: 42,
            itemMarginBlock: 2,
            itemBorderRadius: 8,
          },
          Card: {
            bodyPadding: 18,
            headerHeight: 54,
          },
        },
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)
