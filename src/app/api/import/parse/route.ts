import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { parseFile } from '@/lib/parser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, STORAGE_BUCKET } from '@/lib/constants';

// POST /api/import/parse — 上传并解析文件
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const importType = (formData.get('importType') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      // 允许 txt/md 等文本格式
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['txt', 'md', 'markdown'].includes(ext || '')) {
        return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
      }
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件过大（最大 2MB）' }, { status: 400 });
    }

    // 生成安全文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const path = `imports/${year}/${month}/${safeName}`;

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: '上传失败: ' + uploadError.message }, { status: 500 });
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    // 解析文件
    const result = await parseFile(path, file.name, file.type, importType as any, publicUrl);

    return NextResponse.json({
      file: { url: publicUrl, path, name: file.name, size: file.size, type: file.type },
      parse: result,
    });
  } catch (error: any) {
    console.error('Import parse error:', error);
    return NextResponse.json(
      { error: error.message === 'Unauthorized' ? '未登录' : '解析失败' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
