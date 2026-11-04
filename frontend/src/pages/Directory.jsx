/** URL query parameters preserve filters when users open profiles and come back. */
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import {
  ChefCard,
  DataState,
  Empty,
  PageHeading,
  Icon,
} from "../components/UI";
export default function Directory() {
  const [params, setParams] = useSearchParams();
  const chefs = useApi(`/chefs?${params.toString()}`);
  function search(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setParams(
      Object.fromEntries(Object.entries(values).filter(([, value]) => value)),
    );
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow="YOUR NEXT KITCHEN PARTNER"
        title="Find your kind of cook."
      >
        A familiar cuisine, a nearby neighbourhood, a helping hand that fits.
      </PageHeading>
      <form className="filter-bar" key={params.toString()} onSubmit={search}>
        <div className="field search-field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={params.get("q") || ""}
            placeholder="Name, area or cuisine"
          />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            defaultValue={params.get("city") || ""}
            placeholder="All cities"
            list="cities"
          />
          <datalist id="cities">
            <option>Bengaluru</option>
            <option>Gurugram</option>
          </datalist>
        </div>
        <div className="field">
          <label htmlFor="diet">Food preference</label>
          <select id="diet" name="diet" defaultValue={params.get("diet") || ""}>
            <option value="">Any preference</option>
            <option>Vegetarian</option>
            <option>Both</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            name="sort"
            defaultValue={params.get("sort") || "experience"}
          >
            <option value="experience">Experience</option>
            <option value="price">Price: low to high</option>
          </select>
        </div>
        <button className="btn" type="submit">
          <Icon name="search" size={18} />
          Search
        </button>
      </form>
      <DataState query={chefs}>
        <div className="results-heading">
          <p className="muted">{chefs.data?.length || 0} cooks found</p>
          <button className="text-button" onClick={() => setParams({})}>
            Clear filters
          </button>
        </div>
        {chefs.data?.length ? (
          <div className="chef-grid">
            {chefs.data.map((chef) => (
              <ChefCard chef={chef} key={chef._id} />
            ))}
          </div>
        ) : (
          <Empty title="No cooks match just yet">
            Try another city or clear your filters.
          </Empty>
        )}
      </DataState>
      <p className="footnote">
        Profiles marked “Sample profile” are demonstration records. Prices are
        estimates per visit.
      </p>
    </div>
  );
}
