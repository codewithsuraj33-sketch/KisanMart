-- ============================================================
-- KisanMart — Order helper functions
-- Run in Supabase SQL Editor (ek baar).
--
-- ⚠️ NOTE: decrement_stock ki definition yahan aur commerce-features.sql
-- mein BILKUL identical hai — jaan-boojh ke. Pehle yahan ek "permissive"
-- version thi jo stock ko chup-chaap greatest(stock - qty, 0) se 0 pe clamp
-- kar deti thi. Agar wo file commerce-features.sql ke BAAD run hoti to
-- oversell-safe version overwrite ho jaati aur overselling wapas aa jaati.
-- Ab dono jagah same strict version hai, isliye run-order maayne nahi rakhta.
-- ============================================================

-- Payment verify hone ke baad stock kam karne ke liye.
-- SECURITY DEFINER => sirf service role (server / API route) call kar sakta hai.
-- Stock kam pade to CHUP-CHAAP oversell karne ke bajaye FAIL karta hai.
create or replace function public.decrement_stock(p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty <= 0 then raise exception 'Quantity must be positive'; end if;
  update public.products set stock = stock - p_qty
  where id = p_product_id and stock >= p_qty;
  if not found then raise exception 'Insufficient stock'; end if;
end;
$$;

-- API se direct callable na ho — sirf service role (server) ke liye.
revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
