-- ============================================
-- Jiayi Portfolio - 种子数据
-- ============================================

-- 站点配置
INSERT INTO site_config (id, site_title, site_description, entry_title, entry_subtitle, visitor_button_text, admin_button_text, entry_style, footer_text)
VALUES (
  1,
  'Jiayi 的个人空间',
  'Jiayi 的个人作品集网站 — 分享经历、创作与思考',
  'WELCOME TO JIAYI''S UNIVERSE',
  'JIAYI''S PORTFOLIO',
  '我是访客',
  '我是管理者',
  '{
    "bg_color": "#faf7f2",
    "text_color": "#2d2a24",
    "font_family": "system-ui, sans-serif",
    "animation": "fade-in"
  }'::jsonb,
  '© 2026 Jiayi. All rights reserved.'
);

-- ============================================
-- 板块数据
-- ============================================
INSERT INTO sections (id, name, slug, sort_order, layout_type, field_schema, style_config, meta_title, meta_description, is_visible) VALUES

-- 板块1: 关于我 (card 布局)
(
  'a0000000-0000-0000-0000-000000000001',
  '关于我',
  'about',
  0,
  'card',
  '[
    {"key":"avatar","label":"头像","type":"image","required":false},
    {"key":"birthday","label":"生日","type":"date","required":false},
    {"key":"location","label":"所在地","type":"text","required":false},
    {"key":"contact","label":"联系方式","type":"text","required":false}
  ]'::jsonb,
  '{"bg_color":"#ffffff","text_color":"#2d2a24","columns":1,"max_width":"720px","padding":"48px 24px","show_border":false}'::jsonb,
  '关于 Jiayi',
  '了解 Jiayi 的个人信息',
  TRUE
),

-- 板块2: 求学经历 (timeline 布局)
(
  'a0000000-0000-0000-0000-000000000002',
  '求学经历',
  'education',
  1,
  'timeline',
  '[
    {"key":"school","label":"学校名称","type":"text","required":true},
    {"key":"major","label":"专业","type":"text","required":false},
    {"key":"degree","label":"学历层次","type":"select","options":["小学","初中","高中","本科","硕士","博士"],"required":true},
    {"key":"start_date","label":"开始时间","type":"text","required":true,"placeholder":"如 2022.09"},
    {"key":"end_date","label":"结束时间","type":"text","required":false,"placeholder":"如 2026.06"},
    {"key":"activities","label":"学生工作/活动","type":"textarea","required":false},
    {"key":"achievements","label":"获奖情况","type":"textarea","required":false},
    {"key":"images","label":"校园图片","type":"image","required":false}
  ]'::jsonb,
  '{"bg_color":"#faf7f2","text_color":"#2d2a24","icon":"graduation-cap","show_year_labels":true,"accent_color":"#d4a574"}'::jsonb,
  '求学经历',
  'Jiayi 的教育背景',
  TRUE
),

-- 板块3: 求职经历 (timeline 布局)
(
  'a0000000-0000-0000-0000-000000000003',
  '求职经历',
  'experience',
  2,
  'timeline',
  '[
    {"key":"company","label":"公司名称","type":"text","required":true},
    {"key":"position","label":"岗位名称","type":"text","required":true},
    {"key":"start_date","label":"开始时间","type":"text","required":true,"placeholder":"如 2024.06"},
    {"key":"end_date","label":"结束时间","type":"text","required":false,"placeholder":"如 2024.09"},
    {"key":"content","label":"工作内容","type":"textarea","required":false},
    {"key":"output","label":"主要产出","type":"textarea","required":false},
    {"key":"reflection","label":"业务思考","type":"textarea","required":false},
    {"key":"attachments","label":"产出附件","type":"file","required":false}
  ]'::jsonb,
  '{"bg_color":"#ffffff","text_color":"#2d2a24","icon":"briefcase","show_year_labels":true,"accent_color":"#8b9d6e"}'::jsonb,
  '求职经历',
  'Jiayi 的工作与实习经历',
  TRUE
),

-- 板块4: 生活 (mixed 布局)
(
  'a0000000-0000-0000-0000-000000000004',
  '生活',
  'life',
  3,
  'mixed',
  '[
    {"key":"subtitle","label":"副标题","type":"text","required":false},
    {"key":"cover_image","label":"封面图","type":"image","required":false}
  ]'::jsonb,
  '{"bg_color":"#faf7f2","text_color":"#2d2a24","columns":1,"padding":"48px 24px"}'::jsonb,
  '生活记录',
  'Jiayi 的生活点滴',
  TRUE
),

