# FutBOX - Sistema de Publicaciones de Mundiales FIFA

Sistema web para compartir y gestionar publicaciones sobre los Mundiales de Fútbol FIFA.

---

## Requisitos Previos

### Windows y Linux
- Python 3.8 o superior
- MySQL 8.0 o superior
- pip (gestor de paquetes de Python)

---

## Instalación en Linux

### 1. Instalar dependencias del sistema
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv mysql-server libmysqlclient-dev
```

### 2. Configurar MySQL
```bash
sudo mysql -u root -p
```

Dentro de MySQL:
```sql
CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'root'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON futbox_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clonar o descargar el proyecto
```bash
cd ~
git clone tu repo
cd mundial_fifa
```

### 4. Crear entorno virtual
```bash
python3 -m venv venv
source venv/bin/activate
```

### 5. Instalar dependencias de Python
```bash
pip install -r requirements.txt
```

### 6. Aplicar migraciones
```bash
python manage.py migrate
```

### 7. Crear superusuario
```bash
python manage.py createsuperuser
```

### 8. Iniciar el servidor
```bash
python manage.py runserver
```

Accede a: `http://127.0.0.1:8000`

---

## Instalación en Windows

### 1. Instalar Python
Descarga desde [python.org](https://www.python.org/downloads/)
- Marca "Add Python to PATH" durante la instalación

### 2. Instalar MySQL
Descarga desde [mysql.com](https://dev.mysql.com/downloads/installer/)
- Durante la instalación, configura:
  - Usuario: `root`
  - Contraseña: `123456`

### 3. Configurar MySQL
Abre MySQL Workbench o MySQL Command Line Client:
```sql
CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Abrir terminal en la carpeta del proyecto
```cmd
cd C:\ruta\del\proyecto\mundial_fifa
```

### 5. Crear entorno virtual
```cmd
python -m venv venv
venv\Scripts\activate
```

### 6. Instalar dependencias
```cmd
pip install -r requirements.txt
```

### 7. Aplicar migraciones
```cmd
python manage.py migrate
```

### 8. Crear superusuario (administrador)
```cmd
python manage.py createsuperuser
```

### 9. Iniciar el servidor
```cmd
python manage.py runserver
```

Accede a: `http://127.0.0.1:8000`

---

## Vaciar la Base de Datos

### Opción 1: Eliminar y recrear

#### Linux
```bash
# Conectar a MySQL
mysql -u root -p

# Dentro de MySQL
DROP DATABASE futbox_db;
CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EXIT;

# Aplicar migraciones nuevamente
python manage.py migrate

# Crear nuevo superusuario
python manage.py createsuperuser
```

#### Windows
```cmd
# Abrir MySQL Command Line Client o MySQL Workbench
DROP DATABASE futbox_db;
CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# En la terminal del proyecto
python manage.py migrate
python manage.py createsuperuser
```
---



### Configurar Cloudinary (opcional)
Para subir imágenes, configura las credenciales en `settings.py`:
```python
cloudinary.config(
  cloud_name = "tu_cloud_name",
  api_key = "tu_api_key",
  api_secret = "tu_api_secret"
)
```

---

## Comandos Útiles

### Activar entorno virtual
**Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```cmd
venv\Scripts\activate
```

### Desactivar entorno virtual
```bash
deactivate
```

### Crear nuevas migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

### Ver usuarios en la base de datos
```sql
SELECT id, nombre, correo, nickname, rol FROM pw2_usuario;
```

### Cambiar rol de usuario a admin
```sql
UPDATE pw2_usuario SET rol = 'admin', is_staff = TRUE WHERE correo = 'correo@ejemplo.com';
```

---

## Estructura del Proyecto

```
mundial_fifa/
├── manage.py
├── requirements.txt
├── mundial_fifa/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── pw2/
    ├── models.py
    ├── views.py
    ├── urls.py
    ├── api/
    │   ├── views/
    │   ├── serializers.py
    │   └── urls.py
    ├── services/
    ├── repositories/
    ├── static/
    └── templates/
```

---

## Solución de Problemas

### Error: "Access denied for user 'root'@'localhost'"
Verifica las credenciales en `settings.py` y que el usuario tenga permisos.

### Error: "No module named 'mysqlclient'"
```bash
pip install mysqlclient
```

En Windows, si falla, instala desde:
https://www.lfd.uci.edu/~gohlke/pythonlibs/#mysqlclient

### Error: "Port 8000 is already in use"
```bash
# Linux
pkill -f runserver
# Windows
netstat -ano | findstr :8000
taskkill /PID <numero_pid> /F
```

### Base de datos no se conecta
Verifica que MySQL esté ejecutándose:
```bash
# Linux
sudo systemctl status mysql
sudo systemctl start mysql

# Windows
# Abrir Servicios > MySQL80 > Iniciar
```

---

