import BeachMap from './components/Map/BeachMap'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>California Beach Management</h1>
        <p>Interactive map of California beaches with management information</p>
      </header>
      <main className="app-main">
        <BeachMap />
      </main>
      <footer className="app-footer">
        <p>
          Data sources: California Coastal Commission, California State Parks, County GIS Portals
        </p>
      </footer>
    </div>
  )
}

export default App
