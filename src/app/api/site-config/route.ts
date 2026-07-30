import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/site-config — 获取站点配置（公开）
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: '站点配置不存在' }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/site-config error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/site-config — 更新站点配置（管理员）
export async function PUT(request: Request) {
  try {
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('site_config')
      .update({
        site_title: body.site_title,
        site_description: body.site_description,
        entry_title: body.entry_title,
        entry_subtitle: body.entry_subtitle,
        visitor_button_text: body.visitor_button_text,
        admin_button_text: body.admin_button_text,
        entry_style: body.entry_style,
        footer_text: body.footer_text,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/site-config error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}
