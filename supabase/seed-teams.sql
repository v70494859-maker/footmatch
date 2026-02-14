-- =====================================================
-- FootMatch — Teams, Friendships & Challenges Seed
-- 10 teams × 6 members, friendships, 25 challenges
-- Run AFTER seed.sql
-- =====================================================

-- ── Team Charters (captains must have signed) ──
INSERT INTO team_charters (user_id, signed_at) VALUES
  ('00000000-0000-0000-0000-000000000101', now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000000107', now() - interval '28 days'),
  ('00000000-0000-0000-0000-000000000113', now() - interval '26 days'),
  ('00000000-0000-0000-0000-000000000119', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000125', now() - interval '24 days'),
  ('00000000-0000-0000-0000-000000000131', now() - interval '22 days'),
  ('00000000-0000-0000-0000-000000000137', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000143', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000149', now() - interval '16 days'),
  ('00000000-0000-0000-0000-000000000155', now() - interval '14 days')
ON CONFLICT (user_id) DO NOTHING;

-- ── 10 Teams ──
INSERT INTO teams (id, name, description, crest_preset, captain_id, city, member_count, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'FC Jet d''Eau',        'Les rois du lac — on joue avec la pression !',    'blue',   '00000000-0000-0000-0000-000000000101', 'Genève',     6, now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000000002', 'Carouge City FC',      'Le foot de quartier, version premium.',            'red',    '00000000-0000-0000-0000-000000000107', 'Carouge',    6, now() - interval '28 days'),
  ('10000000-0000-0000-0000-000000000003', 'Les Aigles du Salève', 'On vise toujours plus haut.',                     'green',  '00000000-0000-0000-0000-000000000113', 'Veyrier',    6, now() - interval '26 days'),
  ('10000000-0000-0000-0000-000000000004', 'Onex United',          'Unis sur et en dehors du terrain.',                'orange', '00000000-0000-0000-0000-000000000119', 'Onex',       6, now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000005', 'Lancy Flames',         'Quand on arrive, ça brûle.',                      'red',    '00000000-0000-0000-0000-000000000125', 'Lancy',      6, now() - interval '24 days'),
  ('10000000-0000-0000-0000-000000000006', 'Vernier Wolves',       'La meute ne lâche jamais.',                       'purple', '00000000-0000-0000-0000-000000000131', 'Vernier',    6, now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000007', 'Thônex Thunder',       'Le tonnerre frappe deux fois.',                   'yellow', '00000000-0000-0000-0000-000000000137', 'Thônex',     6, now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000008', 'Meyrin Galaxy',        'Le foot interstellaire, c''est nous.',            'cyan',   '00000000-0000-0000-0000-000000000143', 'Meyrin',     6, now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000009', 'Plan-les-Ouates FC',   'Le plan est simple : gagner.',                    'green',  '00000000-0000-0000-0000-000000000149', 'Plan-les-Ouates', 6, now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000010', 'Chêne-Bourg Titans',   'Forts comme des chênes, rapides comme l''éclair.','blue',   '00000000-0000-0000-0000-000000000155', 'Chêne-Bourg', 6, now() - interval '14 days');

-- ── Team Members (captain + 5 members per team) ──
-- Team 1: FC Jet d'Eau (players 101-106)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'captain',    now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'co_captain', now() - interval '29 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', 'member',     now() - interval '28 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000104', 'member',     now() - interval '27 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000105', 'member',     now() - interval '26 days'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000106', 'member',     now() - interval '25 days');

-- Team 2: Carouge City FC (players 107-112)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000107', 'captain',    now() - interval '28 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000108', 'co_captain', now() - interval '27 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000109', 'member',     now() - interval '26 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000110', 'member',     now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000111', 'member',     now() - interval '24 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000112', 'member',     now() - interval '23 days');

-- Team 3: Les Aigles du Salève (players 113-118)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000113', 'captain',    now() - interval '26 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000114', 'co_captain', now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000115', 'member',     now() - interval '24 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000116', 'member',     now() - interval '23 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000117', 'member',     now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000118', 'member',     now() - interval '21 days');

-- Team 4: Onex United (players 119-124)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000119', 'captain',    now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000120', 'co_captain', now() - interval '24 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000121', 'member',     now() - interval '23 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000122', 'member',     now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000123', 'member',     now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000124', 'member',     now() - interval '20 days');

-- Team 5: Lancy Flames (players 125-130)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000125', 'captain',    now() - interval '24 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000126', 'co_captain', now() - interval '23 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000127', 'member',     now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000128', 'member',     now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000129', 'member',     now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000130', 'member',     now() - interval '19 days');

