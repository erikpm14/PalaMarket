import { storage } from '../services/storage.js';

const listeners = new Set();
const state = {
  favorites: storage.get('favorites', []),
  cart: storage.get('cart', []),
  user: storage.get('user', null),
  theme: storage.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  cartOpen: false,
};

const notify = () => listeners.forEach((listener) => listener({ ...state }));
const persist = () => {
  storage.set('favorites', state.favorites);
  storage.set('cart', state.cart);
  storage.set('user', state.user);
  storage.set('theme', state.theme);
};

export const appState = {
  get: () => ({ ...state }),
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  isFavorite(id) { return state.favorites.includes(id); },
  toggleFavorite(id) {
    state.favorites = state.favorites.includes(id)
      ? state.favorites.filter((item) => item !== id)
      : [...state.favorites, id];
    persist(); notify();
  },
  addToCart(id) {
    const line = state.cart.find((item) => item.id === id);
    state.cart = line
      ? state.cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...state.cart, { id, quantity: 1 }];
    state.cartOpen = true; persist(); notify();
  },
  setQuantity(id, quantity) {
    state.cart = quantity <= 0 ? state.cart.filter((item) => item.id !== id) : state.cart.map((item) => item.id === id ? { ...item, quantity } : item);
    persist(); notify();
  },
  removeFromCart(id) { state.cart = state.cart.filter((item) => item.id !== id); persist(); notify(); },
  clearCart() { state.cart = []; persist(); notify(); },
  toggleCart(force) { state.cartOpen = typeof force === 'boolean' ? force : !state.cartOpen; notify(); },
  login(user) { state.user = user; persist(); notify(); },
  logout() { state.user = null; persist(); notify(); },
  toggleTheme() { state.theme = state.theme === 'light' ? 'dark' : 'light'; persist(); notify(); },
};
