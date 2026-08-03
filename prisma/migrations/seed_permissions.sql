-- Seed Permission records (all module × action combinations)
INSERT INTO "Permission" ("id", "module", "action", "label") VALUES
  (gen_random_uuid()::text, 'dashboard',     'view',    'Ver dashboard'),
  (gen_random_uuid()::text, 'dashboard',     'create',  'Criar no dashboard'),
  (gen_random_uuid()::text, 'dashboard',     'edit',    'Editar no dashboard'),
  (gen_random_uuid()::text, 'dashboard',     'delete',  'Excluir no dashboard'),
  (gen_random_uuid()::text, 'dashboard',     'export',  'Exportar dashboard'),
  (gen_random_uuid()::text, 'dashboard',     'approve', 'Aprovar no dashboard'),
  (gen_random_uuid()::text, 'crm',           'view',    'Ver CRM'),
  (gen_random_uuid()::text, 'crm',           'create',  'Criar no CRM'),
  (gen_random_uuid()::text, 'crm',           'edit',    'Editar no CRM'),
  (gen_random_uuid()::text, 'crm',           'delete',  'Excluir no CRM'),
  (gen_random_uuid()::text, 'crm',           'export',  'Exportar CRM'),
  (gen_random_uuid()::text, 'crm',           'approve', 'Aprovar no CRM'),
  (gen_random_uuid()::text, 'clientes',      'view',    'Ver clientes'),
  (gen_random_uuid()::text, 'clientes',      'create',  'Criar clientes'),
  (gen_random_uuid()::text, 'clientes',      'edit',    'Editar clientes'),
  (gen_random_uuid()::text, 'clientes',      'delete',  'Excluir clientes'),
  (gen_random_uuid()::text, 'clientes',      'export',  'Exportar clientes'),
  (gen_random_uuid()::text, 'clientes',      'approve', 'Aprovar clientes'),
  (gen_random_uuid()::text, 'propostas',     'view',    'Ver propostas'),
  (gen_random_uuid()::text, 'propostas',     'create',  'Criar propostas'),
  (gen_random_uuid()::text, 'propostas',     'edit',    'Editar propostas'),
  (gen_random_uuid()::text, 'propostas',     'delete',  'Excluir propostas'),
  (gen_random_uuid()::text, 'propostas',     'export',  'Exportar propostas'),
  (gen_random_uuid()::text, 'propostas',     'approve', 'Aprovar propostas'),
  (gen_random_uuid()::text, 'pedidos',       'view',    'Ver pedidos'),
  (gen_random_uuid()::text, 'pedidos',       'create',  'Criar pedidos'),
  (gen_random_uuid()::text, 'pedidos',       'edit',    'Editar pedidos'),
  (gen_random_uuid()::text, 'pedidos',       'delete',  'Excluir pedidos'),
  (gen_random_uuid()::text, 'pedidos',       'export',  'Exportar pedidos'),
  (gen_random_uuid()::text, 'pedidos',       'approve', 'Aprovar pedidos'),
  (gen_random_uuid()::text, 'produtos',      'view',    'Ver produtos'),
  (gen_random_uuid()::text, 'produtos',      'create',  'Criar produtos'),
  (gen_random_uuid()::text, 'produtos',      'edit',    'Editar produtos'),
  (gen_random_uuid()::text, 'produtos',      'delete',  'Excluir produtos'),
  (gen_random_uuid()::text, 'produtos',      'export',  'Exportar produtos'),
  (gen_random_uuid()::text, 'produtos',      'approve', 'Aprovar produtos'),
  (gen_random_uuid()::text, 'estoque',       'view',    'Ver estoque'),
  (gen_random_uuid()::text, 'estoque',       'create',  'Criar no estoque'),
  (gen_random_uuid()::text, 'estoque',       'edit',    'Editar estoque'),
  (gen_random_uuid()::text, 'estoque',       'delete',  'Excluir do estoque'),
  (gen_random_uuid()::text, 'estoque',       'export',  'Exportar estoque'),
  (gen_random_uuid()::text, 'estoque',       'approve', 'Aprovar estoque'),
  (gen_random_uuid()::text, 'compras',       'view',    'Ver compras'),
  (gen_random_uuid()::text, 'compras',       'create',  'Criar compras'),
  (gen_random_uuid()::text, 'compras',       'edit',    'Editar compras'),
  (gen_random_uuid()::text, 'compras',       'delete',  'Excluir compras'),
  (gen_random_uuid()::text, 'compras',       'export',  'Exportar compras'),
  (gen_random_uuid()::text, 'compras',       'approve', 'Aprovar compras'),
  (gen_random_uuid()::text, 'financeiro',    'view',    'Ver financeiro'),
  (gen_random_uuid()::text, 'financeiro',    'create',  'Criar no financeiro'),
  (gen_random_uuid()::text, 'financeiro',    'edit',    'Editar financeiro'),
  (gen_random_uuid()::text, 'financeiro',    'delete',  'Excluir do financeiro'),
  (gen_random_uuid()::text, 'financeiro',    'export',  'Exportar financeiro'),
  (gen_random_uuid()::text, 'financeiro',    'approve', 'Aprovar financeiro'),
  (gen_random_uuid()::text, 'relatorios',    'view',    'Ver relatórios'),
  (gen_random_uuid()::text, 'relatorios',    'create',  'Criar relatórios'),
  (gen_random_uuid()::text, 'relatorios',    'edit',    'Editar relatórios'),
  (gen_random_uuid()::text, 'relatorios',    'delete',  'Excluir relatórios'),
  (gen_random_uuid()::text, 'relatorios',    'export',  'Exportar relatórios'),
  (gen_random_uuid()::text, 'relatorios',    'approve', 'Aprovar relatórios'),
  (gen_random_uuid()::text, 'configuracoes', 'view',    'Ver configurações'),
  (gen_random_uuid()::text, 'configuracoes', 'create',  'Criar configurações'),
  (gen_random_uuid()::text, 'configuracoes', 'edit',    'Editar configurações'),
  (gen_random_uuid()::text, 'configuracoes', 'delete',  'Excluir configurações'),
  (gen_random_uuid()::text, 'configuracoes', 'export',  'Exportar configurações'),
  (gen_random_uuid()::text, 'configuracoes', 'approve', 'Aprovar configurações')
