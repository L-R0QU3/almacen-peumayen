-- 0001: Extensiones requeridas
create extension if not exists pgcrypto;    -- gen_random_uuid()
create extension if not exists citext;      -- emails case-insensitive
create extension if not exists pg_trgm;     -- búsquedas difusas (trigram)
