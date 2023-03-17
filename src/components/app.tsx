import axios from "axios";
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import generateChart from "topster";
import { BackgroundTypes, Chart } from "topster/dist/lib";

const App = () => {
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
  const [chartSettings, setChartSettings] = useState<Chart>({
    title: "test",
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
  });
  useEffect(() => {
    if (chartCanvasRef.current) {
      console.log("Generating chart");
      generateChart(chartCanvasRef.current, chartSettings);
    }
  }, [chartCanvasRef, , chartSettings]);
  return (
    <div id="app">
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontWeight: "bold", fontSize: "32pt" }}>
          kawaii topster
        </div>
        <div style={{ fontWeight: "bold" }}>by abyssal</div>
      </div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
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
          <div>{loading && <div>Loading results...</div>}</div>
          <div>
            {!loading && data && (
              <div>
                <ul>
                  {data.map((result) => (
                    <li
                      onClick={() => {
                        var img = new Image();
                        img.src = result.coverImage.extraLarge;
                        console.log(img);
                        setChartSettings((c) => {
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
                {chartSettings.items.map((item, i) => (
                  <li
                    onClick={() => {
                      setChartSettings((c) => {
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
              <label>title</label>
              <input
                type="text"
                value={chartSettings.title}
                onInput={(t) =>
                  setChartSettings((d) => {
                    return { ...d, title: t.currentTarget.value };
                  })
                }
              />
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
