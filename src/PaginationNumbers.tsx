const PaginationNumbers = ({ pagination, handlePagination }: { pagination: { total_pages: number; current_page: number; }, handlePagination: (event: React.MouseEvent<HTMLButtonElement>, page: number) => void }) => {
    const { total_pages, current_page } = pagination;

    // Generar un array con los números de página
    const pageNumbers = Array.from({ length: total_pages }, (_, i) => i + 1);

    return (
        <div className="flex justify-center space-x-2 mt-4">
            {pageNumbers.map((page) => (
                <button
                    key={page}
                    onClick={(event) => handlePagination(event, page)}
                    className={`px-3 py-1 rounded-md ${
                        page === current_page
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

export default PaginationNumbers;