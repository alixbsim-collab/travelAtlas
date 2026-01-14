import React from 'react';
import './App.css';
import ItineraryCreator from './ItineraryCreator';
import Planner from './Planner';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="logo">The Travel Atlas</div>
        <nav className="main-nav">
          <a href="#home">Home</a>
          <a href="#itinerary">Itinerary Creator</a>
          <a href="#planner">Planner</a>
        </nav>
      </header>
      <main>
        <section id="itinerary">
          <h2>Itinerary Creator</h2>
          <ItineraryCreator />
        </section>
        <section id="planner">
          <h2>Drag-and-Drop Planner</h2>
          <Planner />
        </section>
      </main>
    </div>
  );
}

export default App;
