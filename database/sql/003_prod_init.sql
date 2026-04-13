BEGIN;

-- 1. Limpeza de tabelas e tipos (se existirem, para garantir recriação limpa)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS barber_specialties CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- 2. Extensões
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Tipos Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'cancelled');
  END IF;
END $$;

-- 4. Função de Trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. Tabelas
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'customer',
  name VARCHAR(120) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barbers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 18 AND 100),
  hire_date DATE NOT NULL CHECK (hire_date <= CURRENT_DATE),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS specialties (
  id BIGSERIAL PRIMARY KEY,
  name CITEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_specialties (
  barber_id BIGINT NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
  specialty_id BIGINT NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (barber_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  barber_id BIGINT NOT NULL,
  specialty_id BIGINT NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appointments_barber_specialty_fk
    FOREIGN KEY (barber_id, specialty_id)
    REFERENCES barber_specialties(barber_id, specialty_id)
    ON DELETE RESTRICT,
  CONSTRAINT appointments_slot_duration_chk
    CHECK (end_at = start_at + INTERVAL '30 minutes'),
  CONSTRAINT appointments_cancelled_consistency_chk
    CHECK (
      (status = 'cancelled' AND cancelled_at IS NOT NULL)
      OR (status <> 'cancelled' AND cancelled_at IS NULL)
    )
);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(active);
CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties(active);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_start_at ON appointments(customer_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at_status ON appointments(start_at, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_barber_active_slot
  ON appointments(barber_id, start_at)
  WHERE status = 'scheduled';

-- 7. Triggers
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_barbers_set_updated_at ON barbers;
CREATE TRIGGER trg_barbers_set_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_specialties_set_updated_at ON specialties;
CREATE TRIGGER trg_specialties_set_updated_at BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_set_updated_at ON appointments;
CREATE TRIGGER trg_appointments_set_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();


---------- INSERÇÃO DOS DADOS INICIAIS DE PRODUÇÃO ----------
SET TIME ZONE 'America/Sao_Paulo';

-- Admin Único de Produção
INSERT INTO users (role, name, email, password_hash)
VALUES
  ('admin', 'Administrador NicattoBeard', 'admin@nicattobeard.com', crypt('Admin@123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE
SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Especialidades Core da Barbearia
INSERT INTO specialties (name, description)
VALUES
  ('Barba', 'Modelagem e acabamento de barba'),
  ('Corte de tesoura', 'Corte manual com acabamento refinado'),
  ('Sobrancelha', 'Alinhamento e acabamento de sobrancelha')
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  updated_at = NOW();

COMMIT;
