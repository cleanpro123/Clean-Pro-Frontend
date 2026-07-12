import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const key = (serviceId, itemId) => `${serviceId}:${itemId}`;

export function AppProvider({ children }) {
  const { profile, role } = useAuth();
  const [cart, setCart] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Hydrate addresses from the customer profile whenever it changes.
  useEffect(() => {
    if (role !== 'user' || !profile) {
      setAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    // Addresses arrive populated from the Address collection, each with its
    // own id. Fall back to a synthetic id only for any legacy entry missing one.
    const list = (profile.addresses || []).map((a, i) => ({
      ...a,
      id: a.id || a._id || `addr-${i}`,
    }));
    setAddresses(list);
    setSelectedAddressId(list[0]?.id || null);
  }, [profile, role]);

  const setQty = (serviceId, item, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      const k = key(serviceId, item.id);
      if (qty <= 0) {
        delete next[k];
      } else {
        next[k] = {
          serviceId,
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty,
        };
      }
      return next;
    });
  };

  const getQty = (serviceId, itemId) =>
    cart[key(serviceId, itemId)]?.qty || 0;

  const clearCart = () => setCart({});

  // Each address is its own document in the Address collection. We create and
  // delete them through dedicated endpoints and use the server's id.
  const addAddress = async (addr) => {
    const created = await api.post('/users/me/addresses', addr);
    const newAddr = { ...created, id: created.id || created._id };
    const next = [...addresses, newAddr];
    setAddresses(next);
    if (!selectedAddressId) setSelectedAddressId(newAddr.id);
    return newAddr;
  };

  const updateAddress = async (id, patch) => {
    const updated = await api.patch(`/users/me/addresses/${id}`, patch);
    const merged = { ...updated, id: updated.id || updated._id || id };
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...merged } : a)));
    return merged;
  };

  const removeAddress = async (id) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    if (selectedAddressId === id) {
      setSelectedAddressId(next[0]?.id || null);
    }
    try {
      await api.delete(`/users/me/addresses/${id}`);
    } catch {}
  };

  const totals = useMemo(() => {
    const items = Object.values(cart);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    return { subtotal, count, items };
  }, [cart]);

  const value = {
    cart,
    setQty,
    getQty,
    clearCart,
    totals,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    selectedAddressId,
    setSelectedAddressId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
