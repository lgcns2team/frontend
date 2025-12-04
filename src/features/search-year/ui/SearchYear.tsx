import './SearchYear.css';
import { getEraForYear } from '../../../shared/config/era-theme';

interface SearchYearProps {
    currentYear: number;
}

export const SearchYear = ({ currentYear }: SearchYearProps) => {
    //랜더링 안하는 코드 필요하면 지울것
    const disabled = true;
    if (disabled) return null;
    //랜더링 안하는 코드 필요하면 지울것




    const era = getEraForYear(currentYear);
    const bgImage = `/assets/images/${era.id}/timecontrol.png`;

    return (
        <div
            className="search-box"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            <input type="text" placeholder="연도 검색" />
            <button className="search-btn">🔍</button>
        </div>
    );
};
