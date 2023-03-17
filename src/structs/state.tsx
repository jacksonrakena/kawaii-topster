import { atom, selector } from "recoil";
import { BackgroundTypes, Chart } from "topster/dist/lib";

export const localStorageEffect =
  (key) =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(newValue));
    });
  };

export const createNewChart = () => {
  return {
    title: `Untitled (${new Date().toLocaleDateString()} ${(
      Math.random() * 100
    ).toFixed(0)})`,
    size: { x: 3, y: 3 },
    items: [],
    background: {
      type: BackgroundTypes.Color,
      value: "#000000",
      img: null,
    },
    showTitles: true,
    gap: 0,
    showNumbers: false,
  };
};
export const allCharts = atom({
  key: "AllCharts",
  default: [createNewChart(), createNewChart(), createNewChart()] as Chart[],
  effects: [localStorageEffect("all_charts")],
});

export const currentChartIndex = atom({
  key: "CurrentChartIndex",
  default: 0,
  effects: [localStorageEffect("current_chart_index")],
});

export const currentChart = selector({
  key: "CurrentChartObject",
  get: ({ get }) => {
    const index = get(currentChartIndex);
    const charts = get(allCharts);
    return charts[index];
  },
});
