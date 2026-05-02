import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, Rows3, Search, Sparkles, StretchHorizontal, X, ZoomIn, ZoomOut } from 'lucide-react';
import { historyEvents, importanceOptions, tabs, typeOptions } from './data/events.js';

function FigureMultiSelect({ selectedFigures, figureOptions, onFigureToggle }) {
  const selectRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredFigures = figureOptions.filter((figure) => figure.includes(query.trim()));
  const summary =
    selectedFigures.length === 0
      ? '全部人物'
      : selectedFigures.length <= 2
        ? selectedFigures.join('、')
        : `已选 ${selectedFigures.length} 人`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className="figure-select" ref={selectRef}>
      <button
        className="figure-select__trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>{summary}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen ? (
        <div className="figure-select__menu">
          <div className="figure-select__search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索人物"
              aria-label="搜索涉及人物"
            />
          </div>
          <div className="figure-select__options">
            {filteredFigures.length > 0 ? (
              filteredFigures.map((figure) => {
                const checked = selectedFigures.includes(figure);
                return (
                  <button
                    className={`figure-option ${checked ? 'is-selected' : ''}`}
                    type="button"
                    key={figure}
                    onClick={() => onFigureToggle(figure)}
                  >
                    <span className="figure-option__check">{checked ? <Check size={14} /> : null}</span>
                    <span>{figure}</span>
                  </button>
                );
              })
            ) : (
              <p className="figure-select__empty">没有匹配人物</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Filters({ filters, periods, figureOptions, onChange, onFigureToggle, onReset }) {
  return (
    <div className="filters" aria-label="时间线筛选">
      <div className="filter-row">
        <label>
          <span>类型</span>
          <select value={filters.type} onChange={(event) => onChange('type', event.target.value)}>
            {typeOptions.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>重要等级</span>
          <select
            value={filters.importance}
            onChange={(event) => onChange('importance', event.target.value)}
          >
            {importanceOptions.map((importance) => (
              <option value={importance} key={importance}>
                {importance}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>时期</span>
          <select value={filters.period} onChange={(event) => onChange('period', event.target.value)}>
            <option value="全部时期">全部时期</option>
            {periods.map((period) => (
              <option value={period} key={period}>
                {period}
              </option>
            ))}
          </select>
        </label>
        <label className="figure-select-field">
          <span>涉及人物</span>
          <FigureMultiSelect
            selectedFigures={filters.figures}
            figureOptions={figureOptions}
            onFigureToggle={onFigureToggle}
          />
        </label>
        <button className="button button--ghost" type="button" onClick={onReset}>
          重置
        </button>
      </div>
    </div>
  );
}

function formatAxisYear(year) {
  if (year < 0) {
    return `前${Math.abs(year)}年`;
  }
  return `${year}年`;
}

function getAxisTicks(minYear, maxYear) {
  if (minYear === maxYear) {
    return [{ year: minYear, position: 0 }];
  }

  const tickCount = 6;
  const span = maxYear - minYear;
  return Array.from({ length: tickCount }, (_, index) => {
    const year = Math.round(minYear + (span * index) / (tickCount - 1));
    return {
      year,
      position: ((year - minYear) / span) * 100
    };
  });
}

function getAxisPositionStyle(viewMode, position) {
  const axisPosition = `calc(var(--axis-edge) + (${position} / 100) * (100% - var(--axis-edge) * 2))`;
  return viewMode === 'horizontal' ? { left: axisPosition } : { top: axisPosition };
}

function getTimelineLayout(events, minYear, yearSpan, axisLength, viewMode, compactEvents) {
  const lanesBySide = { before: [], after: [] };
  const minGap = viewMode === 'horizontal' ? 250 : compactEvents ? 112 : 158;

  return events.map((event, index) => {
    const position = ((event.sortYear - minYear) / yearSpan) * 100;
    const coordinate = (position / 100) * axisLength;
    const side = index % 2 === 0 ? 'before' : 'after';
    const laneIndex = lanesBySide[side].findIndex((lastCoordinate) => coordinate - lastCoordinate >= minGap);
    const lane = laneIndex === -1 ? lanesBySide[side].length : laneIndex;
    lanesBySide[side][lane] = coordinate;

    return {
      event,
      lane,
      position,
      side
    };
  });
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

function TimelineControls({ viewMode, compactEvents, zoomLevel, onViewModeChange, onCompactEventsChange, onZoomChange }) {
  return (
    <div className="timeline-toolbar" aria-label="时间线视图">
      <div>
        <strong>等比例时间轴</strong>
        <span>横向模式可用滚轮浏览时间跨度</span>
      </div>
      <div className="timeline-toolbar__actions">
        <div className="zoom-controls" aria-label="时间轴缩放">
          <button
            className="zoom-controls__btn"
            type="button"
            onClick={() => onZoomChange(Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2)))}
            disabled={zoomLevel <= ZOOM_MIN}
            aria-label="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="zoom-controls__label">{Math.round(zoomLevel * 100)}%</span>
          <button
            className="zoom-controls__btn"
            type="button"
            onClick={() => onZoomChange(Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2)))}
            disabled={zoomLevel >= ZOOM_MAX}
            aria-label="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <label className="density-toggle">
          <input
            type="checkbox"
            checked={compactEvents}
            onChange={(event) => onCompactEventsChange(event.target.checked)}
          />
          <span>仅事件名</span>
        </label>
        <div className="view-toggle">
          <button
            className={viewMode === 'horizontal' ? 'is-active' : ''}
            type="button"
            onClick={() => onViewModeChange('horizontal')}
          >
            <StretchHorizontal size={17} />
            横向
          </button>
          <button
            className={viewMode === 'vertical' ? 'is-active' : ''}
            type="button"
            onClick={() => onViewModeChange('vertical')}
          >
            <Rows3 size={17} />
            纵向
          </button>
        </div>
      </div>
    </div>
  );
}

function Timeline({ events, selectedId, onSelect, viewMode, compactEvents, zoomLevel }) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <Search size={34} />
        <h2>没有匹配的历史节点</h2>
        <p>调整类型、重要等级或时期筛选，重新查看时间线。</p>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.sortYear - b.sortYear);
  const minYear = sortedEvents[0].sortYear;
  const maxYear = sortedEvents[sortedEvents.length - 1].sortYear;
  const yearSpan = Math.max(maxYear - minYear, 1);
  const ticks = getAxisTicks(minYear, maxYear);
  const baseAxisLength =
    viewMode === 'horizontal' ? Math.max(1280, yearSpan * 0.82) : Math.max(900, yearSpan * 0.2);
  const axisLength = baseAxisLength * zoomLevel;
  const layoutItems = getTimelineLayout(sortedEvents, minYear, yearSpan, axisLength, viewMode, compactEvents);
  const maxLane = Math.max(...layoutItems.map((item) => item.lane), 0);

  const handleWheel = (wheelEvent) => {
    if (viewMode !== 'horizontal') {
      return;
    }

    const container = wheelEvent.currentTarget;
    const delta = Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)
      ? wheelEvent.deltaX
      : wheelEvent.deltaY;
    if (delta === 0) {
      return;
    }

    wheelEvent.preventDefault();
    container.scrollLeft += delta;
  };

  return (
    <div className={`timeline-scroll timeline-scroll--${viewMode}`} onWheel={handleWheel}>
      <ol
        className={`timeline timeline--${viewMode} ${compactEvents ? 'timeline--compact' : ''}`}
        style={
          viewMode === 'horizontal'
            ? { '--axis-length': `${axisLength}px`, '--max-lane': maxLane }
            : { '--axis-height': `${axisLength}px`, '--max-lane': maxLane }
        }
      >
        {ticks.map((tick) => (
          <li
            className="timeline-tick"
            key={`${tick.year}-${tick.position}`}
            style={getAxisPositionStyle(viewMode, tick.position)}
          >
            <span>{formatAxisYear(tick.year)}</span>
          </li>
        ))}
        {layoutItems.map(({ event, lane, position, side }) => {
          return (
            <li
              className={`timeline__item timeline__item--${side}`}
              key={event.id}
              style={{ ...getAxisPositionStyle(viewMode, position), '--lane': lane }}
            >
          <button
            className={`timeline-card ${selectedId === event.id ? 'is-active' : ''}`}
            type="button"
            onClick={() => onSelect(event.id)}
            aria-pressed={selectedId === event.id}
          >
            <span className="timeline-card__dot" aria-hidden="true" />
            <span className="timeline-card__main">
              <span className="timeline-card__time">{event.time}</span>
              <strong>{event.eventName}</strong>
              {!compactEvents ? <span className="timeline-card__description">{event.description}</span> : null}
            </span>
            <span className="timeline-card__meta">
              <span className={`tag tag--${event.type}`}>{event.type}</span>
              <span className={`importance importance--${event.importance}`}>{event.importance}</span>
            </span>
          </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Comments({ event, onAddComment }) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) {
      return;
    }

    onAddComment(event.id, {
      id: `${event.id}-${Date.now()}`,
      author: author.trim() || '匿名访客',
      content: cleanContent
    });
    setAuthor('');
    setContent('');
  };

  return (
    <section className="comments">
      <h3>评论</h3>
      <div className="comment-list">
        {event.comments.length > 0 ? (
          event.comments.map((comment) => (
            <article className="comment" key={comment.id}>
              <strong>{comment.author}</strong>
              <p>{comment.content}</p>
            </article>
          ))
        ) : (
          <p className="muted">暂时还没有评论。</p>
        )}
      </div>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          value={author}
          onChange={(inputEvent) => setAuthor(inputEvent.target.value)}
          placeholder="昵称"
          aria-label="昵称"
        />
        <textarea
          value={content}
          onChange={(inputEvent) => setContent(inputEvent.target.value)}
          placeholder="写下你的观察"
          aria-label="评论内容"
          rows="3"
        />
        <button className="button" type="submit">
          发表评论
        </button>
      </form>
    </section>
  );
}

function EventDetail({ event, onAddComment }) {
  return (
    <div className="detail">
      <div className="detail__header">
        <span className="detail__time">{event.time}</span>
        <h2 id="event-detail-title">{event.eventName}</h2>
        <p>{event.description}</p>
      </div>

      <div className="detail-grid">
        <div>
          <span>类型</span>
          <strong>{event.type}</strong>
        </div>
        <div>
          <span>重要等级</span>
          <strong>{event.importance}</strong>
        </div>
        <div>
          <span>时期</span>
          <strong>{event.period}</strong>
        </div>
        <div>
          <span>地点</span>
          <strong>{event.location}</strong>
        </div>
      </div>

      <section className="detail-section">
        <h3>相关人物</h3>
        <p>{event.figures.join('、')}</p>
      </section>
      <section className="detail-section">
        <h3>历史影响</h3>
        <p>{event.impact}</p>
      </section>
      <Comments event={event} onAddComment={onAddComment} />
    </div>
  );
}

function EventModal({ event, onClose, onAddComment }) {
  if (!event) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <button className="modal__close" type="button" onClick={onClose} aria-label="关闭详情">
          <X size={20} />
        </button>
        <EventDetail event={event} onAddComment={onAddComment} />
      </section>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('china');
  const [events, setEvents] = useState(historyEvents);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('horizontal');
  const [compactEvents, setCompactEvents] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState({
    type: '全部类型',
    importance: '全部等级',
    period: '全部时期',
    figures: []
  });

  const scopedEvents = useMemo(
    () => events.filter((event) => event.scope === activeTab).sort((a, b) => a.sortYear - b.sortYear),
    [activeTab, events]
  );

  const periods = useMemo(() => [...new Set(scopedEvents.map((event) => event.period))], [scopedEvents]);

  const figureOptions = useMemo(
    () => [...new Set(scopedEvents.flatMap((event) => event.figures))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [scopedEvents]
  );

  const filteredEvents = useMemo(
    () =>
      scopedEvents.filter((event) => {
        const matchesType = filters.type === '全部类型' || event.type === filters.type;
        const matchesImportance =
          filters.importance === '全部等级' || event.importance === filters.importance;
        const matchesPeriod = filters.period === '全部时期' || event.period === filters.period;
        const matchesFigures =
          filters.figures.length === 0 || filters.figures.some((figure) => event.figures.includes(figure));
        return matchesType && matchesImportance && matchesPeriod && matchesFigures;
      }),
    [filters, scopedEvents]
  );

  const selectedEvent = events.find((event) => event.id === selectedId && event.scope === activeTab);
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  useEffect(() => {
    if (!selectedId) {
      return undefined;
    }

    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  useEffect(() => {
    document.body.style.overflow = viewMode === 'horizontal' ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedId(null);
    setFilters({ type: '全部类型', importance: '全部等级', period: '全部时期', figures: [] });
  };

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  };

  const handleFigureToggle = (figure) => {
    setFilters((currentFilters) => {
      const exists = currentFilters.figures.includes(figure);
      return {
        ...currentFilters,
        figures: exists
          ? currentFilters.figures.filter((currentFigure) => currentFigure !== figure)
          : [...currentFilters.figures, figure]
      };
    });
  };

  const handleReset = () => {
    setFilters({ type: '全部类型', importance: '全部等级', period: '全部时期', figures: [] });
  };

  const handleAddComment = (eventId, comment) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId ? { ...event, comments: [...event.comments, comment] } : event
      )
    );
  };

  return (
    <main className={`app-shell app-shell--${viewMode}`}>
      <header className="app-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={16} />
            历史节点档案
          </span>
          <h1>历史时间线</h1>
        </div>
        <p>按时代、类型和重要等级梳理中国与世界历史中的关键事件。</p>
      </header>

      <section className="control-strip" aria-label="历史时间线控制台">
        <div className="scope-control">
          <span className="control-label">历史范围</span>
          <nav className="tabs" aria-label="历史范围">
            {tabs.map((tab) => (
              <button
                className={activeTab === tab.id ? 'is-active' : ''}
                type="button"
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <Filters
          filters={filters}
          periods={periods}
          figureOptions={figureOptions}
          onChange={handleFilterChange}
          onFigureToggle={handleFigureToggle}
          onReset={handleReset}
        />
        <div className="stat">
          <BookOpen size={20} />
          <strong>{filteredEvents.length}</strong>
          <span>{activeLabel}节点</span>
        </div>
      </section>

      <section className="workspace">
        <div className="timeline-panel">
          <TimelineControls
            viewMode={viewMode}
            compactEvents={compactEvents}
            zoomLevel={zoomLevel}
            onViewModeChange={setViewMode}
            onCompactEventsChange={setCompactEvents}
            onZoomChange={setZoomLevel}
          />
          <Timeline
            events={filteredEvents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            viewMode={viewMode}
            compactEvents={compactEvents}
            zoomLevel={zoomLevel}
          />
        </div>
      </section>
      <EventModal event={selectedEvent} onClose={() => setSelectedId(null)} onAddComment={handleAddComment} />
    </main>
  );
}

export default App;
