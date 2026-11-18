create table if not exists daybook_state (
  owner text primary key,
  state jsonb not null,
  resume bytea,
  resume_filename text,
  resume_type text,
  updated_at timestamptz not null default now()
);

create table if not exists daybook_drafts (
  owner text not null,
  id text not null,
  eml text not null,
  primary key (owner, id)
);
