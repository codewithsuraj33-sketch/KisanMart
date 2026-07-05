// Shipping cost calculate karne ka logic — client aur server DONO
// isko import karte hain taaki dono jagah same number aaye.
// (Server wala hi asli/authoritative hai.)

export const FREE_SHIPPING_THRESHOLD = 999 // isse upar free delivery
export const SHIPPING_FLAT = 50 // warna flat ₹50

export function calcShipping(itemsTotal: number): number {
  return itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT
}
