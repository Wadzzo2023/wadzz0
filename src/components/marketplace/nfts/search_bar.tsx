
export default function SearchBar() {
  return (
    <div className="join">
      <div>
        <div>
          <input
            className="input join-item input-bordered"
            placeholder="Search"
          />
        </div>
      </div>
      <select className="select join-item select-bordered">
        <option disabled selected>
          Filter
        </option>
        <option>Sci-fi</option>
        <option>Drama</option>
        <option>Action</option>
      </select>
      <div className="indicator">
        <span className="badge indicator-item badge-secondary">new</span>
        <button className="btn join-item">Search</button>
      </div>
    </div>
  );
}
