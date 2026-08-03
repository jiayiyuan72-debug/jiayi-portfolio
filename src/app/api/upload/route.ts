import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, STORAGE_BUCKET } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `文件过大（最大 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB，当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）` }, { status: 400 });
    }

    // 生成安全文件名
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeName = `${crypto.randomUUID()}.${ext}`;
    // 按年月组织目录
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const path = `uploads/${year}/${month}/${safeName}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      // 把 Supabase 的英文/晦涩报错映射成友好中文提示
      const msg = String(error.message || '');
      let friendly = '上传失败：' + msg;
      if (/exceeded the maximum allowed size|file_size_limit|too large/i.test(msg)) {
        friendly = '图片太大，超出服务器允许的上限，请压缩后再上传';
      } else if (/expected pattern|invalid|format|mime|content.?type/i.test(msg)) {
        friendly = '图片格式不兼容，请转换为 JPG/PNG/WebP 后再上传';
      }
      return NextResponse.json({ error: friendly }, { status: 500 });
    }

    // 获取公开 URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      url: publicUrl,
      path,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json(
      { error: error.message === 'Unauthorized' ? '未登录' : '上传失败' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
