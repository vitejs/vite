import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useParams, Link } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Tag, ChevronDown, Loader, Minus, Plus } from 'lucide-react';

// --- DATOS MOCKADOS (Simulación de la base de datos) ---
const products = [
  { id: 1, name: 'Laptop Ultraligera X1', price: 1200, category: 'electronica', description: 'Potente laptop con chasis de aluminio, ideal para el trabajo y el entretenimiento.', stock: 5 },
  { id: 2, name: 'Smartphone Z Pro', price: 899, category: 'electronica', description: 'Cámara de 108MP y batería de larga duración. La mejor experiencia móvil.', stock: 12 },
  { id: 3, name: 'Sudadera Algodón Premium', price: 55, category: 'ropa', description: 'Máximo confort y estilo minimalista. Disponible en varios colores.', stock: 20 },
  { id: 4, name: 'Jeans Slim Fit', price: 75, category: 'ropa', description: 'Corte moderno y tela elástica. Perfectos para el día a día.', stock: 15 },
  { id: 5, name: 'Libro: El Camino del Desarrollador', price: 25, category: 'libros', description: 'Guía esencial para construir tu carrera en la programación.', stock: 30 },
  { id: 6, name: 'Auriculares Inalámbricos', price: 150, category: 'accesorios', description: 'Sonido de alta fidelidad y cancelación de ruido activa.', stock: 8 },
];

const categories = [
  { id: 'electronica', name: 'Electrónica' },
  { id: 'ropa', name: 'Ropa' },
  { id: 'libros', name: 'Libros' },
  { id: 'accesorios', name: 'Accesorios' },
];

// --- FUNCIONES ASÍNCRONAS (Simulación de llamadas a API) ---

/**
 * Simula la obtención de productos (todos o por categoría) después de 1 segundo.
 * @param {string} categoryId - ID de la categoría para filtrar (opcional).
 * @returns {Promise<Array<object>>} - Promesa que resuelve la lista de productos.
 */
const fetchProducts = (categoryId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (categoryId) {
        const filtered = products.filter(p => p.category === categoryId);
        resolve(filtered);
      } else {
        resolve(products);
      }
    }, 1000); // 1 segundo de retardo
  });
};

/**
 * Simula la obtención de un producto por ID después de 1 segundo.
 * @param {number} id - ID del producto a buscar.
 * @returns {Promise<object | null>} - Promesa que resuelve el producto o null.
 */
const fetchProductById = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Nota: Convertir id a número, ya que useParams lo devuelve como string
      const product = products.find(p => p.id === parseInt(id));
      resolve(product || null);
    }, 1000); // 1 segundo de retardo
  });
};

// --- CONTEXTO DEL CARRITO (Global State) ---

/**
 * Contexto de React para manejar el estado del carrito de compras.
 */
const CartContext = React.createContext();

