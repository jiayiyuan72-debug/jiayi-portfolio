'use client';

import { useState, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ParsedItem, ImportType } from '@/lib/parser/types';

type PageState = 'upload' | 'parsing' | 'preview' | 'done';

const IMPORT_TYPES: { value: ImportType; label: string; icon: string; desc: string }[] = [
  { value: 'auto', label: '自动判断', icon: '🤖', desc: '自动识别文件类型和归属板块' },
  { value: 'resume', label: '简历求职', icon: '💼', desc: '简历、实习证明、项目文档等' },
  { value: 'education', label: '求学资料', icon: '🎓', desc: '成绩单、毕业证、奖状等' },
  { value: 'travel', label: '旅游游记', icon: '✈️', desc: '旅行照片、游记文档等' },
  { value: 'diary', label: '日记文章', icon: '📓', desc: '日记、备忘录、日常记录' },
  { value: 'article', label: '文章素材', icon: '📝', desc: '长文、感想、思考类内容' },
  { value: 'photos', label: '图片素材', icon: '🖼️', desc: '照片、图片批量导入' },
];

const SECTION_NAMES: Record<string, string> = {
  experience: '求职经历',
  education: '求学经历',
  travel: '旅游足迹',
  diary: '每日日记',
  thoughts: '所思所想',
  life: '生活',
  about: '关于我',
  gallery: '图片画廊',
};

