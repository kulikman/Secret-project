-- Extend public archive node types to match the Awakening Map contract.
--
-- Do not edit 0009 in place: deployed Supabase projects apply this as an
-- additive migration that replaces only the check constraint.

alter table public.node_projection
  drop constraint if exists node_projection_node_type_check;

alter table public.node_projection
  add constraint node_projection_node_type_check
  check (
    node_type in (
      'topic',
      'source',
      'claim',
      'person',
      'organization',
      'event',
      'tag',
      'document',
      'video'
    )
  );
