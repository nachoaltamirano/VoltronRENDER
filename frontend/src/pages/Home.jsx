import { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        const response = await axios.get('/api/turnos/disponibles');
        setTurnos(response.data);
      } catch (error) {
        console.error('Error fetching turnos:', error);
      }
    };

    fetchTurnos();
  }, []);

  return (
    <div className="container">
      <h1>Sistema de Turnos</h1>
      <div className="turnos-list">
        {turnos.map((turno) => (
          <div key={turno._id} className="turno-card">
            <h3>Sede: {turno.sede}</h3>
            <p>Fecha: {new Date(turno.fecha).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;