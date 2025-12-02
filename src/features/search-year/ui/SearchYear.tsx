import './SearchYear.css';

export const SearchYear = () => {
    return (
        <div className="search-box">
            <input type="text" placeholder="연도 검색" />
            <button className="search-btn">🔍</button>
        </div>
    );
};
