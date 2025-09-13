-- Restaurants table for AI chatbot suggestions and coupons
-- Run this in Supabase (SQL editor) or via your migration runner

create table if not exists public.restaurants (
  id uuid not null default gen_random_uuid (),
  name text not null,
  address text not null,
  description text null,
  working_hours text not null,
  discount_coupons jsonb null,
  created_at timestamp with time zone null default now(),
  constraint restaurants_pkey primary key (id)
) TABLESPACE pg_default;

-- Sample seed data (safe to run multiple times; uses upserts by name)
-- Adjust addresses/hours as needed
insert into public.restaurants (name, address, description, working_hours, discount_coupons)
values
  (
    'Amber & Oak',
    '12 King''s Road, London SW3',
    'Cozy modern British with warm ambiance — ideal for date nights.',
    'Mon–Sun 12:00–22:30',
    '[{"code":"AC-LOVE-20","description":"20% off mains","percent":20,"expires_at":"2025-12-31"}]'::jsonb
  ),
  (
    'Luna Trattoria',
    '5 River Street, Manchester M1',
    'Authentic Italian classics and wood-fired pizzas.',
    'Tue–Sun 12:00–23:00',
    '[{"code":"LUNA-DATE-15","description":"15% off food bill","percent":15}]'::jsonb
  ),
  (
    'Saffron Garden',
    '88 High Street, Birmingham B1',
    'Modern Indian cuisine with a refined twist.',
    'Mon–Sat 12:30–22:00',
    '{"code":"SPICE-2FOR1","description":"2-for-1 on starters"}'::jsonb
  )
on conflict (name) do update set
  address = excluded.address,
  description = excluded.description,
  working_hours = excluded.working_hours,
  discount_coupons = excluded.discount_coupons;
