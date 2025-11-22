// Sistema de Ventas - Lógica Principal (Frontend)
class SistemaVentas {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.productos = [];
        this.ventas = [];
        this.clientes = [];
        this.carrito = [];
        this.categorias = [];
        this.inicializarEventos();
        this.verificarAutenticacion();
    }

    // Métodos de autenticación
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.tokens.accessToken;
                this.user = data.user;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.mostrarNotificacion('Login exitoso', 'success');
                return { success: true, user: data.user };
            } else {
                this.mostrarNotificacion(data.message || 'Error en login', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Usuario registrado exitosamente', 'success');
                return { success: true };
            } else {
                this.mostrarNotificacion(data.message || 'Error en registro', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.mostrarNotificacion('Logout exitoso', 'success');
        window.location.href = 'login.html';
    }

    verificarAutenticacion() {
        if (!this.token && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Métodos para obtener datos del backend
    async obtenerProductos() {
        try {
            const response = await fetch(`${this.apiUrl}/products`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.productos = data.products || [];
                return this.productos;
            } else if (response.status === 401) {
                this.logout();
                return [];
            } else {
                console.error('Error al obtener productos:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    async obtenerClientes() {
        try {
            const response = await fetch(`${this.apiUrl}/customers`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.clientes = data.customers || [];
                return this.clientes;
            } else if (response.status === 401) {
                this.logout();
                return [];
            } else {
                console.error('Error al obtener clientes:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    async obtenerVentas() {
        try {
            const response = await fetch(`${this.apiUrl}/sales`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.ventas = data.sales || [];
                return this.ventas;
            } else if (response.status === 401) {
                this.logout();
                return [];
            } else {
                console.error('Error al obtener ventas:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    async obtenerCategorias() {
        try {
            const response = await fetch(`${this.apiUrl}/categories`);

            if (response.ok) {
                const data = await response.json();
                this.categorias = data.categories || [];
                return this.categorias;
            } else {
                console.error('Error al obtener categorías:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    // Métodos para productos
    async crearProducto(productoData) {
        try {
            const response = await fetch(`${this.apiUrl}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(productoData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Producto creado exitosamente', 'success');
                return { success: true, product: data.product };
            } else {
                this.mostrarNotificacion(data.message || 'Error al crear producto', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear producto:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    async actualizarProducto(id, productoData) {
        try {
            const response = await fetch(`${this.apiUrl}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(productoData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Producto actualizado exitosamente', 'success');
                return { success: true, product: data.product };
            } else {
                this.mostrarNotificacion(data.message || 'Error al actualizar producto', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    async eliminarProducto(id) {
        try {
            const response = await fetch(`${this.apiUrl}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.mostrarNotificacion('Producto eliminado exitosamente', 'success');
                return { success: true };
            } else {
                const data = await response.json();
                this.mostrarNotificacion(data.message || 'Error al eliminar producto', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Métodos para clientes
    async crearCliente(clienteData) {
        try {
            const response = await fetch(`${this.apiUrl}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(clienteData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Cliente creado exitosamente', 'success');
                return { success: true, customer: data.customer };
            } else {
                this.mostrarNotificacion(data.message || 'Error al crear cliente', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear cliente:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Métodos para ventas
    async crearVenta(ventaData) {
        try {
            const response = await fetch(`${this.apiUrl}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(ventaData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Venta procesada exitosamente', 'success');
                return { success: true, sale: data.sale };
            } else {
                this.mostrarNotificacion(data.message || 'Error al procesar venta', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear venta:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
            return { success: false, error: 'Error de conexión' };
        }
    }

    // Métodos del carrito
    agregarAlCarrito(producto, cantidad = 1) {
        const itemExistente = this.carrito.find(item => item.id === producto.id);
        
        if (itemExistente) {
            itemExistente.cantidad += cantidad;
            itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
        } else {
            this.carrito.push({
                ...producto,
                cantidad,
                subtotal: cantidad * producto.precio
            });
        }
        
        this.actualizarCarritoUI();
        this.mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
    }

    quitarDelCarrito(productoId) {
        this.carrito = this.carrito.filter(item => item.id !== productoId);
        this.actualizarCarritoUI();
    }

    vaciarCarrito() {
        this.carrito = [];
        this.actualizarCarritoUI();
    }

    actualizarCarritoUI() {
        const cartCount = document.querySelector('.cart-count');
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total');
        
        if (cartCount) cartCount.textContent = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        if (cartItems) {
            cartItems.innerHTML = this.carrito.map(item => `
                <div class="cart-item flex justify-between items-center p-2 border-b">
                    <div>
                        <h4 class="font-semibold">${item.name}</h4>
                        <p class="text-sm text-gray-600">$${item.price} x ${item.cantidad}</p>
                    </div>
                    <button onclick="sistema.quitarDelCarrito('${item.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        
        if (cartTotal) {
            const total = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
            cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    // Métodos de reportes
    async obtenerVentasPorPeriodo(inicio, fin) {
        try {
            const response = await fetch(`${this.apiUrl}/sales?startDate=${inicio}&endDate=${fin}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.sales || [];
            } else {
                console.error('Error al obtener ventas por período:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    async obtenerProductosMasVendidos() {
        try {
            const response = await fetch(`${this.apiUrl}/reports/top-products`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.products || [];
            } else {
                console.error('Error al obtener productos más vendidos:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    // Métodos de utilidad
    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(cantidad);
    }

    formatearFecha(fecha) {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(fecha));
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            tipo === 'success' ? 'bg-green-500 text-white' :
            tipo === 'error' ? 'bg-red-500 text-white' :
            tipo === 'warning' ? 'bg-yellow-500 text-black' :
            'bg-blue-500 text-white'
        }`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }

    // Inicialización de eventos
    inicializarEventos() {
        document.addEventListener('DOMContentLoaded', () => {
            this.verificarAutenticacion();
            this.actualizarCarritoUI();
        });
    }
}

// Instancia global del sistema
const sistema = new SistemaVentas();

// Funciones auxiliares para la UI
function mostrarModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function ocultarModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function toggleCarrito() {
    const carrito = document.querySelector('.carrito-panel');
    carrito.classList.toggle('translate-x-full');
}

// Animaciones con Anime.js
function animarElementos() {
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });
    }
}

// Inicializar animaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animarElementos, 100);
});

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SistemaVentas, sistema };
}