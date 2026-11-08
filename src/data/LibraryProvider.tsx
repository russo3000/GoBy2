import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  listPlaceLists,
  listRecommendations,
  PlaceList,
  Recommendation,
} from "./recommendations";

const Context = createContext<{
  places: Recommendation[];
  lists: PlaceList[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}>({
  places: [],
  lists: [],
  loading: true,
  error: "",
  refresh: async () => {},
});

export function LibraryProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [data, setData] = useState<{
    places: Recommendation[];
    lists: PlaceList[];
  }>({ places: [], lists: [] });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    try {
      const [places, lists] = await Promise.all([
        listRecommendations(db),
        listPlaceLists(db),
      ]);
      if (request === revision.current) {
        setData({ places, lists });
        setError("");
      }
    } catch (e) {
      if (request === revision.current)
        setError("Could not load your places. Please try again.");
      throw e;
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, [db]);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  return (
    <Context.Provider value={{ ...data, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useLibrary = () => useContext(Context);
