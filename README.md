# Voltron Lab - Sistema de Gestión de Turnos

Sistema de gestión de turnos y pacientes para Voltron Lab.

## Características

- Gestión de turnos médicos
- Panel de administración
- Registro de pacientes
- Fichas médicas
- Notas médicas por paciente
- Sistema de reservas online

## Tecnologías

- Frontend: Vite + JavaScript
- Backend: Node.js + Express
- Base de datos: MongoDB
- Autenticación: JWT

## Configuración del Proyecto

### Requisitos Previos

- Node.js >= 14
- MongoDB

### Variables de Entorno

Crear un archivo `.env` en la carpeta `backend` con las siguientes variables:

```env
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=tu_secreto_jwt
PORT=3000
```

### Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar en modo desarrollo:
```bash
npm run dev
```

## Despliegue

El proyecto está configurado para despliegue automático en Render.com.