BEGIN;

SET TIME ZONE 'America/Sao_Paulo';

INSERT INTO users (role, name, email, password_hash)
VALUES
  ('admin', 'Administrador NicattoBeard', 'admin@nicattobeard.com', crypt('Admin@123', gen_salt('bf'))),
  ('customer', 'Joao Silva', 'joao.silva@example.com', crypt('Cliente@123', gen_salt('bf'))),
  ('customer', 'Maria Oliveira', 'maria.oliveira@example.com', crypt('Cliente@456', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE
SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

INSERT INTO specialties (name, description)
VALUES
  ('Barba', 'Modelagem e acabamento de barba'),
  ('Corte de tesoura', 'Corte manual com acabamento refinado'),
  ('Sobrancelha', 'Alinhamento e acabamento de sobrancelha')
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO barbers (name, age, hire_date)
SELECT 'Rafael Costa', 31, CURRENT_DATE - 760
WHERE NOT EXISTS (SELECT 1 FROM barbers WHERE name = 'Rafael Costa');

INSERT INTO barbers (name, age, hire_date)
SELECT 'Bruno Lima', 28, CURRENT_DATE - 430
WHERE NOT EXISTS (SELECT 1 FROM barbers WHERE name = 'Bruno Lima');

INSERT INTO barbers (name, age, hire_date)
SELECT 'Diego Santos', 35, CURRENT_DATE - 1120
WHERE NOT EXISTS (SELECT 1 FROM barbers WHERE name = 'Diego Santos');

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Barba'
WHERE b.name = 'Rafael Costa'
ON CONFLICT DO NOTHING;

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Corte de tesoura'
WHERE b.name = 'Rafael Costa'
ON CONFLICT DO NOTHING;

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Corte de tesoura'
WHERE b.name = 'Bruno Lima'
ON CONFLICT DO NOTHING;

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Sobrancelha'
WHERE b.name = 'Bruno Lima'
ON CONFLICT DO NOTHING;

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Barba'
WHERE b.name = 'Diego Santos'
ON CONFLICT DO NOTHING;

INSERT INTO barber_specialties (barber_id, specialty_id)
SELECT b.id, s.id
FROM barbers b
JOIN specialties s ON s.name = 'Sobrancelha'
WHERE b.name = 'Diego Santos'
ON CONFLICT DO NOTHING;

WITH customer_user AS (
  SELECT id
  FROM users
  WHERE email = 'joao.silva@example.com'
),
rafael_barba AS (
  SELECT b.id AS barber_id, s.id AS specialty_id
  FROM barbers b
  JOIN specialties s ON s.name = 'Barba'
  WHERE b.name = 'Rafael Costa'
)
INSERT INTO appointments (
  customer_id,
  barber_id,
  specialty_id,
  status,
  start_at,
  end_at,
  cancelled_at,
  cancellation_reason,
  notes
)
SELECT
  c.id,
  rb.barber_id,
  rb.specialty_id,
  'scheduled',
  CURRENT_DATE + TIME '09:00',
  CURRENT_DATE + TIME '09:30',
  NULL,
  NULL,
  'Atendimento demonstrativo do dia atual'
FROM customer_user c
CROSS JOIN rafael_barba rb
WHERE NOT EXISTS (
  SELECT 1
  FROM appointments a
  WHERE a.barber_id = rb.barber_id
    AND a.start_at = CURRENT_DATE + TIME '09:00'
);

WITH customer_user AS (
  SELECT id
  FROM users
  WHERE email = 'joao.silva@example.com'
),
bruno_tesoura AS (
  SELECT b.id AS barber_id, s.id AS specialty_id
  FROM barbers b
  JOIN specialties s ON s.name = 'Corte de tesoura'
  WHERE b.name = 'Bruno Lima'
)
INSERT INTO appointments (
  customer_id,
  barber_id,
  specialty_id,
  status,
  start_at,
  end_at,
  cancelled_at,
  cancellation_reason,
  notes
)
SELECT
  c.id,
  bt.barber_id,
  bt.specialty_id,
  'scheduled',
  CURRENT_DATE + 1 + TIME '10:00',
  CURRENT_DATE + 1 + TIME '10:30',
  NULL,
  NULL,
  'Atendimento futuro para validar agenda administrativa'
FROM customer_user c
CROSS JOIN bruno_tesoura bt
WHERE NOT EXISTS (
  SELECT 1
  FROM appointments a
  WHERE a.barber_id = bt.barber_id
    AND a.start_at = CURRENT_DATE + 1 + TIME '10:00'
);

WITH customer_user AS (
  SELECT id
  FROM users
  WHERE email = 'joao.silva@example.com'
),
diego_sobrancelha AS (
  SELECT b.id AS barber_id, s.id AS specialty_id
  FROM barbers b
  JOIN specialties s ON s.name = 'Sobrancelha'
  WHERE b.name = 'Diego Santos'
)
INSERT INTO appointments (
  customer_id,
  barber_id,
  specialty_id,
  status,
  start_at,
  end_at,
  cancelled_at,
  cancellation_reason,
  notes
)
SELECT
  c.id,
  ds.barber_id,
  ds.specialty_id,
  'cancelled',
  CURRENT_DATE + 2 + TIME '14:00',
  CURRENT_DATE + 2 + TIME '14:30',
  NOW(),
  'Cliente solicitou cancelamento para teste',
  'Registro cancelado para demonstracao da regra de negocio'
FROM customer_user c
CROSS JOIN diego_sobrancelha ds
WHERE NOT EXISTS (
  SELECT 1
  FROM appointments a
  WHERE a.barber_id = ds.barber_id
    AND a.start_at = CURRENT_DATE + 2 + TIME '14:00'
);

COMMIT;
