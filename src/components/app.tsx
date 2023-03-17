import axios from "axios";
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";
import generateChart from "topster";
import { Chart, ChartItem } from "topster/dist/lib";
import {
  allCharts,
  createNewChart,
  currentChart,
  currentChartIndex,
} from "../structs/state";
const App = () => {
  return (
    <RecoilRoot>
      <AppContainer />
    </RecoilRoot>
  );
};
const AppContainer = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<
    | null
    | {
        coverImage: { extraLarge: string };
        title: { romaji: string; english: string; native: string };
        startDate: { year: number };
        id: number;
      }[]
  >(null);
  const [loading, setLoading] = useState(false);
  const chartCanvasRef = useRef<HTMLCanvasElement>();
  const currentChartObject = useRecoilValue(currentChart);
  const [chartIndex, setChartIndex] = useRecoilState(currentChartIndex);
  const [allChartObjects, setAllCharts] = useRecoilState(allCharts);
  useEffect(() => {
    (async () => {
      if (chartCanvasRef.current) {
        console.log("Generating chart");

        const stime = Date.now();
        var nc = {
          ...currentChartObject,
          items: (await Promise.all(
            currentChartObject.items.map((i) => {
              return new Promise((resolve, reject) => {
                var img = new Image();
                img.src = i.coverURL;
                img.loading = "eager";
                img.onclick = () => {
                  console.log("clicked");
                };
                console.log("generated Image: ", img);
                img.onload = () => {
                  resolve({
                    ...i,
                    coverImg: img,
                  });
                };
              });
            })
          )) as ChartItem[],
        };
        const ntime = Date.now();
        console.log(
          `took ${ntime - stime}ms to generate ${nc.items.length} item images`
        );
        generateChart(chartCanvasRef.current, nc);
      }
    })();
  }, [chartCanvasRef, currentChartObject]);

  const updateChart = (func: (c: Chart) => Chart) => {
    setAllCharts((c) => {
      return c.map((e, i) => (i == chartIndex ? func(e) : e));
    });
  };

  return (
    <div id="app">
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontWeight: "bold", fontSize: "32pt" }}>
          kawaii topster
        </div>
        <div style={{ fontWeight: "bold" }}>by abyssal</div>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ paddingLeft: "5px", paddingRight: "15px" }}>
          <div>
            <h4>change chart</h4>
            <select
              value={chartIndex}
              onChange={(e) => {
                setChartIndex(e.currentTarget.value as unknown as number);
              }}
            >
              {allChartObjects.map((c, i) => (
                <option value={i}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setAllCharts((c) => {
                  return [...c, createNewChart()];
                });
                setChartIndex(allChartObjects.length);
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                setAllCharts((c) => {
                  if (c.length === 1) return [createNewChart()];
                  return c.filter((_, i) => i !== chartIndex);
                });
                setChartIndex(0);
              }}
            >
              -
            </button>
          </div>
          <div>
            <h4>add new titles</h4>
            <div>
              {" "}
              <input
                type="search"
                onInput={(e) => setSearch(e.currentTarget.value)}
              />
              <button
                onClick={() => {
                  setLoading(true);
                  const query = `
			query ($name: String) {
				Page {
					media (search: $name, type: ANIME) {
						id
						title {
							romaji
							english
							native
						}
						startDate {
							year
						}
						coverImage {
							extraLarge
						}
					}
				}
			}
			`;

                  axios
                    .post(
                      "https://graphql.anilist.co",
                      {
                        query: query,
                        variables: {
                          name: search,
                        },
                      },
                      {
                        headers: {
                          "Content-Type": "application/json",
                          Accept: "application/json",
                        },
                      }
                    )
                    .then((d) => {
                      setLoading(false);
                      setData(d.data?.data?.Page?.media);
                    });
                }}
              >
                Search
              </button>
            </div>
            <div>{loading && <div>Loading results...</div>}</div>
            {!loading && data && (
              <div>
                <ul>
                  {data.map((result) => (
                    <li
                      onClick={() => {
                        var img = new Image();
                        img.src = result.coverImage.extraLarge;
                        console.log(img);
                        updateChart((c) => {
                          return {
                            ...c,
                            items: [
                              ...c.items,
                              {
                                title: result.title.english,
                                coverURL: result.coverImage.extraLarge,
                                coverImg: img,
                              },
                            ],
                          };
                        });
                      }}
                    >
                      {result.title.english}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <h4>current list</h4>
            <div>
              <ol>
                {currentChartObject.items.map((item, i) => (
                  <li
                    onClick={() => {
                      updateChart((c) => {
                        return {
                          ...c,
                          items: c.items.filter((_, i2) => i2 !== i),
                        };
                      });
                    }}
                  >
                    {item.title}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div>
            <h4>chart settings</h4>
            <div>
              <div class="chart-setting">
                <label>title</label>
                <input
                  type="text"
                  value={currentChartObject.title}
                  onInput={(t) =>
                    updateChart((d) => {
                      return { ...d, title: t.currentTarget.value };
                    })
                  }
                />
              </div>

              <div class="chart-setting">
                <label>size</label>
                <select
                  value={
                    currentChartObject.size.x + "x" + currentChartObject.size.y
                  }
                  onChange={(newSize) => {
                    var sz = newSize.currentTarget.value.split("x");
                    updateChart((c) => ({
                      ...c,
                      size: {
                        x: Number.parseInt(sz[0]),
                        y: Number.parseInt(sz[1]),
                      },
                    }));
                  }}
                >
                  {["3x3", "4x4", "5x5", "6x6"].map((o) => (
                    <option value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div class="chart-setting">
                <label>numbers?</label>
                <input
                  type="checkbox"
                  checked={currentChartObject.showNumbers}
                  onChange={(e) => {
                    updateChart((c) => ({
                      ...c,
                      showNumbers: e.currentTarget.checked,
                    }));
                  }}
                />
              </div>

              <div class="chart-setting">
                <label>titles?</label>
                <input
                  type="checkbox"
                  checked={currentChartObject.showTitles}
                  onChange={(e) => {
                    updateChart((c) => ({
                      ...c,
                      showTitles: e.currentTarget.checked,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <canvas ref={chartCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default App;