-- Team 6: Vernier Wolves (players 131-136)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000131', 'captain',    now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000132', 'co_captain', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000133', 'member',     now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000134', 'member',     now() - interval '19 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000135', 'member',     now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000136', 'member',     now() - interval '17 days');

-- Team 7: Thônex Thunder (players 137-142)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000137', 'captain',    now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000138', 'co_captain', now() - interval '19 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000139', 'member',     now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000140', 'member',     now() - interval '17 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000141', 'member',     now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000142', 'member',     now() - interval '15 days');

-- Team 8: Meyrin Galaxy (players 143-148)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000143', 'captain',    now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000144', 'co_captain', now() - interval '17 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000145', 'member',     now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000146', 'member',     now() - interval '15 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000147', 'member',     now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000148', 'member',     now() - interval '13 days');

-- Team 9: Plan-les-Ouates FC (players 149-154)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000149', 'captain',    now() - interval '16 days'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000150', 'co_captain', now() - interval '15 days'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000151', 'member',     now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000152', 'member',     now() - interval '13 days'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000153', 'member',     now() - interval '12 days'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000154', 'member',     now() - interval '11 days');

-- Team 10: Chêne-Bourg Titans (players 155-160)
INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000155', 'captain',    now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000156', 'co_captain', now() - interval '13 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000157', 'member',     now() - interval '12 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000158', 'member',     now() - interval '11 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000159', 'member',     now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000160', 'member',     now() - interval '9 days');

-- ── Friendships (teammates + cross-team rivals) ──
-- Within each team: captain ↔ all members (accepted)
-- Plus cross-team friendships for fun rivalries