-- 板块5: 旅游足迹 (travelogue 布局)
(
  'a0000000-0000-0000-0000-000000000005',
  '旅游足迹',
  'travel',
  4,
  'travelogue',
  '[
    {"key":"destination","label":"目的地","type":"text","required":true},
    {"key":"cover_image","label":"封面图","type":"image","required":false},
    {"key":"travel_date","label":"出行时间","type":"text","required":false,"placeholder":"如 2025.04.10 - 2025.04.14"},
    {"key":"photos","label":"照片集","type":"image","required":false},
    {"key":"diary","label":"旅游日记","type":"rich_text","required":false},
    {"key":"tags","label":"标签","type":"text","required":false}
  ]'::jsonb,
  '{"bg_color":"#ffffff","text_color":"#2d2a24","card_style":"elevated","gap":"24px","accent_color":"#7ab0b0"}'::jsonb,
  '旅游足迹',
  'Jiayi 的旅行记录',
  TRUE
),

-- 板块6: 每日日记 (diary 布局)
(
  'a0000000-0000-0000-0000-000000000006',
  '每日日记',
  'diary',
  5,
  'diary',
  '[
    {"key":"weather","label":"天气","type":"select","options":["晴","阴","雨","雪","多云"],"required":false},
    {"key":"mood","label":"心情","type":"text","required":false,"placeholder":"如 开心、平静、思考"},
    {"key":"images","label":"配图","type":"image","required":false}
  ]'::jsonb,
  '{"bg_color":"#faf7f2","text_color":"#2d2a24","show_date":true,"show_mood":true,"accent_color":"#e8c4a0"}'::jsonb,
  '每日日记',
  'Jiayi 的日常记录',
  TRUE
),

-- 板块7: 所思所想 (article 布局)
(
  'a0000000-0000-0000-0000-000000000007',
  '所思所想',
  'thoughts',
  6,
  'article',
  '[
    {"key":"excerpt","label":"摘要","type":"textarea","required":true,"max_length":300},
    {"key":"cover_image","label":"封面图","type":"image","required":false},
    {"key":"read_time","label":"阅读时间(分钟)","type":"number","required":false}
  ]'::jsonb,
  '{"bg_color":"#ffffff","text_color":"#2d2a24","show_date":true,"show_tags":true,"accent_color":"#b8a07a"}'::jsonb,
  '所思所想',
  'Jiayi 的文章与思考',
  TRUE
);

-- ============================================
-- 内容数据
-- ============================================

-- 关于我
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Jiayi',
  '{"avatar":"","birthday":"","location":"","contact":""}',
  '你好呀！我是 Jiayi，一个热爱生活和创造的人。\n\n我目前在探索技术与人文的交汇之处。闲暇时喜欢拍照、旅行、写点东西，也爱窝在咖啡馆里看书发呆。\n\n这个网站是我的小宇宙，记录着我走过的路、看过的风景、想说的话。欢迎你来逛逛 :)',
  ARRAY['生活', '创造'],
  0, 'published', TRUE, NOW()
);

-- 求学经历
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'XX 大学',
  '{"school":"XX 大学","major":"计算机科学与技术","degree":"本科","start_date":"2022.09","end_date":"2026.06","activities":"学生会宣传部部长\n摄影社团创始人\n校园文化节总策划","achievements":"校级优秀学生干部\n创新创业大赛二等奖"}',
  '在这里度过了充实的四年大学时光。参与了多个校园项目，结识了一群志同道合的朋友。',
  ARRAY['计算机', '大学'],
  0, 'published', TRUE, NOW()
);

INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'XX 中学',
  '{"school":"XX 中学","major":"","degree":"高中","start_date":"2019.09","end_date":"2022.06","activities":"学生会成员\n校刊编辑","achievements":"优秀毕业生"}',
  '',
  ARRAY['高中'],
  1, 'published', TRUE, NOW()
);

-- 求职经历
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  '产品实习生',
  '{"company":"XX 科技有限公司","position":"产品实习生","start_date":"2025.06","end_date":"2025.09","content":"负责用户需求调研与竞品分析\n输出产品需求文档（PRD）\n跟进开发进度，协调设计与研发团队","output":"完成 3 个核心功能模块的迭代\n用户满意度提升 15%","reflection":"这段经历让我深刻理解了产品思维的重要性——不是堆砌功能，而是解决真正的问题。"}',
  '',
  ARRAY['产品', '实习'],
  0, 'published', TRUE, NOW()
);

-- 生活板块（作为 mixed 布局，用 content_items 展示不同生活方面）
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  '生活随拍',
  '{"subtitle":"用镜头记录日常","cover_image":""}',
  '生活中的美好往往藏在细节里——一杯咖啡的拉花、窗外的夕阳、路边的小猫……这些都是我热爱这个世界的理由。',
  ARRAY['摄影', '日常'],
  0, 'published', TRUE, NOW()
);

INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  '读书笔记',
  '{"subtitle":"最近在读","cover_image":""}',
  '最近在读《设计中的设计》——原研哉用极简的文字道出了设计的本质：设计不是技术，而是观察世界的方式。',
  ARRAY['阅读', '设计'],
  1, 'published', TRUE, NOW()
);

-- 旅游足迹
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  '厦门漫步',
  '{"destination":"厦门","cover_image":"","travel_date":"2025.03.15 - 2025.03.18","photos":[],"diary":"## Day 1\n\n到达厦门已是下午，入住在曾厝垵的一家小民宿。放下行李就去了海边，傍晚的海风很温柔。\n\n## Day 2\n\n上午去了鼓浪屿。岛上的老建筑很有味道，走在巷子里像是穿越了时光。\n\n## Day 3\n\n在沙坡尾的艺术区逛了一整天，看了几个有意思的展览。\n\n## Day 4\n\n临走前去了南普陀寺，吃了顿素斋，心满意足地回家了。","tags":"海边 美食 文化"}',
  '',
  ARRAY['厦门', '旅行'],
  0, 'published', TRUE, NOW()
);

INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  '京都之行',
  '{"destination":"日本 京都","cover_image":"","travel_date":"2024.11.10 - 2024.11.15","photos":[],"diary":"期待已久的京都赏枫之旅终于成行。\\n\\n红叶季的京都美得不真实，金阁寺在秋日阳光下闪闪发光。\\n\\n在岚山竹林里散步，在哲学之道边思考人生——这大概就是旅行的意义。","tags":"日本 文化 美食 红叶"}',
  '',
  ARRAY['京都', '日本'],
  1, 'published', TRUE, NOW()
);

-- 每日日记
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  '一个平凡的周三',
  '{"weather":"晴","mood":"平静","images":[]}',
  '今天天气很好，阳光透过窗户洒在书桌上。\n\n下午去了一家新开的咖啡馆，手冲咖啡很不错。在那里看完了半本书，写了点东西。\n\n晚上和好朋友视频聊天，虽然相隔千里但感觉还是很近。\n\n生活就是这样平淡而美好。',
  ARRAY['日常', '咖啡'],
  0, 'published', TRUE, NOW() - INTERVAL '2 days'
);

INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  '周末小记',
  '{"weather":"多云","mood":"开心","images":[]}',
  '周末和朋友们去了郊外的植物园。\n\n见到了很多没见过的植物，热带温室里像走进了另一个世界。\n\n晚上一起吃了火锅，热腾腾的，太幸福了。\n\n下周继续加油！',
  ARRAY['周末', '朋友', '自然'],
  1, 'published', TRUE, NOW() - INTERVAL '5 days'
);

-- 所思所想
INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  '关于极简设计的一些思考',
  '{"excerpt":"在这个信息爆炸的时代，极简不只是一种美学，更是一种态度。","read_time":5,"cover_image":""}',
  '最近在整理自己的设计作品集，回顾过去几年的项目，发现自己的审美取向越来越偏向极简。\n\n极简不是简单地把东西删掉，而是精确地留下真正重要的部分。每一行文字、每一个色块、每一像素间距，都应该有它存在的理由。\n\n正如原研哉所说："设计不是一种技能，而是感知世界的能力。"',
  ARRAY['设计', '极简', '思考'],
  0, 'published', TRUE, NOW()
);

INSERT INTO content_items (section_id, title, fields, body, tags, sort_order, status, is_visible, published_at)
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  '旅行教会我的事',
  '{"excerpt":"每次旅行回来，都会觉得世界变大了，自己变小了。","read_time":4,"cover_image":""}',
  '去过一些地方之后，我发现旅行最大的收获不是照片和纪念品，而是一种"原来还可以这样生活"的体验。\n\n在京都看到老奶奶优雅地穿着和服去买菜，在厦门的海边看到渔民日出而作——这些画面让我意识到，我习惯的生活方式只是千万种可能性中的一种。\n\n旅行的意义，大概就是让我们学会用更开放的心态去理解这个世界。',
  ARRAY['旅行', '感悟'],
  1, 'published', TRUE, NOW()
);

-- 访客留言（示例）
INSERT INTO visitor_messages (nickname, message, is_read, created_at)
VALUES
  ('小星星', '好喜欢你的网站设计！那个入口页好有感觉~', TRUE, NOW() - INTERVAL '3 days'),
  ('追风少年', '看了你的厦门游记，我也想去鼓浪屿了！有什么推荐吗？', FALSE, NOW() - INTERVAL '1 day'),
  ('读书人', '关于极简设计那篇文章写得真好，感同身受。', FALSE, NOW() - INTERVAL '2 hours');
