-- ============================================
-- Jiayi Portfolio - 数据库 Schema 迁移
-- ============================================

-- 1. 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- site_config 站点配置表
-- ============================================
CREATE TABLE site_config (
  id BIGINT PRIMARY KEY DEFAULT 1,
  site_title TEXT NOT NULL DEFAULT 'Jiayi Portfolio',
  site_description TEXT DEFAULT '',
  entry_title TEXT NOT NULL DEFAULT 'WELCOME TO JIAYI''S UNIVERSE',
  entry_subtitle TEXT NOT NULL DEFAULT 'JIAYI''S PORTFOLIO',
  visitor_button_text TEXT NOT NULL DEFAULT '我是访客',
  admin_button_text TEXT NOT NULL DEFAULT '我是管理者',
  entry_style JSONB DEFAULT '{}'::jsonb,
  footer_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================
-- sections 板块表
-- ============================================
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  layout_type TEXT NOT NULL DEFAULT 'card',
  field_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 板块排序索引
CREATE INDEX idx_sections_sort ON sections(sort_order);
CREATE INDEX idx_sections_visible ON sections(is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_sections_slug ON sections(slug);

-- ============================================
-- content_items 内容项表
-- ============================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'article',
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  body TEXT DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',
  file_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 内容项查询索引
CREATE INDEX idx_content_section ON content_items(section_id);
CREATE INDEX idx_content_section_visible ON content_items(section_id, is_visible, status) WHERE is_visible = TRUE AND status = 'published';
CREATE INDEX idx_content_sort ON content_items(section_id, sort_order);

-- ============================================
-- visitor_messages 访客留言表
-- ============================================
CREATE TABLE visitor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  visitor_ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 留言查询索引
CREATE INDEX idx_messages_read ON visitor_messages(is_read);
CREATE INDEX idx_messages_created ON visitor_messages(created_at DESC);

-- ============================================
-- 自动更新 updated_at 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS 策略（行级安全）
-- ============================================

-- site_config: 公开可读，仅 service_role 可写
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取站点配置" ON site_config FOR SELECT USING (TRUE);
CREATE POLICY "仅服务端写入站点配置" ON site_config FOR ALL USING (false);

-- sections: 公开可读可见板块，仅 service_role 可写
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取可见板块" ON sections FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "管理员读取所有板块" ON sections FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "仅服务端写入板块" ON sections FOR ALL USING (auth.role() = 'service_role');

-- content_items: 公开可读已发布可见内容，仅 service_role 可写
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取已发布内容" ON content_items
  FOR SELECT USING (is_visible = TRUE AND status = 'published');
CREATE POLICY "管理员读取所有内容" ON content_items
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "仅服务端写入内容" ON content_items
  FOR ALL USING (auth.role() = 'service_role');

-- visitor_messages: 公开可写入，仅 service_role 可读/管理
ALTER TABLE visitor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "访客可提交留言" ON visitor_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "仅服务端读取留言" ON visitor_messages FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "仅服务端管理留言" ON visitor_messages FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "仅服务端删除留言" ON visitor_messages FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- Supabase Storage bucket RLS
-- 在 Supabase Dashboard 中创建 "portfolio-media" 的公开 bucket
-- ============================================
-- 注意: 以下需要在 Supabase Dashboard > Storage 中手动配置:
-- Bucket name: portfolio-media
-- Public bucket: ON
-- 文件大小限制: 2MB
-- MIME 类型白名单: image/*, video/mp4, application/pdf, application/zip
