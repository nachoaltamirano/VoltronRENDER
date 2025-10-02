import { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [turnos, setTurnos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchTurnos(token);
    }
  }, []);

  const fetchTurnos = async (token) => {
    try {
      const response = await axios.get('/api/admin/turnos', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTurnos(response.data);
    } catch (error) {
      console.error('Error fetching turnos:', error);
    }
  };

  return (
    <div className="container">
      <h1>Panel de Administración</h1>
      {isAuthenticated ? (
        <div className="admin-panel">
          <h2>Turnos Disponibles</h2>
          <div className="turnos-list">
            {turnos.map((turno) => (
              <div key={turno._id} className="turno-card">
                <h3>Sede: {turno.sede}</h3>
                <p>Fecha: {new Date(turno.fecha).toLocaleString()}</p>
                <p>Estado: {turno.disponible ? 'Disponible' : 'Reservado'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Por favor, inicie sesión para acceder al panel de administración.</p>
      )}
    </div>
  );
}

export default Admin;