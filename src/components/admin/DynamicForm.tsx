'use client';

import { FieldDefinition } from '@/types/section';

interface Props {
  fieldSchema: FieldDefinition[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export default function DynamicForm({ fieldSchema, values, onChange }: Props) {
  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fieldSchema.map(field => (
        <DynamicField
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={v => handleChange(field.key, v)}
        />
      ))}
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
}) {
  const baseClass = "w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30";

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className={field.max_length && field.max_length > 100 ? 'md:col-span-2' : ''}>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.max_length && field.max_length > 100 ? 4 : 3}
            maxLength={field.max_length}
            className={`${baseClass} resize-y`}
          />
          {field.max_length && (
            <p className="text-xs text-[#b8b4ae] mt-1">{(value || '').length}/{field.max_length}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
            className={baseClass}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
          >
            <option value="">请选择</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case 'image':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label} <span className="text-xs text-[#b8b4ae]">（图片 URL 或上传）</span>
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="粘贴图片 URL"
            className={baseClass}
          />
        </div>
      );

    case 'file':
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="文件 URL"
            className={baseClass}
          />
        </div>
      );

    case 'rich_text':
      return (
        <div className="md:col-span-2">
          <label className="block text-sm text-[#2d2a24] mb-1">
            {field.label}
          </label>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="输入富文本内容（支持 Markdown）..."
            rows={6}
            className={`${baseClass} resize-y`}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2 pt-6">
          <label className="flex items-center gap-2 text-sm text-[#2d2a24] cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => onChange(e.target.checked)}
              className="rounded border-[#e8e4de]"
            />
            {field.label}
          </label>
        </div>
      );

    default:
      return (
        <div>
          <label className="block text-sm text-[#2d2a24] mb-1">{field.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
          />
        </div>
      );
  }
}
