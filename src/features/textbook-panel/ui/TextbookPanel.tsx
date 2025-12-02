import './TextbookPanel.css';

interface TextbookPanelProps {
    currentPage: number;
    viewMode: 'single' | 'double';
}

export const TextbookPanel = ({ currentPage, viewMode }: TextbookPanelProps) => {
    const getImageUrl = (page: number) => {
        return `/historybook/${page}.png`;
    };

    const totalPages = 220;

    return (
        <div className="textbook-panel">
            <div className={`textbook-content ${viewMode}`}>
                {viewMode === 'single' ? (
                    <div className="page-container single">
                        <img
                            src={getImageUrl(currentPage)}
                            alt={`Page ${currentPage}`}
                            className="textbook-page"
                        />
                    </div>
                ) : (
                    <div className="page-container double">
                        <div className="page-wrapper">
                            <img
                                src={getImageUrl(currentPage)}
                                alt={`Page ${currentPage}`}
                                className="textbook-page"
                            />
                        </div>
                        <div className="page-wrapper">
                            {currentPage + 1 < totalPages && (
                                <img
                                    src={getImageUrl(currentPage + 1)}
                                    alt={`Page ${currentPage + 1}`}
                                    className="textbook-page"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
