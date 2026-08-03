import { PageContainer, PageLayout } from '@/types/page-layout';
import ContainerContentView from './PageLayoutContainer/ContainerContentView';

interface Props {
  layout: PageLayout;
}

/** 前台：按 JSON 递归渲染容器化布局（根级容器铺满父版面，子容器相对父容器的绝对定位） */
export default function PageLayoutRenderer({ layout }: Props) {
  if (!layout || !Array.isArray(layout.containers)) return null;

  const childrenOf = (parentId: string | null): PageContainer[] =>
    layout.containers
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.z - b.z);

  // 根级容器铺满整页（相对面板 absolute），子容器 absolute 相对父容器
  const renderNode = (container: PageContainer) => {
    const isRoot = !container.parentId;
    const children = childrenOf(container.id);
    const fillW = container.fill || isRoot;
    const fillH = container.fill || isRoot;

    const inlineStyle: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: fillW ? '100%' : container.w,
      height: fillH ? '100%' : container.h,
      zIndex: container.z,
      overflow: 'hidden',
    };

    return (
      <div key={container.id} style={inlineStyle} className={isRoot ? '' : ''}>
        <ContainerContentView container={container} />
        {children.length > 0 && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const roots = childrenOf(null);

  return (
    <div className="relative w-full" style={{ minHeight: 400 }}>
      {roots.map(root => renderNode(root))}
    </div>
  );
}