-- Team 1 internal
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', 'accepted', now() - interval '29 days', now() - interval '29 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000103', 'accepted', now() - interval '28 days', now() - interval '28 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000104', 'accepted', now() - interval '27 days', now() - interval '27 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000105', 'accepted', now() - interval '26 days', now() - interval '26 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000106', 'accepted', now() - interval '25 days', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', 'accepted', now() - interval '27 days', now() - interval '27 days'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000105', 'accepted', now() - interval '25 days', now() - interval '25 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Team 2 internal
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000108', 'accepted', now() - interval '27 days', now() - interval '27 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000109', 'accepted', now() - interval '26 days', now() - interval '26 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000110', 'accepted', now() - interval '25 days', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000111', 'accepted', now() - interval '24 days', now() - interval '24 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000112', 'accepted', now() - interval '23 days', now() - interval '23 days'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000109', 'accepted', now() - interval '25 days', now() - interval '25 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Team 3 internal
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000114', 'accepted', now() - interval '25 days', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000115', 'accepted', now() - interval '24 days', now() - interval '24 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000116', 'accepted', now() - interval '23 days', now() - interval '23 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000117', 'accepted', now() - interval '22 days', now() - interval '22 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000118', 'accepted', now() - interval '21 days', now() - interval '21 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Team 4 internal
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000120', 'accepted', now() - interval '24 days', now() - interval '24 days'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000121', 'accepted', now() - interval '23 days', now() - interval '23 days'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000122', 'accepted', now() - interval '22 days', now() - interval '22 days'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000123', 'accepted', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000124', 'accepted', now() - interval '20 days', now() - interval '20 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Team 5 internal
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000126', 'accepted', now() - interval '23 days', now() - interval '23 days'),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000127', 'accepted', now() - interval '22 days', now() - interval '22 days'),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000128', 'accepted', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000129', 'accepted', now() - interval '20 days', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000130', 'accepted', now() - interval '19 days', now() - interval '19 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Teams 6-10 internal (captain ↔ all members)
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000132', 'accepted', now() - interval '21 days', now() - interval '21 days'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000133', 'accepted', now() - interval '20 days', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000134', 'accepted', now() - interval '19 days', now() - interval '19 days'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000135', 'accepted', now() - interval '18 days', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000136', 'accepted', now() - interval '17 days', now() - interval '17 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000138', 'accepted', now() - interval '19 days', now() - interval '19 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000139', 'accepted', now() - interval '18 days', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000140', 'accepted', now() - interval '17 days', now() - interval '17 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000141', 'accepted', now() - interval '16 days', now() - interval '16 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000142', 'accepted', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000144', 'accepted', now() - interval '17 days', now() - interval '17 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000145', 'accepted', now() - interval '16 days', now() - interval '16 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000146', 'accepted', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000147', 'accepted', now() - interval '14 days', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000148', 'accepted', now() - interval '13 days', now() - interval '13 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000150', 'accepted', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000151', 'accepted', now() - interval '14 days', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000152', 'accepted', now() - interval '13 days', now() - interval '13 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000153', 'accepted', now() - interval '12 days', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000154', 'accepted', now() - interval '11 days', now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000156', 'accepted', now() - interval '13 days', now() - interval '13 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000157', 'accepted', now() - interval '12 days', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000158', 'accepted', now() - interval '11 days', now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000159', 'accepted', now() - interval '10 days', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000160', 'accepted', now() - interval '9 days',  now() - interval '9 days')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Cross-team rival friendships (captains know each other)
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000107', 'accepted', now() - interval '20 days', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000113', 'accepted', now() - interval '18 days', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000119', 'accepted', now() - interval '17 days', now() - interval '17 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000125', 'accepted', now() - interval '16 days', now() - interval '16 days'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000131', 'accepted', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000137', 'accepted', now() - interval '14 days', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000143', 'accepted', now() - interval '13 days', now() - interval '13 days'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000149', 'accepted', now() - interval '12 days', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000155', 'accepted', now() - interval '11 days', now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000000149', '00000000-0000-0000-0000-000000000101', 'accepted', now() - interval '10 days', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000155', '00000000-0000-0000-0000-000000000107', 'accepted', now() - interval '9 days',  now() - interval '9 days'),
  -- Some pending requests for realism
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000108', 'pending',  now() - interval '2 days',  now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000120', 'pending',  now() - interval '1 day',   now() - interval '1 day')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Also add friendships for Lucas (101) — the user we log in as — with more people
INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000119', 'accepted', now() - interval '15 days', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000125', 'accepted', now() - interval '14 days', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000137', 'accepted', now() - interval '12 days', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000155', 'accepted', now() - interval '10 days', now() - interval '10 days'),
  -- Pending request TO Lucas
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-000000000101', 'pending',  now() - interval '1 day',   now() - interval '1 day')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- ── Team Challenges (25 challenges — mix of statuses) ──

