// Sistema de Ventas - Lógica Principal (Frontend - CORREGIDO)
class SistemaVentas {
    constructor() {
        this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
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

    // ============================================
    // MÉTODOS DE AUTENTICACIÓN
    // ============================================
    
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
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
            this.mostrarNotificacion('Error de conexión al servidor', 'error');
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
            return { success: false, error: 'Error de conexión' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.mostrarNotificacion('Logout exitoso', 'success');
        setTimeout(() => window.location.href = 'login.html', 1000);
    }

    verificarAutenticacion() {
        if (!this.token && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // ============================================
    // MÉTODOS PARA OBTENER DATOS
    // ============================================

    async obtenerProductos() {
      const response = await fetch(`${this.apiUrl}/products`);
      const data = await response.json();
      const extractedData = this.extractData(data);
      this.productos = extractedData.products || extractedData.data || [];
      return this.productos;
    }

    async obtenerClientes() {
        try {
            const response = await fetch(`${this.apiUrl}/customers`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.clientes = data.customers || data.data || [];
                return this.clientes;
            } else if (response.status === 401) {
                this.logout();
                return [];
            }
            return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    async obtenerVentas() {
        try {
            const response = await fetch(`${this.apiUrl}/sales`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.ventas = data.sales || data.data || [];
                return this.ventas;
            }
            return [];
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
                this.categorias = data.categories || data.data || [];
                return this.categorias;
            }
            return [];
        } catch (error) {
            console.error('Error de conexión:', error);
            return [];
        }
    }

    // ============================================
    // MÉTODOS PARA PRODUCTOS
    // ============================================

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
                await this.obtenerProductos();
                return { success: true, product: data.product };
            } else {
                this.mostrarNotificacion(data.message || 'Error al crear producto', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear producto:', error);
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
                await this.obtenerProductos();
                return { success: true, product: data.product };
            } else {
                this.mostrarNotificacion(data.message || 'Error al actualizar', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
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
                await this.obtenerProductos();
                return { success: true };
            } else {
                const data = await response.json();
                this.mostrarNotificacion(data.message || 'Error al eliminar', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // ✅ NUEVOS MÉTODOS FALTANTES
    agregarProducto(productoData) {
        return this.crearProducto(productoData);
    }

    editarProducto(id, datos) {
        return this.actualizarProducto(id, datos);
    }

    buscarProductos(termino) {
        const t = termino.toLowerCase();
        return this.productos.filter(p => 
            p.name?.toLowerCase().includes(t) ||
            p.nombre?.toLowerCase().includes(t) ||
            p.barcode?.toLowerCase().includes(t)
        );
    }

    filtrarPorCategoria(categoria) {
        if (categoria === 'todos') return this.productos;
        return this.productos.filter(p => 
            p.category?.name === categoria ||
            p.categoria === categoria
        );
    }

    obtenerProductosConStockBajo() {
        return this.productos.filter(p => 
            p.stock < (p.min_stock || 10) || p.stock < 10
        );
    }

    guardarProductos() {
        // El backend es la fuente de verdad, no guardamos localmente
        return this.obtenerProductos();
    }

    // ============================================
    // MÉTODOS PARA CLIENTES
    // ============================================

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
                await this.obtenerClientes();
                return { success: true, customer: data.customer };
            } else {
                this.mostrarNotificacion(data.message || 'Error al crear cliente', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear cliente:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async actualizarCliente(id, clienteData) {
        try {
            const response = await fetch(`${this.apiUrl}/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(clienteData)
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarNotificacion('Cliente actualizado exitosamente', 'success');
                await this.obtenerClientes();
                return { success: true, customer: data.customer };
            }
            return { success: false, error: data.message };
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    async eliminarCliente(id) {
        try {
            const response = await fetch(`${this.apiUrl}/customers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.mostrarNotificacion('Cliente eliminado exitosamente', 'success');
                await this.obtenerClientes();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // ✅ MÉTODO FALTANTE
    agregarCliente(datos) {
        return this.crearCliente(datos);
    }

    guardarClientes() {
        return this.obtenerClientes();
    }

    // ============================================
    // MÉTODOS PARA VENTAS
    // ============================================

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
                await this.obtenerVentas();
                return { success: true, sale: data.sale };
            } else {
                this.mostrarNotificacion(data.message || 'Error al procesar venta', 'error');
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error al crear venta:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    // ✅ MÉTODO FALTANTE - Procesar venta local
    procesarVenta(cliente, metodoPago) {
        if (this.carrito.length === 0) {
            this.mostrarNotificacion('El carrito está vacío', 'error');
            return null;
        }

        const venta = {
            id: `V${Date.now()}`,
            factura: `FAC${Date.now()}`,
            fecha: new Date().toLocaleString('es-MX'),
            cliente: cliente || { nombre: 'Cliente General' },
            productos: this.carrito.map(item => ({
                nombre: item.name || item.nombre,
                cantidad: item.cantidad,
                precio: item.price || item.precio,
                subtotal: item.subtotal
            })),
            metodoPago: metodoPago || 'Efectivo',
            total: this.carrito.reduce((sum, item) => sum + item.subtotal, 0),
            descuento: 0
        };

        // Guardar localmente para demo, en producción enviar al backend
        let ventas = JSON.parse(localStorage.getItem('ventas') || '[]');
        ventas.push(venta);
        localStorage.setItem('ventas', JSON.stringify(ventas));

        this.vaciarCarrito();
        this.actualizarCarritoUI();
        return venta;
    }

    // ============================================
    // MÉTODOS DEL CARRITO
    // ============================================

    agregarAlCarrito(producto, cantidad = 1) {
        const itemExistente = this.carrito.find(item => 
            item.id === producto.id
        );
        
        if (itemExistente) {
            itemExistente.cantidad += cantidad;
            itemExistente.subtotal = itemExistente.cantidad * 
                (itemExistente.price || itemExistente.precio);
        } else {
            this.carrito.push({
                ...producto,
                cantidad,
                subtotal: cantidad * (producto.price || producto.precio)
            });
        }
        
        this.actualizarCarritoUI();
        this.mostrarNotificacion(
            `${producto.name || producto.nombre} agregado al carrito`, 
            'success'
        );
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
        
        if (cartCount) {
            cartCount.textContent = this.carrito.reduce((sum, item) => 
                sum + item.cantidad, 0
            );
        }
        
        if (cartItems) {
            cartItems.innerHTML = this.carrito.map(item => `
                <div class="cart-item flex justify-between items-center p-2 border-b">
                    <div>
                        <h4 class="font-semibold">${item.name || item.nombre}</h4>
                        <p class="text-sm text-gray-600">
                            $${item.price || item.precio} x ${item.cantidad}
                        </p>
                    </div>
                    <button onclick="sistema.quitarDelCarrito('${item.id}')" 
                            class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        
        if (cartTotal) {
            const total = this.carrito.reduce((sum, item) => 
                sum + item.subtotal, 0
            );
            cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    // ============================================
    // MÉTODOS DE UTILIDAD
    // ============================================

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
        const colores = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        notificacion.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${colores[tipo]}`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }

    inicializarEventos() {
        document.addEventListener('DOMContentLoaded', () => {
            this.verificarAutenticacion();
            this.actualizarCarritoUI();
        });
    }
}

// Instancia global del sistema
const sistema = new SistemaVentas();

// ============================================
// FUNCIONES AUXILIARES GLOBALES
// ============================================

function mostrarModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function ocultarModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function toggleCarrito() {
    const carrito = document.querySelector('.carrito-panel');
    if (carrito) {
        carrito.classList.toggle('translate-x-full');
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animarElementos, 100);
    // Cargar datos iniciales
    sistema.obtenerProductos();
    sistema.obtenerClientes();
    sistema.obtenerVentas();
    sistema.obtenerCategorias();
});