export default function ImportPage() {
  const [pageState, setPageState] = useState<PageState>('upload');
  const [importType, setImportType] = useState<ImportType>('auto');
  const [files, setFiles] = useState<File[]>([]);
  const [parseResults, setParseResults] = useState<{ file: any; items: ParsedItem[] }[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [editedItems, setEditedItems] = useState<ParsedItem[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleParse = async () => {
    if (files.length === 0) {
      toast.error('请先选择文件');
      return;
    }

    setPageState('parsing');
    const allResults: { file: any; items: ParsedItem[] }[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);

      try {
        const res = await fetch('/api/import/parse', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
          toast.error(`${file.name}: ${data.error}`);
          continue;
        }

        allResults.push({
          file: data.file,
          items: data.parse?.items || [],
        });

        toast.success(`${file.name}: 解析完成 (${data.parse?.summary?.totalItems || 0} 条)`);
      } catch {
        toast.error(`${file.name}: 解析请求失败`);
      }
    }

    setParseResults(allResults);

    // 合并所有解析结果
    const allItems = allResults.flatMap(r => r.items);
    setEditedItems(allItems);

    if (allItems.length > 0) {
      setPageState('preview');
    } else {
      toast.error('未能从文件中解析出任何内容');
      setPageState('upload');
    }
  };

  const handleConfirmImport = async (publishDirectly: boolean = false) => {
    const res = await fetch('/api/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: editedItems, publishDirectly }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || '导入失败');
      return;
    }

    // 记录到历史
    const historyEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-CN'),
      files: files.map(f => f.name).join(', '),
      total: data.summary.total,
      imported: data.summary.imported,
      status: publishDirectly ? '已发布' : '草稿',
    };
    setImportHistory(prev => [historyEntry, ...prev]);

    toast.success(`✅ 成功导入 ${data.summary.imported} 条内容（${data.summary.status === 'published' ? '已发布' : '草稿'}）`);
    setPageState('done');
  };

  const updateItem = (index: number, updates: Partial<ParsedItem>) => {
    setEditedItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeItem = (index: number) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const currentResult = parseResults[currentResultIndex];

  return (
    <div className="max-w-5xl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2d2a24]">智能导入</h1>
          <p className="text-sm text-[#8b8b8b] mt-1">
            上传资料自动解析并填充到对应板块
          </p>
        </div>
        <button
          onClick={() => setHistoryVisible(!historyVisible)}
          className="px-3 py-1.5 text-sm border border-[#e8e4de] rounded-lg hover:bg-[#f8f5f0]"
        >
          📋 导入历史
        </button>
      </div>

      {/* 导入历史弹窗 */}
      {historyVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[70vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#2d2a24] mb-4">导入历史</h2>
            {importHistory.length === 0 ? (
              <p className="text-sm text-[#b8b4ae]">暂无导入记录</p>
            ) : (
              <div className="space-y-3">
                {importHistory.map(h => (
                  <div key={h.id} className="p-3 bg-[#f8f5f0] rounded-lg text-sm">
                    <p className="text-[#2d2a24]">📄 {h.files}</p>
                    <p className="text-xs text-[#8b8b8b] mt-1">{h.date}</p>
                    <p className="text-xs text-[#8b8b8b]">{h.imported}/{h.total} 条 · {h.status}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoryVisible(false)} className="mt-4 w-full py-2 text-sm border border-[#e8e4de] rounded-xl">关闭</button>
          </div>
        </div>
      )}

      {/* 上传阶段 */}
      {pageState === 'upload' && (
        <div className="space-y-6">
          {/* 选择导入类型 */}
          <div className="bg-white rounded-xl p-5 border border-[#e8e4de]">
            <h2 className="text-sm font-bold text-[#2d2a24] mb-3">资料类型</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IMPORT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setImportType(t.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    importType === t.value
                      ? 'border-[#2d2a24] bg-[#f8f5f0]'
                      : 'border-[#e8e4de] hover:border-[#d4a574]'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[#2d2a24]">{t.label}</p>
                    <p className="text-xs text-[#8b8b8b]">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 拖拽上传区 */}
          <div
            className="bg-white rounded-xl border-2 border-dashed border-[#e8e4de] p-10 text-center cursor-pointer hover:border-[#d4a574] transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.zip"
            />
            <p className="text-4xl mb-3">📤</p>
            <p className="text-base font-medium text-[#2d2a24]">点击或拖拽文件到此处上传</p>
            <p className="text-sm text-[#8b8b8b] mt-1">
              支持 PDF、Word、TXT、Markdown、图片、ZIP 等格式
            </p>
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-[#e8e4de]">
              <h3 className="text-sm font-medium text-[#2d2a24] mb-3">
                已选择 {files.length} 个文件
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#f8f5f0] rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {file.type.includes('pdf') ? '📄' :
                         file.type.includes('word') || file.name.endsWith('.docx') ? '📝' :
                         file.type.includes('image') ? '🖼️' : '📁'}
                      </span>
                      <div>
                        <p className="text-sm text-[#2d2a24]">{file.name}</p>
                        <p className="text-xs text-[#b8b4ae]">
                          {(file.size / 1024).toFixed(1)} KB · {file.type || '未知'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-[#b8b4ae] hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleParse}
                className="mt-4 w-full py-3 bg-[#2d2a24] text-white rounded-xl text-sm hover:bg-[#4a443c] transition-colors"
              >
                🚀 开始解析 {files.length} 个文件
              </button>
            </div>
          )}
        </div>
      )}

      {/* 解析中 */}
      {pageState === 'parsing' && (
        <div className="bg-white rounded-xl p-10 border border-[#e8e4de] text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg font-medium text-[#2d2a24]">正在解析文件...</p>
          <p className="text-sm text-[#8b8b8b] mt-2">
            正在上传并分析 {files.length} 个文件，请稍候
          </p>
          <div className="mt-6 w-48 h-1.5 bg-[#e8e4de] rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#2d2a24] rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* 预览阶段 */}
      {pageState === 'preview' && (
        <div className="space-y-4">
          {/* 文件切换 */}
          {parseResults.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {parseResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentResultIndex(i)}
                  className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
                    i === currentResultIndex ? 'bg-[#2d2a24] text-white' : 'bg-white border border-[#e8e4de]'
                  }`}
                >
                  📄 {r.file?.name || `文件 ${i+1}`} ({r.items.length})
                </button>
              ))}
            </div>
          )}

          {/* 当前文件预览 */}
          {currentResult && (
            <div className="bg-white rounded-xl p-4 border border-[#e8e4de]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[#2d2a24]">{currentResult.file?.name}</p>
                  <p className="text-xs text-[#8b8b8b]">
                    解析出 {currentResult.items.length} 条内容 ·
                    置信度 {currentResult.items.filter(i => i.confidence >= 0.7).length} 条高 / {currentResult.items.filter(i => i.confidence < 0.7).length} 条低
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 解析结果卡片列表 */}
          <div className="space-y-4">
            {editedItems.map((item, index) => {
              const isHighConfidence = item.confidence >= 0.7;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl border-2 overflow-hidden ${
                    isHighConfidence ? 'border-[#e8e4de]' : 'border-amber-200'
                  }`}
                >
                  {/* 卡片头部 */}
                  <div className="flex items-center justify-between p-4 bg-[#fafafa] border-b border-[#e8e4de]">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isHighConfidence ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {isHighConfidence ? '✅ 高置信度' : '⚠️ 待确认'}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-[#f0f0f0] text-[#2d2a24] rounded-full">
                        📍 {SECTION_NAMES[item.targetSection] || item.targetSection}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-xs text-[#b8b4ae] hover:text-red-400"
                    >
                      🗑️ 删除
                    </button>
                  </div>

                  {/* 卡片内容 */}
                  <div className="p-4 space-y-3">
                    {/* 标题 */}
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">标题</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => updateItem(index, { title: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm"
                      />
                    </div>

                    {/* 归属板块 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">归属板块</label>
                        <select
                          value={item.targetSection}
                          onChange={e => updateItem(index, { targetSection: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm"
                        >
                          {Object.entries(SECTION_NAMES).map(([slug, name]) => (
                            <option key={slug} value={slug}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">标签（逗号分隔）</label>
                        <input
                          type="text"
                          value={(item.tags || []).join(', ')}
                          onChange={e => updateItem(index, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                          className="w-full px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* 动态字段 */}
                    {Object.entries(item.fields).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-[#8b8b8b] mb-1">
                          {getFieldLabel(key, item.targetSection)}
                          {item.missingFields.includes(key) && (
                            <span className="text-amber-500 ml-1">(未识别)</span>
                          )}
                        </label>
                        {typeof value === 'string' && value.length > 100 ? (
                          <textarea
                            value={value}
                            onChange={e => updateItem(index, { fields: { ...item.fields, [key]: e.target.value } })}
                            rows={3}
                            className="w-full px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm resize-y"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(value || '')}
                            onChange={e => updateItem(index, { fields: { ...item.fields, [key]: e.target.value } })}
                            placeholder={item.missingFields.includes(key) ? '待补充...' : ''}
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm ${
                              item.missingFields.includes(key)
                                ? 'border-amber-200 bg-amber-50/30'
                                : 'border-[#e8e4de]'
                            }`}
                          />
                        )}
                      </div>
                    ))}

                    {/* 正文 */}
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">
                        正文描述
                        {!item.body && <span className="text-amber-500 ml-1">(未识别)</span>}
                      </label>
                      <textarea
                        value={item.body}
                        onChange={e => updateItem(index, { body: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm resize-y"
                        placeholder={!item.body ? '请补充正文内容...' : ''}
                      />
                    </div>

                    {/* 置信度 */}
                    <div className="flex items-center gap-2 text-xs text-[#8b8b8b]">
                      <span>置信度: {(item.confidence * 100).toFixed(0)}%</span>
                      <div className="flex-1 h-1.5 bg-[#e8e4de] rounded-full max-w-32">
                        <div
                          className={`h-full rounded-full ${
                            item.confidence >= 0.7 ? 'bg-green-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${item.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {editedItems.length === 0 && (
              <div className="text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
                没有解析出任何内容
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          {editedItems.length > 0 && (
            <div className="flex gap-3 sticky bottom-0 bg-[#f5f5f0] py-4 border-t border-[#e8e4de]">
              <button
                onClick={() => setPageState('upload')}
                className="px-6 py-2.5 text-sm border border-[#e8e4de] rounded-xl hover:bg-[#f8f5f0]"
              >
                ← 返回上传
              </button>
              <button
                onClick={() => handleConfirmImport(false)}
                className="px-6 py-2.5 text-sm bg-[#2d2a24] text-white rounded-xl hover:bg-[#4a443c]"
              >
                💾 保存为草稿 ({editedItems.length} 条)
              </button>
              <button
                onClick={() => handleConfirmImport(true)}
                className="px-6 py-2.5 text-sm bg-green-700 text-white rounded-xl hover:bg-green-800"
              >
                📢 保存并发布
              </button>
            </div>
          )}
        </div>
      )}

      {/* 完成页面 */}
      {pageState === 'done' && (
        <div className="bg-white rounded-xl p-10 border border-[#e8e4de] text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-xl font-bold text-[#2d2a24] mb-2">导入完成！</h2>
          <p className="text-sm text-[#8b8b8b] mb-6">
            内容已保存到对应板块，你可以前往「网站编辑」查看或修改
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setFiles([]);
                setParseResults([]);
                setEditedItems([]);
                setPageState('upload');
              }}
              className="px-6 py-2.5 text-sm border border-[#e8e4de] rounded-xl hover:bg-[#f8f5f0]"
            >
              📤 继续导入
            </button>
            <a
              href="/admin/editor"
              className="px-6 py-2.5 text-sm bg-[#2d2a24] text-white rounded-xl hover:bg-[#4a443c] inline-block"
            >
              ✏️ 去编辑内容
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function getFieldLabel(key: string, section: string): string {
  const labels: Record<string, Record<string, string>> = {
    experience: {
      company: '公司名称',
      position: '岗位名称',
      start_date: '开始时间',
      end_date: '结束时间',
      content: '工作内容',
      output: '主要产出',
      reflection: '业务思考',
    },
    education: {
      school: '学校名称',
      major: '专业',
      degree: '学历',
      start_date: '开始时间',
      end_date: '结束时间',
      activities: '学生工作/活动',
      achievements: '获奖情况',
    },
    travel: {
      destination: '目的地',
      travel_date: '出行时间',
      tags: '标签',
    },
    diary: {
      weather: '天气',
      mood: '心情',
      date: '日期',
    },
    thoughts: {
      excerpt: '摘要',
      read_time: '阅读时间(分钟)',
    },
  };
  return labels[section]?.[key] || key;
}