-- Completed challenges (past — proper rivalry history)
INSERT INTO team_challenges (challenger_team_id, challenged_team_id, status, proposed_date, proposed_venue, message, created_at, updated_at) VALUES
  -- Round 1 — 3 weeks ago
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'completed', now() - interval '21 days', 'Stade de la Praille',     'Derby genevois ! On va vous écraser.',        now() - interval '25 days', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'completed', now() - interval '21 days', 'Centre sportif du Bois-des-Frères', 'Les Aigles défient Onex !',          now() - interval '25 days', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000006', 'completed', now() - interval '21 days', 'Stade de Lancy',          'Les flammes vont consumer les loups.',         now() - interval '25 days', now() - interval '21 days'),
  ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008', 'completed', now() - interval '20 days', 'Terrain de Thônex',       'Tonnerre vs Galaxie, un match cosmique !',    now() - interval '24 days', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000010', 'completed', now() - interval '20 days', 'Centre sportif de PLO',   'Le plan est en marche.',                       now() - interval '24 days', now() - interval '20 days'),

  -- Round 2 — 2 weeks ago (reversed matchups)
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'completed', now() - interval '14 days', 'Stade des Charmilles',    'Revanche ! Carouge veut sa victoire.',         now() - interval '18 days', now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'completed', now() - interval '14 days', 'Terrain d''Onex',         'Onex vs Lancy, le choc des voisins.',          now() - interval '18 days', now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'completed', now() - interval '13 days', 'Stade de Vernier',        'Les Wolves chassent les Aigles.',               now() - interval '17 days', now() - interval '13 days'),
  ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000009', 'completed', now() - interval '13 days', 'Centre sportif de Meyrin','La galaxie affronte le plan.',                 now() - interval '17 days', now() - interval '13 days'),
  ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000007', 'completed', now() - interval '12 days', 'Terrain de Chêne-Bourg',  'Les Titans défient le Tonnerre.',               now() - interval '16 days', now() - interval '12 days'),

  -- Round 3 — 1 week ago (cross-matchups)
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'completed', now() - interval '7 days',  'Stade de Genève',         'Jet d''Eau vs Flames, ça va chauffer !',       now() - interval '10 days', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 'completed', now() - interval '7 days',  'Centre sportif Sous-Moulin','Aigles vs Thunder, altitude vs puissance.',  now() - interval '10 days', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'completed', now() - interval '6 days',  'Stade de Carouge',        'Carouge City reçoit les Wolves.',               now() - interval '9 days',  now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', 'completed', now() - interval '6 days',  'Terrain d''Onex',         'Onex vs Meyrin, le choc interplanétaire.',     now() - interval '9 days',  now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'completed', now() - interval '5 days',  'Centre sportif de PLO',   'PLO veut tester le Jet d''Eau.',                now() - interval '8 days',  now() - interval '5 days'),

  -- Scheduled / accepted challenges (upcoming)
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'scheduled', now() + interval '3 days',  'Stade de la Praille',     'Semi-finale du tournoi FootMatch !',            now() - interval '3 days',  now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'scheduled', now() + interval '4 days',  'Stade des Charmilles',    'L''autre semi-finale !',                        now() - interval '3 days',  now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', 'accepted',  now() + interval '7 days',  'Stade de Lancy',          'Match amical entre voisins.',                   now() - interval '2 days',  now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000010', 'accepted',  now() + interval '8 days',  'Stade de Vernier',        'Wolves vs Titans, qui survivra ?',              now() - interval '2 days',  now() - interval '1 day'),

  -- Proposed challenges (awaiting response)
  ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'proposed',  now() + interval '10 days', 'Centre sportif de Meyrin','Meyrin Galaxy veut sa revanche.',               now() - interval '1 day',   now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'proposed',  now() + interval '11 days', 'Terrain de Chêne-Bourg',  'Les Titans veulent affronter les Aigles.',      now() - interval '1 day',   now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'proposed',  now() + interval '12 days', 'Centre sportif de PLO',   'PLO lance un défi aux Flames !',                now(),                      now()),

  -- Declined / canceled for realism
  ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'declined',  now() - interval '10 days', 'Terrain de Thônex',       'Thunder veut un match !',                       now() - interval '15 days', now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'canceled',  now() - interval '8 days',  'Stade de Genève',         'On reporte, trop de blessés.',                  now() - interval '12 days', now() - interval '8 days'),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000009', 'declined',  now() - interval '5 days',  'Stade de Vernier',        'Les Wolves défient PLO.',                       now() - interval '8 days',  now() - interval '5 days');
