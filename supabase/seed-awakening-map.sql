-- Minimal Awakening Map seed for staging/demo environments.
-- Safe to run repeatedly: rows are upserted by stable Brain node ids.

with upserted_nodes as (
  insert into public.node_projection (
    id,
    brain_node_id,
    node_type,
    slug,
    title,
    summary,
    content,
    status,
    credibility,
    claim_status,
    source_refs,
    published_at,
    is_stale
  )
  values
    (
      '10000000-0000-4000-8000-000000000001',
      'seed:topic:awakening-map',
      'topic',
      'awakening-map',
      'Карта пробуждения',
      'Опорная тема для интерактивной карты: показывает связи, источники и открытые хвосты.',
      jsonb_build_object(
        'facts',
        jsonb_build_array(
          jsonb_build_object(
            'text',
            'Карта должна показывать не готовые ответы, а проверяемые связи между темами, источниками и спорными утверждениями.',
            'source_refs',
            jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map'))
          )
        ),
        'related_node_refs',
        jsonb_build_array(
          jsonb_build_object('nodeId', 'seed:claim:source-first', 'relation', 'expands', 'reason', 'Метод чтения карты'),
          jsonb_build_object('nodeId', 'seed:source:tz-map', 'relation', 'supported_by', 'reason', 'ТЗ и исходный плакат')
        )
      ),
      'published',
      null,
      null,
      jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
      now(),
      false
    ),
    (
      '10000000-0000-4000-8000-000000000002',
      'seed:claim:source-first',
      'claim',
      null,
      'Source-first проверка',
      'Каждая публичная карточка и связь должны иметь источник или явный unresolved-хвост.',
      jsonb_build_object(
        'versions',
        jsonb_build_array(
          jsonb_build_object('text', 'Без источников карточка не должна выглядеть как доказанный факт.')
        ),
        'related_node_refs',
        jsonb_build_array(
          jsonb_build_object('nodeId', 'seed:source:tz-map', 'relation', 'supported_by')
        )
      ),
      'published',
      null,
      'supported',
      jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
      now(),
      false
    ),
    (
      '10000000-0000-4000-8000-000000000003',
      'seed:source:tz-map',
      'source',
      'interactive-map-brief',
      'ТЗ интерактивной карты',
      'Техническое задание и визуальный референс для первого публичного слоя карты.',
      jsonb_build_object(
        'source_type',
        'brief',
        'notes',
        jsonb_build_array('Seed source for validating the public map and dossier UI.')
      ),
      'published',
      'B',
      null,
      '[]'::jsonb,
      now(),
      false
    ),
    (
      '10000000-0000-4000-8000-000000000004',
      'seed:document:poster',
      'document',
      null,
      'Оригинальная карта Great Awakening',
      'Визуальный референс с темами, кластерами и плотной сетью ассоциаций.',
      jsonb_build_object(
        'related_node_refs',
        jsonb_build_array(
          jsonb_build_object('nodeId', 'seed:topic:awakening-map', 'relation', 'derived_from')
        )
      ),
      'published',
      null,
      null,
      jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
      now(),
      false
    )
  on conflict (brain_node_id) do update
  set
    node_type = excluded.node_type,
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    content = excluded.content,
    status = excluded.status,
    credibility = excluded.credibility,
    claim_status = excluded.claim_status,
    source_refs = excluded.source_refs,
    published_at = coalesce(public.node_projection.published_at, excluded.published_at),
    is_stale = false,
    updated_at = now()
  returning id, brain_node_id
)
insert into public.graph_edges (
  id,
  from_node_id,
  to_node_id,
  relation_type,
  strength,
  source_refs,
  status
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'expands',
    0.86,
    jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
    'published'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'supported_by',
    0.94,
    jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
    'published'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'derived_from',
    0.72,
    jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты')),
    'published'
  )
on conflict (id) do update
set
  from_node_id = excluded.from_node_id,
  to_node_id = excluded.to_node_id,
  relation_type = excluded.relation_type,
  strength = excluded.strength,
  source_refs = excluded.source_refs,
  status = excluded.status,
  updated_at = now();