/**
 * Proveedor del Contexto del Carrito.
 * Maneja el estado global del carrito y la lógica de notificaciones toast.
 */
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // [{ item, quantity }]
  const [toastMessage, setToastMessage] = useState(null);

  // Lógica para agregar o actualizar un ítem en el carrito
  const addItem = (item, quantity) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item.id === item.id);
      
      if (existingItemIndex > -1) {
        // Actualizar cantidad si ya existe
        const newCart = [...prevCart];
        
        // Calcular la nueva cantidad sin exceder el stock
        const potentialQuantity = newCart[existingItemIndex].quantity + quantity;
        const newQuantity = Math.min(potentialQuantity, item.stock);
        
        // Mostrar advertencia si se excede el stock
        if (potentialQuantity > item.stock) {
             setToastMessage({ type: 'info', text: `Stock limitado. Solo pudimos agregar ${item.stock - newCart[existingItemIndex].quantity} unidad(es) más de ${item.name}.` });
             setTimeout(() => setToastMessage(null), 3000);
        }

        newCart[existingItemIndex].quantity = newQuantity;
        return newCart;

      } else {
        // Agregar nuevo ítem
        return [...prevCart, { item, quantity: Math.min(quantity, item.stock) }];
      }
    });
    
    // Mostrar notificación (se superpone si hay advertencia de stock)
    setToastMessage({ type: 'success', text: `Agregaste ${quantity} x ${item.name} al carrito.` });
    setTimeout(() => setToastMessage(null), 3000); // Ocultar después de 3 segundos
  };

    /**
   * Actualiza la cantidad de un ítem directamente en el carrito.
   * @param {number} itemId - ID del ítem a actualizar.
   * @param {number} newQuantity - Nueva cantidad deseada.
   */
    const updateItemQuantity = (itemId, newQuantity) => {
        setCart(prevCart => {
          const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item.id === itemId);
    
          if (existingItemIndex > -1) {
            const item = prevCart[existingItemIndex].item;
            // Asegurar que la cantidad sea al menos 1 y no exceda el stock
            const quantityToSet = Math.max(1, Math.min(newQuantity, item.stock));
    
            if (quantityToSet !== prevCart[existingItemIndex].quantity) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity = quantityToSet;
                
                if (newQuantity > item.stock) {
                    setToastMessage({ type: 'info', text: `Stock limitado. La cantidad de ${item.name} se ajustó a ${item.stock}.` });
                    setTimeout(() => setToastMessage(null), 3000);
                } else {
                    setToastMessage({ type: 'info', text: `Cantidad de ${item.name} actualizada a ${quantityToSet}.` });
                    setTimeout(() => setToastMessage(null), 3000);
                }
    
                return newCart;
            }
          }
          return prevCart; // Devuelve sin cambios si no se encontró o la cantidad es la misma
        });
    };


  // Función para calcular el total de ítems en el carrito (para el Navbar)
  const getTotalItems = () => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  };
  
  // Lógica para eliminar un ítem
  const removeItem = (itemId) => {
      setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
      setToastMessage({ type: 'info', text: `Ítem eliminado del carrito.` });
      setTimeout(() => setToastMessage(null), 3000);
  };

  // Lógica para limpiar el carrito
  const clearCart = () => {
      setCart([]);
      setToastMessage({ type: 'info', text: `Carrito vaciado.` });
      setTimeout(() => setToastMessage(null), 3000);
  };

  const contextValue = {
    cart,
    addItem,
    removeItem,
    clearCart,
    getTotalItems,
    updateItemQuantity,
    toastMessage,
    setToastMessage
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// --- COMPONENTE DE NOTIFICACIÓN TOAST (Reemplazo de alert()) ---
const ToastNotification = () => {
  const { toastMessage, setToastMessage } = React.useContext(CartContext);

  if (!toastMessage) return null;

  const colorClasses = toastMessage.type === 'success' 
    ? 'bg-green-500 border-green-700' 
    : toastMessage.type === 'info'
    ? 'bg-blue-500 border-blue-700'
    : 'bg-red-500 border-red-700';
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 p-4 rounded-xl text-white shadow-xl transition-opacity duration-300 transform opacity-100 ${colorClasses}`}
      role="alert"
    >
      <div className="flex items-center">
        <ShoppingCart size={20} className="mr-2"/>
        <p className="font-semibold">{toastMessage.text}</p>
        <button 
          onClick={() => setToastMessage(null)} 
          className="ml-4 text-white opacity-75 hover:opacity-100 focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
};


// --- COMPONENTES DE PRESENTACIÓN (Visuales) ---

/**
 * Componente Contador de Unidades (Presentación).
 */
const ItemCount = ({ stock, initial = 1, item }) => {
  const [count, setCount] = useState(initial);
  const { addItem } = React.useContext(CartContext); 

  const increment = () => {
    if (count < stock) {
      setCount(count + 1);
    }
  };

  const decrement = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const handleAddToCart = () => {
    if (item && count > 0 && count <= stock) {
      addItem(item, count); // Llamada al context
      setCount(1); // Resetear contador después de agregar
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-xl shadow-inner bg-gray-50">
      <div className="flex items-center space-x-4">
        <button
          onClick={decrement}
          disabled={count <= 1}
          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Minus size={18} />
        </button>
        <span className="text-3xl font-bold w-12 text-center">{count}</span>
        <button
          onClick={increment}
          disabled={count >= stock}
          className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
        
          <Plus size={18} />
        </button>
      </div>
      <p className="text-sm text-gray-600">Stock disponible: {stock}</p>
      <button
        onClick={handleAddToCart}
        disabled={stock === 0 || count === 0}
        className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
      >
        Agregar {count} al Carrito
      </button>
    </div>
  );
};

/**
 * Componente Tarjeta de Producto (Presentación).
 */
const Item = ({ product }) => (
  <Link 
    to={`/item/${product.id}`} 
    className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden border border-gray-100 transform hover:scale-[1.02] block h-full"
  >
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{product.name}</h3>
      <p className="text-2xl font-extrabold text-indigo-600 mb-3">${product.price}</p>
      <p className="text-sm text-gray-600 flex-grow mb-4 line-clamp-3">{product.description}</p>
      <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full w-fit">
        <Tag size={14} className="mr-1" />
        {product.category.toUpperCase()}
      </span>
    </div>
  </Link>
);

/**
 * Componente Lista de Productos (Presentación).
 */
const ItemList = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center p-10 bg-yellow-50 rounded-lg shadow-inner">
        <p className="text-xl text-yellow-700">No hay productos disponibles en esta categoría.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-semibold">
          Volver al catálogo principal
        </Link>
      </div>
    );
  }

  return (
    // Uso del método Array.map() y la prop "key"
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {items.map(product => (
        <Item key={product.id} product={product} />
      ))}
    </div>
  );
};

/**
 * Componente Detalle de Producto (Presentación).
 */
const ItemDetail = ({ item }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Lado Izquierdo: Imagen Placeholder */}
        <div className="w-full md:w-1/2 bg-gray-200 rounded-xl flex items-center justify-center p-12 h-64 md:h-auto">
          <LayoutGrid size={80} className="text-gray-500" />
        </div>

        {/* Lado Derecho: Contenido */}
        <div className="w-full md:w-1/2">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 inline-block">
            {item.category.toUpperCase()}
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{item.name}</h1>
          <p className="text-3xl font-bold text-red-600 mb-6">${item.price}</p>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">Descripción</h2>
          <p className="text-gray-600 mb-6">{item.description}</p>

          {/* Componente Contador e Interacción */}
          <ItemCount stock={item.stock} item={item} />
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTES CONTENEDORES (Lógica y Estado) ---

/**
 * Contenedor para la Lista de Productos (Catálogo) - Maneja estado y fetching.
 */
const ItemListContainer = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Uso del hook useParams() para leer el segmento actual de la URL
  const { categoryId } = useParams();

  // Función para obtener y establecer los productos
  const loadItems = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await fetchProducts(id);
      setItems(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setItems([]); // Limpiar en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect se ejecuta cada vez que 'categoryId' o 'loadItems' cambian
  useEffect(() => {
    // La dependencia 'categoryId' asegura que el filtro se actualice al navegar
    // Este es el uso recomendado para el parámetro URL
    loadItems(categoryId);
  }, [categoryId, loadItems]);

  const title = categoryId 
    ? categories.find(c => c.id === categoryId)?.name || 'Categoría Desconocida'
    : 'Catálogo Principal de Productos';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2">
        {title}
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader className="animate-spin text-indigo-600" size={40} />
          <p className="ml-3 text-lg text-indigo-600">Cargando productos...</p>
        </div>
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
};

/**
 * Contenedor para el Detalle de Producto - Maneja estado y fetching de un solo item.
 */
const ItemDetailContainer = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  // Uso del hook useParams() para leer el ID del producto
  const { itemId } = useParams();

  // Función para obtener y establecer el producto
  const loadItemDetail = useCallback(async (id) => {
    setLoading(true);
    setItem(null); // Limpiar detalle anterior
    try {
      const data = await fetchProductById(id);
      setItem(data);
    } catch (error) {
      console.error("Error al cargar detalle del producto:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect se ejecuta cada vez que 'itemId' o 'loadItemDetail' cambian
  useEffect(() => {
    // Esta dependencia asegura la recarga al cambiar el ID del producto
    loadItemDetail(itemId);
  }, [itemId, loadItemDetail]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-indigo-600" size={40} />
        <p className="ml-3 text-lg text-indigo-600">Cargando detalle del producto...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center p-10 bg-red-50 rounded-xl shadow-lg max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-red-700 mb-4">404 - Producto No Encontrado</h1>
        <p className="text-lg text-red-600">El producto con ID "{itemId}" no existe.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-semibold underline">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ItemDetail item={item} />
    </div>
  );
};

/**
 * Contenedor para el Carrito de Compras.
 */
const CartContainer = () => {
    const { cart, removeItem, clearCart, getTotalItems, updateItemQuantity } = React.useContext(CartContext);
    
    const subtotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-2">
                <ShoppingCart size={32} className="inline mr-3"/>
                Tu Carrito de Compras ({getTotalItems()} Items)
            </h1>

            {cart.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-xl shadow-lg border border-indigo-100">
                    <p className="text-2xl text-gray-600 mb-4">Tu carrito está vacío.</p>
                    <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300">
                        Explorar Productos
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lista de Ítems */}
                    <div className="flex-grow bg-white rounded-xl shadow-lg p-6 space-y-4">
                        {cart.map(cartItem => (
                            <div key={cartItem.item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 last:border-b-0">
                                <Link to={`/item/${cartItem.item.id}`} className="flex items-center space-x-4 hover:text-indigo-600 transition mb-4 sm:mb-0">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Tag size={20} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{cartItem.item.name}</p>
                                        <p className="text-sm text-gray-500">${cartItem.item.price} c/u | Stock: {cartItem.item.stock}</p>
                                    </div>
                                </Link>
                                
                                <div className="flex items-center space-x-4 ml-auto sm:ml-0">
                                    {/* Control de Cantidad */}
                                    <div className="flex items-center space-x-1 border rounded-lg p-1 bg-gray-50">
                                        <button 
                                            onClick={() => updateItemQuantity(cartItem.item.id, cartItem.quantity - 1)}
                                            disabled={cartItem.quantity <= 1}
                                            className="p-1 text-gray-600 hover:text-indigo-600 disabled:opacity-50 transition"
                                            aria-label="Disminuir cantidad"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="text-md font-medium w-6 text-center">{cartItem.quantity}</span>
                                        <button 
                                            onClick={() => updateItemQuantity(cartItem.item.id, cartItem.quantity + 1)}
                                            disabled={cartItem.quantity >= cartItem.item.stock}
                                            className="p-1 text-gray-600 hover:text-indigo-600 disabled:opacity-50 transition"
                                            aria-label="Aumentar cantidad"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    
                                    <p className="text-lg font-bold text-red-600 w-20 text-right hidden sm:block">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</p>
                                    
                                    <button 
                                        onClick={() => removeItem(cartItem.item.id)}
                                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition"
                                        aria-label={`Eliminar ${cartItem.item.name}`}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={clearCart} 
                            className="text-sm text-red-500 hover:text-red-700 mt-4 pt-4 border-t w-full text-left"
                        >
                            Vaciar Carrito
                        </button>
                    </div>

                    {/* Resumen del Pedido */}
                    <div className="lg:w-1/3 bg-white rounded-xl shadow-lg p-6 h-fit border border-indigo-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Resumen</h2>
                        <div className="flex justify-between text-lg font-medium text-gray-600 mb-3">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-medium text-gray-600 mb-6">
                            <span>Envío:</span>
                            <span className="text-green-600">Gratis</span>
                        </div>
                        <div className="flex justify-between text-2xl font-extrabold text-gray-900 border-t pt-4">
                            <span>Total:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {/* El botón de compra se deja como marcador de posición para futuras implementaciones */}
                        <div className="mt-6 w-full py-3 text-center bg-gray-400 text-white font-semibold rounded-lg shadow-lg opacity-70 cursor-not-allowed">
                            Finalizar Compra (Próximamente)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- COMPONENTES DE ESTRUCTURA Y NAVEGACIÓN ---

/**
 * Componente Navbar - Contiene la navegación principal.
 */
const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getTotalItems } = React.useContext(CartContext); 

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const linkClasses = "px-3 py-2 rounded-lg font-medium transition duration-150";

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Home Link */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-extrabold text-indigo-600">
              EcomStore
            </Link>
          </div>

          {/* Links Principales (Desktop) */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) => 
                `${linkClasses} ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`
              }
            >
              <LayoutGrid size={18} className="inline mr-1" /> Catálogo
            </NavLink>

            {/* Dropdown de Categorías */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className={`${linkClasses} flex items-center text-gray-600 hover:bg-gray-50`}
              >
                Categorías <ChevronDown size={16} className={`ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    {categories.map(cat => (
                      // Enlace dinámico a /category/:categoryId
                      <NavLink
                        key={cat.id}
                        to={`/category/${cat.id}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className={({ isActive }) => 
                          `block px-4 py-2 text-sm ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`
                        }
                      >
                        {cat.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Carrito (Derecha) */}
          <div className="flex items-center">
            <Link 
              to="/cart"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition relative"
              aria-label="Ver Carrito de Compras"
            >
              <ShoppingCart size={24} />
              {/* Muestra el contador total de ítems */}
              {getTotalItems() > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * Componente para la ruta 404 (Not Found).
 */
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
    <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
    <p className="text-3xl font-semibold text-gray-800 mt-4 mb-2">Página No Encontrada</p>
    <p className="text-lg text-gray-600 mb-8">
      Parece que te has perdido en el ciberespacio de nuestra tienda.
    </p>
    <Link 
      to="/" 
      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition"
    >
      Volver al Catálogo Principal
    </Link>
  </div>
);


// --- COMPONENTE PRINCIPAL DE LA APLICACIÓN ---

const App = () => {
  return (
    // Envuelve toda la aplicación en el CartProvider y agrega el Toast
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <main className="py-8">
            {/* Definición de las rutas de la aplicación */}
            <Routes>
              {/* Ruta 1: Catálogo Principal */}
              <Route path="/" element={<ItemListContainer />} />

              {/* Ruta 2: Catálogo Filtrado por Categoría - Usa el contenedor ItemListContainer */}
              <Route path="/category/:categoryId" element={<ItemListContainer />} />

              {/* Ruta 3: Vista Detalle del Producto - Usa el contenedor ItemDetailContainer */}
              <Route path="/item/:itemId" element={<ItemDetailContainer />} />
              
              {/* Ruta 4: Carrito de Compras */}
              <Route path="/cart" element={<CartContainer />} /> 
              
              {/* Ruta 5: 404 Not Found (path="*") */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <ToastNotification /> {/* Notificación Toast */}
          <footer className="bg-gray-800 text-white p-4 text-center text-sm mt-8">
            Tienda Demo | Desarrollado con React, React Router y Context API
          </footer>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
};

export default App;
