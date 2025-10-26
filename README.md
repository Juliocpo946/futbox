# FutBOX - Sistema de Publicaciones de Mundiales FIFA

## Requisitos Previos

* Python 3.8 o superior
* MySQL 8.0 o superior
* pip (gestor de paquetes de Python)

---

## Inicio Rápido (Linux)

1.  **Configurar MySQL**
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

2.  **Navegar al Proyecto y Activar Entorno Virtual**
    ```bash
    cd /ruta/a/tu/proyecto/mundial_fifa
    source venv/bin/activate
    ```

3.  **Aplicar Migraciones (Solo la primera vez o si hay cambios)**
    ```bash
    python manage.py migrate
    ```

4.  **Iniciar el Servidor**
    ```bash
    python manage.py runserver
    ```
    Accede a: `http://127.0.0.1:8000`

---

## Inicio Rápido (Windows)

1.  **Configurar MySQL**
    Abre MySQL Workbench o MySQL Command Line Client:
    ```sql
    CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```
    *Asegúrate de que el usuario `root` con contraseña `123456` exista y tenga permisos sobre `futbox_db`.*

2.  **Navegar al Proyecto y Activar Entorno Virtual**
    ```cmd
    cd C:\ruta\del\proyecto\mundial_fifa
    venv\Scripts\activate
    ```

3.  **Aplicar Migraciones (Solo la primera vez o si hay cambios)**
    ```cmd
    python manage.py migrate
    ```

4.  **Iniciar el Servidor**
    ```cmd
    python manage.py runserver
    ```
    Accede a: `http://127.0.0.1:8000`

---

## Comandos Útiles de MySQL (Consola)

1.  **Conectar a MySQL:**
    ```bash
    # Linux
    sudo mysql -u root -p

    # Windows (desde MySQL Command Line Client o agregando MySQL al PATH)
    mysql -u root -p
    ```
    *Ingresa la contraseña (`123456` según la configuración).*

2.  **Mostrar Bases de Datos:**
    ```sql
    SHOW DATABASES;
    ```

3.  **Seleccionar la Base de Datos del Proyecto:**
    ```sql
    USE futbox_db;
    ```

4.  **Mostrar Tablas en la Base de Datos Actual:**
    ```sql
    SHOW TABLES;
    ```

5.  **Ver Estructura de una Tabla (ej. usuarios):**
    ```sql
    DESCRIBE pw2_usuario;
    ```

6.  **Ver Todos los Usuarios:**
    ```sql
    SELECT id, nombre, correo, nickname, rol FROM pw2_usuario;
    ```

7.  **Ver Usuarios Administradores:**
    ```sql
    SELECT id, nombre, correo, nickname FROM pw2_usuario WHERE rol = 'admin';
    ```

8.  **Cambiar Rol de Usuario a Admin (ejemplo):**
    ```sql
    UPDATE pw2_usuario SET rol = 'admin', is_staff = TRUE WHERE correo = 'correo_del_usuario@ejemplo.com';
    ```

9.  **Salir de MySQL:**
    ```sql
    EXIT;
    ```

---

## Vaciar la Base de Datos (Reiniciar)

1.  **Conectar a MySQL** (ver comandos anteriores).
2.  **Eliminar y Recrear la Base de Datos:**
    ```sql
    DROP DATABASE futbox_db;
    CREATE DATABASE futbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    EXIT;
    ```
3.  **Volver a Aplicar Migraciones en la Terminal del Proyecto:**
    ```bash
    python manage.py migrate
    ```
4.  **(Opcional) Crear un Nuevo Superusuario:**
    ```bash
    python manage.py createsuperuser
    ```

---