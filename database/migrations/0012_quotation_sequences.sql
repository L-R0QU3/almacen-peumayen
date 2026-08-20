-- 0012: quotation_sequences — numeración atómica por año (COT-2026-0001, ...)
create table public.quotation_sequences (
  year        integer not null primary key check (year >= 2000),
  last_number integer not null default 0 check (last_number >= 0)
);