ON CONFLICT ("module", "action") DO NOTHING;

-- Link roles to their permissions
DO $$ BEGIN

  -- ADMIN: todas as permissões
  INSERT INTO "RolePermission" ("roleId", "permissionId")
  SELECT r.id, p.id
  FROM "Role" r, "Permission" p
  WHERE r.name = 'ADMIN'
  ON CONFLICT DO NOTHING;

  -- GERENTE
  INSERT INTO "RolePermission" ("roleId", "permissionId")
  SELECT r.id, p.id
  FROM "Role" r, "Permission" p
  WHERE r.name = 'GERENTE'
    AND (p.module, p.action) IN (
      ('dashboard',  'view'),
      ('crm',        'view'), ('crm',        'create'), ('crm',    'edit'), ('crm',    'delete'),
      ('clientes',   'view'), ('clientes',   'create'), ('clientes','edit'),
      ('propostas',  'view'), ('propostas',  'create'), ('propostas','edit'), ('propostas','approve'),
      ('pedidos',    'view'), ('pedidos',    'create'), ('pedidos', 'edit'),
      ('produtos',   'view'),
      ('estoque',    'view'),
      ('compras',    'view'),
      ('financeiro', 'view'),
      ('relatorios', 'view'), ('relatorios', 'export'),
      ('configuracoes','view')
    )
  ON CONFLICT DO NOTHING;

  -- VENDEDOR
  INSERT INTO "RolePermission" ("roleId", "permissionId")
  SELECT r.id, p.id
  FROM "Role" r, "Permission" p
  WHERE r.name = 'VENDEDOR'
    AND (p.module, p.action) IN (
      ('dashboard', 'view'),
      ('crm',       'view'), ('crm',      'create'), ('crm',      'edit'),
      ('clientes',  'view'), ('clientes', 'create'), ('clientes', 'edit'),
      ('propostas', 'view'), ('propostas','create'), ('propostas','edit'),
      ('pedidos',   'view'), ('pedidos',  'create'),
      ('produtos',  'view')
    )
  ON CONFLICT DO NOTHING;

  -- FINANCEIRO
  INSERT INTO "RolePermission" ("roleId", "permissionId")
  SELECT r.id, p.id
  FROM "Role" r, "Permission" p
  WHERE r.name = 'FINANCEIRO'
    AND (p.module, p.action) IN (
      ('dashboard',  'view'),
      ('clientes',   'view'),
      ('pedidos',    'view'),
      ('financeiro', 'view'), ('financeiro','create'), ('financeiro','edit'),
      ('relatorios', 'view'), ('relatorios','export')
    )
  ON CONFLICT DO NOTHING;

  -- ESTOQUE
  INSERT INTO "RolePermission" ("roleId", "permissionId")
  SELECT r.id, p.id
  FROM "Role" r, "Permission" p
  WHERE r.name = 'ESTOQUE'
    AND (p.module, p.action) IN (
      ('dashboard', 'view'),
      ('produtos',  'view'), ('produtos','create'), ('produtos','edit'),
      ('estoque',   'view'), ('estoque', 'create'), ('estoque', 'edit'),
      ('compras',   'view')
    )
  ON CONFLICT DO NOTHING;

END $$;
