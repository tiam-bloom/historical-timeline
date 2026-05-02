import chinaEvents from './china.json';
import worldEvents from './world.json';

export const historyEvents = [
  ...chinaEvents.map((event) => ({ ...event, scope: 'china' })),
  ...worldEvents.map((event) => ({ ...event, scope: 'world' }))
];

export const tabs = [
  { id: 'china', label: '中国历史' },
  { id: 'world', label: '世界历史' }
];

export const typeOptions = ['全部类型', '政治', '军事', '经济', '文化', '外交', '科技'];
export const importanceOptions = ['全部等级', '极高', '高', '中', '低'];
